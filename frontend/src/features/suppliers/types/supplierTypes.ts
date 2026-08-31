export interface Supplier {
  id: number;
  name: string;
  company_name?: string;
  phone?: string;
  email?: string;
  tax_number?: string;
  address?: string;
  bank_name?: string;
  bank_iban?: string;
  current_balance: string;
  has_debt?: boolean;
  notes?: string;
  is_active: boolean;
  created_at?: string;
}

export interface SupplierTransaction {
  id: number;
  supplier_id: number;
  user_id?: number;
  type: 'purchase_credit' | 'payment' | 'return' | 'opening_balance' | 'adjustment';
  amount: string;
  balance_before: string;
  balance_after: string;
  notes?: string;
  created_at: string;
}
