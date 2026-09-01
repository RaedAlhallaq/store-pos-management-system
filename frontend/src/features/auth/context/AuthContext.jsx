import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { authApi } from '../api/authApi';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('store_pos_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('store_pos_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('store_pos_token');
      if (storedToken) {
        try {
          const data = await authApi.getUser();
          setUser(data.user);
          localStorage.setItem('store_pos_user', JSON.stringify(data.user));
        } catch {
          setToken(null);
          setUser(null);
          localStorage.removeItem('store_pos_token');
          localStorage.removeItem('store_pos_user');
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const data = await authApi.login(credentials);
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('store_pos_token', data.token);
      localStorage.setItem('store_pos_user', JSON.stringify(data.user));
      toast.success(data.message || 'تم تسجيل الدخول بنجاح');
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.errors?.email?.[0] ||
        'فشل تسجيل الدخول، تأكد من صحة البيانات';
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await authApi.logout();
      }
    } catch {
      // A local logout should still succeed if the API request fails.
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('store_pos_token');
      localStorage.removeItem('store_pos_user');
      toast.info('تم تسجيل الخروج بنجاح');
    }
  };

  const refreshUser = async () => {
    if (!token) return;

    try {
      const data = await authApi.getUser();
      setUser(data.user);
      localStorage.setItem('store_pos_user', JSON.stringify(data.user));
    } catch (error) {
      console.error('Failed to refresh user', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
