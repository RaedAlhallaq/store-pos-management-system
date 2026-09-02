import { db } from './db';

const DEFAULT_SETTINGS = {
  id: 1,
  store_name: 'الأصيل للمنظفات',
  company_name: 'مؤسسة الأصيل للمنظفات والمستلزمات المنزلية',
  phone: '0551122334',
  email: 'info@alaseel-cleaning.com',
  address: 'شارع القدس الرئيسي',
  currency: 'ILS',
  currency_symbol: '₪',
  receipt_footer: 'شكراً لزيارتكم محل الأصيل للمنظفات',
  enable_sound: 'true',
  low_stock_threshold: '5',
};

export async function seedIfEmpty() {
  const meta = await db.getAll('meta');
  if (meta.some((row) => row.key === 'seeded')) {
    return;
  }

  const now = '2026-08-28T12:00:00.000Z';
  const day = '2026-08-28';

  // ─── Users ────────────────────────────────────────────────────────────────
  await db.put('users', {
    id: 1,
    name: 'مالك المحل',
    email: 'owner@storepos.local',
    password: 'Admin@123456',
    role: 'admin',
    status: 'active',
    created_at: now,
  });

  // ─── Settings ─────────────────────────────────────────────────────────────
  await db.put('settings', { ...DEFAULT_SETTINGS, created_at: now, updated_at: now });

  // ─── Categories ───────────────────────────────────────────────────────────
  await db.put('categories', { id: 1, name: 'منظفات الغسيل', is_active: true, created_at: now });
  await db.put('categories', { id: 2, name: 'منظفات الأواني', is_active: true, created_at: now });
  await db.put('categories', { id: 3, name: 'مطهرات', is_active: true, created_at: now });
  await db.put('categories', { id: 4, name: 'معطّرات', is_active: true, created_at: now });

  // ─── Products (no barcode, no tax, manual unit string) ────────────────────
  const products = [
    { id: 1, name: 'مسحوق غسيل 3 كغ',   category_id: 1, unit: 'حبة', cost_price: 18, selling_price: 28, stock_quantity: 39, min_stock_alert: 5 },
    { id: 2, name: 'سائل جلي 1 لتر',     category_id: 2, unit: 'لتر', cost_price: 6,  selling_price: 11, stock_quantity: 59, min_stock_alert: 8 },
    { id: 3, name: 'مطهر أرضيات 2 لتر',  category_id: 3, unit: 'لتر', cost_price: 9,  selling_price: 16, stock_quantity: 48, min_stock_alert: 5 },
    { id: 4, name: 'كلور 4 لتر',         category_id: 3, unit: 'لتر', cost_price: 8,  selling_price: 14, stock_quantity: 35, min_stock_alert: 4 },
    { id: 5, name: 'معطر غرفة 500 مل',   category_id: 4, unit: 'حبة', cost_price: 12, selling_price: 22, stock_quantity: 28, min_stock_alert: 5 },
  ];

  for (const p of products) {
    await db.put('products', {
      ...p,
      description: '',
      is_active: true,
      created_at: now,
      updated_at: now,
    });
    await db.add('stockMovements', {
      product_id: p.id,
      type: 'initial',
      quantity: p.stock_quantity,
      unit_cost: p.cost_price,
      balance_before: 0,
      balance_after: p.stock_quantity,
      notes: 'رصيد افتتاحي',
      created_at: '2026-08-28T08:00:00.000Z',
    });
  }

  // ─── Customers (name + phone only, no credit_limit) ──────────────────────
  await db.put('customers', {
    id: 1,
    name: 'عميل نقدي عام',
    phone: '',
    current_balance: 0,
    is_active: true,
    created_at: now,
  });

  await db.put('customers', {
    id: 2,
    name: 'مؤسسة النور',
    phone: '0599000001',
    current_balance: 62,
    is_active: true,
    created_at: now,
  });

  // ─── Suppliers (no email, no tax_number) ─────────────────────────────────
  await db.put('suppliers', {
    id: 1,
    name: 'شركة التوريدات المتحدة',
    company_name: 'التوريدات المتحدة',
    phone: '0598000001',
    address: 'منطقة الصناعة',
    current_balance: 242,
    is_active: true,
    created_at: now,
  });

  await db.put('suppliers', {
    id: 2,
    name: 'مؤسسة النظافة الحديثة',
    company_name: 'النظافة الحديثة',
    phone: '0597000002',
    address: 'شارع الصناعة',
    current_balance: 0,
    is_active: true,
    created_at: now,
  });

  // ─── Expense Categories ───────────────────────────────────────────────────
  await db.put('expenseCategories', { id: 1, name: 'نثريات وضيافة', is_active: true, created_at: now });
  await db.put('expenseCategories', { id: 2, name: 'نقل وتوصيل', is_active: true, created_at: now });
  await db.put('expenseCategories', { id: 3, name: 'إيجار ومرافق', is_active: true, created_at: now });
  await db.put('expenseCategories', { id: 4, name: 'رواتب وأجور', is_active: true, created_at: now });

  // ─── Purchases (tax-free) ─────────────────────────────────────────────────
  // Purchase 1 — Supplier 1 — partial payment (1000 of 1080 → due 80)
  await db.add('purchases', {
    invoice_number: 'PUR-20260828-001',
    user_id: 1,
    supplier_id: 1,
    supplier_name: 'شركة التوريدات المتحدة',
    subtotal: 1080,
    discount_amount: 0,
    grand_total: 1080,
    paid_amount: 1000,
    due_amount: 80,
    payment_status: 'partial',
    purchase_status: 'completed',
    notes: 'فاتورة شحن أولي',
    items: [
      { product_id: 1, product_name: 'مسحوق غسيل 3 كغ', unit_cost: 18, quantity: 50, discount_amount: 0, subtotal: 900 },
      { product_id: 2, product_name: 'سائل جلي 1 لتر',   unit_cost: 6,  quantity: 30, discount_amount: 0, subtotal: 180 },
    ],
    payments: [{ payment_method: 'cash', amount: 1000, reference_number: null, created_at: '2026-08-28T09:15:00.000Z' }],
    created_at: '2026-08-28T09:00:00.000Z',
  });

  // Purchase 2 — Supplier 2 — full payment
  await db.add('purchases', {
    invoice_number: 'PUR-20260828-002',
    user_id: 1,
    supplier_id: 2,
    supplier_name: 'مؤسسة النظافة الحديثة',
    subtotal: 340,
    discount_amount: 0,
    grand_total: 340,
    paid_amount: 340,
    due_amount: 0,
    payment_status: 'paid',
    purchase_status: 'completed',
    notes: '',
    items: [
      { product_id: 4, product_name: 'كلور 4 لتر',        unit_cost: 8,  quantity: 20, discount_amount: 0, subtotal: 160 },
      { product_id: 5, product_name: 'معطر غرفة 500 مل',  unit_cost: 12, quantity: 15, discount_amount: 0, subtotal: 180 },
    ],
    payments: [{ payment_method: 'cash', amount: 340, reference_number: null, created_at: '2026-08-28T10:15:00.000Z' }],
    created_at: '2026-08-28T10:00:00.000Z',
  });

  // ─── Cash Session (open) ─────────────────────────────────────────────────
  await db.add('cashSessions', {
    session_number: 'CS-20260828-001',
    user_id: 1,
    cashier_name: 'مالك المحل',
    status: 'open',
    opening_cash: 500,
    total_sales_cash: 77.05,
    total_sales_card: 0,
    total_sales_credit: 62,
    total_expenses_cash: 175,
    notes: '',
    opened_at: '2026-08-28T09:00:00.000Z',
    closed_at: null,
    closing_cash_actual: null,
    closing_cash_expected: null,
    difference_amount: null,
    movements: [
      { type: 'in', amount: 200, reason: 'إيداع من مالك', notes: '', user_name: 'مالك المحل', created_at: '2026-08-28T10:30:00.000Z' },
      { type: 'out', amount: 100, reason: 'مصروف طارئ', notes: '', user_name: 'مالك المحل', created_at: '2026-08-28T11:00:00.000Z' },
    ],
    created_at: '2026-08-28T09:00:00.000Z',
  });

  // ─── Sales (tax-free) ────────────────────────────────────────────────────
  // Sale 1 — Cash sale: 2×28 + 1×11 = 67
  await db.add('sales', {
    invoice_number: 'POS-20260828-001',
    user_id: 1,
    cashier_name: 'مالك المحل',
    customer_id: null,
    customer: null,
    cash_session_id: 1,
    subtotal: 67,
    discount_amount: 0,
    grand_total: 67,
    paid_amount: 67,
    due_amount: 0,
    payment_status: 'paid',
    payment_method: 'cash',
    invoice_status: 'completed',
    notes: '',
    items: [
      { product_id: 1, product_name: 'مسحوق غسيل 3 كغ', unit_cost: 18, unit_price: 28, quantity: 2, discount_amount: 0, subtotal: 56 },
      { product_id: 2, product_name: 'سائل جلي 1 لتر',   unit_cost: 6,  unit_price: 11, quantity: 1, discount_amount: 0, subtotal: 11 },
    ],
    payments: [{ payment_method: 'cash', amount: 67, reference_number: null, created_at: '2026-08-28T11:30:00.000Z' }],
    created_at: '2026-08-28T11:30:00.000Z',
    formatted_date: '2026-08-28 11:30:00',
  });

  // Sale 2 — Credit sale to مؤسسة النور: 3×16 + 1×14 = 62, paid 0, due 62
  await db.add('sales', {
    invoice_number: 'POS-20260828-002',
    user_id: 1,
    cashier_name: 'مالك المحل',
    customer_id: 2,
    customer: { id: 2, name: 'مؤسسة النور', phone: '0599000001' },
    cash_session_id: 1,
    subtotal: 62,
    discount_amount: 0,
    grand_total: 62,
    paid_amount: 0,
    due_amount: 62,
    payment_status: 'due',
    payment_method: 'credit',
    invoice_status: 'completed',
    notes: '',
    items: [
      { product_id: 3, product_name: 'مطهر أرضيات 2 لتر', unit_cost: 9,  unit_price: 16, quantity: 3, discount_amount: 0, subtotal: 48 },
      { product_id: 4, product_name: 'كلور 4 لتر',        unit_cost: 8,  unit_price: 14, quantity: 1, discount_amount: 0, subtotal: 14 },
    ],
    payments: [{ payment_method: 'credit', amount: 62, reference_number: null, created_at: '2026-08-28T13:00:00.000Z' }],
    created_at: '2026-08-28T13:00:00.000Z',
    formatted_date: '2026-08-28 13:00:00',
  });

  // ─── Expenses ─────────────────────────────────────────────────────────────
  await db.add('expenses', {
    expense_number: 'EXP-20260828-001',
    expense_category_id: 3,
    description: 'إيجار محل الشهر',
    amount: 150,
    payment_method: 'cash',
    expense_date: day,
    reference_number: '',
    notes: '',
    user_id: 1,
    user_name: 'مالك المحل',
    created_at: '2026-08-28T12:00:00.000Z',
  });

  await db.add('expenses', {
    expense_number: 'EXP-20260828-002',
    expense_category_id: 2,
    description: 'مصاريف توصيل طرد',
    amount: 35,
    payment_method: 'card',
    expense_date: day,
    reference_number: 'INV-9001',
    notes: '',
    user_id: 1,
    user_name: 'مالك المحل',
    created_at: '2026-08-28T15:00:00.000Z',
  });

  await db.add('expenses', {
    expense_number: 'EXP-20260828-003',
    expense_category_id: 1,
    description: 'شراء أكياس تغليف',
    amount: 25,
    payment_method: 'cash',
    expense_date: day,
    reference_number: '',
    notes: '',
    user_id: 1,
    user_name: 'مالك المحل',
    created_at: '2026-08-28T16:00:00.000Z',
  });

  // ─── Supplier Payments ───────────────────────────────────────────────────
  await db.put('suppliers', { ...(await db.get('suppliers', 1)), current_balance: 80 });

  await db.add('supplierPayments', {
    payment_number: 'SPAY-20260828-001',
    supplier_id: 1,
    user_id: 1,
    cash_session_id: 1,
    amount: 1000,
    payment_method: 'cash',
    payment_date: day,
    notes: 'دفعة جزئية',
    created_at: '2026-08-28T09:15:00.000Z',
  });

  await db.add('supplierTransactions', {
    supplier_id: 1,
    user_id: 1,
    type: 'payment',
    amount: 1000,
    balance_before: 1080,
    balance_after: 80,
    reference_type: 'SupplierPayment',
    reference_id: 1,
    notes: 'دفعة جزئية — سند صرف SPAY-20260828-001',
    created_at: '2026-08-28T09:15:00.000Z',
  });

  await db.add('supplierPayments', {
    payment_number: 'SPAY-20260828-002',
    supplier_id: 2,
    user_id: 1,
    cash_session_id: 1,
    amount: 340,
    payment_method: 'cash',
    payment_date: day,
    notes: 'تسوية',
    created_at: '2026-08-28T10:15:00.000Z',
  });

  await db.add('supplierTransactions', {
    supplier_id: 2,
    user_id: 1,
    type: 'payment',
    amount: 340,
    balance_before: 340,
    balance_after: 0,
    reference_type: 'SupplierPayment',
    reference_id: 2,
    notes: 'تسوية — سند صرف SPAY-20260828-002',
    created_at: '2026-08-28T10:15:00.000Z',
  });

  // ─── Customer Transaction ─────────────────────────────────────────────────
  await db.add('customerTransactions', {
    customer_id: 2,
    user_id: 1,
    type: 'sale_credit',
    amount: 62,
    balance_before: 0,
    balance_after: 62,
    notes: 'متبقي فاتورة POS-20260828-002',
    created_at: '2026-08-28T13:00:00.000Z',
  });

  // ─── Done ─────────────────────────────────────────────────────────────────
  await db.put('meta', { id: 1, key: 'seeded', value: true, created_at: now });
}

export function defaultSettings() {
  return { ...DEFAULT_SETTINGS };
}
