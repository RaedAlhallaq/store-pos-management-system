import { Search, Filter, AlertTriangle, CheckCircle2, XCircle, X } from 'lucide-react';

export function ProductFilterBar({ filters, categories, onFilterChange }) {
  const hasActiveFilters =
    (filters.search && filters.search.length > 0) ||
    (filters.category_id && filters.category_id !== 'all') ||
    (filters.stock_status && filters.stock_status !== 'all');

  const activeCount =
    (filters.search ? 1 : 0) +
    (filters.category_id !== 'all' ? 1 : 0) +
    (filters.stock_status !== 'all' ? 1 : 0);

  const clearAll = () => {
    onFilterChange({ search: '', category_id: 'all', stock_status: 'all' });
  };

  return (
    <div className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Search Bar */}
        <div className="md:col-span-6 relative">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="ابحث بالاسم، الباركود، أو رمز الصنف (SKU)..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="w-full bg-slate-950/80 text-slate-100 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 placeholder:text-slate-500"
          />
        </div>

        {/* Category Dropdown */}
        <div className="md:col-span-4">
          <select
            value={filters.category_id || 'all'}
            onChange={(e) => onFilterChange({ category_id: e.target.value })}
            className="w-full bg-slate-950/80 text-slate-100 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
          >
            <option value="all">جميع التصنيفات ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.products_count ?? 0})
              </option>
            ))}
          </select>
        </div>

        {/* Clear All */}
        <div className="md:col-span-2 flex items-center justify-end">
          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>مسح ({activeCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Stock Status Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80 text-xs">
        <span className="text-slate-400 font-semibold flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-brand-400" />
          <span>حالة المخزون:</span>
        </span>

        <button
          type="button"
          onClick={() => onFilterChange({ stock_status: 'all' })}
          className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
            !filters.stock_status || filters.stock_status === 'all'
              ? 'bg-brand-500 text-slate-950'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          الكل
        </button>

        <button
          type="button"
          onClick={() => onFilterChange({ stock_status: 'low' })}
          className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
            filters.stock_status === 'low'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'bg-slate-800 text-amber-400/90 hover:bg-slate-700'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>نواقص المخزون</span>
        </button>

        <button
          type="button"
          onClick={() => onFilterChange({ stock_status: 'out' })}
          className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
            filters.stock_status === 'out'
              ? 'bg-rose-500 text-white font-bold'
              : 'bg-slate-800 text-rose-400 hover:bg-slate-700'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>نفد من المخزون</span>
        </button>

        <button
          type="button"
          onClick={() => onFilterChange({ stock_status: 'in_stock' })}
          className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
            filters.stock_status === 'in_stock'
              ? 'bg-emerald-500 text-slate-950 font-bold'
              : 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>متوفر بالمستودع</span>
        </button>
      </div>
    </div>
  );
}
