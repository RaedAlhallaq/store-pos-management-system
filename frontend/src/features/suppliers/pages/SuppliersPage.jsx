import { useState, useEffect, useCallback } from 'react';
import { suppliersApi } from '../api/suppliersApi';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Pagination } from '../../../components/ui/Pagination';
import { EmptyState } from '../../../components/ui/EmptyState';
import {
  Truck,
  UserPlus,
  Search,
  DollarSign,
  AlertTriangle,
  Phone,
  Edit,
  Trash2,
  Check,
  Building,
  RefreshCw,
  X,
  Mail,
  MapPin,
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';

/* ── Delete Confirmation Modal ──────────────────── */
function DeleteConfirmModal({ isOpen, onClose, onConfirm, supplierName }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <Trash2 className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">حذف / تعطيل المورد</h3>
            <p className="text-[11px] text-slate-400">{supplierName}</p>
          </div>
        </div>
        <p className="text-xs text-slate-300">
          إذا كان للمورد فواتير مشتريات مرتبطة، سيتم تعطيل حسابه بدلاً من الحذف للحفاظ على سجلات البيانات.
        </p>
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            تراجع
          </Button>
          <Button size="sm" onClick={onConfirm} className="bg-rose-600 hover:bg-rose-700 text-white">
            <Trash2 className="w-3.5 h-3.5 ms-1" />
            تأكيد الحذف
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SuppliersPage() {
  const [search, setSearch] = useState('');
  const [hasDebt, setHasDebt] = useState(undefined);
  const [perPage, setPerPage] = useState(15);
  const [page, setPage] = useState(1);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [payingSupplier, setPayingSupplier] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [formName, setFormName] = useState('');
  const [formCompanyName, setFormCompanyName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTaxNumber, setFormTaxNumber] = useState('');
  const [formBankName, setFormBankName] = useState('');
  const [formBankIban, setFormBankIban] = useState('');
  const [formAddress, setFormAddress] = useState('');

  const [suppliersData, setSuppliersData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await suppliersApi.getSuppliers({
        page,
        search: search || undefined,
        has_debt: hasDebt,
        per_page: perPage,
      });
      setSuppliersData(data);
    } catch (err) {
      setLoadError(err?.message || 'فشل تحميل بيانات الموردين');
      toast.error('فشل تحميل بيانات الموردين');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, hasDebt, perPage]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleOpenCreate = () => {
    setEditingSupplier(null);
    setFormName('');
    setFormCompanyName('');
    setFormPhone('');
    setFormEmail('');
    setFormTaxNumber('');
    setFormBankName('');
    setFormBankIban('');
    setFormAddress('');
    setIsSupplierModalOpen(true);
  };

  const handleOpenEdit = (s) => {
    setEditingSupplier(s);
    setFormName(s.name);
    setFormCompanyName(s.company_name || '');
    setFormPhone(s.phone || '');
    setFormEmail(s.email || '');
    setFormTaxNumber(s.tax_number || '');
    setFormBankName(s.bank_name || '');
    setFormBankIban(s.bank_iban || '');
    setFormAddress(s.address || '');
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    if (!formName.trim()) { toast.error('اسم المورد أو المندوب مطلوب'); return; }
    const payload = {
      name: formName.trim(),
      company_name: formCompanyName.trim() || undefined,
      phone: formPhone.trim() || undefined,
      email: formEmail.trim() || undefined,
      tax_number: formTaxNumber.trim() || undefined,
      bank_name: formBankName.trim() || undefined,
      bank_iban: formBankIban.trim() || undefined,
      address: formAddress.trim() || undefined,
      is_active: true,
    };
    setIsSaving(true);
    try {
      if (editingSupplier) {
        await suppliersApi.updateSupplier(editingSupplier.id, payload);
        toast.success('تم تحديث بيانات المورد بنجاح');
      } else {
        await suppliersApi.createSupplier(payload);
        toast.success('تمت إضافة المورد بنجاح');
      }
      setIsSupplierModalOpen(false);
      setEditingSupplier(null);
      await loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'فشلت العملية');
    } finally { setIsSaving(false); }
  };

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    const amountNum = Number(paymentAmount);
    if (!payingSupplier || isNaN(amountNum) || amountNum <= 0) { toast.error('يرجى إدخال مبلغ صحيح لسند الصرف'); return; }
    setIsPaying(true);
    try {
      await suppliersApi.recordPayment(payingSupplier.id, {
        amount: amountNum,
        payment_method: paymentMethod,
        notes: paymentNotes || undefined,
      });
      toast.success('تم تسجيل سند الصرف وسداد دفعة المورد بنجاح');
      setPayingSupplier(null);
      setPaymentAmount('');
      setPaymentNotes('');
      await loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'فشل تسجيل سند الصرف');
    } finally { setIsPaying(false); }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      const res = await suppliersApi.deleteSupplier(deleteTarget.id);
      toast.success(res.message || 'تم حذف المورد');
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'تعذر حذف المورد');
    }
  };

  const suppliers = suppliersData?.data || [];
  const meta = suppliersData?.meta;
  const totalPayables = suppliers.reduce(
    (sum, s) => sum + Math.max(0, Number(s.current_balance)),
    0,
  );
  const debtCount = suppliers.filter((s) => Number(s.current_balance) > 0).length;
  const activeCount = suppliers.filter((s) => s.is_active).length;

  const hasActiveFilters = search || hasDebt !== undefined;
  const activeFilterLabels = [];
  if (search) activeFilterLabels.push(`بحث: "${search}"`);
  if (hasDebt === true) activeFilterLabels.push('الموردين الدائنين فقط');

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Truck className="w-6 h-6 text-brand-400" />
            <span>دليل الموردين والمستحقات</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            إدارة بيانات الموردين والشركات، متابعة المستحقات الآجلة، وتسجيل سندات الصرف
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading} className="gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">تحديث</span>
          </Button>
          <Button onClick={handleOpenCreate} rightIcon={<UserPlus className="w-4 h-4" />}>
            إضافة مورد
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-semibold text-slate-400">إجمالي الموردين</p>
              {isLoading ? (
                <div className="h-7 w-16 mt-1.5 bg-slate-800 rounded-lg animate-pulse" />
              ) : (
                <p className="text-lg md:text-xl font-bold text-slate-100 font-mono mt-1">{meta?.total ?? 0}</p>
              )}
            </div>
            <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Truck className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-semibold text-slate-400">موردين نشطين</p>
              {isLoading ? (
                <div className="h-7 w-16 mt-1.5 bg-slate-800 rounded-lg animate-pulse" />
              ) : (
                <p className="text-lg md:text-xl font-bold text-emerald-400 font-mono mt-1">{activeCount}</p>
              )}
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Check className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-semibold text-slate-400">موردين دائنين</p>
              {isLoading ? (
                <div className="h-7 w-16 mt-1.5 bg-slate-800 rounded-lg animate-pulse" />
              ) : (
                <p className="text-lg md:text-xl font-bold text-amber-400 font-mono mt-1">{debtCount}</p>
              )}
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-semibold text-slate-400">إجمالي المستحقات</p>
              {isLoading ? (
                <div className="h-7 w-20 mt-1.5 bg-slate-800 rounded-lg animate-pulse" />
              ) : (
                <p className="text-lg md:text-xl font-bold text-rose-400 font-mono mt-1">{totalPayables.toFixed(2)} ₪</p>
              )}
            </div>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/60 p-3 sm:p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="بحث بالاسم، الشركة، أو الهاتف..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-slate-950/80 text-slate-100 border border-slate-700 rounded-xl pr-10 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-colors placeholder:text-slate-500"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => { setHasDebt(undefined); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${hasDebt === undefined ? 'bg-brand-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}
            >
              الكل
            </button>
            <button
              type="button"
              onClick={() => { setHasDebt(true); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors ${hasDebt === true ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-amber-400 hover:bg-slate-700'}`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>الموردين الدائنين فقط</span>
            </button>
          </div>
        </div>

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
                    if (label.includes('الدائنين')) setHasDebt(undefined);
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
              onClick={() => { setSearch(''); setHasDebt(undefined); setPage(1); }}
              className="text-[11px] text-slate-500 hover:text-slate-300 underline transition-colors"
            >
              مسح الكل
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        /* Loading skeleton */
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800">
                  {['اسم المورد', 'الهاتف', 'المستحقات', 'الحساب البنكي', 'الحالة', 'إجراءات'].map((h) => (
                    <th key={h} className="py-3 px-4 text-slate-500 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-800 rounded w-32" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-800 rounded w-24" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-800 rounded w-20" /></td>
                    <td className="py-3.5 px-4"><div className="h-4 bg-slate-800 rounded w-28" /></td>
                    <td className="py-3.5 px-4"><div className="h-5 bg-slate-800 rounded-full w-14" /></td>
                    <td className="py-3.5 px-4"><div className="flex justify-center gap-2"><div className="h-6 w-6 bg-slate-800 rounded" /><div className="h-6 w-6 bg-slate-800 rounded" /><div className="h-6 w-6 bg-slate-800 rounded" /></div></td>
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
      ) : suppliers.length === 0 ? (
        /* Empty state */
        <EmptyState
          icon={Truck}
          title="لم يتم العثور على موردين"
          description={hasActiveFilters ? 'جرّب تغيير عوامل التصفية أو البحث بكلمات مختلفة' : 'يمكنك إضافة موردين لتسجيل فواتير الشراء والتوريد'}
          actionLabel={hasActiveFilters ? 'مسح التصفية' : 'إضافة مورد جديد'}
          onAction={hasActiveFilters ? () => { setSearch(''); setHasDebt(undefined); setPage(1); } : handleOpenCreate}
        />
      ) : (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden">
          {/* Mobile cards */}
          <div className="lg:hidden divide-y divide-slate-800/60">
            {suppliers.map((supplier) => {
              const balance = Number(supplier.current_balance);

              return (
                <div key={supplier.id} className="p-4 space-y-3">
                  {/* Name + status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
                        <Truck className="w-4 h-4 text-brand-400" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-100 text-sm block truncate">{supplier.name}</span>
                        {supplier.company_name && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Building className="w-3 h-3 text-slate-500" />
                            <span className="truncate">{supplier.company_name}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    {supplier.is_active ? (
                      <Badge variant="success" size="sm">نشط</Badge>
                    ) : (
                      <Badge variant="neutral" size="sm">معطل</Badge>
                    )}
                  </div>

                  {/* Contact */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                    {supplier.phone && (
                      <span className="flex items-center gap-1 font-mono"><Phone className="w-3 h-3 text-slate-500" />{supplier.phone}</span>
                    )}
                    {supplier.email && (
                      <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3 text-slate-500" />{supplier.email}</span>
                    )}
                    {supplier.address && (
                      <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3 text-slate-500" />{supplier.address}</span>
                    )}
                  </div>

                  {/* Balance */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">المستحقات الحالية</span>
                      <span className={`font-mono text-sm font-bold ${balance > 0 ? 'text-rose-400' : balance < 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {balance.toFixed(2)} ₪
                      </span>
                    </div>
                    {balance > 0 && (
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full rounded-full bg-rose-500 transition-all" style={{ width: `${Math.min(100, balance)}%` }} />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                    {balance > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setPayingSupplier(supplier); setPaymentAmount(balance.toFixed(2)); }}
                        className="text-rose-400 hover:bg-rose-500/10 gap-1 flex-1 justify-center"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>صرف</span>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(supplier)}
                      className="text-slate-300 hover:bg-slate-800 gap-1 flex-1 justify-center"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>تعديل</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(supplier)}
                      className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 gap-1 flex-1 justify-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold select-none">
                  <th className="py-3.5 px-4">اسم المورد / الشركة</th>
                  <th className="py-3.5 px-4">الهاتف</th>
                  <th className="py-3.5 px-4">البريد / العنوان</th>
                  <th className="py-3.5 px-4">المستحقات الحالية</th>
                  <th className="py-3.5 px-4">الحساب البنكي / IBAN</th>
                  <th className="py-3.5 px-4">الحالة</th>
                  <th className="py-3.5 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {suppliers.map((supplier) => {
                  const balance = Number(supplier.current_balance);

                  return (
                    <tr key={supplier.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
                            <Truck className="w-4 h-4 text-brand-400" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-100 text-sm block">{supplier.name}</span>
                            {supplier.company_name && (
                              <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <Building className="w-3 h-3" />
                                <span>{supplier.company_name}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {supplier.phone ? (
                          <span className="inline-flex items-center gap-1 font-mono text-slate-300">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{supplier.phone}</span>
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="space-y-0.5">
                          {supplier.email ? (
                            <span className="text-slate-400 text-xs flex items-center gap-1 truncate block">
                              <Mail className="w-3 h-3 shrink-0" />{supplier.email}
                            </span>
                          ) : null}
                          {supplier.address ? (
                            <span className="text-slate-500 text-[11px] flex items-center gap-1 truncate block">
                              <MapPin className="w-3 h-3 shrink-0" />{supplier.address}
                            </span>
                          ) : null}
                          {!supplier.email && !supplier.address && <span className="text-slate-600">—</span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-sm ${balance > 0 ? 'text-rose-400' : balance < 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {balance.toFixed(2)} ₪
                          </span>
                          {balance > 0 && <Badge variant="danger" size="sm">مدين</Badge>}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {supplier.bank_iban ? (
                          <div>
                            <span className="text-slate-300 font-mono text-[11px] block">{supplier.bank_iban}</span>
                            {supplier.bank_name && <span className="text-[10px] text-slate-500">{supplier.bank_name}</span>}
                          </div>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {supplier.is_active ? (
                          <Badge variant="success" size="sm">نشط</Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">معطل</Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1">
                          {balance > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="تسجيل سند صرف"
                              onClick={() => { setPayingSupplier(supplier); setPaymentAmount(balance.toFixed(2)); }}
                              className="text-rose-400 hover:bg-rose-500/10 p-1.5"
                            >
                              <CreditCard className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            title="تعديل بيانات المورد"
                            onClick={() => handleOpenEdit(supplier)}
                            className="text-slate-300 hover:bg-slate-800 p-1.5"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="حذف / تعطيل المورد"
                            onClick={() => setDeleteTarget(supplier)}
                            className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 p-1.5"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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

      {/* ── Create/Edit Supplier Modal ──────────────────── */}
      {isSupplierModalOpen && (
        <Modal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} title={editingSupplier ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'} subtitle="سجل بيانات الشركة أو المندوب والحسابات البنكية" maxWidth="md">
          <form onSubmit={handleSaveSupplier} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="اسم المورد / المندوب *" placeholder="مثال: أحمد عبد الله" value={formName} onChange={(e) => setFormName(e.target.value)} autoFocus />
              <Input label="اسم الشركة / المؤسسة" placeholder="مثال: شركة الروابي للتوزيع" value={formCompanyName} onChange={(e) => setFormCompanyName(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="رقم الهاتف" placeholder="0500000000" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
              <Input label="البريد الإلكتروني" placeholder="supplier@example.com" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="الرقم الضريبي" placeholder="300000000000003" value={formTaxNumber} onChange={(e) => setFormTaxNumber(e.target.value)} />
              <Input label="العنوان / المستودع" placeholder="الرياض، المدينة الصناعية الثانية" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="اسم البنك" placeholder="مثال: مصرف الراجحي" value={formBankName} onChange={(e) => setFormBankName(e.target.value)} />
              <Input label="رقم الآيبان (IBAN)" placeholder="SA0000000000000000000000" value={formBankIban} onChange={(e) => setFormBankIban(e.target.value)} />
            </div>

            {/* Current balance preview for edit */}
            {editingSupplier && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">المستحقات الحالية</span>
                <span className={`font-mono text-sm font-bold ${Number(editingSupplier.current_balance) > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                  {Number(editingSupplier.current_balance).toFixed(2)} ₪
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsSupplierModalOpen(false)} disabled={isSaving}>إلغاء</Button>
              <Button type="submit" isLoading={isSaving} rightIcon={<Check className="w-4 h-4" />}>{editingSupplier ? 'حفظ التعديلات' : 'إضافة المورد'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Payment Modal ──────────────────────────────────── */}
      {payingSupplier && (
        <Modal isOpen={!!payingSupplier} onClose={() => setPayingSupplier(null)} title="سند صرف وسداد مستحقات" subtitle={`المورد: ${payingSupplier.name}`} maxWidth="md">
          <form onSubmit={handleConfirmPayment} className="space-y-4">
            {/* Balance summary */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">المستحقات الحالية</span>
                <span className="font-mono font-bold text-rose-400">{Number(payingSupplier.current_balance).toFixed(2)} ₪</span>
              </div>
            </div>

            <Input type="number" step="0.01" label="المبلغ المسدد (₪) *" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} autoFocus />
            <Select label="طريقة الدفع *" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} options={[{ value: 'cash', label: 'نقداً' }, { value: 'card', label: 'بطاقة / شبكة' }, { value: 'bank_transfer', label: 'حوالة بنكية' }]} />

            {/* Quick amount buttons */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">دفع سريع:</span>
              {[
                { label: 'النصف', fraction: 0.5 },
                { label: 'الثلث', fraction: 1 / 3 },
                { label: 'الكل', fraction: 1 },
              ].map(({ label, fraction }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setPaymentAmount((Number(payingSupplier.current_balance) * fraction).toFixed(2))}
                  className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-slate-100 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>

            <Input label="بيان / ملاحظات السند" placeholder="مثال: دفعة من حساب الفاتورة" value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button type="button" variant="outline" onClick={() => setPayingSupplier(null)} disabled={isPaying}>إلغاء</Button>
              <Button type="submit" isLoading={isPaying} className="bg-rose-500 hover:bg-rose-600 text-white font-bold" rightIcon={<Check className="w-4 h-4" />}>تأكيد سند الصرف</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Delete Confirmation ──────────────────────── */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        supplierName={deleteTarget?.name || ''}
      />
    </div>
  );
}
