import { useState, useEffect, useCallback } from 'react';
import { expensesApi } from '../api/expensesApi';
import { ExpenseModal } from '../components/ExpenseModal';
import { ExpenseCategoryModal } from '../components/ExpenseCategoryModal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Pagination } from '../../../components/ui/Pagination';
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
  RefreshCw,
  X,
  Edit,
  Ban,
} from 'lucide-react';
import { toast } from 'sonner';

/* ── Delete Confirmation Modal ──────────────────── */
function DeleteConfirmModal({ isOpen, onClose, onConfirm, description }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <Trash2 className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">حذف المصروف</h3>
            <p className="text-[11px] text-slate-400">{description}</p>
          </div>
        </div>
        <p className="text-xs text-slate-300">
          سيتم حذف هذا السند نهائياً. هذا الإجراء لا يمكن التراجع عنه.
        </p>
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>تراجع</Button>
          <Button size="sm" onClick={onConfirm} className="bg-rose-600 hover:bg-rose-700 text-white">
            <Trash2 className="w-3.5 h-3.5 ms-1" />
            تأكيد الحذف
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ExpensesPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [perPage, setPerPage] = useState(15);
  const [page, setPage] = useState(1);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const [expensesData, setExpensesData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await expensesApi.getExpenses({
        page,
        search: search || undefined,
        expense_category_id: selectedCategory !== 'all' ? selectedCategory : undefined,
        payment_method: paymentMethod || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        per_page: perPage,
      });
      setExpensesData(data);
    } catch (err) {
      setLoadError(err?.message || 'فشل تحميل المصروفات');
      toast.error('فشل تحميل المصروفات');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, selectedCategory, paymentMethod, dateFrom, dateTo, perPage]);

  const loadCategories = useCallback(async () => {
    try {
      setCategories(await expensesApi.getCategories());
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { loadCategories(); }, [loadCategories]);

  const refreshAll = async () => { await Promise.all([loadData(), loadCategories()]); };

  const handleOpenCreate = () => {
    setEditingExpense(null);
    setIsExpenseModalOpen(true);
  };

  const handleOpenEdit = (expense) => {
    setEditingExpense(expense);
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpense = async (payload) => {
    setIsSaving(true);
    try {
      if (editingExpense) {
        await expensesApi.updateExpense(editingExpense.id, payload);
        toast.success('تم تحديث المصروف بنجاح');
      } else {
        await expensesApi.createExpense(payload);
        toast.success('تم تسجيل المصروف بنجاح');
      }
      setIsExpenseModalOpen(false);
      setEditingExpense(null);
      await refreshAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'فشلت العملية');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await expensesApi.deleteExpense(deleteTarget.id);
      toast.success('تم حذف المصروف');
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'تعذر حذف المصروف');
    }
  };

  const expenses = expensesData?.data || [];
  const meta = expensesData?.meta;
  const grandTotal = meta?.grand_total ?? 0;

  const hasActiveFilters = search || selectedCategory !== 'all' || paymentMethod || dateFrom || dateTo;
  const activeFilterLabels = [];
  if (search) activeFilterLabels.push(`بحث: "${search}"`);
  if (selectedCategory !== 'all') {
    const cat = categories.find((c) => String(c.id) === String(selectedCategory));
    if (cat) activeFilterLabels.push(`التصنيف: ${cat.name}`);
  }
  if (paymentMethod) {
    const methods = { cash: 'نقداً', bank_transfer: 'حوالة بنكية', card: 'بطاقة' };
    activeFilterLabels.push(`الطريقة: ${methods[paymentMethod] || paymentMethod}`);
  }
  if (dateFrom) activeFilterLabels.push(`من: ${dateFrom}`);
  if (dateTo) activeFilterLabels.push(`إلى: ${dateTo}`);

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setPaymentMethod('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const paymentMethodLabel = (method) => {
    const map = { cash: 'نقداً', bank_transfer: 'حوالة بنكية', card: 'بطاقة' };
    return map[method] || method;
  };

  const paymentMethodVariant = (method) => {
    const map = { cash: 'success', bank_transfer: 'info', card: 'brand' };
    return map[method] || 'neutral';
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-brand-400" />
            <span>المصروفات التشغيلية</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            تسجيل الإيجارات، الفواتير، الرواتب، ونثريات المتجر
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsCategoryModalOpen(true)} rightIcon={<Layers className="w-4 h-4 text-slate-400" />}>
            التصنيفات
          </Button>
          <Button variant="outline" size="sm" onClick={refreshAll} disabled={isLoading} className="gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">تحديث</span>
          </Button>
          <Button onClick={handleOpenCreate} rightIcon={<Plus className="w-4 h-4" />}>
            تسجيل مصروف
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-semibold text-slate-400">إجمالي سندات الصرف</p>
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
              <p className="text-[10px] md:text-xs font-semibold text-slate-400">إجمالي المصروفات</p>
              {isLoading ? (
                <div className="h-7 w-20 mt-1.5 bg-slate-800 rounded-lg animate-pulse" />
              ) : (
                <p className="text-lg md:text-xl font-bold text-rose-400 font-mono mt-1">{Number(grandTotal).toFixed(2)} ₪</p>
              )}
            </div>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-semibold text-slate-400">تصنيفات المصروفات</p>
              {isLoading ? (
                <div className="h-7 w-12 mt-1.5 bg-slate-800 rounded-lg animate-pulse" />
              ) : (
                <p className="text-lg md:text-xl font-bold text-sky-400 font-mono mt-1">{categories.length}</p>
              )}
            </div>
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-semibold text-slate-400">مصروفات الصفحة</p>
              {isLoading ? (
                <div className="h-7 w-16 mt-1.5 bg-slate-800 rounded-lg animate-pulse" />
              ) : (
                <p className="text-lg md:text-xl font-bold text-amber-400 font-mono mt-1">
                  {expenses.reduce((sum, e) => sum + Number(e.amount), 0).toFixed(2)} ₪
                </p>
              )}
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/60 p-3 sm:p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          <div className="relative lg:col-span-4">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="بحث برقم السند أو البيان..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-slate-950/80 text-slate-100 border border-slate-700 rounded-xl pr-10 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-colors placeholder:text-slate-500"
            />
          </div>
          <div className="lg:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
              className="w-full bg-slate-950/80 text-slate-100 border border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-colors"
            >
              <option value="all">جميع التصنيفات</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="lg:col-span-3">
            <select
              value={paymentMethod}
              onChange={(e) => { setPaymentMethod(e.target.value); setPage(1); }}
              className="w-full bg-slate-950/80 text-slate-100 border border-slate-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-colors"
            >
              <option value="">جميع طرق الصرف</option>
              <option value="cash">نقداً</option>
              <option value="bank_transfer">حوالة بنكية</option>
              <option value="card">بطاقة</option>
            </select>
          </div>
          <div className="lg:col-span-2 flex items-center justify-end gap-2">
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
                  else if (label.startsWith('التصنيف')) setSelectedCategory('all');
                  else if (label.startsWith('الطريقة')) setPaymentMethod('');
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
                  {['رقم السند', 'التاريخ', 'التصنيف', 'البيان', 'المبلغ', 'الطريقة', 'المستخدم', 'إجراءات'].map((h) => (
                    <th key={h} className="py-3 px-4 text-slate-500 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-800 rounded w-24" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-800 rounded w-20" /></td>
                    <td className="py-3.5 px-4"><div className="h-5 bg-slate-800 rounded-full w-16" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-800 rounded w-32" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-800 rounded w-20" /></td>
                    <td className="py-3.5 px-4"><div className="h-5 bg-slate-800 rounded-full w-14" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-800 rounded w-16" /></td>
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
          <Ban className="w-12 h-12 text-rose-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-200 mb-1">فشل تحميل البيانات</h3>
          <p className="text-sm text-slate-400 mb-4">{loadError}</p>
          <Button onClick={loadData} variant="outline" className="gap-1.5">
            <RefreshCw className="w-4 h-4" />
            إعادة المحاولة
          </Button>
        </div>
      ) : expenses.length === 0 ? (
        /* Empty state */
        <EmptyState
          icon={CreditCard}
          title="لا توجد مصروفات مسجلة"
          description={hasActiveFilters ? 'جرّب تغيير عوامل التصفية أو البحث بكلمات مختلفة' : 'يمكنك تسجيل المصروفات التشغيلية لحساب صافي الأرباح'}
          actionLabel={hasActiveFilters ? 'مسح التصفية' : 'تسجيل مصروف جديد'}
          onAction={hasActiveFilters ? clearFilters : handleOpenCreate}
        />
      ) : (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden">
          {/* Mobile cards */}
          <div className="lg:hidden divide-y divide-slate-800/60">
            {expenses.map((expense) => (
              <div key={expense.id} className="p-4 space-y-2.5">
                {/* Header: number + date */}
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-slate-100 text-sm">{expense.expense_number}</span>
                  <span className="font-mono text-[11px] text-slate-500">{expense.expense_date}</span>
                </div>

                {/* Category + Amount */}
                <div className="flex items-center justify-between">
                  <Badge variant="brand" size="sm">{expense.category?.name || 'عام'}</Badge>
                  <span className="font-mono font-bold text-rose-400 text-sm">{Number(expense.amount).toFixed(2)} ₪</span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 font-medium">{expense.description}</p>
                {expense.reference_number && (
                  <p className="text-[10px] text-slate-500 font-mono">مرجع: {expense.reference_number}</p>
                )}

                {/* Meta row */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <Badge variant={paymentMethodVariant(expense.payment_method)} size="sm">
                      {paymentMethodLabel(expense.payment_method)}
                    </Badge>
                    <span className="text-[10px] text-slate-500">{expense.user_name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(expense)}
                      className="text-slate-400 hover:text-slate-200 gap-1"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(expense)}
                      className="text-slate-500 hover:text-rose-400 gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold select-none">
                  <th className="py-3.5 px-4">رقم السند</th>
                  <th className="py-3.5 px-4">التاريخ</th>
                  <th className="py-3.5 px-4">التصنيف</th>
                  <th className="py-3.5 px-4">البيان</th>
                  <th className="py-3.5 px-4">المبلغ (₪)</th>
                  <th className="py-3.5 px-4">الطريقة</th>
                  <th className="py-3.5 px-4">المستخدم</th>
                  <th className="py-3.5 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-100 text-sm">{expense.expense_number}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">{expense.expense_date}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant="brand" size="sm">{expense.category?.name || 'عام'}</Badge>
                    </td>
                    <td className="py-3.5 px-4 max-w-[220px]">
                      <span className="text-slate-100 font-medium block truncate">{expense.description}</span>
                      {expense.reference_number && (
                        <span className="text-[10px] text-slate-500 font-mono">مرجع: {expense.reference_number}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-400 text-sm">
                      {Number(expense.amount).toFixed(2)} ₪
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={paymentMethodVariant(expense.payment_method)} size="sm">
                        {paymentMethodLabel(expense.payment_method)}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{expense.user_name}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="تعديل المصروف"
                          onClick={() => handleOpenEdit(expense)}
                          className="text-slate-300 hover:bg-slate-800 p-1.5"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="حذف المصروف"
                          onClick={() => setDeleteTarget(expense)}
                          className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 p-1.5"
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

      {/* ── Expense Modal ──────────────────────────────── */}
      {isExpenseModalOpen && (
        <ExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={() => { setIsExpenseModalOpen(false); setEditingExpense(null); }}
          categories={categories}
          onSave={handleSaveExpense}
          isLoading={isSaving}
          editingExpense={editingExpense}
        />
      )}

      {/* ── Category Modal ────────────────────────────── */}
      {isCategoryModalOpen && (
        <ExpenseCategoryModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          categories={categories}
          onCreate={async (d) => { await expensesApi.createCategory(d); await loadCategories(); }}
          onUpdate={async (id, d) => { await expensesApi.updateCategory(id, d); await loadCategories(); }}
          onDelete={async (id) => { await expensesApi.deleteCategory(id); await loadCategories(); }}
        />
      )}

      {/* ── Delete Confirmation ──────────────────────── */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        description={deleteTarget ? `${deleteTarget.expense_number} — ${deleteTarget.description}` : ''}
      />
    </div>
  );
}
