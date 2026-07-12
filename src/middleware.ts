import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!(session?.user?.email);
  const rol = (session?.user as any)?.rol;

  const isAuthRoute = nextUrl.pathname.startsWith("/auth");
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isProfesorRoute = nextUrl.pathname.startsWith("/profesores");

  if (isAuthRoute) {
    if (isLoggedIn && rol === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard/usuarios", nextUrl));
    }
    if (isLoggedIn && rol === "PROFESOR") {
      return NextResponse.redirect(new URL("/profesores/dashboard/notas", nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/login", nextUrl));
  }

  if (isAdminRoute && rol !== "ADMIN") {
    return NextResponse.redirect(new URL("/auth/login", nextUrl));
  }

  if (isProfesorRoute && rol !== "PROFESOR") {
    return NextResponse.redirect(new URL("/auth/login", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/profesores/:path*"],
};