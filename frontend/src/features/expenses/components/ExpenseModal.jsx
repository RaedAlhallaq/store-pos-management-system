import { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Check } from 'lucide-react';
import { toast } from 'sonner';

export function ExpenseModal({ isOpen, onClose, categories, onSave, isLoading = false }) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ? String(categories[0].id) : '');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryId) { toast.error('يرجى اختيار تصنيف المصروف'); return; }
    if (!description.trim()) { toast.error('يرجى إدخال البيان'); return; }
    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) { toast.error('يرجى إدخال مبلغ صحيح'); return; }
    await onSave({ expense_category_id: Number(categoryId), description: description.trim(), amount: amountNum, payment_method: paymentMethod, expense_date: expenseDate, reference_number: referenceNumber.trim() || undefined, notes: notes.trim() || undefined });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="تسجيل مصروف تشغيلي جديد" subtitle="إثبات المصروف وخصمه من الصندوق" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select label="تصنيف المصروف *" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} options={categories.map((c) => ({ value: c.id, label: c.name }))} placeholderOption="اختر التصنيف..." />
          <Input type="number" step="0.5" label="المبلغ (₪) *" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
        </div>
        <Input label="البيان / الوصف *" placeholder="مثال: فاتورة كهرباء" value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select label="طريقة الصرف *" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} options={[{ value: 'cash', label: 'نقداً' }, { value: 'bank_transfer', label: 'حوالة بنكية' }, { value: 'card', label: 'بطاقة' }]} />
          <Input type="date" label="التاريخ" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
        </div>
        <Input label="رقم الإيصال (اختياري)" placeholder="REC-992211" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} />
        <Input label="ملاحظات (اختياري)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>إلغاء</Button>
          <Button type="submit" isLoading={isLoading} rightIcon={<Check className="w-4 h-4" />}>تسجيل المصروف</Button>
        </div>
      </form>
    </Modal>
  );
}
