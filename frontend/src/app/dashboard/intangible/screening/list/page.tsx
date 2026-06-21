'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Plus } from 'lucide-react';

interface ScreenedAsset {
  id: number;
  asset_uid: string;
  asset_name: string;
  category: string;
  result: string;
  result_label: string;
  discovery_date: string;
  version: string;
}

export default function ScreeningListPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<ScreenedAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];
        const response = await fetch('http://localhost:8000/api/intangible/screened-assets/', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setAssets(data.results || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, []);

  const handleView = (id: number) => {
    router.push(`/dashboard/intangible/screening/${id}`);
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'confirmed':
        return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">دارایی قطعی</span>;
      case 'conditional':
        return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">مشروط</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">رد شده</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="text-center py-10">در حال بارگذاری...</div>;
  }

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">دارایی‌های غربالگری شده</h1>
          <p className="text-sm text-gray-500 mt-1">لیست دارایی‌هایی که فرآیند غربالگری را طی کرده‌اند</p>
        </div>
        <Button onClick={() => router.push('/dashboard/intangible/screening')}>
          <Plus className="w-4 h-4 ml-2" />
          غربالگری جدید
        </Button>
      </div>

      {assets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-10 text-gray-500">
            هیچ دارایی غربالگری شده‌ای وجود ندارد.
            <br />
            <Button 
              variant="link" 
              className="text-blue-600"
              onClick={() => router.push('/dashboard/intangible/screening')}
            >
              شروع غربالگری جدید
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {assets.map((asset) => (
            <Card 
              key={asset.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleView(asset.id)}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-gray-500">{asset.asset_uid}</span>
                    <span className="font-medium">{asset.asset_name}</span>
                    {getResultBadge(asset.result)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    <span className="ml-3">دسته‌بندی: {asset.category}</span>
                    <span className="ml-3">نسخه: {asset.version}</span>
                    <span>تاریخ کشف: {new Date(asset.discovery_date).toLocaleDateString('fa-IR')}</span>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleView(asset.id);
                  }}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
