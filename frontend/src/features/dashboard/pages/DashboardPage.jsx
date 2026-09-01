import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes,
  CreditCard,
  DollarSign,
  LockKeyhole,
  Plus,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import { reportsApi } from '../../reports/api/reportsApi';
import { productsApi } from '../../products/api/productsApi';
import { customersApi } from '../../customers/api/customersApi';
import { suppliersApi } from '../../suppliers/api/suppliersApi';
import { purchasesApi } from '../../purchases/api/purchasesApi';
import { expensesApi } from '../../expenses/api/expensesApi';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

const fmt = (value) =>
  Number.parseFloat(String(value || 0)).toLocaleString('ar-SA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export function DashboardPage() {
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const [dashboardData, setDashboardData] = useState({});

  useEffect(() => {
    let isCurrent = true;

    const requests = [
      ['todayReport', () => reportsApi.getProfitLoss({ date_from: today, date_to: today })],
      ['productMetrics', () => productsApi.getMetrics()],
      ['customersData', () => customersApi.getCustomers({ per_page: 200 })],
      ['suppliersData', () => suppliersApi.getSuppliers({ per_page: 200 })],
      ['todayPurchases', () => purchasesApi.getPurchases({ date_from: today, date_to: today, per_page: 200 })],
      ['todayExpenses', () => expensesApi.getExpenses({ date_from: today, date_to: today, per_page: 200 })],
    ];

    requests.forEach(([key, request]) => {
      request()
        .then((data) => {
          if (isCurrent) {
            setDashboardData((current) => ({ ...current, [key]: data }));
          }
        })
        .catch(() => {
          // The previous query implementation left unavailable metrics at their zero-value display.
        });
    });

    return () => {
      isCurrent = false;
    };
  }, [today]);

  const {
    todayReport,
    productMetrics,
    customersData,
    suppliersData,
    todayPurchases,
    todayExpenses,
  } = dashboardData;

  const totalCustomerDebt =
    customersData?.data?.reduce((sum, customer) => sum + Number.parseFloat(customer.current_balance || '0'), 0) ?? 0;
  const totalSupplierPayables =
    suppliersData?.data?.reduce((sum, supplier) => sum + Number.parseFloat(supplier.current_balance || '0'), 0) ?? 0;
  const todayPurchasesTotal =
    todayPurchases?.data?.reduce((sum, purchase) => sum + Number.parseFloat(purchase.grand_total || '0'), 0) ?? 0;
  const todayExpensesTotal =
    todayExpenses?.data?.reduce((sum, expense) => sum + Number.parseFloat(expense.amount || '0'), 0) ?? 0;

  const stats = [
    { title: 'مبيعات اليوم', value: `${fmt(todayReport?.total_revenue ?? 0)} ₪`, subtext: `${todayReport?.sales_count ?? 0} فاتورة`, icon: DollarSign, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/20', to: '/sales' },
    { title: 'مشتريات اليوم', value: `${fmt(todayPurchasesTotal)} ₪`, subtext: `${todayPurchases?.data?.length ?? 0} فاتورة شراء`, icon: ShoppingBag, color: 'text-blue-400', bgColor: 'bg-blue-500/10 border-blue-500/20', to: '/purchases' },
    { title: 'مصروفات اليوم', value: `${fmt(todayExpensesTotal)} ₪`, subtext: `${todayExpenses?.data?.length ?? 0} عملية`, icon: CreditCard, color: 'text-rose-400', bgColor: 'bg-rose-500/10 border-rose-500/20', to: '/expenses' },
    { title: 'صافي الربح اليوم', value: `${fmt(todayReport?.net_profit ?? 0)} ₪`, subtext: `هامش ${todayReport?.net_margin_percent ?? 0}%`, icon: TrendingUp, color: 'text-indigo-400', bgColor: 'bg-indigo-500/10 border-indigo-500/20', to: '/reports' },
    { title: 'ديون العملاء', value: `${fmt(totalCustomerDebt)} ₪`, subtext: `${customersData?.data?.filter((customer) => Number.parseFloat(customer.current_balance || '0') > 0).length ?? 0} عميل عليه رصيد`, icon: Users, color: 'text-sky-400', bgColor: 'bg-sky-500/10 border-sky-500/20', to: '/customers' },
    { title: 'مستحقات الموردين', value: `${fmt(totalSupplierPayables)} ₪`, subtext: `${suppliersData?.data?.filter((supplier) => Number.parseFloat(supplier.current_balance || '0') > 0).length ?? 0} مورد لديه رصيد`, icon: Truck, color: 'text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/20', to: '/suppliers' },
    { title: 'المنتجات في المخزون', value: `${productMetrics?.total_products ?? 0} صنف`, subtext: productMetrics?.low_stock_count && productMetrics.low_stock_count > 0 ? `⚠ ${productMetrics.low_stock_count} صنف مخزونه منخفض` : 'المخزون في مستوى جيد', icon: Boxes, color: 'text-brand-400', bgColor: 'bg-brand-500/10 border-brand-500/20', to: '/products' },
  ];

  const quickActions = [
    { title: 'بيع جديد', icon: ShoppingCart, to: '/pos', primary: true },
    { title: 'إضافة منتج', icon: Plus, to: '/products' },
    { title: 'إضافة مشتريات', icon: ShoppingBag, to: '/purchases' },
    { title: 'إضافة عميل', icon: Users, to: '/customers' },
    { title: 'إضافة مورد', icon: Truck, to: '/suppliers' },
    { title: 'تسجيل مصروف', icon: CreditCard, to: '/expenses' },
    { title: 'الصندوق والإغلاق', icon: LockKeyhole, to: '/daily-closing' },
  ];

  return (
    <div className="space-y-6" dir="rtl">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100">مرحباً، {user?.name || 'مدير المحل'} 👋</h1>
            <p className="text-sm text-slate-400 mt-1">الأصيل للمنظفات — {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <Link to="/pos"><Button size="lg" rightIcon={<ShoppingCart className="w-4 h-4" />}>فتح نقطة البيع</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return <Link key={stat.title} to={stat.to} className="block group"><Card hoverEffect className="relative overflow-hidden group-hover:border-brand-500/30 transition-colors"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-slate-400">{stat.title}</p><p className="text-xl font-bold text-slate-100 mt-1 font-mono">{stat.value}</p><p className="text-[11px] text-slate-500 mt-1">{stat.subtext}</p></div><div className={`p-3 rounded-2xl border ${stat.bgColor} ${stat.color}`}><Icon className="w-5 h-5" /></div></div></Card></Link>;
        })}
      </div>

      <div>
        <h2 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">العمليات السريعة</h2>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return <Link key={action.title} to={action.to}><button className={action.primary ? 'flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-brand-500 hover:bg-brand-600 text-slate-950 transition-colors shadow-lg shadow-brand-500/20' : 'flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors'}><Icon className="w-4 h-4" />{action.title}</button></Link>;
          })}
        </div>
      </div>
    </div>
  );
}
