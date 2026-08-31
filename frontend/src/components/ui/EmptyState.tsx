import React from 'react';
import { type LucideIcon, PackageOpen } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = PackageOpen,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30',
        className
      )}
    >
      <div className="p-4 rounded-2xl bg-slate-800/80 text-slate-400 mb-4 ring-1 ring-slate-700">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base font-bold text-slate-200">{title}</h3>
      {description && <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">{description}</p>}
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
