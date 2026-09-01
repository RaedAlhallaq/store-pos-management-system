import { useState } from 'react';
import { Barcode, Boxes, Search, X, Package, AlertTriangle } from 'lucide-react';

function ProductSkeleton() {
  return (
    <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 animate-pulse space-y-3">
      <div className="flex items-start justify-between">
        <div className="h-3 bg-slate-800 rounded w-16" />
        <div className="h-4 bg-slate-800 rounded w-12" />
      </div>
      <div className="h-4 bg-slate-800 rounded w-3/4" />
      <div className="pt-2 border-t border-slate-800/80 flex justify-between">
        <div className="h-3 bg-slate-800 rounded w-10" />
        <div className="h-4 bg-slate-800 rounded w-16" />
      </div>
    </div>
  );
}

export function PosProductGrid({ products, categories, onSelectProduct, onBarcodeSubmit, isLoading = false }) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showOutOfStock, setShowOutOfStock] = useState(true);

  const filteredProducts = products.filter((product) => {
    if (!product.is_active) return false;
    if (selectedCategory !== 'all' && product.category_id !== selectedCategory) return false;
    if (!showOutOfStock && Number(product.stock_quantity) <= 0) return false;
    if (search) {
      const term = search.toLowerCase();
      return (
        product.name.toLowerCase().includes(term) ||
        product.barcode?.includes(term) ||
        product.sku?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const inStockCount = filteredProducts.filter((p) => Number(p.stock_quantity) > 0).length;

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Search bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-brand-400">
            <Barcode className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="امسح الباركود أو اكتب واضغط Enter..."
            value={barcodeInput}
            onChange={(event) => setBarcodeInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && barcodeInput.trim()) {
                event.preventDefault();
                onBarcodeSubmit(barcodeInput.trim());
                setBarcodeInput('');
              }
            }}
            className="w-full bg-slate-950 text-slate-100 border-2 border-brand-500/40 rounded-2xl pr-11 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-mono shadow-lg shadow-brand-500/5 placeholder:text-slate-500 placeholder:text-xs"
          />
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="بحث يدوي باسم السلعة أو SKU..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full bg-slate-900 text-slate-100 border border-slate-800 rounded-2xl pr-10 pl-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 placeholder:text-slate-500"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category filter + stock toggle */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === 'all' ? 'bg-brand-500 text-slate-950 shadow-md shadow-brand-500/20' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'}`}
        >
          جميع الأصناف ({products.filter((p) => p.is_active).length})
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === category.id ? 'bg-brand-500 text-slate-950 shadow-md shadow-brand-500/20' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'}`}
          >
            {category.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowOutOfStock(!showOutOfStock)}
          className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${showOutOfStock ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'}`}
        >
          <Package className="w-3.5 h-3.5" />
          {showOutOfStock ? 'إظهار الكل' : 'المتوفر فقط'}
        </button>
      </div>

      {/* Product grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-900/40 rounded-3xl border border-slate-800/80">
            <Boxes className="w-12 h-12 text-slate-600 mb-2" />
            <p className="text-sm font-bold text-slate-300">لا توجد منتجات مطابقة</p>
            <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
              {search ? 'جرّب كلمة بحث مختلفة أو تحقق من الباركود' : 'لا توجد منتجات في هذا التصنيف'}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-slate-500 font-semibold">{filteredProducts.length} منتج — {inStockCount} متوفر</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((product) => {
                const stock = Number(product.stock_quantity);
                const isOut = stock <= 0;
                const isLow = stock > 0 && stock <= 5;

                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => !isOut && onSelectProduct(product)}
                    disabled={isOut}
                    className={`text-right p-3 rounded-2xl border transition-all duration-150 flex flex-col justify-between group shadow-sm ${isOut ? 'bg-slate-900/50 border-slate-800/50 opacity-60 cursor-not-allowed' : 'bg-slate-900/90 border-slate-800 hover:border-brand-500/50 hover:bg-slate-850 hover:scale-[1.02] active:scale-[0.98]'}`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-2">
                        <span className="text-[10px] text-brand-400 font-semibold truncate block max-w-[120px]">
                          {product.category?.name || 'عام'}
                        </span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${isOut ? 'bg-rose-500/20 text-rose-300' : isLow ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'}`}>
                          {isOut ? 'نفد' : isLow ? `${stock} متبقي` : stock}
                        </span>
                      </div>
                      <h4 className={`font-bold text-xs md:text-sm line-clamp-2 leading-snug ${isOut ? 'text-slate-400' : 'text-slate-100 group-hover:text-brand-300 transition-colors'}`}>
                        {product.name}
                      </h4>
                      {product.sku && (
                        <span className="text-[10px] text-slate-600 font-mono mt-1 block">SKU: {product.sku}</span>
                      )}
                      {isOut && (
                        <span className="text-[10px] text-rose-400 font-semibold mt-1 flex items-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          غير متوفر
                        </span>
                      )}
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-xs text-slate-400">{product.unit?.short_name || 'حبة'}</span>
                      <span className="text-sm font-bold text-slate-100 font-mono text-left">
                        {Number(product.selling_price).toFixed(2)} <span className="text-[10px] font-normal text-slate-400">₪</span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
