import { db } from './db';

const DEFAULT_SETTINGS = {
  id: 1,
  store_name: 'الأصيل للمنظفات',
  company_name: 'مؤسسة الأصيل للمنظفات والمستلزمات المنزلية',
  phone: '0551122334',
  email: 'info@alaseel-cleaning.com',
  tax_number: 'TEST-VAT-300998877600003',
  commercial_register: 'TEST-CR-1010998877',
  address: 'شارع القدس الرئيسي',
  currency: 'ILS',
  currency_symbol: '₪',
  default_tax_percent: '15.00',
  receipt_footer: 'شكراً لزيارتكم محل الأصيل للمنظفات',
  enable_sound: 'true',
  low_stock_threshold: '5',
};

export async function seedIfEmpty() {
  const meta = await db.getAll('meta');
  if (meta.some((row) => row.key === 'seeded')) {
    return;
  }

  const now = new Date().toISOString();

  await db.put('users', {
    id: 1,
    name: 'مالك المحل',
    email: 'owner@storepos.local',
    password: 'Admin@123456',
    role: 'admin',
    status: 'active',
  });

  await db.put('settings', DEFAULT_SETTINGS);

  await db.put('categories', { id: 1, name: 'منظفات الغسيل', is_active: true, created_at: now });
  await db.put('categories', { id: 2, name: 'منظفات الأواني', is_active: true, created_at: now });
  await db.put('categories', { id: 3, name: 'مطهرات', is_active: true, created_at: now });

  await db.put('units', { id: 1, name: 'حبة', short_name: 'حبة', allow_decimal: false, created_at: now });
  await db.put('units', { id: 2, name: 'لتر', short_name: 'لتر', allow_decimal: true, created_at: now });
  await db.put('units', { id: 3, name: 'كيلوغرام', short_name: 'كغ', allow_decimal: true, created_at: now });

  const products = [
    { id: 1, name: 'مسحوق غسيل 3 كغ', barcode: '6281001001', category_id: 1, unit_id: 1, cost_price: 18, selling_price: 28, tax_percent: 15, stock_quantity: 40, min_stock_alert: 5 },
    { id: 2, name: 'سائل جلي 1 لتر', barcode: '6281001002', category_id: 2, unit_id: 2, cost_price: 6, selling_price: 11, tax_percent: 15, stock_quantity: 60, min_stock_alert: 8 },
    { id: 3, name: 'مطهر أرضيات 2 لتر', barcode: '6281001003', category_id: 3, unit_id: 2, cost_price: 9, selling_price: 16, tax_percent: 15, stock_quantity: 35, min_stock_alert: 5 },
    { id: 4, name: 'كلور 4 لتر', barcode: '6281001004', category_id: 3, unit_id: 2, cost_price: 8, selling_price: 14, tax_percent: 15, stock_quantity: 25, min_stock_alert: 4 },
  ];

  for (const product of products) {
    await db.put('products', { ...product, sku: '', description: '', is_active: true, created_at: now, updated_at: now });
    await db.add('stockMovements', {
      product_id: product.id,
      type: 'initial',
      quantity: product.stock_quantity,
      unit_cost: product.cost_price,
      balance_before: 0,
      balance_after: product.stock_quantity,
      notes: 'رصيد افتتاحي',
      created_at: now,
    });
  }

  await db.put('customers', {
    id: 1,
    name: 'عميل نقدي عام',
    phone: '',
    email: '',
    credit_limit: 0,
    current_balance: 0,
    is_active: true,
    created_at: now,
  });

  await db.put('customers', {
    id: 2,
    name: 'مؤسسة النور',
    phone: '0599000001',
    email: '',
    credit_limit: 2000,
    current_balance: 0,
    is_active: true,
    created_at: now,
  });

  await db.put('suppliers', {
    id: 1,
    name: 'شركة التوريدات المتحدة',
    company_name: 'التوريدات المتحدة',
    phone: '0598000001',
    current_balance: 0,
    is_active: true,
    created_at: now,
  });

  await db.put('expenseCategories', { id: 1, name: 'نثريات وضيافة', is_active: true });
  await db.put('expenseCategories', { id: 2, name: 'نقل وتوصيل', is_active: true });
  await db.put('expenseCategories', { id: 3, name: 'إيجار ومرافق', is_active: true });

  await db.put('meta', { id: 1, key: 'seeded', value: true, created_at: now });
}

export function defaultSettings() {
  return { ...DEFAULT_SETTINGS };
}
