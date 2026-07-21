// frontend/src/components/discovery/steps/Step0_AssetInfo.tsx

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

export function Step0_AssetInfo({ assetData, setAssetData, onNext }: Step0_AssetInfoProps) {
  const [errors, setErrors] = useState<{ asset_name?: string }>({});

  const handleNext = () => {
    // اعتبارسنجی
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
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-dark-green">🔍 اطلاعات دارایی</h3>
        <p className="text-sm text-gray-500 mt-1">
          لطفاً اطلاعات پایه دارایی را وارد کنید. این اطلاعات در مرحله آخر برای ثبت استفاده می‌شود.
        </p>
      </div>

      <div className="space-y-4">
        {/* نام دارایی */}
        <div>
          <Label htmlFor="asset_name" className="text-sm font-medium">
            نام دارایی <span className="text-red-500">*</span>
          </Label>
          <Input
            id="asset_name"
            value={assetData.asset_name}
            onChange={(e) => {
              setAssetData({ ...assetData, asset_name: e.target.value });
              if (errors.asset_name) setErrors({});
            }}
            placeholder="مثال: سیستم مدیریت دانش"
            className={errors.asset_name ? 'border-red-500' : ''}
          />
          {errors.asset_name && (
            <p className="text-sm text-red-500 mt-1">{errors.asset_name}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            نامی که برای این دارایی انتخاب می‌کنید، در کد یکتا و شناسایی آن استفاده خواهد شد.
          </p>
        </div>

        {/* دسته‌بندی */}
        <div>
          <Label htmlFor="category" className="text-sm font-medium">
            دسته‌بندی
          </Label>
          <Select
            value={assetData.category}
            onValueChange={(value) => setAssetData({ ...assetData, category: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="انتخاب دسته‌بندی" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="strategic_economic">استراتژیک اقتصادی</SelectItem>
              <SelectItem value="strategic_knowledge">استراتژیک دانشی</SelectItem>
              <SelectItem value="operational_economic">عملیاتی اقتصادی</SelectItem>
              <SelectItem value="operational_knowledge">عملیاتی دانشی</SelectItem>
              <SelectItem value="support_economic">پشتیبانی اقتصادی</SelectItem>
              <SelectItem value="support_knowledge">پشتیبانی دانشی</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* نوع سازمان */}
        <div>
          <Label htmlFor="organization_type" className="text-sm font-medium">
            نوع سازمان
          </Label>
          <Select
            value={assetData.organization_type}
            onValueChange={(value) => setAssetData({ ...assetData, organization_type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="انتخاب نوع سازمان" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manufacturing">تولیدی</SelectItem>
              <SelectItem value="service">خدماتی</SelectItem>
              <SelectItem value="rto">RTO (پژوهش و فناوری)</SelectItem>
              <SelectItem value="holding">هلدینگ</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-400 mt-1">
            نوع سازمان بر وزن‌دهی و پیشنهاد قالب تأثیر می‌گذارد.
          </p>
        </div>

        {/* توضیحات */}
        <div>
          <Label htmlFor="description" className="text-sm font-medium">
            توضیحات (اختیاری)
          </Label>
          <Textarea
            id="description"
            value={assetData.description}
            onChange={(e) => setAssetData({ ...assetData, description: e.target.value })}
            placeholder="توضیحات تکمیلی درباره دارایی..."
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button
          className="bg-dark-green hover:bg-dark-green/90"
          onClick={handleNext}
        >
          شروع ارزیابی
        </Button>
      </div>
    </div>
  );
}