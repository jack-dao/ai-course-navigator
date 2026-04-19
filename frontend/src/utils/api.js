export const API_BASE =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:3000' : '');

export function apiFetch(path, options = {}) {
  return fetch(`${API_BASE}${path}`, options);
}

export function authFetch(path, session, options = {}) {
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${session.access_token}`,
    },
  });
}
