import { useState, useEffect, useCallback } from 'react';
import { purchasesApi } from '../api/purchasesApi';
import { suppliersApi } from '../../suppliers/api/suppliersApi';
import { productsApi } from '../../products/api/productsApi';
import { PurchaseModal } from '../components/PurchaseModal';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Pagination } from '../../../components/ui/Pagination';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ShoppingBag, Plus, Search, Calendar, Ban, DollarSign, TrendingDown, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

/* ── Skeleton ─────────────────────────────────────── */
function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 border-b border-slate-800/40 animate-pulse">
      <div className="h-3.5 bg-slate-800 rounded w-24" />
      <div className="h-3.5 bg-slate-800 rounded w-28" />
      <div className="h-3.5 bg-slate-800 rounded w-20" />
      <div className="h-3.5 bg-slate-800 rounded w-16" />
      <div className="h-5 bg-slate-800 rounded-full w-16" />
    </div>
  );
}

function SkeletonTable() {
  return <div className="space-y-0">{[...Array(6)].map((_, i) => <SkeletonRow key={i} />)}</div>;
}

/* ── Void Confirmation Modal ──────────────────────── */
function VoidConfirmModal({ isOpen, onClose, onConfirm, invoiceNumber }) {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!reason.trim()) {
      toast.error('يرجى كتابة سبب الإلغاء');
      return;
    }
    onConfirm(reason.trim());
    setReason('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <Ban className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">إلغاء فاتورة الشراء</h3>
            <p className="text-[11px] text-slate-400">رقم الفاتورة: {invoiceNumber}</p>
          </div>
        </div>
        <p className="text-xs text-slate-300">
          سيتم عكس رصيد المخزون لجميع الأصناف المورة بهذه الفاتورة. هذا الإجراء لا يمكن التراجع عنه.
        </p>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="سبب الإلغاء (إلزامي)..."
          className="w-full bg-slate-950/80 text-slate-100 border border-slate-700 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 placeholder:text-slate-500"
          autoFocus
        />
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => { setReason(''); onClose(); }}>
            تراجع
          </Button>
          <Button size="sm" onClick={handleSubmit} className="bg-rose-600 hover:bg-rose-700 text-white">
            <Ban className="w-3.5 h-3.5 ms-1" />
            تأكيد الإلغاء
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Purchases Page ──────────────────────────── */
export function PurchasesPage() {
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [purchaseStatus, setPurchaseStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  // Void state
  const [voidTarget, setVoidTarget] = useState(null);

  const [purchasesData, setPurchasesData] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [productsData, setProductsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await purchasesApi.getPurchases({
        page,
        search: search || undefined,
        payment_status: paymentStatus || undefined,
        purchase_status: purchaseStatus || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        per_page: perPage,
      });
      setPurchasesData(data);
    } catch (err) {
      setError(err?.message || 'حدث خطأ أثناء تحميل فواتير الشراء');
      toast.error('تعذر تحميل فواتير الشراء');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, paymentStatus, purchaseStatus, dateFrom, dateTo, perPage]);

  const loadMeta = useCallback(async () => {
    try {
      const [s, p] = await Promise.all([
        suppliersApi.getQuickList(),
        productsApi.getProducts({ per_page: 250 }),
      ]);
      setSuppliers(s);
      setProductsData(p);
    } catch {
      // meta is non-critical
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { loadMeta(); }, [loadMeta]);

  const refreshAll = async () => { await Promise.all([loadData(), loadMeta()]); };

  const handleSavePurchase = async (payload) => {
    setIsSaving(true);
    try {
      await purchasesApi.createPurchase(payload);
      toast.success('تم تسجيل فاتورة المشتريات وزيادة المخزون بنجاح');
      setIsPurchaseModalOpen(false);
      await refreshAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'فشلت إضافة فاتورة المشتريات');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVoidConfirm = async (reason) => {
    if (!voidTarget) return;
    try {
      await purchasesApi.voidPurchase(voidTarget.id, reason);
      toast.success('تم إلغاء فاتورة المشتريات وعكس رصيد المخزون بنجاح');
      setVoidTarget(null);
      await refreshAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'فشل إلغاء فاتورة الشراء');
    }
  };

  const activeFilters = [search, paymentStatus, purchaseStatus, dateFrom, dateTo].filter(Boolean).length;

  const clearFilters = () => {
    setSearch('');
    setPaymentStatus('');
    setPurchaseStatus('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-brand-400" />
            <span>المشتريات والتوريد</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            تسجيل فواتير الشراء من الموردين، زيادة كميات المخزون، وتحديث أسعار التكلفة
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshAll} rightIcon={<RefreshCw className="w-4 h-4" />}>
            تحديث
          </Button>
          <Button onClick={() => setIsPurchaseModalOpen(true)} rightIcon={<Plus className="w-4 h-4" />}>
            فاتورة شراء جديدة
          </Button>
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <Card className="p-3 md:p-4 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-semibold text-slate-400">إجمالي فواتير الشراء</p>
              <p className="text-lg md:text-xl font-bold text-slate-100 font-mono mt-0.5">
                {purchasesData?.meta?.total ?? 0} فاتورة
              </p>
            </div>
            <div className="p-2.5 md:p-3 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <ShoppingBag className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-3 md:p-4 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-semibold text-slate-400">إجمالي المشتريات (الصفحة)</p>
              <p className="text-lg md:text-xl font-bold text-emerald-400 font-mono mt-0.5">
                {purchasesData?.data?.reduce((sum, p) => sum + Number(p.grand_total), 0).toFixed(2) || '0.00'} ₪
              </p>
            </div>
            <div className="p-2.5 md:p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-3 md:p-4 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-semibold text-slate-400">فواتير شراء آجلة</p>
              <p className="text-lg md:text-xl font-bold text-amber-400 font-mono mt-0.5">
                {purchasesData?.data?.filter((p) => p.payment_status === 'due' || p.payment_status === 'partial').length || 0} فاتورة
              </p>
            </div>
            <div className="p-2.5 md:p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <TrendingDown className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* ── Filters ────────────────────────────────── */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="relative md:col-span-5">
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="ابحث برقم الفاتورة، اسم المورد..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-slate-950/80 text-slate-100 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 placeholder:text-slate-500"
            />
          </div>
          <div className="md:col-span-3">
            <select
              value={paymentStatus}
              onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}
              className="w-full bg-slate-950/80 text-slate-100 border border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            >
              <option value="">جميع حالات السداد</option>
              <option value="paid">مسددة بالكامل</option>
              <option value="partial">مسددة جزئياً</option>
              <option value="due">آجلة</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <select
              value={purchaseStatus}
              onChange={(e) => { setPurchaseStatus(e.target.value); setPage(1); }}
              className="w-full bg-slate-950/80 text-slate-100 border border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            >
              <option value="">جميع حالات التوريد</option>
              <option value="completed">مستلمة</option>
              <option value="void">ملغاة</option>
            </select>
          </div>
          <div className="md:col-span-1 flex items-center justify-end">
            {activeFilters > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-colors whitespace-nowrap"
              >
                <span>مسح ({activeFilters})</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-brand-400" />
            <span>نطاق التاريخ:</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">من:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">إلى:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500/50"
            />
          </div>
          <div className="ms-auto flex items-center gap-2">
            <span className="text-slate-500">عرض:</span>
            <select
              value={perPage}
              onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
              className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500/50"
            >
              <option value={15}>15</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Table Card ─────────────────────────────── */}
      <Card className="overflow-hidden border-slate-800 bg-slate-900/70">
        {isLoading ? (
          <SkeletonTable />
        ) : error ? (
          <div className="py-16 flex flex-col items-center justify-center gap-4">
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <AlertTriangle className="w-8 h-8 text-rose-400" />
            </div>
            <p className="text-sm text-slate-300 font-semibold">{error}</p>
            <Button variant="outline" size="sm" onClick={loadData} rightIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              إعادة المحاولة
            </Button>
          </div>
        ) : !purchasesData?.data || purchasesData.data.length === 0 ? (
          <EmptyState
            title="لا توجد فواتير مشتريات مسجلة"
            description="يمكنك تسجيل فواتير شراء جديدة لإضافة كميات إلى المخزون"
            actionLabel="تسجيل فاتورة شراء"
            onAction={() => setIsPurchaseModalOpen(true)}
          />
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold select-none">
                    <th className="py-3.5 px-4">رقم الفاتورة</th>
                    <th className="py-3.5 px-4 hidden md:table-cell">المورد</th>
                    <th className="py-3.5 px-4 hidden sm:table-cell">التاريخ</th>
                    <th className="py-3.5 px-4">الإجمالي</th>
                    <th className="py-3.5 px-4 hidden sm:table-cell">المدفوع / المستحق</th>
                    <th className="py-3.5 px-4">السداد</th>
                    <th className="py-3.5 px-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {purchasesData.data.map((purchase) => {
                    const isCancelled = purchase.purchase_status === 'void';
                    return (
                      <tr
                        key={purchase.id}
                        className={`hover:bg-slate-800/40 transition-colors ${isCancelled ? 'opacity-50 bg-rose-950/10' : ''}`}
                      >
                        {/* Invoice Number */}
                        <td className="py-3.5 px-4">
                          <div>
                            <span className="font-mono font-bold text-slate-100 text-sm block">
                              {purchase.invoice_number || purchase.id}
                            </span>
                            {/* Show supplier inline on mobile */}
                            <span className="text-[11px] text-slate-400 md:hidden block mt-0.5">
                              {purchase.supplier_name || purchase.supplier?.name || 'مورد عام'}
                            </span>
                            {isCancelled && <Badge variant="danger" size="sm">ملغاة</Badge>}
                          </div>
                        </td>

                        {/* Supplier — hidden on mobile */}
                        <td className="py-3.5 px-4 hidden md:table-cell">
                          <span className="text-slate-200 font-medium">
                            {purchase.supplier_name || purchase.supplier?.name || 'مورد عام'}
                          </span>
                        </td>

                        {/* Date — hidden on small screens */}
                        <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap hidden sm:table-cell">
                          {purchase.created_at ? new Date(purchase.created_at).toLocaleDateString('ar-SA') : '—'}
                        </td>

                        {/* Grand Total */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-100 text-sm">
                          {Number(purchase.grand_total).toFixed(2)} ₪
                        </td>

                        {/* Paid / Due — hidden on small */}
                        <td className="py-3.5 px-4 font-mono hidden sm:table-cell">
                          <div>
                            <span className="text-emerald-400 font-semibold">
                              {Number(purchase.paid_amount).toFixed(2)} ₪
                            </span>
                            {Number(purchase.due_amount) > 0 && (
                              <span className="text-[11px] text-amber-400 block font-bold">
                                آجل: {Number(purchase.due_amount).toFixed(2)} ₪
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Payment Status */}
                        <td className="py-3.5 px-4">
                          {purchase.payment_status === 'paid' ? (
                            <Badge variant="success">مسددة</Badge>
                          ) : purchase.payment_status === 'partial' ? (
                            <Badge variant="warning">جزئية</Badge>
                          ) : (
                            <Badge variant="danger">آجلة</Badge>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {!isCancelled && (
                              <Button
                                variant="ghost"
                                size="sm"
                                title="إلغاء فاتورة الشراء"
                                onClick={() => setVoidTarget(purchase)}
                                className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 p-1.5"
                              >
                                <Ban className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {purchasesData.meta && purchasesData.meta.last_page > 1 && (
              <div className="px-4 border-t border-slate-800">
                <Pagination
                  currentPage={purchasesData.meta.current_page}
                  lastPage={purchasesData.meta.last_page}
                  total={purchasesData.meta.total}
                  from={purchasesData.meta.from ?? 1}
                  to={purchasesData.meta.to ?? purchasesData.meta.total}
                  onPageChange={(p) => setPage(p)}
                />
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ── Purchase Modal ─────────────────────────── */}
      {isPurchaseModalOpen && (
        <PurchaseModal
          isOpen={isPurchaseModalOpen}
          onClose={() => setIsPurchaseModalOpen(false)}
          suppliers={suppliers}
          products={productsData?.data || []}
          onSave={handleSavePurchase}
          isLoading={isSaving}
        />
      )}

      {/* ── Void Confirmation ──────────────────────── */}
      <VoidConfirmModal
        isOpen={!!voidTarget}
        onClose={() => setVoidTarget(null)}
        onConfirm={handleVoidConfirm}
        invoiceNumber={voidTarget?.invoice_number || voidTarget?.id || ''}
      />
    </div>
  );
}
