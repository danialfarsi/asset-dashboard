'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { viamApi } from '@/services/viam/api';

interface Committee {
  id: number;
  name: string;
  status: string;
  chair: number;
  chair_name?: string;
  secretary: number;
  secretary_name?: string;
  members: number[];
  members_count?: number;
  meeting_frequency: string;
  meeting_days: string[];
  meeting_time: string;
  organization: number;
  created_at: string;
}

export default function CommitteeManagement() {
  const [loading, setLoading] = useState(true);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [user, setUser] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    organization: 1,
    chair: 1,
    secretary: 1,
    meeting_frequency: 'ماهانه',
    meeting_days: ['شنبه'],
    meeting_time: '10:00:00',
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
        const response = await viamApi.getCommittees();
        setCommittees(response.data.results || []);
      } catch (error) {
        console.error('Error fetching committees:', error);
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
      const response = await viamApi.createCommittee(formData);
      setCommittees([...committees, response.data]);
      setSuccess(true);
      setShowForm(false);
      setFormData({
        name: '',
        organization: 1,
        chair: 1,
        secretary: 1,
        meeting_frequency: 'ماهانه',
        meeting_days: ['شنبه'],
        meeting_time: '10:00:00',
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطا در ایجاد کمیته');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: { [key: string]: string } = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-gray-100 text-gray-800',
      'dissolved': 'bg-red-100 text-red-800',
    };
    const labels: { [key: string]: string } = {
      'active': 'فعال',
      'inactive': 'غیرفعال',
      'dissolved': 'منحل شده',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${map[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
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
          <h1 className="text-2xl font-bold text-gray-800">مدیریت کمیته IAM</h1>
          <p className="text-gray-600 text-sm mt-1">{committees.length} کمیته</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            {showForm ? 'انصراف' : '+ کمیته جدید'}
          </button>
        )}
      </div>

      {showForm && canManage && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">ایجاد کمیته جدید</h2>
          <form onSubmit={handleSubmit}>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}
            {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">✅ کمیته ایجاد شد!</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نام کمیته *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="کمیته IAM شرکت..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">دوره جلسات</label>
                <select name="meeting_frequency" value={formData.meeting_frequency} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="هفتگی">هفتگی</option>
                  <option value="ماهانه">ماهانه</option>
                  <option value="فصلی">فصلی</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={loading} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition disabled:opacity-50">
              {loading ? 'در حال ثبت...' : 'ایجاد کمیته'}
            </button>
          </form>
        </div>
      )}

      {committees.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">هیچ کمیته‌ای وجود ندارد</p>
          {canManage && (
            <button onClick={() => setShowForm(true)} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
              ایجاد اولین کمیته
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {committees.map((committee) => (
            <div key={committee.id} className="bg-white rounded-lg shadow p-6 border-r-4 border-blue-500">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{committee.name}</h3>
                  <p className="text-sm text-gray-500">#{committee.id}</p>
                </div>
                {getStatusBadge(committee.status)}
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">رئیس:</span>
                  <span className="text-gray-800">{committee.chair_name || `کاربر ${committee.chair}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">دبیر:</span>
                  <span className="text-gray-800">{committee.secretary_name || `کاربر ${committee.secretary}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">دوره جلسات:</span>
                  <span className="text-gray-800">{committee.meeting_frequency}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
