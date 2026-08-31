import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import {
  ShoppingBag,
  Plus,
  Search,
  Calendar,
  Ban,
  DollarSign,
  TrendingDown,
} from 'lucide-react';
import type { Purchase, CreatePurchasePayload } from '../types/purchaseTypes';
import { toast } from 'sonner';

export const PurchasesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [purchaseStatus, setPurchaseStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  // Queries
  const { data: purchasesData, isLoading } = useQuery({
    queryKey: ['purchases', { page, search, paymentStatus, purchaseStatus, dateFrom, dateTo }],
    queryFn: () =>
      purchasesApi.getPurchases({
        page,
        search: search || undefined,
        payment_status: paymentStatus || undefined,
        purchase_status: purchaseStatus || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        per_page: 15,
      }),
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['quick-suppliers'],
    queryFn: () => suppliersApi.getQuickList(),
  });

  const { data: productsData } = useQuery({
    queryKey: ['all-products-for-purchase'],
    queryFn: () => productsApi.getProducts({ per_page: 250 }),
  });

  // Mutations
  const createPurchaseMutation = useMutation({
    mutationFn: purchasesApi.createPurchase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('تم تسجيل فاتورة المشتريات وزيادة المخزون بنجاح');
      setIsPurchaseModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'فشلت إضافة فاتورة المشتريات');
    },
  });

  const voidMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => purchasesApi.voidPurchase(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('تم إلغاء فاتورة المشتريات وعكس رصيد المخزون بنجاح');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'فشل إلغاء فاتورة الشراء');
    },
  });

  const handleSavePurchase = async (payload: CreatePurchasePayload) => {
    await createPurchaseMutation.mutateAsync(payload);
  };

  const handleVoidPurchase = async (purchase: Purchase) => {
    const reason = window.prompt(`يرجى كتابة سبب إلغاء فاتورة المشتريات (${purchase.purchase_number}):`);
    if (reason && reason.trim()) {
      await voidMutation.mutateAsync({ id: purchase.id, reason: reason.trim() });
    }
  };

  const totalPurchasesSpending =
    purchasesData?.data?.reduce((sum, p) => sum + Number(p.grand_total), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
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

        <Button
          onClick={() => setIsPurchaseModalOpen(true)}
          rightIcon={<Plus className="w-4 h-4" />}
        >
          تسجيل فاتورة شراء جديدة
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">إجمالي فواتير الشراء</p>
              <p className="text-xl font-bold text-slate-100 font-mono mt-1">
                {purchasesData?.meta?.total ?? 0} فاتورة
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">عمليات توريد مسجلة</p>
            </div>
            <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">إجمالي المشتريات (الصفحة الحالية)</p>
              <p className="text-xl font-bold text-emerald-400 font-mono mt-1">
                {totalPurchasesSpending.toFixed(2)} ₪
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">قيمة البضائع الموردة</p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">فواتير شراء آجلة</p>
              <p className="text-xl font-bold text-amber-400 font-mono mt-1">
                {purchasesData?.data?.filter((p) => p.payment_status === 'due' || p.payment_status === 'partial').length || 0} فاتورة
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">مستحقات للموردين</p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="ابحث برقم الفاتورة، اسم المورد، أو الشركة..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-950/80 text-slate-100 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
          </div>

          <div>
            <select
              value={paymentStatus}
              onChange={(e) => {
                setPaymentStatus(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-950/80 text-slate-100 border border-slate-800 rounded-xl px-3 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            >
              <option value="">جميع حالات السداد</option>
              <option value="paid">مسددة بالكامل</option>
              <option value="partial">مسددة جزئياً</option>
              <option value="due">آجلة / غير مسددة</option>
            </select>
          </div>

          <div>
            <select
              value={purchaseStatus}
              onChange={(e) => {
                setPurchaseStatus(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-950/80 text-slate-100 border border-slate-800 rounded-xl px-3 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            >
              <option value="">جميع حالات التوريد</option>
              <option value="received">مستلمة وموردة</option>
              <option value="cancelled">ملغاة (Cancelled)</option>
            </select>
          </div>
        </div>

        {/* Date Filter Row */}
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
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">إلى:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
            />
          </div>

          {(dateFrom || dateTo || search || paymentStatus || purchaseStatus) && (
            <button
              type="button"
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                setSearch('');
                setPaymentStatus('');
                setPurchaseStatus('');
                setPage(1);
              }}
              className="text-[11px] text-brand-400 hover:underline mr-auto"
            >
              إعادة ضبط الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* Purchases Data Table */}
      <Card className="overflow-hidden border-slate-800 bg-slate-900/70">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <LoadingSpinner size="lg" />
            <span className="text-xs text-slate-400">جارِ تحميل فواتير الشراء...</span>
          </div>
        ) : !purchasesData?.data || purchasesData.data.length === 0 ? (
          <EmptyState
            title="لا توجد فواتير مشتريات مسجلة"
            description="يمكنك تسجيل فواتير شراء جديدة لإضافة كميات إلى المخزون تلقائياً"
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
                    <th className="py-3.5 px-4">المورد / الشركة</th>
                    <th className="py-3.5 px-4">تاريخ الفاتورة</th>
                    <th className="py-3.5 px-4">إجمالي الشراء (₪)</th>
                    <th className="py-3.5 px-4">المدفوع / المستحق</th>
                    <th className="py-3.5 px-4">طريقة السداد</th>
                    <th className="py-3.5 px-4">حالة السداد</th>
                    <th className="py-3.5 px-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {purchasesData.data.map((purchase) => {
                    const isCancelled = purchase.purchase_status === 'cancelled';

                    return (
                      <tr
                        key={purchase.id}
                        className={`hover:bg-slate-850/50 transition-colors ${
                          isCancelled ? 'opacity-50 bg-rose-950/10' : ''
                        }`}
                      >
                        {/* Number */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-100 text-sm">
                              {purchase.purchase_number}
                            </span>
                            {isCancelled && <Badge variant="danger" size="sm">ملغاة</Badge>}
                          </div>
                        </td>

                        {/* Supplier */}
                        <td className="py-3.5 px-4">
                          <div>
                            <span className="text-slate-200 font-medium block">
                              {purchase.supplier?.name || 'مورد عام'}
                            </span>
                            {purchase.supplier?.company_name && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                {purchase.supplier.company_name}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 font-mono text-slate-400">
                          {purchase.invoice_date || '—'}
                        </td>

                        {/* Grand Total */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-100 text-sm">
                          {Number(purchase.grand_total).toFixed(2)} ₪
                        </td>

                        {/* Paid vs Due */}
                        <td className="py-3.5 px-4 font-mono">
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

                        {/* Payment Method */}
                        <td className="py-3.5 px-4">
                          <span className="text-slate-300 font-medium">
                            {purchase.payment_method === 'cash'
                              ? 'نقداً'
                              : purchase.payment_method === 'bank_transfer'
                              ? 'حوالة بنكية'
                              : purchase.payment_method === 'credit'
                              ? 'آجل (ذمة مورد)'
                              : 'بطاقة مدى'}
                          </span>
                        </td>

                        {/* Payment Status */}
                        <td className="py-3.5 px-4">
                          {purchase.payment_status === 'paid' ? (
                            <Badge variant="success">مسددة بالكامل</Badge>
                          ) : purchase.payment_status === 'partial' ? (
                            <Badge variant="warning">مسددة جزئياً</Badge>
                          ) : (
                            <Badge variant="danger">آجلة / غير مسددة</Badge>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {!isCancelled && (
                              <Button
                                variant="ghost"
                                size="sm"
                                title="إلغاء فاتورة الشراء وعكس المخزون"
                                onClick={() => handleVoidPurchase(purchase)}
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

            {/* Pagination */}
            {purchasesData.meta && (
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

      {/* Purchase Modal */}
      {isPurchaseModalOpen && (
        <PurchaseModal
          isOpen={isPurchaseModalOpen}
          onClose={() => setIsPurchaseModalOpen(false)}
          suppliers={suppliers}
          products={productsData?.data || []}
          onSave={handleSavePurchase}
          isLoading={createPurchaseMutation.isPending}
        />
      )}
    </div>
  );
};
