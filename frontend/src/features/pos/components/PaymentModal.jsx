import { useEffect, useState } from 'react';
import { AlertCircle, Banknote, Check, Coins, CreditCard, Split, UserCheck, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Select } from '../../../components/ui/Select';

export function PaymentModal({ isOpen, onClose, grandTotal, customer, customers, onSelectCustomer, onConfirmCheckout, isLoading = false }) {
  const [method, setMethod] = useState('cash');
  const [cashTendered, setCashTendered] = useState('');
  const [cardAmount, setCardAmount] = useState('');
  const [cardRefNumber, setCardRefNumber] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMethod('cash');
      setCashTendered(grandTotal.toFixed(2));
      setCardAmount('');
      setCardRefNumber('');
      setNotes('');
    }
  }, [isOpen, grandTotal]);

  const change = Math.max(0, Number(cashTendered || 0) - grandTotal);

  const submit = async (event) => {
    event.preventDefault();
    if (method === 'credit' && !customer) {
      toast.error('يرجى تحديد عميل مسجل لإتمام عملية البيع الآجل.');
      return;
    }
    const payments = [];
    if (method === 'cash') {
      payments.push({ payment_method: 'cash', amount: grandTotal });
    } else if (method === 'card') {
      payments.push({ payment_method: 'card', amount: grandTotal, reference_number: cardRefNumber || undefined });
    } else if (method === 'credit') {
      payments.push({ payment_method: 'credit', amount: grandTotal });
    } else {
      // Split payment
      const cash = Number(cashTendered || 0);
      const card = Number(cardAmount || 0);
      if (cash + card < grandTotal) {
        toast.error('مجموع الدفعات أقل من إجمالي الفاتورة المطلوب.');
        return;
      }
      if (cash > 0) payments.push({ payment_method: 'cash', amount: cash });
      if (card > 0) payments.push({ payment_method: 'card', amount: card, reference_number: cardRefNumber || undefined });
    }
    await onConfirmCheckout({ customer_id: customer?.id || null, payments, notes: notes || undefined });
  };

  const methods = [
    ['cash', Banknote, 'نقداً (Cash)', 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold ring-2 ring-emerald-500/20'],
    ['card', CreditCard, 'مدى / شبكة', 'bg-sky-500/20 border-sky-500/50 text-sky-300 font-bold ring-2 ring-sky-500/20'],
    ['credit', UserCheck, 'آجل / ذمة', 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold ring-2 ring-amber-500/20'],
    ['split', Split, 'دفع مجزأ', 'bg-purple-500/20 border-purple-500/50 text-purple-300 font-bold ring-2 ring-purple-500/20'],
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="سداد وإصدار الفاتورة" subtitle="اختر طريقة الدفع وحساب المبلغ المستلم" maxWidth="lg">
      <form onSubmit={submit} className="space-y-4">
        {/* Grand total + customer */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-semibold">إجمالي الفاتورة المطلوب</span>
              <span className="text-2xl font-black text-brand-400 font-mono">{grandTotal.toFixed(2)} <span className="text-xs text-slate-400">₪</span></span>
            </div>
            <div className="text-left">
              <span className="text-xs text-slate-400 block font-semibold">العميل المحدد</span>
              <span className="text-sm font-bold text-slate-200 block truncate max-w-[150px]">{customer ? customer.name : 'عميل نقدي عام'}</span>
            </div>
          </div>
          {/* Customer credit info */}
          {customer && (
            <div className="flex items-center gap-3 text-[11px] pt-2 border-t border-slate-800">
              <span className="flex items-center gap-1 text-slate-400">
                <Wallet className="w-3 h-3" />
                الرصيد: <span className={`font-mono font-bold ${Number(customer.current_balance) > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{Number(customer.current_balance).toFixed(2)} ₪</span>
              </span>
              {Number(customer.credit_limit) > 0 && (
                <span className="text-slate-500">
                  السقف: <span className="font-mono">{Number(customer.credit_limit).toFixed(2)} ₪</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Payment method selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {methods.map(([value, Icon, label, activeClass]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMethod(value)}
              className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${method === value ? activeClass : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>

        {/* Cash payment details */}
        {method === 'cash' && (
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-emerald-400" />
                <span>المبلغ المستلم من الزبون</span>
              </span>
            </div>
            <Input type="number" step="0.5" placeholder="0.00" value={cashTendered} onChange={(event) => setCashTendered(event.target.value)} className="text-lg font-mono font-bold" />
            {/* Prominent change display */}
            <div className={`p-3 rounded-xl flex items-center justify-between ${change > 0 ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-slate-800/50 border border-slate-800'}`}>
              <span className={`text-xs font-bold ${change > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>الباقي للعميل</span>
              <span className={`text-xl font-black font-mono ${change > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>{change.toFixed(2)} ₪</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button type="button" onClick={() => setCashTendered(String(grandTotal))} className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold transition-colors">
                المبلغ بالتمام ({grandTotal.toFixed(2)})
              </button>
              {[50, 100, 200, 500].map((amount) => (
                <button key={amount} type="button" onClick={() => setCashTendered(String(amount))} className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold transition-colors">
                  {amount} ₪
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Card payment details */}
        {method === 'card' && (
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-400">
              <CreditCard className="w-4 h-4" />
              <span>دفع عبر أجهزة الدفع الإلكتروني</span>
            </div>
            <Input label="رقم الإيصال / الرقم المرجعي للشبكة (اختياري)" placeholder="مثال: AUTH-987654" value={cardRefNumber} onChange={(event) => setCardRefNumber(event.target.value)} />
          </div>
        )}

        {/* Credit payment details */}
        {method === 'credit' && (
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
              <UserCheck className="w-4 h-4" />
              <span>تسجيل الفاتورة كدين على حساب العميل</span>
            </div>
            <Select
              label="اختر العميل *"
              value={customer?.id ? String(customer.id) : ''}
              onChange={(event) => onSelectCustomer(customers.find((item) => item.id === Number(event.target.value)) || null)}
              options={customers.map((item) => ({
                value: item.id,
                label: `${item.name} (الرصيد: ${Number(item.current_balance).toFixed(2)} ₪ — سقف: ${Number(item.credit_limit).toFixed(2)} ₪)`,
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

        {/* Split payment details */}
        {method === 'split' && (
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input type="number" step="0.5" label="المدفوع نقداً (Cash)" placeholder="0.00" value={cashTendered} onChange={(event) => {
                const cash = Number.parseFloat(event.target.value) || 0;
                setCashTendered(event.target.value);
                setCardAmount(Math.max(0, grandTotal - cash).toFixed(2));
              }} />
              <Input type="number" step="0.5" label="المدفوع عبر الشبكة (Card)" placeholder="0.00" value={cardAmount} onChange={(event) => setCardAmount(event.target.value)} />
            </div>
            {/* Split totals */}
            <div className="p-2 rounded-lg bg-slate-800/50 flex items-center justify-between text-xs">
              <span className="text-slate-400">المجموع المدفوع:</span>
              <span className={`font-mono font-bold ${Number(cashTendered || 0) + Number(cardAmount || 0) >= grandTotal ? 'text-emerald-400' : 'text-amber-400'}`}>
                {(Number(cashTendered || 0) + Number(cardAmount || 0)).toFixed(2)} ₪
              </span>
            </div>
            <Input label="الرقم المرجعي للشبكة (اختياري)" placeholder="مثال: REF-1234" value={cardRefNumber} onChange={(event) => setCardRefNumber(event.target.value)} />
          </div>
        )}

        <Input label="ملاحظات على الفاتورة (اختياري)" placeholder="أي بيان أو مرجع إضافي..." value={notes} onChange={(event) => setNotes(event.target.value)} />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>إلغاء</Button>
          <Button type="submit" isLoading={isLoading} size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-6" rightIcon={<Check className="w-5 h-5" />}>
            تأكيد الدفع وطباعة الفاتورة
          </Button>
        </div>
      </form>
    </Modal>
  );
}
