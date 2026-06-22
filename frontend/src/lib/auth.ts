import Cookies from "js-cookie";
import api from "./api";
import type { LoginCredentials, AuthResponse, User } from "@/types/auth";

const COOKIE_OPTS = { secure: true, sameSite: "strict" as const };

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login/", {
    email: credentials.email,
    password: credentials.password,
  });

  const access = data.access ?? data.tokens?.access ?? "";
  const refresh = data.refresh ?? data.tokens?.refresh ?? "";

  if (!access || !refresh) {
    throw new Error("Invalid auth response: missing tokens");
  }

  Cookies.set("access_token", access, COOKIE_OPTS);
  Cookies.set("refresh_token", refresh, COOKIE_OPTS);

  return data;
}

export async function logout(): Promise<void> {
  const refresh = Cookies.get("refresh_token");
  if (refresh) await api.post("/auth/logout/", { refresh }).catch(() => {});
  Cookies.remove("access_token");
  Cookies.remove("refresh_token");
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>("/auth/me/");
  return data;
}

export function isAuthenticated(): boolean {
  return !!Cookies.get("access_token");
}
