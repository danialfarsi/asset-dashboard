'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { viamApi } from '@/services/viam/api';
import { useAuthStore } from '@/store/auth-store';

export default function Stage1Page() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await viamApi.getEstablishmentRequests();
        setRequests(response.data.results || []);
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const canManage = user?.role === 'super_admin' || user?.role === 'org_admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">مرحله ۱: برنامه و نقشه راهبردی</h1>
          <p className="text-sm text-gray-500 mt-1">
            استقرار و حکمرانی واحد مجازی IAM (۱۲ گام)
          </p>
        </div>
        {canManage && (
          <Link href="/viam/establishment/new">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
              + ثبت درخواست تأسیس
            </button>
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-r-4 border-blue-500">
          <p className="text-sm text-gray-500">کل درخواست‌ها</p>
          <p className="text-2xl font-bold text-gray-800">{requests.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-r-4 border-yellow-500">
          <p className="text-sm text-gray-500">در حال انجام</p>
          <p className="text-2xl font-bold text-gray-800">
            {requests.filter(r => r.status === 'draft' || r.status === 'submitted').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-r-4 border-green-500">
          <p className="text-sm text-gray-500">تأیید شده</p>
          <p className="text-2xl font-bold text-gray-800">
            {requests.filter(r => r.status === 'approved' || r.status === 'active').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-r-4 border-purple-500">
          <p className="text-sm text-gray-500">واحدهای فعال</p>
          <p className="text-2xl font-bold text-gray-800">
            {requests.filter(r => r.status === 'active').length}
          </p>
        </div>
      </div>

      {/* List of Requests */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">درخواست‌های تأسیس</h2>
        </div>
        {requests.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p>هیچ درخواستی وجود ندارد</p>
            {canManage && (
              <Link href="/viam/establishment/new">
                <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
                  ثبت اولین درخواست
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">#</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">عنوان</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">وضعیت</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">گام جاری</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">تاریخ</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req, index) => {
                  const statusLabels: { [key: string]: string } = {
                    'draft': 'پیش‌نویس',
                    'submitted': 'ارسال شده',
                    'approved': 'تأیید شده',
                    'rejected': 'رد شده',
                    'active': 'فعال',
                  };
                  const statusColors: { [key: string]: string } = {
                    'draft': 'bg-gray-100 text-gray-800',
                    'submitted': 'bg-yellow-100 text-yellow-800',
                    'approved': 'bg-green-100 text-green-800',
                    'rejected': 'bg-red-100 text-red-800',
                    'active': 'bg-blue-100 text-blue-800',
                  };
                  return (
                    <tr key={req.id} className="border-b hover:bg-gray-50 transition">
                      <td className="py-3 px-4 text-gray-600">{index + 1}</td>
                      <td className="py-3 px-4 text-gray-800 font-medium">{req.title}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[req.status] || 'bg-gray-100 text-gray-800'}`}>
                          {statusLabels[req.status] || req.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {req.current_step || 1} از ۱۲
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(req.created_at).toLocaleDateString('fa-IR')}
                      </td>
                      <td className="py-3 px-4">
                        <Link href={`/viam/establishment/${req.id}`}>
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            مشاهده و ادامه
                          </button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
