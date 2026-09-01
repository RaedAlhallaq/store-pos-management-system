import { useState } from 'react';
import { cashSessionApi } from '../api/cashSessionApi';
import ZReportModal from './ZReportModal';

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000, 2000];

export default function CloseSessionModal({ isOpen, session, onClose, onSuccess }) {
  const [actualCash, setActualCash] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [zReport, setZReport] = useState(null);

  const totalCashIn = session.movements?.filter((m) => m.type === 'in').reduce((s, m) => s + parseFloat(m.amount), 0) ?? 0;
  const totalCashOut = session.movements?.filter((m) => m.type === 'out').reduce((s, m) => s + parseFloat(m.amount), 0) ?? 0;
  const expectedCash = parseFloat(session.opening_cash) + parseFloat(session.total_sales_cash) + totalCashIn - totalCashOut - parseFloat(session.total_expenses_cash || 0);
  const enteredActual = parseFloat(actualCash) || 0;
  const variance = enteredActual - expectedCash;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isNaN(enteredActual) || enteredActual < 0) { setError('يرجى إدخال المبلغ الفعلي'); return; }
    try {
      setLoading(true); setError('');
      const result = await cashSessionApi.closeSession(session.id, { closing_cash_actual: enteredActual, notes: notes || undefined });
      setZReport(result.z_report); onSuccess();
    } catch (err) { setError(err?.message || 'حدث خطأ أثناء الإقفال'); }
    finally { setLoading(false); }
  };

  if (!isOpen) return null;
  if (zReport) return <ZReportModal isOpen={true} zReport={zReport} onClose={() => { setZReport(null); onClose(); }} />;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-700"><div><h2 className="text-lg font-bold text-white">إقفال جلسة الصندوق</h2><p className="text-sm text-gray-400">إجراء جرد نهاية الوردية</p></div><button onClick={onClose} className="text-gray-400 hover:text-white">✕</button></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-gray-800 rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">ملخص الصندوق المتوقع</h3>
            <div className="flex justify-between text-sm"><span className="text-gray-400">رصيد الافتتاح</span><span className="text-white">{parseFloat(session.opening_cash).toFixed(2)} ₪</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-400">مبيعات نقدية</span><span className="text-emerald-400">+ {parseFloat(session.total_sales_cash).toFixed(2)} ₪</span></div>
            {parseFloat(session.total_expenses_cash || 0) > 0 && <div className="flex justify-between text-sm"><span className="text-gray-400">مصروفات</span><span className="text-red-400">- {parseFloat(session.total_expenses_cash).toFixed(2)} ₪</span></div>}
            <div className="pt-2 border-t border-gray-700 flex justify-between font-bold"><span className="text-gray-300">المتوقع</span><span className="text-white text-lg">{expectedCash.toFixed(2)} ₪</span></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-300 mb-2">المبلغ الفعلي (₪)</label><input type="number" min="0" step="0.01" value={actualCash} onChange={(e) => setActualCash(e.target.value)} placeholder="0.00" className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white text-xl font-bold text-center placeholder-gray-600 focus:outline-none focus:border-amber-500" autoFocus />
            <div className="flex flex-wrap gap-2 mt-2">{QUICK_AMOUNTS.map((amt) => <button key={amt} type="button" onClick={() => setActualCash(String(amt))} className="px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 text-sm hover:bg-amber-600 hover:text-white">{amt}</button>)}</div>
          </div>
          {actualCash && <div className={`rounded-xl p-4 border ${variance === 0 ? 'bg-emerald-500/10 border-emerald-500/30' : variance > 0 ? 'bg-blue-500/10 border-blue-500/30' : 'bg-red-500/10 border-red-500/30'}`}><div className="flex justify-between items-center"><span className="text-gray-300 font-medium">الفرق</span><span className={`text-xl font-bold ${variance === 0 ? 'text-emerald-400' : variance > 0 ? 'text-blue-400' : 'text-red-400'}`}>{variance > 0 ? '+' : ''}{variance.toFixed(2)} ₪</span></div></div>}
          <div><label className="block text-sm font-medium text-gray-300 mb-2">ملاحظات (اختياري)</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 resize-none" /></div>
          {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm text-center">{error}</div>}
          <div className="flex gap-3"><button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800">إلغاء</button><button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold disabled:opacity-50">{loading ? '...' : 'إقفال الصندوق'}</button></div>
        </form>
      </div>
    </div>
  );
}
