import { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Layers, Plus, Trash2, Check, Edit } from 'lucide-react';
import { toast } from 'sonner';

export function ExpenseCategoryModal({ isOpen, onClose, categories, onCreate, onUpdate, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('اسم التصنيف مطلوب'); return; }
    try {
      setIsSubmitting(true);
      if (editingId) { await onUpdate(editingId, { name: name.trim(), description: description.trim() || undefined }); toast.success('تم التحديث'); }
      else { await onCreate({ name: name.trim(), description: description.trim() || undefined }); toast.success('تمت الإضافة'); }
      setEditingId(null); setName(''); setDescription('');
    } catch (err) { toast.error(err?.response?.data?.message || 'فشلت العملية'); }
    finally { setIsSubmitting(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="إدارة تصنيفات المصروفات" subtitle="أبواب الصرف" maxWidth="md">
      <div className="space-y-4">
        <form onSubmit={handleSubmit} className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1"><Layers className="w-3.5 h-3.5 text-brand-400" /><span>{editingId ? 'تعديل التصنيف' : 'إضافة تصنيف جديد'}</span></span>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setName(''); setDescription(''); }} className="text-[11px] text-slate-400 hover:text-slate-200">إلغاء</button>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input placeholder="اسم التصنيف" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="وصف (اختياري)" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex justify-end"><Button type="submit" size="sm" isLoading={isSubmitting} rightIcon={editingId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}>{editingId ? 'حفظ' : 'إضافة'}</Button></div>
        </form>
        <div className="space-y-1.5 max-h-56 overflow-y-auto">
          {categories.length === 0 ? <p className="text-xs text-slate-500 text-center py-4">لا توجد تصنيفات</p> : categories.map((cat) => (
            <div key={cat.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div><span className="text-xs font-bold text-slate-200 block">{cat.name}</span>{cat.description && <span className="text-[10px] text-slate-500">{cat.description}</span>}</div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => { setEditingId(cat.id); setName(cat.name); setDescription(cat.description || ''); }} className="text-slate-400 hover:text-slate-200 p-1"><Edit className="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="sm" onClick={async () => { if (window.confirm(`حذف "${cat.name}"؟`)) { await onDelete(cat.id); toast.success('تم الحذف'); } }} className="text-slate-500 hover:text-rose-400 p-1"><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-3 border-t border-slate-800"><Button variant="outline" onClick={onClose}>إغلاق</Button></div>
      </div>
    </Modal>
  );
}
