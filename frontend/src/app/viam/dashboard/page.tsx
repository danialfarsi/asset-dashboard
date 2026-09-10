'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { viamApi } from '@/services/viam/api';
import { useAuthStore } from '@/store/auth-store';

export default function VIAMDashboard() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_requests: 0,
    active_committees: 0,
    total_charters: 0,
    total_strategic_plans: 0,
    total_campaigns: 0,
  });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);

  // ===== دریافت نام کاربری =====
  const getDisplayName = () => {
    if (!user) return 'کاربر';
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) return user.first_name;
    if (user.username) return user.username;
    return 'کاربر';
  };

  const displayName = getDisplayName();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const statsData = await viamApi.getDashboardStats();
        setStats(statsData);

        const requestsRes = await viamApi.getEstablishmentRequests({ limit: 5 });
        setRecentRequests(requestsRes.data.results || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const isSuperAdmin = user?.role === 'super_admin';
  const isOrgAdmin = user?.role === 'org_admin';
  const canManage = isSuperAdmin || isOrgAdmin;

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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">داشبورد VIAM</h1>
          <p className="text-gray-600">
            خوش آمدید، {displayName}
            <span className="mr-2 text-sm text-gray-400">
              ({isSuperAdmin ? 'ادمین کل' : isOrgAdmin ? 'مدیر شرکت' : 'مدیر واحد'})
            </span>
          </p>
        </div>
        {canManage && (
          <Link href="/viam/establishment/new">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
              + ثبت درخواست تأسیس
            </button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-r-4 border-blue-500">
          <p className="text-sm text-gray-500">درخواست‌های تأسیس</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total_requests}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-r-4 border-green-500">
          <p className="text-sm text-gray-500">کمیته‌های فعال</p>
          <p className="text-2xl font-bold text-gray-800">{stats.active_committees}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-r-4 border-purple-500">
          <p className="text-sm text-gray-500">منشورها</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total_charters}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-r-4 border-orange-500">
          <p className="text-sm text-gray-500">برنامه‌های استراتژیک</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total_strategic_plans}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border-r-4 border-teal-500">
          <p className="text-sm text-gray-500">کمپین‌ها</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total_campaigns}</p>
        </div>
      </div>

      {canManage && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">اقدامات سریع</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/charter-new">
              <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg transition">
                📄 تدوین منشور
              </button>
            </Link>
            <Link href="/committee">
              <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg transition">
                👥 مدیریت کمیته
              </button>
            </Link>
            <Link href="/raci">
              <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg transition">
                📋 تعریف RACI
              </button>
            </Link>
            <Link href="/strategic-plan">
              <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg transition">
                🎯 برنامه استراتژیک
              </button>
            </Link>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">درخواست‌های اخیر</h2>
          <Link href="/viam/establishment/list">
            <button className="text-blue-600 hover:text-blue-800 text-sm">
              مشاهده همه →
            </button>
          </Link>
        </div>
        {recentRequests.length === 0 ? (
          <p className="text-gray-500 text-center py-8">هیچ درخواستی وجود ندارد</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">عنوان</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">وضعیت</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">تاریخ</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.map((req) => (
                  <tr key={req.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-800">{req.title}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        req.status === 'approved' ? 'bg-green-100 text-green-800' :
                        req.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                        req.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        req.status === 'active' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {req.status === 'draft' ? 'پیش‌نویس' :
                         req.status === 'submitted' ? 'ارسال شده' :
                         req.status === 'approved' ? 'تأیید شده' :
                         req.status === 'active' ? 'فعال' :
                         req.status === 'rejected' ? 'رد شده' : req.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(req.created_at).toLocaleDateString('fa-IR')}
                    </td>
                    <td className="py-3 px-4">
                      <Link href={`/viam/establishment/${req.id}`}>
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
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
    </div>
  );
}
