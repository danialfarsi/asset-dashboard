'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Search, ChevronLeft, Filter, ShieldCheck } from 'lucide-react';
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
  asset_type_name: string | null;
  description: string;
  created_at: string;
  result: string;
  category: string;
  valuation_method: string | null;
  is_approved_for_protection?: boolean;
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
    queryKey: ['screened-assets', 'all'],
    queryFn: async () => {
      const response = await api.get('/intangible/screened-assets/', {
        params: { limit: 100 },
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

  // 🔥 فقط دارایی‌هایی که is_approved_for_protection = true
  const assetsWithProtection = useMemo(() => {
    if (!data?.results) return [];
    return data.results
      .filter((asset: ScreenedAsset) => asset.is_approved_for_protection === true)
      .map((asset: ScreenedAsset) => {
        const profile = protectionProfiles?.find(
          (p: any) => p.screening_template === asset.asset_type?.id
        );
        return { ...asset, protection_profile: profile || null };
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
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
            حفاظت و امنیت دارایی‌ها
          </h1>
          <p className="text-muted-foreground">
            دارایی‌هایی که تایید حفاظت شده‌اند و آماده طی فرآیند ۵ گام حفاظت هستند
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
              ابتدا مدیر باید دارایی‌های ارزش‌گذاری شده را برای حفاظت تایید کند
            </p>
            <Link href="/dashboard">
              <Button className="mt-4">بازگشت به داشبورد</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset: ScreenedAsset) => (
            <Card
              key={asset.id}
              className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-emerald-500/50"
              onClick={() => handleStartProtection(asset.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{asset.asset_name}</CardTitle>
                    <CardDescription className="text-xs">{asset.asset_uid}</CardDescription>
                  </div>
                  <Badge className="bg-emerald-500 text-white">
                    <ShieldCheck className="w-3 h-3 ml-1" />
                    تایید شده
                  </Badge>
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
                      <span className="text-muted-foreground">وضعیت حفاظت:</span>
                      <span className="font-medium">
                        {asset.protection_profile.status_display || 'شروع نشده'}
                      </span>
                    </div>
                  )}
                  <Button
                    className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white"
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
