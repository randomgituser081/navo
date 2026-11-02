import "server-only";
import { cookies } from "next/headers";

/**
 * Server-side access to the Navo API. The browser never talks to the API directly:
 * the API key stays on the server and tokens live in httpOnly cookies.
 */
const API_URL = process.env.NAVO_API_URL ?? "https://navoapi.viaspark.site/api/v1";
const API_KEY = process.env.NAVO_API_KEY ?? "";

export const ACCESS_COOKIE = "navo_at";
export const REFRESH_COOKIE = "navo_rt";

const cookieBase = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export async function setSession(accessToken: string, refreshToken?: string) {
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, accessToken, { ...cookieBase, maxAge: 60 * 60 * 24 });
  if (refreshToken) jar.set(REFRESH_COOKIE, refreshToken, { ...cookieBase, maxAge: 60 * 60 * 24 * 30 });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}

export async function hasSession() {
  const jar = await cookies();
  return jar.has(ACCESS_COOKIE) || jar.has(REFRESH_COOKIE);
}

type CallInit = {
  method?: string;
  body?: BodyInit | null;
  contentType?: string | null;
  token?: string | null;
};

/** Raw call to the API; returns the fetch Response untouched. */
export function callApi(path: string, { method = "GET", body, contentType, token }: CallInit = {}) {
  const headers: Record<string, string> = {
    "expo-api-key": API_KEY,
    // Tells the API this is the website, so payment callbacks return here (not navoplus://).
    "x-navo-client": "web",
    accept: "application/json",
  };
  if (contentType) headers["content-type"] = contentType;
  if (token) headers.authorization = `Bearer ${token}`;
  return fetch(`${API_URL}${path}`, { method, headers, body, cache: "no-store" });
}

/** Exchanges the refresh cookie for a new access token, updating the cookie. */
export async function refreshAccessToken(): Promise<string | null> {
  const jar = await cookies();
  const refreshToken = jar.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return null;
  const res = await callApi("/auth/refresh-token", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
    contentType: "application/json",
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  if (!data?.accessToken) return null;
  await setSession(data.accessToken);
  return data.accessToken;
}

/** Authenticated call that transparently refreshes an expired access token once. */
export async function callApiAuthed(path: string, init: Omit<CallInit, "token"> = {}) {
  const jar = await cookies();
  let token = jar.get(ACCESS_COOKIE)?.value ?? (await refreshAccessToken());
  let res = await callApi(path, { ...init, token });
  if (res.status === 401) {
    token = await refreshAccessToken();
    if (token) res = await callApi(path, { ...init, token });
  }
  return res;
}
