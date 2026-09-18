'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface Step12PilotProps {
  onComplete: (data: any) => void;
  initialData?: any;
}

export function Step12Pilot({ onComplete, initialData }: Step12PilotProps) {
  const [scope, setScope] = useState('');
  const [departments, setDepartments] = useState<string[]>(['']);
  const [targetAssets, setTargetAssets] = useState<number>(30);
  const [startDate, setStartDate] = useState('');
  const [duration, setDuration] = useState<number>(8);
  const [loading, setLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  // 🎯 بارگذاری از API
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/intangible/viam/pilot/my/');
        const pilot = res.data.pilot;
        if (pilot) {
          setScope(pilot.scope || '');
          setDepartments(pilot.departments?.length ? pilot.departments : ['']);
          setTargetAssets(pilot.asset_count_target || 30);
          setStartDate(pilot.start_date || '');
          setDuration(pilot.duration_weeks || 8);
          console.log('📥 Loaded pilot from API');
        } else {
          console.log('📥 No pilot in API — using defaults');
        }
      } catch (err) {
        console.error('Load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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

  // 🎯 پیشنهاد: گرفتن departmentهای سازمان
  const loadDepartmentsFromOrg = async () => {
    try {
      const res = await api.get('/auth/me/');
      // یا هر API دیگه‌ای که departmentها رو میده
      // فعلاً mock
      setDepartments(['واحد ذوب و پالایش', 'واحد مدیریت']);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
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
    try {
      console.log('📤 Saving pilot to DB...', {
        scope,
        departments: filteredDepts.length,
        startDate,
        duration,
      });

      const res = await api.post('/intangible/viam/pilot/save/', {
        name: `پایلوت ${duration} هفته‌ای IAM`,
        scope,
        departments: filteredDepts,
        asset_count_target: targetAssets,
        start_date: startDate,
        duration_weeks: duration,
      });

      console.log('✅ Pilot saved:', res.data);

      onComplete({
        scope,
        departments: filteredDepts,
        targetAssets,
        startDate,
        duration,
        pilotId: res.data.pilot.id,
        completed: true,
        isFinal: true,
      });
    } catch (err: any) {
      console.error('❌ Save error:', err);
      alert(err.response?.data?.error || 'خطا در ذخیره پایلوت');
      setIsCompleting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-6 text-gray-500">در حال بارگذاری...</div>;
  }

  return (
    <div className="space-y-4" dir="rtl">
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
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-gray-700">
            واحدهای مشمول <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={loadDepartmentsFromOrg}
            className="text-xs text-green-600 hover:text-green-800"
          >
            ⚡ بارگذاری از سازمان
          </button>
        </div>
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
        {startDate && duration && (
          <p className="text-xs text-gray-500 mt-1">
            📅 تاریخ پایان:{' '}
            {new Date(new Date(startDate).getTime() + duration * 7 * 24 * 60 * 60 * 1000)
              .toLocaleDateString('fa-IR')}
          </p>
        )}
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
