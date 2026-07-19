import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// 로그인 필요한 경로들
const protectedRoutes = ["/dashboard", "/projects"];

// 로그인 했으면 가면 안 되는 경로들 (이미 로그인한 사람이 로그인 페이지 가는 거 방지)
const authRoutes = ["/sign-in", "/sign-up"];

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // 로그인 안 했는데 보호된 경로 접근 → 로그인 페이지로
  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // 로그인 했는데 로그인/회원가입 페이지 접근 → 메인으로
  if (isAuthRoute && sessionCookie) {
    const hasInvite = request.nextUrl.searchParams.has("invite");
    if (!hasInvite) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};