import { useCallback, useEffect, useRef, useState } from 'react';
import { settingsApi } from '../api/settingsApi';
import { Store, Phone, MapPin, Coins, Download, Upload, CheckCircle2, AlertTriangle, Save } from 'lucide-react';

export default function SettingsPage() {
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState('');
  const fileRef = useRef(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try { const data = await settingsApi.getSettings(); setForm(data); }
    catch (e) { console.error('Failed to load settings', e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setSaved(false);
    try { const updated = await settingsApi.updateSettings(form); setForm(updated); setSaved(true); setTimeout(() => setSaved(false), 3000); }
    catch (e) { console.error('Failed to save', e); }
    finally { setSaving(false); }
  };

  const handleExport = async () => { setExporting(true); try { settingsApi.exportBackup(); } finally { setTimeout(() => setExporting(false), 2000); } };

  const handleRestore = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!confirm('هل أنت متأكد من استعادة النسخة الاحتياطية؟')) return;
    setRestoring(true); setRestoreMsg('');
    try { const result = await settingsApi.restoreBackup(file); setRestoreMsg(result.message); }
    catch (err) { setRestoreMsg(err?.message || 'حدث خطأ'); }
    finally { setRestoring(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  if (loading) return <div className="flex items-center justify-center h-64" dir="rtl"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6" dir="rtl">
      <div><h1 className="text-2xl font-bold text-white">إعدادات المحل</h1><p className="text-gray-400 text-sm mt-1">بيانات المحل الأساسية والنسخ الاحتياطي</p></div>
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-gray-700 flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center"><Store className="w-4 h-4 text-brand-400" /></div><h2 className="text-base font-bold text-white">البيانات الأساسية</h2></div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-400 mb-1.5">اسم المحل</label><input type="text" value={form.store_name ?? ''} onChange={(e) => setForm((f) => ({ ...f, store_name: e.target.value }))} placeholder="الأصيل للمنظفات" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-500" /></div>
            <div><label className="block text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-sky-400" /><span>الهاتف</span></label><input type="text" value={form.phone ?? ''} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-500" /></div>
            <div><label className="block text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1.5"><Coins className="w-3.5 h-3.5 text-amber-400" /><span>العملة</span></label><input type="text" value={form.currency_symbol ?? '₪'} onChange={(e) => setForm((f) => ({ ...f, currency_symbol: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-500" /></div>
            <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-emerald-400" /><span>العنوان</span></label><input type="text" value={form.address ?? ''} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-500" /></div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="px-8 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold disabled:opacity-50 flex items-center gap-2">{saving ? <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" /> : <Save className="w-4 h-4" />}حفظ</button>
          {saved && <span className="text-emerald-400 text-sm font-medium flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />تم الحفظ</span>}
        </div>
      </form>

      <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-gray-700 flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center"><Coins className="w-4 h-4 text-amber-400" /></div><h2 className="text-base font-bold text-white">النسخ الاحتياطي</h2></div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center"><Download className="w-5 h-5 text-emerald-400" /></div><div><p className="text-white font-bold text-sm">تصدير نسخة احتياطية</p><p className="text-gray-400 text-xs">تنزيل ملف البيانات</p></div></div>
            <button onClick={handleExport} disabled={exporting} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm disabled:opacity-50">{exporting ? '...' : 'تنزيل النسخة الاحتياطية (.json)'}</button>
          </div>
          <div className="bg-gray-800 rounded-xl p-5 border border-red-900/30">
            <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-400" /></div><div><p className="text-white font-bold text-sm">استعادة نسخة</p><p className="text-red-400 text-xs">⚠️ الكتابة فوق البيانات الحالية</p></div></div>
            <input ref={fileRef} type="file" accept=".json" onChange={handleRestore} className="hidden" />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={restoring} className="w-full py-3 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-sm disabled:opacity-50">{restoring ? '...' : 'رفع ملف للاستعادة'}</button>
            {restoreMsg && <p className={`mt-3 text-sm text-center ${restoreMsg.includes('نجاح') ? 'text-emerald-400' : 'text-red-400'}`}>{restoreMsg}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
