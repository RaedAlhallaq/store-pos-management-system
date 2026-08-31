import { useState } from 'react';
import { cashSessionApi } from '../api/cashSessionApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

export default function OpenSessionModal({ isOpen, onClose, onSuccess }: Props) {
  const [openingCash, setOpeningCash] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(openingCash);
    if (isNaN(amount) || amount < 0) {
      setError('يرجى إدخال مبلغ افتتاحي صحيح');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await cashSessionApi.openSession({ opening_cash: amount, notes: notes || undefined });
      onSuccess();
      onClose();
      setOpeningCash('');
      setNotes('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'حدث خطأ أثناء فتح الجلسة');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">فتح جلسة الصندوق</h2>
              <p className="text-sm text-gray-400">أدخل الرصيد الافتتاحي للوردية</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">الرصيد الافتتاحي (₪)</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                placeholder="0.00"
                className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white text-xl font-bold text-center placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors"
                autoFocus
              />
            </div>
          </div>

          {/* Quick Amounts */}
          <div>
            <p className="text-xs text-gray-500 mb-2">مبالغ سريعة</p>
            <div className="grid grid-cols-5 gap-2">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setOpeningCash(String(amt))}
                  className="py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 text-sm hover:bg-emerald-600 hover:border-emerald-500 hover:text-white transition-all"
                >
                  {amt}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">ملاحظات (اختياري)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="ملاحظات الوردية أو الكاشير..."
              className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  فتح الجلسة
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
