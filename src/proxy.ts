import { NextResponse, type NextRequest } from "next/server";

// Optimistic auth redirects only; the API still authorises every call.
const AUTH_PAGES = ["/login", "/register", "/verify", "/forgot-password"];
const PUBLIC_PAGES = ["/", ...AUTH_PAGES];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const signedIn = request.cookies.has("navo_at") || request.cookies.has("navo_rt");

  if (!signedIn && !PUBLIC_PAGES.includes(pathname)) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  if (signedIn && (pathname === "/" || AUTH_PAGES.includes(pathname))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Skip API routes, Next internals and static files (images, the loader's .json, fonts).
  matcher: ["/((?!api|_next|fonts|favicon.ico|.*\\.(?:jpg|png|svg|ico|json)$).*)"],
};
