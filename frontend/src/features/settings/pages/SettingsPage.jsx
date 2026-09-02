import { useCallback, useEffect, useRef, useState } from 'react';
import { settingsApi } from '../api/settingsApi';
import { Button } from '../../../components/ui/Button';
import {
  Store,
  Phone,
  MapPin,
  Coins,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Save,
  RefreshCw,
  FileText,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';

export function SettingsPage() {
  const [form, setForm] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState('');
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const fileRef = useRef(null);
  const pendingFileRef = useRef(null);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await settingsApi.getSettings();
      setForm(data);
    } catch (e) {
      setLoadError(e?.message || 'فشل تحميل الإعدادات');
      toast.error('فشل تحميل الإعدادات');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const updated = await settingsApi.updateSettings(form);
      setForm(updated);
      setSaved(true);
      toast.success('تم حفظ الإعدادات بنجاح');
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || 'فشل حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      settingsApi.exportBackup();
      toast.success('جاري تنزيل النسخة الاحتياطية');
    } catch {
      toast.error('فشل تصدير النسخة الاحتياطية');
    } finally {
      setTimeout(() => setExporting(false), 2000);
    }
  };

  const handleRestoreClick = () => {
    fileRef.current?.click();
  };

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    pendingFileRef.current = file;
    setShowRestoreConfirm(true);
  };

  const confirmRestore = async () => {
    const file = pendingFileRef.current;
    if (!file) return;
    setRestoring(true);
    setRestoreMsg('');
    setShowRestoreConfirm(false);
    try {
      const result = await settingsApi.restoreBackup(file);
      setRestoreMsg(result.message);
      toast.success(result.message);
      await loadSettings();
    } catch (err) {
      setRestoreMsg(err?.message || 'حدث خطأ');
      toast.error(err?.message || 'فشل استعادة النسخة الاحتياطية');
    } finally {
      setRestoring(false);
      if (fileRef.current) fileRef.current.value = '';
      pendingFileRef.current = null;
    }
  };

  const updateField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6" dir="rtl">
        <div className="animate-pulse space-y-6">
          <div className="space-y-2"><div className="h-8 bg-slate-800 rounded w-48" /><div className="h-4 bg-slate-800 rounded w-72" /></div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="h-5 bg-slate-800 rounded w-32" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="space-y-2"><div className="h-3 bg-slate-800 rounded w-16" /><div className="h-10 bg-slate-800 rounded-xl" /></div>)}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="h-5 bg-slate-800 rounded w-32" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-32 bg-slate-800 rounded-xl" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Store className="w-6 h-6 text-brand-400" />
            <span>إعدادات المحل</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            البيانات الأساسية والنسخ الاحتياطي
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadSettings} disabled={isLoading} className="gap-1.5">
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">تحديث</span>
        </Button>
      </div>

      {/* Error State */}
      {loadError && (
        <div className="bg-slate-900/70 border border-rose-500/30 rounded-2xl p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-200 mb-1">فشل تحميل الإعدادات</h3>
          <p className="text-sm text-slate-400 mb-4">{loadError}</p>
          <Button onClick={loadSettings} variant="outline" className="gap-1.5">
            <RefreshCw className="w-4 h-4" />
            إعادة المحاولة
          </Button>
        </div>
      )}

      {/* Business Information */}
      <form onSubmit={handleSave} className="space-y-5">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
              <Store className="w-4 h-4 text-brand-400" />
            </div>
            <h2 className="text-base font-bold text-slate-100">البيانات الأساسية</h2>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">اسم المحل</label>
              <input
                type="text"
                value={form.store_name ?? ''}
                onChange={(e) => updateField('store_name', e.target.value)}
                placeholder="الأصيل للمنظفات"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-sky-400" />
                <span>الهاتف</span>
              </label>
              <input
                type="text"
                value={form.phone ?? ''}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="0551122334"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>البريد الإلكتروني</span>
              </label>
              <input
                type="email"
                value={form.email ?? ''}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="info@store.com"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>العملة</span>
              </label>
              <input
                type="text"
                value={form.currency_symbol ?? '₪'}
                onChange={(e) => updateField('currency_symbol', e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-colors"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>العنوان</span>
              </label>
              <input
                type="text"
                value={form.address ?? ''}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="شارع القدس الرئيسي"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Receipt Settings */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 flex items-center justify-center">
              <FileText className="w-4 h-4 text-sky-400" />
            </div>
            <h2 className="text-base font-bold text-slate-100">إعدادات الفاتورة</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">تذييل الفاتورة</label>
              <input
                type="text"
                value={form.receipt_footer ?? ''}
                onChange={(e) => updateField('receipt_footer', e.target.value)}
                placeholder="شكراً لزيارتكم"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">الاسم الرسمي للمؤسسة</label>
              <input
                type="text"
                value={form.company_name ?? ''}
                onChange={(e) => updateField('company_name', e.target.value)}
                placeholder="مؤسسة الأصيل للمنظفات"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3">
          <Button type="submit" isLoading={saving} rightIcon={<Save className="w-4 h-4" />}>
            حفظ الإعدادات
          </Button>
          {saved && (
            <span className="text-emerald-400 text-sm font-medium flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              تم الحفظ بنجاح
            </span>
          )}
        </div>
      </form>

      {/* Backup */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <h2 className="text-base font-bold text-slate-100">النسخ الاحتياطي</h2>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Export */}
          <div className="bg-slate-950/50 rounded-xl p-5 border border-slate-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Download className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-slate-100 font-bold text-sm">تصدير نسخة احتياطية</p>
                <p className="text-slate-500 text-xs">تنزيل ملف البيانات كاملاً</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleExport} disabled={exporting} isLoading={exporting} className="w-full">
              تنزيل النسخة الاحتياطية (.json)
            </Button>
          </div>

          {/* Import */}
          <div className="bg-slate-950/50 rounded-xl p-5 border border-rose-500/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <p className="text-slate-100 font-bold text-sm">استعادة نسخة</p>
                <p className="text-rose-400 text-xs">⚠️ الكتابة فوق البيانات الحالية</p>
              </div>
            </div>
            <input ref={fileRef} type="file" accept=".json" onChange={handleFileSelected} className="hidden" />
            <Button variant="outline" onClick={handleRestoreClick} disabled={restoring} isLoading={restoring} className="w-full border-rose-500/30 text-rose-400 hover:bg-rose-500/10">
              رفع ملف للاستعادة
            </Button>
            {restoreMsg && (
              <p className={`mt-2 text-sm text-center ${restoreMsg.includes('نجاح') ? 'text-emerald-400' : 'text-rose-400'}`}>
                {restoreMsg}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Restore Confirmation Modal */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">تأكيد استعادة النسخة الاحتياطية</h3>
                <p className="text-[11px] text-slate-400">سيتم حذف جميع البيانات الحالية</p>
              </div>
            </div>
            <p className="text-xs text-slate-300">
              سيتم استبدال جميع بيانات التطبيق (المبيعات، المنتجات، العملاء، الموردين، المصروفات، الإعدادات) بالبيانات الموجودة في الملف المرفوع. هذا الإجراء لا يمكن التراجع عنه.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => { setShowRestoreConfirm(false); pendingFileRef.current = null; }}>
                تراجع
              </Button>
              <Button size="sm" onClick={confirmRestore} className="bg-rose-600 hover:bg-rose-700 text-white">
                <Upload className="w-3.5 h-3.5 ms-1" />
                تأكيد الاستعادة
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
