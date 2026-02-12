import { NextResponse } from "next/server";

/**
 * Middleware is currently in DEBUG MODE.
 * It allows all requests to pass through without authentication redirects
 * to help resolve infinite loop issues.
 */
export function middleware() {
  return NextResponse.next();
}

export const config = {
  // Apply middleware to all routes except static assets
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
