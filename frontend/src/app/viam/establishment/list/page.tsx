'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { viamApi } from '@/services/viam/api';
import { EstablishmentRequest } from '@/types/viam';

export default function EstablishmentRequestList() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<EstablishmentRequest[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await viamApi.getEstablishmentRequests();
        setRequests(response.data.results || []);
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    const map: { [key: string]: string } = {
      'draft': 'bg-gray-100 text-gray-800',
      'submitted': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
    };
    const labels: { [key: string]: string } = {
      'draft': 'پیش‌نویس',
      'submitted': 'ارسال شده',
      'approved': 'تأیید شده',
      'rejected': 'رد شده',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${map[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter(req => req.status === filter);

  const canManage = user?.role === 'super_admin' || user?.role === 'org_admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">لیست درخواست‌های تأسیس</h1>
          <p className="text-gray-600 text-sm mt-1">
            {requests.length} درخواست یافت شد
          </p>
        </div>
        {canManage && (
          <Link href="/viam/establishment/new">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
              + ثبت درخواست جدید
            </button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            همه
          </button>
          <button
            onClick={() => setFilter('draft')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'draft' 
                ? 'bg-gray-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            پیش‌نویس
          </button>
          <button
            onClick={() => setFilter('submitted')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'submitted' 
                ? 'bg-yellow-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            ارسال شده
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'approved' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            تأیید شده
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === 'rejected' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            رد شده
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">هیچ درخواستی یافت نشد</p>
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
                {filteredRequests.map((req, index) => (
                  <tr key={req.id} className="border-b hover:bg-gray-50 transition">
                    <td className="py-3 px-4 text-gray-600">{index + 1}</td>
                    <td className="py-3 px-4 text-gray-800 font-medium">{req.title}</td>
                    <td className="py-3 px-4">{getStatusBadge(req.status)}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {req.current_step || 1} از ۱۲
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(req.created_at).toLocaleDateString('fa-IR')}
                    </td>
                    <td className="py-3 px-4">
                      <Link href={`/viam/establishment/${req.id}`}>
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          مشاهده
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">{requests.length}</p>
          <p className="text-sm text-gray-500">کل درخواست‌ها</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">
            {requests.filter(r => r.status === 'submitted').length}
          </p>
          <p className="text-sm text-gray-500">در انتظار تأیید</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {requests.filter(r => r.status === 'approved').length}
          </p>
          <p className="text-sm text-gray-500">تأیید شده</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-gray-400">
            {requests.filter(r => r.status === 'draft').length}
          </p>
          <p className="text-sm text-gray-500">پیش‌نویس</p>
        </div>
      </div>
    </div>
  );
}
