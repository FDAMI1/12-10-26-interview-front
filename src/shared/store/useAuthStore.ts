import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { decode } from "base-64";
import axios from "axios";
import { environment } from "@config/env";

// Some RN engines lack `atob` (used for base64 JWT decoding below).
const runtimeGlobal = globalThis as unknown as { atob?: typeof decode };
if (!runtimeGlobal.atob) runtimeGlobal.atob = decode;

export type PlatformRole = "candidate" | "platform_admin";

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: PlatformRole;
  status: "active" | "suspended";
  emailVerified: boolean;
  /** "api" candidates arrive through a company integration and have no password here. */
  authType: "password" | "api";
  /** Signed in with an admin-issued temporary password; must choose their own first. */
  mustChangePassword: boolean;
  /** Has used "Continue with Google" / "Continue with GitHub". */
  googleLinked?: boolean;
  githubLinked?: boolean;
  /** False for a Google-only account that has never set a password. */
  hasPassword?: boolean;
  locale: string;
  timezone: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isAuthChecked: boolean;
  setAuth: (user: User, token: string, refreshToken: string) => void;
  updateUser: (patch: Partial<User>) => void;
  updateTokens: (token: string, refreshToken: string) => void;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  refreshSession: () => Promise<string | null>;
  isPlatformAdmin: () => boolean;
}

export const isTokenExpired = (token: string | null) => {
  if (!token) return true;
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(base64));
    return exp * 1000 < Date.now() + 30000; // 30s buffer
  } catch {
    return true;
  }
};

/**
 * "Remember me". Remembered (the default): the session is kept on the device
 * (localStorage on the web, the secure keychain on a phone). Not remembered:
 * it lives only for this browser tab (sessionStorage) or, on a phone, until
 * the app is closed (memory). The choice is read back from where the session
 * was found, so a reload keeps honouring it.
 */
let rememberSession = true;
const memory = new Map<string, string>();

export function setRememberMe(remember: boolean) {
  rememberSession = remember;
}

const isWebStorage = Platform.OS === "web";
const persistent = {
  get: (k: string) =>
    isWebStorage
      ? Promise.resolve(localStorage.getItem(k))
      : SecureStore.getItemAsync(k),
  set: (k: string, v: string) =>
    isWebStorage
      ? Promise.resolve(localStorage.setItem(k, v))
      : SecureStore.setItemAsync(k, v),
  remove: (k: string) =>
    isWebStorage
      ? Promise.resolve(localStorage.removeItem(k))
      : SecureStore.deleteItemAsync(k),
};
const temporary = {
  get: (k: string) =>
    isWebStorage ? sessionStorage.getItem(k) : (memory.get(k) ?? null),
  set: (k: string, v: string) =>
    isWebStorage ? sessionStorage.setItem(k, v) : void memory.set(k, v),
  remove: (k: string) =>
    isWebStorage ? sessionStorage.removeItem(k) : void memory.delete(k),
};

const secureStorage: StateStorage = {
  getItem: async (name) => {
    const kept = await persistent.get(name);
    if (kept) return kept;
    const forThisSession = temporary.get(name);
    if (forThisSession) rememberSession = false;
    return forThisSession;
  },
  setItem: async (name, value) => {
    if (rememberSession) {
      temporary.remove(name);
      await persistent.set(name, value);
    } else {
      await persistent.remove(name);
      temporary.set(name, value);
    }
  },
  removeItem: async (name) => {
    temporary.remove(name);
    await persistent.remove(name);
  },
};

let refreshPromise: Promise<string | null> | null = null;
const STORAGE_KEY = "ai-interview-auth";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isHydrated: false,
      isAuthChecked: false,

      setAuth: (user, token, refreshToken) =>
        set({ user, token, refreshToken, isAuthenticated: true }),

      updateUser: (patch) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...patch } : null,
        })),

      updateTokens: (token, refreshToken) =>
        set({ token, refreshToken, isAuthenticated: true }),

      logout: async () => {
        const { refreshToken } = get();
        if (refreshToken) {
          try {
            await axios.post(`${environment.apiUrl}/auth/logout`, {
              refreshToken,
            });
          } catch {
            // best-effort: the session TTL reclaims it
          }
        }
        await secureStorage.removeItem(STORAGE_KEY);
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      isPlatformAdmin: () => get().user?.role === "platform_admin",

      refreshSession: async () => {
        if (refreshPromise) return refreshPromise;
        refreshPromise = (async () => {
          try {
            const { refreshToken, updateTokens, logout } = get();
            if (!refreshToken) {
              await logout();
              return null;
            }
            const rs = await axios.post(`${environment.apiUrl}/auth/refresh`, {
              refreshToken,
            });
            const { accessToken, refreshToken: next } = rs.data.data;
            updateTokens(accessToken, next);
            return accessToken;
          } catch (err) {
            // Only a server rejection ends the session; a network error keeps
            // it for the next attempt.
            const status = (err as { response?: { status?: number } })?.response
              ?.status;
            if (status === 401 || status === 403) await get().logout();
            return null;
          } finally {
            refreshPromise = null;
          }
        })();
        return refreshPromise;
      },

      initializeAuth: async () => {
        const { token, refreshToken, refreshSession } = get();
        if (!token && !refreshToken) {
          set({ isAuthChecked: true });
          return;
        }
        if (!isTokenExpired(token)) {
          set({ isAuthenticated: true, isAuthChecked: true });
          return;
        }
        if (refreshToken) {
          await refreshSession();
          if (get().refreshToken) {
            set({ isAuthenticated: true, isAuthChecked: true });
            return;
          }
        }
        set({ isAuthChecked: true });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.isHydrated = true;
      },
    },
  ),
);
