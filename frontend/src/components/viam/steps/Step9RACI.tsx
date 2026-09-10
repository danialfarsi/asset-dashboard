'use client';

import { useState } from 'react';

interface Step9RACIProps {
  onComplete: (data: any) => void;
  initialData?: any;
}

const activities = [
  { value: 'discovery', label: 'کشف دارایی' },
  { value: 'valuation', label: 'ارزش‌گذاری' },
  { value: 'protection', label: 'حفاظت' },
  { value: 'development', label: 'توسعه' },
  { value: 'commercialization', label: 'تجاری‌سازی' },
  { value: 'monitoring', label: 'پایش' },
];

const responsibilities = [
  { value: 'R', label: 'مسئول اجرا' },
  { value: 'A', label: 'پاسخگوی نهایی' },
  { value: 'C', label: 'مشورت‌شونده' },
  { value: 'I', label: 'مطلع‌شونده' },
];

export function Step9RACI({ onComplete, initialData }: Step9RACIProps) {
  const [assetName, setAssetName] = useState(initialData?.assetName || '');
  const [raciItems, setRaciItems] = useState(
    initialData?.raciItems || activities.map(a => ({
      activity: a.value,
      super_admin: 'I',
      org_admin: 'A',
      org_user: 'R',
    }))
  );

  const updateRACI = (index: number, role: string, value: string) => {
    const updated = [...raciItems];
    updated[index] = { ...updated[index], [role]: value };
    setRaciItems(updated);
  };

  const handleSubmit = () => {
    if (!assetName.trim()) {
      alert('لطفاً نام دارایی را وارد کنید');
      return;
    }
    onComplete({ assetName, raciItems, completed: true });
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          📌 <strong>گام ۹:</strong> ماتریس RACI را برای دارایی‌های کلیدی تعریف کنید.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">نام دارایی <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={assetName}
          onChange={(e) => setAssetName(e.target.value)}
          placeholder="مثال: فرمول تولید فولاد"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-right">فعالیت</th>
              <th className="border p-2 text-center">ادمین کل</th>
              <th className="border p-2 text-center">مدیر شرکت</th>
              <th className="border p-2 text-center">مدیر واحد</th>
            </tr>
          </thead>
          <tbody>
            {raciItems.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="border p-2 font-medium">
                  {activities.find(a => a.value === item.activity)?.label || item.activity}
                </td>
                {['super_admin', 'org_admin', 'org_user'].map((role) => (
                  <td key={role} className="border p-2">
                    <select
                      value={item[role]}
                      onChange={(e) => updateRACI(index, role, e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                    >
                      {responsibilities.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={handleSubmit}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition"
      >
        تأیید و ادامه
      </button>
    </div>
  );
}
