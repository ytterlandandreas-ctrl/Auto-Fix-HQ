import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/register", "/portal", "/api/stripe/webhook", "/api/twilio", "/dev"];

const ADMIN_PATHS = ["/admin"];
const SHOP_PATHS = ["/shop"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Forward the pathname so server components / auth helpers can detect the route.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  const passthrough = () =>
    NextResponse.next({ request: { headers: requestHeaders } });

  // Dev bypass: skip all auth checks in development
  if (process.env.DEV_BYPASS === "true") {
    return passthrough();
  }

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return passthrough();
  }

  // Allow static/api assets
  if (pathname.startsWith("/_next") || pathname.startsWith("/api/auth") || pathname === "/") {
    return passthrough();
  }

  const session = await auth();

  if (!session?.user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = (session.user as any).role;

  // Admin routes: only platform_owner
  if (ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    if (role !== "platform_owner") {
      return NextResponse.redirect(new URL("/shop/dashboard", request.url));
    }
  }

  // Shop routes: any authenticated non-platform-owner
  if (SHOP_PATHS.some((p) => pathname.startsWith(p))) {
    if (role === "platform_owner") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    // Suspended shop check handled in layout
  }

  return passthrough();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
