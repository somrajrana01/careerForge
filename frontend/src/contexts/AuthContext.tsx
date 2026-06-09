import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from '../features/auth/authService';
import { TOKEN_KEY, USER_KEY } from '../services/api';
import type { AuthResponse, LoginRequest, RegisterRequest, UserResponse } from '../types';

interface AuthContextValue {
  token: string | null;
  user: UserResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser() {
  const rawUser = localStorage.getItem(USER_KEY);
  if (!rawUser) {
    return null;
  }
  try {
    return JSON.parse(rawUser) as UserResponse;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<UserResponse | null>(() => readStoredUser());
  const [isLoading, setIsLoading] = useState(true);

  const persistAuth = (auth: AuthResponse) => {
    localStorage.setItem(TOKEN_KEY, auth.token);
    localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
    setToken(auth.token);
    setUser(auth.user);
  };

  const clearAuth = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    let isMounted = true;

    getCurrentUser()
      .then((currentUser) => {
        if (!isMounted) {
          return;
        }

        if (currentUser) {
          localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
          setUser(currentUser);
        } else {
          clearAuth();
        }
      })
      .catch(() => {
        if (isMounted) {
          clearAuth();
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    token,
    user,
    isLoading,
    isAuthenticated: Boolean(token && user),
    login: async (payload) => {
      persistAuth(await loginRequest(payload));
    },
    register: async (payload) => {
      persistAuth(await registerRequest(payload));
    },
    logout: () => {
      void logoutRequest();
      clearAuth();
    },
  }), [isLoading, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
