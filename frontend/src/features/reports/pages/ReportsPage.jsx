import { useCallback, useEffect, useState } from 'react';
import { reportsApi } from '../api/reportsApi';

const fmt = (n) => parseFloat(String(n || 0)).toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function StatCard({ label, value, sub, color = 'text-white' }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [pl, setPl] = useState(null);
  const [tax, setTax] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pl');

  const loadReports = useCallback(async () => {
    setLoading(true);
    const filters = { date_from: dateFrom || undefined, date_to: dateTo || undefined };
    try {
      const [plData, taxData, topData] = await Promise.all([reportsApi.getProfitLoss(filters), reportsApi.getSalesTax(filters), reportsApi.getTopProducts(10, filters)]);
      setPl(plData); setTax(taxData); setTopProducts(topData);
    } catch (e) { console.error('Error loading reports', e); }
    finally { setLoading(false); }
  }, [dateFrom, dateTo]);

  useEffect(() => { loadReports(); }, [loadReports]);

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-white">التقارير والأرباح</h1><p className="text-gray-400 text-sm mt-1">قائمة الدخل والأرباح وحركة المبيعات</p></div>
        <div className="flex items-center gap-3">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-brand-500" />
          <span className="text-gray-500 text-sm">إلى</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-brand-500" />
          <button onClick={loadReports} disabled={loading} className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 text-sm font-bold disabled:opacity-50">{loading ? '...' : 'تحديث'}</button>
        </div>
      </div>

      <div className="flex gap-1 bg-gray-800 rounded-xl p-1">
        {[{ id: 'pl', label: 'الأرباح' }, { id: 'tax', label: 'المبيعات والضريبة' }, { id: 'top', label: 'أعلى الأصناف' }].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-brand-500 text-slate-950 font-bold shadow' : 'text-gray-400 hover:text-white'}`}>{tab.label}</button>
        ))}
      </div>

      {activeTab === 'pl' && pl && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="إجمالي الإيرادات" value={`${fmt(pl.total_revenue)} ₪`} sub={`${pl.sales_count} فاتورة`} color="text-emerald-400" />
            <StatCard label="تكلفة البضاعة" value={`${fmt(pl.cost_of_goods_sold)} ₪`} color="text-orange-400" />
            <StatCard label="الربح الإجمالي" value={`${fmt(pl.gross_profit)} ₪`} sub={`هامش ${pl.gross_margin_percent}%`} color={pl.gross_profit >= 0 ? 'text-blue-400' : 'text-red-400'} />
            <StatCard label="صافي الربح" value={`${fmt(pl.net_profit)} ₪`} sub={`هامش ${pl.net_margin_percent}%`} color={pl.net_profit >= 0 ? 'text-purple-400' : 'text-red-400'} />
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
            <h3 className="text-base font-bold text-white mb-3">قائمة الدخل</h3>
            <div className="space-y-2">
              {[{ label: 'الإيرادات', value: pl.total_revenue, color: 'text-emerald-400' }, { label: 'الخصومات', value: -pl.total_discounts_given, color: 'text-gray-400' }, { label: 'إيراد صافي', value: pl.subtotal_before_tax, color: 'text-white font-bold', sep: true }, { label: 'تكلفة البضاعة', value: -pl.cost_of_goods_sold, color: 'text-orange-400' }, { label: 'الربح الإجمالي', value: pl.gross_profit, color: pl.gross_profit >= 0 ? 'text-blue-400 font-bold' : 'text-red-400 font-bold', sep: true }, { label: 'المصروفات', value: -pl.total_operating_expenses, color: 'text-red-400' }, { label: 'صافي الربح', value: pl.net_profit, color: pl.net_profit >= 0 ? 'text-purple-400 font-bold text-lg' : 'text-red-400 font-bold text-lg', sep: true }].map((row, i) => (
                <div key={i}>{row.sep && <div className="border-t border-dashed border-gray-700 my-2" />}<div className="flex justify-between"><span className="text-gray-400 text-sm">{row.label}</span><span className={`font-mono text-sm ${row.color}`}>{row.value >= 0 ? '' : '- '}{fmt(Math.abs(row.value))} ₪</span></div></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tax' && tax && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="إجمالي المبيعات" value={`${fmt(tax.total_sales)} ₪`} color="text-emerald-400" />
            <StatCard label="قبل الضريبة" value={`${fmt(tax.taxable_amount)} ₪`} color="text-blue-400" />
            <StatCard label="الضريبة" value={`${fmt(tax.tax_amount)} ₪`} color="text-amber-400" />
            <StatCard label="الخصومات" value={`${fmt(tax.discount_amount)} ₪`} color="text-red-400" />
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-4">توزيع الدفع</h3>
            <div className="space-y-3">
              {[{ label: 'نقداً', value: tax.payments_breakdown.cash }, { label: 'بطاقة', value: tax.payments_breakdown.card }, { label: 'آجل', value: tax.payments_breakdown.credit }].map((item) => {
                const total = tax.payments_breakdown.cash + tax.payments_breakdown.card + tax.payments_breakdown.credit;
                const pct = total > 0 ? (item.value / total) * 100 : 0;
                return <div key={item.label}><div className="flex justify-between text-sm mb-1"><span className="text-gray-300">{item.label}</span><span className="text-white font-mono font-bold">{fmt(item.value)} ₪ ({pct.toFixed(1)}%)</span></div><div className="h-2 bg-gray-800 rounded-full overflow-hidden"><div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} /></div></div>;
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'top' && (
        <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-gray-700"><h3 className="text-base font-bold text-white">أعلى الأصناف مبيعاً</h3></div>
          {topProducts.length === 0 ? <div className="p-10 text-center text-gray-500">لا توجد بيانات</div> : (
            <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-gray-700 text-gray-400 text-xs"><th className="py-3 px-4 text-right">#</th><th className="py-3 px-4 text-right">المنتج</th><th className="py-3 px-4 text-center">الكمية</th><th className="py-3 px-4 text-left">الإيرادات</th><th className="py-3 px-4 text-left">الربح</th></tr></thead>
              <tbody className="divide-y divide-gray-800">{topProducts.map((p, i) => <tr key={p.product_id} className="hover:bg-gray-800/50"><td className="py-3 px-4 text-gray-500 text-xs">{i + 1}</td><td className="py-3 px-4 text-white font-medium">{p.product_name}</td><td className="py-3 px-4 text-center text-gray-300">{Number(p.total_quantity).toFixed(0)}</td><td className="py-3 px-4 text-right text-emerald-400 font-mono">{fmt(p.total_revenue)} ₪</td><td className="py-3 px-4 text-right font-mono"><span className={Number(p.total_profit) >= 0 ? 'text-blue-400' : 'text-red-400'}>{fmt(p.total_profit)} ₪</span></td></tr>)}</tbody></table></div>
          )}
        </div>
      )}
    </div>
  );
}
