import { db } from '../../../data/db';
import { apiError } from '../../../data/errors';
import { paginate } from '../../../data/paginate';
import { ensureReady, inDateRange, money, nextSequence, nowIso, qty, requireUser } from '../../../data/runtime';

function formatPurchase(purchase, suppliers) {
  const supplier = suppliers.find((s) => s.id === purchase.supplier_id) || null;
  return {
    ...purchase,
    subtotal: money(purchase.subtotal).toFixed(2),
    tax_amount: money(purchase.tax_amount).toFixed(2),
    discount_amount: money(purchase.discount_amount).toFixed(2),
    grand_total: money(purchase.grand_total).toFixed(2),
    paid_amount: money(purchase.paid_amount).toFixed(2),
    due_amount: money(purchase.due_amount).toFixed(2),
    supplier_name: supplier?.name,
    supplier,
    items: (purchase.items || []).map((item) => ({
      ...item,
      unit_cost: money(item.unit_cost).toFixed(2),
      unit_price: money(item.unit_price).toFixed(2),
      quantity: qty(item.quantity).toFixed(3),
      tax_percent: money(item.tax_percent).toFixed(2),
      tax_amount: money(item.tax_amount).toFixed(2),
      subtotal: money(item.subtotal).toFixed(2),
    })),
    payments: (purchase.payments || []).map((payment) => ({
      ...payment,
      amount: money(payment.amount).toFixed(2),
    })),
  };
}

export const purchasesApi = {
  async getPurchases(params = {}) {
    await ensureReady();
    const suppliers = await db.getAll('suppliers');
    let rows = (await db.getAll('purchases')).map((p) => formatPurchase(p, suppliers));

    if (params.search) {
      const term = String(params.search).toLowerCase();
      rows = rows.filter((p) =>
        [p.invoice_number, p.supplier_name, p.supplier?.company_name].some((v) =>
          String(v || '').toLowerCase().includes(term)
        )
      );
    }
    if (params.payment_status) rows = rows.filter((p) => p.payment_status === params.payment_status);
    if (params.purchase_status) rows = rows.filter((p) => p.purchase_status === params.purchase_status);
    if (params.date_from || params.date_to) {
      rows = rows.filter((p) => inDateRange(p.created_at, params.date_from, params.date_to));
    }
    rows.sort((a, b) => b.id - a.id);
    return paginate(rows, params.page, params.per_page || 15);
  },

  async getPurchase(id) {
    await ensureReady();
    const purchase = await db.get('purchases', id);
    if (!purchase) apiError('فاتورة المشتريات غير موجودة.');
    const suppliers = await db.getAll('suppliers');
    return formatPurchase(purchase, suppliers);
  },

  async createPurchase(payload) {
    await ensureReady();
    const items = payload.items || [];
    if (!items.length) apiError('يجب إضافة صنف واحد على الأقل.');

    const user = requireUser();
    const supplier = payload.supplier_id ? await db.get('suppliers', payload.supplier_id) : null;
    if (!supplier) apiError('يجب تحديد مورد صالح.');

    let subtotal = 0;
    let taxTotal = 0;
    const prepared = [];

    for (const item of items) {
      const product = await db.get('products', item.product_id);
      if (!product) apiError(`المنتج (${item.product_id}) غير موجود.`);
      const quantity = qty(item.quantity);
      if (quantity <= 0) apiError('الكمية يجب أن تكون أكبر من الصفر.');
      const unitCost = money(item.unit_price || item.unit_cost || product.cost_price);
      const itemDiscount = money(item.discount_amount || 0);
      const taxPercent = money(item.tax_percent ?? 15);
      const lineNet = money(unitCost * quantity - itemDiscount);
      const itemTax = money(lineNet * (taxPercent / 100));
      subtotal += lineNet;
      taxTotal += itemTax;
      prepared.push({
        product,
        product_id: product.id,
        product_name: product.name,
        unit_cost: unitCost,
        quantity,
        tax_percent: taxPercent,
        tax_amount: itemTax,
        discount_amount: itemDiscount,
        subtotal: money(lineNet + itemTax),
      });
    }

    const overallDiscount = money(payload.discount_amount || 0);
    let grandTotal = money(subtotal + taxTotal - overallDiscount);
    if (grandTotal < 0) grandTotal = 0;

    const payments = payload.payments || [];
    let paidAmount = 0;
    payments.forEach((payment) => { paidAmount += money(payment.amount); });
    paidAmount = money(paidAmount);
    let dueAmount = money(grandTotal - paidAmount);
    if (dueAmount < 0) { paidAmount = grandTotal; dueAmount = 0; }

    let paymentStatus = 'due';
    if (dueAmount <= 0) paymentStatus = 'paid';
    else if (paidAmount > 0) paymentStatus = 'partial';

    const invoiceNumber = await nextSequence('PUR', 'purchases', 'invoice_number');
    const createdAt = nowIso();
    const purchaseItems = [];

    // Increase stock for each item
    for (const prep of prepared) {
      const before = qty(prep.product.stock_quantity);
      const after = qty(before + prep.quantity);
      await db.put('products', { ...prep.product, stock_quantity: after, updated_at: createdAt });
      purchaseItems.push({ product_id: prep.product_id, product_name: prep.product_name, unit_cost: prep.unit_cost, quantity: prep.quantity, tax_percent: prep.tax_percent, tax_amount: prep.tax_amount, discount_amount: prep.discount_amount, subtotal: prep.subtotal });
      await db.add('stockMovements', {
        product_id: prep.product_id,
        user_id: user.id,
        user_name: user.name,
        type: 'purchase',
        quantity: prep.quantity,
        unit_cost: prep.unit_cost,
        balance_before: before,
        balance_after: after,
        notes: `فاتورة مشتريات ${invoiceNumber}`,
        created_at: createdAt,
      });
    }

    if (dueAmount > 0) {
      const before = money(supplier.current_balance);
      const after = money(before + dueAmount);
      await db.put('suppliers', { ...supplier, current_balance: after });
      await db.add('supplierTransactions', {
        supplier_id: supplier.id,
        user_id: user.id,
        type: 'purchase_credit',
        amount: dueAmount,
        balance_before: before,
        balance_after: after,
        notes: `متبقي فاتورة مشتريات ${invoiceNumber}`,
        created_at: createdAt,
      });
    }

    const purchaseId = await db.add('purchases', {
      invoice_number: invoiceNumber,
      user_id: user.id,
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      subtotal: money(subtotal),
      tax_amount: money(taxTotal),
      discount_amount: money(overallDiscount),
      grand_total: grandTotal,
      paid_amount: paidAmount,
      due_amount: dueAmount,
      payment_status: paymentStatus,
      purchase_status: 'completed',
      notes: payload.notes || '',
      items: purchaseItems,
      payments: payments.map((p) => ({ payment_method: p.payment_method, amount: money(p.amount), reference_number: p.reference_number || null, created_at: createdAt })),
      created_at: createdAt,
    });

    return formatPurchase(await db.get('purchases', purchaseId), [supplier]);
  },

  async voidPurchase(id, reason) {
    await ensureReady();
    const purchase = await db.get('purchases', id);
    if (!purchase) apiError('فاتورة المشتريات غير موجودة.');
    if (purchase.purchase_status === 'void') apiError('هذه الفاتورة ملغاة مسبقاً.');

    const user = requireUser();
    const createdAt = nowIso();

    // Reverse stock
    for (const item of purchase.items || []) {
      const product = await db.get('products', item.product_id);
      if (!product) continue;
      const before = qty(product.stock_quantity);
      const after = qty(before - qty(item.quantity));
      await db.put('products', { ...product, stock_quantity: Math.max(0, after), updated_at: createdAt });
      await db.add('stockMovements', {
        product_id: product.id,
        user_id: user.id,
        user_name: user.name,
        type: 'purchase_return',
        quantity: -qty(item.quantity),
        unit_cost: money(item.unit_cost),
        balance_before: before,
        balance_after: Math.max(0, after),
        notes: `إلغاء فاتورة مشتريات ${purchase.invoice_number}: ${reason}`,
        created_at: createdAt,
      });
    }

    // Reverse supplier balance
    if (money(purchase.due_amount) > 0 && purchase.supplier_id) {
      const supplier = await db.get('suppliers', purchase.supplier_id);
      if (supplier) {
        const before = money(supplier.current_balance);
        const after = money(before - money(purchase.due_amount));
        await db.put('suppliers', { ...supplier, current_balance: Math.max(0, after) });
      }
    }

    const next = {
      ...purchase,
      purchase_status: 'void',
      notes: `${purchase.notes || ''} | تم الإلغاء: ${reason} بواسطة ${user.name}`.trim(),
    };
    await db.put('purchases', next);
    const suppliers = await db.getAll('suppliers');
    return formatPurchase(next, suppliers);
  },
};
