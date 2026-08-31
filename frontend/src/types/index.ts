export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'cashier' | 'manager';
  status: 'active' | 'inactive';
  created_at: string;
}

export interface ApiHealthResponse {
  status: string;
  application: string;
  version: string;
  environment: string;
  database: {
    status: 'connected' | 'disconnected' | string;
    latency_ms: number | null;
    connection: string;
  };
  timestamp: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  user?: User;
  token?: string;
  errors?: Record<string, string[]>;
}
