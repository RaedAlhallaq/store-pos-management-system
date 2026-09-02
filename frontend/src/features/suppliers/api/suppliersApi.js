import { db } from '../../../data/db';
import { apiError } from '../../../data/errors';
import { paginate } from '../../../data/paginate';
import { ensureReady, money, nextSequence, nowIso, requireUser } from '../../../data/runtime';

function publicSupplier(supplier) {
  return {
    ...supplier,
    current_balance: money(supplier.current_balance).toFixed(2),
  };
}

export const suppliersApi = {
  async getSuppliers(params = {}) {
    await ensureReady();
    let rows = (await db.getAll('suppliers')).map(publicSupplier);
    if (params.search) {
      const term = String(params.search).toLowerCase();
      rows = rows.filter((row) => [row.name, row.company_name, row.phone].some((value) => String(value || '').toLowerCase().includes(term)));
    }
    if (params.has_debt) rows = rows.filter((row) => Number(row.current_balance) > 0);
    rows.sort((a, b) => b.id - a.id);
    return paginate(rows, params.page, params.per_page || 15);
  },

  async getQuickList() {
    await ensureReady();
    return (await db.getAll('suppliers')).filter((row) => row.is_active).map(publicSupplier);
  },

  async createSupplier(data) {
    await ensureReady();
    const id = await db.add('suppliers', {
      name: data.name,
      company_name: data.company_name || data.name,
      phone: data.phone || '',
      address: data.address || '',
      current_balance: 0,
      is_active: data.is_active !== false,
      created_at: nowIso(),
    });
    return publicSupplier(await db.get('suppliers', id));
  },

  async updateSupplier(id, data) {
    await ensureReady();
    const supplier = await db.get('suppliers', id);
    if (!supplier) apiError('المورد غير موجود.');
    await db.put('suppliers', { ...supplier, ...data, id, current_balance: supplier.current_balance });
    return publicSupplier(await db.get('suppliers', id));
  },

  async recordPayment(id, data) {
    await ensureReady();
    const supplier = await db.get('suppliers', id);
    if (!supplier) apiError('المورد غير موجود.');
    const amount = money(data.amount);
    if (amount <= 0) apiError('مبلغ الدفعة يجب أن يكون أكبر من الصفر.');
    const before = money(supplier.current_balance);
    const after = money(before - amount);
    await db.put('suppliers', { ...supplier, current_balance: after });
    const sessions = await db.getAll('cashSessions');
    const user = requireUser();
    const active = sessions.find((session) => session.status === 'open' && session.user_id === user.id);
    const paymentNumber = await nextSequence('SPAY', 'supplierPayments', 'payment_number');
    const paymentId = await db.add('supplierPayments', {
      payment_number: paymentNumber,
      supplier_id: id,
      user_id: user.id,
      cash_session_id: active?.id || null,
      amount,
      payment_method: data.payment_method,
      payment_date: nowIso().slice(0, 10),
      notes: data.notes || '',
      created_at: nowIso(),
    });
    const transactionId = await db.add('supplierTransactions', {
      supplier_id: id,
      user_id: user.id,
      type: 'payment',
      amount,
      balance_before: before,
      balance_after: after,
      reference_type: 'SupplierPayment',
      reference_id: paymentId,
      notes: data.notes || `سند صرف ${paymentNumber}`,
      created_at: nowIso(),
    });
    return {
      transaction: await db.get('supplierTransactions', transactionId),
      supplier: publicSupplier(await db.get('suppliers', id)),
    };
  },

  async deleteSupplier(id) {
    await ensureReady();
    const supplier = await db.get('suppliers', id);
    if (!supplier) apiError('المورد غير موجود.');
    const purchases = await db.getAll('purchases');
    if (purchases.some((purchase) => purchase.supplier_id === id)) {
      await db.put('suppliers', { ...supplier, is_active: false });
      return { success: true, message: 'تم تعطيل حساب المورد لوجود فواتير مشتريات مرتبطة به.' };
    }
    await db.delete('suppliers', id);
    return { success: true, message: 'تم حذف المورد بنجاح.' };
  },
};
