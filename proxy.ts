import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, validSession } from "@/lib/admin/session";
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") return NextResponse.next();
  if (validSession(request.cookies.get(ADMIN_COOKIE)?.value)) return NextResponse.next();
  if (request.nextUrl.pathname.startsWith("/api/admin")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.redirect(new URL("/admin/login", request.url));
}
export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
