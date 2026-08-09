import { NextResponse, type NextRequest } from "next/server";

// Schneller Cookie-Check am Edge - die echte Session-Validierung (DB, 2FA)
// passiert serverseitig in src/lib/session.ts bei jedem Zugriff.
export function middleware(request: NextRequest) {
  if (!request.cookies.has("lost_session")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/plattform/:path*"],
};
