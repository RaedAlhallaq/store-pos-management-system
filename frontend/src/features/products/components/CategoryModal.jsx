import { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Plus, Trash2, Edit2, Layers, Check } from 'lucide-react';
import { toast } from 'sonner';

export function CategoryModal({ isOpen, onClose, categories, onCreate, onUpdate, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setName(cat.name);

    setDescription(cat.description || '');
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');

    setDescription('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('يرجى إدخال اسم التصنيف');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingId) {
        await onUpdate(editingId, { name, description: description || undefined });
        toast.success('تم تحديث التصنيف بنجاح');
      } else {
        await onCreate({ name, description: description || undefined });
        toast.success('تمت إضافة التصنيف بنجاح');
      }
      resetForm();
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذا التصنيف؟')) {
      try {
        await onDelete(id);
        toast.success('تم حذف التصنيف');
      } catch (error) {
        toast.error(error?.response?.data?.message || error?.message || 'لا يمكن حذف التصنيف');
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="إدارة تصنيفات المنتجات"
      subtitle="إضافة وتعديل التصنيفات وتصنيف السلع"
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Layers className="w-4 h-4 text-brand-400" />
            <span>{editingId ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}</span>
          </div>

          <Input
            label="اسم التصنيف *"
            placeholder="مثال: مشروبات وعصائر"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            {editingId && (
              <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                إلغاء
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              isLoading={isSubmitting}
              rightIcon={editingId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            >
              {editingId ? 'حفظ التعديل' : 'إضافة'}
            </Button>
          </div>
        </form>

        {/* Existing categories list */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          <h4 className="text-xs font-bold text-slate-400">التصنيفات الحالية ({categories.length})</h4>
          <div className="divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-950/40 overflow-hidden">
            {categories.map((cat) => (
              <div key={cat.id} className="p-3 flex items-center justify-between hover:bg-slate-850/60 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-100">{cat.name}</span>

                  </div>
                  <span className="text-[11px] text-slate-500">
                    {cat.products_count ?? 0} منتج مرتبط
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(cat)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-brand-400 hover:bg-slate-800 transition-colors"
                    title="تعديل"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
