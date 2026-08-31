import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersApi } from '../api/suppliersApi';
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
} from 'lucide-react';
import type { Supplier } from '../types/supplierTypes';
import { toast } from 'sonner';

export const SuppliersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [hasDebt, setHasDebt] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(1);

  // Supplier Modal state
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Payment Modal state
  const [payingSupplier, setPayingSupplier] = useState<Supplier | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Form state
  const [formName, setFormName] = useState('');
  const [formCompanyName, setFormCompanyName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTaxNumber, setFormTaxNumber] = useState('');
  const [formBankName, setFormBankName] = useState('');
  const [formBankIban, setFormBankIban] = useState('');
  const [formAddress, setFormAddress] = useState('');

  // Queries
  const { data: suppliersData, isLoading } = useQuery({
    queryKey: ['suppliers', { page, search, hasDebt }],
    queryFn: () => suppliersApi.getSuppliers({ page, search: search || undefined, has_debt: hasDebt, per_page: 15 }),
  });

  // Mutations
  const createSupplierMutation = useMutation({
    mutationFn: suppliersApi.createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['quick-suppliers'] });
      toast.success('تمت إضافة المورد بنجاح');
      setIsSupplierModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'فشلت إضافة المورد');
    },
  });

  const updateSupplierMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Supplier> }) =>
      suppliersApi.updateSupplier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['quick-suppliers'] });
      toast.success('تم تحديث بيانات المورد بنجاح');
      setIsSupplierModalOpen(false);
      setEditingSupplier(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'فشل تحديث المورد');
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { amount: number; payment_method: string; notes?: string };
    }) => suppliersApi.recordPayment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['quick-suppliers'] });
      toast.success('تم تسجيل سند الصرف وسداد دفعة المورد بنجاح');
      setPayingSupplier(null);
      setPaymentAmount('');
      setPaymentNotes('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'فشل تسجيل سند الصرف');
    },
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: suppliersApi.deleteSupplier,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['quick-suppliers'] });
      toast.success(res.message || 'تم حذف المورد');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'تعذر حذف المورد');
    },
  });

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

  const handleOpenEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormName(supplier.name);
    setFormCompanyName(supplier.company_name || '');
    setFormPhone(supplier.phone || '');
    setFormEmail(supplier.email || '');
    setFormTaxNumber(supplier.tax_number || '');
    setFormBankName(supplier.bank_name || '');
    setFormBankIban(supplier.bank_iban || '');
    setFormAddress(supplier.address || '');
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('اسم المورد أو المندوب مطلوب');
      return;
    }

    const payload: Partial<Supplier> = {
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

    if (editingSupplier) {
      await updateSupplierMutation.mutateAsync({ id: editingSupplier.id, data: payload });
    } else {
      await createSupplierMutation.mutateAsync(payload);
    }
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(paymentAmount);
    if (!payingSupplier || isNaN(amountNum) || amountNum <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح لسند الصرف');
      return;
    }

    await recordPaymentMutation.mutateAsync({
      id: payingSupplier.id,
      data: {
        amount: amountNum,
        payment_method: paymentMethod,
        notes: paymentNotes || undefined,
      },
    });
  };

  const totalOutstandingPayables =
    suppliersData?.data?.reduce((sum, s) => sum + Math.max(0, Number(s.current_balance)), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
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

        <Button onClick={handleOpenCreate} rightIcon={<UserPlus className="w-4 h-4" />}>
          إضافة مورد جديد
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">إجمالي الموردين</p>
              <p className="text-xl font-bold text-slate-100 font-mono mt-1">
                {suppliersData?.meta?.total ?? 0} مورد
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">شركات ومندوبي توزيع</p>
            </div>
            <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Truck className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">إجمالي المستحقات للموردين</p>
              <p className="text-xl font-bold text-rose-400 font-mono mt-1">
                {totalOutstandingPayables.toFixed(2)} ₪
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">ديون واجبة السداد من المتجر</p>
            </div>
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">موردين لهم مستحقات</p>
              <p className="text-xl font-bold text-amber-400 font-mono mt-1">
                {suppliersData?.data?.filter((s) => Number(s.current_balance) > 0).length || 0} مورد
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">في الصفحة الحالية</p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
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
            placeholder="ابحث باسم المورد، الشركة، أو الهاتف..."
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
            جميع الموردين
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
            <span>الموردين الدائنين فقط</span>
          </button>
        </div>
      </div>

      {/* Suppliers Data Table */}
      <Card className="overflow-hidden border-slate-800 bg-slate-900/70">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <LoadingSpinner size="lg" />
            <span className="text-xs text-slate-400">جارِ تحميل الموردين...</span>
          </div>
        ) : !suppliersData?.data || suppliersData.data.length === 0 ? (
          <EmptyState
            title="لم يتم العثور على أي موردين"
            description="يمكنك إضافة موردين جدد لتسجيل فواتير الشراء والتوريد"
            actionLabel="إضافة مورد جديد"
            onAction={handleOpenCreate}
          />
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold select-none">
                    <th className="py-3.5 px-4">اسم المورد / الشركة</th>
                    <th className="py-3.5 px-4">الهاتف / الجوال</th>
                    <th className="py-3.5 px-4">المستحقات الحالية</th>
                    <th className="py-3.5 px-4">الحساب البنكي / IBAN</th>
                    <th className="py-3.5 px-4">الحالة</th>
                    <th className="py-3.5 px-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {suppliersData.data.map((supplier) => {
                    const balance = Number(supplier.current_balance);

                    return (
                      <tr key={supplier.id} className="hover:bg-slate-850/50 transition-colors">
                        {/* Name & Company */}
                        <td className="py-3.5 px-4">
                          <div>
                            <span className="font-bold text-slate-100 text-sm block">
                              {supplier.name}
                            </span>
                            {supplier.company_name && (
                              <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Building className="w-3 h-3 text-slate-500" />
                                <span>{supplier.company_name}</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Phone */}
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

                        {/* Current Balance */}
                        <td className="py-3.5 px-4 font-mono">
                          <span
                            className={`font-bold text-sm ${
                              balance > 0
                                ? 'text-rose-400'
                                : balance < 0
                                ? 'text-emerald-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {balance.toFixed(2)} ₪
                          </span>
                        </td>

                        {/* Bank info */}
                        <td className="py-3.5 px-4">
                          {supplier.bank_iban ? (
                            <div>
                              <span className="text-slate-300 font-mono text-[11px] block">
                                {supplier.bank_iban}
                              </span>
                              {supplier.bank_name && (
                                <span className="text-[10px] text-slate-500">{supplier.bank_name}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>

                        {/* Active Status */}
                        <td className="py-3.5 px-4">
                          {supplier.is_active ? (
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
                                title="تسجيل سند صرف / سداد دفعة للمورد"
                                onClick={() => {
                                  setPayingSupplier(supplier);
                                  setPaymentAmount(balance.toFixed(2));
                                }}
                                className="text-rose-400 hover:bg-rose-500/10 p-1.5"
                              >
                                <DollarSign className="w-4 h-4" />
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
                              onClick={() => {
                                if (window.confirm(`هل أنت متأكد من حذف المورد: "${supplier.name}"؟`)) {
                                  deleteSupplierMutation.mutate(supplier.id);
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
            {suppliersData.meta && (
              <div className="px-4 border-t border-slate-800">
                <Pagination
                  currentPage={suppliersData.meta.current_page}
                  lastPage={suppliersData.meta.last_page}
                  total={suppliersData.meta.total}
                  from={suppliersData.meta.from ?? 1}
                  to={suppliersData.meta.to ?? suppliersData.meta.total}
                  onPageChange={(p) => setPage(p)}
                />
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Supplier Create/Edit Modal */}
      {isSupplierModalOpen && (
        <Modal
          isOpen={isSupplierModalOpen}
          onClose={() => setIsSupplierModalOpen(false)}
          title={editingSupplier ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}
          subtitle="سجل بيانات الشركة أو المندوب والحسابات البنكية"
          maxWidth="md"
        >
          <form onSubmit={handleSaveSupplier} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="اسم المورد / المندوب *"
                placeholder="مثال: أحمد عبد الله"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                autoFocus
              />

              <Input
                label="اسم الشركة / المؤسسة"
                placeholder="مثال: شركة الروابي للتوزيع"
                value={formCompanyName}
                onChange={(e) => setFormCompanyName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="رقم الهاتف"
                placeholder="0110000000"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
              />

              <Input
                label="الرقم الضريبي"
                placeholder="300000000000003"
                value={formTaxNumber}
                onChange={(e) => setFormTaxNumber(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="اسم البنك"
                placeholder="مثال: مصرف الراجحي"
                value={formBankName}
                onChange={(e) => setFormBankName(e.target.value)}
              />

              <Input
                label="رقم الآيبان (IBAN)"
                placeholder="SA0000000000000000000000"
                value={formBankIban}
                onChange={(e) => setFormBankIban(e.target.value)}
              />
            </div>

            <Input
              label="العنوان / المستودع"
              placeholder="الرياض، المدينة الصناعية الثانية"
              value={formAddress}
              onChange={(e) => setFormAddress(e.target.value)}
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSupplierModalOpen(false)}
                disabled={createSupplierMutation.isPending || updateSupplierMutation.isPending}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                isLoading={createSupplierMutation.isPending || updateSupplierMutation.isPending}
                rightIcon={<Check className="w-4 h-4" />}
              >
                {editingSupplier ? 'حفظ التعديلات' : 'إضافة المورد'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Settle Payable Payment Modal */}
      {payingSupplier && (
        <Modal
          isOpen={!!payingSupplier}
          onClose={() => setPayingSupplier(null)}
          title="سند صرف وسداد مستحقات مورد"
          subtitle={`المورد: ${payingSupplier.name} (المستحق: ${Number(payingSupplier.current_balance).toFixed(2)} ₪)`}
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
              label="طريقة الصرف *"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              options={[
                { value: 'cash', label: 'نقداً من الصندوق (Cash)' },
                { value: 'bank_transfer', label: 'حوالة بنكية' },
                { value: 'card', label: 'بطاقة مدى / حساب بنكي' },
              ]}
            />

            <Input
              label="بيان / ملاحظات السند"
              placeholder="مثال: سداد دفعة من فاتورة الشراء رقم PUR-20260830-0001"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPayingSupplier(null)}
                disabled={recordPaymentMutation.isPending}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                isLoading={recordPaymentMutation.isPending}
                className="bg-rose-500 hover:bg-rose-600 text-white font-bold"
                rightIcon={<Check className="w-4 h-4" />}
              >
                تأكيد سند الصرف
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
