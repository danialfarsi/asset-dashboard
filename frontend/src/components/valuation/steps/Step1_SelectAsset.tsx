'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, Search, Building2 } from 'lucide-react';

interface Asset {
  id: number;
  asset_name: string;
  asset_uid: string;
  asset_type?: { id: number; code: string; name: string };
  description: string;
  created_at: string;
  owner?: string;
  status?: string;
  last_updated?: string;
}

interface Step1Props {
  assets: Asset[];
  selectedAsset: Asset | null;
  selectedMethod: string;
  onAssetSelect: (assetId: string) => void;
  onMethodSelect: (methodId: string) => void;
  onNext: () => void;
  methods: { id: string; name: string; description: string; recommended: boolean }[];
}

export function Step1_SelectAsset({
  assets,
  selectedAsset,
  onAssetSelect,
  onNext,
}: Step1Props) {
  const [searchTerm, setSearchTerm] = useState('');

  // 🔥 گروه‌بندی بر اساس asset_uid (هر دارایی فقط یک بار)
  const uniqueAssetsMap = new Map<string, Asset>();
  assets.forEach(asset => {
    if (!uniqueAssetsMap.has(asset.asset_uid)) {
      uniqueAssetsMap.set(asset.asset_uid, asset);
    }
  });
  const uniqueAssets = Array.from(uniqueAssetsMap.values());

  const filteredAssets = uniqueAssets.filter(asset =>
    asset.asset_uid.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (asset.asset_type?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // گروه‌بندی دارایی‌ها بر اساس نوع
  const groupedAssets = filteredAssets.reduce((acc, asset) => {
    const type = asset.asset_type?.name || 'سایر';
    if (!acc[type]) acc[type] = [];
    acc[type].push(asset);
    return acc;
  }, {} as Record<string, Asset[]>);

  return (
    <div className="space-y-6">
      {/* هدر مرحله */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="w-7 h-7 rounded-full bg-dark-green text-white flex items-center justify-center text-xs font-bold">۱</span>
        <span>مرحله ۱ از ۷</span>
      </div>
      <h2 className="text-xl font-bold text-dark-green">انتخاب دارایی و روش ارزش‌گذاری</h2>

      {/* دو ستون */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ستون چپ: جستجو و لیست دارایی‌ها */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-5 space-y-4">
            {/* سرچ */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="جستجوی دارایی بر اساس شناسه، نام یا نوع..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>

            {/* نمایش تعداد */}
            <div className="text-xs text-gray-400">
              {filteredAssets.length} دارایی منحصربه‌فرد
              {assets.length !== filteredAssets.length && 
                ` (از ${assets.length} ارزیابی)`}
            </div>

            {/* گروه‌بندی دارایی‌ها */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {Object.entries(groupedAssets).map(([type, items]) => (
                <div key={type}>
                  <p className="text-xs font-medium text-gray-400 mb-2">{type}</p>
                  <div className="space-y-2">
                    {items.map((asset) => (
                      <div
                        key={asset.id}
                        className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                          selectedAsset?.id === asset.id
                            ? 'border-dark-green bg-dark-green/5 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => onAssetSelect(asset.asset_uid)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold text-dark-green text-sm">
                              {asset.asset_uid}
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {asset.asset_name}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="text-xs text-gray-400">
                                نوع: {asset.asset_type?.name || 'نامشخص'}
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                asset.status === 'Active' 
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
                                {asset.status || 'فعال'}
                              </span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant={selectedAsset?.id === asset.id ? 'default' : 'outline'}
                            className={`${
                              selectedAsset?.id === asset.id
                                ? 'bg-dark-green hover:bg-dark-green/90'
                                : 'border-dark-green text-dark-green hover:bg-dark-green/10'
                            }`}
                          >
                            {selectedAsset?.id === asset.id ? '✓ انتخاب شده' : 'انتخاب'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {filteredAssets.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p>هیچ دارایی با این جستجو یافت نشد</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ستون راست: خلاصه دارایی انتخاب شده */}
        <Card className={`border-0 shadow-lg ${selectedAsset ? 'border-r-4 border-r-dark-green' : ''}`}>
          <CardContent className="p-5">
            {selectedAsset ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">خلاصه دارایی</p>
                  <span className="text-xs bg-dark-green/10 text-dark-green px-2 py-0.5 rounded-full">
                    انتخاب شده
                  </span>
                </div>

                <div>
                  <p className="text-sm text-gray-400">شناسه دارایی</p>
                  <p className="text-lg font-bold text-dark-green">{selectedAsset.asset_uid}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-400">نام</p>
                  <p className="text-base font-medium">{selectedAsset.asset_name}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-400">توضیحات</p>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {selectedAsset.description || 'توضیحی ثبت نشده است'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                  <div>
                    <p className="text-xs text-gray-400">نوع</p>
                    <p className="text-sm font-medium">{selectedAsset.asset_type?.name || 'نامشخص'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">وضعیت</p>
                    <p className="text-sm font-medium text-emerald-600">فعال</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">تاریخ بروزرسانی</p>
                    <p className="text-sm">{new Date(selectedAsset.created_at).toLocaleDateString('fa-IR')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">مالک</p>
                    <p className="text-sm">سیستم</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-base font-medium">هیچ دارایی انتخاب نشده است</p>
                <p className="text-sm mt-1">لطفاً از لیست سمت چپ یک دارایی را انتخاب کنید</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* دکمه ادامه */}
      <div className="flex items-center gap-3 pt-4 border-t">
        <Button
          className="bg-dark-green hover:bg-dark-green/90 flex items-center gap-2"
          onClick={onNext}
          disabled={!selectedAsset}
        >
          <ChevronLeft className="w-4 h-4" />
          ادامه
        </Button>
        {!selectedAsset && (
          <span className="text-xs text-gray-400">برای ادامه، یک دارایی را انتخاب کنید</span>
        )}
      </div>
    </div>
  );
}
