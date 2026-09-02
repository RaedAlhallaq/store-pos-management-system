import { useState, useEffect, useCallback } from 'react';
import { productsApi } from '../../products/api/productsApi';
import { StockAdjustmentModal } from '../../products/components/StockAdjustmentModal';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Pagination } from '../../../components/ui/Pagination';
import { EmptyState } from '../../../components/ui/EmptyState';
import {
  PackageCheck, TrendingUp, History, AlertTriangle, ArrowUpRight, ArrowDownRight, Filter,
  DollarSign, Boxes, RefreshCw, Search,
} from 'lucide-react';
import { toast } from 'sonner';

/* ── Skeleton loader ─────────────────────────────────── */
function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 border-b border-slate-800/40 animate-pulse">
      <div className="h-3.5 bg-slate-800 rounded w-28" />
      <div className="h-3.5 bg-slate-800 rounded w-32" />
      <div className="h-5 bg-slate-800 rounded-full w-20" />
      <div className="h-3.5 bg-slate-800 rounded w-14" />
      <div className="h-3.5 bg-slate-800 rounded w-14" />
      <div className="h-3.5 bg-slate-800 rounded w-14" />
      <div className="h-3.5 bg-slate-800 rounded w-24" />
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="space-y-0">
      {[...Array(8)].map((_, i) => <SkeletonRow key={i} />)}
    </div>
  );
}

/* ── Product Picker for stock adjustment ─────────────── */
function ProductPicker({ products, onSelect }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filtered = (products || []).filter((p) => {
    if (!query) return true;
    const term = query.toLowerCase();
    return (p.name || '').toLowerCase().includes(term);
  });

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="ابحث عن صنف لتسوية مخزونه..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          className="w-full bg-slate-950/80 text-slate-100 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 placeholder:text-slate-500"
        />
      </div>
      {isOpen && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-xl">
          {filtered.slice(0, 10).map((product) => {
            const stock = Number(product.stock_quantity);
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => { onSelect(product); setIsOpen(false); setQuery(''); }}
                className="w-full text-right px-4 py-2.5 hover:bg-slate-800 transition-colors flex items-center justify-between gap-3 border-b border-slate-800/50 last:border-0"
              >
                <div className="min-w-0">
                  <span className="font-bold text-sm text-slate-100 block truncate">{product.name}</span>
                </div>
                <span className={`font-mono text-xs font-bold whitespace-nowrap ${stock <= 0 ? 'text-rose-400' : stock <= Number(product.min_stock_alert) ? 'text-amber-400' : 'text-slate-300'}`}>
                  {stock}
                </span>
              </button>
            );
          })}
        </div>
      )}
      {isOpen && filtered.length > 0 && (
        <button
          type="button"
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
          tabIndex={-1}
        />
      )}
    </div>
  );
}

/* ── Main Inventory Page ────────────────────────────── */
export function InventoryPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [selectedType, setSelectedType] = useState('');
  const [adjustingProduct, setAdjustingProduct] = useState(null);

  const [movementsData, setMovementsData] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [productsData, setProductsData] = useState(null);
  const [isMovementsLoading, setIsMovementsLoading] = useState(true);
  const [isMetricsLoading, setIsMetricsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadMovements = useCallback(async () => {
    setIsMovementsLoading(true);
    setError(null);
    try {
      const data = await productsApi.getStockMovements({ page, type: selectedType || undefined, per_page: perPage });
      setMovementsData(data);
    } catch (err) {
      setError(err?.message || 'حدث خطأ أثناء تحميل حركات المخزون');
      toast.error('تعذر تحميل حركات المخزون');
    } finally {
      setIsMovementsLoading(false);
    }
  }, [page, selectedType, perPage]);

  const loadMetrics = useCallback(async () => {
    setIsMetricsLoading(true);
    try {
      const [m, p] = await Promise.all([
        productsApi.getMetrics(),
        productsApi.getProducts({ per_page: 100 }),
      ]);
      setMetrics(m);
      setProductsData(p);
    } catch {
      // metrics are non-critical
    } finally {
      setIsMetricsLoading(false);
    }
  }, []);

  useEffect(() => { loadMovements(); }, [loadMovements]);
  useEffect(() => { loadMetrics(); }, [loadMetrics]);

  const refreshAll = async () => {
    await Promise.all([loadMovements(), loadMetrics()]);
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'initial': return <Badge variant="info">رصيد افتتاحي</Badge>;
      case 'purchase': return <Badge variant="success">توريد (+)</Badge>;
      case 'sale': return <Badge variant="neutral">مبيعات (-)</Badge>;
      case 'damage': return <Badge variant="danger">تالف (-)</Badge>;
      case 'adjustment': return <Badge variant="warning">تسوية</Badge>;
      case 'sale_return': return <Badge variant="info">مرتجع بيع (+)</Badge>;
      case 'purchase_return': return <Badge variant="danger">مرتجع شراء (-)</Badge>;
      default: return <Badge>{type}</Badge>;
    }
  };

  const handleAdjust = async (productId, data) => {
    await productsApi.adjustStock(productId, data);
    await refreshAll();
  };

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <PackageCheck className="w-6 h-6 text-brand-400" />
            <span>المخزون وحركة المواد</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            مراقبة أرصدة المستودع، تقييم رأس المال المخزني، وسجل التدقيق التفصيلي للحركات
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshAll}
          rightIcon={<RefreshCw className="w-4 h-4" />}
        >
          تحديث
        </Button>
      </div>

      {/* ── KPI Cards ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="p-3 md:p-4 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-semibold text-slate-400">إجمالي القطع</p>
              <p className="text-lg md:text-xl font-bold text-slate-100 font-mono mt-0.5">
                {isMetricsLoading ? '—' : (metrics?.total_quantity ?? 0).toLocaleString('en-US', { maximumFractionDigits: 3 })}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5 hidden sm:block">في جميع الأصناف</p>
            </div>
            <div className="p-2.5 md:p-3 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Boxes className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-3 md:p-4 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-semibold text-slate-400">قيمة المخزون (التكلفة)</p>
              <p className="text-lg md:text-xl font-bold text-emerald-400 font-mono mt-0.5">
                {isMetricsLoading ? '—' : (metrics?.total_cost_value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} ₪
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5 hidden sm:block">رأس المال المحجوز</p>
            </div>
            <div className="p-2.5 md:p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-3 md:p-4 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-semibold text-slate-400">القيمة بالبيع</p>
              <p className="text-lg md:text-xl font-bold text-sky-400 font-mono mt-0.5">
                {isMetricsLoading ? '—' : (metrics?.total_retail_value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} ₪
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5 hidden sm:block">الإيراد المتوقع</p>
            </div>
            <div className="p-2.5 md:p-3 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-3 md:p-4 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-semibold text-slate-400">أصناف تحت حد الطلب</p>
              <p className="text-lg md:text-xl font-bold text-amber-400 font-mono mt-0.5">
                {isMetricsLoading ? '—' : `${metrics?.low_stock_count ?? 0} صنف`}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5 hidden sm:block">بحاجة للتوريد</p>
            </div>
            <div className="p-2.5 md:p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* ── Product Stock Adjustment Picker ────────── */}
      <Card className="p-4 bg-slate-900/60 border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-200 mb-3">
          <PackageCheck className="w-4 h-4 text-brand-400" />
          <span>تسوية مخزون صنف</span>
        </div>
        <ProductPicker
          products={productsData?.data || []}
          onSelect={(product) => setAdjustingProduct(product)}
        />
      </Card>

      {/* ── Movement Ledger Header + Filter ────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <History className="w-4 h-4 text-brand-400" />
          <span>سجل حركات المخزون (Stock Movement Ledger)</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedType}
            onChange={(e) => { setSelectedType(e.target.value); setPage(1); }}
            className="bg-slate-950/90 text-slate-200 border border-slate-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          >
            <option value="">جميع الحركات</option>
            <option value="initial">أرصدة افتتاحية</option>
            <option value="purchase">توريد مشتريات</option>
            <option value="sale">مبيعات نقاط البيع</option>
            <option value="damage">تالف ومنتهي الصلاحية</option>
            <option value="adjustment">تسويات جردية</option>
            <option value="sale_return">مرتجع مبيعات</option>
            <option value="purchase_return">مرتجع مشتريات</option>
          </select>
          <select
            value={perPage}
            onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
            className="bg-slate-950/90 text-slate-200 border border-slate-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          >
            <option value={15}>15 / صفحة</option>
            <option value={30}>30 / صفحة</option>
            <option value={50}>50 / صفحة</option>
          </select>
        </div>
      </div>

      {/* ── Movements Table ────────────────────────── */}
      <Card className="overflow-hidden border-slate-800 bg-slate-900/70">
        {isMovementsLoading ? (
          <SkeletonTable />
        ) : error ? (
          <div className="py-16 flex flex-col items-center justify-center gap-4">
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <AlertTriangle className="w-8 h-8 text-rose-400" />
            </div>
            <p className="text-sm text-slate-300 font-semibold">{error}</p>
            <Button variant="outline" size="sm" onClick={loadMovements} rightIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              إعادة المحاولة
            </Button>
          </div>
        ) : !movementsData?.data || movementsData.data.length === 0 ? (
          <EmptyState
            title="لا توجد حركات مخزون مسجلة"
            description="ستظهر هنا كافة حركات البيع، الشراء، التسويات، والأرصدة الافتتاحية للمنتجات"
          />
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold select-none">
                    <th className="py-3.5 px-4 hidden sm:table-cell">التاريخ والوقت</th>
                    <th className="py-3.5 px-4">الصنف</th>
                    <th className="py-3.5 px-4 hidden md:table-cell">نوع الحركة</th>
                    <th className="py-3.5 px-4">الكمية</th>
                    <th className="py-3.5 px-4 hidden lg:table-cell">قبل</th>
                    <th className="py-3.5 px-4 hidden lg:table-cell">بعد</th>
                    <th className="py-3.5 px-4 hidden md:table-cell">المستخدم / البيان</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {movementsData.data.map((movement) => {
                    const qty = Number(movement.quantity);
                    const isPositive = qty > 0;
                    return (
                      <tr key={movement.id} className="hover:bg-slate-800/40 transition-colors">
                        {/* Date — hidden on mobile */}
                        <td className="py-3 px-4 font-mono text-slate-400 text-[11px] hidden sm:table-cell whitespace-nowrap">
                          {movement.created_at
                            ? new Date(movement.created_at).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })
                            : '—'}
                        </td>

                        {/* Product */}
                        <td className="py-3 px-4">
                          <div>
                            <span className="font-bold text-slate-100 text-sm block">{movement.product_name || 'صنف غير معرف'}</span>

                            {/* Show date inline on mobile */}
                            <span className="text-[10px] text-slate-500 sm:hidden block mt-0.5">
                              {movement.created_at
                                ? new Date(movement.created_at).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })
                                : ''}
                            </span>
                          </div>
                        </td>

                        {/* Type badge — hidden on mobile, show inline on mobile */}
                        <td className="py-3 px-4 hidden md:table-cell">{getTypeBadge(movement.type)}</td>

                        {/* Quantity */}
                        <td className="py-3 px-4 font-mono font-bold">
                          <span className={`inline-flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                            <span>{isPositive ? `+${qty}` : qty}</span>
                          </span>
                          {/* Show type badge inline on mobile */}
                          <span className="md:hidden ms-2">{getTypeBadge(movement.type)}</span>
                        </td>

                        {/* Balance before — hidden on mobile */}
                        <td className="py-3 px-4 font-mono text-slate-400 font-semibold hidden lg:table-cell">{movement.balance_before}</td>

                        {/* Balance after — hidden on mobile */}
                        <td className="py-3 px-4 font-mono font-bold text-slate-100 hidden lg:table-cell">{movement.balance_after}</td>

                        {/* User / Notes — hidden on mobile */}
                        <td className="py-3 px-4 hidden md:table-cell">
                          <div>
                            <span className="text-slate-300 font-medium block">{movement.user_name || 'النظام'}</span>
                            {movement.notes && (
                              <span className="text-[11px] text-slate-500 block truncate max-w-[200px]" title={movement.notes}>
                                {movement.notes}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {movementsData.meta && movementsData.meta.last_page > 1 && (
              <div className="px-4 border-t border-slate-800">
                <Pagination
                  currentPage={movementsData.meta.current_page}
                  lastPage={movementsData.meta.last_page}
                  total={movementsData.meta.total}
                  from={movementsData.meta.from ?? 1}
                  to={movementsData.meta.to ?? movementsData.meta.total}
                  onPageChange={(p) => setPage(p)}
                />
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ── Stock Adjustment Modal ─────────────────── */}
      {adjustingProduct && (
        <StockAdjustmentModal
          isOpen={!!adjustingProduct}
          onClose={() => setAdjustingProduct(null)}
          product={adjustingProduct}
          onAdjust={handleAdjust}
        />
      )}
    </div>
  );
}
