import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Printer, QrCode, Store } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { settingsApi } from '../../settings/api/settingsApi';

export function ReceiptModal({ isOpen, onClose, sale, onNewSale }) {
  const printAreaRef = useRef(null);
  const [settings, setSettings] = useState({ store_name: 'الأصيل للمنظفات', receipt_footer: 'شكراً لزيارتكم محل الأصيل للمنظفات!' });

  useEffect(() => {
    if (isOpen) {
      settingsApi.getSettings().then((s) => {
        setSettings({
          store_name: s.store_name || 'الأصيل للمنظفات',
          receipt_footer: s.receipt_footer || 'شكراً لزيارتكم محل الأصيل للمنظفات!',
        });
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!sale) return null;

  // Calculate change for cash payments
  const paidAmount = Number(sale.paid_amount || 0);
  const grandTotal = Number(sale.grand_total || 0);
  const dueAmount = Number(sale.due_amount || 0);
  const change = sale.payment_method === 'cash' && paidAmount > grandTotal ? paidAmount - grandTotal : 0;

  // Build payment method display
  const paymentMethods = sale.payments || [];
  const hasMultiplePayments = paymentMethods.length > 1;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="فاتورة مبيعات" subtitle={`رقم الفاتورة: ${sale.invoice_number}`} maxWidth="md">
      <div className="space-y-4">
        <div ref={printAreaRef} className="bg-white text-slate-900 p-6 rounded-2xl shadow-inner font-mono text-xs space-y-4 select-text border border-slate-200" dir="rtl">
          {/* Header */}
          <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
            <div className="flex items-center justify-center gap-1.5 text-slate-800 font-bold text-sm">
              <Store className="w-4 h-4 text-slate-700" />
              <span>{settings.store_name}</span>
            </div>
            <p className="text-[11px] text-slate-600">فاتورة مبيعات</p>
          </div>

          {/* Invoice info */}
          <div className="grid grid-cols-2 gap-2 text-[11px] border-b border-dashed border-slate-300 pb-2">
            <div>
              <span className="text-slate-500 block">رقم الفاتورة:</span>
              <span className="font-bold text-slate-900">{sale.invoice_number}</span>
            </div>
            <div className="text-left">
              <span className="text-slate-500 block">التاريخ والوقت:</span>
              <span className="font-bold text-slate-900">{sale.created_at ? new Date(sale.created_at).toLocaleString('ar-SA') : ''}</span>
            </div>
            <div>
              <span className="text-slate-500 block">الكاشير:</span>
              <span className="font-bold text-slate-800">{sale.cashier_name || 'الكاشير'}</span>
            </div>
            <div className="text-left">
              <span className="text-slate-500 block">العميل:</span>
              <span className="font-bold text-slate-800">{sale.customer?.name || 'زبون نقدي'}</span>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-1 border-b border-dashed border-slate-300 pb-3">
            <div className="flex justify-between font-bold text-slate-700 text-[11px] pb-1 border-b border-slate-200">
              <span>الصنف</span>
              <span className="text-center w-12">الكمية</span>
              <span className="text-left w-16">المجموع</span>
            </div>
            {sale.items?.map((item, index) => (
              <div key={item.id || index} className="flex justify-between items-center text-[11px] py-0.5">
                <div className="truncate max-w-[150px]">
                  <span className="font-semibold text-slate-900 block truncate">{item.product_name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{Number(item.unit_price).toFixed(2)} ₪</span>
                </div>
                <span className="text-center w-12 font-bold">{item.quantity}</span>
                <span className="text-left w-16 font-bold">{Number(item.subtotal).toFixed(2)} ₪</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="space-y-1.5 text-[11px] border-b border-dashed border-slate-300 pb-3">
            <div className="flex justify-between text-slate-600">
              <span>المجموع:</span>
              <span className="font-bold">{Number(sale.subtotal).toFixed(2)} ₪</span>
            </div>
            {Number(sale.discount_amount) > 0 && (
              <div className="flex justify-between text-rose-600 font-bold">
                <span>إجمالي الخصم:</span>
                <span>-{Number(sale.discount_amount).toFixed(2)} ₪</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
              <span>الإجمالي النهائي:</span>
              <span className="text-base">{grandTotal.toFixed(2)} ₪</span>
            </div>
          </div>

          {/* Payment details */}
          <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2">
            <div className="flex justify-between text-slate-700">
              <span>المدفوع:</span>
              <span className="font-bold">{paidAmount.toFixed(2)} ₪</span>
            </div>
            {change > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>الباقي للعميل:</span>
                <span>{change.toFixed(2)} ₪</span>
              </div>
            )}
            {dueAmount > 0 && (
              <div className="flex justify-between text-amber-700 font-bold">
                <span>المتبقي (آجل):</span>
                <span>{dueAmount.toFixed(2)} ₪</span>
              </div>
            )}
            {/* Payment method display */}
            {hasMultiplePayments ? (
              <div className="space-y-0.5">
                <div className="flex justify-between text-slate-500 text-[10px]">
                  <span>طرق الدفع:</span>
                </div>
                {paymentMethods.map((p, i) => (
                  <div key={i} className="flex justify-between text-slate-700 text-[10px]">
                    <span>{p.payment_method === 'cash' ? 'نقداً' : p.payment_method === 'card' ? 'بطاقة' : 'آجل'}</span>
                    <span className="font-bold">{Number(p.amount).toFixed(2)} ₪</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex justify-between text-slate-500 text-[10px]">
                <span>طريقة الدفع:</span>
                <span className="font-bold">
                  {sale.payment_method === 'cash' ? 'نقداً' : sale.payment_method === 'card' ? 'بطاقة / شبكة' : sale.payment_method === 'credit' ? 'آجل على الحساب' : 'دفع متعدد'}
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col items-center justify-center pt-2 text-center space-y-1">
            <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl">
              <QrCode className="w-14 h-14 text-slate-800" />
            </div>
            <p className="text-[10px] text-slate-500">{settings.receipt_footer}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
          <div className="flex items-center gap-2">
            <Button onClick={() => window.print()} variant="outline" rightIcon={<Printer className="w-4 h-4 text-brand-400" />}>
              طباعة الفاتورة
            </Button>
            {onNewSale && (
              <Button onClick={() => { onClose(); onNewSale(); }} className="bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold" rightIcon={<CheckCircle2 className="w-4 h-4" />}>
                فاتورة جديدة
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
