import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export function Pagination({
  currentPage,
  lastPage,
  total,
  from,
  to,
  onPageChange,
}) {
  if (total === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 text-xs text-slate-400">
      <div>
        <span>عرض </span>
        <span className="font-bold text-slate-200">{from ?? 1}</span>
        <span> إلى </span>
        <span className="font-bold text-slate-200">{to ?? total}</span>
        <span> من أصل </span>
        <span className="font-bold text-slate-200">{total}</span>
        <span> عنصر</span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          rightIcon={<ChevronRight className="w-4 h-4" />}
        >
          السابق
        </Button>

        <div className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-xl font-mono font-bold text-slate-200">
          {currentPage} / {lastPage || 1}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= lastPage}
          onClick={() => onPageChange(currentPage + 1)}
          leftIcon={<ChevronLeft className="w-4 h-4" />}
        >
          التالي
        </Button>
      </div>
    </div>
  );
}
