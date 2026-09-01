import { useState, useCallback } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { ArrowDownCircle, ArrowUpCircle, Check } from 'lucide-react';
import { toast } from 'sonner';

export function StockAdjustmentModal({ isOpen, onClose, product, onAdjust }) {
  const [type, setType] = useState('adjustment');
  const [direction, setDirection] = useState('add');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setType('adjustment');
    setDirection('add');
    setAmount('');
    setNotes('');
  }, []);

  if (!product) return null;

  const currentStock = Number(product.stock_quantity || 0);
  const qtyNumber = Number(amount || 0);
  const signedQty = direction === 'add' ? qtyNumber : -qtyNumber;
  const newStock = currentStock + signedQty;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || qtyNumber <= 0) {
      toast.error('يرجى إدخال كمية صحيحة أكبر من الصفر');
      return;
    }

    if (newStock < 0) {
      toast.error('الكمية المخصومة تتجاوز الرصيد المتوفر في المخزون');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAdjust(product.id, {
        type: direction === 'subtract' && type === 'adjustment' ? 'adjustment' : type,
        quantity: signedQty,
        notes: notes || undefined,
      });
      toast.success('تمت تسوية رصيد المخزون بنجاح');
      resetForm();
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || 'فشلت عملية التسوية');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="تسوية رصيد المخزون"
      subtitle={`الصنف: ${product.name}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current status card */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 block font-semibold">الرصيد الحالي</span>
            <span className="text-base font-bold text-slate-100 font-mono">
              {product.stock_quantity} {product.unit?.short_name || 'حبة'}
            </span>
          </div>
          <div className="text-left">
            <span className="text-[10px] text-slate-500 block font-semibold">الرصيد المتوقع بعد التسوية</span>
            <span
              className={`text-base font-bold font-mono ${
                newStock < 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {newStock.toFixed(3)} {product.unit?.short_name || 'حبة'}
            </span>
          </div>
        </div>

        {/* Direction toggle */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setDirection('add')}
            className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold border transition-all ${
              direction === 'add'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>إضافة إلى المخزون (+)</span>
          </button>

          <button
            type="button"
            onClick={() => setDirection('subtract')}
            className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold border transition-all ${
              direction === 'subtract'
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>خصم من المخزون (-)</span>
          </button>
        </div>

        {/* Movement Type Reason */}
        <Select
          label="سبب الحركة / نوع التسوية *"
          value={type}
          onChange={(e) => setType(e.target.value)}
          options={
            direction === 'add'
              ? [
                  { value: 'adjustment', label: 'تسوية جردية (فائض أو تصحيح جرد)' },
                  { value: 'initial', label: 'إضافة رصيد افتتاحي إضافي' },
                  { value: 'purchase_return', label: 'مرتجع مشتريات للمستودع' },
                ]
              : [
                  { value: 'damage', label: 'بضاعة تالفة أو منتهية الصلاحية (Damaged)' },
                  { value: 'adjustment', label: 'تسوية جردية (عجز أو تصحيح جرد)' },
                  { value: 'sale_return', label: 'مرتجع مبيعات خارجي' },
                ]
          }
        />

        {/* Quantity */}
        <Input
          type="number"
          step={product.unit?.allow_decimal ? '0.001' : '1'}
          min="0.001"
          label="الكمية المطلوبة *"
          placeholder="أدخل الكمية..."
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        {/* Notes */}
        <Input
          label="بيان / ملاحظات التسوية"
          placeholder="مثال: تلف أثناء النقل، أو جرد نهاية الشهر"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            rightIcon={<Check className="w-4 h-4" />}
          >
            تأكيد التسوية
          </Button>
        </div>
      </form>
    </Modal>
  );
}
