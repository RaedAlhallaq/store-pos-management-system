export interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  tax_number?: string;
  address?: string;
  credit_limit: string;
  current_balance: string;
  has_debt?: boolean;
  notes?: string;
  is_active: boolean;
  created_at?: string;
}

export interface CustomerTransaction {
  id: number;
  customer_id: number;
  user_id?: number;
  type: 'sale_credit' | 'payment' | 'return' | 'opening_balance' | 'adjustment';
  amount: string;
  balance_before: string;
  balance_after: string;
  notes?: string;
  created_at: string;
}
