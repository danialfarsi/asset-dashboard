'use client';

import { useState } from 'react';

interface Step11PlatformConfigProps {
  onComplete: (data: any) => void;
  initialData?: any;
}

export function Step11PlatformConfig({ onComplete, initialData }: Step11PlatformConfigProps) {
  const [tenantName, setTenantName] = useState(initialData?.tenantName || '');
  const [modules, setModules] = useState<string[]>(initialData?.modules || ['VIAM-01', 'VIAM-02', 'VIAM-03']);
  const [notes, setNotes] = useState(initialData?.notes || '');

  const toggleModule = (module: string) => {
    setModules(prev =>
      prev.includes(module)
        ? prev.filter(m => m !== module)
        : [...prev, module]
    );
  };

  const allModules = [
    'VIAM-01 (استقرار و حکمرانی)',
    'VIAM-02 (برنامه‌ریزی استراتژیک)',
    'VIAM-03 (جریان‌سازی و فرهنگ‌سازی)',
    'VIAM-04 (توانمندسازی و گواهی)',
    'VIAM-05 (مالکیت و RACI)',
    'VIAM-06 (گردش‌کار و پرونده)',
    'VIAM-07 (کمیته و تصمیم‌گیری)',
    'VIAM-08 (استخراج دانش)',
    'VIAM-09 (ریسک و انطباق)',
    'VIAM-10 (عملکرد و بلوغ)',
    'VIAM-11 (اتصال به موتورها)',
  ];

  const handleSubmit = () => {
    if (!tenantName.trim()) {
      alert('لطفاً نام Tenant را وارد کنید');
      return;
    }
    onComplete({ tenantName, modules, notes, completed: true });
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          📌 <strong>گام ۱۱:</strong> واحد IAM را در پلتفرم متا پیکربندی کنید.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          نام Tenant <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={tenantName}
          onChange={(e) => setTenantName(e.target.value)}
          placeholder="مثال: شرکت فولاد - IAM"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ماژول‌های فعال
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {allModules.map((module) => (
            <div
              key={module}
              onClick={() => toggleModule(module)}
              className={`p-2 border-2 rounded-lg cursor-pointer transition text-sm ${
                modules.includes(module)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={modules.includes(module)}
                  onChange={() => toggleModule(module)}
                  className="w-4 h-4 text-blue-600"
                />
                <span>{module}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          یادداشت‌های پیکربندی
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="نکات و تنظیمات خاص پیکربندی..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y"
          rows={2}
        />
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
