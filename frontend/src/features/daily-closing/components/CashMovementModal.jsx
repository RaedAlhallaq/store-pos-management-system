import { useState } from 'react';
import { cashSessionApi } from '../api/cashSessionApi';

const REASONS = { in: ['فكة نقدية', 'إيداع إضافي', 'تحصيل دين', 'أخرى'], out: ['نثريات', 'مصروف طارئ', 'سحب نقدي', 'صرف للمورد', 'أخرى'] };

export default function CashMovementModal({ isOpen, session, onClose, onSuccess }) {
  const [type, setType] = useState('in');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { setError('يرجى إدخال مبلغ صحيح'); return; }
    if (!reason.trim()) { setError('يرجى إدخال السبب'); return; }
    try {
      setLoading(true); setError('');
      await cashSessionApi.recordMovement(session.id, { type, amount: amt, reason, notes: notes || undefined });
      onSuccess(); onClose(); setAmount(''); setReason(''); setNotes('');
    } catch (err) { setError(err?.message || 'حدث خطأ'); }
    finally { setLoading(false); }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-700"><div><h2 className="text-lg font-bold text-white">حركة نقدية</h2><p className="text-sm text-slate-400">إيداع أو سحب من الصندوق</p></div><button onClick={onClose} className="text-slate-400 hover:text-white">✕</button></div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div><label className="block text-sm font-medium text-slate-300 mb-2">نوع الحركة</label><div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setType('in')} className={`py-3 rounded-xl font-bold border transition-all ${type === 'in' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>إيداع (داخل)</button>
            <button type="button" onClick={() => setType('out')} className={`py-3 rounded-xl font-bold border transition-all ${type === 'out' ? 'bg-rose-600 border-rose-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>سحب (خارج)</button>
          </div></div>
          <div><label className="block text-sm font-medium text-slate-300 mb-2">المبلغ (₪)</label><input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-xl font-bold text-center placeholder-slate-600 focus:outline-none focus:border-brand-500" autoFocus /></div>
          <div><label className="block text-sm font-medium text-slate-300 mb-2">السبب</label><div className="flex flex-wrap gap-2 mb-2">{REASONS[type].map((r) => <button key={r} type="button" onClick={() => setReason(r)} className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${reason === r ? 'bg-brand-600 border-brand-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}>{r}</button>)}</div><input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="أو اكتب السبب..." className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-brand-500" /></div>
          <div><label className="block text-sm font-medium text-slate-300 mb-2">ملاحظات (اختياري)</label><input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="تفاصيل..." className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-brand-500" /></div>
          {error && <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-rose-400 text-sm text-center">{error}</div>}
          <div className="flex gap-3"><button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800">إلغاء</button><button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold disabled:opacity-50">{loading ? '...' : 'تسجيل الحركة'}</button></div>
        </form>
      </div>
    </div>
  );
}
