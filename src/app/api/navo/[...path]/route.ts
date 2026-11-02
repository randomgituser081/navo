import { NextRequest, NextResponse } from "next/server";
import { callApiAuthed, clearSession } from "@/lib/server/navo";

/**
 * Generic authenticated proxy: /api/navo/<path> → Navo API /<path>.
 * Adds the API key and the session token server-side, refreshing it when it expires.
 */
async function proxy(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const target = `/${path.map(encodeURIComponent).join("/")}${req.nextUrl.search}`;

  const hasBody = !["GET", "HEAD"].includes(req.method);
  // Forward the raw body so JSON and multipart uploads both pass through unchanged.
  const body = hasBody ? await req.arrayBuffer() : undefined;

  const res = await callApiAuthed(target, {
    method: req.method,
    body: body && body.byteLength ? body : undefined,
    contentType: req.headers.get("content-type"),
  });

  if (res.status === 401) {
    // Refresh failed too: the session is over.
    await clearSession();
  }

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
  });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
