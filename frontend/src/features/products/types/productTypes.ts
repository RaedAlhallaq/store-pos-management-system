export interface Category {
  id: number;
  name: string;
  code?: string;
  description?: string;
  is_active: boolean;
  products_count?: number;
  created_at?: string;
}

export interface Unit {
  id: number;
  name: string;
  short_name: string;
  allow_decimal: boolean;
  created_at?: string;
}

export interface Product {
  id: number;
  name: string;
  barcode?: string;
  sku?: string;
  category_id?: number;
  unit_id?: number;
  category?: Category;
  unit?: Unit;
  cost_price: string;
  selling_price: string;
  tax_percent: string;
  stock_quantity: string;
  min_stock_alert: string;
  is_low_stock?: boolean;
  is_out_of_stock?: boolean;
  profit_margin?: string;
  profit_percentage?: number;
  image?: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StockMovement {
  id: number;
  product_id: number;
  product_name?: string;
  product_barcode?: string;
  user_id?: number;
  user_name?: string;
  type: 'sale' | 'purchase' | 'sale_return' | 'purchase_return' | 'adjustment' | 'damage' | 'initial';
  quantity: string;
  unit_cost?: string;
  balance_before: string;
  balance_after: string;
  reference_type?: string;
  reference_id?: number;
  notes?: string;
  created_at?: string;
}

export interface InventoryMetrics {
  total_products: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_quantity: number;
  total_cost_value: number;
  total_retail_value: number;
  potential_profit: number;
}

export interface ProductFilters {
  search?: string;
  category_id?: number | string;
  stock_status?: 'all' | 'low' | 'out' | 'in_stock';
  is_active?: boolean;
  page?: number;
  per_page?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number | null;
    last_page: number;
    path: string;
    per_page: number;
    to: number | null;
    total: number;
  };
}
