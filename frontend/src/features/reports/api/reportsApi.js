import { db } from '../../../data/db';
import { ensureReady, inDateRange, money, qty, todayDate } from '../../../data/runtime';

export const reportsApi = {
  async getProfitLoss(filters = {}) {
    await ensureReady();
    const allSales = (await db.getAll('sales')).filter(
      (s) => s.invoice_status !== 'void' && inDateRange(s.created_at, filters.date_from, filters.date_to)
    );
    const allExpenses = (await db.getAll('expenses')).filter(
      (e) => inDateRange(e.created_at, filters.date_from, filters.date_to)
    );

    const totalRevenue = allSales.reduce((sum, s) => sum + money(s.subtotal), 0);
    const totalDiscounts = allSales.reduce((sum, s) => sum + money(s.discount_amount), 0);
    const totalCOGS = allSales.reduce((sum, s) => {
      return sum + (s.items || []).reduce((itemSum, item) => itemSum + money(item.unit_cost) * qty(item.quantity), 0);
    }, 0);
    const totalExpenses = allExpenses.reduce((sum, e) => sum + money(e.amount), 0);
    const subtotal = money(totalRevenue - totalDiscounts);
    const grossProfit = money(subtotal - totalCOGS);
    const netProfit = money(grossProfit - totalExpenses);

    const dateFrom = filters.date_from || allSales[0]?.created_at?.slice(0, 10) || todayDate();
    const dateTo = filters.date_to || allSales[allSales.length - 1]?.created_at?.slice(0, 10) || todayDate();

    return {
      period: { date_from: dateFrom, date_to: dateTo },
      total_revenue: money(totalRevenue),
      total_discounts_given: money(totalDiscounts),
      subtotal: money(subtotal),
      cost_of_goods_sold: money(totalCOGS),
      gross_profit: money(grossProfit),
      gross_margin_percent: subtotal > 0 ? Number(((grossProfit / subtotal) * 100).toFixed(2)) : 0,
      total_operating_expenses: money(totalExpenses),
      net_profit: money(netProfit),
      net_margin_percent: subtotal > 0 ? Number(((netProfit / subtotal) * 100).toFixed(2)) : 0,
      sales_count: allSales.length,
    };
  },

  async getSalesSummary(filters = {}) {
    await ensureReady();
    const allSales = (await db.getAll('sales')).filter(
      (s) => s.invoice_status !== 'void' && inDateRange(s.created_at, filters.date_from, filters.date_to)
    );

    const totalSales = allSales.reduce((sum, s) => sum + money(s.grand_total), 0);
    const totalDiscounts = allSales.reduce((sum, s) => sum + money(s.discount_amount), 0);

    let cash = 0, bank_of_palestine = 0, palpay = 0, jawwal_pay = 0, credit = 0;
    for (const sale of allSales) {
      for (const p of sale.payments || []) {
        const method = p.payment_method || 'cash';
        const amount = money(p.amount);
        if (method === 'cash') cash += amount;
        else if (method === 'bank_of_palestine') bank_of_palestine += amount;
        else if (method === 'palpay') palpay += amount;
        else if (method === 'jawwal_pay') jawwal_pay += amount;
        else if (method === 'credit') credit += amount;
        else credit += amount;
      }
    }

    return {
      total_sales: money(totalSales),
      discount_amount: money(totalDiscounts),
      payments_breakdown: { cash: money(cash), bank_of_palestine: money(bank_of_palestine), palpay: money(palpay), jawwal_pay: money(jawwal_pay), credit: money(credit) },
    };
  },

  async getTopProducts(limit = 10, filters = {}) {
    await ensureReady();
    const allSales = (await db.getAll('sales')).filter(
      (s) => s.invoice_status !== 'void' && inDateRange(s.created_at, filters.date_from, filters.date_to)
    );

    const productMap = {};
    for (const sale of allSales) {
      for (const item of sale.items || []) {
        const pid = item.product_id;
        if (!productMap[pid]) {
          productMap[pid] = {
            product_id: pid,
            product_name: item.product_name || `منتج #${pid}`,
            total_quantity: 0,
            total_revenue: 0,
            total_cost: 0,
          };
        }
        productMap[pid].total_quantity += qty(item.quantity);
        productMap[pid].total_revenue += money(item.subtotal);
        productMap[pid].total_cost += money(item.unit_cost) * qty(item.quantity);
      }
    }

    return Object.values(productMap)
      .map((p) => ({
        ...p,
        total_quantity: String(p.total_quantity),
        total_revenue: money(p.total_revenue),
        total_profit: money(p.total_revenue - p.total_cost),
      }))
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, limit);
  },
};
