'use client';

import { useState } from 'react';

interface Step3GovernanceProps {
  onComplete: (data: any) => void;
  initialData?: any;
}

const governanceModels = [
  { value: 'centralized', label: 'متمرکز و فنی', description: 'مناسب برای سازمان‌های تولیدی' },
  { value: 'network', label: 'شبکه‌ای و مشتری‌محور', description: 'مناسب برای سازمان‌های خدماتی' },
  { value: 'staged', label: 'مرحله‌ای و فناوری‌محور', description: 'مناسب برای سازمان‌های پژوهشی' },
  { value: 'federal', label: 'فدرال و چندشرکتی', description: 'مناسب برای هلدینگ‌های اقتصادی' },
];

export function Step3Governance({ onComplete, initialData }: Step3GovernanceProps) {
  const [model, setModel] = useState(initialData?.model || '');
  const [reason, setReason] = useState(initialData?.reason || '');

  const handleSubmit = () => {
    if (!model) {
      alert('لطفاً مدل حکمرانی را انتخاب کنید');
      return;
    }
    onComplete({ model, reason, completed: true });
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          📌 <strong>گام ۳:</strong> مدل حکمرانی مناسب سازمان خود را انتخاب کنید.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {governanceModels.map((item) => (
          <div
            key={item.value}
            onClick={() => setModel(item.value)}
            className={`p-4 border-2 rounded-lg cursor-pointer transition ${
              model === item.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="governance"
                value={item.value}
                checked={model === item.value}
                onChange={() => setModel(item.value)}
                className="w-4 h-4 text-blue-600"
              />
              <div>
                <p className="font-medium text-gray-800">{item.label}</p>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          دلیل انتخاب
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="دلیل انتخاب این مدل حکمرانی..."
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
