"use client";

const ACCESS_TOKEN_KEY = "sinfleet_access_token";
const REFRESH_TOKEN_KEY = "sinfleet_refresh_token";

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setAuthTokens(accessToken: string, refreshToken: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  window.sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearAuthTokens() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function redirectToLogin(role: "admin" | "company") {
  clearAuthTokens();

  if (typeof window === "undefined") return;

  window.location.assign(role === "admin" ? "/admin/login" : "/company/login");
}
