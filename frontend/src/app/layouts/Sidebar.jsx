import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LockKeyhole,
  PackageSearch,
  Receipt,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Store,
  Truck,
  Users,
  Wallet,
  Boxes,
  X,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { settingsApi } from '../../features/settings/api/settingsApi';

const navSections = [
  {
    label: null,
    items: [
      { to: '/', label: 'لوحة التحكم', icon: LayoutDashboard },
      { to: '/pos', label: 'نقطة البيع', icon: ShoppingCart },
    ],
  },
  {
    label: 'البيانات',
    items: [
      { to: '/products', label: 'المنتجات', icon: PackageSearch },
      { to: '/inventory', label: 'المخزون', icon: Boxes },
      { to: '/purchases', label: 'المشتريات', icon: ShoppingBag },
    ],
  },
  {
    label: 'الحسابات',
    items: [
      { to: '/sales', label: 'المبيعات والفواتير', icon: Receipt },
      { to: '/customers', label: 'العملاء', icon: Users },
      { to: '/suppliers', label: 'الموردون', icon: Truck },
      { to: '/expenses', label: 'المصروفات', icon: Wallet },
    ],
  },
  {
    label: 'الإدارة',
    items: [
      { to: '/daily-closing', label: 'الصندوق والإغلاق', icon: LockKeyhole },
      { to: '/reports', label: 'التقارير', icon: BarChart3 },
      { to: '/settings', label: 'الإعدادات', icon: Settings },
    ],
  },
];

export function Sidebar({ isOpen, onClose, isCollapsed, onToggleCollapse, isRTL }) {
  const [storeName, setStoreName] = useState('نظام إدارة المحل');
  const location = useLocation();

  useEffect(() => {
    settingsApi.getSettings().then((s) => {
      setStoreName(s.store_name || 'نظام إدارة المحل');
    }).catch(() => {});
  }, []);

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}
      <aside
        className={cn(
          'fixed md:sticky top-0 h-screen z-50 flex flex-col bg-slate-900 border-l border-slate-800 transition-all duration-300 select-none shadow-2xl md:shadow-none',
          isCollapsed ? 'w-20' : 'w-64',
          isOpen ? 'translate-x-0' : isRTL ? 'translate-x-full md:translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-brand-500/20 shrink-0">
              <Store className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="leading-tight min-w-0">
                <span className="font-extrabold text-sm text-slate-100 block tracking-tight truncate">{storeName}</span>
                <span className="text-[10px] text-brand-400 font-semibold block">نظام إدارة المحل</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 md:hidden"
            aria-label="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
          {navSections.map((section, sIdx) => (
            <div key={sIdx}>
              {section.label && !isCollapsed && (
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider px-3 mb-2">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.to === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.to);

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === '/'}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group relative',
                        isActive
                          ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60',
                      )}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon className={cn('w-4 h-4 shrink-0 transition-transform', !isActive && 'group-hover:scale-110')} />
                      {!isCollapsed && (
                        <span className="truncate flex-1 text-right">{item.label}</span>
                      )}
                      {isActive && !isCollapsed && (
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Collapse Toggle */}
        <div className="p-3 border-t border-slate-800 hidden md:block shrink-0">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            aria-label={isCollapsed ? 'توسيع القائمة' : 'طي القائمة'}
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
}
