import { useCallback, useEffect, useState } from 'react';
import { cashSessionApi } from '../api/cashSessionApi';
import type { CashSession, ZReportData } from '../types/cashSessionTypes';
import OpenSessionModal from '../components/OpenSessionModal';
import CloseSessionModal from '../components/CloseSessionModal';
import CashMovementModal from '../components/CashMovementModal';
import ZReportModal from '../components/ZReportModal';

const fmt = (n: string | number) => parseFloat(String(n)).toFixed(2);

export default function DailyClosingPage() {
  const [activeSession, setActiveSession] = useState<CashSession | null>(null);
  const [sessions, setSessions] = useState<CashSession[]>([]);
  const [loading, setLoading] = useState(true);

  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [viewZReport, setViewZReport] = useState<ZReportData | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [active, history] = await Promise.all([
        cashSessionApi.getActiveSession(),
        cashSessionApi.getSessions({ per_page: 20 }),
      ]);
      setActiveSession(active);
      setSessions(history.data ?? []);
    } catch (e) {
      console.error('Failed to load sessions', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleViewZReport = async (sessionId: number) => {
    try {
      const report = await cashSessionApi.getZReport(sessionId);
      setViewZReport(report);
    } catch (e) {
      console.error('Failed to load Z-Report', e);
    }
  };

  const statusBadge = (status: string) =>
    status === 'open'
      ? <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">مفتوح</span>
      : <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-600/30 text-gray-400 border border-gray-600/30">مغلق</span>;

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">الصندوق والإغلاق اليومي</h1>
          <p className="text-gray-400 text-sm mt-1">إدارة جلسات الصندوق والورديات وتقارير الإغلاق</p>
        </div>
        <div className="flex gap-3">
          {activeSession ? (
            <>
              <button
                onClick={() => setShowMovementModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                حركة نقدية
              </button>
              <button
                onClick={() => setShowCloseModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                إقفال الصندوق
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowOpenModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              فتح جلسة جديدة
            </button>
          )}
        </div>
      </div>

      {/* Active Session Card */}
      {activeSession && (
        <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/20 border border-emerald-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-lg font-bold text-emerald-300">جلسة صندوق مفتوحة الآن</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'رصيد الافتتاح', value: `${fmt(activeSession.opening_cash)} ₪`, color: 'text-white' },
              { label: 'مبيعات نقدية', value: `${fmt(activeSession.total_sales_cash)} ₪`, color: 'text-emerald-400' },
              { label: 'مبيعات بطاقة', value: `${fmt(activeSession.total_sales_card)} ₪`, color: 'text-blue-400' },
              { label: 'مصروفات نقدية', value: `${fmt(activeSession.total_expenses_cash)} ₪`, color: 'text-red-400' },
            ].map((item) => (
              <div key={item.label} className="bg-black/20 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                <p className={`font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-500">
            وقت الفتح: {new Date(activeSession.opened_at).toLocaleString('ar-SA')} — الكاشير: {activeSession.cashier_name}
          </div>
        </div>
      )}

      {/* No Active Session */}
      {!activeSession && !loading && (
        <div className="bg-gray-800/50 border border-dashed border-gray-600 rounded-2xl p-10 text-center">
          <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-gray-400 text-lg font-medium">لا توجد جلسة صندوق مفتوحة</p>
          <p className="text-gray-500 text-sm mt-1 mb-4">افتح جلسة جديدة لبدء تسجيل المبيعات والمصروفات</p>
          <button
            onClick={() => setShowOpenModal(true)}
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors"
          >
            فتح جلسة صندوق
          </button>
        </div>
      )}

      {/* Sessions History */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-gray-700">
          <h3 className="text-base font-bold text-white">سجل جلسات الصندوق</h3>
        </div>
        {loading ? (
          <div className="p-10 text-center text-gray-500">جاري التحميل...</div>
        ) : sessions.length === 0 ? (
          <div className="p-10 text-center text-gray-500">لا توجد جلسات سابقة</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-xs">
                  <th className="py-3 px-4 text-right font-medium">الكاشير</th>
                  <th className="py-3 px-4 text-right font-medium">وقت الفتح</th>
                  <th className="py-3 px-4 text-right font-medium">وقت الإقفال</th>
                  <th className="py-3 px-4 text-center font-medium">الحالة</th>
                  <th className="py-3 px-4 text-left font-medium">إجمالي المبيعات</th>
                  <th className="py-3 px-4 text-left font-medium">الفرق</th>
                  <th className="py-3 px-4 text-center font-medium">تقرير الإغلاق</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 px-4 text-white font-medium">{s.cashier_name}</td>
                    <td className="py-3 px-4 text-gray-400">
                      {new Date(s.opened_at).toLocaleString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 text-gray-400">
                      {s.closed_at
                        ? new Date(s.closed_at).toLocaleString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">{statusBadge(s.status)}</td>
                    <td className="py-3 px-4 text-right text-white font-mono">
                      {(parseFloat(s.total_sales_cash) + parseFloat(s.total_sales_card) + parseFloat(s.total_sales_credit)).toFixed(2)} ₪
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {s.difference_amount != null ? (
                        <span className={parseFloat(s.difference_amount) === 0 ? 'text-emerald-400' : parseFloat(s.difference_amount) > 0 ? 'text-blue-400' : 'text-red-400'}>
                          {parseFloat(s.difference_amount) > 0 ? '+' : ''}{parseFloat(s.difference_amount).toFixed(2)} ₪
                        </span>
                      ) : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleViewZReport(s.id)}
                        className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs transition-colors"
                      >
                        عرض
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <OpenSessionModal isOpen={showOpenModal} onClose={() => setShowOpenModal(false)} onSuccess={loadData} />
      {activeSession && (
        <>
          <CashMovementModal
            isOpen={showMovementModal}
            session={activeSession}
            onClose={() => setShowMovementModal(false)}
            onSuccess={loadData}
          />
          <CloseSessionModal
            isOpen={showCloseModal}
            session={activeSession}
            onClose={() => setShowCloseModal(false)}
            onSuccess={loadData}
          />
        </>
      )}
      {viewZReport && (
        <ZReportModal isOpen={true} zReport={viewZReport} onClose={() => setViewZReport(null)} />
      )}
    </div>
  );
}
