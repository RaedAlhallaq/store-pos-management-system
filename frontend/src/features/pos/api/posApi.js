import { db } from '../../../data/db';
import { apiError } from '../../../data/errors';
import { paginate } from '../../../data/paginate';
import { ensureReady, inDateRange, money, nextSequence, nowIso, qty, requireUser } from '../../../data/runtime';

function formatSale(sale) {
  return {
    ...sale,
    subtotal: money(sale.subtotal).toFixed(2),
    discount_amount: money(sale.discount_amount).toFixed(2),
    grand_total: money(sale.grand_total).toFixed(2),
    paid_amount: money(sale.paid_amount).toFixed(2),
    due_amount: money(sale.due_amount).toFixed(2),
    items_count: (sale.items || []).length,
    items: (sale.items || []).map((item) => ({
      ...item,
      unit_cost: money(item.unit_cost).toFixed(2),
      unit_price: money(item.unit_price).toFixed(2),
      quantity: qty(item.quantity).toFixed(3),
      discount_amount: money(item.discount_amount).toFixed(2),
      subtotal: money(item.subtotal).toFixed(2),
    })),
    payments: (sale.payments || []).map((payment) => ({
      ...payment,
      amount: money(payment.amount).toFixed(2),
    })),
  };
}

export const posApi = {
  async checkout(payload) {
    await ensureReady();
    const items = payload.items || [];
    if (!items.length) apiError('سلة المبيعات فارغة، يرجى إضافة منتج واحد على الأقل.');

    const user = requireUser();
    const sessions = await db.getAll('cashSessions');
    const active = sessions.find((session) => session.status === 'open' && session.user_id === user.id) || null;
    let subtotal = 0;
    let itemsDiscount = 0;
    const prepared = [];

    for (const item of items) {
      const product = await db.get('products', item.product_id);
      if (!product || !product.is_active) apiError(`المنتج ذو المعرف (${item.product_id}) غير موجود.`);
      const quantity = qty(item.quantity);
      if (quantity <= 0) apiError('كمية الصنف يجب أن تكون أكبر من الصفر.');
      const unitPrice = money(product.selling_price);
      const itemDiscount = money(item.discount_amount || 0);
      const lineNet = money(unitPrice * quantity - itemDiscount);
      subtotal += lineNet;
      itemsDiscount += itemDiscount;
      prepared.push({
        product,
        product_id: product.id,
        product_name: product.name,
        unit_cost: money(product.cost_price),
        unit_price: unitPrice,
        quantity,
        discount_amount: itemDiscount,
        subtotal: lineNet,
      });
    }

    // Validate stock availability before any stock changes (prevent partial state)
    for (const prep of prepared) {
      if (qty(prep.product.stock_quantity) < qty(prep.quantity)) {
        apiError(`المنتج \"${prep.product_name}\" لا يملك مخزوناً كافياً. المتوفر: ${qty(prep.product.stock_quantity).toFixed(0)}، المطلوب: ${qty(prep.quantity).toFixed(0)}.`);
      }
    }

    const overallDiscount = money(payload.discount_amount || 0);
    let grandTotal = money(subtotal - overallDiscount);
    if (grandTotal < 0) grandTotal = 0;

    let payments = payload.payments || [];
    if (!payments.length) {
      payments = [{ payment_method: payload.payment_method || 'cash', amount: grandTotal }];
    }

    let paidAmount = 0;
    payments.forEach((payment) => {
      if (payment.payment_method !== 'credit') paidAmount += money(payment.amount);
    });
    paidAmount = money(paidAmount);
    let dueAmount = money(grandTotal - paidAmount);
    if (dueAmount < 0) {
      paidAmount = grandTotal;
      dueAmount = 0;
    }

    let paymentStatus = 'due';
    if (dueAmount <= 0) paymentStatus = 'paid';
    else if (paidAmount > 0) paymentStatus = 'partial';

    if (dueAmount > 0) {
      if (!payload.customer_id) apiError('البيع بالآجل أو وجود رصيد متبقٍ يتطلب تحديد عميل مسجل.');
      const customer = await db.get('customers', payload.customer_id);
      if (!customer) apiError('العميل المحدد غير موجود.');
    }

    const primaryPaymentMethod = payments.length > 1 ? 'multiple' : payments[0]?.payment_method || 'cash';
    const invoiceNumber = await nextSequence('POS', 'sales', 'invoice_number');
    const createdAt = nowIso();
    const saleItems = [];

    for (const prep of prepared) {
      const before = qty(prep.product.stock_quantity);
      const after = qty(before - prep.quantity);
      await db.put('products', { ...prep.product, stock_quantity: after, updated_at: createdAt });
      saleItems.push({ ...prep, product: undefined });
      await db.add('stockMovements', {
        product_id: prep.product_id,
        user_id: user.id,
        user_name: user.name,
        type: 'sale',
        quantity: -prep.quantity,
        unit_cost: prep.unit_cost,
        balance_before: before,
        balance_after: after,
        notes: `فاتورة مبيعات ${invoiceNumber}`,
        created_at: createdAt,
      });
    }

    if (active) {
      for (const payment of payments) {
        const amount = money(Math.min(Number(payment.amount), grandTotal));
        if (payment.payment_method === 'cash') active.total_sales_cash = money((active.total_sales_cash || 0) + amount);
        else if (payment.payment_method !== 'credit') active.total_sales_card = money((active.total_sales_card || 0) + amount);
      }
      if (dueAmount > 0) active.total_sales_credit = money((active.total_sales_credit || 0) + dueAmount);
      await db.put('cashSessions', active);
    }

    if (dueAmount > 0 && payload.customer_id) {
      const customer = await db.get('customers', payload.customer_id);
      const before = money(customer.current_balance);
      const after = money(before + dueAmount);
      await db.put('customers', { ...customer, current_balance: after });
      await db.add('customerTransactions', {
        customer_id: customer.id,
        user_id: user.id,
        type: 'sale_credit',
        amount: dueAmount,
        balance_before: before,
        balance_after: after,
        notes: `متبقي فاتورة ${invoiceNumber}`,
        created_at: createdAt,
      });
    }

    const customer = payload.customer_id ? await db.get('customers', payload.customer_id) : null;
    const saleId = await db.add('sales', {
      invoice_number: invoiceNumber,
      user_id: user.id,
      cashier_name: user.name,
      customer_id: payload.customer_id || null,
      customer,
      cash_session_id: active?.id || null,
      subtotal: money(subtotal),
      discount_amount: money(overallDiscount + itemsDiscount),
      grand_total: grandTotal,
      paid_amount: paidAmount,
      due_amount: dueAmount,
      payment_status: paymentStatus,
      payment_method: primaryPaymentMethod,
      invoice_status: 'completed',
      notes: payload.notes || '',
      items: saleItems,
      payments: payments.map((payment) => ({
        payment_method: payment.payment_method,
        amount: money(payment.amount),
        reference_number: payment.reference_number || null,
        created_at: createdAt,
      })),
      created_at: createdAt,
      formatted_date: createdAt.replace('T', ' ').slice(0, 19),
    });

    return formatSale(await db.get('sales', saleId));
  },

  async getSales(params = {}) {
    await ensureReady();
    let rows = (await db.getAll('sales')).map(formatSale);
    if (params.search) {
      const term = String(params.search).toLowerCase();
      rows = rows.filter((sale) =>
        [sale.invoice_number, sale.customer?.name, sale.customer?.phone].some((value) => String(value || '').toLowerCase().includes(term))
      );
    }
    if (params.payment_status) rows = rows.filter((sale) => sale.payment_status === params.payment_status);
    if (params.invoice_status) rows = rows.filter((sale) => sale.invoice_status === params.invoice_status);
    if (params.date_from || params.date_to) {
      rows = rows.filter((sale) => inDateRange(sale.created_at, params.date_from, params.date_to));
    }
    rows.sort((a, b) => b.id - a.id);
    return paginate(rows, params.page, params.per_page || 15);
  },

  async getSale(id) {
    await ensureReady();
    const sale = await db.get('sales', id);
    if (!sale) apiError('الفاتورة غير موجودة.');
    return formatSale(sale);
  },

  async voidSale(id, reason) {
    await ensureReady();
    const sale = await db.get('sales', id);
    if (!sale) apiError('الفاتورة غير موجودة.');
    if (sale.invoice_status === 'void') apiError('هذه الفاتورة ملغاة مسبقاً.');
    const user = requireUser();
    const createdAt = nowIso();

    for (const item of sale.items || []) {
      const product = await db.get('products', item.product_id);
      if (!product) continue;
      const before = qty(product.stock_quantity);
      const after = qty(before + qty(item.quantity));
      await db.put('products', { ...product, stock_quantity: after, updated_at: createdAt });
      await db.add('stockMovements', {
        product_id: product.id,
        user_id: user.id,
        user_name: user.name,
        type: 'sale_return',
        quantity: qty(item.quantity),
        unit_cost: money(item.unit_cost),
        balance_before: before,
        balance_after: after,
        notes: `إلغاء فاتورة ${sale.invoice_number}: ${reason}`,
        created_at: createdAt,
      });
    }

    if (money(sale.due_amount) > 0 && sale.customer_id) {
      const customer = await db.get('customers', sale.customer_id);
      if (customer) {
        const before = money(customer.current_balance);
        const after = money(before - money(sale.due_amount));
        await db.put('customers', { ...customer, current_balance: after });
      }
    }

    if (sale.cash_session_id) {
      const session = await db.get('cashSessions', sale.cash_session_id);
      if (session) {
        for (const payment of sale.payments || []) {
          if (payment.payment_method === 'cash') {
            session.total_sales_cash = money(Math.max(0, (session.total_sales_cash || 0) - money(payment.amount)));
          } else if (payment.payment_method !== 'credit') {
            session.total_sales_card = money(Math.max(0, (session.total_sales_card || 0) - money(payment.amount)));
          }
        }
        if (money(sale.due_amount) > 0) {
          session.total_sales_credit = money(Math.max(0, (session.total_sales_credit || 0) - money(sale.due_amount)));
        }
        await db.put('cashSessions', session);
      }
    }

    const next = {
      ...sale,
      invoice_status: 'void',
      notes: `${sale.notes || ''} | تم الإلغاء: ${reason} بواسطة ${user.name}`.trim(),
    };
    await db.put('sales', next);
    return formatSale(next);
  },
};
