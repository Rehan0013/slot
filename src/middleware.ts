import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "./lib/session";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Define public paths
  const isPublicPath = path === "/login";

  // Get session cookie
  const sessionCookie = request.cookies.get("session")?.value;
  let session = null;
  if (sessionCookie) {
    session = await decrypt(sessionCookie);
  }

  // Redirect logic
  if (isPublicPath && session) {
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }

  if (!isPublicPath && !session) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
