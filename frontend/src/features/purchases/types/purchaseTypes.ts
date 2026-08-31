import type { Supplier } from '../../suppliers/types/supplierTypes';
import type { Product } from '../../products/types/productTypes';

export interface PurchaseItem {
  id?: number;
  product_id: number;
  product_name?: string;
  unit_cost: number;
  selling_price?: number;
  quantity: number;
  tax_percent: number;
  tax_amount?: number;
  subtotal?: number;
}

export interface PurchasePayment {
  id?: number;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'credit';
  amount: number;
  reference_number?: string;
  created_at?: string;
}

export interface Purchase {
  id: number;
  purchase_number: string;
  invoice_number?: string;
  supplier_id?: number;
  supplier?: Supplier;
  user_id: number;
  purchaser_name?: string;
  subtotal: string;
  tax_amount: string;
  discount_amount: string;
  grand_total: string;
  paid_amount: string;
  due_amount: string;
  payment_status: 'paid' | 'partial' | 'due';
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'credit' | 'multiple';
  purchase_status: 'received' | 'pending' | 'cancelled';
  invoice_date?: string;
  notes?: string;
  items_count?: number;
  items?: {
    id: number;
    purchase_id: number;
    product_id: number;
    product_name: string;
    unit_cost: string;
    quantity: string;
    tax_percent: string;
    tax_amount: string;
    subtotal: string;
    product?: Product;
  }[];
  payments?: PurchasePayment[];
  created_at: string;
  formatted_date?: string;
}

export interface CreatePurchasePayload {
  supplier_id?: number | null;
  supplier_invoice_number?: string;
  discount_amount?: number;
  invoice_date?: string;
  notes?: string;
  items: {
    product_id: number;
    quantity: number;
    unit_cost: number;
    selling_price?: number;
    tax_percent?: number;
  }[];
  payments: {
    payment_method: 'cash' | 'card' | 'bank_transfer' | 'credit';
    amount: number;
    reference_number?: string;
  }[];
}
