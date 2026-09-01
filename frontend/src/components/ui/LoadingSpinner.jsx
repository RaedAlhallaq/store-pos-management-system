import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export function LoadingSpinner({ size = 'md', label, className }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 p-6 text-slate-400', className)}>
      <Loader2 className={cn('animate-spin text-brand-500', sizes[size])} />
      {label && <p className="text-xs font-medium text-slate-400">{label}</p>}
    </div>
  );
}
