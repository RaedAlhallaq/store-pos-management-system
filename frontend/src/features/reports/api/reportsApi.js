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
    const subtotalBeforeTax = money(totalRevenue - totalDiscounts);
    const grossProfit = money(subtotalBeforeTax - totalCOGS);
    const netProfit = money(grossProfit - totalExpenses);

    const dateFrom = filters.date_from || allSales[0]?.created_at?.slice(0, 10) || todayDate();
    const dateTo = filters.date_to || allSales[allSales.length - 1]?.created_at?.slice(0, 10) || todayDate();

    return {
      period: { date_from: dateFrom, date_to: dateTo },
      total_revenue: money(totalRevenue),
      total_discounts_given: money(totalDiscounts),
      subtotal_before_tax: money(subtotalBeforeTax),
      cost_of_goods_sold: money(totalCOGS),
      gross_profit: money(grossProfit),
      gross_margin_percent: subtotalBeforeTax > 0 ? Number(((grossProfit / subtotalBeforeTax) * 100).toFixed(2)) : 0,
      total_operating_expenses: money(totalExpenses),
      net_profit: money(netProfit),
      net_margin_percent: subtotalBeforeTax > 0 ? Number(((netProfit / subtotalBeforeTax) * 100).toFixed(2)) : 0,
      sales_count: allSales.length,
    };
  },

  async getSalesTax(filters = {}) {
    await ensureReady();
    const allSales = (await db.getAll('sales')).filter(
      (s) => s.invoice_status !== 'void' && inDateRange(s.created_at, filters.date_from, filters.date_to)
    );

    const totalSales = allSales.reduce((sum, s) => sum + money(s.grand_total), 0);
    const totalTax = allSales.reduce((sum, s) => sum + money(s.tax_amount), 0);
    const totalDiscounts = allSales.reduce((sum, s) => sum + money(s.discount_amount), 0);
    const taxableAmount = money(totalSales - totalTax);

    let cash = 0, card = 0, credit = 0, split = 0;
    for (const sale of allSales) {
      const method = sale.payment_method || 'cash';
      if (method === 'cash') cash += money(sale.grand_total);
      else if (method === 'card') card += money(sale.grand_total);
      else if (method === 'multiple' || method === 'split') split += money(sale.grand_total);
      else credit += money(sale.grand_total);
    }

    return {
      total_sales: money(totalSales),
      taxable_amount: money(taxableAmount),
      tax_amount: money(totalTax),
      discount_amount: money(totalDiscounts),
      payments_breakdown: { cash: money(cash), card: money(card), credit: money(credit), split: money(split) },
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
