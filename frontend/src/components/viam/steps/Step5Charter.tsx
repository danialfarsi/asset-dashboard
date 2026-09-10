'use client';

import { useState } from 'react';

interface Step5CharterProps {
  onComplete: (data: any) => void;
  initialData?: any;
}

export function Step5Charter({ onComplete, initialData }: Step5CharterProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || 'منشور IAM',
    version: initialData?.version || '1.0',
    vision: initialData?.vision || '',
    mission: initialData?.mission || '',
    values: initialData?.values || ['شفافیت', 'مسئولیت‌پذیری', 'نوآوری'],
    objectives: initialData?.objectives || ['ایجاد رجیستری جامع', 'ارزش‌گذاری دقیق', 'حفاظت و امنیت'],
    scope: initialData?.scope || '',
    meeting_frequency: initialData?.meeting_frequency || 'ماهانه',
  });

  const [newValue, setNewValue] = useState('');
  const [newObjective, setNewObjective] = useState('');

  const addValue = () => {
    if (newValue.trim()) {
      setFormData({ ...formData, values: [...formData.values, newValue.trim()] });
      setNewValue('');
    }
  };

  const removeValue = (index: number) => {
    setFormData({ ...formData, values: formData.values.filter((_, i) => i !== index) });
  };

  const addObjective = () => {
    if (newObjective.trim()) {
      setFormData({ ...formData, objectives: [...formData.objectives, newObjective.trim()] });
      setNewObjective('');
    }
  };

  const removeObjective = (index: number) => {
    setFormData({ ...formData, objectives: formData.objectives.filter((_, i) => i !== index) });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    if (!formData.vision.trim()) {
      alert('لطفاً چشم‌انداز را وارد کنید');
      return;
    }
    if (!formData.mission.trim()) {
      alert('لطفاً رسالت را وارد کنید');
      return;
    }
    onComplete({ ...formData, completed: true });
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          📌 <strong>گام ۵:</strong> منشور IAM را تدوین کنید. این سند، اساسنامه و چارچوب کاری واحد IAM را مشخص می‌کند.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">عنوان منشور</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">چشم‌انداز <span className="text-red-500">*</span></label>
        <textarea
          name="vision"
          value={formData.vision}
          onChange={handleChange}
          rows={2}
          placeholder="چشم‌انداز سازمان در مدیریت دارایی‌های نامشهود..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">رسالت <span className="text-red-500">*</span></label>
        <textarea
          name="mission"
          value={formData.mission}
          onChange={handleChange}
          rows={2}
          placeholder="رسالت واحد IAM در سازمان..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">ارزش‌ها</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="افزودن ارزش جدید..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addValue())}
          />
          <button type="button" onClick={addValue} className="bg-blue-600 text-white px-4 py-2 rounded-lg">+</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.values.map((value, index) => (
            <span key={index} className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
              {value}
              <button type="button" onClick={() => removeValue(index)} className="text-blue-500 hover:text-red-500">×</button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">اهداف</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newObjective}
            onChange={(e) => setNewObjective(e.target.value)}
            placeholder="افزودن هدف جدید..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addObjective())}
          />
          <button type="button" onClick={addObjective} className="bg-blue-600 text-white px-4 py-2 rounded-lg">+</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.objectives.map((objective, index) => (
            <span key={index} className="bg-green-50 border border-green-200 text-green-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
              {objective}
              <button type="button" onClick={() => removeObjective(index)} className="text-green-500 hover:text-red-500">×</button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">حوزه فعالیت</label>
        <textarea
          name="scope"
          value={formData.scope}
          onChange={handleChange}
          rows={2}
          placeholder="حوزه فعالیت واحد IAM..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">دوره تشکیل جلسات</label>
        <select
          name="meeting_frequency"
          value={formData.meeting_frequency}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="هفتگی">هفتگی</option>
          <option value="ماهانه">ماهانه</option>
          <option value="فصلی">فصلی</option>
          <option value="سالانه">سالانه</option>
        </select>
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
