import { useState } from 'react';
import { cashSessionApi } from '../api/cashSessionApi';

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

export default function OpenSessionModal({ isOpen, onClose, onSuccess }) {
  const [openingCash, setOpeningCash] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(openingCash);
    if (isNaN(amount) || amount < 0) { setError('يرجى إدخال مبلغ افتتاحي صحيح'); return; }
    try {
      setLoading(true); setError('');
      await cashSessionApi.openSession({ opening_cash: amount, notes: notes || undefined });
      onSuccess(); onClose(); setOpeningCash(''); setNotes('');
    } catch (err) { setError(err?.message || 'حدث خطأ أثناء فتح الجلسة'); }
    finally { setLoading(false); }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div><h2 className="text-lg font-bold text-white">فتح جلسة الصندوق</h2><p className="text-sm text-slate-400">أدخل الرصيد الافتتاحي للوردية</p></div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div><label className="block text-sm font-medium text-slate-300 mb-2">الرصيد الافتتاحي (₪)</label><input type="number" min="0" step="0.01" value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} placeholder="0.00" className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-xl font-bold text-center placeholder-slate-600 focus:outline-none focus:border-emerald-500" autoFocus /></div>
          <div><p className="text-xs text-slate-500 mb-2">مبالغ سريعة</p><div className="grid grid-cols-5 gap-2">{QUICK_AMOUNTS.map((amt) => <button key={amt} type="button" onClick={() => setOpeningCash(String(amt))} className="py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm hover:bg-emerald-600 hover:text-white transition-all">{amt}</button>)}</div></div>
          <div><label className="block text-sm font-medium text-slate-300 mb-2">ملاحظات (اختياري)</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="ملاحظات..." className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 resize-none" /></div>
          {error && <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-rose-400 text-sm text-center">{error}</div>}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800">إلغاء</button>
            <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold disabled:opacity-50">{loading ? '...' : 'فتح الجلسة'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
