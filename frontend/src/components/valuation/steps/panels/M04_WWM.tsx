'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Upload, X, FileText } from 'lucide-react';

interface FCFRow {
  id: number;
  year: number;
  amount: number;
}

interface ExpertSignoff {
  id: number;
  expert_name: string;
  signature_date: string;
  notes: string;
}

interface M04_WWMProps {
  formData: any;
  onChange: (data: any) => void;
  fieldsConfig?: any;
}

export function M04_WWM({ formData, onChange }: M04_WWMProps) {
  const [files, setFiles] = useState<Record<string, File>>({});

  // 🔥 داده‌های با دارایی
  const withAssetRows: FCFRow[] = formData.with_asset_fcf || [
    { id: 1, year: 1, amount: 0 },
    { id: 2, year: 2, amount: 0 },
    { id: 3, year: 3, amount: 0 },
    { id: 4, year: 4, amount: 0 },
    { id: 5, year: 5, amount: 0 },
  ];

  // 🔥 داده‌های بدون دارایی
  const withoutAssetRows: FCFRow[] = formData.without_asset_fcf || [
    { id: 1, year: 1, amount: 0 },
    { id: 2, year: 2, amount: 0 },
    { id: 3, year: 3, amount: 0 },
    { id: 4, year: 4, amount: 0 },
    { id: 5, year: 5, amount: 0 },
  ];

  // 🔥 تأیید خبرگان
  const expertSignoffs: ExpertSignoff[] = formData.expert_signoffs || [];

  const handleChange = (field: string, value: any) => {
    onChange({ [field]: value });
  };

  // ============================================
  // توابع جدول FCF
  // ============================================
  const updateFCFRow = (
    rows: FCFRow[],
    setter: (rows: FCFRow[]) => void,
    id: number,
    field: string,
    value: any
  ) => {
    const newRows = rows.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    );
    setter(newRows);
  };

  const addFCFRow = (rows: FCFRow[], setter: (rows: FCFRow[]) => void) => {
    const maxYear = rows.reduce((max, row) => Math.max(max, row.year), 0);
    const newRow: FCFRow = {
      id: Date.now(),
      year: maxYear + 1,
      amount: 0,
    };
    setter([...rows, newRow]);
  };

  const removeFCFRow = (rows: FCFRow[], setter: (rows: FCFRow[]) => void, id: number) => {
    if (rows.length <= 1) {
      alert('حداقل یک ردیف باید وجود داشته باشد');
      return;
    }
    setter(rows.filter(row => row.id !== id));
  };

  // ============================================
  // توابع تأیید خبرگان
  // ============================================
  const addExpertSignoff = () => {
    const newSignoff: ExpertSignoff = {
      id: Date.now(),
      expert_name: '',
      signature_date: '',
      notes: '',
    };
    handleChange('expert_signoffs', [...expertSignoffs, newSignoff]);
  };

  const updateExpertSignoff = (id: number, field: string, value: string) => {
    const newSignoffs = expertSignoffs.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    );
    handleChange('expert_signoffs', newSignoffs);
  };

  const removeExpertSignoff = (id: number) => {
    handleChange('expert_signoffs', expertSignoffs.filter(s => s.id !== id));
  };

  // ============================================
  // محاسبات
  // ============================================
  const calculateTotalWith = () => {
    return withAssetRows.reduce((sum, row) => sum + (row.amount || 0), 0);
  };

  const calculateTotalWithout = () => {
    return withoutAssetRows.reduce((sum, row) => sum + (row.amount || 0), 0);
  };

  const calculateIncrementalValue = () => {
    return calculateTotalWith() - calculateTotalWithout();
  };

  // ============================================
  // آپلود فایل
  // ============================================
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
      {/* توضیحات */}
      <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
        <p className="text-sm text-teal-700">
          🔹 روش با و بدون دارایی (WWM) - تفاوت ارزش دارایی را با مقایسه سناریوهای با و بدون دارایی محاسبه می‌کند.
          <span className="inline-block mr-2 px-2 py-0.5 bg-teal-200 text-teal-800 rounded-full text-xs font-medium">
            ⭐ ۱۱ دارایی
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ======================================== */}
        {/* ستون چپ: با دارایی */}
        {/* ======================================== */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-1">
            جدول FCF با دارایی <span className="text-red-500">*</span>
          </Label>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-teal-50">
                  <th className="border p-2 text-right">سال</th>
                  <th className="border p-2 text-right">مبلغ FCF (IRR)</th>
                  <th className="border p-2 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {withAssetRows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="border p-1">
                      <Input
                        type="number"
                        value={row.year || ''}
                        onChange={(e) => {
                          const newRows = withAssetRows.map(r =>
                            r.id === row.id ? { ...r, year: parseInt(e.target.value) || 0 } : r
                          );
                          handleChange('with_asset_fcf', newRows);
                        }}
                        className="h-8 text-sm border-0 focus:ring-1"
                        placeholder="سال"
                      />
                    </td>
                    <td className="border p-1">
                      <Input
                        type="number"
                        value={row.amount || ''}
                        onChange={(e) => {
                          const newRows = withAssetRows.map(r =>
                            r.id === row.id ? { ...r, amount: parseFloat(e.target.value) || 0 } : r
                          );
                          handleChange('with_asset_fcf', newRows);
                        }}
                        className="h-8 text-sm border-0 focus:ring-1"
                        placeholder="۰"
                      />
                    </td>
                    <td className="border p-1 text-center">
                      <button
                        onClick={() => {
                          if (withAssetRows.length <= 1) return;
                          const newRows = withAssetRows.filter(r => r.id !== row.id);
                          handleChange('with_asset_fcf', newRows);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const maxYear = withAssetRows.reduce((max, r) => Math.max(max, r.year), 0);
              const newRow: FCFRow = { id: Date.now(), year: maxYear + 1, amount: 0 };
              handleChange('with_asset_fcf', [...withAssetRows, newRow]);
            }}
            className="flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            افزودن ردیف
          </Button>
          <p className="text-xs text-gray-400">* حداقل ۱ ردیف الزامی</p>
        </div>

        {/* ======================================== */}
        {/* ستون راست: بدون دارایی */}
        {/* ======================================== */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-1">
            جدول FCF بدون دارایی <span className="text-red-500">*</span>
          </Label>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-teal-50">
                  <th className="border p-2 text-right">سال</th>
                  <th className="border p-2 text-right">مبلغ FCF (IRR)</th>
                  <th className="border p-2 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {withoutAssetRows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="border p-1">
                      <Input
                        type="number"
                        value={row.year || ''}
                        onChange={(e) => {
                          const newRows = withoutAssetRows.map(r =>
                            r.id === row.id ? { ...r, year: parseInt(e.target.value) || 0 } : r
                          );
                          handleChange('without_asset_fcf', newRows);
                        }}
                        className="h-8 text-sm border-0 focus:ring-1"
                        placeholder="سال"
                      />
                    </td>
                    <td className="border p-1">
                      <Input
                        type="number"
                        value={row.amount || ''}
                        onChange={(e) => {
                          const newRows = withoutAssetRows.map(r =>
                            r.id === row.id ? { ...r, amount: parseFloat(e.target.value) || 0 } : r
                          );
                          handleChange('without_asset_fcf', newRows);
                        }}
                        className="h-8 text-sm border-0 focus:ring-1"
                        placeholder="۰"
                      />
                    </td>
                    <td className="border p-1 text-center">
                      <button
                        onClick={() => {
                          if (withoutAssetRows.length <= 1) return;
                          const newRows = withoutAssetRows.filter(r => r.id !== row.id);
                          handleChange('without_asset_fcf', newRows);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const maxYear = withoutAssetRows.reduce((max, r) => Math.max(max, r.year), 0);
              const newRow: FCFRow = { id: Date.now(), year: maxYear + 1, amount: 0 };
              handleChange('without_asset_fcf', [...withoutAssetRows, newRow]);
            }}
            className="flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            افزودن ردیف
          </Button>
          <p className="text-xs text-gray-400">* حداقل ۱ ردیف الزامی</p>
        </div>
      </div>

      {/* ======================================== */}
      {/* پارامترهای اضافی */}
      {/* ======================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-sm font-medium flex items-center gap-1">
            دوره رشد (ماه) <span className="text-red-500">*</span>
          </Label>
          <Input
            type="number"
            value={formData.ramp_up_period || ''}
            onChange={(e) => handleChange('ramp_up_period', parseInt(e.target.value) || 0)}
            placeholder="مثلاً ۱۲"
            className="focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium flex items-center gap-1">
            سهم درآمد منتسب <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              step="0.1"
              value={formData.revenue_attribution || ''}
              onChange={(e) => handleChange('revenue_attribution', parseFloat(e.target.value) || 0)}
              placeholder="مثلاً ۸۰"
              className="focus:ring-2 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-400">%</span>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium flex items-center gap-1">
            نرخ رشد درآمد <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              step="0.1"
              value={formData.revenue_growth_rate || ''}
              onChange={(e) => handleChange('revenue_growth_rate', parseFloat(e.target.value) || 0)}
              placeholder="مثلاً ۸"
              className="focus:ring-2 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-400">%</span>
          </div>
        </div>
      </div>

      {/* ======================================== */}
      {/* فیلدهای از STEP 2 */}
      {/* ======================================== */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
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
      </div>

      {/* ======================================== */}
      {/* خلاصه محاسبه */}
      {/* ======================================== */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm font-medium mb-3">📊 خلاصه محاسبه</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-2 bg-white rounded-lg border">
            <p className="text-xs text-gray-400">جمع FCF با دارایی</p>
            <p className="text-sm font-bold text-teal-600">{calculateTotalWith().toLocaleString()}</p>
          </div>
          <div className="p-2 bg-white rounded-lg border">
            <p className="text-xs text-gray-400">جمع FCF بدون دارایی</p>
            <p className="text-sm font-bold text-red-500">{calculateTotalWithout().toLocaleString()}</p>
          </div>
          <div className="p-2 bg-teal-50 rounded-lg border border-teal-200">
            <p className="text-xs text-gray-400">ارزش افزایشی</p>
            <p className="text-lg font-bold text-teal-700">{calculateIncrementalValue().toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* ======================================== */}
      {/* تأیید خبرگان */}
      {/* ======================================== */}
      <div className="space-y-3 pt-4 border-t">
        <Label className="text-sm font-medium">تأیید خبرگان (اختیاری)</Label>
        {expertSignoffs.length === 0 ? (
          <div className="text-center py-4 text-gray-400 border-2 border-dashed rounded-lg">
            <p className="text-sm">هیچ خبره‌ای ثبت نشده است</p>
            <p className="text-xs">برای افزودن خبره روی دکمه کلیک کنید</p>
          </div>
        ) : (
          <div className="space-y-2">
            {expertSignoffs.map((signoff) => (
              <div key={signoff.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <Input
                    value={signoff.expert_name}
                    onChange={(e) => updateExpertSignoff(signoff.id, 'expert_name', e.target.value)}
                    placeholder="نام خبره"
                    className="h-8 text-sm"
                  />
                  <Input
                    type="date"
                    value={signoff.signature_date}
                    onChange={(e) => updateExpertSignoff(signoff.id, 'signature_date', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeExpertSignoff(signoff.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={addExpertSignoff}
          className="flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          افزودن خبره
        </Button>
      </div>

      {/* ======================================== */}
      {/* شواهد */}
      {/* ======================================== */}
      <div className="space-y-3 pt-4 border-t">
        <p className="text-sm font-medium">📎 شواهد و مدارک</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 border-2 border-dashed rounded-lg hover:border-teal-400 transition-colors">
            <Label className="text-sm">گزارش تحلیل سناریو</Label>
            {files.scenario_report ? (
              <div className="flex items-center justify-between mt-2 p-2 bg-teal-50 rounded">
                <span className="text-sm truncate">{files.scenario_report.name}</span>
                <button onClick={() => removeFile('scenario_report')} className="text-red-500 hover:text-red-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="mt-2">
                <input
                  type="file"
                  id="scenario_report"
                  className="hidden"
                  onChange={(e) => handleFileUpload('scenario_report', e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="scenario_report"
                  className="flex items-center gap-2 text-sm text-teal-600 cursor-pointer hover:text-teal-800"
                >
                  <Upload className="w-4 h-4" />
                  آپلود فایل
                </label>
              </div>
            )}
          </div>
          <div className="p-3 border-2 border-dashed rounded-lg hover:border-teal-400 transition-colors">
            <Label className="text-sm">تأییدیه خبرگان</Label>
            {files.expert_approval ? (
              <div className="flex items-center justify-between mt-2 p-2 bg-teal-50 rounded">
                <span className="text-sm truncate">{files.expert_approval.name}</span>
                <button onClick={() => removeFile('expert_approval')} className="text-red-500 hover:text-red-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="mt-2">
                <input
                  type="file"
                  id="expert_approval"
                  className="hidden"
                  onChange={(e) => handleFileUpload('expert_approval', e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="expert_approval"
                  className="flex items-center gap-2 text-sm text-teal-600 cursor-pointer hover:text-teal-800"
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
