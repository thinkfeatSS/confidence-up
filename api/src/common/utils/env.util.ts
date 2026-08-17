/**
 * Read environment variables reliably on Hostinger hPanel and local .env.
 * - Trims whitespace
 * - Strips wrapping quotes (common when pasting into hPanel)
 * - Treats empty strings as unset
 */
export function readEnv(key: string): string | undefined {
  const raw = process.env[key];
  if (raw == null) return undefined;

  let value = raw.trim();
  if (!value) return undefined;

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  }

  return value || undefined;
}

export function readEnvBool(key: string, defaultValue = false): boolean {
  const value = readEnv(key);
  if (value === undefined) return defaultValue;
  const lower = value.toLowerCase();
  return lower === 'true' || lower === '1' || lower === 'yes' || lower === 'on';
}

export function readEnvInt(key: string, defaultValue: number): number {
  const value = readEnv(key);
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

/** PEM / multiline secrets pasted in hPanel with literal \n */
export function readEnvMultiline(key: string): string | undefined {
  const value = readEnv(key);
  if (!value) return undefined;
  return value.replace(/\\n/g, '\n');
}
