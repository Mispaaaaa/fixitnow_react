import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { getToken, setToken } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(getToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function onToken(event) {
      setTokenState(event.detail);
    }
    function onExpired() {
      setUser(null);
      setTokenState(null);
    }
    window.addEventListener('session:token', onToken);
    window.addEventListener('session:expired', onExpired);
    return () => {
      window.removeEventListener('session:token', onToken);
      window.removeEventListener('session:expired', onExpired);
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function bootstrap() {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.get('/auth/me');
        if (active) setUser(response.data.data.user);
      } catch {
        setToken(null);
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }
    bootstrap();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    const { accessToken, user: nextUser } = response.data.data;
    setToken(accessToken);
    setUser(nextUser);
    return nextUser;
  }, []);

  const register = useCallback(async (payload) => {
    const response = await api.post('/auth/register', payload);
    const { accessToken, user: nextUser } = response.data.data;
    setToken(accessToken);
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Even if the request fails, clear the local session.
    }
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const response = await api.get('/auth/me');
    setUser(response.data.data.user);
    return response.data.data.user;
  }, []);

  const updateUser = useCallback((patch) => {
    setUser((current) => (current ? { ...current, ...patch } : current));
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, refreshUser, updateUser }),
    [user, token, loading, login, register, logout, refreshUser, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

export function roleHome(role) {
  if (role === 'admin') return '/admin';
  if (role === 'technician') return '/technician';
  return '/dashboard';
}