export const AUTH_COOKIE = 'auth_token';

export type UserRole = 'USER' | 'ADMIN';

function decodeBase64UrlJson(token: string): Record<string, unknown> | null {
  try {
    const segment = token.split('.')[1];
    if (!segment) return null;

    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function normalizeRole(value: unknown): UserRole | null {
  if (value === 'ADMIN' || value === 'USER') return value;
  if (typeof value === 'string') {
    const upper = value.toUpperCase();
    if (upper === 'ADMIN' || upper === 'USER') return upper;
  }
  return null;
}

export function decodeJwtRole(token: string): UserRole | null {
  const payload = decodeBase64UrlJson(token);
  if (!payload) return null;
  return normalizeRole(payload.role);
}

export const ADMIN_ROUTE_PREFIXES = [
  '/dashboard',
  '/users',
  '/challenges',
  '/missions',
  '/badges',
  '/fear-categories',
  '/skill-tree',
  '/announcements',
  '/feedback',
  '/support-tickets',
  '/audit-logs',
  '/app-versions',
] as const;

export const USER_ROUTE_PREFIXES = ['/my-dashboard'] as const;

export function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function isUserRoute(pathname: string): boolean {
  return USER_ROUTE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function defaultRouteForRole(role: UserRole): string {
  return role === 'ADMIN' ? '/dashboard' : '/my-dashboard';
}

export function resolvePostLoginRoute(accessToken: string, apiRole?: unknown): string {
  return defaultRouteForRole(decodeJwtRole(accessToken) ?? normalizeRole(apiRole) ?? 'USER');
}

export const AUTH_COOKIE_OPTIONS = {
  expires: 7,
  path: '/',
  sameSite: 'Lax' as const,
};
