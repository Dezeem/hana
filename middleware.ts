import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/token";

const PUBLIC_ADMIN_PATHS = ["/admin/login"];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (PUBLIC_ADMIN_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (await verifySession(token)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  if (pathname !== "/admin") {
    url.searchParams.set("next", `${pathname}${search}`);
  }
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/admin"],
};
