'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { viamApi } from '@/services/viam/api';
import { RoleGuard } from '@/components/RoleGuard';

function NewCharterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: 'منشور IAM',
    version: '1.0',
    vision: '',
    mission: '',
    values: ['شفافیت', 'مسئولیت‌پذیری', 'نوآوری'],
    objectives: ['ایجاد رجیستری جامع', 'ارزش‌گذاری دقیق', 'حفاظت و امنیت'],
    scope: '',
    meeting_frequency: 'ماهانه',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await viamApi.createCharter(formData);
      setSuccess(true);
      setTimeout(() => router.push('/viam/dashboard'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطا در تدوین منشور.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 rtl max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">تدوین منشور IAM</h1>
          <p className="text-gray-600 text-sm mt-1">گام ۵ از ۱۲</p>
        </div>
        <Link href="/viam/dashboard">
          <button className="text-gray-600 hover:text-gray-800">← بازگشت</button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">✅ منشور با موفقیت تدوین شد!</div>}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">عنوان منشور *</label>
          <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">چشم‌انداز *</label>
          <textarea name="vision" value={formData.vision} onChange={handleChange} required rows={2} placeholder="چشم‌انداز سازمان..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition resize-y" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">رسالت *</label>
          <textarea name="mission" value={formData.mission} onChange={handleChange} required rows={2} placeholder="رسالت واحد IAM..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition resize-y" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">ارزش‌ها *</label>
          <div className="flex gap-2 mb-2">
            <input type="text" value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="افزودن ارزش جدید..." className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addValue())} />
            <button type="button" onClick={addValue} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">+</button>
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

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">اهداف *</label>
          <div className="flex gap-2 mb-2">
            <input type="text" value={newObjective} onChange={(e) => setNewObjective(e.target.value)} placeholder="افزودن هدف جدید..." className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addObjective())} />
            <button type="button" onClick={addObjective} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">+</button>
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

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">حوزه فعالیت</label>
          <textarea name="scope" value={formData.scope} onChange={handleChange} rows={2} placeholder="حوزه فعالیت واحد IAM..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition resize-y" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">دوره تشکیل جلسات</label>
          <select name="meeting_frequency" value={formData.meeting_frequency} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition">
            <option value="هفتگی">هفتگی</option>
            <option value="ماهانه">ماهانه</option>
            <option value="فصلی">فصلی</option>
            <option value="سالانه">سالانه</option>
          </select>
        </div>

        <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
          <button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'در حال ثبت...' : 'تدوین منشور'}
          </button>
          <Link href="/viam/dashboard">
            <button type="button" className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2.5 px-6 rounded-lg transition">انصراف</button>
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function NewCharterPage() {
  return (
    <RoleGuard
      allowedRoles={['super_admin', 'org_admin']}
      redirectTo="/viam/dashboard"
      fallback={
        <div className="container mx-auto p-6 rtl">
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg text-center max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-2">⛔ دسترسی غیرمجاز</h2>
            <p>شما مجوز تدوین منشور را ندارید.</p>
            <p className="text-sm mt-2 text-gray-600">
              فقط <strong>ادمین کل</strong> و <strong>مدیر شرکت</strong> می‌توانند منشور تدوین کنند.
            </p>
            <button 
              onClick={() => window.location.href = '/viam/dashboard'}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              بازگشت به داشبورد
            </button>
          </div>
        </div>
      }
    >
      <NewCharterForm />
    </RoleGuard>
  );
}
