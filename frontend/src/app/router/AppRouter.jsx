import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { LoginPage } from '../../features/auth/pages/LoginPage';
import { DashboardPage } from '../../features/dashboard/pages/DashboardPage';
import { ProductsPage } from '../../features/products/pages/ProductsPage';
import { InventoryPage } from '../../features/inventory/pages/InventoryPage';
import { PosPage } from '../../features/pos/pages/PosPage';
import { SalesPage } from '../../features/sales/pages/SalesPage';
import { CustomersPage } from '../../features/customers/pages/CustomersPage';
import { SuppliersPage } from '../../features/suppliers/pages/SuppliersPage';
import { PurchasesPage } from '../../features/purchases/pages/PurchasesPage';
import { ExpensesPage } from '../../features/expenses/pages/ExpensesPage';
import DailyClosingPage from '../../features/daily-closing/pages/DailyClosingPage';
import ReportsPage from '../../features/reports/pages/ReportsPage';
import SettingsPage from '../../features/settings/pages/SettingsPage';
import { ProtectedRoute } from './ProtectedRoute';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'pos', element: <PosPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'sales', element: <SalesPage /> },
      { path: 'customers', element: <CustomersPage /> },
      { path: 'suppliers', element: <SuppliersPage /> },
      { path: 'purchases', element: <PurchasesPage /> },
      { path: 'expenses', element: <ExpensesPage /> },
      { path: 'daily-closing', element: <DailyClosingPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
