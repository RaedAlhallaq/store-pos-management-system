import { cn } from '../../lib/utils';

export function Card({ className, children, hoverEffect = false, ...props }) {
  return (
    <div
      className={cn(
        'bg-slate-900/70 border border-slate-800/80 backdrop-blur-md rounded-2xl p-5 shadow-xl',
        hoverEffect && 'transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/90 hover:shadow-2xl',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
