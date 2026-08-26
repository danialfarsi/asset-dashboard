'use client';

import React, { useState, useMemo, useCallback, memo } from 'react';
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

// 🔥 تبدیل عدد به فارسی
const toPersianNumber = (num: number): string => {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return num.toString().replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};

// 🔥 کامپوننت AssetItem با React.memo
const AssetItem = memo(({ 
  asset, 
  isSelected, 
  onSelect 
}: { 
  asset: Asset; 
  isSelected: boolean; 
  onSelect: (uid: string) => void;
}) => {
  return (
    <div
      className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
        isSelected
          ? 'border-dark-green bg-dark-green/5 shadow-sm'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
      onClick={() => onSelect(asset.asset_uid)}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-dark-green text-sm font-vazir">
            {asset.asset_uid}
          </p>
          <p className="text-sm font-medium text-gray-800 font-vazir">
            {asset.asset_name}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-xs text-gray-400 font-vazir">
              نوع: {asset.asset_type?.name || 'نامشخص'}
            </span>
            <span className="text-xs text-gray-400 font-vazir">•</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-vazir ${
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
          variant={isSelected ? 'default' : 'outline'}
          className={`font-vazir ${
            isSelected
              ? 'bg-dark-green hover:bg-dark-green/90'
              : 'border-dark-green text-dark-green hover:bg-dark-green/10'
          }`}
        >
          {isSelected ? '✓ انتخاب شده' : 'انتخاب'}
        </Button>
      </div>
    </div>
  );
});
AssetItem.displayName = 'AssetItem';

export function Step1_SelectAsset({
  assets,
  selectedAsset,
  onAssetSelect,
  onNext,
}: Step1Props) {
  const [searchTerm, setSearchTerm] = useState('');

  // 🔥 کش کردن دارایی‌های منحصربه‌فرد
  const uniqueAssets = useMemo(() => {
    const map = new Map<string, Asset>();
    assets.forEach(asset => {
      if (!map.has(asset.asset_uid)) {
        map.set(asset.asset_uid, asset);
      }
    });
    return Array.from(map.values());
  }, [assets]);

  // 🔥 کش کردن دارایی‌های فیلتر شده
  const filteredAssets = useMemo(() => {
    if (!searchTerm.trim()) return uniqueAssets;
    
    const term = searchTerm.toLowerCase();
    return uniqueAssets.filter(asset =>
      asset.asset_uid.toLowerCase().includes(term) ||
      asset.asset_name.toLowerCase().includes(term) ||
      (asset.asset_type?.name || '').toLowerCase().includes(term)
    );
  }, [uniqueAssets, searchTerm]);

  // 🔥 کش کردن دارایی‌های گروه‌بندی شده
  const groupedAssets = useMemo(() => {
    return filteredAssets.reduce((acc, asset) => {
      const type = asset.asset_type?.name || 'سایر';
      if (!acc[type]) acc[type] = [];
      acc[type].push(asset);
      return acc;
    }, {} as Record<string, Asset[]>);
  }, [filteredAssets]);

  // 🔥 استفاده از useCallback برای توابع
  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleSelect = useCallback((assetUid: string) => {
    onAssetSelect(assetUid);
  }, [onAssetSelect]);

  const assetTypes = Object.keys(groupedAssets);

  return (
    <div className="space-y-6 font-vazir">
      {/* هدر مرحله */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="w-7 h-7 rounded-full bg-dark-green text-white flex items-center justify-center text-xs font-bold">
          {toPersianNumber(1)}
        </span>
        <span>مرحله {toPersianNumber(1)} از {toPersianNumber(7)}</span>
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
                onChange={handleSearch}
                className="pr-10 font-vazir"
              />
            </div>

            {/* نمایش تعداد */}
            <div className="text-xs text-gray-400 font-vazir">
              {toPersianNumber(filteredAssets.length)} دارایی منحصربه‌فرد
              {assets.length !== filteredAssets.length && 
                ` (از ${toPersianNumber(assets.length)} ارزیابی)`}
            </div>

            {/* گروه‌بندی دارایی‌ها */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {assetTypes.map((type) => (
                <div key={type}>
                  <p className="text-xs font-medium text-gray-400 mb-2 font-vazir">{type}</p>
                  <div className="space-y-2">
                    {groupedAssets[type].map((asset) => (
                      <AssetItem
                        key={asset.id}
                        asset={asset}
                        isSelected={selectedAsset?.id === asset.id}
                        onSelect={handleSelect}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {filteredAssets.length === 0 && (
                <div className="text-center py-8 text-gray-400 font-vazir">
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
                  <p className="text-xs text-gray-400 font-vazir">خلاصه دارایی</p>
                  <span className="text-xs bg-dark-green/10 text-dark-green px-2 py-0.5 rounded-full font-vazir">
                    انتخاب شده
                  </span>
                </div>

                <div>
                  <p className="text-sm text-gray-400 font-vazir">شناسه دارایی</p>
                  <p className="text-lg font-bold text-dark-green font-vazir">{selectedAsset.asset_uid}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-400 font-vazir">نام</p>
                  <p className="text-base font-medium font-vazir">{selectedAsset.asset_name}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-400 font-vazir">توضیحات</p>
                  <p className="text-sm text-gray-600 line-clamp-3 font-vazir">
                    {selectedAsset.description || 'توضیحی ثبت نشده است'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                  <div>
                    <p className="text-xs text-gray-400 font-vazir">نوع</p>
                    <p className="text-sm font-medium font-vazir">{selectedAsset.asset_type?.name || 'نامشخص'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-vazir">وضعیت</p>
                    <p className="text-sm font-medium text-emerald-600 font-vazir">فعال</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-vazir">تاریخ بروزرسانی</p>
                    <p className="text-sm font-vazir">{new Date(selectedAsset.created_at).toLocaleDateString('fa-IR')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-vazir">مالک</p>
                    <p className="text-sm font-vazir">سیستم</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-base font-medium font-vazir">هیچ دارایی انتخاب نشده است</p>
                <p className="text-sm mt-1 font-vazir">لطفاً از لیست سمت چپ یک دارایی را انتخاب کنید</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* دکمه ادامه */}
      <div className="flex items-center gap-3 pt-4 border-t">
        <Button
          className="bg-dark-green hover:bg-dark-green/90 flex items-center gap-2 font-vazir"
          onClick={onNext}
          disabled={!selectedAsset}
        >
          <ChevronLeft className="w-4 h-4" />
          ادامه
        </Button>
        {!selectedAsset && (
          <span className="text-xs text-gray-400 font-vazir">برای ادامه، یک دارایی را انتخاب کنید</span>
        )}
      </div>
    </div>
  );
}





