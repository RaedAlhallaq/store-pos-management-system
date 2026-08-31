import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Layers, Plus, Trash2, Check, Edit } from 'lucide-react';
import type { ExpenseCategory } from '../types/expenseTypes';
import { toast } from 'sonner';

interface ExpenseCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ExpenseCategory[];
  onCreate: (data: { name: string; description?: string }) => Promise<void>;
  onUpdate: (id: number, data: { name: string; description?: string }) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export const ExpenseCategoryModal: React.FC<ExpenseCategoryModalProps> = ({
  isOpen,
  onClose,
  categories,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStartEdit = (cat: ExpenseCategory) => {
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setDescription('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('اسم تصنيف المصروفات مطلوب');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingId) {
        await onUpdate(editingId, { name: name.trim(), description: description.trim() || undefined });
        toast.success('تم تحديث تصنيف المصروفات');
      } else {
        await onCreate({ name: name.trim(), description: description.trim() || undefined });
        toast.success('تمت إضافة تصنيف المصروفات');
      }
      handleCancelEdit();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'فشلت العملية');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="إدارة تصنيفات المصروفات"
      subtitle="تحديد أبواب الصرف (إيجارات، كهرباء، رواتب، ضيافة، إلخ)"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Add/Edit Form */}
        <form
          onSubmit={handleSubmit}
          className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-brand-400" />
              <span>{editingId ? 'تعديل تصنيف مصروف' : 'إضافة تصنيف مصروف جديد'}</span>
            </span>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-[11px] text-slate-400 hover:text-slate-200"
              >
                إلغاء التعديل
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              placeholder="اسم التصنيف (مثال: صيانة)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Input
              placeholder="وصف مختصر (اختياري)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              isLoading={isSubmitting}
              rightIcon={editingId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            >
              {editingId ? 'حفظ التعديل' : 'إضافة التصنيف'}
            </Button>
          </div>
        </form>

        {/* Existing Categories List */}
        <div className="space-y-1.5 max-h-56 overflow-y-auto">
          {categories.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">لا توجد تصنيفات مصروفات مسجلة</p>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.id}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between hover:border-slate-700"
              >
                <div>
                  <span className="text-xs font-bold text-slate-200 block">{cat.name}</span>
                  {cat.description && (
                    <span className="text-[10px] text-slate-500">{cat.description}</span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStartEdit(cat)}
                    className="text-slate-400 hover:text-slate-200 p-1"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      if (window.confirm(`هل أنت متأكد من حذف تصنيف: "${cat.name}"؟`)) {
                        await onDelete(cat.id);
                        toast.success('تم حذف التصنيف');
                      }
                    }}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-800">
          <Button variant="outline" onClick={onClose}>
            إغلاق
          </Button>
        </div>
      </div>
    </Modal>
  );
};
