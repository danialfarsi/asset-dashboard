import api from './api';

interface ValuationItem {
  id: number;
  asset: number;
  status: string;
  final_score: number;
  answers?: any[];
  [key: string]: any;
}

interface ScreenedAssetItem {
  id: number;
  asset_name: string;
  asset_uid: string;
  result: string;
  category: string;
  [key: string]: any;
}

/**
 * دریافت همه آیتم‌ها از یک API با Pagination
 */
export async function fetchAllPaginated<T>(
  url: string,
  params?: Record<string, any>
): Promise<T[]> {
  let allItems: T[] = [];
  let nextPage: string | null = null;
  
  const queryParams = new URLSearchParams(params || {});
  queryParams.set('page_size', '100');
  
  let currentUrl = `${url}?${queryParams.toString()}`;
  
  try {
    while (currentUrl) {
      const { data } = await api.get(currentUrl);
      const items = data.results || data || [];
      allItems = [...allItems, ...items];
      nextPage = data.next || null;
      currentUrl = nextPage || '';
      console.log(`📥 دریافت ${items.length} آیتم، مجموع: ${allItems.length}`);
    }
  } catch (error) {
    console.error('❌ Error fetching paginated data:', error);
    const { data } = await api.get(`${url}?${queryParams.toString()}`);
    return data.results || data || [];
  }
  
  return allItems;
}

/**
 * دریافت همه دارایی‌های غربالگری شده
 */
export async function fetchAllScreenedAssets(): Promise<ScreenedAssetItem[]> {
  return fetchAllPaginated<ScreenedAssetItem>('/intangible/screened-assets/');
}

/**
 * دریافت همه ارزیابی‌ها با فیلتر status
 */
export async function fetchAllValuations(status?: string): Promise<ValuationItem[]> {
  const params: Record<string, any> = {};
  if (status) {
    params.status = status;
  }
  return fetchAllPaginated<ValuationItem>('/intangible/asset-valuations/', params);
}
