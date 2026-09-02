import { Modal } from '../../../components/ui/Modal';
import { Badge } from '../../../components/ui/Badge';
import { fmtMoney } from '../../../lib/utils';
import { Truck, Calendar, FileText, Receipt } from 'lucide-react';

const PAYMENT_METHODS = {
  cash: 'نقداً',
  bank_transfer: 'حوالة بنكية',
  credit: 'آجل (ذمة مورد)',
  card: 'بطاقة مدى',
};

export function PurchaseDetailsModal({ isOpen, onClose, purchase }) {
  if (!purchase) return null;

  const items = purchase.items || [];
  const payments = purchase.payments || [];
  const isVoid = purchase.purchase_status === 'void';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="تفاصيل فاتورة الشراء"
      subtitle={`رقم الفاتورة: ${purchase.invoice_number || purchase.id}`}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Header info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1">
              <Truck className="w-3 h-3" />
              <span>المورد</span>
            </div>
            <p className="text-sm font-bold text-slate-100">{purchase.supplier_name || purchase.supplier?.name || 'مورد عام'}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1">
              <Calendar className="w-3 h-3" />
              <span>التاريخ</span>
            </div>
            <p className="text-sm font-bold text-slate-100 font-mono">
              {purchase.created_at ? new Date(purchase.created_at).toLocaleDateString('ar-SA') : '—'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1">
              <FileText className="w-3 h-3" />
              <span>رقم فاتورة المورد</span>
            </div>
            <p className="text-sm font-bold text-slate-100">{purchase.supplier_invoice_number || '—'}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1">
              <Receipt className="w-3 h-3" />
              <span>حالة الفاتورة</span>
            </div>
            {isVoid ? (
              <Badge variant="danger" size="sm">ملغاة</Badge>
            ) : purchase.payment_status === 'paid' ? (
              <Badge variant="success" size="sm">مسددة بالكامل</Badge>
            ) : purchase.payment_status === 'partial' ? (
              <Badge variant="warning" size="sm">مسددة جزئياً</Badge>
            ) : (
              <Badge variant="danger" size="sm">آجلة</Badge>
            )}
          </div>
        </div>

        {/* Items table */}
        <div className="rounded-2xl border border-slate-800 overflow-hidden">
          <div className="bg-slate-950/80 px-4 py-2.5 border-b border-slate-800">
            <h4 className="text-xs font-bold text-slate-300">الأصناف الموردة ({items.length})</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-2.5 px-4">#</th>
                  <th className="py-2.5 px-4">المنتج</th>
                  <th className="py-2.5 px-4 text-center">الكمية</th>
                  <th className="py-2.5 px-4">سعر الوحدة</th>
                  <th className="py-2.5 px-4">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {items.map((item, index) => (
                  <tr key={item.product_id || index} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-4 text-slate-500 font-mono">{index + 1}</td>
                    <td className="py-2.5 px-4">
                      <span className="font-bold text-slate-100">{item.product_name}</span>
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono text-slate-200">{item.quantity}</td>
                    <td className="py-2.5 px-4 font-mono text-emerald-400">{fmtMoney(item.unit_cost)}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-100">{fmtMoney(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>المجموع الفرعي</span>
            <span className="font-mono">{fmtMoney(purchase.subtotal)}</span>
          </div>
          {Number(purchase.discount_amount) > 0 && (
            <div className="flex justify-between text-xs text-rose-400">
              <span>الخصم</span>
              <span className="font-mono">-{fmtMoney(purchase.discount_amount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold text-slate-100 pt-2 border-t border-slate-800">
            <span>الإجمالي</span>
            <span className="font-mono">{fmtMoney(purchase.grand_total)}</span>
          </div>
          <div className="flex justify-between text-xs text-emerald-400">
            <span>المدفوع</span>
            <span className="font-mono">{fmtMoney(purchase.paid_amount)}</span>
          </div>
          {Number(purchase.due_amount) > 0 && (
            <div className="flex justify-between text-xs text-amber-400 font-bold">
              <span>المتبقي (آجل)</span>
              <span className="font-mono">{fmtMoney(purchase.due_amount)}</span>
            </div>
          )}
        </div>

        {/* Payments */}
        {payments.length > 0 && (
          <div className="rounded-2xl border border-slate-800 overflow-hidden">
            <div className="bg-slate-950/80 px-4 py-2.5 border-b border-slate-800">
              <h4 className="text-xs font-bold text-slate-300">سجل المدفوعات ({payments.length})</h4>
            </div>
            <div className="divide-y divide-slate-800/60">
              {payments.map((payment, index) => (
                <div key={index} className="px-4 py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Badge variant="info" size="sm">{PAYMENT_METHODS[payment.payment_method] || payment.payment_method}</Badge>
                    {payment.reference_number && (
                      <span className="text-slate-500">مرجع: {payment.reference_number}</span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-emerald-400">{fmtMoney(payment.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {purchase.notes && (
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[10px] text-slate-500 block mb-1">ملاحظات</span>
            <p className="text-xs text-slate-300">{purchase.notes}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
