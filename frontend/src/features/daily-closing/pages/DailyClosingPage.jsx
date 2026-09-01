import { useCallback, useEffect, useState } from 'react';
import { cashSessionApi } from '../api/cashSessionApi';
import OpenSessionModal from '../components/OpenSessionModal';
import CloseSessionModal from '../components/CloseSessionModal';
import CashMovementModal from '../components/CashMovementModal';
import ZReportModal from '../components/ZReportModal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import {
  Banknote,
  RefreshCw,
  Plus,
  LockKeyhole,
  AlertTriangle,
  DollarSign,
  CreditCard,
  Clock,
  TrendingDown,
  Wallet,
} from 'lucide-react';

export function DailyClosingPage() {
  const [activeSession, setActiveSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [viewZReport, setViewZReport] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [active, history] = await Promise.all([
        cashSessionApi.getActiveSession(),
        cashSessionApi.getSessions({ per_page: 50 }),
      ]);
      setActiveSession(active);
      setSessions(history.data ?? []);
    } catch (e) {
      setLoadError(e?.message || 'فشل تحميل بيانات الصندوق');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleViewZReport = async (sessionId) => {
    try {
      const report = await cashSessionApi.getZReport(sessionId);
      setViewZReport(report);
    } catch {
      // silent — ZReport is non-critical
    }
  };

  const fmt = (n) => parseFloat(String(n || 0)).toFixed(2);

  const sessionHistory = sessions.filter((s) => s.status === 'closed');
  const totalCashSales = sessions.reduce((sum, s) => sum + parseFloat(s.total_sales_cash || 0), 0);
  const totalCardSales = sessions.reduce((sum, s) => sum + parseFloat(s.total_sales_card || 0), 0);
  const totalSessions = sessions.length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <LockKeyhole className="w-6 h-6 text-brand-400" />
            <span>الصندوق والإغلاق اليومي</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            إدارة جلسات الصندوق والورديات وتقارير الإغلاق
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading} className="gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">تحديث</span>
          </Button>
          {activeSession ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setShowMovementModal(true)} className="gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                حركة نقدية
              </Button>
              <Button onClick={() => setShowCloseModal(true)} className="bg-amber-600 hover:bg-amber-500 text-white gap-1.5">
                <LockKeyhole className="w-4 h-4" />
                إقفال الصندوق
              </Button>
            </>
          ) : (
            <Button onClick={() => setShowOpenModal(true)} rightIcon={<Plus className="w-4 h-4" />}>
              فتح جلسة جديدة
            </Button>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      {!isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] md:text-xs font-semibold text-slate-400">إجمالي الجلسات</p>
                <p className="text-lg md:text-xl font-bold text-slate-100 font-mono mt-1">{totalSessions}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] md:text-xs font-semibold text-slate-400">الجلسات المغلقة</p>
                <p className="text-lg md:text-xl font-bold text-slate-300 font-mono mt-1">{sessionHistory.length}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-700/30 text-slate-400 border border-slate-700/50">
                <LockKeyhole className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] md:text-xs font-semibold text-slate-400">إجمالي المبيعات النقدية</p>
                <p className="text-lg md:text-xl font-bold text-emerald-400 font-mono mt-1">{fmt(totalCashSales)} ₪</p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Banknote className="w-5 h-5" />
              </div>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] md:text-xs font-semibold text-slate-400">إجمالي مبيعات البطاقة</p>
                <p className="text-lg md:text-xl font-bold text-sky-400 font-mono mt-1">{fmt(totalCardSales)} ₪</p>
              </div>
              <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {loadError && (
        <div className="bg-slate-900/70 border border-rose-500/30 rounded-2xl p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-200 mb-1">فشل تحميل البيانات</h3>
          <p className="text-sm text-slate-400 mb-4">{loadError}</p>
          <Button onClick={loadData} variant="outline" className="gap-1.5">
            <RefreshCw className="w-4 h-4" />
            إعادة المحاولة
          </Button>
        </div>
      )}

      {/* Active Session Panel */}
      {isLoading ? (
        <div className="bg-gradient-to-br from-emerald-900/20 to-teal-900/10 border border-emerald-500/20 rounded-2xl p-6 animate-pulse">
          <div className="flex items-center gap-3 mb-4"><div className="w-3 h-3 rounded-full bg-slate-700" /><div className="h-5 bg-slate-700 rounded w-48" /></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-black/20 rounded-xl p-3"><div className="h-3 bg-slate-700 rounded w-16 mb-2" /><div className="h-5 bg-slate-700 rounded w-20" /></div>
            ))}
          </div>
        </div>
      ) : activeSession ? (
        <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/15 border border-emerald-500/30 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-base font-bold text-emerald-300">جلسة صندوق مفتوحة الآن</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'رصيد الافتتاح', value: `${fmt(activeSession.opening_cash)} ₪`, color: 'text-white', icon: Banknote },
              { label: 'مبيعات نقدية', value: `${fmt(activeSession.total_sales_cash)} ₪`, color: 'text-emerald-400', icon: DollarSign },
              { label: 'مبيعات بطاقة', value: `${fmt(activeSession.total_sales_card)} ₪`, color: 'text-sky-400', icon: CreditCard },
              { label: 'مصروفات نقدية', value: `${fmt(activeSession.total_expenses_cash)} ₪`, color: 'text-rose-400', icon: TrendingDown },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="bg-black/20 rounded-xl p-3 border border-emerald-500/10">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] text-slate-400">{item.label}</p>
                    <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                  </div>
                  <p className={`font-bold font-mono text-sm ${item.color}`}>{item.value}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />وقت الفتح: {new Date(activeSession.opened_at).toLocaleString('ar-SA')}</span>
            <span>الكاشير: {activeSession.cashier_name}</span>
          </div>
        </div>
      ) : !isLoading && !loadError ? (
        <div className="bg-slate-900/70 border border-dashed border-slate-700 rounded-2xl p-10 text-center">
          <div className="p-4 rounded-2xl bg-slate-800/80 text-slate-400 mx-auto w-fit mb-4 ring-1 ring-slate-700">
            <LockKeyhole className="w-8 h-8" />
          </div>
          <p className="text-slate-200 text-base font-bold">لا توجد جلسة صندوق مفتوحة</p>
          <p className="text-slate-500 text-sm mt-1 mb-4">افتح جلسة جديدة لبدء تسجيل المبيعات والمصروفات</p>
          <Button onClick={() => setShowOpenModal(true)} rightIcon={<Plus className="w-4 h-4" />}>
            فتح جلسة صندوق
          </Button>
        </div>
      ) : null}

      {/* Session History */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-400" />
            سجل جلسات الصندوق
          </h3>
        </div>
        {isLoading ? (
          <div className="divide-y divide-slate-800/50">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5 animate-pulse">
                <div className="h-4 bg-slate-800 rounded w-20" />
                <div className="h-4 bg-slate-800 rounded w-28" />
                <div className="h-4 bg-slate-800 rounded w-28" />
                <div className="h-5 bg-slate-800 rounded-full w-14" />
                <div className="h-4 bg-slate-800 rounded w-20" />
                <div className="h-6 bg-slate-800 rounded w-14" />
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            <Wallet className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-sm">لا توجد جلسات سابقة</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold select-none">
                    <th className="py-3 px-4 text-right">الكاشير</th>
                    <th className="py-3 px-4 text-right">الفتح</th>
                    <th className="py-3 px-4 text-right">الإقفال</th>
                    <th className="py-3 px-4 text-center">الحالة</th>
                    <th className="py-3 px-4 text-right">المبيعات</th>
                    <th className="py-3 px-4 text-center">التقرير</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {sessions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 text-slate-100 font-medium">{s.cashier_name}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {s.opened_at ? new Date(s.opened_at).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {s.closed_at ? new Date(s.closed_at).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {s.status === 'open' ? (
                          <Badge variant="success" size="sm">مفتوح</Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">مغلق</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-100 font-mono font-bold">
                        {(parseFloat(s.total_sales_cash || 0) + parseFloat(s.total_sales_card || 0) + parseFloat(s.total_sales_credit || 0)).toFixed(2)} ₪
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button variant="ghost" size="sm" onClick={() => handleViewZReport(s.id)} className="text-xs">
                          عرض
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-slate-800/60">
              {sessions.map((s) => (
                <div key={s.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100 text-sm">{s.cashier_name}</span>
                    {s.status === 'open' ? (
                      <Badge variant="success" size="sm">مفتوح</Badge>
                    ) : (
                      <Badge variant="neutral" size="sm">مغلق</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-slate-500">
                    <span>فتح: {s.opened_at ? new Date(s.opened_at).toLocaleString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                    {s.closed_at && <span>إقفال: {new Date(s.closed_at).toLocaleString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>}
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                    <span className="font-mono font-bold text-slate-100 text-sm">
                      {(parseFloat(s.total_sales_cash || 0) + parseFloat(s.total_sales_card || 0) + parseFloat(s.total_sales_credit || 0)).toFixed(2)} ₪
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => handleViewZReport(s.id)} className="text-xs">
                      عرض التقرير
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <OpenSessionModal isOpen={showOpenModal} onClose={() => setShowOpenModal(false)} onSuccess={loadData} />
      {activeSession && (
        <>
          <CashMovementModal isOpen={showMovementModal} session={activeSession} onClose={() => setShowMovementModal(false)} onSuccess={loadData} />
          <CloseSessionModal isOpen={showCloseModal} session={activeSession} onClose={() => setShowCloseModal(false)} onSuccess={loadData} />
        </>
      )}
      {viewZReport && <ZReportModal isOpen={true} zReport={viewZReport} onClose={() => setViewZReport(null)} />}
    </div>
  );
}
