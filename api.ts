const AUTH_TOKEN_KEY = 'kaamconnect_auth_token';
const CSRF_TOKEN_KEY = 'kaamconnect_csrf_token';

function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, val: string | null) {
  try {
    if (val) {
      localStorage.setItem(key, val);
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    // ignore storage errors
  }
}

let csrfTokenStore: string | null = readStored(CSRF_TOKEN_KEY);
let authTokenStore: string | null = readStored(AUTH_TOKEN_KEY);

export function setApiCsrfToken(token: string | null) {
  csrfTokenStore = token;
  writeStored(CSRF_TOKEN_KEY, token);
}

export function setApiAuthToken(token: string | null) {
  authTokenStore = token;
  writeStored(AUTH_TOKEN_KEY, token);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  if (authTokenStore && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${authTokenStore}`);
  }
  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && csrfTokenStore) {
    headers.set('X-CSRF-Token', csrfTokenStore);
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const text = await res.text();
  let data: any = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (!res.ok) {
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status);
  }

  return data as T;
}
