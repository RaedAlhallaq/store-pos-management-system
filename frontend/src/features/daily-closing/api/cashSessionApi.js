import { db } from '../../../data/db';
import { apiError } from '../../../data/errors';
import { paginate } from '../../../data/paginate';
import { currentUser, ensureReady, money, nextSequence, nowIso } from '../../../data/runtime';

function formatSession(session) {
  return {
    ...session,
    opening_cash: money(session.opening_cash).toFixed(2),
    total_sales_cash: money(session.total_sales_cash).toFixed(2),
    total_sales_card: money(session.total_sales_card).toFixed(2),
    total_sales_credit: money(session.total_sales_credit).toFixed(2),
    total_expenses_cash: money(session.total_expenses_cash || 0).toFixed(2),
    difference_amount: session.difference_amount != null ? money(session.difference_amount).toFixed(2) : null,
  };
}

export const cashSessionApi = {
  async getActiveSession() {
    await ensureReady();
    const user = currentUser();
    const sessions = await db.getAll('cashSessions');
    const active = sessions.find((s) => s.status === 'open' && s.user_id === user.id);
    return active ? formatSession(active) : null;
  },

  async getSessions(params = {}) {
    await ensureReady();
    let rows = (await db.getAll('cashSessions')).map(formatSession);
    if (params.status) rows = rows.filter((s) => s.status === params.status);
    rows.sort((a, b) => b.id - a.id);
    return paginate(rows, params.page, params.per_page || 20);
  },

  async openSession(data) {
    await ensureReady();
    const user = currentUser();
    const now = nowIso();
    const sessionNumber = await nextSequence('CS', 'cashSessions', 'session_number');
    const id = await db.add('cashSessions', {
      session_number: sessionNumber,
      user_id: user.id,
      cashier_name: user.name,
      status: 'open',
      opening_cash: money(data.opening_cash || 0),
      total_sales_cash: 0,
      total_sales_card: 0,
      total_sales_credit: 0,
      total_expenses_cash: 0,
      notes: data.notes || '',
      opened_at: now,
      closed_at: null,
      closing_cash_actual: null,
      closing_cash_expected: null,
      difference_amount: null,
      movements: [],
    });
    return formatSession(await db.get('cashSessions', id));
  },

  async recordMovement(sessionId, data) {
    await ensureReady();
    const session = await db.get('cashSessions', sessionId);
    if (!session) apiError('جلسة الصندوق غير موجودة.');
    if (session.status !== 'open') apiError('هذه الجلسة مغلقة.');

    const user = currentUser();
    const now = nowIso();
    const movement = {
      type: data.type,
      amount: money(data.amount),
      reason: data.reason,
      notes: data.notes || '',
      user_name: user.name,
      created_at: now,
    };

    // Apply to session totals
    if (data.type === 'in') {
      session.total_sales_cash = money(session.total_sales_cash + money(data.amount));
    } else {
      session.total_expenses_cash = money((session.total_expenses_cash || 0) + money(data.amount));
    }
    session.movements = [...(session.movements || []), movement];
    await db.put('cashSessions', session);

    const id = await db.add('cashMovements', {
      ...movement,
      session_id: sessionId,
      user_id: user.id,
    });
    return { ...movement, id };
  },

  async closeSession(sessionId, data) {
    await ensureReady();
    const session = await db.get('cashSessions', sessionId);
    if (!session) apiError('جلسة الصندوق غير موجودة.');
    if (session.status !== 'open') apiError('هذه الجلسة مغلقة بالفعل.');

    const now = nowIso();
    const expectedCash = money(
      money(session.opening_cash) +
      money(session.total_sales_cash) -
      money(session.total_expenses_cash || 0)
    );
    const actualCash = money(data.closing_cash_actual);
    const difference = money(actualCash - expectedCash);

    session.status = 'closed';
    session.closed_at = now;
    session.closing_cash_actual = actualCash;
    session.closing_cash_expected = expectedCash;
    session.difference_amount = difference;
    if (data.notes) session.notes = `${session.notes || ''} | ${data.notes}`.trim();
    await db.put('cashSessions', session);

    const zReport = await this.getZReport(sessionId);
    return { session: formatSession(session), z_report: zReport };
  },

  async getZReport(sessionId) {
    await ensureReady();
    const session = await db.get('cashSessions', sessionId);
    if (!session) apiError('جلسة الصندوق غير موجودة.');

    const sales = (await db.getAll('sales')).filter(
      (s) => s.cash_session_id === sessionId && s.invoice_status !== 'void'
    );

    const totalSales = sales.reduce((sum, s) => sum + money(s.grand_total), 0);
    const totalSalesCash = sales.reduce(
      (sum, s) => sum + (s.payments || []).filter((p) => p.payment_method === 'cash').reduce((ps, p) => ps + money(p.amount), 0),
      0
    );
    const totalSalesCard = sales.reduce(
      (sum, s) => sum + (s.payments || []).filter((p) => p.payment_method === 'card').reduce((ps, p) => ps + money(p.amount), 0),
      0
    );
    const totalSalesCredit = sales.reduce((sum, s) => sum + money(s.due_amount), 0);
    const totalTax = sales.reduce((sum, s) => sum + money(s.tax_amount), 0);
    const totalDiscounts = sales.reduce((sum, s) => sum + money(s.discount_amount), 0);

    const movements = session.movements || [];
    const totalCashIn = movements.filter((m) => m.type === 'in').reduce((sum, m) => sum + money(m.amount), 0);
    const totalCashOut = movements.filter((m) => m.type === 'out').reduce((sum, m) => sum + money(m.amount), 0);

    const allExpenses = await db.getAll('expenses');
    const expenses = allExpenses.filter((e) => {
      return e.created_at && e.created_at >= (session.opened_at || '') && (!session.closed_at || e.created_at <= session.closed_at);
    });
    const totalExpenses = expenses.reduce((sum, e) => sum + money(e.amount), 0);

    const expectedCash = money(
      money(session.opening_cash) + totalSalesCash + totalCashIn - totalCashOut - totalExpenses
    );
    const actualCash = session.closing_cash_actual != null ? money(session.closing_cash_actual) : expectedCash;
    const difference = money(actualCash - expectedCash);

    let varianceStatus = 'balanced';
    if (difference > 0) varianceStatus = 'surplus';
    else if (difference < 0) varianceStatus = 'deficit';

    const durationHours = session.opened_at && session.closed_at
      ? ((new Date(session.closed_at) - new Date(session.opened_at)) / (1000 * 60 * 60)).toFixed(1)
      : null;

    return {
      cashier_name: session.cashier_name,
      opened_at: session.opened_at,
      closed_at: session.closed_at,
      duration_hours: durationHours,
      sales_count: sales.length,
      total_sales: money(totalSales),
      total_sales_cash: money(totalSalesCash),
      total_sales_card: money(totalSalesCard),
      total_sales_credit: money(totalSalesCredit),
      total_tax: money(totalTax),
      total_discounts: money(totalDiscounts),
      opening_cash: money(session.opening_cash),
      total_cash_in: money(totalCashIn),
      total_cash_out: money(totalCashOut),
      total_expenses: money(totalExpenses),
      closing_cash_expected: money(expectedCash),
      closing_cash_actual: actualCash,
      difference: money(difference),
      variance_status: varianceStatus,
    };
  },
};
