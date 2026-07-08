'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Upload, X } from 'lucide-react';
import { useState } from 'react';

interface LaborRow {
  id: number;
  role: string;
  person_days: number;
  daily_rate: number;
}

interface M06_RPCMProps {
  formData: any;
  onChange: (data: any) => void;
  fieldsConfig?: any;
  assetId?: number;
  valuationCaseId?: number;
}

export function M06_RPCM({ formData, onChange }: M06_RPCMProps) {
  const [files, setFiles] = useState<Record<string, File>>({});
  
  const laborRows: LaborRow[] = formData.labor_breakdown || [
    { id: 1, role: 'توسعه‌دهنده', person_days: 180, daily_rate: 800000 },
    { id: 2, role: 'تست‌کننده', person_days: 90, daily_rate: 600000 },
    { id: 3, role: 'تحلیلگر', person_days: 120, daily_rate: 700000 },
  ];

  const handleChange = (field: string, value: any) => {
    onChange({ [field]: value });
  };

  const updateLaborRow = (id: number, field: string, value: any) => {
    const newRows = laborRows.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    );
    handleChange('labor_breakdown', newRows);
  };

  const addLaborRow = () => {
    const newRow: LaborRow = {
      id: Date.now(),
      role: '',
      person_days: 0,
      daily_rate: 0,
    };
    handleChange('labor_breakdown', [...laborRows, newRow]);
  };

  const removeLaborRow = (id: number) => {
    if (laborRows.length <= 1) {
      alert('حداقل یک ردیف باید وجود داشته باشد');
      return;
    }
    handleChange('labor_breakdown', laborRows.filter(row => row.id !== id));
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

  // محاسبه خودکار هزینه کل نیروی کار
  const calculateTotalLaborCost = () => {
    return laborRows.reduce((acc, row) => {
      return acc + (row.person_days * row.daily_rate);
    }, 0);
  };

  // محاسبه ارزش نهایی
  const calculateFinalValue = () => {
    const directCost = formData.direct_reproduction_cost || 0;
    const laborCost = calculateTotalLaborCost();
    const totalDirect = directCost + laborCost;
    const overhead = 1 + (formData.coordination_overhead || 0) / 100;
    const obsolescence = 1 - (formData.relevance_obsolescence || 0) / 100;
    const ageFactor = 1 - (formData.age_factor || 0) / 100;
    
    return totalDirect * overhead * obsolescence * ageFactor;
  };

  return (
    <div className="space-y-6">
      <div className="bg-rose-50 p-4 rounded-lg border border-rose-200">
        <p className="text-sm text-rose-700">
          🔹 این روش برای ارزش‌گذاری دارایی‌هایی که نیاز به بازتولید دقیق دارند استفاده می‌شود.
          <span className="inline-block mr-2 px-2 py-0.5 bg-rose-200 text-rose-800 rounded-full text-xs font-medium">
            M-06 | Reproduction Cost
          </span>
        </p>
      </div>

      {/* 1. Labor Breakdown Table */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-1">
          جدول نیروی کار <span className="text-red-500">*</span>
        </Label>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border p-2 text-right">نقش</th>
                <th className="border p-2 text-right">نفر-روز</th>
                <th className="border p-2 text-right">نرخ روزانه (IRR)</th>
                <th className="border p-2 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {laborRows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="border p-1">
                    <Input
                      value={row.role}
                      onChange={(e) => updateLaborRow(row.id, 'role', e.target.value)}
                      className="h-8 text-sm border-0 focus:ring-1"
                      placeholder="نقش"
                    />
                  </td>
                  <td className="border p-1">
                    <Input
                      type="number"
                      value={row.person_days || ''}
                      onChange={(e) => updateLaborRow(row.id, 'person_days', parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm border-0 focus:ring-1"
                      placeholder="۰"
                    />
                  </td>
                  <td className="border p-1">
                    <Input
                      type="number"
                      value={row.daily_rate || ''}
                      onChange={(e) => updateLaborRow(row.id, 'daily_rate', parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm border-0 focus:ring-1"
                      placeholder="۰"
                    />
                  </td>
                  <td className="border p-1 text-center">
                    <button
                      onClick={() => removeLaborRow(row.id)}
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
        <Button variant="outline" size="sm" onClick={addLaborRow} className="flex items-center gap-1">
          <Plus className="w-4 h-4" />
          افزودن ردیف
        </Button>
        <p className="text-xs text-gray-400">* حداقل ۱ ردیف الزامی</p>
      </div>

      {/* 2. Direct Reproduction Cost */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-sm font-medium flex items-center gap-1">
            هزینه مستقیم بازتولید <span className="text-red-500">*</span>
          </Label>
          <Input
            type="number"
            value={formData.direct_reproduction_cost || ''}
            onChange={(e) => handleChange('direct_reproduction_cost', parseFloat(e.target.value) || 0)}
            placeholder="مثلاً 500,000,000"
            className="focus:ring-2 focus:ring-rose-500"
          />
        </div>

        {/* 3. Coordination Overhead */}
        <div className="space-y-1">
          <Label className="text-sm font-medium">سربار هماهنگی</Label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              step="0.5"
              value={formData.coordination_overhead || ''}
              onChange={(e) => handleChange('coordination_overhead', parseFloat(e.target.value) || 0)}
              placeholder="۲۰"
              className="focus:ring-2 focus:ring-rose-500"
            />
            <span className="text-sm text-gray-400">%</span>
          </div>
        </div>

        {/* 4. Relevance Obsolescence (Auto) */}
        <div className="space-y-1">
          <Label className="text-sm font-medium">منسوخی مرتبط</Label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              step="0.5"
              value={formData.relevance_obsolescence || ''}
              disabled
              className="bg-gray-50 focus:ring-2 focus:ring-rose-500"
              placeholder="۰"
            />
            <span className="text-sm text-gray-400">%</span>
            <span className="text-xs text-rose-600">🤖 خودکار</span>
          </div>
        </div>

        {/* 5. Age Factor */}
        <div className="space-y-1">
          <Label className="text-sm font-medium">ضریب سن</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.age_factor || ''}
            onChange={(e) => handleChange('age_factor', parseFloat(e.target.value) || 0)}
            placeholder="۰.۹۰"
            className="focus:ring-2 focus:ring-rose-500"
          />
        </div>
      </div>

      {/* 6. Last Review Date */}
      <div className="space-y-1">
        <Label className="text-sm font-medium">تاریخ آخرین بازنگری</Label>
        <Input
          type="date"
          value={formData.last_review_date || ''}
          onChange={(e) => handleChange('last_review_date', e.target.value)}
          className="focus:ring-2 focus:ring-rose-500"
        />
      </div>

      {/* Summary Card */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm font-medium mb-3">📊 خلاصه محاسبه</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div className="p-2 bg-white rounded-lg border">
            <p className="text-xs text-gray-400">هزینه نیروی کار</p>
            <p className="text-sm font-bold text-rose-600">{calculateTotalLaborCost().toLocaleString()}</p>
          </div>
          <div className="p-2 bg-white rounded-lg border">
            <p className="text-xs text-gray-400">هزینه مستقیم</p>
            <p className="text-sm font-bold text-rose-600">
              {(formData.direct_reproduction_cost || 0).toLocaleString()}
            </p>
          </div>
          <div className="p-2 bg-white rounded-lg border">
            <p className="text-xs text-gray-400">مجموع مستقیم</p>
            <p className="text-sm font-bold text-rose-600">
              {(calculateTotalLaborCost() + (formData.direct_reproduction_cost || 0)).toLocaleString()}
            </p>
          </div>
          <div className="p-2 bg-rose-50 rounded-lg border border-rose-200">
            <p className="text-xs text-gray-400">ارزش نهایی</p>
            <p className="text-lg font-bold text-rose-700">{Math.round(calculateFinalValue()).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
