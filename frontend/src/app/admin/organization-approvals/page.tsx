'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { CheckCircle, XCircle, Building2, Clock, Users, Pencil, X, AlertCircle } from 'lucide-react';

interface Department {
  id: number;
  name: string;
  code: string;
}

interface OrgRequest {
  id: number;
  name: string;
  code: string;
  status: string;
  created_at: string;
  admin: {
    id: number;
    name: string;
    email: string;
  } | null;
  departments_count: number;
  departments: Department[];
}

export default function OrganizationApprovalsPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [organizations, setOrganizations] = useState<OrgRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [editingCode, setEditingCode] = useState<number | null>(null);
  const [newCode, setNewCode] = useState('');

  // ═══════════════════════════════════════════════════════
  // چک دسترسی
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    if (user && user.role !== 'super_admin') {
      router.push('/viam/dashboard');
    }
  }, [user, router]);

  // ═══════════════════════════════════════════════════════
  // بارگذاری
  // ═══════════════════════════════════════════════════════
  const loadOrganizations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/auth/organizations/pending/');
      setOrganizations(res.data.organizations || []);
    } catch (err: any) {
      console.error('Load error:', err);
      setError(err.response?.data?.error || 'خطا در بارگذاری درخواست‌ها');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, []);

  // ═══════════════════════════════════════════════════════
  // تأیید / رد
  // ═══════════════════════════════════════════════════════
  const handleAction = async (id: number, action: 'approve' | 'reject', code?: string) => {
    if (action === 'reject') {
      if (!confirm('آیا مطمئنید که می‌خواهید این سازمان را رد کنید؟')) return;
    }

    setProcessingId(id);
    try {
      await api.post(`/auth/organizations/${id}/approve/`, {
        action,
        code: code || undefined,
      });

      // حذف از لیست
      setOrganizations(prev => prev.filter(o => o.id !== id));

      if (action === 'approve') {
        alert('✅ سازمان با موفقیت تأیید شد');
      } else {
        alert('❌ سازمان رد شد');
      }
    } catch (err: any) {
      console.error('Action error:', err);
      alert(err.response?.data?.error || 'خطا در انجام عملیات');
    } finally {
      setProcessingId(null);
      setEditingCode(null);
      setNewCode('');
    }
  };

  // ═══════════════════════════════════════════════════════
  // شروع ویرایش کد
  // ═══════════════════════════════════════════════════════
  const startEditCode = (org: OrgRequest) => {
    setEditingCode(org.id);
    setNewCode(org.code);
  };

  const cancelEditCode = () => {
    setEditingCode(null);
    setNewCode('');
  };

  // ═══════════════════════════════════════════════════════
  // فرمت تاریخ
  // ═══════════════════════════════════════════════════════
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
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
    <div className="container mx-auto p-6 rtl max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Building2 className="w-7 h-7 text-blue-600" />
          تأیید سازمان‌ها
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          درخواست‌های ثبت سازمان که در انتظار تأیید هستند
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Empty State */}
      {organizations.length === 0 && !error && (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-800 mb-1">همه چیز تأیید شده!</h2>
          <p className="text-gray-500 text-sm">
            هیچ درخواست در انتظار تأییدی وجود ندارد
          </p>
        </div>
      )}

      {/* List */}
      <div className="space-y-4">
        {organizations.map((org) => (
          <div
            key={org.id}
            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{org.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                        {org.code}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded">
                        <Clock size={11} />
                        در انتظار
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-400">
                {formatDate(org.created_at)}
              </div>
            </div>

            {/* Admin Info */}
            {org.admin && (
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">مدیرعامل سازمان</p>
                    <p className="text-sm font-medium text-gray-800">{org.admin.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{org.admin.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-0.5">تعداد واحدها</p>
                    <p className="text-lg font-bold text-gray-800">{org.departments_count}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Departments */}
            {org.departments.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                  <Users size={12} />
                  واحدها:
                </p>
                <div className="flex flex-wrap gap-2">
                  {org.departments.map((dept) => (
                    <span
                      key={dept.id}
                      className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100"
                    >
                      {dept.name}
                      <span className="font-mono text-[10px] text-blue-500 mr-1.5">
                        ({dept.code})
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Edit Code */}
            {editingCode === org.id ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                <label className="block text-xs font-medium text-yellow-800 mb-1.5">
                  کد سازمان جدید
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-1.5 text-sm font-mono border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                    placeholder="ORG-CODE"
                  />
                  <button
                    onClick={() => handleAction(org.id, 'approve', newCode)}
                    disabled={processingId === org.id}
                    className="px-4 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg"
                  >
                    {processingId === org.id ? '...' : 'ذخیره و تأیید'}
                  </button>
                  <button
                    onClick={cancelEditCode}
                    className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm rounded-lg"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction(org.id, 'approve')}
                  disabled={processingId === org.id}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
                >
                  <CheckCircle size={16} />
                  {processingId === org.id ? 'در حال تأیید...' : 'تأیید سازمان'}
                </button>

                <button
                  onClick={() => startEditCode(org)}
                  disabled={processingId === org.id}
                  className="px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition flex items-center gap-1.5"
                  title="ویرایش کد سازمان"
                >
                  <Pencil size={14} />
                  ویرایش کد
                </button>

                <button
                  onClick={() => handleAction(org.id, 'reject')}
                  disabled={processingId === org.id}
                  className="px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition flex items-center gap-1.5"
                >
                  <XCircle size={14} />
                  رد
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
