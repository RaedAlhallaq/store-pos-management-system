import { useCallback, useEffect, useState } from 'react';
import { customersApi } from '../api/customersApi';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Pagination } from '../../../components/ui/Pagination';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import {
  Users,
  UserPlus,
  Search,
  DollarSign,
  AlertTriangle,
  Phone,
  Edit,
  Trash2,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

export const CustomersPage = () => {
  const [search, setSearch] = useState('');
  const [hasDebt, setHasDebt] = useState(undefined);
  const [page, setPage] = useState(1);

  // Customer Edit/Create Modal state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  // Payment Modal state
  const [payingCustomer, setPayingCustomer] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Form state
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTaxNumber, setFormTaxNumber] = useState('');
  const [formCreditLimit, setFormCreditLimit] = useState('1000.00');
  const [formAddress, setFormAddress] = useState('');

  // Data state
  const [customersData, setCustomersData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  const refreshCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      setCustomersData(
        await customersApi.getCustomers({
          page,
          search: search || undefined,
          has_debt: hasDebt,
          per_page: 15,
        })
      );
    } catch {
      setCustomersData(null);
    } finally {
      setIsLoading(false);
    }
  }, [page, search, hasDebt]);

  useEffect(() => {
    refreshCustomers();
  }, [refreshCustomers]);

  const handleDeleteCustomer = async (customer) => {
    try {
      const res = await customersApi.deleteCustomer(customer.id);
      await refreshCustomers();
      toast.success(res.message || 'تم حذف العميل');
    } catch (err) {
      toast.error(err.response?.data?.message || 'تعذر حذف العميل');
    }
  };

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormTaxNumber('');
    setFormCreditLimit('1000.00');
    setFormAddress('');
    setIsCustomerModalOpen(true);
  };

  const handleOpenEdit = (customer) => {
    setEditingCustomer(customer);
    setFormName(customer.name);
    setFormPhone(customer.phone || '');
    setFormEmail(customer.email || '');
    setFormTaxNumber(customer.tax_number || '');
    setFormCreditLimit(customer.credit_limit || '0.00');
    setFormAddress(customer.address || '');
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('اسم العميل مطلوب');
      return;
    }

    const payload = {
      name: formName.trim(),
      phone: formPhone.trim() || undefined,
      email: formEmail.trim() || undefined,
      tax_number: formTaxNumber.trim() || undefined,
      credit_limit: formCreditLimit || '0.00',
      address: formAddress.trim() || undefined,
      is_active: true,
    };

    setIsSavingCustomer(true);
    try {
      if (editingCustomer) {
        await customersApi.updateCustomer(editingCustomer.id, payload);
        await refreshCustomers();
        toast.success('تم تحديث بيانات العميل بنجاح');
        setIsCustomerModalOpen(false);
        setEditingCustomer(null);
      } else {
        await customersApi.createCustomer(payload);
        await refreshCustomers();
        toast.success('تمت إضافة العميل بنجاح');
        setIsCustomerModalOpen(false);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || (editingCustomer ? 'فشل تحديث العميل' : 'فشلت إضافة العميل')
      );
    } finally {
      setIsSavingCustomer(false);
    }
  };

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    const amountNum = Number(paymentAmount);
    if (!payingCustomer || isNaN(amountNum) || amountNum <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح لسند القبض');
      return;
    }

    setIsRecordingPayment(true);
    try {
      await customersApi.recordPayment(payingCustomer.id, {
        amount: amountNum,
        payment_method: paymentMethod,
        notes: paymentNotes || undefined,
      });
      await refreshCustomers();
      toast.success('تم تسجيل سند القبض وتحديث رصيد العميل بنجاح');
      setPayingCustomer(null);
      setPaymentAmount('');
      setPaymentNotes('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'فشل تسجيل الدفعة');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const totalOutstandingDebt =
    customersData?.data?.reduce((sum, c) => sum + Math.max(0, Number(c.current_balance)), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-400" />
            <span>دليل العملاء والديون</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            إدارة حسابات العملاء، متابعة المديونيات، وسندات سداد الديون
          </p>
        </div>

        <Button onClick={handleOpenCreate} rightIcon={<UserPlus className="w-4 h-4" />}>
          إضافة عميل جديد
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">إجمالي العملاء</p>
              <p className="text-xl font-bold text-slate-100 font-mono mt-1">
                {customersData?.meta?.total ?? 0} عميل
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">مسجلين في النظام</p>
            </div>
            <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">إجمالي المديونيات المستحقة</p>
              <p className="text-xl font-bold text-amber-400 font-mono mt-1">
                {totalOutstandingDebt.toFixed(2)} ₪
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">مستحقات آجلة لدى العملاء</p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">عملاء عليهم ديون</p>
              <p className="text-xl font-bold text-rose-400 font-mono mt-1">
                {customersData?.data?.filter((c) => Number(c.current_balance) > 0).length || 0} عميل
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">في الصفحة الحالية</p>
            </div>
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="ابحث بالاسم، الهاتف، أو الرقم الضريبي..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-950/80 text-slate-100 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setHasDebt(undefined);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              hasDebt === undefined
                ? 'bg-brand-500 text-slate-950'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            جميع العملاء
          </button>

          <button
            type="button"
            onClick={() => {
              setHasDebt(true);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors ${
              hasDebt === true
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-amber-400 hover:bg-slate-750'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>العملاء المدينين فقط</span>
          </button>
        </div>
      </div>

      {/* Customers Data Table */}
      <Card className="overflow-hidden border-slate-800 bg-slate-900/70">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <LoadingSpinner size="lg" />
            <span className="text-xs text-slate-400">جارِ تحميل العملاء...</span>
          </div>
        ) : !customersData?.data || customersData.data.length === 0 ? (
          <EmptyState
            title="لم يتم العثور على أي عملاء"
            description="يمكنك إضافة عملاء جدد لتسجيل الفواتير الآجلة ومتابعة الأرصدة"
            actionLabel="إضافة عميل جديد"
            onAction={handleOpenCreate}
          />
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold select-none">
                    <th className="py-3.5 px-4">اسم العميل</th>
                    <th className="py-3.5 px-4">الهاتف / الجوال</th>
                    <th className="py-3.5 px-4">الرصيد الحالي (المديونية)</th>
                    <th className="py-3.5 px-4">الحد الائتماني</th>
                    <th className="py-3.5 px-4">الحالة</th>
                    <th className="py-3.5 px-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {customersData.data.map((customer) => {
                    const balance = Number(customer.current_balance);
                    const limit = Number(customer.credit_limit);
                    const isOverLimit = limit > 0 && balance > limit;

                    return (
                      <tr key={customer.id} className="hover:bg-slate-850/50 transition-colors">
                        {/* Name */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-100 text-sm block">
                            {customer.name}
                          </span>
                          {customer.tax_number && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              رقم ضريبي: {customer.tax_number}
                            </span>
                          )}
                        </td>

                        {/* Phone */}
                        <td className="py-3.5 px-4">
                          {customer.phone ? (
                            <span className="inline-flex items-center gap-1 font-mono text-slate-300">
                              <Phone className="w-3 h-3 text-slate-500" />
                              <span>{customer.phone}</span>
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>

                        {/* Current Balance */}
                        <td className="py-3.5 px-4 font-mono">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-bold text-sm ${
                                balance > 0
                                  ? 'text-amber-400'
                                  : balance < 0
                                  ? 'text-emerald-400'
                                  : 'text-slate-400'
                              }`}
                            >
                              {balance.toFixed(2)} ₪
                            </span>
                            {isOverLimit && (
                              <Badge variant="danger" size="sm">
                                تجاوز السقف
                              </Badge>
                            )}
                          </div>
                        </td>

                        {/* Credit Limit */}
                        <td className="py-3.5 px-4 font-mono text-slate-400">
                          {limit > 0 ? `${limit.toFixed(2)} ₪` : 'غير محدد'}
                        </td>

                        {/* Active Status */}
                        <td className="py-3.5 px-4">
                          {customer.is_active ? (
                            <Badge variant="success" size="sm">نشط</Badge>
                          ) : (
                            <Badge variant="neutral" size="sm">معطل</Badge>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {balance > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                title="تسجيل سند قبض / سداد دين"
                                onClick={() => {
                                  setPayingCustomer(customer);
                                  setPaymentAmount(balance.toFixed(2));
                                }}
                                className="text-emerald-400 hover:bg-emerald-500/10 p-1.5"
                              >
                                <DollarSign className="w-4 h-4" />
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              title="تعديل بيانات العميل"
                              onClick={() => handleOpenEdit(customer)}
                              className="text-slate-300 hover:bg-slate-800 p-1.5"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              title="حذف / تعطيل العميل"
                              onClick={() => {
                                if (window.confirm(`هل أنت متأكد من حذف العميل: "${customer.name}"؟`)) {
                                  handleDeleteCustomer(customer);
                                }
                              }}
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

            {/* Pagination */}
            {customersData.meta && (
              <div className="px-4 border-t border-slate-800">
                <Pagination
                  currentPage={customersData.meta.current_page}
                  lastPage={customersData.meta.last_page}
                  total={customersData.meta.total}
                  from={customersData.meta.from ?? 1}
                  to={customersData.meta.to ?? customersData.meta.total}
                  onPageChange={(p) => setPage(p)}
                />
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Customer Create/Edit Modal */}
      {isCustomerModalOpen && (
        <Modal
          isOpen={isCustomerModalOpen}
          onClose={() => setIsCustomerModalOpen(false)}
          title={editingCustomer ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
          subtitle="سجل بيانات التواصل والسقف الائتماني"
          maxWidth="md"
        >
          <form onSubmit={handleSaveCustomer} className="space-y-4">
            <Input
              label="اسم العميل *"
              placeholder="مثال: صالح الراجحي"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              autoFocus
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="رقم الهاتف"
                placeholder="0500000000"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
              />

              <Input
                type="number"
                step="50"
                label="الحد الائتماني للديون (₪)"
                placeholder="1000.00"
                value={formCreditLimit}
                onChange={(e) => setFormCreditLimit(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="البريد الإلكتروني"
                placeholder="customer@example.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />

              <Input
                label="الرقم الضريبي (اختياري)"
                placeholder="300000000000003"
                value={formTaxNumber}
                onChange={(e) => setFormTaxNumber(e.target.value)}
              />
            </div>

            <Input
              label="العنوان / المدينة"
              placeholder="الرياض، حي السليمانية"
              value={formAddress}
              onChange={(e) => setFormAddress(e.target.value)}
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCustomerModalOpen(false)}
                disabled={isSavingCustomer}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                isLoading={isSavingCustomer}
                rightIcon={<Check className="w-4 h-4" />}
              >
                {editingCustomer ? 'حفظ التعديلات' : 'إضافة العميل'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Settle Debt Payment Modal */}
      {payingCustomer && (
        <Modal
          isOpen={!!payingCustomer}
          onClose={() => setPayingCustomer(null)}
          title="سند قبض وسداد مديونية"
          subtitle={`العميل: ${payingCustomer.name} (الرصيد المدين: ${Number(payingCustomer.current_balance).toFixed(2)} ₪)`}
          maxWidth="md"
        >
          <form onSubmit={handleConfirmPayment} className="space-y-4">
            <Input
              type="number"
              step="0.01"
              label="المبلغ المسدد (₪) *"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              autoFocus
            />

            <Select
              label="طريقة السداد *"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              options={[
                { value: 'cash', label: 'نقداً (Cash)' },
                { value: 'card', label: 'بطاقة مدى / شبكة' },
                { value: 'bank_transfer', label: 'حوالة بنكية' },
              ]}
            />

            <Input
              label="بيان / ملاحظات السند"
              placeholder="مثال: دفعة من حساب الفاتورة POS-20260830-0001"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPayingCustomer(null)}
                disabled={isRecordingPayment}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                isLoading={isRecordingPayment}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
                rightIcon={<Check className="w-4 h-4" />}
              >
                تأكيد سند القبض
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
