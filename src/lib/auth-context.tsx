import {
    createContext,
    use,
    useCallback,
    useEffect,
    useState,
    type PropsWithChildren,
} from "react";

import { apiClient, extractErrorMessage } from "./api-client";
import { usersApi } from "./api/endpoints";
import type { CurrentUser } from "./api/types";
import { queryClient } from "./query-client";
import { tokenStorage } from "./storage";

export type RegisterPayload = {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
};

type AuthContextValue = {
  user: CurrentUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isLeaderOrAdmin: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = use(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const me = await usersApi.me();
    setUser(me);
  }, []);

  useEffect(() => {
    (async () => {
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        await fetchMe();
      } catch {
        await tokenStorage.clear();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [fetchMe]);

  const login = useCallback(
    async (username: string, password: string) => {
      try {
        const { data } = await apiClient.post<{
          access: string;
          refresh: string;
        }>("/api/token/", {
          username,
          password,
        });
        await tokenStorage.setTokens(data.access, data.refresh);
        await fetchMe();
      } catch (error) {
        throw new Error(extractErrorMessage(error));
      }
    },
    [fetchMe],
  );

  const register = useCallback(async (payload: RegisterPayload) => {
    try {
      const { data } = await apiClient.post<{
        user: CurrentUser;
        access: string;
        refresh: string;
      }>("/api/users/", payload);
      await tokenStorage.setTokens(data.access, data.refresh);
      setUser(data.user);
    } catch (error) {
      throw new Error(extractErrorMessage(error));
    }
  }, []);

  const logout = useCallback(async () => {
    await tokenStorage.clear();
    setUser(null);
    queryClient.clear();
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: user != null,
    isLeaderOrAdmin:
      user != null && (user.role === "LEADER" || user.role === "ADMIN"),
    isAdmin: user?.role === "ADMIN",
    login,
    register,
    logout,
    refreshUser: fetchMe,
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}
