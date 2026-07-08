'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function M09_MMM({ formData, onChange }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <p className="text-sm text-slate-700">🔹 روش ضریب بازار (MMM)</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-sm font-medium flex items-center gap-1">ارزش مبنا <span className="text-red-500">*</span></Label>
          <Input type="number" value={formData.base_metric_value || ''} onChange={(e) => onChange({ base_metric_value: parseFloat(e.target.value) || 0 })} />
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium flex items-center gap-1">ضریب بازار <span className="text-red-500">*</span></Label>
          <Input type="number" step="0.1" value={formData.market_multiple || ''} onChange={(e) => onChange({ market_multiple: parseFloat(e.target.value) || 0 })} />
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium">حق کنترل</Label>
          <div className="flex items-center gap-1">
            <Input type="number" step="0.1" value={formData.control_premium || ''} onChange={(e) => onChange({ control_premium: parseFloat(e.target.value) || 0 })} />
            <span className="text-sm text-gray-400">%</span>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium">تخفیف نقدشوندگی</Label>
          <div className="flex items-center gap-1">
            <Input type="number" step="0.1" value={formData.marketability_discount || ''} onChange={(e) => onChange({ marketability_discount: parseFloat(e.target.value) || 0 })} />
            <span className="text-sm text-gray-400">%</span>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium">سهم نامشهود</Label>
          <div className="flex items-center gap-1">
            <Input type="number" step="0.1" value={formData.intangible_share || ''} onChange={(e) => onChange({ intangible_share: parseFloat(e.target.value) || 0 })} />
            <span className="text-sm text-gray-400">%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
