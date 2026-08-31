import React from 'react';
import { useAuth } from '../../features/auth/context/AuthContext';
import {
  Menu,
  LogOut,
  User as UserIcon,
  Store,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../features/auth/api/authApi';

interface HeaderProps {
  onToggleSidebar: () => void;
  isRTL: boolean;
  onToggleRTL: () => void;
}

/** Minimal connection indicator — no technical details visible to store owner */
const ConnectionDot: React.FC = () => {
  const { data, isError, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['backend-health'],
    queryFn: authApi.checkHealth,
    refetchInterval: 30000,
    retry: 1,
  });

  const isOk = !isError && data?.status === 'ok';

  return (
    <button
      onClick={() => refetch()}
      title={isOk ? 'النظام يعمل بشكل طبيعي' : 'تعذر الاتصال — انقر للمحاولة مجدداً'}
      className="flex items-center gap-1.5 text-xs"
    >
      {isLoading || isFetching ? (
        <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
      ) : isOk ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
      ) : (
        <XCircle className="w-3.5 h-3.5 text-rose-400" />
      )}
    </button>
  );
};

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
}) => {
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Right side — store identity */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 leading-tight">الأصيل للمنظفات</h2>
            <p className="text-[10px] text-slate-400">نظام إدارة المحل</p>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-brand-400" />
          <span>
            {currentTime.toLocaleTimeString('ar-SA', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>

      {/* Left side — user info + status dot + logout */}
      <div className="flex items-center gap-3">
        <ConnectionDot />

        <div className="flex items-center gap-3 pl-2 border-r border-slate-800 mr-2 pr-2">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-bold text-slate-200 leading-tight">{user?.name}</p>
            <span className="text-[10px] text-brand-400 font-medium capitalize">
              {user?.role === 'admin' ? 'مدير المحل' : user?.role === 'manager' ? 'مشرف' : 'كاشير'}
            </span>
          </div>

          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 text-slate-950 flex items-center justify-center font-bold text-xs shadow-md shadow-brand-500/20">
            {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            title="تسجيل الخروج"
            className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 p-2 rounded-xl"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};
