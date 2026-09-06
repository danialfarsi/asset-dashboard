'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Search, ChevronLeft, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const toPersianNumber = (num: number): string => {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return num.toString().replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};

interface ScreenedAsset {
  id: number;
  asset_name: string;
  asset_uid: string;
  asset_type: { id: number; code: string; name: string } | null;
  asset_type_name: string | null;  // 🔥 فیلد جدید
  description: string;
  created_at: string;
  result: string;
  category: string;
  valuation_method: string | null;
  protection_profile?: {
    id: number;
    archetype: string;
    archetype_display: string;
    status: string;
    status_display: string;
    protection_score: number;
  } | null;
}

export default function ProtectionListPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['screened-assets', 'valuation-completed'],
    queryFn: async () => {
      const response = await api.get('/intangible/screened-assets/', {
        params: {
          limit: 100,
        },
      });
      return response.data;
    },
  });

  const { data: protectionProfiles } = useQuery({
    queryKey: ['protection-profiles'],
    queryFn: async () => {
      const response = await api.get('/intangible/protection/');
      return response.data.results || [];
    },
    enabled: !!data,
  });

  const assetsWithProtection = useMemo(() => {
    if (!data?.results) return [];
    
    return data.results.map((asset: ScreenedAsset) => {
      const profile = protectionProfiles?.find(
        (p: any) => p.screening_template === asset.asset_type?.id
      );
      return {
        ...asset,
        protection_profile: profile || null,
      };
    });
  }, [data, protectionProfiles]);

  const filteredAssets = useMemo(() => {
    let result = assetsWithProtection;
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (asset: ScreenedAsset) =>
          asset.asset_name.toLowerCase().includes(term) ||
          asset.asset_uid.toLowerCase().includes(term) ||
          (asset.asset_type_name || '').toLowerCase().includes(term)
      );
    }
    
    if (filterStatus === 'completed') {
      result = result.filter((a: ScreenedAsset) => a.protection_profile?.status === 'approved');
    } else if (filterStatus === 'in_progress') {
      result = result.filter(
        (a: ScreenedAsset) =>
          a.protection_profile?.status === 'in_progress' || a.protection_profile?.status === 'draft'
      );
    } else if (filterStatus === 'pending') {
      result = result.filter((a: ScreenedAsset) => !a.protection_profile);
    }
    
    return result;
  }, [assetsWithProtection, searchTerm, filterStatus]);

  const handleStartProtection = (assetId: number) => {
    router.push(`/dashboard/intangible/protection/${assetId}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">بارگذاری...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-red-500">خطا در بارگذاری داده‌ها</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 font-vazir">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/intangible">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">حفاظت و امنیت دارایی‌ها</h1>
          <p className="text-muted-foreground">
            دارایی‌های ارزش‌گذاری شده‌ای که نیاز به فرآیند حفاظت دارند
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="جستجوی دارایی..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm bg-white"
          >
            <option value="all">همه</option>
            <option value="completed">تکمیل شده</option>
            <option value="in_progress">در حال انجام</option>
            <option value="pending">شروع نشده</option>
          </select>
        </div>
        <div className="text-sm text-muted-foreground">
          {toPersianNumber(filteredAssets.length)} دارایی
        </div>
      </div>

      {filteredAssets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium">هیچ دارایی برای حفاظت یافت نشد</h3>
            <p className="text-muted-foreground mt-2">
              ابتدا یک دارایی را ارزش‌گذاری کنید تا فرآیند حفاظت شروع شود
            </p>
            <Link href="/dashboard/intangible/valuation">
              <Button className="mt-4">شروع ارزش‌گذاری</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset: ScreenedAsset) => (
            <Card
              key={asset.id}
              className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-dark-green/50"
              onClick={() => handleStartProtection(asset.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{asset.asset_name}</CardTitle>
                    <CardDescription className="text-xs">{asset.asset_uid}</CardDescription>
                  </div>
                  {asset.protection_profile ? (
                    <Badge
                      variant={
                        asset.protection_profile.status === 'approved'
                          ? 'default'
                          : asset.protection_profile.status === 'in_progress'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {asset.protection_profile.status_display}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-500 border-amber-500">
                      شروع نشده
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">نوع:</span>
                    <span>{asset.asset_type_name || 'نامشخص'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">روش ارزش‌گذاری:</span>
                    <span>{asset.valuation_method || 'نامشخص'}</span>
                  </div>
                  {asset.protection_profile && (
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">امتیاز حفاظت:</span>
                      <span className="font-medium">
                        {asset.protection_profile.protection_score || 0}
                      </span>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="w-full mt-2 border-dark-green text-dark-green hover:bg-dark-green/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartProtection(asset.id);
                    }}
                  >
                    {asset.protection_profile ? 'ادامه فرآیند' : 'شروع حفاظت'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
