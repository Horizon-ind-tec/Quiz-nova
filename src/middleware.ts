import { NextResponse } from "next/server";

/**
 * Middleware simplified for debugging.
 * All automatic navigation and redirects are disabled.
 */
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json).*)',
  ],
};
