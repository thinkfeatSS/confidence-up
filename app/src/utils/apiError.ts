export type ApiError = {
  statusCode: number;
  message: string;
  isNetworkError?: boolean;
};

const AUTH_MESSAGES: Record<number, string> = {
  401: 'Invalid email or password. Please try again.',
  403: 'Please verify your email before signing in.',
};

/** Turn axios / API errors into user-friendly messages */
export function parseApiError(err: unknown, fallback = 'Something went wrong. Please try again.'): ApiError {
  if (!err || typeof err !== 'object') {
    return { statusCode: 0, message: fallback };
  }

  const e = err as Record<string, unknown>;

  if (typeof e.message === 'string' && typeof e.statusCode === 'number' && e.statusCode > 0) {
    return {
      statusCode: e.statusCode,
      message: e.message,
      isNetworkError: e.isNetworkError === true,
    };
  }

  const axiosResponse = e.response as { status?: number; data?: { message?: string | string[] } } | undefined;
  if (axiosResponse?.data) {
    const raw = axiosResponse.data.message;
    const message = Array.isArray(raw) ? raw.join(', ') : raw;
    if (message) {
      return {
        statusCode: axiosResponse.status ?? 0,
        message: typeof message === 'string' ? message : fallback,
        isNetworkError: false,
      };
    }
  }

  const code = e.code as string | undefined;
  const axiosMessage = e.message as string | undefined;
  const isNetwork =
    !axiosResponse &&
    (code === 'ERR_NETWORK' ||
      code === 'ECONNABORTED' ||
      axiosMessage === 'Network Error' ||
      (typeof axiosMessage === 'string' && axiosMessage.includes('Network request failed')));

  if (isNetwork) {
    return {
      statusCode: 0,
      message: 'No internet connection. Check your network and try again.',
      isNetworkError: true,
    };
  }

  if (axiosMessage?.includes('status code 401')) {
    return { statusCode: 401, message: AUTH_MESSAGES[401] };
  }

  if (axiosMessage) {
    return {
      statusCode: axiosResponse?.status ?? 0,
      message: axiosMessage,
    };
  }

  return { statusCode: 0, message: fallback };
}

export function getAuthErrorMessage(err: unknown, mode: 'login' | 'register'): string {
  const parsed = parseApiError(
    err,
    mode === 'register' ? 'Registration failed.' : 'Login failed.',
  );
  if (parsed.statusCode === 401 && mode === 'login') {
    return AUTH_MESSAGES[401];
  }
  return parsed.message;
}
