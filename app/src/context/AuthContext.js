import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setAuthToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('auth_token');
        if (stored) {
          setToken(stored);
          setAuthToken(stored);
          await fetchMe(stored);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const fetchMe = async (overrideToken) => {
    try {
      const t = overrideToken || token;
      if (!t) return;
      const res = await api.get('/api/me', {
        headers: { Authorization: `Bearer ${t}` },
      });
      setUser(res.data);
    } catch (e) {
      // token invalid or server down
      console.warn('Failed to fetch /api/me');
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password });
    const t = res.data.token;
    setToken(t);
    setAuthToken(t);
    await AsyncStorage.setItem('auth_token', t);
    await fetchMe(t);
  };

  const register = async (email, password) => {
    const res = await api.post('/api/auth/register', { email, password });
    const t = res.data.token;
    setToken(t);
    setAuthToken(t);
    await AsyncStorage.setItem('auth_token', t);
    await fetchMe(t);
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    await AsyncStorage.removeItem('auth_token');
  };

  const value = useMemo(() => ({ token, user, loading, login, register, logout }), [token, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
