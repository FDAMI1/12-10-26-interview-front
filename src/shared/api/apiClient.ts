import axios, { InternalAxiosRequestConfig } from "axios";
import { environment } from "@config/env";
import { useAuthStore } from "../store/useAuthStore";

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const apiClient = axios.create({
  baseURL: environment.apiUrl,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // A suspended account is refused on every call; staying signed in would
    // leave the user in a shell where nothing loads.
    if (error.response?.data?.error?.code === "ACCOUNT_SUSPENDED") {
      await useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    const originalRequest = error.config as CustomAxiosRequestConfig;
    if (!originalRequest) return Promise.reject(error);
    if (originalRequest.url?.includes("/auth/") || originalRequest._retry)
      return Promise.reject(error);

    const { token, refreshToken } = useAuthStore.getState();
    if (!token && !refreshToken) return Promise.reject(error);

    if (error.response?.status === 401) {
      originalRequest._retry = true;
      const newToken = await useAuthStore.getState().refreshSession();
      if (newToken) {
        originalRequest.headers.Authorization = "Bearer " + newToken;
        return apiClient(originalRequest);
      }
    }
    return Promise.reject(error);
  },
);

/** Standard envelopes. */
export interface ApiOne<T> {
  success: boolean;
  data: T;
}
export interface Paginated<T> {
  success: boolean;
  data: T[];
  meta: { total: number; pages: number; page: number };
}

type ErrBody = {
  response?: {
    data?: {
      error?: {
        code?: string;
        message?: string;
        details?: {
          issues?: { path: (string | number)[]; message: string }[];
        } & Record<string, unknown>;
      };
    };
  };
};

/** The server's machine-readable error code - screens branch on this, not on wording. */
export function apiErrorCode(err: unknown): string | undefined {
  return (err as ErrBody)?.response?.data?.error?.code;
}

export function apiErrorDetails(err: unknown): Record<string, unknown> {
  return (err as ErrBody)?.response?.data?.error?.details ?? {};
}

export function apiErrorMessage(
  err: unknown,
  fallback = "Something went wrong",
) {
  const error = (err as ErrBody)?.response?.data?.error;
  const timedOut = (err as { code?: string })?.code === "ECONNABORTED";
  const plain = timedOut
    ? "The server took too long to respond. Check your connection and try again."
    : !error && err instanceof Error && err.message
      ? err.message
      : "";
  const message = error?.message || plain || fallback;

  const issues = error?.details?.issues;
  if (issues?.length) {
    const detail = [
      ...new Set(
        issues.map((i) => {
          const name = (i.path || [])
            .filter((p) => typeof p === "string")
            .filter((p) => p !== "body" && p !== "query" && p !== "params")
            .pop();
          return name ? `${name}: ${i.message}` : i.message;
        }),
      ),
    ]
      .slice(0, 4)
      .join(" · ");
    if (detail) return `${message} - ${detail}`;
  }
  return message;
}
