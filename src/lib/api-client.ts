import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import { API_BASE_URL } from "./config";
import { tokenStorage } from "./storage";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// SIMPLE_JWT has ROTATE_REFRESH_TOKENS + BLACKLIST_AFTER_ROTATION on, so every
// refresh response carries a new refresh token that must overwrite the old one.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) {
    return null;
  }
  try {
    const response = await axios.post<{ access: string; refresh: string }>(
      `${API_BASE_URL}/api/token/refresh/`,
      { refresh: refreshToken },
    );
    await tokenStorage.setTokens(response.data.access, response.data.refresh);
    return response.data.access;
  } catch {
    await tokenStorage.clear();
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableConfig | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      refreshPromise ??= refreshAccessToken();
      const newAccessToken = await refreshPromise;
      refreshPromise = null;

      if (newAccessToken) {
        originalRequest.headers.set(
          "Authorization",
          `Bearer ${newAccessToken}`,
        );
        return apiClient(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data === "string") return data;
    if (data && typeof data === "object") {
      const firstValue = Object.values(data)[0];
      if (Array.isArray(firstValue)) return String(firstValue[0]);
      if (typeof firstValue === "string") return firstValue;
      if (
        "detail" in data &&
        typeof (data as { detail?: unknown }).detail === "string"
      ) {
        return (data as { detail: string }).detail;
      }
    }
    if (error.message) return error.message;
  }
  return "Something went wrong. Please try again.";
}
