import { useState } from 'react';
import { cashSessionApi } from '../api/cashSessionApi';
import type { CashSession, ZReportData } from '../types/cashSessionTypes';
import ZReportModal from './ZReportModal';

interface Props {
  isOpen: boolean;
  session: CashSession;
  onClose: () => void;
  onSuccess: () => void;
}

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000, 2000];

export default function CloseSessionModal({ isOpen, session, onClose, onSuccess }: Props) {
  const [actualCash, setActualCash] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [zReport, setZReport] = useState<ZReportData | null>(null);

  const totalCashIn = session.movements?.filter((m) => m.type === 'in').reduce((s, m) => s + parseFloat(m.amount), 0) ?? 0;
  const totalCashOut = session.movements?.filter((m) => m.type === 'out').reduce((s, m) => s + parseFloat(m.amount), 0) ?? 0;
  const expectedCash =
    parseFloat(session.opening_cash) +
    parseFloat(session.total_sales_cash) +
    totalCashIn -
    totalCashOut -
    parseFloat(session.total_expenses_cash);

  const enteredActual = parseFloat(actualCash) || 0;
  const variance = enteredActual - expectedCash;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(enteredActual) || enteredActual < 0) {
      setError('يرجى إدخال المبلغ الفعلي في الصندوق');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const result = await cashSessionApi.closeSession(session.id, {
        closing_cash_actual: enteredActual,
        notes: notes || undefined,
      });
      setZReport(result.z_report);
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'حدث خطأ أثناء إقفال الجلسة');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (zReport) {
    return <ZReportModal isOpen={true} zReport={zReport} onClose={() => { setZReport(null); onClose(); }} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">إقفال جلسة الصندوق</h2>
              <p className="text-sm text-gray-400">إجراء جرد نهاية الوردية وإصدار تقرير الإغلاق</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Expected Summary */}
          <div className="bg-gray-800 rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">ملخص الصندوق المتوقع</h3>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">الرصيد الافتتاحي</span>
              <span className="text-white font-medium">{parseFloat(session.opening_cash).toFixed(2)} ₪</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">مبيعات نقدية</span>
              <span className="text-emerald-400 font-medium">+ {parseFloat(session.total_sales_cash).toFixed(2)} ₪</span>
            </div>
            {totalCashIn > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">إيداعات نقدية</span>
                <span className="text-blue-400 font-medium">+ {totalCashIn.toFixed(2)} ₪</span>
              </div>
            )}
            {totalCashOut > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">سحوبات نقدية</span>
                <span className="text-orange-400 font-medium">- {totalCashOut.toFixed(2)} ₪</span>
              </div>
            )}
            {parseFloat(session.total_expenses_cash) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">مصروفات نقدية</span>
                <span className="text-red-400 font-medium">- {parseFloat(session.total_expenses_cash).toFixed(2)} ₪</span>
              </div>
            )}
            <div className="pt-2 border-t border-gray-700 flex justify-between font-bold">
              <span className="text-gray-300">المتوقع في الصندوق</span>
              <span className="text-white text-lg">{expectedCash.toFixed(2)} ₪</span>
            </div>
          </div>

          {/* Actual Cash Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">المبلغ الفعلي في الصندوق (₪)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={actualCash}
              onChange={(e) => setActualCash(e.target.value)}
              placeholder="0.00"
              className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white text-xl font-bold text-center placeholder-gray-600 focus:outline-none focus:border-amber-500 transition-colors"
              autoFocus
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setActualCash(String(amt))}
                  className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 text-sm hover:bg-amber-600 hover:border-amber-500 hover:text-white transition-all"
                >
                  {amt}
                </button>
              ))}
            </div>
          </div>

          {/* Variance Preview */}
          {actualCash && (
            <div className={`rounded-xl p-4 border ${
              variance === 0
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : variance > 0
                  ? 'bg-blue-500/10 border-blue-500/30'
                  : 'bg-red-500/10 border-red-500/30'
            }`}>
              <div className="flex justify-between items-center">
                <span className="text-gray-300 font-medium">الفرق (العجز/الزيادة)</span>
                <span className={`text-xl font-bold ${
                  variance === 0 ? 'text-emerald-400' : variance > 0 ? 'text-blue-400' : 'text-red-400'
                }`}>
                  {variance > 0 ? '+' : ''}{variance.toFixed(2)} ₪
                </span>
              </div>
              <p className="text-xs mt-1 text-gray-500">
                {variance === 0 ? '✓ الصندوق متطابق' : variance > 0 ? '▲ زيادة في الصندوق' : '▼ عجز في الصندوق'}
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">ملاحظات الإقفال (اختياري)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="تعليقات على نهاية الوردية..."
              className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition-colors resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors">
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  إقفال الصندوق وإصدار التقرير
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
