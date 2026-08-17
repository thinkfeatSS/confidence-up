import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  decodeJwtRole,
  defaultRouteForRole,
  isAdminRoute,
  AUTH_COOKIE,
} from '@/lib/auth';

const PUBLIC_PATHS = [
  '/',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/login',
  '/forgot-password',
  '/robots.txt',
  '/sitemap.xml',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || (p !== '/' && pathname.startsWith(`${p}/`)),
  );
}

function getToken(request: NextRequest): string | undefined {
  return (
    request.cookies.get(AUTH_COOKIE)?.value ??
    request.cookies.get('admin_token')?.value
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = getToken(request);
  const role = token ? decodeJwtRole(token) : null;
  const isAuthPage =
    pathname.startsWith('/login') || pathname.startsWith('/forgot-password');

  if (isPublicPath(pathname)) {
    if (token && isAuthPage) {
      return NextResponse.redirect(
        new URL(defaultRouteForRole(role ?? 'USER'), request.url),
      );
    }
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAdminRoute(pathname) && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/my-dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public|og).*)'],
};
