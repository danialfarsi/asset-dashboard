'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Deal {
  id: number;
  deal_name: string;
  deal_date: string;
  deal_value: number;
  deal_size: number;
}

interface M08_CTMProps {
  formData: any;
  onChange: (data: any) => void;
}

export function M08_CTM({ formData, onChange }: M08_CTMProps) {
  const deals: Deal[] = formData.comparable_deals || [
    { id: 1, deal_name: 'معامله A', deal_date: '1403-01-15', deal_value: 110000000, deal_size: 1.2 },
    { id: 2, deal_name: 'معامله B', deal_date: '1403-06-20', deal_value: 120000000, deal_size: 1.5 },
    { id: 3, deal_name: 'معامله C', deal_date: '1404-02-10', deal_value: 130000000, deal_size: 1.3 },
  ];

  const handleChange = (field: string, value: any) => {
    onChange({ [field]: value });
  };

  const updateDeal = (id: number, field: string, value: any) => {
    const newDeals = deals.map(deal =>
      deal.id === id ? { ...deal, [field]: value } : deal
    );
    handleChange('comparable_deals', newDeals);
  };

  const addDeal = () => {
    const newDeal: Deal = {
      id: Date.now(),
      deal_name: '',
      deal_date: '',
      deal_value: 0,
      deal_size: 0,
    };
    handleChange('comparable_deals', [...deals, newDeal]);
  };

  const removeDeal = (id: number) => {
    if (deals.length <= 3) {
      alert('حداقل ۳ معامله باید وجود داشته باشد');
      return;
    }
    handleChange('comparable_deals', deals.filter(deal => deal.id !== id));
  };

  const calculateAverage = () => {
    if (deals.length === 0) return 0;
    const sum = deals.reduce((acc, deal) => acc + deal.deal_value, 0);
    return sum / deals.length;
  };

  const calculateFinalValue = () => {
    const avg = calculateAverage();
    const adjustment = 1 + (formData.time_adjustment_pct || 0) / 100 + (formData.geo_adjustment_pct || 0) / 100 + (formData.quality_adjustment_pct || 0) / 100;
    return avg * adjustment;
  };

  return (
    <div className="space-y-6">
      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
        <p className="text-sm text-purple-700">
          🔹 این روش برای دارایی‌هایی که معاملات مشابه در بازار دارند استفاده می‌شود.
          <span className="inline-block mr-2 px-2 py-0.5 bg-purple-200 text-purple-800 rounded-full text-xs font-medium">
            حداقل ۳ معامله
          </span>
        </p>
      </div>

      {/* Comparable Deals Table */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-1">
          لیست معاملات مشابه <span className="text-red-500">*</span>
        </Label>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border p-2 text-right">نام معامله</th>
                <th className="border p-2 text-right">تاریخ</th>
                <th className="border p-2 text-right">ارزش (IRR)</th>
                <th className="border p-2 text-right">اندازه</th>
                <th className="border p-2 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => (
                <tr key={deal.id} className="hover:bg-gray-50">
                  <td className="border p-1">
                    <Input
                      value={deal.deal_name}
                      onChange={(e) => updateDeal(deal.id, 'deal_name', e.target.value)}
                      className="h-8 text-sm border-0 focus:ring-1"
                      placeholder="نام معامله"
                    />
                  </td>
                  <td className="border p-1">
                    <Input
                      type="date"
                      value={deal.deal_date}
                      onChange={(e) => updateDeal(deal.id, 'deal_date', e.target.value)}
                      className="h-8 text-sm border-0 focus:ring-1"
                    />
                  </td>
                  <td className="border p-1">
                    <Input
                      type="number"
                      value={deal.deal_value || ''}
                      onChange={(e) => updateDeal(deal.id, 'deal_value', parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm border-0 focus:ring-1"
                      placeholder="۰"
                    />
                  </td>
                  <td className="border p-1">
                    <Input
                      type="number"
                      step="0.1"
                      value={deal.deal_size || ''}
                      onChange={(e) => updateDeal(deal.id, 'deal_size', parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm border-0 focus:ring-1"
                      placeholder="۰"
                    />
                  </td>
                  <td className="border p-1 text-center">
                    <button
                      onClick={() => removeDeal(deal.id)}
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
        <Button variant="outline" size="sm" onClick={addDeal} className="flex items-center gap-1">
          <Plus className="w-4 h-4" />
          افزودن معامله
        </Button>
        <p className="text-xs text-gray-400">* حداقل ۳ ردیف الزامی</p>
      </div>

      {/* Adjustments */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label className="text-sm font-medium">تعدیل زمانی/تورمی</Label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              step="0.5"
              value={formData.time_adjustment_pct || ''}
              onChange={(e) => handleChange('time_adjustment_pct', parseFloat(e.target.value) || 0)}
              className="focus:ring-2 focus:ring-purple-500"
              placeholder="۳"
            />
            <span className="text-sm text-gray-400">%</span>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium">تعدیل جغرافیایی</Label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              step="0.5"
              value={formData.geo_adjustment_pct || ''}
              onChange={(e) => handleChange('geo_adjustment_pct', parseFloat(e.target.value) || 0)}
              className="focus:ring-2 focus:ring-purple-500"
              placeholder="۲"
            />
            <span className="text-sm text-gray-400">%</span>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium">تعدیل کیفیت</Label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              step="0.5"
              value={formData.quality_adjustment_pct || ''}
              onChange={(e) => handleChange('quality_adjustment_pct', parseFloat(e.target.value) || 0)}
              className="focus:ring-2 focus:ring-purple-500"
              placeholder="۰"
            />
            <span className="text-sm text-gray-400">%</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm font-medium mb-3">📊 خلاصه محاسبه</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-2 bg-white rounded-lg border">
            <p className="text-xs text-gray-400">میانگین ارزش</p>
            <p className="text-sm font-bold text-dark-green">{Math.round(calculateAverage()).toLocaleString()}</p>
          </div>
          <div className="p-2 bg-white rounded-lg border">
            <p className="text-xs text-gray-400">مجموع تعدیل‌ها</p>
            <p className="text-sm font-bold text-dark-green">
              {((formData.time_adjustment_pct || 0) + (formData.geo_adjustment_pct || 0) + (formData.quality_adjustment_pct || 0)).toFixed(1)}%
            </p>
          </div>
          <div className="p-2 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-xs text-gray-400">ارزش نهایی</p>
            <p className="text-lg font-bold text-purple-700">{Math.round(calculateFinalValue()).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
