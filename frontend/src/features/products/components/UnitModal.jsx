import { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Plus, Trash2, Edit2, Scale, Check } from 'lucide-react';
import { toast } from 'sonner';

export function UnitModal({ isOpen, onClose, units, onCreate, onUpdate, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [allowDecimal, setAllowDecimal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startEdit = (unit) => {
    setEditingId(unit.id);
    setName(unit.name);
    setShortName(unit.short_name);
    setAllowDecimal(unit.allow_decimal);
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setShortName('');
    setAllowDecimal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !shortName.trim()) {
      toast.error('يرجى إدخال اسم الوحدة والرمز المختصر');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingId) {
        await onUpdate(editingId, { name, short_name: shortName, allow_decimal: allowDecimal });
        toast.success('تم تحديث وحدة القياس');
      } else {
        await onCreate({ name, short_name: shortName, allow_decimal: allowDecimal });
        toast.success('تمت إضافة وحدة القياس');
      }
      resetForm();
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف وحدة القياس هذه؟')) {
      try {
        await onDelete(id);
        toast.success('تم حذف الوحدة');
      } catch (error) {
        toast.error(error?.response?.data?.message || error?.message || 'لا يمكن حذف الوحدة');
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="إدارة وحدات القياس"
      subtitle="تعريف وحدات البيع والشراء (حبة، كرتون، كغ، لتر)"
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Scale className="w-4 h-4 text-brand-400" />
            <span>{editingId ? 'تعديل وحدة القياس' : 'إضافة وحدة قياس جديدة'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="اسم الوحدة الكامل *"
              placeholder="مثال: كيلوجرام"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="الرمز المختصر *"
              placeholder="مثال: كغ"
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="allowDecimal"
              checked={allowDecimal}
              onChange={(e) => setAllowDecimal(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-brand-500 focus:ring-brand-500"
            />
            <label htmlFor="allowDecimal" className="text-xs text-slate-300 select-none">
              السماح بالكسور العشرية (مثل 1.5 كغ أو 0.250 كغ)
            </label>
          </div>

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

        {/* Existing units list */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          <h4 className="text-xs font-bold text-slate-400">الوحدات المسجلة ({units.length})</h4>
          <div className="divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-950/40 overflow-hidden">
            {units.map((unit) => (
              <div key={unit.id} className="p-3 flex items-center justify-between hover:bg-slate-850/60 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-100">{unit.name}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-brand-300 font-bold border border-slate-700">
                      {unit.short_name}
                    </span>
                    {unit.allow_decimal && (
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        يقبل كسور
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(unit)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-brand-400 hover:bg-slate-800 transition-colors"
                    title="تعديل"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(unit.id)}
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
