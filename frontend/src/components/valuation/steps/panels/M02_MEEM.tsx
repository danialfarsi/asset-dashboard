'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function M02_MEEM({ formData, onChange }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
        <p className="text-sm text-indigo-700">🔹 روش سود مازاد چنددوره‌ای (MEEM)</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-sm font-medium flex items-center gap-1">EBIT قابل انتساب <span className="text-red-500">*</span></Label>
          <Input value={formData.ebit_attributable || ''} onChange={(e) => onChange({ ebit_attributable: parseFloat(e.target.value) || 0 })} />
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium flex items-center gap-1">نرخ ریزش <span className="text-red-500">*</span></Label>
          <div className="flex items-center gap-1">
            <Input type="number" step="0.1" value={formData.attrition_rate || ''} onChange={(e) => onChange({ attrition_rate: parseFloat(e.target.value) || 0 })} />
            <span className="text-sm text-gray-400">%</span>
          </div>
        </div>
      </div>
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm font-medium">📊 جدول CAC</p>
        <p className="text-sm text-gray-400">(در حال توسعه)</p>
      </div>
    </div>
  );
}
