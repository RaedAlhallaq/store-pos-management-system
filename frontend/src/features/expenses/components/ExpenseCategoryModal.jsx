import { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Layers, Plus, Trash2, Check, Edit, Receipt, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function ExpenseCategoryModal({ isOpen, onClose, categories, onCreate, onUpdate, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('اسم التصنيف مطلوب'); return; }
    // Check for duplicate name
    const duplicate = categories.find(
      (c) => c.name.trim() === name.trim() && c.id !== editingId,
    );
    if (duplicate) { toast.error('يوجد تصنيف بنفس الاسم مسبقاً'); return; }
    try {
      setIsSubmitting(true);
      if (editingId) {
        await onUpdate(editingId, { name: name.trim(), description: description.trim() || undefined });
        toast.success('تم تحديث التصنيف');
      } else {
        await onCreate({ name: name.trim(), description: description.trim() || undefined });
        toast.success('تمت إضافة التصنيف');
      }
      setEditingId(null);
      setName('');
      setDescription('');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'فشلت العملية');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async (id) => {
    try {
      await onDelete(id);
      toast.success('تم حذف التصنيف');
      setDeletingId(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'تعذر حذف التصنيف');
      setDeletingId(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="إدارة تصنيفات المصروفات" subtitle="أبواب الصرف" maxWidth="md">
      <div className="space-y-4">
        <form onSubmit={handleSubmit} className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-brand-400" />
              <span>{editingId ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}</span>
            </span>
            {editingId && (
              <button
                type="button"
                onClick={() => { setEditingId(null); setName(''); setDescription(''); }}
                className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
              >
                إلغاء التعديل
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input placeholder="اسم التصنيف" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="وصف (اختياري)" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" size="sm" isLoading={isSubmitting} rightIcon={editingId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}>
              {editingId ? 'حفظ التعديلات' : 'إضافة التصنيف'}
            </Button>
          </div>
        </form>

        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {categories.length === 0 ? (
            <div className="py-8 text-center">
              <div className="p-3 rounded-2xl bg-slate-800/80 text-slate-400 mx-auto w-fit mb-3 ring-1 ring-slate-700">
                <Layers className="w-7 h-7" />
              </div>
              <p className="text-sm text-slate-300 font-semibold">لا توجد تصنيفات</p>
              <p className="text-xs text-slate-500 mt-1">أضف تصنيفاً جديداً لتنظيم المصروفات</p>
            </div>
          ) : (
            categories.map((cat) => (
              <div key={cat.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors">
                {deletingId === cat.id ? (
                  /* Inline delete confirmation */
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span className="text-xs text-slate-300 truncate">حذف "{cat.name}"؟</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => setDeletingId(null)} className="text-slate-400 hover:text-slate-200 text-xs px-2">
                        تراجع
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDeleteConfirm(cat.id)}
                        className="bg-rose-600 hover:bg-rose-700 text-white text-xs px-2"
                      >
                        حذف
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-200 block">{cat.name}</span>
                        {cat.expenses_count > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-500 font-mono bg-slate-800 px-1.5 py-0.5 rounded">
                            <Receipt className="w-2.5 h-2.5" />
                            {cat.expenses_count}
                          </span>
                        )}
                      </div>
                      {cat.description && <span className="text-[10px] text-slate-500 block mt-0.5">{cat.description}</span>}
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setEditingId(cat.id); setName(cat.name); setDescription(cat.description || ''); }}
                        className="text-slate-400 hover:text-slate-200 p-1"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingId(cat.id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <span className="text-[11px] text-slate-500">{categories.length} تصنيف</span>
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
        </div>
      </div>
    </Modal>
  );
}
