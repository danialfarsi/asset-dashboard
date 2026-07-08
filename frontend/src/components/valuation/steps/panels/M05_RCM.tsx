'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, X, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface LaborRow {
  id: number;
  role: string;
  person_months: number;
  monthly_rate: number;
  overhead_pct: number;
}

interface M05_RCMProps {
  formData: any;
  onChange: (data: any) => void;
  fieldsConfig?: any;
}

export function M05_RCM({ formData, onChange }: M05_RCMProps) {
  const [files, setFiles] = useState<Record<string, File>>({});
  
  const laborRows: LaborRow[] = formData.labor_breakdown || [
    { id: 1, role: 'توسعه‌دهنده', person_months: 24, monthly_rate: 2000000, overhead_pct: 20 },
    { id: 2, role: 'تست‌کننده', person_months: 12, monthly_rate: 1500000, overhead_pct: 20 },
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
      person_months: 0,
      monthly_rate: 0,
      overhead_pct: 20,
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

  const calculateTotalCost = () => {
    let total = 0;
    laborRows.forEach(row => {
      const laborCost = row.person_months * row.monthly_rate;
      const withOverhead = laborCost * (1 + row.overhead_pct / 100);
      total += withOverhead;
    });
    total += formData.material_infra_cost || 0;
    return total;
  };

  const calculateFinalValue = () => {
    const total = calculateTotalCost();
    const withOverhead = total * (1 + (formData.overhead_pct || 20) / 100);
    const withProfit = withOverhead * (1 + (formData.developer_profit_pct || 15) / 100);
    const functionalObs = (formData.functional_obs_pct || 0) / 100;
    const economicObs = (formData.economic_obs_pct || 0) / 100;
    return withProfit * (1 - functionalObs) * (1 - economicObs);
  };

  return (
    <div className="space-y-6">
      <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
        <p className="text-sm text-emerald-700">
          🔹 این روش برای ارزش‌گذاری نرم‌افزارها، سیستم‌ها و فرآیندهای قابل جایگزینی استفاده می‌شود.
          <span className="inline-block mr-2 px-2 py-0.5 bg-emerald-200 text-emerald-800 rounded-full text-xs font-medium">
            ⭐ پرکاربردترین روش
          </span>
        </p>
      </div>

      {/* Labor Breakdown Table */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-1">
          جدول نیروی کار <span className="text-red-500">*</span>
        </Label>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border p-2 text-right">نقش</th>
                <th className="border p-2 text-right">نفر-ماه</th>
                <th className="border p-2 text-right">نرخ ماهانه (IRR)</th>
                <th className="border p-2 text-right">سربار (%)</th>
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
                      value={row.person_months || ''}
                      onChange={(e) => updateLaborRow(row.id, 'person_months', parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm border-0 focus:ring-1"
                      placeholder="۰"
                    />
                  </td>
                  <td className="border p-1">
                    <Input
                      type="number"
                      value={row.monthly_rate || ''}
                      onChange={(e) => updateLaborRow(row.id, 'monthly_rate', parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm border-0 focus:ring-1"
                      placeholder="۰"
                    />
                  </td>
                  <td className="border p-1">
                    <Input
                      type="number"
                      value={row.overhead_pct || ''}
                      onChange={(e) => updateLaborRow(row.id, 'overhead_pct', parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm border-0 focus:ring-1"
                      placeholder="۲۰"
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-sm font-medium">هزینه مواد/زیرساخت</Label>
          <Input
            type="number"
            value={formData.material_infra_cost || ''}
            onChange={(e) => handleChange('material_infra_cost', parseFloat(e.target.value) || 0)}
            placeholder="مثلاً 150,000,000"
            className="focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium flex items-center gap-1">
            سربار <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              step="0.5"
              value={formData.overhead_pct || ''}
              onChange={(e) => handleChange('overhead_pct', parseFloat(e.target.value) || 0)}
              className="focus:ring-2 focus:ring-emerald-500"
              placeholder="۲۰"
            />
            <span className="text-sm text-gray-400">%</span>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium flex items-center gap-1">
            سود توسعه‌دهنده <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              step="0.5"
              value={formData.developer_profit_pct || ''}
              onChange={(e) => handleChange('developer_profit_pct', parseFloat(e.target.value) || 0)}
              className="focus:ring-2 focus:ring-emerald-500"
              placeholder="۱۵"
            />
            <span className="text-sm text-gray-400">%</span>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium">منسوخی کارکردی</Label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              step="0.5"
              value={formData.functional_obs_pct || ''}
              disabled
              className="bg-gray-50 focus:ring-2 focus:ring-emerald-500"
              placeholder="۰"
            />
            <span className="text-sm text-gray-400">%</span>
            <span className="text-xs text-emerald-600">🤖 خودکار</span>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium flex items-center gap-1">
            منسوخی اقتصادی <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              step="0.5"
              value={formData.economic_obs_pct || ''}
              onChange={(e) => handleChange('economic_obs_pct', parseFloat(e.target.value) || 0)}
              className="focus:ring-2 focus:ring-emerald-500"
              placeholder="۰"
            />
            <span className="text-sm text-gray-400">%</span>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm font-medium mb-3">📊 خلاصه محاسبه</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div className="p-2 bg-white rounded-lg border">
            <p className="text-xs text-gray-400">هزینه مستقیم</p>
            <p className="text-sm font-bold text-dark-green">{calculateTotalCost().toLocaleString()}</p>
          </div>
          <div className="p-2 bg-white rounded-lg border">
            <p className="text-xs text-gray-400">با سربار</p>
            <p className="text-sm font-bold text-dark-green">
              {(calculateTotalCost() * (1 + (formData.overhead_pct || 20) / 100)).toLocaleString()}
            </p>
          </div>
          <div className="p-2 bg-white rounded-lg border">
            <p className="text-xs text-gray-400">با سود</p>
            <p className="text-sm font-bold text-dark-green">
              {(calculateTotalCost() * (1 + (formData.overhead_pct || 20) / 100) * (1 + (formData.developer_profit_pct || 15) / 100)).toLocaleString()}
            </p>
          </div>
          <div className="p-2 bg-dark-green/5 rounded-lg border border-dark-green/20">
            <p className="text-xs text-gray-400">ارزش نهایی</p>
            <p className="text-lg font-bold text-dark-green">{Math.round(calculateFinalValue()).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
