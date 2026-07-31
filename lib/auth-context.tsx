"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { apiRequest, login as apiLogin } from "./api";

export type Tokens = { access: string; refresh: string };

type AuthContextValue = {
  tokens: Tokens | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  apiRequest: <T>(path: string, options?: RequestInit) => Promise<T>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [tokens, setTokens] = useState<Tokens | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    const t = await apiLogin(email, password);
    setTokens(t);
  }, []);

  const logout = useCallback(() => {
    setTokens(null);
  }, []);

  const authedRequest = useCallback(
    <T,>(path: string, options: RequestInit = {}) =>
      apiRequest<T>(tokens, path, options),
    [tokens]
  );

  const value = useMemo(
    () => ({ tokens, login, logout, apiRequest: authedRequest }),
    [tokens, login, logout, authedRequest]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
