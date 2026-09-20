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
      className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-4 transition-all duration-300 ${
        isSelected
          ? 'border-dark-green/30 bg-gradient-to-l from-dark-green/[0.07] to-emerald-50/40 shadow-[0_8px_24px_rgba(1,83,69,0.08)]'
          : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-dark-green/20 hover:shadow-[0_8px_24px_rgba(15,23,42,0.07)]'
      }`}
      onClick={() => onSelect(asset.asset_uid)}
    >
      {isSelected && <div className="absolute right-0 top-0 h-full w-1 bg-dark-green" />}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black tracking-wide text-dark-green font-vazir">
            {asset.asset_uid}
          </p>
          <p className="mt-1 text-sm font-extrabold text-slate-800 font-vazir">
            {asset.asset_name}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400 font-vazir">
              نوع: {asset.asset_type?.name || 'نامشخص'}
            </span>
            <span className="text-[11px] text-slate-400 font-vazir">•</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-vazir ${
              asset.status === 'Active' 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}>
              {asset.status || 'فعال'}
            </span>
          </div>
        </div>
        <Button
          size="sm"
          variant={isSelected ? 'default' : 'outline'}
          className={`h-9 shrink-0 rounded-xl px-3 text-xs font-bold font-vazir ${
            isSelected
              ? 'bg-dark-green text-white shadow-md hover:bg-dark-green/90'
              : 'border-slate-200 bg-white text-dark-green hover:border-dark-green/30 hover:bg-dark-green/5'
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
    <div dir="rtl" className="space-y-6 font-vazir">
      {/* Hero / Step header */}
      <div className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white px-5 py-5 shadow-[0_10px_35px_rgba(15,23,42,0.05)] sm:px-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-dark-green/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-emerald-100/50 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-dark-green text-white shadow-lg shadow-emerald-950/10">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="mb-1.5 flex items-center gap-2 text-xs font-medium text-slate-400">
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-dark-green/10 px-2 font-bold text-dark-green">
                  {toPersianNumber(1)}
                </span>
                <span>مرحله {toPersianNumber(1)} از {toPersianNumber(7)}</span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                انتخاب دارایی و روش ارزش‌گذاری
              </h2>
              <p className="mt-1 text-xs leading-6 text-slate-500 sm:text-sm">
                دارایی موردنظر را از فهرست انتخاب کنید تا اطلاعات آن برای ادامه فرآیند آماده شود.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3.5 py-2 text-xs font-bold text-dark-green sm:self-auto">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
            {toPersianNumber(uniqueAssets.length)} دارایی در دسترس
          </div>
        </div>
      </div>

      {/* Main workspace */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        {/* Asset browser */}
        <Card className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.055)]">
          <CardContent className="p-0">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-base font-black text-slate-900">فهرست دارایی‌ها</p>
                  <p className="mt-1 text-xs text-slate-400">
                    بر اساس شناسه، نام یا نوع دارایی جستجو کنید
                  </p>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-500">
                  {toPersianNumber(filteredAssets.length)} نتیجه
                </div>
              </div>

              <div className="relative mt-4">
                <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="جستجوی دارایی..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 pr-11 text-sm shadow-none transition-all placeholder:text-slate-400 focus-visible:border-dark-green/40 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-dark-green/10"
                />
              </div>

              {assets.length !== filteredAssets.length && (
                <p className="mt-2 text-[11px] text-slate-400">
                  نمایش {toPersianNumber(filteredAssets.length)} مورد از {toPersianNumber(assets.length)} ارزیابی
                </p>
              )}
            </div>

            <div className="max-h-[520px] space-y-5 overflow-y-auto p-4 sm:p-5">
              {assetTypes.map((type) => (
                <div key={type}>
                  <div className="mb-2.5 flex items-center gap-2 px-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-dark-green" />
                    <p className="text-xs font-extrabold text-slate-500">{type}</p>
                    <div className="h-px flex-1 bg-slate-100" />
                    <span className="text-[10px] font-bold text-slate-400">
                      {toPersianNumber(groupedAssets[type].length)}
                    </span>
                  </div>

                  <div className="space-y-2.5">
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
                <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 px-6 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <Search className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-bold text-slate-600">دارایی‌ای پیدا نشد</p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">عبارت جستجو را تغییر دهید و دوباره امتحان کنید.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Selected asset summary */}
        <Card className={`relative overflow-hidden rounded-[28px] border bg-white shadow-[0_12px_40px_rgba(15,23,42,0.055)] ${
          selectedAsset ? 'border-dark-green/20' : 'border-slate-200/80'
        }`}>
          <CardContent className="p-0">
            {selectedAsset ? (
              <div>
                <div className="relative overflow-hidden border-b border-dark-green/10 bg-gradient-to-bl from-dark-green/[0.08] via-white to-emerald-50/60 px-5 py-6 sm:px-6">
                  <div className="pointer-events-none absolute -left-12 -top-12 h-36 w-36 rounded-full bg-emerald-200/30 blur-3xl" />
                  <div className="relative">
                    <div className="mb-5 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">دارایی انتخاب‌شده</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-[11px] font-extrabold text-emerald-700 shadow-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        انتخاب شده
                      </span>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-dark-green text-white shadow-lg shadow-emerald-950/10">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-400">شناسه دارایی</p>
                        <p dir="ltr" className="mt-0.5 text-right text-lg font-black tracking-tight text-dark-green">
                          {selectedAsset.asset_uid}
                        </p>
                        <h3 className="mt-2 text-lg font-black leading-7 text-slate-900">
                          {selectedAsset.asset_name}
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-5 p-5 sm:p-6">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                    <p className="mb-2 text-[11px] font-extrabold text-slate-400">توضیحات دارایی</p>
                    <p className="text-sm leading-7 text-slate-600">
                      {selectedAsset.description || 'توضیحی برای این دارایی ثبت نشده است.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400">نوع دارایی</p>
                      <p className="mt-1.5 text-sm font-extrabold text-slate-700">
                        {selectedAsset.asset_type?.name || 'نامشخص'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                      <p className="text-[10px] font-bold text-slate-400">وضعیت</p>
                      <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-extrabold text-emerald-700">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        فعال
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400">تاریخ بروزرسانی</p>
                      <p className="mt-1.5 text-sm font-extrabold text-slate-700">
                        {new Date(selectedAsset.created_at).toLocaleDateString('fa-IR')}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400">مالک</p>
                      <p className="mt-1.5 text-sm font-extrabold text-slate-700">سیستم</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-dark-green/10 bg-dark-green/[0.035] px-4 py-3">
                    <p className="text-xs leading-6 text-slate-500">
                      این دارایی برای ادامه فرآیند ارزش‌گذاری انتخاب شده است. با انتخاب «ادامه» وارد مرحله بعد می‌شوید.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[520px] flex-col items-center justify-center px-8 text-center">
                <div className="relative mb-5">
                  <div className="absolute inset-0 scale-150 rounded-full bg-dark-green/10 blur-2xl" />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-[26px] border border-dark-green/10 bg-dark-green/[0.06] text-dark-green">
                    <Building2 className="h-8 w-8" />
                  </div>
                </div>
                <p className="text-lg font-black text-slate-700">هنوز دارایی انتخاب نشده</p>
                <p className="mt-2 max-w-[280px] text-sm leading-7 text-slate-400">
                  از فهرست دارایی‌ها یک مورد را انتخاب کنید تا جزئیات آن در این بخش نمایش داده شود.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom action bar */}
      <div className="sticky bottom-4 z-20 rounded-[22px] border border-slate-200/80 bg-white/90 p-3 shadow-[0_14px_45px_rgba(15,23,42,0.12)] backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 px-1">
            <div className={`h-2.5 w-2.5 rounded-full ${selectedAsset ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            <div>
              <p className="text-xs font-extrabold text-slate-600">
                {selectedAsset ? 'دارایی آماده ادامه است' : 'یک دارایی انتخاب کنید'}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-400">
                {selectedAsset ? selectedAsset.asset_name : 'برای فعال شدن دکمه ادامه، انتخاب دارایی الزامی است.'}
              </p>
            </div>
          </div>

          <Button
            className="h-11 min-w-[145px] rounded-xl bg-dark-green px-6 font-bold text-white shadow-lg shadow-emerald-950/10 transition-all hover:-translate-y-0.5 hover:bg-dark-green/90 hover:shadow-xl disabled:translate-y-0 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
            onClick={onNext}
            disabled={!selectedAsset}
          >
            ادامه
            <ChevronLeft className="mr-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
