'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Step12PilotProps {
  onComplete: (data: any) => void;
  initialData?: any;
}

export function Step12Pilot({ onComplete, initialData }: Step12PilotProps) {
  const router = useRouter();
  const [scope, setScope] = useState(initialData?.scope || '');
  const [departments, setDepartments] = useState<string[]>(initialData?.departments || ['']);
  const [targetAssets, setTargetAssets] = useState<number>(initialData?.targetAssets || 30);
  const [startDate, setStartDate] = useState(initialData?.startDate || '');
  const [duration, setDuration] = useState<number>(initialData?.duration || 8);
  const [isCompleting, setIsCompleting] = useState(false);

  const addDepartment = () => {
    setDepartments([...departments, '']);
  };

  const removeDepartment = (index: number) => {
    if (departments.length > 1) {
      setDepartments(departments.filter((_, i) => i !== index));
    }
  };

  const updateDepartment = (index: number, value: string) => {
    const updated = [...departments];
    updated[index] = value;
    setDepartments(updated);
  };

  const handleSubmit = () => {
    const filteredDepts = departments.filter(d => d.trim());
    if (!scope.trim()) {
      alert('لطفاً محدوده پایلوت را مشخص کنید');
      return;
    }
    if (filteredDepts.length === 0) {
      alert('لطفاً حداقل یک واحد را مشخص کنید');
      return;
    }
    if (!startDate) {
      alert('لطفاً تاریخ شروع را انتخاب کنید');
      return;
    }
    
    setIsCompleting(true);
    onComplete({ 
      scope,
      departments: filteredDepts,
      targetAssets,
      startDate,
      duration,
      completed: true,
      isFinal: true // نشانه تکمیل نهایی
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-700">
          🎉 <strong>گام آخر!</strong> با تکمیل این گام، واحد IAM شما به صورت رسمی تأسیس می‌شود.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          📌 <strong>گام ۱۲:</strong> پایلوت ۶ تا ۱۰ هفته‌ای را برای تست واحد IAM آغاز کنید.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          محدوده پایلوت <span className="text-red-500">*</span>
        </label>
        <textarea
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          placeholder="محدوده پایلوت را مشخص کنید..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y"
          rows={2}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          واحدهای مشمول <span className="text-red-500">*</span>
        </label>
        {departments.map((dept, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <input
              type="text"
              value={dept}
              onChange={(e) => updateDepartment(index, e.target.value)}
              placeholder={`واحد ${index + 1}`}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              type="button"
              onClick={() => removeDepartment(index)}
              className="px-3 py-2 text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addDepartment}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          + افزودن واحد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            تعداد دارایی هدف
          </label>
          <input
            type="number"
            value={targetAssets}
            onChange={(e) => setTargetAssets(Number(e.target.value))}
            min={1}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            مدت زمان (هفته) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            min={6}
            max={10}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <p className="text-xs text-gray-400 mt-1">توصیه: ۶ تا ۱۰ هفته</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          تاریخ شروع <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={isCompleting}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition disabled:opacity-50"
      >
        {isCompleting ? 'در حال تکمیل...' : '🎉 تأیید و تکمیل تأسیس واحد IAM'}
      </button>
      
      <div className="text-xs text-gray-400 text-center">
        با کلیک روی این دکمه، واحد IAM شما به صورت رسمی تأسیس می‌شود و به مرحله بعدی هدایت می‌شوید.
      </div>
    </div>
  );
}
