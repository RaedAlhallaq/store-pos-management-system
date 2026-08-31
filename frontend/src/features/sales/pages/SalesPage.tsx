import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { posApi } from '../../pos/api/posApi';
import { ReceiptModal } from '../../pos/components/ReceiptModal';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Pagination } from '../../../components/ui/Pagination';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import {
  Receipt,
  Search,
  Printer,
  Ban,
  Calendar,
} from 'lucide-react';
import type { SaleResponse } from '../../pos/types/posTypes';
import { toast } from 'sonner';

export const SalesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  // Selected sale for receipt viewing
  const [viewingSale, setViewingSale] = useState<SaleResponse | null>(null);

  // Queries
  const { data: salesData, isLoading: isSalesLoading } = useQuery({
    queryKey: ['sales', { page, search, paymentStatus, invoiceStatus, dateFrom, dateTo }],
    queryFn: () =>
      posApi.getSales({
        page,
        search: search || undefined,
        payment_status: paymentStatus || undefined,
        invoice_status: invoiceStatus || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        per_page: 15,
      }),
  });

  // Void mutation
  const voidMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => posApi.voidSale(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      queryClient.invalidateQueries({ queryKey: ['products-metrics'] });
      toast.success('تم إلغاء الفاتورة وعكس رصيد المخزون بنجاح');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'فشل إلغاء الفاتورة');
    },
  });

  const handleVoidInvoice = async (sale: SaleResponse) => {
    const reason = window.prompt(`يرجى كتابة سبب إلغاء الفاتورة رقم (${sale.invoice_number}):`);
    if (reason && reason.trim()) {
      await voidMutation.mutateAsync({ id: sale.id, reason: reason.trim() });
    }
  };

  const getPaymentStatusBadge = (status: SaleResponse['payment_status']) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">مدفوعة بالكامل</Badge>;
      case 'partial':
        return <Badge variant="warning">مدفوعة جزئياً</Badge>;
      case 'due':
        return <Badge variant="danger">آجلة / غير مسددة</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-brand-400" />
            <span>سجل الفواتير والمبيعات</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            أرشيف الفواتير المصدرة، إعادة الطباعة، وحالات السداد والإلغاء
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative md:col-span-2">
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="ابحث برقم الفاتورة، اسم العميل، أو الهاتف..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-950/80 text-slate-100 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
          </div>

          {/* Payment status filter */}
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
              <option value="paid">مدفوعة بالكامل</option>
              <option value="partial">مدفوعة جزئياً</option>
              <option value="due">آجلة / غير مسددة</option>
            </select>
          </div>

          {/* Invoice status filter */}
          <div>
            <select
              value={invoiceStatus}
              onChange={(e) => {
                setInvoiceStatus(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-950/80 text-slate-100 border border-slate-800 rounded-xl px-3 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            >
              <option value="">جميع حالات الفواتير</option>
              <option value="completed">مكتملة وصالحة</option>
              <option value="void">فواتير ملغاة (Void)</option>
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

          {(dateFrom || dateTo || search || paymentStatus || invoiceStatus) && (
            <button
              type="button"
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                setSearch('');
                setPaymentStatus('');
                setInvoiceStatus('');
                setPage(1);
              }}
              className="text-[11px] text-brand-400 hover:underline mr-auto"
            >
              إعادة ضبط الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* Invoices Data Table */}
      <Card className="overflow-hidden border-slate-800 bg-slate-900/70">
        {isSalesLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <LoadingSpinner size="lg" />
            <span className="text-xs text-slate-400">جارِ تحميل الفواتير...</span>
          </div>
        ) : !salesData?.data || salesData.data.length === 0 ? (
          <EmptyState
            title="لا توجد فواتير مطابقة"
            description="ستظهر هنا كافة فواتير نقاط البيع المصدرة للمراجعة والطباعة"
          />
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold select-none">
                    <th className="py-3.5 px-4">رقم الفاتورة</th>
                    <th className="py-3.5 px-4">التاريخ والوقت</th>
                    <th className="py-3.5 px-4">العميل</th>
                    <th className="py-3.5 px-4">الإجمالي (₪)</th>
                    <th className="py-3.5 px-4">المدفوع / المتبقي</th>
                    <th className="py-3.5 px-4">طريقة الدفع</th>
                    <th className="py-3.5 px-4">حالة السداد</th>
                    <th className="py-3.5 px-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {salesData.data.map((sale) => {
                    const isVoid = sale.invoice_status === 'void';

                    return (
                      <tr
                        key={sale.id}
                        className={`hover:bg-slate-850/50 transition-colors ${
                          isVoid ? 'opacity-50 bg-rose-950/10' : ''
                        }`}
                      >
                        {/* Invoice Number */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-100 text-sm">
                              {sale.invoice_number}
                            </span>
                            {isVoid && <Badge variant="danger" size="sm">ملغاة</Badge>}
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 font-mono text-slate-400">
                          {sale.created_at
                            ? new Date(sale.created_at).toLocaleString('ar-SA', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : '—'}
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 px-4">
                          <span className="text-slate-200 font-medium block">
                            {sale.customer?.name || 'عميل نقدي'}
                          </span>
                        </td>

                        {/* Grand Total */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-100 text-sm">
                          {Number(sale.grand_total).toFixed(2)} ₪
                        </td>

                        {/* Paid vs Due */}
                        <td className="py-3.5 px-4 font-mono">
                          <div>
                            <span className="text-emerald-400 font-semibold">
                              {Number(sale.paid_amount).toFixed(2)} ₪
                            </span>
                            {Number(sale.due_amount) > 0 && (
                              <span className="text-[11px] text-amber-400 block font-bold">
                                متبقي: {Number(sale.due_amount).toFixed(2)} ₪
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Payment Method */}
                        <td className="py-3.5 px-4">
                          <span className="text-slate-300 font-medium">
                            {sale.payment_method === 'cash'
                              ? 'نقداً'
                              : sale.payment_method === 'card'
                              ? 'بطاقة مدى'
                              : sale.payment_method === 'credit'
                              ? 'آجل (ذمة)'
                              : 'دفع مجزأ'}
                          </span>
                        </td>

                        {/* Payment Status */}
                        <td className="py-3.5 px-4">{getPaymentStatusBadge(sale.payment_status)}</td>

                        {/* Actions */}
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
                                onClick={() => handleVoidInvoice(sale)}
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
            {salesData.meta && (
              <div className="px-4 border-t border-slate-800">
                <Pagination
                  currentPage={salesData.meta.current_page}
                  lastPage={salesData.meta.last_page}
                  total={salesData.meta.total}
                  from={salesData.meta.from ?? 1}
                  to={salesData.meta.to ?? salesData.meta.total}
                  onPageChange={(p) => setPage(p)}
                />
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Receipt Modal for viewing and printing */}
      {viewingSale && (
        <ReceiptModal
          isOpen={!!viewingSale}
          onClose={() => setViewingSale(null)}
          sale={viewingSale}
        />
      )}
    </div>
  );
};
