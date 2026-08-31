<?php

namespace App\Services;

use App\Models\Expense;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Support\Facades\DB;

class ReportService
{
    /**
     * Get Profit and Loss (Income Statement) report.
     */
    public function getProfitLossReport(?string $dateFrom = null, ?string $dateTo = null): array
    {
        $salesQuery = Sale::where('invoice_status', 'completed');
        $saleItemsQuery = SaleItem::whereHas('sale', function ($q) {
            $q->where('invoice_status', 'completed');
        });
        $expensesQuery = Expense::query();

        if ($dateFrom) {
            $salesQuery->whereDate('created_at', '>=', $dateFrom);
            $saleItemsQuery->whereDate('created_at', '>=', $dateFrom);
            $expensesQuery->whereDate('expense_date', '>=', $dateFrom);
        }

        if ($dateTo) {
            $salesQuery->whereDate('created_at', '<=', $dateTo);
            $saleItemsQuery->whereDate('created_at', '<=', $dateTo);
            $expensesQuery->whereDate('expense_date', '<=', $dateTo);
        }

        $totalSalesCount = $salesQuery->count();
        $totalRevenue = (float) $salesQuery->sum('grand_total');
        $totalTaxCollected = (float) $salesQuery->sum('tax_amount');
        $totalDiscountsGiven = (float) $salesQuery->sum('discount_amount');
        $subtotalBeforeTax = (float) $salesQuery->sum('subtotal');

        // Calculate Cost of Goods Sold (COGS)
        $cogs = (float) $saleItemsQuery->sum(DB::raw('quantity * unit_cost'));

        // Gross Profit = Subtotal (Revenue excluding tax) - COGS
        $grossProfit = round($subtotalBeforeTax - $cogs, 2);
        $grossMarginPercent = $subtotalBeforeTax > 0 ? round(($grossProfit / $subtotalBeforeTax) * 100, 2) : 0.0;

        // Operating Expenses
        $totalExpenses = (float) $expensesQuery->sum('amount');

        // Net Profit = Gross Profit - Operating Expenses
        $netProfit = round($grossProfit - $totalExpenses, 2);
        $netMarginPercent = $subtotalBeforeTax > 0 ? round(($netProfit / $subtotalBeforeTax) * 100, 2) : 0.0;

        return [
            'period' => [
                'date_from' => $dateFrom ?: 'بداية النشاط',
                'date_to' => $dateTo ?: now()->toDateString(),
            ],
            'sales_count' => $totalSalesCount,
            'total_revenue' => $totalRevenue,
            'subtotal_before_tax' => $subtotalBeforeTax,
            'total_tax_collected' => $totalTaxCollected,
            'total_discounts_given' => $totalDiscountsGiven,
            'cost_of_goods_sold' => $cogs,
            'gross_profit' => $grossProfit,
            'gross_margin_percent' => $grossMarginPercent,
            'total_operating_expenses' => $totalExpenses,
            'net_profit' => $netProfit,
            'net_margin_percent' => $netMarginPercent,
        ];
    }

    /**
     * Get Sales & Tax Report breakdown.
     */
    public function getSalesTaxReport(?string $dateFrom = null, ?string $dateTo = null): array
    {
        $salesQuery = Sale::where('invoice_status', 'completed');

        if ($dateFrom) {
            $salesQuery->whereDate('created_at', '>=', $dateFrom);
        }
        if ($dateTo) {
            $salesQuery->whereDate('created_at', '<=', $dateTo);
        }

        $totalSales = (float) (clone $salesQuery)->sum('grand_total');
        $taxableAmount = (float) (clone $salesQuery)->sum('subtotal');
        $taxAmount = (float) (clone $salesQuery)->sum('tax_amount');
        $discountAmount = (float) (clone $salesQuery)->sum('discount_amount');

        $cashSales = (float) \App\Models\SalePayment::where('payment_method', 'cash')
            ->whereHas('sale', function ($q) use ($dateFrom, $dateTo) {
                $q->where('invoice_status', 'completed');
                if ($dateFrom) $q->whereDate('created_at', '>=', $dateFrom);
                if ($dateTo) $q->whereDate('created_at', '<=', $dateTo);
            })->sum('amount');

        $cardSales = (float) \App\Models\SalePayment::where('payment_method', 'card')
            ->whereHas('sale', function ($q) use ($dateFrom, $dateTo) {
                $q->where('invoice_status', 'completed');
                if ($dateFrom) $q->whereDate('created_at', '>=', $dateFrom);
                if ($dateTo) $q->whereDate('created_at', '<=', $dateTo);
            })->sum('amount');

        $creditSales = (float) (clone $salesQuery)->sum('due_amount');

        return [
            'total_sales' => $totalSales,
            'taxable_amount' => $taxableAmount,
            'tax_amount' => $taxAmount,
            'discount_amount' => $discountAmount,
            'payments_breakdown' => [
                'cash' => $cashSales,
                'card' => $cardSales,
                'credit' => $creditSales,
            ],
        ];
    }

    /**
     * Get top selling products.
     */
    public function getTopProducts(int $limit = 10, ?string $dateFrom = null, ?string $dateTo = null): array
    {
        $query = SaleItem::select(
            'product_id',
            'product_name',
            DB::raw('SUM(quantity) as total_quantity'),
            DB::raw('SUM(subtotal) as total_revenue'),
            DB::raw('SUM(quantity * (unit_price - unit_cost)) as total_profit')
        )
        ->whereHas('sale', function ($q) use ($dateFrom, $dateTo) {
            $q->where('invoice_status', 'completed');
            if ($dateFrom) $q->whereDate('created_at', '>=', $dateFrom);
            if ($dateTo) $q->whereDate('created_at', '<=', $dateTo);
        })
        ->groupBy('product_id', 'product_name')
        ->orderByDesc('total_quantity')
        ->limit($limit);

        return $query->get()->toArray();
    }
}
