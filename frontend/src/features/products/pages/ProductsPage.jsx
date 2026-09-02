import { useState, useEffect, useCallback } from 'react';
import { productsApi } from '../api/productsApi';
import { ProductFilterBar } from '../components/ProductFilterBar';
import { ProductModal } from '../components/ProductModal';
import { CategoryModal } from '../components/CategoryModal';
import { StockAdjustmentModal } from '../components/StockAdjustmentModal';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Pagination } from '../../../components/ui/Pagination';
import { EmptyState } from '../../../components/ui/EmptyState';
import {
  Plus,
  Layers,
  Edit,
  Trash2,
  PackageCheck,
  Boxes,
  AlertTriangle,
  TrendingUp,

  DollarSign,
  LayoutGrid,
  List,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

/* ── Skeleton loader ─────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl bg-slate-900/60 border border-slate-800 p-4 space-y-3">
      <div className="h-4 bg-slate-800 rounded w-2/3" />
      <div className="h-3 bg-slate-800 rounded w-1/3" />
      <div className="flex gap-2 mt-2">
        <div className="h-6 w-16 bg-slate-800 rounded-lg" />
        <div className="h-6 w-20 bg-slate-800 rounded-lg" />
      </div>
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="animate-pulse space-y-0">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-slate-800/40">
          <div className="h-3.5 bg-slate-800 rounded w-1/4" />
          <div className="h-3.5 bg-slate-800 rounded w-1/6" />
          <div className="h-3.5 bg-slate-800 rounded w-1/6" />
          <div className="h-3.5 bg-slate-800 rounded w-1/8" />
          <div className="h-3.5 bg-slate-800 rounded w-1/8" />
        </div>
      ))}
    </div>
  );
}

/* ── Product Card (grid view) ──────────────────────── */
function ProductCard({ product, onEdit, onDelete, onAdjust }) {
  const stockQty = Number(product.stock_quantity);
  const minStock = Number(product.min_stock_alert);
  const isLow = stockQty > 0 && stockQty <= minStock;
  const isOut = stockQty <= 0;

  return (
    <div className="group relative rounded-2xl bg-slate-900/70 border border-slate-800 p-4 hover:border-slate-700 hover:bg-slate-900/90 transition-all">
      {/* Top row: name + active badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-bold text-sm text-slate-100 leading-tight line-clamp-2">{product.name}</h3>
        {product.is_active === false && (
          <Badge variant="danger" size="sm">معطّل</Badge>
        )}
      </div>

      {/* Category & Unit chips */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        {product.category?.name && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
            {product.category.name}
          </span>
        )}
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/60 font-semibold">
          {product.unit || 'حبة'}
        </span>
      </div>

      {/* Prices */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-slate-950/60 rounded-xl px-3 py-2 border border-slate-800/60">
          <span className="text-[9px] text-slate-500 font-semibold block">التكلفة</span>
          <span className="font-mono text-xs text-slate-300 font-semibold">
            {Number(product.cost_price).toFixed(2)} ₪
          </span>
        </div>
        <div className="bg-slate-950/60 rounded-xl px-3 py-2 border border-slate-800/60">
          <span className="text-[9px] text-slate-500 font-semibold block">البيع</span>
          <span className="font-mono text-sm text-slate-100 font-bold">
            {Number(product.selling_price).toFixed(2)} ₪
          </span>
        </div>
      </div>

      {/* Profit badge + stock */}
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg text-[11px]">
          +{product.profit_margin} ₪
          <span className="text-[10px] opacity-80">({product.profit_percentage}%)</span>
        </span>

        <div className="flex items-center gap-1.5">
          <span className={`font-mono font-bold text-xs ${isOut ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-slate-100'}`}>
            {product.stock_quantity}
          </span>
          {isOut ? (
            <Badge variant="danger" size="sm">نفد</Badge>
          ) : isLow ? (
            <Badge variant="warning" size="sm">منخفض</Badge>
          ) : null}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/60">
        <Button
          variant="ghost"
          size="sm"
          title="تسوية المخزون"
          onClick={() => onAdjust(product)}
          className="flex-1 text-brand-400 hover:bg-brand-500/10 justify-center gap-1.5"
        >
          <PackageCheck className="w-3.5 h-3.5" />
          <span className="text-[10px]">مخزون</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          title="تعديل بيانات المنتج"
          onClick={() => onEdit(product)}
          className="flex-1 text-slate-300 hover:bg-slate-800 justify-center gap-1.5"
        >
          <Edit className="w-3.5 h-3.5" />
          <span className="text-[10px]">تعديل</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          title="حذف / تعطيل المنتج"
          onClick={() => onDelete(product)}
          className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 p-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

/* ── Main Products Page ────────────────────────────── */
export function ProductsPage() {
  const [filters, setFilters] = useState({
    search: '',
    category_id: 'all',
    stock_status: 'all',
    page: 1,
    per_page: 12,
  });
  const [viewMode, setViewMode] = useState('grid');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [adjustingProduct, setAdjustingProduct] = useState(null);

  // Data state
  const [productsData, setProductsData] = useState(null);
  const [categories, setCategories] = useState([]);

  const [metrics, setMetrics] = useState(null);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadProducts = useCallback(async () => {
    setIsProductsLoading(true);
    setError(null);
    try {
      const data = await productsApi.getProducts(filters);
      setProductsData(data);
    } catch (err) {
      setError(err?.message || 'حدث خطأ أثناء تحميل المنتجات');
      toast.error('تعذر تحميل المنتجات');
    } finally {
      setIsProductsLoading(false);
    }
  }, [filters]);

  const loadMeta = useCallback(async () => {
    try {
      const [cats, m] = await Promise.all([
        productsApi.getCategories(),
        productsApi.getMetrics(),
      ]);
      setCategories(cats);
      setMetrics(m);
    } catch {
      // meta is non-critical; ignore silently
    }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => { loadMeta(); }, [loadMeta]);

  const refreshAll = async () => {
    await Promise.all([loadProducts(), loadMeta()]);
  };

  const handleSaveProduct = async (data) => {
    setIsSaving(true);
    try {
      if (editingProduct) {
        await productsApi.updateProduct(editingProduct.id, data);
        toast.success('تم تحديث المنتج بنجاح');
      } else {
        await productsApi.createProduct(data);
        toast.success('تمت إضافة المنتج بنجاح');
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
      await refreshAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'فشلت العملية');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (product) => {
    if (window.confirm(`هل أنت متأكد من حذف المنتج: "${product.name}"؟`)) {
      try {
        const res = await productsApi.deleteProduct(product.id);
        toast.success(res.message || 'تم حذف المنتج');
        await refreshAll();
      } catch (err) {
        toast.error(err?.response?.data?.message || err?.message || 'تعذر حذف المنتج');
      }
    }
  };

  const handleAdjustStock = async (productId, data) => {
    await productsApi.adjustStock(productId, data);
    await refreshAll();
  };



  const handleFilterChange = (patch) => {
    setFilters((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));
  };

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────── */}
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

      {/* ── KPI Cards ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="p-3 md:p-4 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-semibold text-slate-400">إجمالي الأصناف</p>
              <p className="text-lg md:text-xl font-bold text-slate-100 font-mono mt-0.5">
                {metrics?.total_products ?? '—'}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5 hidden sm:block">
                الكمية: {metrics?.total_quantity ?? 0}
              </p>
            </div>
            <div className="p-2.5 md:p-3 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Boxes className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-3 md:p-4 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-semibold text-slate-400">نواقص المخزون</p>
              <p className="text-lg md:text-xl font-bold text-amber-400 font-mono mt-0.5">
                {metrics?.low_stock_count ?? '—'}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5 hidden sm:block">
                نفد بالكامل: {metrics?.out_of_stock_count ?? 0}
              </p>
            </div>
            <div className="p-2.5 md:p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-3 md:p-4 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-semibold text-slate-400">قيمة المخزون</p>
              <p className="text-lg md:text-xl font-bold text-emerald-400 font-mono mt-0.5">
                {(metrics?.total_cost_value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} ₪
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5 hidden sm:block">رأس المال المستثمر</p>
            </div>
            <div className="p-2.5 md:p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-3 md:p-4 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] md:text-xs font-semibold text-slate-400">الربح المتوقع</p>
              <p className="text-lg md:text-xl font-bold text-sky-400 font-mono mt-0.5">
                {(metrics?.potential_profit ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} ₪
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5 hidden sm:block">عند بيع كامل الكمية</p>
            </div>
            <div className="p-2.5 md:p-3 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* ── Filter Bar ────────────────────────────── */}
      <ProductFilterBar
        filters={filters}
        categories={categories}
        onFilterChange={handleFilterChange}
      />

      {/* ── Products Content Card ─────────────────── */}
      <Card className="overflow-hidden border-slate-800 bg-slate-900/70">
        {/* Toolbar: view toggle + per-page + result count */}
        {!isProductsLoading && productsData && (
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                <span className="font-bold text-slate-200">{productsData.meta?.total ?? 0}</span> منتج
              </span>
              {productsData.data && (
                <button
                  onClick={refreshAll}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                  title="تحديث"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Per-page selector */}
              <select
                value={filters.per_page}
                onChange={(e) => handleFilterChange({ per_page: Number(e.target.value) })}
                className="bg-slate-950/80 text-slate-300 border border-slate-800 rounded-lg px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-brand-500/50"
              >
                <option value={12}>12 / صفحة</option>
                <option value={24}>24 / صفحة</option>
                <option value={48}>48 / صفحة</option>
              </select>

              {/* View toggle */}
              <div className="flex items-center bg-slate-950/80 rounded-lg border border-slate-800 overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-brand-500/20 text-brand-400' : 'text-slate-500 hover:text-slate-300'}`}
                  title="عرض شبكي"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 transition-colors ${viewMode === 'table' ? 'bg-brand-500/20 text-brand-400' : 'text-slate-500 hover:text-slate-300'}`}
                  title="عرض جدولي"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Content ──────────────────────────────── */}
        {isProductsLoading ? (
          <div className="p-4">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : (
              <SkeletonTable />
            )}
          </div>
        ) : error ? (
          <div className="py-16 flex flex-col items-center justify-center gap-4">
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
              <AlertTriangle className="w-8 h-8 text-rose-400" />
            </div>
            <p className="text-sm text-slate-300 font-semibold">{error}</p>
            <Button variant="outline" size="sm" onClick={refreshAll} rightIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              إعادة المحاولة
            </Button>
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
        ) : viewMode === 'grid' ? (
          /* ── Grid View ──────────────────────────── */
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {productsData.data.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onEdit={(p) => { setEditingProduct(p); setIsProductModalOpen(true); }}
                  onDelete={handleDeleteProduct}
                  onAdjust={(p) => setAdjustingProduct(p)}

                />
              ))}
            </div>
          </div>
        ) : (
          /* ── Table View ─────────────────────────── */
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold select-none">
                    <th className="py-3.5 px-4">الصنف</th>
                    <th className="py-3.5 px-4 hidden md:table-cell">التصنيف</th>
                    <th className="py-3.5 px-4 hidden lg:table-cell">الوحدة</th>
                    <th className="py-3.5 px-4 hidden sm:table-cell">سعر التكلفة</th>
                    <th className="py-3.5 px-4">سعر البيع</th>
                    <th className="py-3.5 px-4 hidden md:table-cell">هامش الربح</th>
                    <th className="py-3.5 px-4">المخزون</th>
                    <th className="py-3.5 px-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {productsData.data.map((product) => {
                    const stockQty = Number(product.stock_quantity);
                    const minStock = Number(product.min_stock_alert);
                    const isLow = stockQty > 0 && stockQty <= minStock;
                    const isOut = stockQty <= 0;

                    return (
                      <tr key={product.id} className="hover:bg-slate-800/40 transition-colors group">
                        <td className="py-3.5 px-4">
                          <div>
                            <span className="font-bold text-slate-100 text-sm block">{product.name}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 hidden md:table-cell">
                          <span className="text-slate-300 font-medium">{product.category?.name || '—'}</span>
                        </td>

                        <td className="py-3.5 px-4 hidden lg:table-cell">
                          <span className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/60 text-[11px] font-semibold">
                            {product.unit || 'حبة'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-300 font-semibold hidden sm:table-cell">
                          {Number(product.cost_price).toFixed(2)} ₪
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-slate-100 text-sm">
                          {Number(product.selling_price).toFixed(2)} ₪
                        </td>

                        <td className="py-3.5 px-4 hidden md:table-cell">
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg text-[11px]">
                            <span>+{product.profit_margin} ₪</span>
                            <span className="text-[10px] opacity-80">({product.profit_percentage}%)</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`font-mono font-bold text-sm ${isOut ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-slate-100'}`}>
                              {product.stock_quantity}
                            </span>
                            {isOut ? (
                              <Badge variant="danger" size="sm">نفد</Badge>
                            ) : isLow ? (
                              <Badge variant="warning" size="sm">منخفض</Badge>
                            ) : null}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button variant="ghost" size="sm" title="تسوية المخزون" onClick={() => setAdjustingProduct(product)} className="text-brand-400 hover:bg-brand-500/10 p-1.5">
                              <PackageCheck className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" title="تعديل بيانات المنتج" onClick={() => { setEditingProduct(product); setIsProductModalOpen(true); }} className="text-slate-300 hover:bg-slate-800 p-1.5">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" title="حذف / تعطيل المنتج" onClick={() => handleDeleteProduct(product)} className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 p-1.5">
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
          </div>
        )}

        {/* ── Pagination ───────────────────────────── */}
        {productsData?.meta && productsData.meta.last_page > 1 && (
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
      </Card>

      {/* ── Modals ──────────────────────────────────── */}
      {isProductModalOpen && (
        <ProductModal
          isOpen={isProductModalOpen}
          onClose={() => { setIsProductModalOpen(false); setEditingProduct(null); }}
          onSave={handleSaveProduct}
          product={editingProduct}
          categories={categories}
          isLoading={isSaving}
        />
      )}

      {isCategoryModalOpen && (
        <CategoryModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          categories={categories}
          onCreate={async (data) => { await productsApi.createCategory(data); await loadMeta(); }}
          onUpdate={async (id, data) => { await productsApi.updateCategory(id, data); await loadMeta(); }}
          onDelete={async (id) => { await productsApi.deleteCategory(id); await loadMeta(); }}
        />
      )}

      {adjustingProduct && (
        <StockAdjustmentModal
          isOpen={!!adjustingProduct}
          onClose={() => setAdjustingProduct(null)}
          product={adjustingProduct}
          onAdjust={handleAdjustStock}
        />
      )}
    </div>
  );
}
