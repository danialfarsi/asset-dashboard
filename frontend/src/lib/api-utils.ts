import api from './api';

/**
 * دریافت همه آیتم‌ها از یک API با Pagination
 */
export async function fetchAllPaginated<T>(
  url: string,
  params?: Record<string, any>
): Promise<T[]> {
  let allItems: T[] = [];
  let nextPage: string | null = null;
  
  // ساخت URL با پارامترها
  const baseUrl = url;
  const queryParams = new URLSearchParams(params || {});
  queryParams.set('page_size', '100'); // حداکثر تعداد در هر صفحه
  
  let currentUrl = `${baseUrl}?${queryParams.toString()}`;
  
  try {
    while (currentUrl) {
      const { data } = await api.get(currentUrl);
      
      // استخراج آیتم‌ها (بسته به فرمت پاسخ API)
      const items = data.results || data || [];
      allItems = [...allItems, ...items];
      
      // بررسی صفحه بعدی
      nextPage = data.next || null;
      currentUrl = nextPage || '';
      
      console.log(`📥 دریافت ${items.length} آیتم، مجموع: ${allItems.length}`);
    }
  } catch (error) {
    console.error('❌ Error fetching paginated data:', error);
    // اگر خطا داشت، حداقل همان صفحه اول را برگردان
    const { data } = await api.get(`${baseUrl}?${queryParams.toString()}`);
    return data.results || data || [];
  }
  
  return allItems;
}

/**
 * دریافت همه دارایی‌های غربالگری شده
 */
export async function fetchAllScreenedAssets() {
  return fetchAllPaginated('/intangible/screened-assets/');
}

/**
 * دریافت همه ارزیابی‌ها با فیلتر status
 */
export async function fetchAllValuations(status?: string) {
  const params: Record<string, any> = {};
  if (status) {
    params.status = status;
  }
  return fetchAllPaginated('/intangible/asset-valuations/', params);
}
