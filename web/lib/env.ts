/** Shared production API base (Hostinger) */
export const DEFAULT_API_BASE_URL =
  'https://pink-nightingale-973118.hostingersite.com/api/v1';

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_BASE_URL;
}
