// src/lib/asset-api.ts
import { Asset, AssetListResponse, AssetFilters } from '@/types/asset';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

function getToken(): string | undefined {
  if (typeof document === 'undefined') return undefined; // SSR guard
  return document.cookie
    .split('; ')
    .find(r => r.startsWith('access_token='))
    ?.split('=')[1];
}

function headers(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

function buildParams(filters: AssetFilters): string {
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null && v !== '') {
      clean[k] = String(v);
    }
  }
  return new URLSearchParams(clean).toString();
}

export async function getAssets(filters: AssetFilters = {}): Promise<AssetListResponse> {
  const params = buildParams(filters);
  const res = await fetch(`${BASE}/api/assets/?${params}`, { headers: headers() });
  if (!res.ok) throw new Error('خطا در دریافت دارایی‌ها');
  return res.json();
}

export async function getAsset(id: number): Promise<Asset> {
  const res = await fetch(`${BASE}/api/assets/${id}/`, { headers: headers() });
  if (!res.ok) throw new Error('دارایی یافت نشد');
  return res.json();
}

export async function createAsset(data: Partial<Asset>): Promise<Asset> {
  const res = await fetch(`${BASE}/api/assets/`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('خطا در ثبت دارایی');
  return res.json();
}

export async function updateAsset(id: number, data: Partial<Asset>): Promise<Asset> {
  const res = await fetch(`${BASE}/api/assets/${id}/`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('خطا در ویرایش دارایی');
  return res.json();
}

export async function deleteAsset(id: number): Promise<void> {
  const res = await fetch(`${BASE}/api/assets/${id}/`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok) throw new Error('خطا در حذف دارایی');
}
export const assetApi = {
  getAll: getAssets,
  getAssets,
  getAsset,
  createAsset,
  updateAsset,
  deleteAsset,
};
