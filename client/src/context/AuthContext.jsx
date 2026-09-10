import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, userApi } from '../api/endpoints';
import { setAccessToken, setUnauthorizedHandler, refreshAccessToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isBooting, setIsBooting] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Silent sign-in on first load using the httpOnly refresh cookie.
  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    (async () => {
      try {
        await refreshAccessToken();
        const res = await authApi.me();
        setUser(res.data.user);
      } catch (e) {
        clearSession();
      } finally {
        setIsBooting(false);
      }
    })();
  }, [clearSession]);

  const applySession = useCallback((data) => {
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const login = useCallback(async (payload) => applySession((await authApi.login(payload)).data), [applySession]);
  const register = useCallback(async (payload) => applySession((await authApi.register(payload)).data), [applySession]);
  const loginWithGoogle = useCallback(async (idToken) => applySession((await authApi.google(idToken)).data), [applySession]);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch (e) { /* sign out locally regardless */ }
    clearSession();
  }, [clearSession]);

  const logoutEverywhere = useCallback(async () => {
    try { await authApi.logoutAll(); } finally { clearSession(); }
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    const res = await userApi.profile();
    setUser(res.data);
    return res.data;
  }, []);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await userApi.notifications({ limit: 15 });
      setNotifications(res.data);
      setUnreadCount(res.meta?.unread || 0);
    } catch (e) { /* non-critical */ }
  }, [user]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const pushNotification = useCallback((n) => {
    setNotifications((list) => [n, ...list].slice(0, 20));
    setUnreadCount((c) => c + 1);
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((list) => list.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try { await userApi.readAllNotifications(); } catch (e) { /* optimistic */ }
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin' || user?.role === 'staff',
      isBooting,
      login,
      register,
      loginWithGoogle,
      logout,
      logoutEverywhere,
      refreshUser,
      notifications,
      unreadCount,
      loadNotifications,
      pushNotification,
      markAllRead,
    }),
    [user, isBooting, login, register, loginWithGoogle, logout, logoutEverywhere, refreshUser,
     notifications, unreadCount, loadNotifications, pushNotification, markAllRead]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
