"use client";

/** Browser-side helpers. Everything goes through this site's own /api routes. */

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

/** Nest returns `message` as a string or (for validation) an array of strings. */
export function errorMessage(data: any, fallback = "Something went wrong. Please try again.") {
  const m = data?.message ?? data?.error?.message;
  if (Array.isArray(m)) return m.join(". ");
  return typeof m === "string" && m ? m : fallback;
}

// Write requests show the full-screen loader (as the app's showLoader/hideLoader does).
let pendingWrites = 0;
const loaderListeners = new Set<(busy: boolean) => void>();
export function onLoaderChange(fn: (busy: boolean) => void) {
  loaderListeners.add(fn);
  return () => {
    loaderListeners.delete(fn);
  };
}
function trackWrite(delta: number) {
  pendingWrites = Math.max(0, pendingWrites + delta);
  loaderListeners.forEach((fn) => fn(pendingWrites > 0));
}

async function request<T>(url: string, method: string, body?: unknown): Promise<T> {
  const isWrite = method !== "GET";
  if (isWrite) trackWrite(1);
  try {
    return await send<T>(url, method, body);
  } finally {
    if (isWrite) trackWrite(-1);
  }
}

async function send<T>(url: string, method: string, body?: unknown): Promise<T> {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: body && !isForm ? { "content-type": "application/json" } : undefined,
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Could not reach the server. Check your connection and try again.", 0, null);
  }
  const data = await res.json().catch(() => null);
  if (res.status === 401 && url.startsWith("/api/navo") && typeof window !== "undefined") {
    window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
  }
  if (!res.ok) throw new ApiError(errorMessage(data), res.status, data);
  return data as T;
}

/** Authenticated Navo API call, e.g. navo.get("/wallet"). */
export const navo = {
  get: <T = any>(path: string) => request<T>(`/api/navo${path}`, "GET"),
  post: <T = any>(path: string, body?: unknown) => request<T>(`/api/navo${path}`, "POST", body ?? {}),
  put: <T = any>(path: string, body?: unknown) => request<T>(`/api/navo${path}`, "PUT", body ?? {}),
  patch: <T = any>(path: string, body?: unknown) => request<T>(`/api/navo${path}`, "PATCH", body ?? {}),
  delete: <T = any>(path: string, body?: unknown) => request<T>(`/api/navo${path}`, "DELETE", body),
};

/** Unauthenticated auth steps (login, register, OTP, password reset). */
export const auth = (action: string, body: unknown = {}) => request<any>(`/api/auth/${action}`, "POST", body);

/** List totals come back as `total` or `meta.total`. */
export function totalOf(res: any, fallback = 0): number {
  return Number(res?.total ?? res?.meta?.total ?? res?.data?.total ?? fallback);
}

/** Lists from the API come back as { data: [...] } or a bare array. */
export function listOf<T = any>(res: any): T[] {
  if (Array.isArray(res)) return res;
  for (const key of ["data", "items", "results", "products", "vendors", "orders", "notifications", "transactions"]) {
    if (Array.isArray(res?.[key])) return res[key];
    if (Array.isArray(res?.data?.[key])) return res.data[key];
  }
  return [];
}
