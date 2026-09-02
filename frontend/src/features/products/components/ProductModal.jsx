import { useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Calculator, Check } from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(2, 'اسم المنتج يجب أن يتكون من حرفين على الأقل'),
  category_id: z.string().optional().default(''),
  unit: z.string().min(1, 'وحدة القياس مطلوبة'),
  cost_price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: 'سعر التكلفة يجب أن يكون رقماً صحيحاً أو عشرياً موجباً',
  }),
  selling_price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: 'سعر البيع يجب أن يكون رقماً موجباً',
  }),
  stock_quantity: z.string().optional().default('0.000'),
  min_stock_alert: z.string().optional().default('5'),
  description: z.string().optional().default(''),
  is_active: z.boolean().default(true),
}).refine((data) => Number(data.selling_price) >= Number(data.cost_price), {
  message: 'سعر البيع يجب أن يكون مساوياً أو أكبر من سعر التكلفة',
  path: ['selling_price'],
});

export function ProductModal({
  isOpen,
  onClose,
  onSave,
  product,
  categories,
  isLoading = false,
}) {
  const isEditing = !!product;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      category_id: '',
      unit: 'حبة',
      cost_price: '0.00',
      selling_price: '0.00',
      stock_quantity: '0.000',
      min_stock_alert: '5',
      description: '',
      is_active: true,
    },
  });

  const watchedCost = useWatch({ control, name: 'cost_price' });
  const watchedSell = useWatch({ control, name: 'selling_price' });
  const costPrice = Number(watchedCost || 0);
  const sellingPrice = Number(watchedSell || 0);
  const profitMargin = useMemo(() => sellingPrice - costPrice, [sellingPrice, costPrice]);
  const profitPercent = useMemo(() => costPrice > 0 ? ((profitMargin / costPrice) * 100).toFixed(1) : '0', [profitMargin, costPrice]);

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        category_id: product.category_id ? String(product.category_id) : '',
        unit: product.unit || 'حبة',
        cost_price: product.cost_price,
        selling_price: product.selling_price,
        stock_quantity: product.stock_quantity,
        min_stock_alert: product.min_stock_alert,
        description: product.description || '',
        is_active: product.is_active,
      });
    } else {
      reset({
        name: '',
        category_id: categories[0]?.id ? String(categories[0].id) : '',
        unit: 'حبة',
        cost_price: '0.00',
        selling_price: '0.00',
        stock_quantity: '0.000',
        min_stock_alert: '5',
        description: '',
        is_active: true,
      });
    }
  }, [product, isOpen, reset, categories]);

  const onSubmit = async (data) => {
    await onSave({
      name: data.name,
      category_id: data.category_id ? Number(data.category_id) : undefined,
      unit: data.unit,
      cost_price: data.cost_price,
      selling_price: data.selling_price,
      stock_quantity: data.stock_quantity || '0.000',
      min_stock_alert: data.min_stock_alert || '5',
      description: data.description || undefined,
      is_active: data.is_active ?? true,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}
      subtitle={isEditing ? `الصنف: ${product.name}` : 'أدخل مواصفات المنتج والأسعار والمخزون'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Row 1: Name */}
        <Input
          label="اسم المنتج *"
          placeholder="مثال: مسحوق غسيل 3 كغ"
          error={errors.name?.message}
          {...register('name')}
        />

        {/* Row 2: Category & Unit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="التصنيف"
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            placeholderOption="اختر التصنيف..."
            error={errors.category_id?.message}
            {...register('category_id')}
          />

          <Input
            label="وحدة القياس *"
            placeholder="حبة، لتر، كغ، كرتونة..."
            error={errors.unit?.message}
            {...register('unit')}
          />
        </div>

        {/* Row 3: Prices & Profit Margin Indicator */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-300 font-semibold border-b border-slate-800 pb-2">
            <span className="flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-brand-400" />
              <span>الأسعار وهامش الربح</span>
            </span>
            <span
              className={
                profitMargin >= 0
                  ? 'text-emerald-400 font-bold'
                  : 'text-rose-400 font-bold'
              }
            >
              الربح التقديري: {profitMargin.toFixed(2)} ₪ ({profitPercent}%)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              type="number"
              step="0.01"
              label="سعر التكلفة (شراء) *"
              error={errors.cost_price?.message}
              {...register('cost_price')}
            />

            <Input
              type="number"
              step="0.01"
              label="سعر البيع *"
              error={errors.selling_price?.message}
              {...register('selling_price')}
            />
          </div>
        </div>

        {/* Row 4: Stock & Min Stock Alert */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {!isEditing ? (
            <Input
              type="number"
              step="0.001"
              label="الرصيد الافتتاحي (الكمية الحالية)"
              helperText="سيتم إنشاء حركة مخزون افتتاحية تلقائياً"
              error={errors.stock_quantity?.message}
              {...register('stock_quantity')}
            />
          ) : (
            <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 text-xs text-slate-400">
              <span className="block font-semibold text-slate-300 mb-1">الرصيد الحالي بالمستودع</span>
              <p className="text-lg font-bold text-slate-100 font-mono">
                {product.stock_quantity} {product.unit || 'حبة'}
              </p>
              <span className="text-[10px] text-brand-400">لتعديل الرصيد استخدم نافذة (تسوية المخزون)</span>
            </div>
          )}

          <Input
            type="number"
            step="1"
            label="حد التنبيه الأدنى"
            helperText="تنبيه عندما ينخفض المخزون عن هذا الحد"
            error={errors.min_stock_alert?.message}
            {...register('min_stock_alert')}
          />
        </div>

        {/* Row 5: Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">ملاحظات / وصف الصنف</label>
          <textarea
            rows={2}
            className="w-full bg-slate-900/90 text-slate-100 border border-slate-700/80 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
            placeholder="مواصفات إضافية، بلد المنشأ، أو ملاحظات..."
            {...register('description')}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            إلغاء
          </Button>
          <Button type="submit" isLoading={isLoading} rightIcon={<Check className="w-4 h-4" />}>
            {isEditing ? 'حفظ التعديلات' : 'إضافة المنتج'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
