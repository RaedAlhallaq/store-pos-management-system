import type { Product } from '../../products/types/productTypes';
import type { Customer } from '../../customers/types/customerTypes';

export interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_percent: number;
  tax_amount: number;
  subtotal: number;
}

export interface PaymentItem {
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'credit';
  amount: number;
  reference_number?: string;
}

export interface CheckoutPayload {
  customer_id?: number | null;
  discount_amount?: number;
  notes?: string;
  items: {
    product_id: number;
    quantity: number;
    unit_price?: number;
    discount_amount?: number;
  }[];
  payments: {
    payment_method: 'cash' | 'card' | 'bank_transfer' | 'credit';
    amount: number;
    reference_number?: string;
  }[];
}

export interface SaleItemResponse {
  id: number;
  product_id: number;
  product_name: string;
  unit_cost: string;
  unit_price: string;
  quantity: string;
  tax_percent: string;
  tax_amount: string;
  discount_amount: string;
  subtotal: string;
}

export interface SalePaymentResponse {
  id: number;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'credit';
  amount: string;
  reference_number?: string;
  created_at: string;
}

export interface SaleResponse {
  id: number;
  invoice_number: string;
  user_id: number;
  cashier_name?: string;
  customer_id?: number;
  customer?: Customer;
  cash_session_id?: number;
  subtotal: string;
  tax_amount: string;
  discount_amount: string;
  grand_total: string;
  paid_amount: string;
  due_amount: string;
  payment_status: 'paid' | 'partial' | 'due';
  payment_method: 'cash' | 'card' | 'credit' | 'multiple';
  invoice_status: 'completed' | 'void' | 'returned';
  notes?: string;
  items_count?: number;
  items?: SaleItemResponse[];
  payments?: SalePaymentResponse[];
  created_at: string;
  formatted_date: string;
}

export interface HeldOrder {
  id: string;
  timestamp: string;
  customerName?: string;
  items: CartItem[];
  overallDiscount: number;
  total: number;
}
