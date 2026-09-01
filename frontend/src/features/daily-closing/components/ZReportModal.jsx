import { useEffect, useState } from 'react';
import { settingsApi } from '../../settings/api/settingsApi';
import { fmtFixed } from '../../../lib/utils';

const fmt = fmtFixed;

export default function ZReportModal({ isOpen, zReport, onClose }) {
  const [storeName, setStoreName] = useState('الأصيل للمنظفات');

  useEffect(() => {
    if (isOpen) {
      settingsApi.getSettings().then((s) => setStoreName(s.store_name || 'الأصيل للمنظفات')).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatDate = (iso) => { if (!iso) return '—'; return new Date(iso).toLocaleString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }); };
  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col" style={{ fontFamily: 'monospace' }}>
        <div className="flex items-center justify-between p-4 bg-slate-900 rounded-t-2xl print:hidden">
          <h2 className="text-white font-bold">تقرير الإغلاق اليومي</h2>
          <div className="flex gap-2"><button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold">طباعة</button><button onClick={onClose} className="text-slate-400 hover:text-white px-2">✕</button></div>
        </div>
        <div className="overflow-y-auto flex-1 p-6 text-slate-900 text-sm leading-relaxed">
          <div className="text-center border-b-2 border-dashed border-slate-400 pb-3 mb-3"><p className="font-bold text-lg">{storeName}</p><p className="text-xs text-slate-600">تقرير الإغلاق اليومي</p></div>
          <div className="space-y-1 border-b border-dashed border-slate-300 pb-3 mb-3">
            <div className="flex justify-between"><span>الكاشير:</span><span className="font-bold">{zReport.cashier_name ?? '—'}</span></div>
            <div className="flex justify-between"><span>الفتح:</span><span>{formatDate(zReport.opened_at)}</span></div>
            <div className="flex justify-between"><span>الإقفال:</span><span>{formatDate(zReport.closed_at)}</span></div>
            {zReport.duration_hours && <div className="flex justify-between"><span>المدة:</span><span>{zReport.duration_hours} ساعة</span></div>}
          </div>
          <div className="space-y-1 border-b border-dashed border-slate-300 pb-3 mb-3">
            <p className="font-bold text-center text-xs text-slate-500">ملخص المبيعات</p>
            <div className="flex justify-between"><span>الفواتير:</span><span className="font-bold">{zReport.sales_count}</span></div>
            <div className="flex justify-between"><span>إجمالي المبيعات:</span><span className="font-bold">{fmt(zReport.total_sales)} ₪</span></div>
            <div className="flex justify-between text-slate-600"><span>نقداً:</span><span>{fmt(zReport.total_sales_cash)} ₪</span></div>
            <div className="flex justify-between text-slate-600"><span>بطاقة:</span><span>{fmt(zReport.total_sales_card)} ₪</span></div>
            <div className="flex justify-between text-slate-600"><span>آجل:</span><span>{fmt(zReport.total_sales_credit)} ₪</span></div>
          </div>
          <div className="space-y-1 border-b-2 border-dashed border-slate-400 pb-3 mb-3">
            <p className="font-bold text-center text-xs text-slate-500">نتيجة الجرد</p>
            <div className="flex justify-between font-bold"><span>المتوقع:</span><span>{fmt(zReport.closing_cash_expected)} ₪</span></div>
            <div className="flex justify-between font-bold"><span>الفعلي:</span><span>{fmt(zReport.closing_cash_actual)} ₪</span></div>
            <div className={`flex justify-between font-bold text-base pt-1 ${zReport.variance_status === 'balanced' ? 'text-emerald-700' : zReport.variance_status === 'surplus' ? 'text-brand-700' : 'text-rose-700'}`}><span>الفرق:</span><span>{zReport.difference > 0 ? '+' : ''}{fmt(zReport.difference)} ₪</span></div>
          </div>
          <div className="text-center text-xs text-slate-500 mt-3"><p>نهاية التقرير</p></div>
        </div>
      </div>
    </div>
  );
}
