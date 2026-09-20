'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Building2,
  FileText,
  Info,
  Layers3,
  Sparkles,
} from 'lucide-react';

interface Step0_AssetInfoProps {
  assetData: {
    asset_name: string;
    category: string;
    description: string;
    organization_type: string;
  };
  setAssetData: (data: any) => void;
  onNext: () => void;
}

export function Step0_AssetInfo({
  assetData,
  setAssetData,
  onNext,
}: Step0_AssetInfoProps) {
  const [errors, setErrors] = useState<{ asset_name?: string }>({});

  const handleNext = () => {
    const newErrors: { asset_name?: string } = {};

    if (!assetData.asset_name.trim()) {
      newErrors.asset_name = 'نام دارایی الزامی است';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onNext();
  };

  return (
    <div
      dir="rtl"
      className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white font-vazir shadow-[0_14px_45px_rgba(15,23,42,0.055)]"
    >
      {/* Header */}
      <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-l from-emerald-50/80 via-white to-white px-5 py-6 sm:px-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-emerald-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-44 w-44 rounded-full bg-blue-100/40 blur-3xl" />

        <div className="relative flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-dark-green text-white shadow-lg shadow-emerald-950/10">
            <Sparkles className="h-5 w-5" />
          </div>

          <div>
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-100/80 px-2.5 py-1 text-[9px] font-black text-emerald-700">
                مرحله آغازین
              </span>
              <span className="text-[10px] font-bold tracking-[0.12em] text-slate-400">
                ASSET PROFILE
              </span>
            </div>

            <h3 className="text-xl font-black text-slate-900 sm:text-2xl">
              اطلاعات پایه دارایی
            </h3>
            <p className="mt-1.5 max-w-2xl text-xs leading-6 text-slate-500">
              مشخصات اولیه دارایی را تکمیل کنید. این اطلاعات مبنای مراحل بعدی ارزیابی و ثبت نهایی خواهد بود.
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-7">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* Asset Name */}
          <div className="lg:col-span-2">
            <div
              className={`rounded-[22px] border p-4 transition-all ${
                errors.asset_name
                  ? 'border-rose-200 bg-rose-50/30'
                  : 'border-slate-200 bg-slate-50/35 focus-within:border-emerald-200 focus-within:bg-emerald-50/20'
              }`}
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <Label
                    htmlFor="asset_name"
                    className="text-xs font-black text-slate-700"
                  >
                    نام دارایی <span className="text-rose-500">*</span>
                  </Label>
                  <p className="mt-0.5 text-[9px] text-slate-400">
                    عنوان اصلی و قابل شناسایی دارایی
                  </p>
                </div>
              </div>

              <Input
                id="asset_name"
                value={assetData.asset_name}
                onChange={(e) => {
                  setAssetData({
                    ...assetData,
                    asset_name: e.target.value,
                  });
                  if (errors.asset_name) setErrors({});
                }}
                placeholder="مثال: سیستم مدیریت دانش"
                className={`h-12 rounded-xl bg-white px-4 text-sm font-bold shadow-none transition-all focus-visible:ring-2 focus-visible:ring-emerald-100 ${
                  errors.asset_name
                    ? 'border-rose-300 focus-visible:border-rose-400'
                    : 'border-slate-200 focus-visible:border-emerald-300'
                }`}
              />

              {errors.asset_name ? (
                <p className="mt-2 text-[10px] font-bold text-rose-600">
                  {errors.asset_name}
                </p>
              ) : (
                <p className="mt-2 flex items-center gap-1.5 text-[10px] leading-5 text-slate-400">
                  <Info className="h-3.5 w-3.5 shrink-0" />
                  نام انتخابی در کد یکتا و شناسایی این دارایی استفاده خواهد شد.
                </p>
              )}
            </div>
          </div>

          {/* Category */}
          <div className="rounded-[22px] border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Layers3 className="h-4 w-4" />
              </div>
              <div>
                <Label
                  htmlFor="category"
                  className="text-xs font-black text-slate-700"
                >
                  دسته‌بندی دارایی
                </Label>
                <p className="mt-0.5 text-[9px] text-slate-400">
                  جایگاه دارایی در ساختار سازمان
                </p>
              </div>
            </div>

            <Select
              value={assetData.category}
              onValueChange={(value) =>
                setAssetData({ ...assetData, category: value })
              }
            >
              <SelectTrigger className="h-12 w-full rounded-xl border-slate-200 bg-slate-50/50 px-4 text-xs font-bold shadow-none focus:ring-2 focus:ring-emerald-100">
                <SelectValue placeholder="انتخاب دسته‌بندی" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-white font-vazir">
                <SelectItem value="strategic_economic">
                  استراتژیک اقتصادی
                </SelectItem>
                <SelectItem value="strategic_knowledge">
                  استراتژیک دانشی
                </SelectItem>
                <SelectItem value="operational_economic">
                  عملیاتی اقتصادی
                </SelectItem>
                <SelectItem value="operational_knowledge">
                  عملیاتی دانشی
                </SelectItem>
                <SelectItem value="support_economic">
                  پشتیبانی اقتصادی
                </SelectItem>
                <SelectItem value="support_knowledge">
                  پشتیبانی دانشی
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Organization Type */}
          <div className="rounded-[22px] border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <Label
                  htmlFor="organization_type"
                  className="text-xs font-black text-slate-700"
                >
                  نوع سازمان <span className="text-rose-500">*</span>
                </Label>
                <p className="mt-0.5 text-[9px] text-slate-400">
                  ساختار فعالیت سازمان مالک دارایی
                </p>
              </div>
            </div>

            <Select
              value={assetData.organization_type}
              onValueChange={(value) =>
                setAssetData({
                  ...assetData,
                  organization_type: value,
                })
              }
            >
              <SelectTrigger className="h-12 w-full rounded-xl border-slate-200 bg-slate-50/50 px-4 text-xs font-bold shadow-none focus:ring-2 focus:ring-emerald-100">
                <SelectValue placeholder="انتخاب نوع سازمان" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-white font-vazir">
                <SelectItem value="manufacturing">تولیدی</SelectItem>
                <SelectItem value="service">خدماتی</SelectItem>
                <SelectItem value="rto">
                  RTO (پژوهش و فناوری)
                </SelectItem>
                <SelectItem value="holding">هلدینگ</SelectItem>
              </SelectContent>
            </Select>

            <div className="mt-3 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/60 p-2.5">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
              <p className="text-[9px] leading-5 text-blue-700">
                نوع سازمان بر وزن‌دهی و پیشنهاد قالب تأثیر می‌گذارد و در ثبت نهایی ذخیره می‌شود.
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="lg:col-span-2">
            <div className="rounded-[22px] border border-slate-200 bg-white p-4 transition-all focus-within:border-emerald-200 focus-within:shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <Label
                    htmlFor="description"
                    className="text-xs font-black text-slate-700"
                  >
                    توضیحات تکمیلی
                  </Label>
                  <p className="mt-1 text-[9px] text-slate-400">
                    برای ایجاد زمینه بهتر در مراحل ارزیابی
                  </p>
                </div>

                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-bold text-slate-400">
                  اختیاری
                </span>
              </div>

              <Textarea
                id="description"
                value={assetData.description}
                onChange={(e) =>
                  setAssetData({
                    ...assetData,
                    description: e.target.value,
                  })
                }
                placeholder="توضیحات تکمیلی درباره دارایی، کاربرد، اهمیت یا نقش آن در سازمان..."
                rows={4}
                className="min-h-[120px] resize-none rounded-xl border-slate-200 bg-slate-50/40 p-4 text-sm leading-7 shadow-none focus-visible:border-emerald-300 focus-visible:ring-2 focus-visible:ring-emerald-100"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span
              className={`h-2 w-2 rounded-full ${
                assetData.asset_name
                  ? 'bg-emerald-500'
                  : 'bg-slate-300'
              }`}
            />
            {assetData.asset_name
              ? 'اطلاعات اولیه آماده ادامه فرایند است'
              : 'برای ادامه، نام دارایی را وارد کنید'}
          </div>

          <Button
            className="group h-12 min-w-[180px] rounded-xl bg-dark-green px-6 font-black text-white shadow-lg shadow-emerald-950/10 transition-all hover:-translate-y-0.5 hover:bg-dark-green/90 hover:shadow-xl"
            onClick={handleNext}
          >
            شروع ارزیابی
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
