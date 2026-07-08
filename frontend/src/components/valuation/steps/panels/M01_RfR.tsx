'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, FileText, X, Eye } from 'lucide-react';
import { useState } from 'react';

interface M01_RfRProps {
  formData: any;
  onChange: (data: any) => void;
  fieldsConfig?: any;
  assetId?: number;
  valuationCaseId?: number;
}

export function M01_RfR({ formData, onChange, fieldsConfig }: M01_RfRProps) {
  const [files, setFiles] = useState<Record<string, File>>({});

  const handleChange = (field: string, value: any) => {
    onChange({ [field]: value });
  };

  const handleFileUpload = (field: string, file: File | null) => {
    if (file) {
      setFiles(prev => ({ ...prev, [field]: file }));
      handleChange(field, file.name);
    }
  };

  const removeFile = (field: string) => {
    setFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[field];
      return newFiles;
    });
    handleChange(field, null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700">
          🔹 این روش برای ارزش‌گذاری برندها، علائم تجاری و IPهای قابل لیسانس استفاده می‌شود.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Royalty Rate */}
        <div className="space-y-1">
          <Label className="text-sm font-medium flex items-center gap-1">
            نرخ حق‌امتیاز <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              step="0.1"
              value={formData.royalty_rate || ''}
              onChange={(e) => handleChange('royalty_rate', parseFloat(e.target.value))}
              placeholder="مثلاً 4.0"
              className="focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-400">%</span>
          </div>
          <p className="text-xs text-gray-400">محدوده: ۰.۵% - ۱۰%</p>
        </div>

        {/* 2. Revenue Attribution */}
        <div className="space-y-1">
          <Label className="text-sm font-medium flex items-center gap-1">
            سهم درآمد منتسب <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              step="1"
              value={formData.revenue_attribution || ''}
              onChange={(e) => handleChange('revenue_attribution', parseFloat(e.target.value))}
              placeholder="مثلاً 80"
              className="focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-400">%</span>
          </div>
          <p className="text-xs text-gray-400">محدوده: ۰% - ۱۰۰%</p>
        </div>

        {/* 3. Revenue Growth Rate */}
        <div className="space-y-1">
          <Label className="text-sm font-medium flex items-center gap-1">
            نرخ رشد درآمد <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              step="0.1"
              value={formData.revenue_growth_rate || ''}
              onChange={(e) => handleChange('revenue_growth_rate', parseFloat(e.target.value))}
              placeholder="مثلاً 8.0"
              className="focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-400">%</span>
          </div>
          <p className="text-xs text-gray-400">محدوده: -۱۰% - ۳۰%</p>
        </div>

        {/* 4. Quality Multiplier */}
        <div className="space-y-1">
          <Label className="text-sm font-medium">ضریب کیفیت</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.quality_multiplier || ''}
            onChange={(e) => handleChange('quality_multiplier', parseFloat(e.target.value))}
            placeholder="مثلاً 0.92"
            className="focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400">محدوده: ۰.۵ - ۱.۰ • 🤖 خودکار از ارزیابی کیفی</p>
        </div>
      </div>

      {/* Readonly fields from STEP 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div>
          <p className="text-xs text-gray-400">افق پیش‌بینی</p>
          <p className="text-sm font-medium">۵ سال</p>
          <p className="text-[10px] text-gray-400">📥 از STEP 2</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">نرخ تنزیل</p>
          <p className="text-sm font-medium">۱۸%</p>
          <p className="text-[10px] text-gray-400">📥 از STEP 2</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">نرخ مالیات</p>
          <p className="text-sm font-medium">۲۵%</p>
          <p className="text-[10px] text-gray-400">📥 از STEP 2</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">نرخ رشد پایانی</p>
          <p className="text-sm font-medium">۵%</p>
          <p className="text-[10px] text-gray-400">📥 از STEP 2</p>
        </div>
      </div>

      {/* Evidence Section */}
      <div className="space-y-3 pt-4 border-t">
        <p className="text-sm font-medium">📎 شواهد و مدارک</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 border-2 border-dashed rounded-lg hover:border-blue-400 transition-colors">
            <Label className="text-sm">گزارش معیار حق‌امتیاز <span className="text-red-500">*</span></Label>
            {files.benchmark_report ? (
              <div className="flex items-center justify-between mt-2 p-2 bg-blue-50 rounded">
                <span className="text-sm truncate">{files.benchmark_report.name}</span>
                <button onClick={() => removeFile('benchmark_report')} className="text-red-500 hover:text-red-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="mt-2">
                <input
                  type="file"
                  id="benchmark_report"
                  className="hidden"
                  onChange={(e) => handleFileUpload('benchmark_report', e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="benchmark_report"
                  className="flex items-center gap-2 text-sm text-blue-600 cursor-pointer hover:text-blue-800"
                >
                  <Upload className="w-4 h-4" />
                  آپلود فایل
                </label>
              </div>
            )}
          </div>
          <div className="p-3 border-2 border-dashed rounded-lg hover:border-blue-400 transition-colors">
            <Label className="text-sm">فایل درآمد <span className="text-red-500">*</span></Label>
            {files.revenue_file ? (
              <div className="flex items-center justify-between mt-2 p-2 bg-blue-50 rounded">
                <span className="text-sm truncate">{files.revenue_file.name}</span>
                <button onClick={() => removeFile('revenue_file')} className="text-red-500 hover:text-red-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="mt-2">
                <input
                  type="file"
                  id="revenue_file"
                  className="hidden"
                  onChange={(e) => handleFileUpload('revenue_file', e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="revenue_file"
                  className="flex items-center gap-2 text-sm text-blue-600 cursor-pointer hover:text-blue-800"
                >
                  <Upload className="w-4 h-4" />
                  آپلود فایل
                </label>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
