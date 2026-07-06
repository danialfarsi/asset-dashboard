'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import { fetchAllScreenedAssets } from '@/lib/api-utils';
import { toPersianDate } from '@/lib/date-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Eye, Search, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface ScreenedAsset {
  id: number;
  asset_name: string;
  asset_uid: string;
  category: string;
  result: string;
  description: string;
  notes: string;
  created_at: string;
  created_by_name: string;
  organization_name: string;
  department_name: string;
}

export default function ScreenedAssetsListPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [assets, setAssets] = useState<ScreenedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      
      console.log('📥 دریافت همه دارایی‌های غربالگری شده...');
      
      // 🔥 استفاده از تابع جدید برای دریافت همه
      const allAssets = await fetchAllScreenedAssets();
      
      setAssets(allAssets);
      setTotalCount(allAssets.length);
      console.log(`✅ ${allAssets.length} دارایی دریافت شد`);
      
    } catch (error) {
      console.error('❌ Error fetching assets:', error);
    } finally {
      if (showRefresh) setRefreshing(false);
      else setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAssets(true);
  };

  const handleAssetClick = (assetId: number) => {
    console.log('🔍 Clicked asset ID:', assetId);
    router.push(`/dashboard/intangible/assets/${assetId}`);
  };

  const getResultBadge = (result: string) => {
    const colors = {
      confirmed: 'bg-green-100 text-green-800',
      conditional: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
    };
    const labels = {
      confirmed: 'دارایی قطعی',
      conditional: 'مشروط',
      rejected: 'رد شده',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[result as keyof typeof colors] || 'bg-gray-100'}`}>
        {labels[result as keyof typeof labels] || result}
      </span>
    );
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      strategic_economic: 'استراتژیک - اقتصادی',
      strategic_social: 'استراتژیک - اجتماعی',
      strategic_knowledge: 'استراتژیک - دانشی',
      strategic_cultural: 'استراتژیک - فرهنگی',
      strategic_environmental: 'استراتژیک - زیست‌محیطی',
      operational_economic: 'عملیاتی - اقتصادی',
      operational_social: 'عملیاتی - اجتماعی',
      operational_knowledge: 'عملیاتی - دانشی',
      operational_cultural: 'عملیاتی - فرهنگی',
      operational_environmental: 'عملیاتی - زیست‌محیطی',
      support_economic: 'پشتیبان - اقتصادی',
      support_social: 'پشتیبان - اجتماعی',
      support_knowledge: 'پشتیبان - دانشی',
      support_cultural: 'پشتیبان - فرهنگی',
      support_environmental: 'پشتیبان - زیست‌محیطی',
    };
    return labels[category] || category;
  };

  const filteredAssets = assets.filter(asset =>
    asset.asset_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.asset_uid?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-500">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">دارایی‌های غربالگری شده</h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalCount} دارایی غربالگری شده
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'در حال به‌روزرسانی...' : 'به‌روزرسانی'}
          </Button>
          <Link href="/dashboard/intangible/screening/new">
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              غربالگری جدید
            </Button>
          </Link>
        </div>
      </div>

      {/* جستجو */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="جستجو در دارایی‌ها..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pr-10 pl-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* لیست دارایی‌ها */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAssets.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-gray-500">
            <p>هیچ دارایی غربالگری شده‌ای یافت نشد</p>
            <Link href="/dashboard/intangible/screening/new" className="text-primary hover:underline mt-2 inline-block">
              اولین دارایی را غربالگری کنید
            </Link>
          </div>
        ) : (
          filteredAssets.map((asset) => (
            <Card 
              key={asset.id} 
              className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer"
              onClick={() => handleAssetClick(asset.id)}
            >
              <CardHeader className="flex flex-row items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base">{asset.asset_name}</CardTitle>
                  <p className="text-xs text-gray-500">{asset.asset_uid}</p>
                </div>
                {getResultBadge(asset.result)}
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                    {getCategoryLabel(asset.category)}
                  </span>
                  {asset.organization_name && (
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                      {asset.organization_name}
                    </span>
                  )}
                  {asset.department_name && (
                    <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs">
                      {asset.department_name}
                    </span>
                  )}
                </div>
                
                {asset.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{asset.description}</p>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t">
                  <span>ایجاد شده توسط: {asset.created_by_name || 'نامشخص'}</span>
                  <span>{toPersianDate(asset.created_at)}</span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full flex items-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAssetClick(asset.id);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                    مشاهده جزئیات
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      {/* نمایش تعداد کل */}
      {totalCount > 0 && (
        <div className="text-center text-sm text-gray-400 border-t pt-4">
          نمایش {filteredAssets.length} از {totalCount} دارایی
          {searchTerm && ` (فیلتر شده)`}
        </div>
      )}
    </div>
  );
}
