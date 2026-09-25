import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { apiFetch, setUnauthorizedHandler } from '../lib/api';

const AuthContext = createContext(null);
const PARTICIPANT_IDLE_TIMEOUT = 30 * 60 * 1000;
const PARTICIPANT_LAST_ACTIVITY_KEY = 'tatc_participant_last_activity';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
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
  }, []);

  const logout = useCallback(async () => {
    try { await apiFetch('/api/auth/logout', { method: 'POST' }); } finally {
      sessionStorage.removeItem(PARTICIPANT_LAST_ACTIVITY_KEY);
      setUser(null);
    }
  }, []);

  // Register logout as the 401 handler so any failed request auto-clears the session.
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Initial session check on mount.
  useEffect(() => { refreshSession(); }, [refreshSession]);

  // Re-check session when the user returns to the tab, in case it expired while away.
  useEffect(() => {
    const handleFocus = () => { if (user) refreshSession(); };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, refreshSession]);

  // Participant sessions expire after 30 minutes without activity. sessionStorage
  // keeps the timer valid across refreshes but clears it when the tab is closed.
  useEffect(() => {
    if (user?.role !== 'PESERTA') return undefined;

    let timeoutId;
    const logoutForInactivity = () => { logout(); };
    const scheduleLogout = () => {
      window.clearTimeout(timeoutId);
      const lastActivity = Number(sessionStorage.getItem(PARTICIPANT_LAST_ACTIVITY_KEY));
      const elapsed = Date.now() - lastActivity;

      if (!lastActivity || elapsed >= PARTICIPANT_IDLE_TIMEOUT) {
        logoutForInactivity();
        return;
      }

      timeoutId = window.setTimeout(logoutForInactivity, PARTICIPANT_IDLE_TIMEOUT - elapsed);
    };
    const recordActivity = () => {
      sessionStorage.setItem(PARTICIPANT_LAST_ACTIVITY_KEY, String(Date.now()));
      scheduleLogout();
    };
    const handleVisible = () => {
      if (document.visibilityState === 'visible') scheduleLogout();
    };

    if (sessionStorage.getItem(PARTICIPANT_LAST_ACTIVITY_KEY)) scheduleLogout();
    else recordActivity();

    const activityEvents = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(event => window.addEventListener(event, recordActivity, { passive: true }));
    window.addEventListener('focus', scheduleLogout);
    document.addEventListener('visibilitychange', handleVisible);

    return () => {
      window.clearTimeout(timeoutId);
      activityEvents.forEach(event => window.removeEventListener(event, recordActivity));
      window.removeEventListener('focus', scheduleLogout);
      document.removeEventListener('visibilitychange', handleVisible);
    };
  }, [user?.role, logout]);

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

  const value = useMemo(() => ({ user, login, logout, loading, refreshSession }), [user, loading, logout, refreshSession]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
