import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  PackageSearch,
  Receipt,
  Users,
  Truck,
  ShoppingBag,
  Wallet,
  BarChart3,
  LockKeyhole,
  Settings,
  Store,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isRTL: boolean;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
  isRTL,
}) => {
  const navItems: NavItem[] = [
    { to: '/', label: 'لوحة التحكم', icon: LayoutDashboard },
    { to: '/pos', label: 'نقطة البيع', icon: ShoppingCart },
    { to: '/products', label: 'المنتجات والمخزون', icon: PackageSearch },
    { to: '/sales', label: 'المبيعات والفواتير', icon: Receipt },
    { to: '/purchases', label: 'المشتريات', icon: ShoppingBag },
    { to: '/customers', label: 'العملاء والديون', icon: Users },
    { to: '/suppliers', label: 'الموردون والمستحقات', icon: Truck },
    { to: '/expenses', label: 'المصروفات', icon: Wallet },
    { to: '/daily-closing', label: 'الصندوق والإغلاق اليومي', icon: LockKeyhole },
    { to: '/reports', label: 'التقارير والأرباح', icon: BarChart3 },
    { to: '/settings', label: 'الإعدادات', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed md:sticky top-0 h-screen z-50 flex flex-col bg-slate-900 border-l border-r border-slate-800 transition-all duration-300 select-none shadow-2xl md:shadow-none',
          isRTL ? 'border-l-slate-800' : 'border-r-slate-800',
          isCollapsed ? 'w-20' : 'w-64',
          isOpen ? 'translate-x-0' : isRTL ? 'translate-x-full md:translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Brand Logo Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-brand-500/20 shrink-0">
              <Store className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="leading-tight">
                <span className="font-extrabold text-sm text-slate-100 block tracking-tight">
                  الأصيل للمنظفات
                </span>
                <span className="text-[10px] text-brand-400 font-semibold block">
                  نظام إدارة المحل
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group relative',
                    isActive
                      ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                {!isCollapsed && (
                  <span className="truncate flex-1 text-right">{item.label}</span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Footer Collapse Button */}
        <div className="p-3 border-t border-slate-800 hidden md:block">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            {isCollapsed ? (
              isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                <span>طي القائمة</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
