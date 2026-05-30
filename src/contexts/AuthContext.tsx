import { createContext, useCallback, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authAPI } from '../services/api';
import { clearStoredPin } from '../utils/crypto';
import { useEncryptionKey } from '../hooks/useEncryptionKey';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  weatherCity?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<{ email: string }>;
  verify: (email: string, otp: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);
const tokenExpiryKey = 'tokenExpiry';

const parseTokenExpiry = (jwt: string) => {
  try {
    const base64 = (jwt.split('.')[1] || '').replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as { exp?: number };
    return payload.exp ?? null;
  } catch {
    return null;
  }
};

const sanitizeWeatherCity = (value: string) => (
  value.trim().replace(/[^a-zA-Z0-9\s.'-]/g, '').slice(0, 64)
);

const setWeatherCityStorage = (value?: string) => {
  if (!value) {
    localStorage.removeItem('weatherCity');
    return;
  }
  const cleaned = sanitizeWeatherCity(value);
  if (cleaned) localStorage.setItem('weatherCity', cleaned);
  else localStorage.removeItem('weatherCity');
};

const setTokenExpiryStorage = (exp: number | null) => {
  if (!exp || !Number.isFinite(exp)) {
    localStorage.removeItem(tokenExpiryKey);
    return;
  }
  const now = Math.floor(Date.now() / 1000);
  const maxFuture = now + 60 * 60 * 24 * 2;
  if (exp < now - 60 || exp > maxFuture) {
    localStorage.removeItem(tokenExpiryKey);
    return;
  }
  localStorage.setItem(tokenExpiryKey, String(exp));
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const { clearKey, openPrompt, setHasServerKey } = useEncryptionKey();
  const [user, setUser] = useState<User | null>(() => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);

  const setTokenWithExpiry = useCallback((nextToken: string | null) => {
    setToken(nextToken);
    if (nextToken) {
      const exp = parseTokenExpiry(nextToken);
      setTokenExpiryStorage(exp);
    } else {
      localStorage.removeItem(tokenExpiryKey);
    }
  }, []);

  const clearLocalSession = useCallback(() => {
    setTokenWithExpiry(null);
    setUser(null);
    localStorage.clear();
    sessionStorage.clear();
    clearKey();
  }, [clearKey, setTokenWithExpiry]);

  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  useEffect(() => {
    setWeatherCityStorage(user?.weatherCity);
  }, [user]);

  useEffect(() => {
    const stored = localStorage.getItem('isKeySet');
    if (stored !== null) setHasServerKey(stored === '1');
  }, [setHasServerKey]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ token?: string; isKeySet?: boolean }>).detail;
      if (detail?.token) setTokenWithExpiry(detail.token);
      if (typeof detail?.isKeySet === 'boolean') {
        setHasServerKey(detail.isKeySet);
        localStorage.setItem('isKeySet', detail.isKeySet ? '1' : '0');
      }
    };
    window.addEventListener('amantra:token-updated', handler);
    return () => window.removeEventListener('amantra:token-updated', handler);
  }, [setHasServerKey, setTokenWithExpiry]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await authAPI.login({ email, password });
      setTokenWithExpiry(res.data.token);
      setUser(res.data.user);
      const keySet = !!res.data.isKeySet;
      setHasServerKey(keySet);
      localStorage.setItem('isKeySet', keySet ? '1' : '0');
      clearKey();
      openPrompt(res.data.isKeySet ? 'verify' : 'set');
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      await authAPI.register({ name, email, password });
      return { email };
    } finally {
      setLoading(false);
    }
  };

  const verify = async (email: string, otp: string) => {
    setLoading(true);
    try {
      await authAPI.verify({ email, otp });
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string, otp: string, newPassword: string) => {
    setLoading(true);
    try {
      await authAPI.resetPassword({ email, otp, password: newPassword });
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authAPI.logout().catch(() => { });
    clearLocalSession();
  };

  const refreshAccessToken = useCallback(async () => {
    try {
      const res = await authAPI.refresh();
      if (res.data?.token) {
        setTokenWithExpiry(res.data.token);
        if (res.data.user) setUser(res.data.user);
        if (typeof res.data.isKeySet === 'boolean') {
          setHasServerKey(res.data.isKeySet);
          localStorage.setItem('isKeySet', res.data.isKeySet ? '1' : '0');
        }
        clearStoredPin();
      }
    } catch {
      clearLocalSession();
    }
  }, [clearLocalSession, setHasServerKey, setTokenWithExpiry]);

  useEffect(() => {
    if (token) return;
    if (!localStorage.getItem('user')) return;
    authAPI.refresh()
      .then((res) => {
        if (res.data?.token) {
          setTokenWithExpiry(res.data.token);
          if (res.data.user) setUser(res.data.user);
          if (typeof res.data.isKeySet === 'boolean') {
            setHasServerKey(res.data.isKeySet);
            localStorage.setItem('isKeySet', res.data.isKeySet ? '1' : '0');
          }
          clearStoredPin();
        }
      })
      .catch(() => {
        clearLocalSession();
      });
  }, [setHasServerKey, setTokenWithExpiry, token, clearLocalSession]);

  useEffect(() => {
    const expRaw = localStorage.getItem(tokenExpiryKey);
    const exp = expRaw ? Number(expRaw) : null;
    if (!token || !exp) return;
    if (Date.now() >= exp * 1000) {
      refreshAccessToken();
    }
  }, [token, refreshAccessToken]);

  useEffect(() => {
    const expRaw = localStorage.getItem(tokenExpiryKey);
    const exp = expRaw ? Number(expRaw) : null;
    if (!token || !exp) return;
    const ms = exp * 1000 - Date.now();
    if (ms <= 0) {
      clearKey();
      return;
    }
    const timer = window.setTimeout(() => clearKey(), ms);
    return () => window.clearTimeout(timer);
  }, [token, clearKey]);

  return (
    <AuthContext.Provider value={{ user, token, login, register, verify, forgotPassword, resetPassword, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
