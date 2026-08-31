import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesApi } from '../api/expensesApi';
import { ExpenseModal } from '../components/ExpenseModal';
import { ExpenseCategoryModal } from '../components/ExpenseCategoryModal';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Pagination } from '../../../components/ui/Pagination';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import {
  CreditCard,
  Plus,
  Layers,
  Search,
  Calendar,
  DollarSign,
  Trash2,
  Receipt,
  Wallet,
} from 'lucide-react';
import type { CreateExpensePayload } from '../types/expenseTypes';
import { toast } from 'sonner';

export const ExpensesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Queries
  const { data: expensesData, isLoading } = useQuery({
    queryKey: ['expenses', { page, search, selectedCategory, paymentMethod, dateFrom, dateTo }],
    queryFn: () =>
      expensesApi.getExpenses({
        page,
        search: search || undefined,
        expense_category_id: selectedCategory !== 'all' ? selectedCategory : undefined,
        payment_method: paymentMethod || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        per_page: 15,
      }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => expensesApi.getCategories(),
  });

  // Mutations
  const createExpenseMutation = useMutation({
    mutationFn: expensesApi.createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
      toast.success('تم تسجيل المصروف بنجاح');
      setIsExpenseModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'فشل تسجيل المصروف');
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: expensesApi.deleteExpense,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
      toast.success(res.message || 'تم حذف المصروف');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'تعذر حذف المصروف');
    },
  });

  const handleSaveExpense = async (payload: CreateExpensePayload) => {
    await createExpenseMutation.mutateAsync(payload);
  };

  const totalExpensesAmount =
    expensesData?.data?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-brand-400" />
            <span>المصروفات التشغيلية</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            تسجيل الإيجارات، الفواتير، الرواتب، ونثريات المتجر وخصمها من الصندوق
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCategoryModalOpen(true)}
            rightIcon={<Layers className="w-4 h-4 text-slate-400" />}
          >
            تصنيفات المصروفات
          </Button>

          <Button
            onClick={() => setIsExpenseModalOpen(true)}
            rightIcon={<Plus className="w-4 h-4" />}
          >
            تسجيل مصروف جديد
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">إجمالي سندات الصرف</p>
              <p className="text-xl font-bold text-slate-100 font-mono mt-1">
                {expensesData?.meta?.total ?? 0} سند
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">مصروفات تشغيلية مسجلة</p>
            </div>
            <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">إجمالي المصروفات (الصفحة الحالية)</p>
              <p className="text-xl font-bold text-rose-400 font-mono mt-1">
                {totalExpensesAmount.toFixed(2)} ₪
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">مجموع مبالغ الصرف</p>
            </div>
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">تصنيفات المصروفات</p>
              <p className="text-xl font-bold text-sky-400 font-mono mt-1">
                {categories.length} تصنيفات
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">أبواب صرف معرفة</p>
            </div>
            <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Wallet className="w-5 h-5" />
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
              placeholder="ابحث برقم السند، البيان، أو المرجع..."
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
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-950/80 text-slate-100 border border-slate-800 rounded-xl px-3 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            >
              <option value="all">جميع تصنيفات المصروفات ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-950/80 text-slate-100 border border-slate-800 rounded-xl px-3 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            >
              <option value="">جميع طرق الصرف</option>
              <option value="cash">نقداً من الصندوق</option>
              <option value="bank_transfer">حوالة بنكية</option>
              <option value="card">بطاقة مدى / حساب بنكي</option>
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

          {(dateFrom || dateTo || search || selectedCategory !== 'all' || paymentMethod) && (
            <button
              type="button"
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                setSearch('');
                setSelectedCategory('all');
                setPaymentMethod('');
                setPage(1);
              }}
              className="text-[11px] text-brand-400 hover:underline mr-auto"
            >
              إعادة ضبط الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* Expenses Data Table */}
      <Card className="overflow-hidden border-slate-800 bg-slate-900/70">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <LoadingSpinner size="lg" />
            <span className="text-xs text-slate-400">جارِ تحميل المصروفات...</span>
          </div>
        ) : !expensesData?.data || expensesData.data.length === 0 ? (
          <EmptyState
            title="لا توجد مصروفات مسجلة"
            description="يمكنك تسجيل المصروفات التشغيلية لحساب صافي الأرباح بدقة"
            actionLabel="تسجيل مصروف جديد"
            onAction={() => setIsExpenseModalOpen(true)}
          />
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold select-none">
                    <th className="py-3.5 px-4">رقم السند</th>
                    <th className="py-3.5 px-4">التاريخ</th>
                    <th className="py-3.5 px-4">التصنيف</th>
                    <th className="py-3.5 px-4">البيان / الوصف</th>
                    <th className="py-3.5 px-4">المبلغ (₪)</th>
                    <th className="py-3.5 px-4">طريقة الصرف</th>
                    <th className="py-3.5 px-4">المستخدم</th>
                    <th className="py-3.5 px-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {expensesData.data.map((expense) => (
                    <tr key={expense.id} className="hover:bg-slate-850/50 transition-colors">
                      {/* Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-100">
                        {expense.expense_number}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono text-slate-400">
                        {expense.expense_date}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-[11px] font-semibold border border-slate-700">
                          {expense.category?.name || 'عام'}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-4">
                        <span className="text-slate-100 font-medium block">
                          {expense.description}
                        </span>
                        {expense.reference_number && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            مرجع: {expense.reference_number}
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-mono font-bold text-rose-400 text-sm">
                        {Number(expense.amount).toFixed(2)} ₪
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-4">
                        <Badge variant="neutral" size="sm">
                          {expense.payment_method === 'cash'
                            ? 'نقداً من الصندوق'
                            : expense.payment_method === 'bank_transfer'
                            ? 'حوالة بنكية'
                            : 'بطاقة مدى'}
                        </Badge>
                      </td>

                      {/* User */}
                      <td className="py-3.5 px-4 text-slate-400">
                        {expense.user_name || 'النظام'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="حذف المصروف"
                            onClick={() => {
                              if (window.confirm(`هل أنت متأكد من حذف سند المصروف: "${expense.description}"؟`)) {
                                deleteExpenseMutation.mutate(expense.id);
                              }
                            }}
                            className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 p-1.5"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {expensesData.meta && (
              <div className="px-4 border-t border-slate-800">
                <Pagination
                  currentPage={expensesData.meta.current_page}
                  lastPage={expensesData.meta.last_page}
                  total={expensesData.meta.total}
                  from={expensesData.meta.from ?? 1}
                  to={expensesData.meta.to ?? expensesData.meta.total}
                  onPageChange={(p) => setPage(p)}
                />
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Modals */}
      {isExpenseModalOpen && (
        <ExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          categories={categories}
          onSave={handleSaveExpense}
          isLoading={createExpenseMutation.isPending}
        />
      )}

      {isCategoryModalOpen && (
        <ExpenseCategoryModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          categories={categories}
          onCreate={async (data) => {
            await expensesApi.createCategory(data);
            queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
          }}
          onUpdate={async (id, data) => {
            await expensesApi.updateCategory(id, data);
            queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
          }}
          onDelete={async (id) => {
            await expensesApi.deleteCategory(id);
            queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
          }}
        />
      )}
    </div>
  );
};
