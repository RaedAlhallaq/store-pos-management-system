import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import {
  Banknote,
  CreditCard,
  UserCheck,
  Split,
  Check,
  AlertCircle,
  Coins,
} from 'lucide-react';
import type { Customer } from '../../customers/types/customerTypes';
import { toast } from 'sonner';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  grandTotal: number;
  customer: Customer | null;
  customers: Customer[];
  onSelectCustomer: (customer: Customer | null) => void;
  onConfirmCheckout: (paymentData: {
    customer_id?: number | null;
    payments: { payment_method: 'cash' | 'card' | 'bank_transfer' | 'credit'; amount: number; reference_number?: string }[];
    notes?: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  grandTotal,
  customer,
  customers,
  onSelectCustomer,
  onConfirmCheckout,
  isLoading = false,
}) => {
  const [method, setMethod] = useState<'cash' | 'card' | 'credit' | 'split'>('cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [cardAmount, setCardAmount] = useState<string>('');
  const [cardRefNumber, setCardRefNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setMethod('cash');
      setCashTendered(grandTotal.toFixed(2));
      setCardAmount('');
      setCardRefNumber('');
      setNotes('');
    }
  }, [isOpen, grandTotal]);

  const tenderedNumber = Number(cashTendered || 0);
  const changeDue = Math.max(0, tenderedNumber - grandTotal);

  const handleQuickCash = (amount: number) => {
    setCashTendered(amount.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (method === 'credit' && !customer) {
      toast.error('يرجى تحديد عميل مسجل لإتمام عملية البيع الآجل.');
      return;
    }

    let paymentsPayload: { payment_method: 'cash' | 'card' | 'bank_transfer' | 'credit'; amount: number; reference_number?: string }[] = [];

    if (method === 'cash') {
      paymentsPayload.push({
        payment_method: 'cash',
        amount: grandTotal,
      });
    } else if (method === 'card') {
      paymentsPayload.push({
        payment_method: 'card',
        amount: grandTotal,
        reference_number: cardRefNumber || undefined,
      });
    } else if (method === 'credit') {
      paymentsPayload.push({
        payment_method: 'credit',
        amount: grandTotal,
      });
    } else if (method === 'split') {
      const cash = Number(cashTendered || 0);
      const card = Number(cardAmount || 0);

      if (cash + card < grandTotal) {
        toast.error('مجموع الدفعات أقل من إجمالي الفاتورة المطلوب.');
        return;
      }

      if (cash > 0) {
        paymentsPayload.push({ payment_method: 'cash', amount: cash });
      }
      if (card > 0) {
        paymentsPayload.push({ payment_method: 'card', amount: card, reference_number: cardRefNumber || undefined });
      }
    }

    await onConfirmCheckout({
      customer_id: customer?.id || null,
      payments: paymentsPayload,
      notes: notes || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="سداد وإصدار الفاتورة"
      subtitle="اختر طريقة الدفع وحساب المبلغ المستلم"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Total Grand Banner */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-semibold">إجمالي الفاتورة المطلوب</span>
            <span className="text-2xl font-black text-brand-400 font-mono">
              {grandTotal.toFixed(2)} <span className="text-xs text-slate-400">₪</span>
            </span>
          </div>

          <div className="text-left">
            <span className="text-xs text-slate-400 block font-semibold">العميل المحدد</span>
            <span className="text-sm font-bold text-slate-200 block truncate max-w-[150px]">
              {customer ? customer.name : 'عميل نقدي عام'}
            </span>
          </div>
        </div>

        {/* Payment Method Selector Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => setMethod('cash')}
            className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
              method === 'cash'
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold ring-2 ring-emerald-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
            }`}
          >
            <Banknote className="w-5 h-5" />
            <span className="text-xs">نقداً (Cash)</span>
          </button>

          <button
            type="button"
            onClick={() => setMethod('card')}
            className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
              method === 'card'
                ? 'bg-sky-500/20 border-sky-500/50 text-sky-300 font-bold ring-2 ring-sky-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-xs">مدى / شبكة</span>
          </button>

          <button
            type="button"
            onClick={() => setMethod('credit')}
            className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
              method === 'credit'
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold ring-2 ring-amber-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-5 h-5" />
            <span className="text-xs">آجل / ذمة</span>
          </button>

          <button
            type="button"
            onClick={() => setMethod('split')}
            className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
              method === 'split'
                ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 font-bold ring-2 ring-purple-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
            }`}
          >
            <Split className="w-5 h-5" />
            <span className="text-xs">دفع مجزأ</span>
          </button>
        </div>

        {/* Dynamic Payment Body */}
        {method === 'cash' && (
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-emerald-400" />
                <span>المبلغ المستلم من الزبون</span>
              </span>
              <span className="text-emerald-400 font-mono font-bold">
                الباقي للعميل: {changeDue.toFixed(2)} ₪
              </span>
            </div>

            <Input
              type="number"
              step="0.5"
              placeholder="0.00"
              value={cashTendered}
              onChange={(e) => setCashTendered(e.target.value)}
              className="text-lg font-mono font-bold"
            />

            {/* Fast Denomination Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleQuickCash(grandTotal)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold transition-colors"
              >
                المبلغ بالتمام ({grandTotal.toFixed(2)})
              </button>
              {[50, 100, 200, 500].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickCash(amt)}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold transition-colors"
                >
                  {amt} ₪
                </button>
              ))}
            </div>
          </div>
        )}

        {method === 'card' && (
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-400">
              <CreditCard className="w-4 h-4" />
              <span>دفع عبر أجهزة الدفع الإلكتروني (مدى / فيزا / ماستركارد)</span>
            </div>

            <Input
              label="رقم الإيصال / الرقم المرجعي للشبكة (اختياري)"
              placeholder="مثال: AUTH-987654"
              value={cardRefNumber}
              onChange={(e) => setCardRefNumber(e.target.value)}
            />
          </div>
        )}

        {method === 'credit' && (
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
              <UserCheck className="w-4 h-4" />
              <span>تسجيل الفاتورة كدين على حساب العميل</span>
            </div>

            <Select
              label="اختر العميل *"
              value={customer?.id ? String(customer.id) : ''}
              onChange={(e) => {
                const found = customers.find((c) => c.id === Number(e.target.value));
                onSelectCustomer(found || null);
              }}
              options={customers.map((c) => ({
                value: c.id,
                label: `${c.name} (الرصيد الحالي: ${c.current_balance} ₪ - سقف: ${c.credit_limit} ₪)`,
              }))}
              placeholderOption="اختر عميل السجل..."
            />

            {!customer && (
              <p className="text-xs text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>يجب اختيار عميل مسجل لتسجيل الفاتورة الآجلة</span>
              </p>
            )}
          </div>
        )}

        {method === 'split' && (
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                type="number"
                step="0.5"
                label="المدفوع نقداً (Cash)"
                placeholder="0.00"
                value={cashTendered}
                onChange={(e) => {
                  const cashVal = parseFloat(e.target.value) || 0;
                  setCashTendered(e.target.value);
                  setCardAmount(Math.max(0, grandTotal - cashVal).toFixed(2));
                }}
              />

              <Input
                type="number"
                step="0.5"
                label="المدفوع عبر الشبكة (Card)"
                placeholder="0.00"
                value={cardAmount}
                onChange={(e) => setCardAmount(e.target.value)}
              />
            </div>

            <Input
              label="الرقم المرجعي للشبكة (اختياري)"
              placeholder="مثال: REF-1234"
              value={cardRefNumber}
              onChange={(e) => setCardRefNumber(e.target.value)}
            />
          </div>
        )}

        {/* Notes */}
        <Input
          label="ملاحظات على الفاتورة (اختياري)"
          placeholder="أي بيان أو مرجع إضافي..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            إلغاء
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
            size="lg"
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-6"
            rightIcon={<Check className="w-5 h-5" />}
          >
            تأكيد الدفع وطباعة الفاتورة
          </Button>
        </div>
      </form>
    </Modal>
  );
};
