import { useAuth } from '@/lib/auth/authprovider';
import axios from 'axios';
import { useMemo } from 'react';

export function useApiClient() {
  const { token } = useAuth();

  const client = useMemo(() => {
    const instance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Attach token dynamically
    instance.interceptors.request.use((config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    return instance;
  }, [token]);

  return client;
}
