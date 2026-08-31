import React, { useState } from 'react';
import { Search, Barcode, Boxes } from 'lucide-react';
import type { Category, Product } from '../../products/types/productTypes';

interface PosProductGridProps {
  products: Product[];
  categories: Category[];
  onSelectProduct: (product: Product) => void;
  onBarcodeSubmit: (barcode: string) => void;
  isLoading?: boolean;
}

export const PosProductGrid: React.FC<PosProductGridProps> = ({
  products,
  categories,
  onSelectProduct,
  onBarcodeSubmit,
  isLoading = false,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [barcodeInput, setBarcodeInput] = useState('');

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      e.preventDefault();
      onBarcodeSubmit(barcodeInput.trim());
      setBarcodeInput('');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search));
    return matchCategory && matchSearch && p.is_active;
  });

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Search & Barcode Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Barcode Scanner Input */}
        <div className="relative">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-brand-400">
            <Barcode className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="امسح الباركود أو اكتب واضغط Enter..."
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            onKeyDown={handleBarcodeKeyDown}
            autoFocus
            className="w-full bg-slate-950 text-slate-100 border-2 border-brand-500/40 rounded-2xl pr-11 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-mono shadow-lg shadow-brand-500/5 placeholder:text-slate-500 placeholder:text-xs"
          />
        </div>

        {/* Text Search */}
        <div className="relative">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="بحث يدوي باسم السلعة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 text-slate-100 border border-slate-800 rounded-2xl pr-10 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedCategory === 'all'
              ? 'bg-brand-500 text-slate-950 shadow-md shadow-brand-500/20'
              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
          }`}
        >
          جميع الأصناف ({products.length})
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelectedCategory(c.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === c.id
                ? 'bg-brand-500 text-slate-950 shadow-md shadow-brand-500/20'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Product Cards Grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-slate-400">
            <span>جارِ تحميل الكتالوج...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-900/40 rounded-3xl border border-slate-800/80">
            <Boxes className="w-12 h-12 text-slate-600 mb-2" />
            <p className="text-sm font-bold text-slate-300">لا توجد منتجات مطابقة للبحث</p>
            <p className="text-xs text-slate-500 mt-1">تأكد من كتابة الاسم بدقة أو امسح الباركود</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((product) => {
              const stockQty = Number(product.stock_quantity);
              const isOut = stockQty <= 0;

              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => onSelectProduct(product)}
                  className="text-right p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-brand-500/50 hover:bg-slate-850 hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 flex flex-col justify-between group shadow-sm"
                >
                  <div>
                    <div className="flex items-start justify-between gap-1 mb-2">
                      <span className="text-[10px] text-brand-400 font-semibold truncate block max-w-[120px]">
                        {product.category?.name || 'عام'}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                          isOut
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isOut ? 'نفد' : `${product.stock_quantity}`}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-100 text-xs md:text-sm line-clamp-2 leading-snug group-hover:text-brand-300 transition-colors">
                      {product.name}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      {product.unit?.short_name || 'حبة'}
                    </span>
                    <span className="text-sm font-bold text-slate-100 font-mono text-left">
                      {Number(product.selling_price).toFixed(2)} <span className="text-[10px] font-normal text-slate-400">₪</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
