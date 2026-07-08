'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function M07_TWC({ formData, onChange }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
        <p className="text-sm text-cyan-700">🔹 روش هزینه نیروی کار آموزش‌دیده (TWC)</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-sm font-medium flex items-center gap-1">مدت رشد <span className="text-red-500">*</span></Label>
          <div className="flex items-center gap-1">
            <Input type="number" value={formData.ramp_up_duration || ''} onChange={(e) => onChange({ ramp_up_duration: parseInt(e.target.value) || 0 })} />
            <span className="text-sm text-gray-400">ماه</span>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium">کاهش بهره‌وری</Label>
          <div className="flex items-center gap-1">
            <Input type="number" step="0.1" value={formData.productivity_loss_pct || ''} onChange={(e) => onChange({ productivity_loss_pct: parseFloat(e.target.value) || 0 })} />
            <span className="text-sm text-gray-400">%</span>
          </div>
        </div>
      </div>
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm font-medium">📊 ترکیب تیم</p>
        <p className="text-sm text-gray-400">(در حال توسعه)</p>
      </div>
    </div>
  );
}
