import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../api/productsApi';
import { ProductFilterBar } from '../components/ProductFilterBar';
import { ProductModal } from '../components/ProductModal';
import { CategoryModal } from '../components/CategoryModal';
import { UnitModal } from '../components/UnitModal';
import { StockAdjustmentModal } from '../components/StockAdjustmentModal';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Pagination } from '../../../components/ui/Pagination';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import {
  Plus,
  Layers,
  Scale,
  Edit,
  Trash2,
  PackageCheck,
  Boxes,
  AlertTriangle,
  TrendingUp,
  Barcode as BarcodeIcon,
  DollarSign,
  Copy,
  Check,
} from 'lucide-react';
import type { Product, ProductFilters } from '../types/productTypes';
import { toast } from 'sonner';

export const ProductsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    category_id: 'all',
    stock_status: 'all',
    page: 1,
    per_page: 10,
  });

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [copiedBarcode, setCopiedBarcode] = useState<string | null>(null);

  // Queries
  const { data: productsData, isLoading: isProductsLoading } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => productsApi.getProducts(filters),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productsApi.getCategories(),
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => productsApi.getUnits(),
  });

  const { data: metrics } = useQuery({
    queryKey: ['products-metrics'],
    queryFn: () => productsApi.getMetrics(),
  });

  // Mutations
  const createProductMutation = useMutation({
    mutationFn: productsApi.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-metrics'] });
      toast.success('تمت إضافة المنتج بنجاح');
      setIsProductModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'فشلت إضافة المنتج');
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Product> }) =>
      productsApi.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-metrics'] });
      toast.success('تم تحديث المنتج بنجاح');
      setIsProductModalOpen(false);
      setEditingProduct(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'فشل تحديث المنتج');
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: productsApi.deleteProduct,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-metrics'] });
      toast.success(res.message || 'تم حذف المنتج');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'تعذر حذف المنتج');
    },
  });

  const adjustStockMutation = useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: number;
      data: { type: string; quantity: number; notes?: string };
    }) => productsApi.adjustStock(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
    },
  });

  const handleSaveProduct = async (data: Partial<Product>) => {
    if (editingProduct) {
      await updateProductMutation.mutateAsync({ id: editingProduct.id, data });
    } else {
      await createProductMutation.mutateAsync(data);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (window.confirm(`هل أنت متأكد من حذف المنتج: "${product.name}"؟`)) {
      await deleteProductMutation.mutateAsync(product.id);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBarcode(text);
    setTimeout(() => setCopiedBarcode(null), 2000);
    toast.info(`تم نسخ الباركود: ${text}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Boxes className="w-6 h-6 text-brand-400" />
            <span>إدارة المنتجات والأصناف</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            إضافة وتعديل بطاقات الأصناف، ضبط أسعار التكلفة والبيع، ومراقبة المخزون
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsUnitModalOpen(true)}
            rightIcon={<Scale className="w-4 h-4 text-slate-400" />}
          >
            وحدات القياس
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCategoryModalOpen(true)}
            rightIcon={<Layers className="w-4 h-4 text-slate-400" />}
          >
            التصنيفات
          </Button>

          <Button
            onClick={() => {
              setEditingProduct(null);
              setIsProductModalOpen(true);
            }}
            rightIcon={<Plus className="w-4 h-4" />}
          >
            إضافة منتج جديد
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">إجمالي الأصناف</p>
              <p className="text-xl font-bold text-slate-100 font-mono mt-1">
                {metrics?.total_products ?? 0} منتج
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                الكمية الإجمالية: {metrics?.total_quantity ?? 0}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">نواقص المخزون</p>
              <p className="text-xl font-bold text-amber-400 font-mono mt-1">
                {metrics?.low_stock_count ?? 0} صنف
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                نفد بالكامل: {metrics?.out_of_stock_count ?? 0}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">قيمة المخزون (بالتكلفة)</p>
              <p className="text-xl font-bold text-emerald-400 font-mono mt-1">
                {(metrics?.total_cost_value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} ₪
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">رأس المال المستثمر في البضاعة</p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">الربح المتوقع للمخزون</p>
              <p className="text-xl font-bold text-sky-400 font-mono mt-1">
                {(metrics?.potential_profit ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} ₪
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">عند بيع كامل الكمية الحالية</p>
            </div>
            <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <ProductFilterBar
        filters={filters}
        categories={categories}
        onFilterChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
      />

      {/* Products Table Card */}
      <Card className="overflow-hidden border-slate-800 bg-slate-900/70">
        {isProductsLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <LoadingSpinner size="lg" />
            <span className="text-xs text-slate-400">جارِ تحميل المنتجات...</span>
          </div>
        ) : !productsData?.data || productsData.data.length === 0 ? (
          <EmptyState
            title="لم يتم العثور على أي منتجات"
            description="يمكنك إضافة أصناف جديدة أو تغيير معايير البحث والتصفية"
            actionLabel="إضافة منتج جديد"
            onAction={() => {
              setEditingProduct(null);
              setIsProductModalOpen(true);
            }}
          />
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold select-none">
                    <th className="py-3.5 px-4">الصنف والباركود</th>
                    <th className="py-3.5 px-4">التصنيف</th>
                    <th className="py-3.5 px-4">الوحدة</th>
                    <th className="py-3.5 px-4">سعر التكلفة</th>
                    <th className="py-3.5 px-4">سعر البيع</th>
                    <th className="py-3.5 px-4">هامش الربح</th>
                    <th className="py-3.5 px-4">المخزون المتوفر</th>
                    <th className="py-3.5 px-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {productsData.data.map((product) => {
                    const stockQty = Number(product.stock_quantity);
                    const minStock = Number(product.min_stock_alert);
                    const isLow = stockQty <= minStock && stockQty > 0;
                    const isOut = stockQty <= 0;

                    return (
                      <tr
                        key={product.id}
                        className="hover:bg-slate-850/50 transition-colors group"
                      >
                        {/* Name & Barcode */}
                        <td className="py-3.5 px-4">
                          <div>
                            <span className="font-bold text-slate-100 text-sm block">
                              {product.name}
                            </span>
                            {product.barcode ? (
                              <button
                                onClick={() => copyToClipboard(product.barcode!)}
                                className="inline-flex items-center gap-1 mt-1 text-[11px] font-mono text-slate-400 hover:text-brand-400 bg-slate-950/60 px-2 py-0.5 rounded-md border border-slate-800 transition-colors"
                                title="اضغط لنسخ الباركود"
                              >
                                <BarcodeIcon className="w-3 h-3 text-brand-400" />
                                <span>{product.barcode}</span>
                                {copiedBarcode === product.barcode ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-2.5 h-2.5 opacity-60" />
                                )}
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-600">بدون باركود</span>
                            )}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4">
                          <span className="text-slate-300 font-medium">
                            {product.category?.name || '—'}
                          </span>
                        </td>

                        {/* Unit */}
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/60 text-[11px] font-semibold">
                            {product.unit?.short_name || 'حبة'}
                          </span>
                        </td>

                        {/* Cost Price */}
                        <td className="py-3.5 px-4 font-mono text-slate-300 font-semibold">
                          {Number(product.cost_price).toFixed(2)} ₪
                        </td>

                        {/* Selling Price */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-100 text-sm">
                          {Number(product.selling_price).toFixed(2)} ₪
                        </td>

                        {/* Profit Margin */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg text-[11px]">
                            <span>+{product.profit_margin} ₪</span>
                            <span className="text-[10px] opacity-80">({product.profit_percentage}%)</span>
                          </span>
                        </td>

                        {/* Stock Balance */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono font-bold text-sm ${
                                isOut
                                  ? 'text-rose-400'
                                  : isLow
                                  ? 'text-amber-400'
                                  : 'text-slate-100'
                              }`}
                            >
                              {product.stock_quantity}
                            </span>
                            {isOut ? (
                              <Badge variant="danger" size="sm">
                                نفد
                              </Badge>
                            ) : isLow ? (
                              <Badge variant="warning" size="sm">
                                منخفض
                              </Badge>
                            ) : null}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              title="تسوية المخزون"
                              onClick={() => setAdjustingProduct(product)}
                              className="text-brand-400 hover:bg-brand-500/10 p-1.5"
                            >
                              <PackageCheck className="w-4 h-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              title="تعديل بيانات المنتج"
                              onClick={() => {
                                setEditingProduct(product);
                                setIsProductModalOpen(true);
                              }}
                              className="text-slate-300 hover:bg-slate-800 p-1.5"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              title="حذف / تعطيل المنتج"
                              onClick={() => handleDeleteProduct(product)}
                              className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 p-1.5"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {productsData.meta && (
              <div className="px-4 border-t border-slate-800">
                <Pagination
                  currentPage={productsData.meta.current_page}
                  lastPage={productsData.meta.last_page}
                  total={productsData.meta.total}
                  from={productsData.meta.from ?? 1}
                  to={productsData.meta.to ?? productsData.meta.total}
                  onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
                />
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Modals */}
      {isProductModalOpen && (
        <ProductModal
          isOpen={isProductModalOpen}
          onClose={() => {
            setIsProductModalOpen(false);
            setEditingProduct(null);
          }}
          onSave={handleSaveProduct}
          product={editingProduct}
          categories={categories}
          units={units}
          isLoading={createProductMutation.isPending || updateProductMutation.isPending}
        />
      )}

      {isCategoryModalOpen && (
        <CategoryModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          categories={categories}
          onCreate={async (data) => {
            await productsApi.createCategory(data);
            queryClient.invalidateQueries({ queryKey: ['categories'] });
          }}
          onUpdate={async (id, data) => {
            await productsApi.updateCategory(id, data);
            queryClient.invalidateQueries({ queryKey: ['categories'] });
          }}
          onDelete={async (id) => {
            await productsApi.deleteCategory(id);
            queryClient.invalidateQueries({ queryKey: ['categories'] });
          }}
        />
      )}

      {isUnitModalOpen && (
        <UnitModal
          isOpen={isUnitModalOpen}
          onClose={() => setIsUnitModalOpen(false)}
          units={units}
          onCreate={async (data) => {
            await productsApi.createUnit(data);
            queryClient.invalidateQueries({ queryKey: ['units'] });
          }}
          onUpdate={async (id, data) => {
            await productsApi.updateUnit(id, data);
            queryClient.invalidateQueries({ queryKey: ['units'] });
          }}
          onDelete={async (id) => {
            await productsApi.deleteUnit(id);
            queryClient.invalidateQueries({ queryKey: ['units'] });
          }}
        />
      )}

      {adjustingProduct && (
        <StockAdjustmentModal
          isOpen={!!adjustingProduct}
          onClose={() => setAdjustingProduct(null)}
          product={adjustingProduct}
          onAdjust={async (productId, data) => {
            await adjustStockMutation.mutateAsync({ productId, data });
          }}
        />
      )}
    </div>
  );
};
