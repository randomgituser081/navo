import { NextRequest, NextResponse } from "next/server";
import { callApi, callApiAuthed, clearSession, setSession } from "@/lib/server/navo";

/**
 * Unauthenticated auth steps. `login` and `verify-account` return tokens: those are stored
 * in httpOnly cookies and stripped from the response, so page scripts never see them.
 */
const ROUTES: Record<string, { path: string; method: string; setsSession?: boolean }> = {
  login: { path: "/auth/login", method: "POST", setsSession: true },
  register: { path: "/auth/register", method: "POST" },
  "verify-account": { path: "/auth/verify-account", method: "POST", setsSession: true },
  "resend-otp": { path: "/auth/resend-otp", method: "POST" },
  "forgot-password": { path: "/auth/forgot-password", method: "POST" },
  "reset-password-otp": { path: "/auth/reset-password-otp", method: "POST" },
  "reset-password": { path: "/auth/reset-password", method: "PUT" },
};

export async function POST(req: NextRequest, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params;

  if (action === "logout") {
    await callApiAuthed("/auth/logout", { method: "POST" }).catch(() => null);
    await clearSession();
    return NextResponse.json({ ok: true });
  }

  const route = ROUTES[action];
  if (!route) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const res = await callApi(route.path, {
    method: route.method,
    body: await req.text(),
    contentType: "application/json",
  });
  const data = await res.json().catch(() => ({ message: "Unexpected response from server" }));

  if (res.ok && route.setsSession && data?.user?.accessToken) {
    const { accessToken, refreshToken, ...user } = data.user;
    await setSession(accessToken, refreshToken);
    return NextResponse.json({ ...data, user });
  }

  return NextResponse.json(data, { status: res.status });
}
