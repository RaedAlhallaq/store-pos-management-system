import { useState, useEffect, useCallback } from 'react';
import { purchasesApi } from '../api/purchasesApi';
import { suppliersApi } from '../../suppliers/api/suppliersApi';
import { productsApi } from '../../products/api/productsApi';
import { PurchaseModal } from '../components/PurchaseModal';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Pagination } from '../../../components/ui/Pagination';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ShoppingBag, Plus, Search, Calendar, Ban, DollarSign, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

export function PurchasesPage() {
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [purchaseStatus, setPurchaseStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  const [purchasesData, setPurchasesData] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [productsData, setProductsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await purchasesApi.getPurchases({ page, search: search || undefined, payment_status: paymentStatus || undefined, purchase_status: purchaseStatus || undefined, date_from: dateFrom || undefined, date_to: dateTo || undefined, per_page: 15 });
      setPurchasesData(data);
    } finally { setIsLoading(false); }
  }, [page, search, paymentStatus, purchaseStatus, dateFrom, dateTo]);

  const loadMeta = useCallback(async () => {
    const [s, p] = await Promise.all([suppliersApi.getQuickList(), productsApi.getProducts({ per_page: 250 })]);
    setSuppliers(s);
    setProductsData(p);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { loadMeta(); }, [loadMeta]);

  const refreshAll = async () => { await Promise.all([loadData(), loadMeta()]); };

  const handleSavePurchase = async (payload) => {
    setIsSaving(true);
    try {
      await purchasesApi.createPurchase(payload);
      toast.success('تم تسجيل فاتورة المشتريات وزيادة المخزون بنجاح');
      setIsPurchaseModalOpen(false); await refreshAll();
    } catch (err) { toast.error(err?.response?.data?.message || err?.message || 'فشلت إضافة فاتورة المشتريات'); }
    finally { setIsSaving(false); }
  };

  const handleVoidPurchase = async (purchase) => {
    const reason = window.prompt(`يرجى كتابة سبب إلغاء فاتورة المشتريات (${purchase.invoice_number || purchase.id}):`);
    if (!reason || !reason.trim()) return;
    try {
      await purchasesApi.voidPurchase(purchase.id, reason.trim());
      toast.success('تم إلغاء فاتورة المشتريات وعكس رصيد المخزون بنجاح'); await refreshAll();
    } catch (err) { toast.error(err?.response?.data?.message || 'فشل إلغاء فاتورة الشراء'); }
  };

  const totalSpending = purchasesData?.data?.reduce((sum, p) => sum + Number(p.grand_total), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div><h1 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2"><ShoppingBag className="w-6 h-6 text-brand-400" /><span>المشتريات والتوريد</span></h1><p className="text-xs md:text-sm text-slate-400 mt-0.5">تسجيل فواتير الشراء من الموردين، زيادة كميات المخزون، وتحديث أسعار التكلفة</p></div>
        <Button onClick={() => setIsPurchaseModalOpen(true)} rightIcon={<Plus className="w-4 h-4" />}>تسجيل فاتورة شراء جديدة</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-slate-900/80 border-slate-800"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold text-slate-400">إجمالي فواتير الشراء</p><p className="text-xl font-bold text-slate-100 font-mono mt-1">{purchasesData?.meta?.total ?? 0} فاتورة</p></div><div className="p-3 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20"><ShoppingBag className="w-5 h-5" /></div></div></Card>
        <Card className="p-4 bg-slate-900/80 border-slate-800"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold text-slate-400">إجمالي المشتريات (الصفحة)</p><p className="text-xl font-bold text-emerald-400 font-mono mt-1">{totalSpending.toFixed(2)} ₪</p></div><div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><DollarSign className="w-5 h-5" /></div></div></Card>
        <Card className="p-4 bg-slate-900/80 border-slate-800"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold text-slate-400">فواتير شراء آجلة</p><p className="text-xl font-bold text-amber-400 font-mono mt-1">{purchasesData?.data?.filter((p) => p.payment_status === 'due' || p.payment_status === 'partial').length || 0} فاتورة</p></div><div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20"><TrendingDown className="w-5 h-5" /></div></div></Card>
      </div>

      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2"><div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400"><Search className="w-4 h-4" /></div><input type="text" placeholder="ابحث برقم الفاتورة، اسم المورد..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full bg-slate-950/80 text-slate-100 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50" /></div>
          <div><select value={paymentStatus} onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }} className="w-full bg-slate-950/80 text-slate-100 border border-slate-800 rounded-xl px-3 py-2.5 text-xs md:text-sm"><option value="">جميع حالات السداد</option><option value="paid">مسددة بالكامل</option><option value="partial">مسددة جزئياً</option><option value="due">آجلة</option></select></div>
          <div><select value={purchaseStatus} onChange={(e) => { setPurchaseStatus(e.target.value); setPage(1); }} className="w-full bg-slate-950/80 text-slate-100 border border-slate-800 rounded-xl px-3 py-2.5 text-xs md:text-sm"><option value="">جميع حالات التوريد</option><option value="completed">مستلمة</option><option value="void">ملغاة</option></select></div>
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-brand-400" /><span>نطاق التاريخ:</span></span>
          <div className="flex items-center gap-2"><span className="text-slate-500">من:</span><input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-2.5 py-1 text-xs" /></div>
          <div className="flex items-center gap-2"><span className="text-slate-500">إلى:</span><input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-2.5 py-1 text-xs" /></div>
          {(dateFrom || dateTo || search || paymentStatus || purchaseStatus) && <button type="button" onClick={() => { setDateFrom(''); setDateTo(''); setSearch(''); setPaymentStatus(''); setPurchaseStatus(''); setPage(1); }} className="text-[11px] text-brand-400 hover:underline mr-auto">إعادة ضبط الفلاتر</button>}
        </div>
      </div>

      <Card className="overflow-hidden border-slate-800 bg-slate-900/70">
        {isLoading ? <div className="py-16 flex flex-col items-center justify-center gap-3"><LoadingSpinner size="lg" /><span className="text-xs text-slate-400">جارِ تحميل فواتير الشراء...</span></div>
          : !purchasesData?.data || purchasesData.data.length === 0 ? <EmptyState title="لا توجد فواتير مشتريات مسجلة" description="يمكنك تسجيل فواتير شراء جديدة لإضافة كميات إلى المخزون" actionLabel="تسجيل فاتورة شراء" onAction={() => setIsPurchaseModalOpen(true)} />
          : (
            <div><div className="overflow-x-auto"><table className="w-full text-right text-xs">
              <thead><tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold select-none"><th className="py-3.5 px-4">رقم الفاتورة</th><th className="py-3.5 px-4">المورد</th><th className="py-3.5 px-4">التاريخ</th><th className="py-3.5 px-4">الإجمالي (₪)</th><th className="py-3.5 px-4">المدفوع / المستحق</th><th className="py-3.5 px-4">حالة السداد</th><th className="py-3.5 px-4 text-center">إجراءات</th></tr></thead>
              <tbody className="divide-y divide-slate-800/60">
                {purchasesData.data.map((purchase) => {
                  const isCancelled = purchase.purchase_status === 'void';
                  return (
                    <tr key={purchase.id} className={`hover:bg-slate-850/50 transition-colors ${isCancelled ? 'opacity-50 bg-rose-950/10' : ''}`}>
                      <td className="py-3.5 px-4"><div className="flex items-center gap-2"><span className="font-mono font-bold text-slate-100 text-sm">{purchase.invoice_number || purchase.id}</span>{isCancelled && <Badge variant="danger" size="sm">ملغاة</Badge>}</div></td>
                      <td className="py-3.5 px-4"><span className="text-slate-200 font-medium">{purchase.supplier_name || purchase.supplier?.name || 'مورد عام'}</span></td>
                      <td className="py-3.5 px-4 font-mono text-slate-400">{purchase.created_at ? new Date(purchase.created_at).toLocaleDateString('ar-SA') : '—'}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-100 text-sm">{Number(purchase.grand_total).toFixed(2)} ₪</td>
                      <td className="py-3.5 px-4 font-mono"><div><span className="text-emerald-400 font-semibold">{Number(purchase.paid_amount).toFixed(2)} ₪</span>{Number(purchase.due_amount) > 0 && <span className="text-[11px] text-amber-400 block font-bold">آجل: {Number(purchase.due_amount).toFixed(2)} ₪</span>}</div></td>
                      <td className="py-3.5 px-4">{purchase.payment_status === 'paid' ? <Badge variant="success">مسددة</Badge> : purchase.payment_status === 'partial' ? <Badge variant="warning">جزئية</Badge> : <Badge variant="danger">آجلة</Badge>}</td>
                      <td className="py-3.5 px-4"><div className="flex items-center justify-center gap-1.5">{!isCancelled && <Button variant="ghost" size="sm" title="إلغاء فاتورة الشراء" onClick={() => handleVoidPurchase(purchase)} className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 p-1.5"><Ban className="w-4 h-4" /></Button>}</div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table></div>
            {purchasesData.meta && <div className="px-4 border-t border-slate-800"><Pagination currentPage={purchasesData.meta.current_page} lastPage={purchasesData.meta.last_page} total={purchasesData.meta.total} from={purchasesData.meta.from ?? 1} to={purchasesData.meta.to ?? purchasesData.meta.total} onPageChange={(p) => setPage(p)} /></div>}
          </div>
          )}
      </Card>

      {isPurchaseModalOpen && <PurchaseModal isOpen={isPurchaseModalOpen} onClose={() => setIsPurchaseModalOpen(false)} suppliers={suppliers} products={productsData?.data || []} onSave={handleSavePurchase} isLoading={isSaving} />}
    </div>
  );
}
