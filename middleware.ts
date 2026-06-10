import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect all dashboard routes
  const isDashboardRoute =
    pathname.startsWith("/showcase") ||
    pathname.startsWith("/submit") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/access-requests");

  if (isDashboardRoute) {
    const session = await auth();
    if (!session?.user) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/showcase/:path*",
    "/submit/:path*",
    "/profile/:path*",
    "/access-requests/:path*",
  ],
};
