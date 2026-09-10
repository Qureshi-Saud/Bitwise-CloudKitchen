import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/endpoints';
import { setAccessToken, setUnauthorizedHandler, refreshAccessToken } from '../api/client';
import { reconnectWithAuth } from '../lib/socket';

const AdminAuthContext = createContext(null);

const isStaff = (user) => user?.role === 'admin' || user?.role === 'staff';

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  const clear = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clear);
    (async () => {
      try {
        await refreshAccessToken();
        const res = await authApi.me();
        if (isStaff(res.data.user)) {
          setUser(res.data.user);
          reconnectWithAuth();
        } else {
          clear();
        }
      } catch (e) {
        clear();
      } finally {
        setBooting(false);
      }
    })();
  }, [clear]);

  const login = useCallback(async (payload) => {
    const res = await authApi.login(payload);
    if (!isStaff(res.data.user)) {
      setAccessToken(null);
      throw new Error('This account does not have admin access.');
    }
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
    reconnectWithAuth();
    return res.data.user;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch (e) { /* sign out locally regardless */ }
    clear();
  }, [clear]);

  const value = useMemo(
    () => ({ user, booting, login, logout, isAdmin: user?.role === 'admin', isAuthenticated: Boolean(user) }),
    [user, booting, login, logout]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  return ctx;
};
