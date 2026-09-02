import { db } from '../../../data/db';
import { apiError } from '../../../data/errors';
import { paginate } from '../../../data/paginate';
import { ensureReady, money, nextSequence, nowIso, requireUser } from '../../../data/runtime';

function publicCustomer(customer) {
  return {
    ...customer,
    current_balance: money(customer.current_balance).toFixed(2),
  };
}

export const customersApi = {
  async getCustomers(params = {}) {
    await ensureReady();
    let rows = (await db.getAll('customers')).map(publicCustomer);
    if (params.search) {
      const term = String(params.search).toLowerCase();
      rows = rows.filter((row) => [row.name, row.phone].some((value) => String(value || '').toLowerCase().includes(term)));
    }
    if (params.has_debt) rows = rows.filter((row) => Number(row.current_balance) > 0);
    rows.sort((a, b) => b.id - a.id);
    return paginate(rows, params.page, params.per_page || 15);
  },

  async getQuickList() {
    await ensureReady();
    return (await db.getAll('customers')).filter((row) => row.is_active).map(publicCustomer);
  },

  async createCustomer(data) {
    await ensureReady();
    const id = await db.add('customers', {
      name: data.name,
      phone: data.phone || '',
      current_balance: 0,
      is_active: data.is_active !== false,
      created_at: nowIso(),
    });
    return publicCustomer(await db.get('customers', id));
  },

  async updateCustomer(id, data) {
    await ensureReady();
    const customer = await db.get('customers', id);
    if (!customer) apiError('العميل غير موجود.');
    const next = { ...customer, ...data, id, current_balance: customer.current_balance };
    await db.put('customers', next);
    return publicCustomer(await db.get('customers', id));
  },

  async recordPayment(id, data) {
    await ensureReady();
    const customer = await db.get('customers', id);
    if (!customer) apiError('العميل غير موجود.');
    const amount = money(data.amount);
    if (amount <= 0) apiError('مبلغ الدفعة يجب أن يكون أكبر من الصفر.');
    const before = money(customer.current_balance);
    const after = money(before - amount);
    await db.put('customers', { ...customer, current_balance: after });
    const sessions = await db.getAll('cashSessions');
    const user = requireUser();
    const active = sessions.find((session) => session.status === 'open' && session.user_id === user.id);
    const paymentNumber = await nextSequence('CPAY', 'customerPayments', 'payment_number');
    const paymentId = await db.add('customerPayments', {
      payment_number: paymentNumber,
      customer_id: id,
      user_id: user.id,
      cash_session_id: active?.id || null,
      amount,
      payment_method: data.payment_method,
      payment_date: nowIso().slice(0, 10),
      notes: data.notes || '',
      created_at: nowIso(),
    });
    const transactionId = await db.add('customerTransactions', {
      customer_id: id,
      user_id: user.id,
      type: 'payment',
      amount,
      balance_before: before,
      balance_after: after,
      reference_type: 'CustomerPayment',
      reference_id: paymentId,
      notes: data.notes || `سند قبض ${paymentNumber}`,
      created_at: nowIso(),
    });
    return {
      transaction: await db.get('customerTransactions', transactionId),
      customer: publicCustomer(await db.get('customers', id)),
    };
  },

  async deleteCustomer(id) {
    await ensureReady();
    const customer = await db.get('customers', id);
    if (!customer) apiError('العميل غير موجود.');
    const sales = await db.getAll('sales');
    if (sales.some((sale) => sale.customer_id === id)) {
      await db.put('customers', { ...customer, is_active: false });
      return { success: true, message: 'تم تعطيل حساب العميل لوجود فواتير سابقة مرتبطة به.' };
    }
    await db.delete('customers', id);
    return { success: true, message: 'تم حذف العميل بنجاح.' };
  },
};
