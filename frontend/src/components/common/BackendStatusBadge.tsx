import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../features/auth/api/authApi';
import { Database, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

export const BackendStatusBadge: React.FC<{ showDetails?: boolean }> = ({ showDetails = false }) => {
  const { data, isError, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['backend-health'],
    queryFn: authApi.checkHealth,
    refetchInterval: 15000, // check every 15s
    retry: 1,
  });

  const isConnected = !isError && data?.status === 'ok' && data?.database?.status === 'connected';

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-md transition-all',
          isConnected
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
            : isLoading
            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
        )}
      >
        <span className="relative flex h-2 w-2">
          {isConnected && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={cn(
              'relative inline-flex rounded-full h-2 w-2',
              isConnected ? 'bg-emerald-500' : isLoading ? 'bg-amber-500' : 'bg-rose-500'
            )}
          />
        </span>

        <span className="flex items-center gap-1.5">
          {isConnected ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>الخادم متصل (Backend Live)</span>
              {data?.database?.latency_ms && (
                <span className="text-[10px] text-emerald-400/80 font-mono">
                  {data.database.latency_ms}ms
                </span>
              )}
            </>
          ) : isLoading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span>جارِ الفحص...</span>
            </>
          ) : (
            <>
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>الخادم غير متصل (Offline)</span>
            </>
          )}
        </span>

        <button
          onClick={() => refetch()}
          title="إعادة فحص الاتصال"
          className="hover:text-white p-0.5 rounded transition-colors"
        >
          <RefreshCw className={cn('w-3 h-3', isFetching && 'animate-spin')} />
        </button>
      </div>

      {showDetails && isConnected && data && (
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-full">
          <Database className="w-3 h-3 text-brand-400" />
          <span>قاعدة البيانات: {data.database.connection}</span>
        </div>
      )}
    </div>
  );
};
