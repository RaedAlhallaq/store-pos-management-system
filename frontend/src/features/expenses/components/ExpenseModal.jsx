import { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Check, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

export function ExpenseModal({ isOpen, onClose, categories, onSave, isLoading = false, editingExpense = null }) {
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingExpense) {
      setCategoryId(String(editingExpense.expense_category_id || ''));
      setDescription(editingExpense.description || '');
      setAmount(String(Number(editingExpense.amount) || ''));
      setPaymentMethod(editingExpense.payment_method || 'cash');
      setExpenseDate(editingExpense.expense_date || new Date().toISOString().split('T')[0]);
      setReferenceNumber(editingExpense.reference_number || '');
      setNotes(editingExpense.notes || '');
    } else {
      setCategoryId(categories[0]?.id ? String(categories[0].id) : '');
      setDescription('');
      setAmount('');
      setPaymentMethod('cash');
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setReferenceNumber('');
      setNotes('');
    }
  }, [editingExpense, categories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryId) { toast.error('يرجى اختيار تصنيف المصروف'); return; }
    if (!description.trim()) { toast.error('يرجى إدخال البيان'); return; }
    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) { toast.error('يرجى إدخال مبلغ صحيح أكبر من الصفر'); return; }
    await onSave({
      expense_category_id: Number(categoryId),
      description: description.trim(),
      amount: amountNum,
      payment_method: paymentMethod,
      expense_date: expenseDate,
      reference_number: referenceNumber.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  const isEdit = !!editingExpense;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'تعديل المصروف' : 'تسجيل مصروف تشغيلي جديد'} subtitle={isEdit ? 'تحديث بيانات المصروف المسجل' : 'إثبات المصروف وخصمه من الصندوق'} maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="تصنيف المصروف *"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            placeholderOption="اختر التصنيف..."
          />
          <Input type="number" step="0.5" label="المبلغ (₪) *" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
        </div>
        <Input label="البيان / الوصف *" placeholder="مثال: فاتورة كهرباء" value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="طريقة الصرف *"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            options={[
              { value: 'cash', label: 'نقداً' },
              { value: 'bank_transfer', label: 'حوالة بنكية' },
              { value: 'card', label: 'بطاقة' },
            ]}
          />
          <Input type="date" label="التاريخ" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
        </div>
        <Input label="رقم الإيصال (اختياري)" placeholder="REC-992211" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} />
        <Input label="ملاحظات (اختياري)" value={notes} onChange={(e) => setNotes(e.target.value)} />

        {/* Edit mode info */}
        {isEdit && (
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" />رقم السند</span>
            <span className="font-mono text-sm font-bold text-slate-300">{editingExpense.expense_number}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>إلغاء</Button>
          <Button type="submit" isLoading={isLoading} rightIcon={<Check className="w-4 h-4" />}>
            {isEdit ? 'حفظ التعديلات' : 'تسجيل المصروف'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
