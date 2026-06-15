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
  asset_code: string;
  status: AssetStatus;
  category: AssetCategory;
  location?: AssetLocation;
  purchase_date?: string;
  purchase_price?: number;
  current_value?: number;
  created_at: string;
  updated_at: string;
}

export interface AssetWritePayload {
  name?: string;
  asset_code?: string;
  status?: AssetStatus;
  category_id?: number;
  location_id?: number;
  purchase_date?: string;
  purchase_price?: number;
  current_value?: number;
}

export interface AssetListResponse {
  results: Asset[];
  count: number;
  next?: string | null;
  previous?: string | null;
}

export interface AssetFilters {
  status?: AssetStatus;
  category?: number;
  search?: string;
  page?: number;
}