import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { configureApiClient } from '../services/apiClient';
import { getCurrentUser } from '../services/authService';

const AuthContext = createContext(null);
const TOKEN_KEY = 'billbeat.auth.token';
const USER_KEY = 'billbeat.auth.user';

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(readStoredUser);
  const [isRestoring, setIsRestoring] = useState(Boolean(token));

  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    configureApiClient({
      getToken: () => token,
      onUnauthorized: clearSession,
    });
  }, [token]);

  useEffect(() => {
    let active = true;

    if (!token) {
      setIsRestoring(false);
      return () => { active = false; };
    }

    setIsRestoring(true);
    getCurrentUser()
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch((error) => {
        if (active && error.status === 401) clearSession();
      })
      .finally(() => {
        if (active) setIsRestoring(false);
      });

    return () => { active = false; };
  }, [token]);

  useEffect(() => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }, [token, user]);

  const value = useMemo(() => ({
    token,
    user,
    isAuthenticated: Boolean(token),
    isRestoring,
    setSession: (nextToken, nextUser) => {
      setToken(nextToken);
      setUser(nextUser || null);
    },
    clearSession,
  }), [isRestoring, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
