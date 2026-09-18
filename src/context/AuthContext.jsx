import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = async () => {
    try {
      const response = await apiFetch('/api/auth/me', { headers: { Accept: 'application/json' } });
      const data = await response.json();
      if (data.success) setUser(data.data);
      else setUser(null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshSession(); }, []);

  const login = async ({ email, password }) => {
    const response = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || 'Login gagal.');
    const nextUser = { ...data.data.user, profile: data.data.profile };
    setUser(nextUser);
    return nextUser;
  };

  const logout = async () => {
    try { await apiFetch('/api/auth/logout', { method: 'POST' }); } finally { setUser(null); }
  };

  const value = useMemo(() => ({ user, login, logout, loading, refreshSession }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
