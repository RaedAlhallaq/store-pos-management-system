import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../../products/api/productsApi';
import { StockAdjustmentModal } from '../../products/components/StockAdjustmentModal';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Pagination } from '../../../components/ui/Pagination';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import {
  PackageCheck,
  TrendingUp,
  History,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  DollarSign,
  Boxes,
} from 'lucide-react';
import type { Product, StockMovement } from '../../products/types/productTypes';

export const InventoryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [selectedType, setSelectedType] = useState<string>('');
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);

  // Queries
  const { data: movementsData, isLoading: isMovementsLoading } = useQuery({
    queryKey: ['stock-movements', { page, type: selectedType }],
    queryFn: () => productsApi.getStockMovements({ page, type: selectedType || undefined, per_page: 15 }),
  });

  const { data: metrics } = useQuery({
    queryKey: ['products-metrics'],
    queryFn: () => productsApi.getMetrics(),
  });

  const { data: productsData } = useQuery({
    queryKey: ['all-products-select'],
    queryFn: () => productsApi.getProducts({ per_page: 100 }),
  });

  const adjustStockMutation = useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: number;
      data: { type: string; quantity: number; notes?: string };
    }) => productsApi.adjustStock(productId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-metrics'] });
    },
  });

  const getTypeBadge = (type: StockMovement['type']) => {
    switch (type) {
      case 'initial':
        return <Badge variant="info">رصيد افتتاحي</Badge>;
      case 'purchase':
        return <Badge variant="success">توريد مشتريات (+)</Badge>;
      case 'sale':
        return <Badge variant="neutral">مبيعات كاشير (-)</Badge>;
      case 'damage':
        return <Badge variant="danger">تالف ومنتهي (-)</Badge>;
      case 'adjustment':
        return <Badge variant="warning">تسوية جردية</Badge>;
      case 'sale_return':
        return <Badge variant="info">مرتجع مبيعات (+)</Badge>;
      case 'purchase_return':
        return <Badge variant="danger">مرتجع لمورد (-)</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <PackageCheck className="w-6 h-6 text-brand-400" />
            <span>المخزون وحركة المواد</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            مراقبة أرصدة المستودع، تقييم رأس المال المخزني، وسجل التدقيق التفصيلي للحركات
          </p>
        </div>

        {/* Quick adjustment trigger */}
        <div>
          {productsData?.data && productsData.data.length > 0 && (
            <Button
              onClick={() => setAdjustingProduct(productsData.data[0])}
              rightIcon={<PackageCheck className="w-4 h-4" />}
            >
              إجراء تسوية مخزون
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">إجمالي قطع المخزون</p>
              <p className="text-xl font-bold text-slate-100 font-mono mt-1">
                {(metrics?.total_quantity ?? 0).toLocaleString('en-US', { maximumFractionDigits: 3 })}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">في جميع الأصناف المسجلة</p>
            </div>
            <div className="p-3 rounded-2xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">قيمة المخزون (بالتكلفة)</p>
              <p className="text-xl font-bold text-emerald-400 font-mono mt-1">
                {(metrics?.total_cost_value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} ₪
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">رأس المال المحجوز في البضاعة</p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">القيمة التقديرية بالبيع</p>
              <p className="text-xl font-bold text-sky-400 font-mono mt-1">
                {(metrics?.total_retail_value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} ₪
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">إجمالي الإيراد المتوقع</p>
            </div>
            <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/80 border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400">أصناف تحت حد الطلب</p>
              <p className="text-xl font-bold text-amber-400 font-mono mt-1">
                {metrics?.low_stock_count ?? 0} صنف
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">بحاجة لإعادة الشراء والتوريد</p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Stock Movements Filter */}
      <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <History className="w-4 h-4 text-brand-400" />
          <span>سجل حركات المخزون والتدقيق (Stock Movement Ledger)</span>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPage(1);
            }}
            className="bg-slate-950/90 text-slate-200 border border-slate-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          >
            <option value="">جميع أنواع الحركات</option>
            <option value="initial">أرصدة افتتاحية</option>
            <option value="purchase">توريد مشتريات</option>
            <option value="sale">مبيعات نقاط البيع</option>
            <option value="damage">تالف ومنتهي الصلاحية</option>
            <option value="adjustment">تسويات جردية</option>
            <option value="sale_return">مرتجع مبيعات</option>
            <option value="purchase_return">مرتجع مشتريات</option>
          </select>
        </div>
      </div>

      {/* Stock Movements Ledger Table */}
      <Card className="overflow-hidden border-slate-800 bg-slate-900/70">
        {isMovementsLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <LoadingSpinner size="lg" />
            <span className="text-xs text-slate-400">جارِ تحميل حركات المخزون...</span>
          </div>
        ) : !movementsData?.data || movementsData.data.length === 0 ? (
          <EmptyState
            title="لا توجد حركات مخزون مسجلة"
            description="ستظهر هنا كافة حركات البيع، الشراء، التسويات، والأرصدة الافتتاحية للمنتجات"
          />
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold select-none">
                    <th className="py-3.5 px-4">التاريخ والوقت</th>
                    <th className="py-3.5 px-4">الصنف</th>
                    <th className="py-3.5 px-4">نوع الحركة</th>
                    <th className="py-3.5 px-4">الكمية (+ / -)</th>
                    <th className="py-3.5 px-4">الرصيد قبل</th>
                    <th className="py-3.5 px-4">الرصيد بعد</th>
                    <th className="py-3.5 px-4">المستخدم / البيان</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {movementsData.data.map((movement) => {
                    const qty = Number(movement.quantity);
                    const isPositive = qty > 0;

                    return (
                      <tr key={movement.id} className="hover:bg-slate-850/50 transition-colors">
                        {/* Timestamp */}
                        <td className="py-3.5 px-4 font-mono text-slate-400">
                          {movement.created_at
                            ? new Date(movement.created_at).toLocaleString('ar-SA', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : '—'}
                        </td>

                        {/* Product */}
                        <td className="py-3.5 px-4">
                          <div>
                            <span className="font-bold text-slate-100 block">
                              {movement.product_name || 'صنف غير معرف'}
                            </span>
                            {movement.product_barcode && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                {movement.product_barcode}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Type */}
                        <td className="py-3.5 px-4">{getTypeBadge(movement.type)}</td>

                        {/* Quantity */}
                        <td className="py-3.5 px-4 font-mono font-bold">
                          <span
                            className={`inline-flex items-center gap-1 ${
                              isPositive ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isPositive ? (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDownRight className="w-3.5 h-3.5" />
                            )}
                            <span>{isPositive ? `+${qty}` : qty}</span>
                          </span>
                        </td>

                        {/* Balance Before */}
                        <td className="py-3.5 px-4 font-mono text-slate-400 font-semibold">
                          {movement.balance_before}
                        </td>

                        {/* Balance After */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-100">
                          {movement.balance_after}
                        </td>

                        {/* User & Notes */}
                        <td className="py-3.5 px-4">
                          <div>
                            <span className="text-slate-300 font-medium block">
                              {movement.user_name || 'النظام'}
                            </span>
                            {movement.notes && (
                              <span className="text-[11px] text-slate-500 truncate max-w-xs block">
                                {movement.notes}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {movementsData.meta && (
              <div className="px-4 border-t border-slate-800">
                <Pagination
                  currentPage={movementsData.meta.current_page}
                  lastPage={movementsData.meta.last_page}
                  total={movementsData.meta.total}
                  from={movementsData.meta.from ?? 1}
                  to={movementsData.meta.to ?? movementsData.meta.total}
                  onPageChange={(p) => setPage(p)}
                />
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Stock Adjustment Modal */}
      {adjustingProduct && (
        <StockAdjustmentModal
          isOpen={!!adjustingProduct}
          onClose={() => setAdjustingProduct(null)}
          product={adjustingProduct}
          onAdjust={async (productId, data) => {
            await adjustStockMutation.mutateAsync({ productId, data });
          }}
        />
      )}
    </div>
  );
};
