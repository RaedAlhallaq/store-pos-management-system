import apiClient from '../../../services/apiClient';
import type { CreateExpensePayload, Expense, ExpenseCategory } from '../types/expenseTypes';
import type { PaginatedResponse } from '../../products/types/productTypes';

export const expensesApi = {
  getExpenses: async (params: {
    page?: number;
    search?: string;
    expense_category_id?: number | string;
    payment_method?: string;
    date_from?: string;
    date_to?: string;
    per_page?: number;
  } = {}): Promise<PaginatedResponse<Expense>> => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', String(params.page));
    if (params.search) searchParams.append('search', params.search);
    if (params.expense_category_id && params.expense_category_id !== 'all') {
      searchParams.append('expense_category_id', String(params.expense_category_id));
    }
    if (params.payment_method) searchParams.append('payment_method', params.payment_method);
    if (params.date_from) searchParams.append('date_from', params.date_from);
    if (params.date_to) searchParams.append('date_to', params.date_to);
    if (params.per_page) searchParams.append('per_page', String(params.per_page));

    const response = await apiClient.get<PaginatedResponse<Expense>>(`/expenses?${searchParams.toString()}`);
    return response.data;
  },

  createExpense: async (payload: CreateExpensePayload): Promise<Expense> => {
    const response = await apiClient.post<{ success: boolean; message: string; data: Expense }>('/expenses', payload);
    return response.data.data;
  },

  deleteExpense: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/expenses/${id}`);
    return response.data;
  },

  // Category endpoints
  getCategories: async (): Promise<ExpenseCategory[]> => {
    const response = await apiClient.get<{ success: boolean; data: ExpenseCategory[] }>('/expense-categories');
    return response.data.data;
  },

  createCategory: async (data: Partial<ExpenseCategory>): Promise<ExpenseCategory> => {
    const response = await apiClient.post<{ success: boolean; message: string; data: ExpenseCategory }>('/expense-categories', data);
    return response.data.data;
  },

  updateCategory: async (id: number, data: Partial<ExpenseCategory>): Promise<ExpenseCategory> => {
    const response = await apiClient.put<{ success: boolean; message: string; data: ExpenseCategory }>(`/expense-categories/${id}`, data);
    return response.data.data;
  },

  deleteCategory: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/expense-categories/${id}`);
    return response.data;
  },
};
