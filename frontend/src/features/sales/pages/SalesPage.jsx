import { useCallback, useEffect, useState } from 'react';
import { posApi } from '../../pos/api/posApi';
import { ReceiptModal } from '../../pos/components/ReceiptModal';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Pagination } from '../../../components/ui/Pagination';
import { EmptyState } from '../../../components/ui/EmptyState';
import {
  Receipt,
  Search,
  Printer,
  Ban,
  Calendar,
  RefreshCw,
  X,
  DollarSign,
  AlertTriangle,
  CreditCard,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

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
            <h3 className="font-bold text-slate-100 text-sm">إلغاء فاتورة المبيعات</h3>
            <p className="text-[11px] text-slate-400">رقم الفاتورة: {invoiceNumber}</p>
          </div>
        </div>
        <p className="text-xs text-slate-300">
          سيتم عكس رصيد المخزون لجميع الأصناف، وعكس أي مبالغ آجلة من حساب العميل، وتحديث أرصدة جلسة الصندوق. هذا الإجراء لا يمكن التراجع عنه.
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

/* ── Main Sales Page ──────────────────────────────── */
export function SalesPage() {
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [perPage, setPerPage] = useState(15);
  const [page, setPage] = useState(1);
  const [viewingSale, setViewingSale] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Void state
  const [voidTarget, setVoidTarget] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await posApi.getSales({
        page,
        search: search || undefined,
        payment_status: paymentStatus || undefined,
        invoice_status: invoiceStatus || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        per_page: perPage,
      });
      setSalesData(data);
    } catch (err) {
      setLoadError(err?.message || 'حدث خطأ أثناء تحميل الفواتير');
      toast.error('تعذر تحميل فواتير المبيعات');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, paymentStatus, invoiceStatus, dateFrom, dateTo, perPage]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleVoidConfirm = async (reason) => {
    if (!voidTarget) return;
    try {
      await posApi.voidSale(voidTarget.id, reason);
      toast.success('تم إلغاء الفاتورة وعكس رصيد المخزون بنجاح');
      setVoidTarget(null);
      await loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'فشل إلغاء الفاتورة');
    }
  };

  const sales = salesData?.data || [];
  const meta = salesData?.meta;

  // Compute summary stats from the full filtered dataset
  // Note: meta.grand_total is not available from getSales, so we compute from current page
  const pageRevenue = sales.reduce((sum, s) => sum + Number(s.grand_total), 0);
  const pagePaid = sales.reduce((sum, s) => sum + Number(s.paid_amount), 0);
  const voidCount = sales.filter((s) => s.invoice_status === 'void').length;

  const hasActiveFilters = search || paymentStatus || invoiceStatus || dateFrom || dateTo;
  const activeFilterLabels = [];
  if (search) activeFilterLabels.push(`بحث: "${search}"`);
  if (paymentStatus) {
    const map = { paid: 'مسددة بالكامل', partial: 'مسددة جزئياً', due: 'آجلة' };
    activeFilterLabels.push(`السداد: ${map[paymentStatus] || paymentStatus}`);
  }
  if (invoiceStatus) {
    const map = { completed: 'مكتملة', void: 'ملغاة' };
    activeFilterLabels.push(`الحالة: ${map[invoiceStatus] || invoiceStatus}`);
  }
  if (dateFrom) activeFilterLabels.push(`من: ${dateFrom}`);
  if (dateTo) activeFilterLabels.push(`إلى: ${dateTo}`);

  const clearFilters = () => {
    setSearch('');
    setPaymentStatus('');
    setInvoiceStatus('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-brand-400" />
            <span>سجل الفواتير والمبيعات</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            أرشفة الفواتير المُصدرة، إعادة الطباعة، وحالات السداد والإلغاء
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading} className="gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">تحديث</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-semibold text-slate-400">إجمالي الفواتير</p>
              {isLoading ? (
                <div className="h-7 w-16 mt-1.5 bg-slate-800 rounded-lg animate-pulse" />
              ) : (
                <p className="text-lg md:text-xl font-bold text-slate-100 font-mono mt-1">{meta?.total ?? 0}</p>
              )}
            </div>
            <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-semibold text-slate-400">إجمالي المبيعات (الصفحة)</p>
              {isLoading ? (
                <div className="h-7 w-20 mt-1.5 bg-slate-800 rounded-lg animate-pulse" />
              ) : (
                <p className="text-lg md:text-xl font-bold text-emerald-400 font-mono mt-1">{pageRevenue.toFixed(2)} ₪</p>
              )}
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-semibold text-slate-400">المبالغ المدفوعة</p>
              {isLoading ? (
                <div className="h-7 w-20 mt-1.5 bg-slate-800 rounded-lg animate-pulse" />
              ) : (
                <p className="text-lg md:text-xl font-bold text-sky-400 font-mono mt-1">{pagePaid.toFixed(2)} ₪</p>
              )}
            </div>
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-semibold text-slate-400">فواتير ملغاة</p>
              {isLoading ? (
                <div className="h-7 w-12 mt-1.5 bg-slate-800 rounded-lg animate-pulse" />
              ) : (
                <p className="text-lg md:text-xl font-bold text-rose-400 font-mono mt-1">{voidCount}</p>
              )}
            </div>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Ban className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/60 p-3 sm:p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          <div className="relative lg:col-span-5">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="بحث برقم الفاتورة، اسم العميل، أو الهاتف..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-slate-950/80 text-slate-100 border border-slate-700 rounded-xl pr-10 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-colors placeholder:text-slate-500"
            />
          </div>
          <div className="lg:col-span-3">
            <select
              value={paymentStatus}
              onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}
              className="w-full bg-slate-950/80 text-slate-100 border border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-colors"
            >
              <option value="">جميع حالات السداد</option>
              <option value="paid">مسددة بالكامل</option>
              <option value="partial">مسددة جزئياً</option>
              <option value="due">آجلة</option>
            </select>
          </div>
          <div className="lg:col-span-3">
            <select
              value={invoiceStatus}
              onChange={(e) => { setInvoiceStatus(e.target.value); setPage(1); }}
              className="w-full bg-slate-950/80 text-slate-100 border border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-colors"
            >
              <option value="">جميع حالات الفاتورة</option>
              <option value="completed">مكتملة وصالحة</option>
              <option value="void">فواتير ملغاة (Void)</option>
            </select>
          </div>
          <div className="lg:col-span-1 flex items-center justify-end gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2.5 text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-colors whitespace-nowrap"
              >
                <X className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">مسح</span>
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
        </div>
      </div>

      {/* Active filter indicators */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">عوامل التصفية النشطة:</span>
          {activeFilterLabels.map((label) => (
            <span key={label} className="inline-flex items-center gap-1 bg-brand-500/10 text-brand-400 text-[11px] font-medium px-2 py-0.5 rounded-lg border border-brand-500/20">
              {label}
              <button
                type="button"
                onClick={() => {
                  if (label.startsWith('بحث')) setSearch('');
                  else if (label.startsWith('السداد')) setPaymentStatus('');
                  else if (label.startsWith('الحالة')) setInvoiceStatus('');
                  else if (label.startsWith('من:')) setDateFrom('');
                  else if (label.startsWith('إلى:')) setDateTo('');
                  setPage(1);
                }}
                className="hover:text-brand-300"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearFilters}
            className="text-[11px] text-slate-500 hover:text-slate-300 underline transition-colors"
          >
            مسح الكل
          </button>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        /* Loading skeleton */
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800">
                  {['رقم الفاتورة', 'التاريخ', 'العميل', 'الإجمالي', 'المدفوع', 'الطريقة', 'الحالة', 'إجراءات'].map((h) => (
                    <th key={h} className="py-3 px-4 text-slate-500 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-800 rounded w-24" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-800 rounded w-28" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-800 rounded w-20" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-800 rounded w-16" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-800 rounded w-20" /></td>
                    <td className="py-3.5 px-4"><div className="h-5 bg-slate-800 rounded-full w-16" /></td>
                    <td className="py-3.5 px-4"><div className="h-5 bg-slate-800 rounded-full w-14" /></td>
                    <td className="py-3.5 px-4"><div className="flex justify-center gap-2"><div className="h-6 w-6 bg-slate-800 rounded" /><div className="h-6 w-6 bg-slate-800 rounded" /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : loadError ? (
        /* Error state */
        <div className="bg-slate-900/70 border border-rose-500/30 rounded-2xl p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-200 mb-1">فشل تحميل البيانات</h3>
          <p className="text-sm text-slate-400 mb-4">{loadError}</p>
          <Button onClick={loadData} variant="outline" className="gap-1.5">
            <RefreshCw className="w-4 h-4" />
            إعادة المحاولة
          </Button>
        </div>
      ) : sales.length === 0 ? (
        /* Empty state */
        <EmptyState
          icon={Receipt}
          title="لا توجد فواتير مبيعات مطابقة"
          description={hasActiveFilters ? 'جرّب تغيير عوامل التصفية أو البحث بكلمات مختلفة' : 'ستظهر هنا جميع فواتير نقاط البيع المُصدرة'}
          actionLabel={hasActiveFilters ? 'مسح التصفية' : undefined}
          onAction={hasActiveFilters ? clearFilters : undefined}
        />
      ) : (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden">
          {/* Mobile cards */}
          <div className="lg:hidden divide-y divide-slate-800/60">
            {sales.map((sale) => {
              const isVoid = sale.invoice_status === 'void';
              return (
                <div key={sale.id} className={`p-4 space-y-2.5 ${isVoid ? 'opacity-60' : ''}`}>
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-100 text-sm">{sale.invoice_number}</span>
                      {isVoid && <Badge variant="danger" size="sm">ملغاة</Badge>}
                    </div>
                    <span className="font-mono text-[11px] text-slate-500">
                      {sale.created_at ? new Date(sale.created_at).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                    </span>
                  </div>

                  {/* Customer + Amount */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300 font-medium">{sale.customer?.name || 'عميل نقدي'}</span>
                    <span className="font-mono font-bold text-slate-100 text-sm">{Number(sale.grand_total).toFixed(2)} ₪</span>
                  </div>

                  {/* Payment + Status */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                    <div className="flex items-center gap-2">
                      <Badge variant={sale.payment_method === 'cash' ? 'success' : sale.payment_method === 'credit' ? 'warning' : 'info'} size="sm">
                        {sale.payment_method === 'cash' ? 'نقداً' : sale.payment_method === 'bank_of_palestine' ? 'بنك فلسطين' : sale.payment_method === 'palpay' ? 'PalPay' : sale.payment_method === 'jawwal_pay' ? 'Jawwal Pay' : sale.payment_method === 'credit' ? 'آجل' : sale.payment_method === 'multiple' ? 'دفع متعدد' : sale.payment_method}
                      </Badge>
                      {sale.payment_status === 'paid' ? (
                        <Badge variant="success" size="sm">مسددة</Badge>
                      ) : sale.payment_status === 'partial' ? (
                        <Badge variant="warning" size="sm">جزئية</Badge>
                      ) : (
                        <Badge variant="danger" size="sm">آجلة</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {!isVoid && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingSale(sale)}
                          className="text-brand-400 gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>عرض</span>
                        </Button>
                      )}
                      {isVoid && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingSale(sale)}
                          className="text-slate-400 gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>طباعة</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Due amount if any */}
                  {Number(sale.due_amount) > 0 && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">المدفوع: {Number(sale.paid_amount).toFixed(2)} ₪</span>
                      <span className="text-amber-400 font-bold">المتبقي: {Number(sale.due_amount).toFixed(2)} ₪</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold select-none">
                  <th className="py-3.5 px-4">رقم الفاتورة</th>
                  <th className="py-3.5 px-4">التاريخ والوقت</th>
                  <th className="py-3.5 px-4">العميل</th>
                  <th className="py-3.5 px-4">الإجمالي (₪)</th>
                  <th className="py-3.5 px-4">المدفوع / المستحق</th>
                  <th className="py-3.5 px-4">طريقة الدفع</th>
                  <th className="py-3.5 px-4">حالة السداد</th>
                  <th className="py-3.5 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sales.map((sale) => {
                  const isVoid = sale.invoice_status === 'void';
                  return (
                    <tr key={sale.id} className={`hover:bg-slate-800/30 transition-colors ${isVoid ? 'opacity-50 bg-rose-950/10' : ''}`}>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-100 text-sm">{sale.invoice_number}</span>
                          {isVoid && <Badge variant="danger" size="sm">ملغاة</Badge>}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">
                        {sale.created_at ? new Date(sale.created_at).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-slate-200 font-medium">{sale.customer?.name || 'عميل نقدي'}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-100 text-sm">
                        {Number(sale.grand_total).toFixed(2)} ₪
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <div>
                          <span className="text-emerald-400 font-semibold">{Number(sale.paid_amount).toFixed(2)} ₪</span>
                          {Number(sale.due_amount) > 0 && (
                            <span className="text-[11px] text-amber-400 block font-bold">متبقي: {Number(sale.due_amount).toFixed(2)} ₪</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={sale.payment_method === 'cash' ? 'success' : sale.payment_method === 'credit' ? 'warning' : 'info'}
                          size="sm"
                        >
                          {sale.payment_method === 'cash' ? 'نقداً' : sale.payment_method === 'bank_of_palestine' ? 'بنك فلسطين' : sale.payment_method === 'palpay' ? 'PalPay' : sale.payment_method === 'jawwal_pay' ? 'Jawwal Pay' : sale.payment_method === 'credit' ? 'آجل (ذمة)' : sale.payment_method === 'multiple' ? 'دفع متعدد' : sale.payment_method}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        {sale.payment_status === 'paid' ? (
                          <Badge variant="success">مسددة</Badge>
                        ) : sale.payment_status === 'partial' ? (
                          <Badge variant="warning">جزئية</Badge>
                        ) : (
                          <Badge variant="danger">آجلة</Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="معاينة وطباعة الفاتورة"
                            onClick={() => setViewingSale(sale)}
                            className="text-brand-400 hover:bg-brand-500/10 p-1.5"
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                          {!isVoid && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="إلغاء الفاتورة وعكس المخزون"
                              onClick={() => setVoidTarget(sale)}
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

          {/* Pagination + per-page */}
          {meta && (
            <div className="px-4 py-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">عناصر في الصفحة:</span>
                {[10, 15, 25, 50].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => { setPerPage(n); setPage(1); }}
                    className={`px-2 py-0.5 rounded-lg text-xs font-mono transition-colors ${perPage === n ? 'bg-brand-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <Pagination
                currentPage={meta.current_page}
                lastPage={meta.last_page}
                total={meta.total}
                from={meta.from ?? 1}
                to={meta.to ?? meta.total}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>
      )}

      {/* Receipt Modal */}
      {viewingSale && (
        <ReceiptModal isOpen={!!viewingSale} onClose={() => setViewingSale(null)} sale={viewingSale} />
      )}

      {/* Void Confirmation */}
      <VoidConfirmModal
        isOpen={!!voidTarget}
        onClose={() => setVoidTarget(null)}
        onConfirm={handleVoidConfirm}
        invoiceNumber={voidTarget?.invoice_number || voidTarget?.id || ''}
      />
    </div>
  );
}
