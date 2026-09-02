import { useState, useEffect, useCallback } from 'react';
import { customersApi } from '../api/customersApi';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Pagination } from '../../../components/ui/Pagination';
import { EmptyState } from '../../../components/ui/EmptyState';
import {
  Users, UserPlus, Search, DollarSign, AlertTriangle, Phone, Edit, Trash2, Check, RefreshCw, X, CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';

export function CustomersPage() {
  const [search, setSearch] = useState('');
  const [hasDebt, setHasDebt] = useState(undefined);
  const [perPage, setPerPage] = useState(15);
  const [page, setPage] = useState(1);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [payingCustomer, setPayingCustomer] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');

  const [customersData, setCustomersData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await customersApi.getCustomers({ page, search: search || undefined, has_debt: hasDebt, per_page: perPage });
      setCustomersData(data);
    } catch (err) {
      setLoadError(err?.message || 'فشل تحميل بيانات العملاء');
      toast.error('فشل تحميل بيانات العملاء');
    } finally { setIsLoading(false); }
  }, [page, search, hasDebt, perPage]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleOpenCreate = () => { setEditingCustomer(null); setFormName(''); setFormPhone(''); setIsCustomerModalOpen(true); };
  const handleOpenEdit = (customer) => { setEditingCustomer(customer); setFormName(customer.name); setFormPhone(customer.phone || ''); setIsCustomerModalOpen(true); };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!formName.trim()) { toast.error('اسم العميل مطلوب'); return; }
    const payload = { name: formName.trim(), phone: formPhone.trim() || undefined, is_active: true };
    setIsSaving(true);
    try {
      if (editingCustomer) { await customersApi.updateCustomer(editingCustomer.id, payload); toast.success('تم تحديث بيانات العميل بنجاح'); }
      else { await customersApi.createCustomer(payload); toast.success('تمت إضافة العميل بنجاح'); }
      setIsCustomerModalOpen(false); setEditingCustomer(null); await loadData();
    } catch (err) { toast.error(err?.response?.data?.message || err?.message || 'فشلت العملية'); } finally { setIsSaving(false); }
  };

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    const amountNum = Number(paymentAmount);
    if (!payingCustomer || isNaN(amountNum) || amountNum <= 0) { toast.error('يرجى إدخال مبلغ صحيح لسند القبض'); return; }
    setIsPaying(true);
    try {
      await customersApi.recordPayment(payingCustomer.id, { amount: amountNum, payment_method: paymentMethod, notes: paymentNotes || undefined });
      toast.success('تم تسجيل سند القبض وتحديث رصيد العميل بنجاح');
      setPayingCustomer(null); setPaymentAmount(''); setPaymentNotes(''); await loadData();
    } catch (err) { toast.error(err?.response?.data?.message || err?.message || 'فشل تسجيل الدفعة'); } finally { setIsPaying(false); }
  };

  const handleDeleteCustomer = async (id, name) => {
    if (!window.confirm(`هل أنت متأكد من حذف العميل: "${name}"؟`)) return;
    try { const res = await customersApi.deleteCustomer(id); toast.success(res.message || 'تم حذف العميل'); await loadData(); }
    catch (err) { toast.error(err?.response?.data?.message || 'تعذر حذف العميل'); }
  };

  const customers = customersData?.data || [];
  const meta = customersData?.meta;
  const totalOutstandingDebt = customers.reduce((sum, c) => sum + Math.max(0, Number(c.current_balance)), 0);
  const debtCount = customers.filter((c) => Number(c.current_balance) > 0).length;
  const activeCount = customers.filter((c) => c.is_active).length;
  const hasActiveFilters = search || hasDebt !== undefined;
  const activeFilterLabels = [];
  if (search) activeFilterLabels.push(`بحث: "${search}"`);
  if (hasDebt === true) activeFilterLabels.push('مدينون فقط');

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-400" />
            <span>دليل العملاء والديون</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">إدارة حسابات العملاء، متابعة المديونيات، وسندات سداد الديون</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading} className="gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">تحديث</span>
          </Button>
          <Button onClick={handleOpenCreate} rightIcon={<UserPlus className="w-4 h-4" />}>إضافة عميل</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold text-slate-400">إجمالي العملاء</p>{isLoading ? <div className="h-7 w-16 mt-1.5 bg-slate-800 rounded-lg animate-pulse" /> : <p className="text-xl font-bold text-slate-100 font-mono mt-1">{meta?.total ?? 0}</p>}</div><div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20"><Users className="w-5 h-5" /></div></div></div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold text-slate-400">عملاء نشطون</p>{isLoading ? <div className="h-7 w-16 mt-1.5 bg-slate-800 rounded-lg animate-pulse" /> : <p className="text-xl font-bold text-emerald-400 font-mono mt-1">{activeCount}</p>}</div><div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><Check className="w-5 h-5" /></div></div></div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold text-slate-400">عملاء مدينون</p>{isLoading ? <div className="h-7 w-16 mt-1.5 bg-slate-800 rounded-lg animate-pulse" /> : <p className="text-xl font-bold text-rose-400 font-mono mt-1">{debtCount}</p>}</div><div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20"><AlertTriangle className="w-5 h-5" /></div></div></div>
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold text-slate-400">إجمالي المديونيات</p>{isLoading ? <div className="h-7 w-20 mt-1.5 bg-slate-800 rounded-lg animate-pulse" /> : <p className="text-xl font-bold text-amber-400 font-mono mt-1">{totalOutstandingDebt.toFixed(2)} ₪</p>}</div><div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20"><DollarSign className="w-5 h-5" /></div></div></div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/60 p-3 sm:p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" placeholder="بحث بالاسم أو الهاتف..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-slate-950/80 text-slate-100 border border-slate-700 rounded-xl pr-10 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-colors placeholder:text-slate-500" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" onClick={() => { setHasDebt(undefined); setPage(1); }} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${hasDebt === undefined ? 'bg-brand-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'}`}>الكل</button>
            <button type="button" onClick={() => { setHasDebt(true); setPage(1); }} className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors ${hasDebt === true ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-amber-400 hover:bg-slate-700'}`}><AlertTriangle className="w-3.5 h-3.5" /><span>المدينون فقط</span></button>
          </div>
        </div>
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">عوامل التصفية النشطة:</span>
            {activeFilterLabels.map((label) => (
              <span key={label} className="inline-flex items-center gap-1 bg-brand-500/10 text-brand-400 text-[11px] font-medium px-2 py-0.5 rounded-lg border border-brand-500/20">
                {label}
                <button type="button" onClick={() => { if (label.startsWith('بحث')) setSearch(''); if (label.startsWith('مدين')) setHasDebt(undefined); setPage(1); }} className="hover:text-brand-300"><X className="w-3 h-3" /></button>
              </span>
            ))}
            <button type="button" onClick={() => { setSearch(''); setHasDebt(undefined); setPage(1); }} className="text-[11px] text-slate-500 hover:text-slate-300 underline transition-colors">مسح الكل</button>
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs"><thead><tr className="bg-slate-950/80 border-b border-slate-800">{['اسم العميل', 'الهاتف', 'الرصيد', 'الحالة', 'إجراءات'].map((h) => <th key={h} className="py-3 px-4 text-slate-500 font-semibold">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-800/50">{Array.from({ length: 5 }).map((_, i) => <tr key={i} className="animate-pulse"><td className="py-3.5 px-4"><div className="h-4 bg-slate-800 rounded w-32" /></td><td className="py-3.5 px-4"><div className="h-4 bg-slate-800 rounded w-24" /></td><td className="py-3.5 px-4"><div className="h-4 bg-slate-800 rounded w-20" /></td><td className="py-3.5 px-4"><div className="h-5 bg-slate-800 rounded-full w-14" /></td><td className="py-3.5 px-4"><div className="flex justify-center gap-2"><div className="h-6 w-6 bg-slate-800 rounded" /><div className="h-6 w-6 bg-slate-800 rounded" /></div></td></tr>)}</tbody>
            </table>
          </div>
        </div>
      ) : loadError ? (
        <div className="bg-slate-900/70 border border-rose-500/30 rounded-2xl p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-200 mb-1">فشل تحميل البيانات</h3>
          <p className="text-sm text-slate-400 mb-4">{loadError}</p>
          <Button onClick={loadData} variant="outline" className="gap-1.5"><RefreshCw className="w-4 h-4" /> إعادة المحاولة</Button>
        </div>
      ) : customers.length === 0 ? (
        <EmptyState title="لم يتم العثور على عملاء" description={hasActiveFilters ? 'جرّب تغيير عوامل التصفية أو البحث بكلمات مختلفة' : 'يمكنك إضافة عملاء لتسجيل الفواتير الآجلة ومتابعة الأرصدة'} actionLabel={hasActiveFilters ? 'مسح التصفية' : 'إضافة عميل جديد'} onAction={hasActiveFilters ? () => { setSearch(''); setHasDebt(undefined); setPage(1); } : handleOpenCreate} />
      ) : (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden">
          {/* Mobile cards */}
          <div className="lg:hidden divide-y divide-slate-800/60">
            {customers.map((customer) => {
              const balance = Number(customer.current_balance);
              return (
                <div key={customer.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0"><Users className="w-4 h-4 text-brand-400" /></div>
                      <div className="min-w-0"><span className="font-bold text-slate-100 text-sm block truncate">{customer.name}</span></div>
                    </div>
                    {customer.is_active ? <Badge variant="success" size="sm">نشط</Badge> : <Badge variant="neutral" size="sm">معطل</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                    {customer.phone && <span className="flex items-center gap-1 font-mono"><Phone className="w-3 h-3 text-slate-500" />{customer.phone}</span>}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">الرصيد</span>
                      <span className={`font-mono text-sm font-bold ${balance > 0 ? 'text-amber-400' : balance < 0 ? 'text-emerald-400' : 'text-slate-400'}`}>{balance.toFixed(2)} ₪</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                    {balance > 0 && <Button variant="ghost" size="sm" onClick={() => { setPayingCustomer(customer); setPaymentAmount(balance.toFixed(2)); }} className="text-emerald-400 hover:bg-emerald-500/10 gap-1 flex-1 justify-center"><CreditCard className="w-3.5 h-3.5" /><span>سداد</span></Button>}
                    <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(customer)} className="text-slate-300 hover:bg-slate-800 gap-1 flex-1 justify-center"><Edit className="w-3.5 h-3.5" /><span>تعديل</span></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteCustomer(customer.id, customer.name)} className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 gap-1 flex-1 justify-center"><Trash2 className="w-3.5 h-3.5" /><span>حذف</span></Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead><tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold select-none">
                <th className="py-3.5 px-4">اسم العميل</th><th className="py-3.5 px-4">الهاتف</th><th className="py-3.5 px-4">الرصيد الحالي</th><th className="py-3.5 px-4">الحالة</th><th className="py-3.5 px-4 text-center">إجراءات</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-800/60">
                {customers.map((customer) => {
                  const balance = Number(customer.current_balance);
                  return (
                    <tr key={customer.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4"><div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0"><Users className="w-4 h-4 text-brand-400" /></div><span className="font-bold text-slate-100 text-sm">{customer.name}</span></div></td>
                      <td className="py-3.5 px-4">{customer.phone ? <span className="inline-flex items-center gap-1 font-mono text-slate-300"><Phone className="w-3 h-3 text-slate-500" /><span>{customer.phone}</span></span> : <span className="text-slate-600">—</span>}</td>
                      <td className="py-3.5 px-4 font-mono"><span className={`font-bold text-sm ${balance > 0 ? 'text-amber-400' : balance < 0 ? 'text-emerald-400' : 'text-slate-400'}`}>{balance.toFixed(2)} ₪</span></td>
                      <td className="py-3.5 px-4">{customer.is_active ? <Badge variant="success" size="sm">نشط</Badge> : <Badge variant="neutral" size="sm">معطل</Badge>}</td>
                      <td className="py-3.5 px-4"><div className="flex items-center justify-center gap-1">
                        {balance > 0 && <Button variant="ghost" size="sm" onClick={() => { setPayingCustomer(customer); setPaymentAmount(balance.toFixed(2)); }} className="text-emerald-400 hover:bg-emerald-500/10 p-1.5"><CreditCard className="w-4 h-4" /></Button>}
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(customer)} className="text-slate-300 hover:bg-slate-800 p-1.5"><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteCustomer(customer.id, customer.name)} className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 p-1.5"><Trash2 className="w-4 h-4" /></Button>
                      </div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {meta && (
            <div className="px-4 py-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">عناصر في الصفحة:</span>
                {[10, 15, 25, 50].map((n) => (
                  <button key={n} type="button" onClick={() => { setPerPage(n); setPage(1); }} className={`px-2 py-0.5 rounded-lg text-xs font-mono transition-colors ${perPage === n ? 'bg-brand-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>{n}</button>
                ))}
              </div>
              <Pagination currentPage={meta.current_page} lastPage={meta.last_page} total={meta.total} from={meta.from ?? 1} to={meta.to ?? meta.total} onPageChange={(p) => setPage(p)} />
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Customer Modal */}
      {isCustomerModalOpen && (
        <Modal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} title={editingCustomer ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'} subtitle="بيانات التواصل الأساسية" maxWidth="md">
          <form onSubmit={handleSaveCustomer} className="space-y-4">
            <Input label="اسم العميل *" placeholder="مثال: صالح الراجحي" value={formName} onChange={(e) => setFormName(e.target.value)} autoFocus />
            <Input label="رقم الهاتف" placeholder="0500000000" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
            {editingCustomer && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">الرصيد الحالي</span>
                <span className={`font-mono text-sm font-bold ${Number(editingCustomer.current_balance) > 0 ? 'text-amber-400' : 'text-slate-300'}`}>{Number(editingCustomer.current_balance).toFixed(2)} ₪</span>
              </div>
            )}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsCustomerModalOpen(false)} disabled={isSaving}>إلغاء</Button>
              <Button type="submit" isLoading={isSaving} rightIcon={<Check className="w-4 h-4" />}>{editingCustomer ? 'حفظ التعديلات' : 'إضافة العميل'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Payment Modal */}
      {payingCustomer && (
        <Modal isOpen={!!payingCustomer} onClose={() => setPayingCustomer(null)} title="سند قبض وسداد مديونية" subtitle={`العميل: ${payingCustomer.name} — الرصيد المدين: ${Number(payingCustomer.current_balance).toFixed(2)} ₪`} maxWidth="md">
          <form onSubmit={handleConfirmPayment} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">الرصيد المدين</span>
              <span className="font-mono font-bold text-amber-400">{Number(payingCustomer.current_balance).toFixed(2)} ₪</span>
            </div>
            <Input type="number" step="0.01" label="المبلغ المسدد (₪) *" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} autoFocus />
            <Select label="طريقة السداد *" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} options={[{ value: 'cash', label: 'نقداً' }, { value: 'bank_of_palestine', label: 'بنك فلسطين' }, { value: 'palpay', label: 'PalPay' }, { value: 'jawwal_pay', label: 'Jawwal Pay' }]} />
            <Input label="بيان / ملاحظات السند" placeholder="مثال: دفعة من حساب الفاتورة" value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} />
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-semibold uppercase">دفع سريع:</span>
              {[{ label: 'النصف', fraction: 0.5 }, { label: 'الثلث', fraction: 1 / 3 }, { label: 'الكل', fraction: 1 }].map(({ label, fraction }) => (
                <button key={label} type="button" onClick={() => setPaymentAmount((Number(payingCustomer.current_balance) * fraction).toFixed(2))} className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 hover:text-slate-100 transition-colors">{label}</button>
              ))}
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button type="button" variant="outline" onClick={() => setPayingCustomer(null)} disabled={isPaying}>إلغاء</Button>
              <Button type="submit" isLoading={isPaying} className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold" rightIcon={<Check className="w-4 h-4" />}>تأكيد سند القبض</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
