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
  const text = await res.text().catch(() => '');
  let json = {};
  try { json = text ? JSON.parse(text) : {}; } catch (e) { json = {}; }
  if (!res.ok) {
    const errorMessage = json.error || text || `${res.status} ${res.statusText}`;
    throw new Error(errorMessage);
  }
  return json;
}

export function formatINR(n) {
  return '₹' + (n || 0).toLocaleString('en-IN');
}
