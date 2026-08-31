import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Check } from 'lucide-react';
import type { ExpenseCategory, CreateExpensePayload } from '../types/expenseTypes';
import { toast } from 'sonner';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ExpenseCategory[];
  onSave: (payload: CreateExpensePayload) => Promise<void>;
  isLoading?: boolean;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSave,
  isLoading = false,
}) => {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ? String(categories[0].id) : '');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer'>('cash');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      toast.error('يرجى اختيار تصنيف المصروف');
      return;
    }
    if (!description.trim()) {
      toast.error('يرجى إدخال بيان أو وصف المصروف');
      return;
    }
    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح للمصروف');
      return;
    }

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="تسجيل مصروف تشغيلي جديد"
      subtitle="إثبات المصروف وخصمه من الصندوق أو البنك"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="تصنيف المصروف *"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            placeholderOption="اختر التصنيف..."
          />

          <Input
            type="number"
            step="0.5"
            label="مبلغ المصروف (₪) *"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
          />
        </div>

        <Input
          label="بيان / وصف المصروف *"
          placeholder="مثال: فاتورة كهرباء الفرع لشهر أغسطس"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="طريقة الصرف *"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as any)}
            options={[
              { value: 'cash', label: 'نقداً من الصندوق (Cash Drawer)' },
              { value: 'bank_transfer', label: 'حوالة بنكية' },
              { value: 'card', label: 'بطاقة مدى / حساب بنكي' },
            ]}
          />

          <Input
            type="date"
            label="تاريخ الصرف"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
          />
        </div>

        <Input
          label="رقم الإيصال / الفاتورة الورقية (اختياري)"
          placeholder="مثال: REC-992211"
          value={referenceNumber}
          onChange={(e) => setReferenceNumber(e.target.value)}
        />

        <Input
          label="ملاحظات إضافية (اختياري)"
          placeholder="أي تفاصيل أخرى..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            إلغاء
          </Button>
          <Button type="submit" isLoading={isLoading} rightIcon={<Check className="w-4 h-4" />}>
            تسجيل المصروف
          </Button>
        </div>
      </form>
    </Modal>
  );
};
