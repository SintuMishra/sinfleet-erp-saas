import axios from "axios";
import { clearAuthTokens, getAccessToken, getRefreshToken, redirectToLogin, setAuthTokens } from "@/lib/auth/auth-storage";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5001/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

let refreshPromise: Promise<string | null> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (typeof window === "undefined" || error.response?.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      handleSessionExpired();
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    refreshPromise ??= refreshSession(refreshToken).finally(() => {
      refreshPromise = null;
    });

    const accessToken = await refreshPromise;

    if (!accessToken) {
      handleSessionExpired();
      return Promise.reject(error);
    }

    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
    return apiClient(originalRequest);
  }
);

async function refreshSession(refreshToken: string) {
  try {
    const response = await axios.post<{
      data: {
        accessToken: string;
        refreshToken: string;
      };
    }>(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5001/api"}/auth/refresh`, { refreshToken });

    setAuthTokens(response.data.data.accessToken, response.data.data.refreshToken);
    return response.data.data.accessToken;
  } catch {
    clearAuthTokens();
    return null;
  }
}

function handleSessionExpired() {
  const path = window.location.pathname;
  redirectToLogin(path.startsWith("/admin") ? "admin" : "company");
}
