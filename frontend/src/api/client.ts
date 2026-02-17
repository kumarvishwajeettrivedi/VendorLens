import { Shortlist, HealthStatus, ShortlistFormData } from '../types';

const BASE = '/api';

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  createShortlist: (data: ShortlistFormData): Promise<Shortlist> =>
    req('/shortlist', { method: 'POST', body: JSON.stringify(data) }),

  getShortlist: (id: string): Promise<Shortlist> =>
    req(`/shortlist/${id}`),

  listShortlists: (): Promise<Shortlist[]> =>
    req('/shortlists'),

  excludeVendor: (id: string, vendorName: string): Promise<void> =>
    req(`/shortlist/${id}/exclude-vendor`, {
      method: 'POST',
      body: JSON.stringify({ vendor_name: vendorName }),
    }),

  includeVendor: (id: string, vendorName: string): Promise<void> =>
    req(`/shortlist/${id}/include-vendor`, {
      method: 'POST',
      body: JSON.stringify({ vendor_name: vendorName }),
    }),

  deleteShortlist: (id: string): Promise<void> =>
    req(`/shortlist/${id}`, { method: 'DELETE' }),

  getHealth: (): Promise<HealthStatus> =>
    req('/health'),
};
