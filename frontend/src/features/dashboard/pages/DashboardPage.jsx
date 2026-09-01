import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { settingsApi } from '../../settings/api/settingsApi';
import {
  AlertTriangle,
  Banknote,
  Boxes,
  ChevronLeft,
  CreditCard,
  DollarSign,
  LockKeyhole,
  Package,
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
import { posApi } from '../../pos/api/posApi';
import { cashSessionApi } from '../../daily-closing/api/cashSessionApi';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { fmtLocale } from '../../../lib/utils';

const fmt = fmtLocale;

function SkeletonCard() {
  return (
    <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2.5 flex-1">
          <div className="h-3 w-20 bg-slate-800 rounded" />
          <div className="h-6 w-28 bg-slate-800 rounded" />
          <div className="h-2.5 w-16 bg-slate-800 rounded" />
        </div>
        <div className="w-11 h-11 rounded-2xl bg-slate-800" />
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between py-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-800" />
        <div className="space-y-1.5">
          <div className="h-3 w-24 bg-slate-800 rounded" />
          <div className="h-2.5 w-16 bg-slate-800 rounded" />
        </div>
      </div>
      <div className="h-3 w-14 bg-slate-800 rounded" />
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({});
  const [storeName, setStoreName] = useState('نظام إدارة المحل');

  useEffect(() => {
    settingsApi.getSettings().then((s) => setStoreName(s.store_name || 'نظام إدارة المحل')).catch(() => {});
  }, []);

  useEffect(() => {
    let isCurrent = true;

    const requests = [
      ['todayReport', () => reportsApi.getProfitLoss({ date_from: today, date_to: today })],
      ['productMetrics', () => productsApi.getMetrics()],
      ['customersData', () => customersApi.getCustomers({ per_page: 200 })],
      ['suppliersData', () => suppliersApi.getSuppliers({ per_page: 200 })],
      ['todayPurchases', () => purchasesApi.getPurchases({ date_from: today, date_to: today, per_page: 200 })],
      ['todayExpenses', () => expensesApi.getExpenses({ date_from: today, date_to: today, per_page: 200 })],
      ['recentSales', () => posApi.getSales({ per_page: 5 })],
      ['activeSession', () => cashSessionApi.getActiveSession()],
      ['lowStockProducts', () => productsApi.getProducts({ stock_status: 'low', per_page: 10 })],
    ];

    Promise.allSettled(requests.map(([, fn]) => fn())).then((results) => {
      if (!isCurrent) return;
      const next = {};
      results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          next[requests[i][0]] = result.value;
        }
      });
      setDashboardData(next);
      setIsLoading(false);
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
    recentSales,
    activeSession,
    lowStockProducts,
  } = dashboardData;

  const totalCustomerDebt =
    customersData?.data?.reduce((sum, customer) => sum + Number.parseFloat(customer.current_balance || '0'), 0) ?? 0;
  const totalSupplierPayables =
    suppliersData?.data?.reduce((sum, supplier) => sum + Number.parseFloat(supplier.current_balance || '0'), 0) ?? 0;
  const todayPurchasesTotal =
    todayPurchases?.data?.reduce((sum, purchase) => sum + Number.parseFloat(purchase.grand_total || '0'), 0) ?? 0;
  const todayExpensesTotal =
    todayExpenses?.data?.reduce((sum, expense) => sum + Number.parseFloat(expense.amount || '0'), 0) ?? 0;
  const lowStockCount = lowStockProducts?.data?.length ?? 0;

  const stats = [
    { title: 'مبيعات اليوم', value: `${fmt(todayReport?.total_revenue ?? 0)} ₪`, subtext: `${todayReport?.sales_count ?? 0} فاتورة`, icon: DollarSign, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/20', to: '/sales' },
    { title: 'مشتريات اليوم', value: `${fmt(todayPurchasesTotal)} ₪`, subtext: `${todayPurchases?.data?.length ?? 0} فاتورة شراء`, icon: ShoppingBag, color: 'text-blue-400', bgColor: 'bg-blue-500/10 border-blue-500/20', to: '/purchases' },
    { title: 'مصروفات اليوم', value: `${fmt(todayExpensesTotal)} ₪`, subtext: `${todayExpenses?.data?.length ?? 0} عملية`, icon: CreditCard, color: 'text-rose-400', bgColor: 'bg-rose-500/10 border-rose-500/20', to: '/expenses' },
    { title: 'صافي الربح اليوم', value: `${fmt(todayReport?.net_profit ?? 0)} ₪`, subtext: `هامش ${todayReport?.net_margin_percent ?? 0}%`, icon: TrendingUp, color: 'text-indigo-400', bgColor: 'bg-indigo-500/10 border-indigo-500/20', to: '/reports' },
    { title: 'ديون العملاء', value: `${fmt(totalCustomerDebt)} ₪`, subtext: `${customersData?.data?.filter((c) => Number.parseFloat(c.current_balance || '0') > 0).length ?? 0} عميل عليه رصيد`, icon: Users, color: 'text-sky-400', bgColor: 'bg-sky-500/10 border-sky-500/20', to: '/customers' },
    { title: 'مستحقات الموردين', value: `${fmt(totalSupplierPayables)} ₪`, subtext: `${suppliersData?.data?.filter((s) => Number.parseFloat(s.current_balance || '0') > 0).length ?? 0} مورد لديه رصيد`, icon: Truck, color: 'text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/20', to: '/suppliers' },
    { title: 'المنتجات في المخزون', value: `${productMetrics?.total_products ?? 0} صنف`, subtext: lowStockCount > 0 ? `${lowStockCount} صنف مخزونه منخفض` : 'المخزون في مستوى جيد', icon: Boxes, color: 'text-brand-400', bgColor: 'bg-brand-500/10 border-brand-500/20', to: '/products' },
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
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100">مرحباً، {user?.name || 'مدير المحل'} 👋</h1>
            <p className="text-sm text-slate-400 mt-1">
              {storeName} — {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <Link to="/pos">
            <Button size="lg" rightIcon={<ShoppingCart className="w-4 h-4" />}>فتح نقطة البيع</Button>
          </Link>
        </div>
      </div>

      {/* Cash Session Status */}
      {!isLoading && (
        <Link to="/daily-closing" className="block group">
          <Card hoverEffect className={`group-hover:border-brand-500/30 transition-colors ${activeSession ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent' : 'border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl border ${activeSession ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-200">
                      {activeSession ? 'الصندوق مفتوح' : 'الصندوق مغلق'}
                    </p>
                    {activeSession && <Badge variant="success" size="sm">مفتوح</Badge>}
                    {!activeSession && <Badge variant="warning" size="sm">مغلق</Badge>}
                  </div>
                  {activeSession ? (
                    <p className="text-xs text-slate-400 mt-0.5">
                      رصيد الافتتاح: {activeSession.opening_cash} ₪ — الكاشير: {activeSession.cashier_name}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 mt-0.5">
                      افتح جلسة صندوق لبدء تسجيل المبيعات
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {activeSession && (
                  <div className="text-left hidden sm:block">
                    <p className="text-xs text-slate-500">المبيعات النقدية</p>
                    <p className="text-sm font-bold text-emerald-400 font-mono">{activeSession.total_sales_cash} ₪</p>
                  </div>
                )}
                <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-brand-400 transition-colors" />
              </div>
            </div>
          </Card>
        </Link>
      )}

      {/* Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.title} to={stat.to} className="block group">
                <Card hoverEffect className="relative overflow-hidden group-hover:border-brand-500/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-400">{stat.title}</p>
                      <p className="text-xl font-bold text-slate-100 mt-1 font-mono">{stat.value}</p>
                      <p className="text-[11px] text-slate-500 mt-1">{stat.subtext}</p>
                    </div>
                    <div className={`p-3 rounded-2xl border ${stat.bgColor} ${stat.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Bottom Row: Recent Sales + Low Stock + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales */}
        <div className="lg:col-span-1">
          <h2 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">آخر المبيعات</h2>
          <Card className="p-0 overflow-hidden">
            {isLoading ? (
              <div className="p-4 space-y-0 divide-y divide-slate-800/60">
                {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
              </div>
            ) : !recentSales?.data || recentSales.data.length === 0 ? (
              <div className="p-8 text-center">
                <ShoppingCart className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-500">لا توجد مبيعات بعد</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {recentSales.data.map((sale) => (
                  <Link
                    key={sale.id}
                    to="/sales"
                    className="flex items-center justify-between px-4 py-3 hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-200 truncate">
                          {sale.invoice_number}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {sale.customer?.name || 'عميل نقدي'}
                        </p>
                      </div>
                    </div>
                    <div className="text-left shrink-0 mr-3">
                      <p className="text-xs font-bold text-slate-200 font-mono">{Number(sale.grand_total).toFixed(2)} ₪</p>
                      <p className="text-[10px] text-slate-500">
                        {sale.created_at ? new Date(sale.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Low Stock Alerts */}
        <div className="lg:col-span-1">
          <h2 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">تنبيهات المخزون</h2>
          <Card className="p-0 overflow-hidden">
            {isLoading ? (
              <div className="p-4 space-y-0 divide-y divide-slate-800/60">
                {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
              </div>
            ) : lowStockCount === 0 ? (
              <div className="p-8 text-center">
                <Package className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-500">جميع المنتجات في مستوى جيد</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {lowStockProducts.data.map((product) => (
                  <Link
                    key={product.id}
                    to="/products"
                    className="flex items-center justify-between px-4 py-3 hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-200 truncate">{product.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {product.category?.name || 'بدون تصنيف'}
                        </p>
                      </div>
                    </div>
                    <div className="text-left shrink-0 mr-3">
                      <Badge
                        variant={Number(product.stock_quantity) <= 0 ? 'danger' : 'warning'}
                        size="sm"
                      >
                        {Number(product.stock_quantity) <= 0 ? 'نفد' : `${product.stock_quantity} متبقي`}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <h2 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">العمليات السريعة</h2>
          <Card className="p-4">
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.title}
                    to={action.to}
                    className={
                      action.primary
                        ? 'col-span-2 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-brand-500 hover:bg-brand-600 text-slate-950 transition-colors shadow-lg shadow-brand-500/20'
                        : 'flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors'
                    }
                  >
                    <Icon className="w-4 h-4" />
                    {action.title}
                  </Link>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
