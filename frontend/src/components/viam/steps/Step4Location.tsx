'use client';

import { useState } from 'react';

interface Step4LocationProps {
  onComplete: (data: any) => void;
  initialData?: any;
}

const locations = [
  { value: 'tech', label: 'معاونت فنی، R&D یا کیفیت' },
  { value: 'strategy', label: 'راهبرد، توسعه کسب‌وکار یا تحول دیجیتال' },
  { value: 'research', label: 'معاونت پژوهش، فناوری یا انتقال فناوری' },
  { value: 'ceo', label: 'معاونت راهبرد، سرمایه‌گذاری یا دفتر مدیرعامل' },
];

export function Step4Location({ onComplete, initialData }: Step4LocationProps) {
  const [location, setLocation] = useState(initialData?.location || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  const handleSubmit = () => {
    if (!location) {
      alert('لطفاً محل استقرار را انتخاب کنید');
      return;
    }
    onComplete({ location, notes, completed: true });
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          📌 <strong>گام ۴:</strong> محل استقرار سازمانی واحد IAM را تعیین کنید.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {locations.map((item) => (
          <div
            key={item.value}
            onClick={() => setLocation(item.value)}
            className={`p-3 border-2 rounded-lg cursor-pointer transition ${
              location === item.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="location"
                value={item.value}
                checked={location === item.value}
                onChange={() => setLocation(item.value)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-800">{item.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          توضیحات
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="توضیحات مربوط به محل استقرار..."
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
