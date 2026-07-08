'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function M03_DCF({ formData, onChange }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
        <p className="text-sm text-amber-700">🔹 روش تنزیل جریان نقدی (DCF)</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-sm font-medium flex items-center gap-1">جریان نقدی آزاد <span className="text-red-500">*</span></Label>
          <Input value={formData.free_cash_flows || ''} onChange={(e) => onChange({ free_cash_flows: e.target.value })} placeholder="سال به سال" />
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
