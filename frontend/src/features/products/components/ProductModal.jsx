import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Sparkles, Barcode, Calculator, Check } from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(2, 'اسم المنتج يجب أن يتكون من حرفين على الأقل'),
  barcode: z.string().optional().default(''),
  sku: z.string().optional().default(''),
  category_id: z.string().optional().default(''),
  unit_id: z.string().optional().default(''),
  cost_price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: 'سعر التكلفة يجب أن يكون رقماً صحيحاً أو عشرياً موجباً',
  }),
  selling_price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: 'سعر البيع يجب أن يكون رقماً موجباً',
  }),
  tax_percent: z.string().optional().default('15.00'),
  stock_quantity: z.string().optional().default('0.000'),
  min_stock_alert: z.string().optional().default('5.000'),
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
  units,
  isLoading = false,
}) {
  const isEditing = !!product;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      barcode: '',
      sku: '',
      category_id: '',
      unit_id: '',
      cost_price: '0.00',
      selling_price: '0.00',
      tax_percent: '15.00',
      stock_quantity: '0.000',
      min_stock_alert: '5.000',
      description: '',
      is_active: true,
    },
  });

  const costPrice = Number(watch('cost_price') || 0);
  const sellingPrice = Number(watch('selling_price') || 0);
  const profitMargin = sellingPrice - costPrice;
  const profitPercent = costPrice > 0 ? ((profitMargin / costPrice) * 100).toFixed(1) : '0';

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        barcode: product.barcode || '',
        sku: product.sku || '',
        category_id: product.category_id ? String(product.category_id) : '',
        unit_id: product.unit_id ? String(product.unit_id) : '',
        cost_price: product.cost_price,
        selling_price: product.selling_price,
        tax_percent: product.tax_percent,
        stock_quantity: product.stock_quantity,
        min_stock_alert: product.min_stock_alert,
        description: product.description || '',
        is_active: product.is_active,
      });
    } else {
      reset({
        name: '',
        barcode: '',
        sku: '',
        category_id: categories[0]?.id ? String(categories[0].id) : '',
        unit_id: units[0]?.id ? String(units[0].id) : '',
        cost_price: '0.00',
        selling_price: '0.00',
        tax_percent: '15.00',
        stock_quantity: '0.000',
        min_stock_alert: '5.000',
        description: '',
        is_active: true,
      });
    }
  }, [product, isOpen, reset, categories, units]);

  const generateBarcode = () => {
    const randomSuffix = Math.floor(1000000000 + Math.random() * 9000000000);
    setValue('barcode', `628${randomSuffix}`, { shouldValidate: true });
  };

  const onSubmit = async (data) => {
    await onSave({
      name: data.name,
      barcode: data.barcode || undefined,
      sku: data.sku || undefined,
      category_id: data.category_id ? Number(data.category_id) : undefined,
      unit_id: data.unit_id ? Number(data.unit_id) : undefined,
      cost_price: data.cost_price,
      selling_price: data.selling_price,
      tax_percent: data.tax_percent || '0.00',
      stock_quantity: data.stock_quantity || '0.000',
      min_stock_alert: data.min_stock_alert || '5.000',
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
        {/* Row 1: Name & Barcode */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="اسم المنتج *"
            placeholder="مثال: أرز بسمتي 5 كغ"
            error={errors.name?.message}
            {...register('name')}
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <button
                type="button"
                onClick={generateBarcode}
                className="text-[11px] text-brand-400 hover:text-brand-300 flex items-center gap-1 font-semibold"
              >
                <Sparkles className="w-3 h-3" />
                <span>توليد باركود تلقائي</span>
              </button>
            </div>
            <Input
              placeholder="امسح أو أدخل الباركود"
              leftIcon={<Barcode className="w-4 h-4 text-slate-400" />}
              error={errors.barcode?.message}
              {...register('barcode')}
            />
          </div>
        </div>

        {/* Row 2: Category & Unit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="التصنيف"
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            placeholderOption="اختر التصنيف..."
            error={errors.category_id?.message}
            {...register('category_id')}
          />

          <Select
            label="وحدة القياس"
            options={units.map((u) => ({ value: u.id, label: `${u.name} (${u.short_name})` }))}
            placeholderOption="اختر الوحدة..."
            error={errors.unit_id?.message}
            {...register('unit_id')}
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

            <Input
              type="number"
              step="0.01"
              label="نسبة الضريبة (%)"
              error={errors.tax_percent?.message}
              {...register('tax_percent')}
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
                {product.stock_quantity} {product.unit?.short_name || 'حبة'}
              </p>
              <span className="text-[10px] text-brand-400">لتعديل الرصيد استخدم نافذة (تسوية المخزون)</span>
            </div>
          )}

          <Input
            type="number"
            step="0.001"
            label="حد التنبيه الأدنى (Min Alert)"
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
