export interface ProfitLossReport {
  period: {
    date_from: string;
    date_to: string;
  };
  sales_count: number;
  total_revenue: number;
  subtotal_before_tax: number;
  total_tax_collected: number;
  total_discounts_given: number;
  cost_of_goods_sold: number;
  gross_profit: number;
  gross_margin_percent: number;
  total_operating_expenses: number;
  net_profit: number;
  net_margin_percent: number;
}

export interface SalesTaxReport {
  total_sales: number;
  taxable_amount: number;
  tax_amount: number;
  discount_amount: number;
  payments_breakdown: {
    cash: number;
    card: number;
    credit: number;
  };
}

export interface TopProductItem {
  product_id: number;
  product_name: string;
  total_quantity: string;
  total_revenue: string;
  total_profit: string;
}
