/** Strip trailing slash so `https://app.com/` matches browser Origin `https://app.com` */
export function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, '');
}

function parseOriginList(raw?: string): string[] {
  if (!raw?.trim()) return [];
  return [...new Set(raw.split(',').map(normalizeOrigin).filter(Boolean))];
}

export interface CorsOptions {
  allowedOrigins: string[];
  allowVercelPreviews: boolean;
  allowLocalhost: boolean;
}

export function buildCorsOptions(env: NodeJS.ProcessEnv = process.env): CorsOptions {
  const fromList = parseOriginList(env.CORS_ALLOWED_ORIGINS);
  const fromFrontend = parseOriginList(env.FRONTEND_URL);
  const allowedOrigins = [...new Set([...fromList, ...fromFrontend])];

  const nodeEnv = env.NODE_ENV ?? 'development';
  const allowVercelPreviews =
    env.CORS_ALLOW_VERCEL_PREVIEWS === 'true' ||
    (env.CORS_ALLOW_VERCEL_PREVIEWS !== 'false' && nodeEnv !== 'production');

  const allowLocalhost = nodeEnv !== 'production' || env.CORS_ALLOW_LOCALHOST === 'true';

  return { allowedOrigins, allowVercelPreviews, allowLocalhost };
}

function isLocalhostOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '10.0.2.2';
  } catch {
    return false;
  }
}

/** Android emulator reaches host machine via 10.0.2.2 */
function isVercelPreviewOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
}

function isHostingerOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return hostname.endsWith('.hostingersite.com');
  } catch {
    return false;
  }
}

export function isOriginAllowed(origin: string, options: CorsOptions): boolean {
  const normalized = normalizeOrigin(origin);

  if (options.allowedOrigins.includes(normalized)) {
    return true;
  }

  if (isHostingerOrigin(origin)) {
    return true;
  }

  if (options.allowVercelPreviews && isVercelPreviewOrigin(origin)) {
    return true;
  }

  if (options.allowLocalhost && isLocalhostOrigin(origin)) {
    return true;
  }

  return false;
}

/**
 * Dynamic CORS origin check for NestJS / express cors.
 * Native mobile apps typically send no Origin header — allow those requests.
 */
export function createCorsOriginDelegate(options: CorsOptions) {
  return (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (isOriginAllowed(origin, options)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  };
}
