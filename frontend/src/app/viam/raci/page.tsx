'use client';

import { useEffect, useState } from 'react';
import { viamApi } from '@/services/viam/api';

interface RACIItem {
  id: number;
  activity: string;
  activity_display?: string;
  role: string;
  role_display?: string;
  responsibility: string;
  resp_display?: string;
  asset_name?: string;
  asset?: number;
  organization?: number;
  created_at?: string;
  super_admin_responsibility?: string;
  org_admin_responsibility?: string;
  org_user_responsibility?: string;
}

export default function RACIPage() {
  const [loading, setLoading] = useState(true);
  const [raciItems, setRaciItems] = useState<RACIItem[]>([]);
  const [user, setUser] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    asset_name: '',
    organization: 1,
    activity: 'discovery',
    super_admin_responsibility: 'I',
    org_admin_responsibility: 'A',
    org_user_responsibility: 'R',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) setUser(JSON.parse(userStr));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await viamApi.getRACI();
        setRaciItems(response.data.results || []);
      } catch (error) {
        console.error('Error fetching RACI:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const canManage = user?.role === 'super_admin' || user?.role === 'org_admin';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const payload = {
        asset: null,
        asset_name: formData.asset_name,
        organization: formData.organization,
        activity: formData.activity,
        super_admin_responsibility: formData.super_admin_responsibility,
        org_admin_responsibility: formData.org_admin_responsibility,
        org_user_responsibility: formData.org_user_responsibility,
      };
      
      const response = await viamApi.createRACI(payload);
      setRaciItems([...raciItems, response.data]);
      setSuccess(true);
      setShowForm(false);
      setFormData({
        asset_name: '',
        organization: 1,
        activity: 'discovery',
        super_admin_responsibility: 'I',
        org_admin_responsibility: 'A',
        org_user_responsibility: 'R',
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error creating RACI:', err);
      setError(err.response?.data?.message || 'خطا در تعریف RACI');
    } finally {
      setLoading(false);
    }
  };

  const activityLabels: { [key: string]: string } = {
    'discovery': 'کشف',
    'valuation': 'ارزش‌گذاری',
    'protection': 'حفاظت',
    'development': 'توسعه',
    'commercialization': 'تجاری‌سازی',
    'monitoring': 'پایش',
  };

  const respLabels: { [key: string]: string } = {
    'R': 'مسئول اجرا',
    'A': 'پاسخگوی نهایی',
    'C': 'مشورت‌شونده',
    'I': 'مطلع‌شونده',
  };

  const getResponsibilityBadge = (resp: string) => {
    const colors: { [key: string]: string } = {
      'R': 'bg-red-100 text-red-800',
      'A': 'bg-blue-100 text-blue-800',
      'C': 'bg-yellow-100 text-yellow-800',
      'I': 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[resp] || 'bg-gray-100 text-gray-800'}`}>
        {respLabels[resp] || resp}
      </span>
    );
  };

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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">تعریف RACI</h1>
          <p className="text-gray-600 text-sm mt-1">ماتریس مسئولیت‌ها بر اساس ۳ نقش اصلی</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            {showForm ? 'انصراف' : '+ تعریف RACI جدید'}
          </button>
        )}
      </div>

      {showForm && canManage && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">تعریف RACI جدید</h2>
          <form onSubmit={handleSubmit}>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}
            {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">✅ RACI با موفقیت تعریف شد!</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نام دارایی *</label>
                <input type="text" name="asset_name" value={formData.asset_name} onChange={handleChange} required placeholder="مثال: فرمول تولید فولاد" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">فعالیت *</label>
                <select name="activity" value={formData.activity} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  {Object.entries(activityLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نقش: ادمین کل</label>
                <select name="super_admin_responsibility" value={formData.super_admin_responsibility} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  {Object.entries(respLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نقش: مدیر شرکت</label>
                <select name="org_admin_responsibility" value={formData.org_admin_responsibility} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  {Object.entries(respLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نقش: مدیر واحد</label>
                <select name="org_user_responsibility" value={formData.org_user_responsibility} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  {Object.entries(respLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" disabled={loading} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition disabled:opacity-50">
              {loading ? 'در حال ثبت...' : 'تعریف RACI'}
            </button>
          </form>
        </div>
      )}

      {raciItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">هیچ RACI تعریف نشده است</p>
          {canManage && (
            <button onClick={() => setShowForm(true)} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
              تعریف اولین RACI
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">#</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">دارایی</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">فعالیت</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">ادمین کل</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">مدیر شرکت</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">مدیر واحد</th>
                </tr>
              </thead>
              <tbody>
                {raciItems.map((item, index) => {
                  const isComplete = 'super_admin_responsibility' in item;
                  return (
                    <tr key={item.id} className="border-b hover:bg-gray-50 transition">
                      <td className="py-3 px-4 text-gray-600">{index + 1}</td>
                      <td className="py-3 px-4 text-gray-800 font-medium">
                        {item.asset_name || 'بدون نام'}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {item.activity_display || activityLabels[item.activity] || item.activity}
                      </td>
                      <td className="py-3 px-4">
                        {isComplete && item.super_admin_responsibility ? (
                          getResponsibilityBadge(item.super_admin_responsibility)
                        ) : (
                          getResponsibilityBadge('I')
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isComplete && item.org_admin_responsibility ? (
                          getResponsibilityBadge(item.org_admin_responsibility)
                        ) : (
                          getResponsibilityBadge(item.responsibility || 'A')
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isComplete && item.org_user_responsibility ? (
                          getResponsibilityBadge(item.org_user_responsibility)
                        ) : (
                          getResponsibilityBadge('R')
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
