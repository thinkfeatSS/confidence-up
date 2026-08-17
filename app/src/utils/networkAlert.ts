import { parseApiError } from './apiError';

/** True when the global offline modal should handle the error (skip local Alert). */
export function isNetworkError(err: unknown): boolean {
  return parseApiError(err).isNetworkError === true;
}
