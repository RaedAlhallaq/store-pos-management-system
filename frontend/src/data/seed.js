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

  // ─── Units ────────────────────────────────────────────────────────────────
  await db.put('units', { id: 1, name: 'حبة', short_name: 'حبة', allow_decimal: false, created_at: now });
  await db.put('units', { id: 2, name: 'لتر', short_name: 'لتر', allow_decimal: true, created_at: now });
  await db.put('units', { id: 3, name: 'كيلوغرام', short_name: 'كغ', allow_decimal: true, created_at: now });

  // ─── Products ─────────────────────────────────────────────────────────────
  // stock_quantity = FINAL stock (after all seeded purchases/sales)
  // Purchases add: P1+50, P2+30, P3+0, P4+20, P5+15
  // Sales remove:  P1-2,  P2-1,  P3-3, P4-1,  P5-2
  const products = [
    { id: 1, name: 'مسحوق غسيل 3 كغ',   barcode: '6281001001', category_id: 1, unit_id: 1, cost_price: 18, selling_price: 28, tax_percent: 15, stock_quantity: 45, min_stock_alert: 5 },
    { id: 2, name: 'سائل جلي 1 لتر',     barcode: '6281001002', category_id: 2, unit_id: 2, cost_price: 6,  selling_price: 11, tax_percent: 15, stock_quantity: 58, min_stock_alert: 8 },
    { id: 3, name: 'مطهر أرضيات 2 لتر',  barcode: '6281001003', category_id: 3, unit_id: 2, cost_price: 9,  selling_price: 16, tax_percent: 15, stock_quantity: 48, min_stock_alert: 5 },
    { id: 4, name: 'كلور 4 لتر',         barcode: '6281001004', category_id: 3, unit_id: 2, cost_price: 8,  selling_price: 14, tax_percent: 15, stock_quantity: 34, min_stock_alert: 4 },
    { id: 5, name: 'معطر غرفة 500 مل',   barcode: '6281001005', category_id: 4, unit_id: 1, cost_price: 12, selling_price: 22, tax_percent: 15, stock_quantity: 28, min_stock_alert: 5 },
  ];

  for (const p of products) {
    await db.put('products', {
      ...p,
      sku: '',
      description: '',
      is_active: true,
      created_at: now,
      updated_at: now,
    });
    // Initial stock movement (one per product, records the opening balance)
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

  // ─── Customers ────────────────────────────────────────────────────────────
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
    email: 'nour@example.com',
    credit_limit: 5000,
    current_balance: 57.50,
    is_active: true,
    created_at: now,
  });

  // ─── Suppliers ────────────────────────────────────────────────────────────
  await db.put('suppliers', {
    id: 1,
    name: 'شركة التوريدات المتحدة',
    company_name: 'التوريدات المتحدة',
    phone: '0598000001',
    email: 'supply@example.com',
    address: 'منطقة الصناعة',
    current_balance: 362,
    is_active: true,
    created_at: now,
  });

  await db.put('suppliers', {
    id: 2,
    name: 'مؤسسة النظافة الحديثة',
    company_name: 'النظافة الحديثة',
    phone: '0597000002',
    email: 'clean@example.com',
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

  // ─── Purchases ────────────────────────────────────────────────────────────
  //
  // Purchase 1 — Supplier 1 — partial payment (1000 of 1362 → due 362)
  //   50 × مسحوق غسيل @ 18 = 900, tax 135 → 1035
  //   30 × سائل جلي @ 6    = 180, tax 27  → 207
  //   Subtotal: 1080, Tax: 162, Total: 1242
  await db.add('purchases', {
    invoice_number: 'PUR-20260828-001',
    user_id: 1,
    supplier_id: 1,
    supplier_name: 'شركة التوريدات المتحدة',
    subtotal: 1080,
    tax_amount: 162,
    discount_amount: 0,
    grand_total: 1242,
    paid_amount: 1000,
    due_amount: 242,
    payment_status: 'partial',
    purchase_status: 'completed',
    notes: 'فاتورة شحن أولي',
    items: [
      { product_id: 1, product_name: 'مسحوق غسيل 3 كغ', unit_cost: 18, quantity: 50, tax_percent: 15, tax_amount: 135, discount_amount: 0, subtotal: 1035 },
      { product_id: 2, product_name: 'سائل جلي 1 لتر',   unit_cost: 6,  quantity: 30, tax_percent: 15, tax_amount: 27,  discount_amount: 0, subtotal: 207 },
    ],
    payments: [{ payment_method: 'cash', amount: 1000, reference_number: null, created_at: '2026-08-28T09:15:00.000Z' }],
    created_at: '2026-08-28T09:00:00.000Z',
  });

  // Purchase 2 — Supplier 2 — full payment (600 of 531 → overpaid, balance 0)
  //   20 × كلور @ 8          = 160, tax 24 → 184
  //   15 × معطر غرفة @ 12   = 180, tax 27 → 207
  //   Subtotal: 340, Tax: 51, Total: 391
  await db.add('purchases', {
    invoice_number: 'PUR-20260828-002',
    user_id: 1,
    supplier_id: 2,
    supplier_name: 'مؤسسة النظافة الحديثة',
    subtotal: 340,
    tax_amount: 51,
    discount_amount: 0,
    grand_total: 391,
    paid_amount: 600,
    due_amount: 0,
    payment_status: 'paid',
    purchase_status: 'completed',
    notes: '',
    items: [
      { product_id: 4, product_name: 'كلور 4 لتر',        unit_cost: 8,  quantity: 20, tax_percent: 15, tax_amount: 24, discount_amount: 0, subtotal: 184 },
      { product_id: 5, product_name: 'معطر غرفة 500 مل',  unit_cost: 12, quantity: 15, tax_percent: 15, tax_amount: 27, discount_amount: 0, subtotal: 207 },
    ],
    payments: [{ payment_method: 'cash', amount: 600, reference_number: null, created_at: '2026-08-28T10:15:00.000Z' }],
    created_at: '2026-08-28T10:00:00.000Z',
  });

  // ─── Cash Session (open) ─────────────────────────────────────────────────
  // Cash sales: Sale1 cash 77.05 + Sale2 cash-part 23.10 = 100.15
  // Card sales: Sale3 card 57.20
  // Credit sales: Sale2 credit 57.50
  // Cash in: 200, Cash out: 100
  // Cash expenses within session window: rent 150 + bags 25 = 175
  // Expected cash: 500 + 100.15 + 200 - 100 - 175 = 525.15
  await db.add('cashSessions', {
    session_number: 'CS-20260828-001',
    user_id: 1,
    cashier_name: 'مالك المحل',
    status: 'open',
    opening_cash: 500,
    total_sales_cash: 90.85,
    total_sales_card: 50.60,
    total_sales_credit: 57.50,
    total_expenses_cash: 175,
    notes: '',
    opened_at: '2026-08-28T09:00:00.000Z',
    closed_at: null,
    closing_cash_actual: null,
    closing_cash_expected: null,
    difference_amount: null,
    movements: [
      {
        type: 'in',
        amount: 200,
        reason: 'إيداع من مالك',
        notes: '',
        user_name: 'مالك المحل',
        created_at: '2026-08-28T10:30:00.000Z',
      },
      {
        type: 'out',
        amount: 100,
        reason: 'مصروف طارئ',
        notes: '',
        user_name: 'مالك المحل',
        created_at: '2026-08-28T11:00:00.000Z',
      },
    ],
    created_at: '2026-08-28T09:00:00.000Z',
  });

  // ─── Sales ────────────────────────────────────────────────────────────────
  //
  // Sale 1 — Cash sale (walk-in)
  //   2 × مسحوق غسيل @ 28 = 56,  tax 8.40 → 64.40
  //   1 × سائل جلي @ 11   = 11,  tax 1.65 → 12.65
  //   Subtotal: 67, Tax: 10.05, Total: 77.05
  await db.add('sales', {
    invoice_number: 'POS-20260828-001',
    user_id: 1,
    cashier_name: 'مالك المحل',
    customer_id: null,
    customer: null,
    cash_session_id: 1,
    subtotal: 67,
    tax_amount: 10.05,
    discount_amount: 0,
    grand_total: 77.05,
    paid_amount: 77.05,
    due_amount: 0,
    payment_status: 'paid',
    payment_method: 'cash',
    invoice_status: 'completed',
    notes: '',
    items: [
      { product_id: 1, product_name: 'مسحوق غسيل 3 كغ', unit_cost: 18, unit_price: 28, quantity: 2, tax_percent: 15, tax_amount: 8.40, discount_amount: 0, subtotal: 64.40 },
      { product_id: 2, product_name: 'سائل جلي 1 لتر',   unit_cost: 6,  unit_price: 11, quantity: 1, tax_percent: 15, tax_amount: 1.65, discount_amount: 0, subtotal: 12.65 },
    ],
    payments: [{ payment_method: 'cash', amount: 77.05, reference_number: null, created_at: '2026-08-28T11:30:00.000Z' }],
    created_at: '2026-08-28T11:30:00.000Z',
    formatted_date: '2026-08-28 11:30:00',
  });

  // Sale 2 — Partial credit sale to مؤسسة النور
  //   3 × مطهر أرضيات @ 16 = 48, tax 7.20 → 55.20
  //   1 × كلور @ 14         = 14, tax 2.10 → 16.10
  //   Subtotal: 62, Tax: 9.30, Total: 71.30
  //   Paid: 13.80 cash → Due: 57.50
  await db.add('sales', {
    invoice_number: 'POS-20260828-002',
    user_id: 1,
    cashier_name: 'مالك المحل',
    customer_id: 2,
    customer: { id: 2, name: 'مؤسسة النور', phone: '0599000001' },
    cash_session_id: 1,
    subtotal: 62,
    tax_amount: 9.30,
    discount_amount: 0,
    grand_total: 71.30,
    paid_amount: 13.80,
    due_amount: 57.50,
    payment_status: 'partial',
    payment_method: 'multiple',
    invoice_status: 'completed',
    notes: '',
    items: [
      { product_id: 3, product_name: 'مطهر أرضيات 2 لتر', unit_cost: 9,  unit_price: 16, quantity: 3, tax_percent: 15, tax_amount: 7.20, discount_amount: 0, subtotal: 55.20 },
      { product_id: 4, product_name: 'كلور 4 لتر',        unit_cost: 8,  unit_price: 14, quantity: 1, tax_percent: 15, tax_amount: 2.10, discount_amount: 0, subtotal: 16.10 },
    ],
    payments: [{ payment_method: 'cash', amount: 13.80, reference_number: null, created_at: '2026-08-28T13:00:00.000Z' }],
    created_at: '2026-08-28T13:00:00.000Z',
    formatted_date: '2026-08-28 13:00:00',
  });

  // Sale 3 — Card-only sale (walk-in)
  //   2 × معطر غرفة @ 22 = 44, tax 6.60 → 50.60
  //   Subtotal: 44, Tax: 6.60, Total: 50.60
  await db.add('sales', {
    invoice_number: 'POS-20260828-003',
    user_id: 1,
    cashier_name: 'مالك المحل',
    customer_id: null,
    customer: null,
    cash_session_id: 1,
    subtotal: 44,
    tax_amount: 6.60,
    discount_amount: 0,
    grand_total: 50.60,
    paid_amount: 50.60,
    due_amount: 0,
    payment_status: 'paid',
    payment_method: 'card',
    invoice_status: 'completed',
    notes: '',
    items: [
      { product_id: 5, product_name: 'معطر غرفة 500 مل', unit_cost: 12, unit_price: 22, quantity: 2, tax_percent: 15, tax_amount: 6.60, discount_amount: 0, subtotal: 50.60 },
    ],
    payments: [{ payment_method: 'card', amount: 50.60, reference_number: 'TXN-88442211', created_at: '2026-08-28T14:30:00.000Z' }],
    created_at: '2026-08-28T14:30:00.000Z',
    formatted_date: '2026-08-28 14:30:00',
  });

  // ─── Expenses ─────────────────────────────────────────────────────────────
  //
  // Expense 1 — Rent (cash, within session window: 09:00–∞)
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

  // Expense 2 — Delivery (card, outside session window — for reports variety)
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

  // Expense 3 — Supplies (cash, within session window)
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
  //
  // Supplier 1: Purchase 1242, paid 1000 → balance 242
  await db.put('suppliers', { ...(await db.get('suppliers', 1)), current_balance: 242 });

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
    balance_before: 1242,
    balance_after: 242,
    reference_type: 'SupplierPayment',
    reference_id: 1,
    notes: 'دفعة جزئية — سند صرف SPAY-20260828-001',
    created_at: '2026-08-28T09:15:00.000Z',
  });

  // Supplier 2: Purchase 391, paid 600 → overpaid, balance 0
  await db.put('suppliers', { ...(await db.get('suppliers', 2)), current_balance: 0 });

  await db.add('supplierPayments', {
    payment_number: 'SPAY-20260828-002',
    supplier_id: 2,
    user_id: 1,
    cash_session_id: 1,
    amount: 600,
    payment_method: 'cash',
    payment_date: day,
    notes: 'تسوية',
    created_at: '2026-08-28T10:15:00.000Z',
  });

  await db.add('supplierTransactions', {
    supplier_id: 2,
    user_id: 1,
    type: 'payment',
    amount: 600,
    balance_before: 391,
    balance_after: 0,
    reference_type: 'SupplierPayment',
    reference_id: 2,
    notes: 'تسوية — سند صرف SPAY-20260828-002',
    created_at: '2026-08-28T10:15:00.000Z',
  });

  // ─── Customer Transaction (credit sale balance) ───────────────────────────
  // Sale 2: grand_total 71.30, paid 13.80 → due 57.50
  await db.add('customerTransactions', {
    customer_id: 2,
    user_id: 1,
    type: 'sale_credit',
    amount: 57.50,
    balance_before: 0,
    balance_after: 57.50,
    notes: 'متبقي فاتورة POS-20260828-002',
    created_at: '2026-08-28T13:00:00.000Z',
  });

  // ─── Done ─────────────────────────────────────────────────────────────────
  await db.put('meta', { id: 1, key: 'seeded', value: true, created_at: now });
}

export function defaultSettings() {
  return { ...DEFAULT_SETTINGS };
}
