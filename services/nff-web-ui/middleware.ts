import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for token in both cookies and localStorage (via headers)
  const cookieToken = request.cookies.get("auth-token")?.value;
  const headerToken = request.headers
    .get("authorization")
    ?.replace("Bearer ", "");
  const token = cookieToken || headerToken;

  const publicRoutes = ["/login"];
  const isPublicRoute = publicRoutes.includes(pathname);

  const protectedRoutes = [
    "/dashboard",
    "/profile",
    "/settings",
    "/reports",
    "/jobs",
    "/monitoring",
  ];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!token && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (token && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!token && pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
