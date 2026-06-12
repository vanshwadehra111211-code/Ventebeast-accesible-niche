'use client';

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('vb_token');
}
export function setToken(t) { localStorage.setItem('vb_token', t); }
export function clearToken() { localStorage.removeItem('vb_token'); }

export async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`/api/${path}`, { ...options, headers, body: options.body ? JSON.stringify(options.body) : undefined });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Request failed');
  return json;
}

export function formatINR(n) {
  return '₹' + (n || 0).toLocaleString('en-IN');
}
