import { useCallback, useEffect, useState } from 'react';
import { reportsApi } from '../api/reportsApi';
import { Button } from '../../../components/ui/Button';
import {
  BarChart3,
  Calendar,
  DollarSign,
  RefreshCw,
  ShoppingBag,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Package,
  Wallet,
  Receipt,
} from 'lucide-react';
import { fmtLocale } from '../../../lib/utils';

const fmt = fmtLocale;

/* ── Stat Card ──────────────────────────────────── */
function StatCard({ label, value, sub, color = 'text-white', icon: Icon, isLoading }) {
  return (
    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] md:text-xs font-semibold text-slate-400">{label}</p>
          {isLoading ? (
            <div className="h-7 w-20 mt-1.5 bg-slate-800 rounded-lg animate-pulse" />
          ) : (
            <p className={`text-lg md:text-xl font-bold font-mono mt-1 ${color}`}>{value}</p>
          )}
          {sub && !isLoading && <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl border ${color.includes('emerald') ? 'bg-emerald-500/10 border-emerald-500/20' : color.includes('red') || color.includes('rose') ? 'bg-rose-500/10 border-rose-500/20' : color.includes('amber') ? 'bg-amber-500/10 border-amber-500/20' : color.includes('blue') ? 'bg-blue-500/10 border-blue-500/20' : color.includes('purple') ? 'bg-purple-500/10 border-purple-500/20' : 'bg-brand-500/10 border-brand-500/20'}`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Reports Page ──────────────────────────── */
export function ReportsPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [pl, setPl] = useState(null);
  const [tax, setTax] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [activeTab, setActiveTab] = useState('pl');

  const loadReports = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const filters = { date_from: dateFrom || undefined, date_to: dateTo || undefined };
    try {
      const [plData, taxData, topData] = await Promise.all([
        reportsApi.getProfitLoss(filters),
        reportsApi.getSalesTax(filters),
        reportsApi.getTopProducts(10, filters),
      ]);
      setPl(plData);
      setTax(taxData);
      setTopProducts(topData);
    } catch (e) {
      setLoadError(e?.message || 'حدث خطأ أثناء تحميل التقارير');
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { loadReports(); }, [loadReports]);

  const applyPreset = (preset) => {
    const today = new Date();
    const toStr = (d) => d.toISOString().slice(0, 10);
    if (preset === 'today') {
      setDateFrom(toStr(today));
      setDateTo(toStr(today));
    } else if (preset === 'week') {
      const start = new Date(today);
      start.setDate(today.getDate() - today.getDay());
      setDateFrom(toStr(start));
      setDateTo(toStr(today));
    } else if (preset === 'month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      setDateFrom(toStr(start));
      setDateTo(toStr(today));
    } else if (preset === 'clear') {
      setDateFrom('');
      setDateTo('');
    }
  };

  const hasDateFilter = dateFrom || dateTo;

  const tabs = [
    { id: 'pl', label: 'الأرباح', icon: TrendingUp },
    { id: 'tax', label: 'المبيعات والضريبة', icon: Receipt },
    { id: 'top', label: 'أعلى الأصناف', icon: Package },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand-400" />
            <span>التقارير والأرباح</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            قائمة الدخل والأرباح وحركة المبيعات
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadReports} disabled={loading} className="gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">تحديث</span>
          </Button>
        </div>
      </div>

      {/* Date Filters */}
      <div className="bg-slate-900/60 p-3 sm:p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-slate-400 font-semibold flex items-center gap-1 text-xs">
            <Calendar className="w-3.5 h-3.5 text-brand-400" />
            <span>نطاق التاريخ:</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs">من:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs">إلى:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500/50"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button type="button" onClick={() => applyPreset('today')} className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors">اليوم</button>
            <button type="button" onClick={() => applyPreset('week')} className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors">هذا الأسبوع</button>
            <button type="button" onClick={() => applyPreset('month')} className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors">هذا الشهر</button>
            {hasDateFilter && (
              <button type="button" onClick={() => applyPreset('clear')} className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors">مسح</button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-slate-900 rounded-xl p-1 border border-slate-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${activeTab === tab.id ? 'bg-brand-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Error State */}
      {loadError && (
        <div className="bg-slate-900/70 border border-rose-500/30 rounded-2xl p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-200 mb-1">فشل تحميل التقارير</h3>
          <p className="text-sm text-slate-400 mb-4">{loadError}</p>
          <Button onClick={loadReports} variant="outline" className="gap-1.5">
            <RefreshCw className="w-4 h-4" />
            إعادة المحاولة
          </Button>
        </div>
      )}

      {/* ── Profit & Loss Tab ──────────────────────── */}
      {activeTab === 'pl' && !loadError && (
        <div className="space-y-5">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="إجمالي الإيرادات" value={`${fmt(pl?.total_revenue)} ₪`} sub={`${pl?.sales_count ?? 0} فاتورة`} color="text-emerald-400" icon={DollarSign} isLoading={loading} />
            <StatCard label="تكلفة البضاعة (COGS)" value={`${fmt(pl?.cost_of_goods_sold)} ₪`} color="text-orange-400" icon={ShoppingBag} isLoading={loading} />
            <StatCard label="الربح الإجمالي" value={`${fmt(pl?.gross_profit)} ₪`} sub={`هامش ${pl?.gross_margin_percent ?? 0}%`} color={(pl?.gross_profit ?? 0) >= 0 ? 'text-blue-400' : 'text-rose-400'} icon={(pl?.gross_profit ?? 0) >= 0 ? TrendingUp : TrendingDown} isLoading={loading} />
            <StatCard label="صافي الربح" value={`${fmt(pl?.net_profit)} ₪`} sub={`هامش ${pl?.net_margin_percent ?? 0}%`} color={(pl?.net_profit ?? 0) >= 0 ? 'text-purple-400' : 'text-rose-400'} icon={(pl?.net_profit ?? 0) >= 0 ? TrendingUp : TrendingDown} isLoading={loading} />
          </div>

          {/* Income Statement */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-brand-400" />
              قائمة الدخل
            </h3>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between animate-pulse">
                    <div className="h-4 bg-slate-800 rounded w-24" />
                    <div className="h-4 bg-slate-800 rounded w-28" />
                  </div>
                ))}
              </div>
            ) : pl ? (
              <div className="space-y-2">
                {[
                  { label: 'الإيرادات (قبل الخصم)', value: pl.total_revenue, color: 'text-emerald-400' },
                  { label: 'الخصومات', value: -pl.total_discounts_given, color: 'text-slate-400' },
                  { label: 'إيراد صافي', value: pl.subtotal_before_tax, color: 'text-white font-bold', sep: true },
                  { label: 'تكلفة البضاعة المباعة (COGS)', value: -pl.cost_of_goods_sold, color: 'text-orange-400' },
                  { label: 'الربح الإجمالي', value: pl.gross_profit, color: pl.gross_profit >= 0 ? 'text-blue-400 font-bold' : 'text-rose-400 font-bold', sep: true },
                  { label: 'المصروفات التشغيلية', value: -pl.total_operating_expenses, color: 'text-rose-400' },
                  { label: 'صافي الربح', value: pl.net_profit, color: pl.net_profit >= 0 ? 'text-purple-400 font-bold text-lg' : 'text-rose-400 font-bold text-lg', sep: true },
                ].map((row, i) => (
                  <div key={i}>
                    {row.sep && <div className="border-t border-dashed border-slate-700 my-2" />}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">{row.label}</span>
                      <span className={`font-mono text-sm ${row.color}`}>
                        {row.value >= 0 ? '' : '- '}{fmt(Math.abs(row.value))} ₪
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ── Sales & Tax Tab ────────────────────────── */}
      {activeTab === 'tax' && !loadError && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="إجمالي المبيعات" value={`${fmt(tax?.total_sales)} ₪`} color="text-emerald-400" icon={DollarSign} isLoading={loading} />
            <StatCard label="المبلغ الخاضع للضريبة" value={`${fmt(tax?.taxable_amount)} ₪`} color="text-blue-400" icon={Receipt} isLoading={loading} />
            <StatCard label="ضريبة القيمة المضافة" value={`${fmt(tax?.tax_amount)} ₪`} color="text-amber-400" icon={Wallet} isLoading={loading} />
            <StatCard label="الخصومات" value={`${fmt(tax?.discount_amount)} ₪`} color="text-rose-400" icon={TrendingDown} isLoading={loading} />
          </div>

          {/* Payment Breakdown */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-brand-400" />
              توزيع الدفع حسب الطريقة
            </h3>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse space-y-1">
                    <div className="flex justify-between"><div className="h-3 bg-slate-800 rounded w-16" /><div className="h-3 bg-slate-800 rounded w-24" /></div>
                    <div className="h-2 bg-slate-800 rounded-full w-full" />
                  </div>
                ))}
              </div>
            ) : tax ? (
              <div className="space-y-4">
                {[
                  { label: 'نقداً', value: tax.payments_breakdown.cash, color: 'bg-emerald-500' },
                  { label: 'بطاقة / شبكة', value: tax.payments_breakdown.card, color: 'bg-sky-500' },
                  { label: 'آجل (ذمة)', value: tax.payments_breakdown.credit, color: 'bg-amber-500' },
                  { label: 'دفع متعدد / مجزأ', value: tax.payments_breakdown.split || 0, color: 'bg-purple-500' },
                ].map((item) => {
                  const total = (tax.payments_breakdown.cash || 0) + (tax.payments_breakdown.card || 0) + (tax.payments_breakdown.credit || 0) + (tax.payments_breakdown.split || 0);
                  const pct = total > 0 ? (item.value / total) * 100 : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-slate-300">{item.label}</span>
                        <span className="text-slate-200 font-mono font-bold">{fmt(item.value)} ₪ <span className="text-slate-500 text-xs font-normal">({pct.toFixed(1)}%)</span></span>
                      </div>
                      <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${item.color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ── Top Products Tab ───────────────────────── */}
      {activeTab === 'top' && !loadError && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-800">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-brand-400" />
              أعلى الأصناف مبيعاً (حسب الإيراد)
            </h3>
          </div>
          {loading ? (
            <div className="divide-y divide-slate-800/50">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5 animate-pulse">
                  <div className="h-4 bg-slate-800 rounded w-6" />
                  <div className="h-4 bg-slate-800 rounded w-32" />
                  <div className="h-4 bg-slate-800 rounded w-16" />
                  <div className="h-4 bg-slate-800 rounded w-20" />
                  <div className="h-4 bg-slate-800 rounded w-20" />
                </div>
              ))}
            </div>
          ) : topProducts.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              <Package className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-sm">لا توجد بيانات مبيعات</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold select-none">
                    <th className="py-3 px-4 text-right w-10">#</th>
                    <th className="py-3 px-4 text-right">المنتج</th>
                    <th className="py-3 px-4 text-center">الكمية</th>
                    <th className="py-3 px-4 text-right">الإيرادات</th>
                    <th className="py-3 px-4 text-right">التكلفة</th>
                    <th className="py-3 px-4 text-right">الربح</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {topProducts.map((p, i) => (
                    <tr key={p.product_id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 text-slate-500 text-xs font-mono">{i + 1}</td>
                      <td className="py-3 px-4 text-slate-100 font-medium">{p.product_name}</td>
                      <td className="py-3 px-4 text-center text-slate-300 font-mono">{Number(p.total_quantity).toFixed(0)}</td>
                      <td className="py-3 px-4 text-right text-emerald-400 font-mono font-bold">{fmt(p.total_revenue)} ₪</td>
                      <td className="py-3 px-4 text-right text-orange-400 font-mono">{fmt(p.total_cost)} ₪</td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span className={Number(p.total_profit) >= 0 ? 'text-blue-400' : 'text-rose-400'}>{fmt(p.total_profit)} ₪</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
