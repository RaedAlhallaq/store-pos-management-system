import { Toaster } from 'sonner';
import { AuthProvider } from '../../features/auth/context/AuthContext';

export function AppProviders({ children }) {
  return (
    <AuthProvider>
      {children}
      <Toaster position="top-center" richColors theme="dark" closeButton dir="rtl" />
    </AuthProvider>
  );
}
