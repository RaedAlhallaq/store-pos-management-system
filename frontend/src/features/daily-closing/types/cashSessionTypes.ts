export interface CashMovement {
  id: number;
  cash_session_id: number;
  user_id: number;
  type: 'in' | 'out';
  amount: string;
  reason: string;
  notes?: string;
  created_at: string;
}

export interface CashSession {
  id: number;
  user_id: number;
  cashier_name?: string;
  opening_cash: string;
  closing_cash_expected?: string;
  closing_cash_actual?: string;
  difference_amount?: string;
  total_sales_cash: string;
  total_sales_card: string;
  total_sales_credit: string;
  total_expenses_cash: string;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at?: string;
  notes?: string;
  movements?: CashMovement[];
  created_at: string;
}

export interface ZReportData {
  session_id: number;
  cashier_name?: string;
  status: 'open' | 'closed';
  opened_at?: string;
  closed_at?: string;
  duration_hours?: number;
  opening_cash: number;
  total_sales: number;
  sales_count: number;
  total_sales_cash: number;
  total_sales_card: number;
  total_sales_credit: number;
  total_tax: number;
  total_discounts: number;
  total_expenses: number;
  total_cash_in: number;
  total_cash_out: number;
  closing_cash_expected: number;
  closing_cash_actual: number;
  difference: number;
  variance_status: 'balanced' | 'surplus' | 'deficit';
  movements?: CashMovement[];
}
