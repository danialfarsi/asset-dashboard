// src/types/asset.ts
export type AssetStatus = 'active' | 'inactive' | 'maintenance' | 'disposed';

export interface AssetCategory {
  id: number;
  name: string;
}

export interface AssetLocation {
  id: number;
  name: string;
}

export interface Asset {
  id: number;
  name: string;
  asset_code: string;      // بجای code
  status: AssetStatus;
  category: AssetCategory; // بجای string
  location?: AssetLocation; // بجای string
  purchase_date?: string;
  purchase_price?: number;
  current_value?: number;
  created_at: string;
  updated_at: string;
}

export interface AssetListResponse {
  results: Asset[]
  count: number
  next?: string | null
  previous?: string | null
}

export interface AssetFilters {
  status?: AssetStatus;
  category?: number;  // ID برای فیلتر
  search?: string;
  page?: number;
}
