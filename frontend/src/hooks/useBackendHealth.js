import { useCallback, useEffect, useState } from 'react';
import { authApi } from '../features/auth/api/authApi';

export function useBackendHealth(interval = 30000) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [isError, setIsError] = useState(false);

  const refresh = useCallback(async () => {
    setIsFetching(true);
    setIsError(false);

    try {
      const response = await authApi.checkHealth();
      setData(response);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => {
      void refresh();
    }, 0);
    const timer = window.setInterval(refresh, interval);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [interval, refresh]);

  return { data, isError, isLoading, isFetching, refresh };
}
