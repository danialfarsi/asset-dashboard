'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { viamApi } from '@/services/viam/api';
import { RoleGuard } from '@/components/RoleGuard';
import { useAuthStore } from '@/store/auth-store';

function NewEstablishmentRequestForm() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    justification: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await viamApi.createEstablishmentRequest(formData);
      setSuccess(true);
      setTimeout(() => {
        router.push(`/viam/establishment/${response.data.id}`);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطا در ثبت درخواست.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 rtl max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ثبت درخواست تأسیس واحد IAM</h1>
          <p className="text-gray-600 text-sm mt-1">گام ۱ از ۱۲</p>
          <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
            {user?.role === 'super_admin' ? '🔴 ادمین کل' : user?.role === 'org_admin' ? '🔵 مدیر شرکت' : '🟢 مدیر واحد'}
          </span>
        </div>
        <Link href="/viam/dashboard">
          <button className="text-gray-600 hover:text-gray-800">← بازگشت</button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">۱</span>
            <span className="text-sm font-medium text-blue-600">ثبت درخواست</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-300 mx-2"></div>
          <div className="flex items-center gap-2 opacity-50">
            <span className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold">۲</span>
            <span className="text-sm text-gray-500">تعیین حامی</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-300 mx-2"></div>
          <div className="flex items-center gap-2 opacity-50">
            <span className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold">۱۲</span>
            <span className="text-sm text-gray-500">پایلوت</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            ✅ درخواست با موفقیت ثبت شد! در حال انتقال...
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            عنوان درخواست <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="مثال: تأسیس واحد IAM در شرکت فولاد"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            توضیحات <span className="text-red-500">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={3}
            placeholder="شرح کامل درخواست..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition resize-y"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            دلایل توجیهی <span className="text-red-500">*</span>
          </label>
          <textarea
            name="justification"
            value={formData.justification}
            onChange={handleChange}
            required
            rows={3}
            placeholder="دلایل و ضرورت ایجاد واحد IAM..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition resize-y"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'در حال ثبت...' : 'ثبت درخواست'}
          </button>
          <Link href="/viam/dashboard">
            <button
              type="button"
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2.5 px-6 rounded-lg transition"
            >
              انصراف
            </button>
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function NewEstablishmentRequest() {
  return (
    <RoleGuard
      allowedRoles={['super_admin', 'org_admin']}
      redirectTo="/viam/dashboard"
    >
      <NewEstablishmentRequestForm />
    </RoleGuard>
  );
}
