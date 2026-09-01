import { db } from '../../../data/db';
import { apiError } from '../../../data/errors';
import { paginate } from '../../../data/paginate';
import { ensureReady, money, nowIso, qty, requireUser } from '../../../data/runtime';

function withRelations(product, categories, units) {
  const cost = money(product.cost_price);
  const sell = money(product.selling_price);
  const stock = qty(product.stock_quantity);
  const min = qty(product.min_stock_alert);
  const profit = money(sell - cost);
  const percent = cost > 0 ? Number(((profit / cost) * 100).toFixed(2)) : 0;
  return {
    ...product,
    cost_price: cost.toFixed(2),
    selling_price: sell.toFixed(2),
    tax_percent: money(product.tax_percent).toFixed(2),
    stock_quantity: stock.toFixed(3),
    min_stock_alert: min.toFixed(3),
    profit_margin: profit.toFixed(2),
    profit_percentage: percent,
    is_low_stock: stock > 0 && stock <= min,
    is_out_of_stock: stock <= 0,
    category: categories.find((item) => item.id === product.category_id) || null,
    unit: units.find((item) => item.id === product.unit_id) || null,
  };
}

export const productsApi = {
  async getProducts(filters = {}) {
    await ensureReady();
    const [products, categories, units] = await Promise.all([
      db.getAll('products'),
      db.getAll('categories'),
      db.getAll('units'),
    ]);
    let rows = products.map((product) => withRelations(product, categories, units));
    if (filters.search) {
      const term = String(filters.search).toLowerCase();
      rows = rows.filter((product) =>
        [product.name, product.barcode, product.sku].some((value) => String(value || '').toLowerCase().includes(term))
      );
    }
    if (filters.category_id && filters.category_id !== 'all') {
      rows = rows.filter((product) => String(product.category_id) === String(filters.category_id));
    }
    if (filters.stock_status === 'low') rows = rows.filter((product) => product.is_low_stock);
    if (filters.stock_status === 'out') rows = rows.filter((product) => product.is_out_of_stock);
    if (filters.stock_status === 'in_stock') rows = rows.filter((product) => Number(product.stock_quantity) > 0);
    if (filters.is_active !== undefined) {
      rows = rows.filter((product) => Boolean(product.is_active) === Boolean(filters.is_active));
    }
    rows.sort((a, b) => b.id - a.id);
    return paginate(rows, filters.page, filters.per_page || 15);
  },

  async getProduct(id) {
    await ensureReady();
    const product = await db.get('products', id);
    if (!product) apiError('المنتج غير موجود.');
    const [categories, units] = await Promise.all([db.getAll('categories'), db.getAll('units')]);
    return withRelations(product, categories, units);
  },

  async findByBarcode(barcode) {
    await ensureReady();
    const products = await db.getAll('products');
    const product = products.find((item) => item.barcode === barcode && item.is_active);
    if (!product) apiError('لم يتم العثور على أي منتج بهذا الباركود.');
    const [categories, units] = await Promise.all([db.getAll('categories'), db.getAll('units')]);
    return withRelations(product, categories, units);
  },

  async createProduct(data) {
    await ensureReady();
    const user = requireUser();
    const now = nowIso();
    const initialStock = qty(data.stock_quantity);
    const id = await db.add('products', {
      name: data.name,
      barcode: data.barcode || '',
      sku: data.sku || '',
      category_id: data.category_id ? Number(data.category_id) : null,
      unit_id: data.unit_id ? Number(data.unit_id) : null,
      cost_price: money(data.cost_price),
      selling_price: money(data.selling_price),
      tax_percent: money(data.tax_percent ?? 15),
      stock_quantity: initialStock,
      min_stock_alert: qty(data.min_stock_alert ?? 5),
      description: data.description || '',
      is_active: data.is_active !== false,
      created_at: now,
      updated_at: now,
    });
    if (initialStock > 0) {
      await db.add('stockMovements', {
        product_id: id,
        user_id: user.id,
        user_name: user.name,
        type: 'initial',
        quantity: initialStock,
        unit_cost: money(data.cost_price),
        balance_before: 0,
        balance_after: initialStock,
        notes: 'رصيد افتتاحي عند إضافة الصنف',
        created_at: now,
      });
    }
    return this.getProduct(id);
  },

  async updateProduct(id, data) {
    await ensureReady();
    const product = await db.get('products', id);
    if (!product) apiError('المنتج غير موجود.');
    const next = {
      ...product,
      ...data,
      id: product.id,
      stock_quantity: product.stock_quantity,
      category_id: data.category_id ? Number(data.category_id) : product.category_id,
      unit_id: data.unit_id ? Number(data.unit_id) : product.unit_id,
      cost_price: money(data.cost_price ?? product.cost_price),
      selling_price: money(data.selling_price ?? product.selling_price),
      tax_percent: money(data.tax_percent ?? product.tax_percent),
      min_stock_alert: qty(data.min_stock_alert ?? product.min_stock_alert),
      updated_at: nowIso(),
    };
    await db.put('products', next);
    return this.getProduct(id);
  },

  async deleteProduct(id) {
    await ensureReady();
    const product = await db.get('products', id);
    if (!product) apiError('المنتج غير موجود.');
    const [sales, purchases] = await Promise.all([db.getAll('sales'), db.getAll('purchases')]);
    const used =
      sales.some((sale) => (sale.items || []).some((item) => item.product_id === id)) ||
      purchases.some((purchase) => (purchase.items || []).some((item) => item.product_id === id));
    if (used) {
      await db.put('products', { ...product, is_active: false, updated_at: nowIso() });
      return { success: true, message: 'تم تعطيل المنتج لربطه بفواتير سابقة بدلاً من حذفه نهائياً.' };
    }
    await db.delete('products', id);
    return { success: true, message: 'تم حذف المنتج بنجاح.' };
  },

  async adjustStock(id, data) {
    await ensureReady();
    const product = await db.get('products', id);
    if (!product) apiError('المنتج غير موجود.');
    const change = qty(data.quantity);
    if (change === 0) apiError('كمية التعديل لا يمكن أن تكون صفراً.');
    const before = qty(product.stock_quantity);
    const after = qty(before + change);
    if (after < 0 && data.type === 'damage') apiError('الكمية التالفة تتجاوز رصيد المخزون المتوفر.');
    const user = requireUser();
    await db.put('products', { ...product, stock_quantity: after, updated_at: nowIso() });
    const movementId = await db.add('stockMovements', {
      product_id: id,
      user_id: user.id,
      user_name: user.name,
      type: data.type,
      quantity: change,
      unit_cost: money(product.cost_price),
      balance_before: before,
      balance_after: after,
      notes: data.notes || '',
      created_at: nowIso(),
    });
    const movement = await db.get('stockMovements', movementId);
    return { movement: await decorateMovement(movement), product: await this.getProduct(id) };
  },

  async getMetrics() {
    await ensureReady();
    const products = await db.getAll('products');
    const totalCost = products.reduce((sum, product) => sum + money(product.cost_price) * qty(product.stock_quantity), 0);
    const totalRetail = products.reduce((sum, product) => sum + money(product.selling_price) * qty(product.stock_quantity), 0);
    return {
      total_products: products.length,
      low_stock_count: products.filter((product) => qty(product.stock_quantity) > 0 && qty(product.stock_quantity) <= qty(product.min_stock_alert)).length,
      out_of_stock_count: products.filter((product) => qty(product.stock_quantity) <= 0).length,
      total_quantity: products.reduce((sum, product) => sum + qty(product.stock_quantity), 0),
      total_cost_value: money(totalCost),
      total_retail_value: money(totalRetail),
      potential_profit: money(totalRetail - totalCost),
    };
  },

  async getCategories(activeOnly = false) {
    await ensureReady();
    const [categories, products] = await Promise.all([db.getAll('categories'), db.getAll('products')]);
    return categories
      .filter((category) => (activeOnly ? category.is_active : true))
      .map((category) => ({
        ...category,
        products_count: products.filter((product) => product.category_id === category.id).length,
      }));
  },

  async createCategory(data) {
    await ensureReady();
    const id = await db.add('categories', { name: data.name, description: data.description || '', is_active: data.is_active !== false, created_at: nowIso() });
    return db.get('categories', id);
  },

  async updateCategory(id, data) {
    await ensureReady();
    const category = await db.get('categories', id);
    if (!category) apiError('التصنيف غير موجود.');
    await db.put('categories', { ...category, ...data, id });
    return db.get('categories', id);
  },

  async deleteCategory(id) {
    await ensureReady();
    const products = await db.getAll('products');
    if (products.some((product) => product.category_id === id)) {
      apiError('لا يمكن حذف هذا التصنيف لوجود منتجات مرتبطة به.');
    }
    await db.delete('categories', id);
    return { success: true, message: 'تم حذف التصنيف بنجاح.' };
  },

  async getUnits() {
    await ensureReady();
    return db.getAll('units');
  },

  async createUnit(data) {
    await ensureReady();
    const id = await db.add('units', {
      name: data.name,
      short_name: data.short_name || data.name,
      allow_decimal: Boolean(data.allow_decimal),
      created_at: nowIso(),
    });
    return db.get('units', id);
  },

  async updateUnit(id, data) {
    await ensureReady();
    const unit = await db.get('units', id);
    if (!unit) apiError('وحدة القياس غير موجودة.');
    await db.put('units', { ...unit, ...data, id });
    return db.get('units', id);
  },

  async deleteUnit(id) {
    await ensureReady();
    const products = await db.getAll('products');
    if (products.some((product) => product.unit_id === id)) {
      apiError('لا يمكن حذف هذه الوحدة لوجود منتجات مرتبطة بها.');
    }
    await db.delete('units', id);
    return { success: true, message: 'تم حذف وحدة القياس بنجاح.' };
  },

  async getStockMovements(params = {}) {
    await ensureReady();
    const [movements, products] = await Promise.all([db.getAll('stockMovements'), db.getAll('products')]);
    let rows = movements.map((movement) => decorateMovementSync(movement, products));
    if (params.product_id) rows = rows.filter((row) => row.product_id === Number(params.product_id));
    if (params.type) rows = rows.filter((row) => row.type === params.type);
    rows.sort((a, b) => b.id - a.id);
    return paginate(rows, params.page, params.per_page || 20);
  },
};

function decorateMovementSync(movement, products) {
  const product = products.find((item) => item.id === movement.product_id);
  return {
    ...movement,
    quantity: qty(movement.quantity).toFixed(3),
    unit_cost: money(movement.unit_cost).toFixed(2),
    balance_before: qty(movement.balance_before).toFixed(3),
    balance_after: qty(movement.balance_after).toFixed(3),
    product_name: product?.name,
    product_barcode: product?.barcode,
  };
}

async function decorateMovement(movement) {
  const products = await db.getAll('products');
  return decorateMovementSync(movement, products);
}
