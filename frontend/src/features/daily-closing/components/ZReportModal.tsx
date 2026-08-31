import type { ZReportData } from '../types/cashSessionTypes';

interface Props {
  isOpen: boolean;
  zReport: ZReportData;
  onClose: () => void;
}

const fmt = (n: number) => n.toFixed(2);

export default function ZReportModal({ isOpen, zReport, onClose }: Props) {
  if (!isOpen) return null;

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('ar-SA', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col" style={{ fontFamily: 'monospace' }}>
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 bg-gray-900 rounded-t-2xl print:hidden">
          <h2 className="text-white font-bold">تقرير الإغلاق اليومي</h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              طباعة
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white px-2">✕</button>
          </div>
        </div>

        {/* Report Content */}
        <div className="overflow-y-auto flex-1 p-6 print:p-2 text-gray-900 text-sm leading-relaxed">
          {/* Header */}
          <div className="text-center border-b-2 border-dashed border-gray-400 pb-3 mb-3">
            <p className="font-bold text-lg">الأصيل للمنظفات</p>
            <p className="text-xs text-gray-600">تقرير الإغلاق اليومي للوردية</p>
          </div>

          {/* Session Info */}
          <div className="space-y-1 border-b border-dashed border-gray-300 pb-3 mb-3">
            <div className="flex justify-between">
              <span>الكاشير:</span>
              <span className="font-bold">{zReport.cashier_name ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span>تاريخ الفتح:</span>
              <span>{formatDate(zReport.opened_at)}</span>
            </div>
            <div className="flex justify-between">
              <span>تاريخ الإقفال:</span>
              <span>{formatDate(zReport.closed_at)}</span>
            </div>
            {zReport.duration_hours && (
              <div className="flex justify-between">
                <span>مدة الوردية:</span>
                <span>{zReport.duration_hours} ساعة</span>
              </div>
            )}
          </div>

          {/* Sales Summary */}
          <div className="space-y-1 border-b border-dashed border-gray-300 pb-3 mb-3">
            <p className="font-bold text-center text-xs text-gray-500 uppercase">ملخص المبيعات</p>
            <div className="flex justify-between">
              <span>عدد الفواتير:</span>
              <span className="font-bold">{zReport.sales_count}</span>
            </div>
            <div className="flex justify-between">
              <span>إجمالي المبيعات:</span>
              <span className="font-bold">{fmt(zReport.total_sales)} ₪</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>  نقداً:</span>
              <span>{fmt(zReport.total_sales_cash)} ₪</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>  بطاقة:</span>
              <span>{fmt(zReport.total_sales_card)} ₪</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>  آجل:</span>
              <span>{fmt(zReport.total_sales_credit)} ₪</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>ضريبة القيمة المضافة:</span>
              <span>{fmt(zReport.total_tax)} ₪</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>إجمالي الخصومات:</span>
              <span>{fmt(zReport.total_discounts)} ₪</span>
            </div>
          </div>

          {/* Cash Flow */}
          <div className="space-y-1 border-b border-dashed border-gray-300 pb-3 mb-3">
            <p className="font-bold text-center text-xs text-gray-500 uppercase">حركة النقدية</p>
            <div className="flex justify-between">
              <span>رصيد افتتاحي:</span>
              <span>{fmt(zReport.opening_cash)} ₪</span>
            </div>
            <div className="flex justify-between">
              <span>إيداعات نقدية:</span>
              <span>+ {fmt(zReport.total_cash_in)} ₪</span>
            </div>
            <div className="flex justify-between">
              <span>سحوبات نقدية:</span>
              <span>- {fmt(zReport.total_cash_out)} ₪</span>
            </div>
            <div className="flex justify-between">
              <span>مصروفات نقدية:</span>
              <span>- {fmt(zReport.total_expenses)} ₪</span>
            </div>
          </div>

          {/* Variance */}
          <div className="space-y-1 border-b-2 border-dashed border-gray-400 pb-3 mb-3">
            <p className="font-bold text-center text-xs text-gray-500 uppercase">نتيجة الجرد</p>
            <div className="flex justify-between font-bold">
              <span>المتوقع في الصندوق:</span>
              <span>{fmt(zReport.closing_cash_expected)} ₪</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>الفعلي في الصندوق:</span>
              <span>{fmt(zReport.closing_cash_actual)} ₪</span>
            </div>
            <div className={`flex justify-between font-bold text-base pt-1 ${
              zReport.variance_status === 'balanced' ? 'text-emerald-700'
              : zReport.variance_status === 'surplus' ? 'text-blue-700' : 'text-red-700'
            }`}>
              <span>الفرق (عجز/زيادة):</span>
              <span>{zReport.difference > 0 ? '+' : ''}{fmt(zReport.difference)} ₪</span>
            </div>
            <div className="text-center mt-2 font-bold">
              {zReport.variance_status === 'balanced' && '✓ الصندوق متطابق'}
              {zReport.variance_status === 'surplus' && '▲ زيادة في الصندوق'}
              {zReport.variance_status === 'deficit' && '▼ عجز في الصندوق'}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 mt-3">
            <p>*** نهاية التقرير ***</p>
            <p>{new Date().toLocaleString('ar-SA')}</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .print-content, .print-content * { visibility: visible !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
