/** Central API base + auth headers (keep in sync with AppContext session keys). */

export const SESSION_USER_KEY = 'sp_user';
export const SESSION_TOKEN_KEY = 'sp_token';

const API_BASE_URL = (() => {
  const fromEnv = import.meta.env.VITE_API_URL;
  if (fromEnv !== undefined && fromEnv !== '') {
    return String(fromEnv).replace(/\/$/, '');
  }
  if (import.meta.env.DEV) {
    return '';
  }
  return 'http://localhost:5000';
})();

export function apiPath(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${p}` : p;
}

/** Resolve uploaded file URLs for `<a href>` when API is on another origin. */
export function publicAssetUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return apiPath(path.startsWith('/') ? path : `/${path}`);
}

/** Socket.IO connects to the same origin as the API (Vite proxy in dev). */
export const SOCKET_URL = API_BASE_URL;

export function connectionErrorMessage(): string {
  return API_BASE_URL
    ? `Cannot reach the API at ${API_BASE_URL}. Is the backend running?`
    : 'Cannot reach the API (proxied to port 5000). Run `npm run server` in another terminal, then refresh.';
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getAuthHeaders(): HeadersInit {
  const t = getStoredToken();
  const h: Record<string, string> = {};
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}
