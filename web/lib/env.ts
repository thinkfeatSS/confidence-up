/** Shared production API base (Hostinger) */
export const DEFAULT_API_BASE_URL =
  'http://binaryunit.tech/api/v1';

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_BASE_URL;
}
