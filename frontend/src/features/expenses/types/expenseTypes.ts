export interface ExpenseCategory {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  expenses_count?: number;
  created_at?: string;
}

export interface Expense {
  id: number;
  expense_number: string;
  expense_category_id: number;
  category?: ExpenseCategory;
  user_id: number;
  user_name?: string;
  cash_session_id?: number;
  description: string;
  title?: string;
  amount: string;
  tax_amount?: string;
  payment_method: 'cash' | 'card' | 'bank_transfer';
  expense_date: string;
  reference_number?: string;
  receipt_image?: string;
  created_at?: string;
}

export interface CreateExpensePayload {
  expense_category_id: number;
  description: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'bank_transfer';
  expense_date?: string;
  reference_number?: string;
  notes?: string;
}
