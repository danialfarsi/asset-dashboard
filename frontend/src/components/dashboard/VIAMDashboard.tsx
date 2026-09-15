'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import {
  Building2, Package, DollarSign, CheckCircle, Clock,
  AlertCircle, TrendingUp, BarChart3,
} from 'lucide-react';

interface OrganizationInfo {
  id: number;
  name: string;
  code: string;
  status: 'pending' | 'active' | 'rejected' | 'suspended';
}

interface Department {
  id: number;
  name: string;
  code: string;
  status: string;
  manager: {
    id: number;
    name: string;
    email: string;
    username: string;
  } | null;
  asset_count: number;
  total_value: number;
  invite_token?: string | null;
  invite_used?: boolean;
}

interface Stats {
  total_assets: number;
  total_departments: number;
  total_value: number;
  registered_assets: number;
  in_progress_assets: number;
  protected_assets: number;
  dcf_value: number;
  nav_value: number;
  unknown_value: number;
}

export default function VIAMDashboard() {
  const { user } = useAuthStore();
  const [organization, setOrganization] = useState<OrganizationInfo | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_assets: 0,
    total_departments: 0,
    total_value: 0,
    registered_assets: 0,
    in_progress_assets: 0,
    protected_assets: 0,
    dcf_value: 0,
    nav_value: 0,
    unknown_value: 0,
  });
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await api.get('/intangible/dashboard/org-stats/');
        const data = res.data;

        setOrganization({
          id: data.organization.id,
          name: data.organization.name,
          code: data.organization.code || '',
          status: data.organization.status || 'active',
        });

        setStats({
          total_assets: data.stats.total_assets,
          total_departments: data.stats.total_departments,
          total_value: data.stats.total_value,
          registered_assets: data.stats.registered_assets,
          in_progress_assets: data.stats.total_assets - data.stats.registered_assets,
          protected_assets: 0,
          dcf_value: data.stats.dcf_value,
          nav_value: data.stats.nav_value,
          unknown_value: data.stats.unknown_value,
        });

        setDepartments(data.departments || []);
      } catch (err) {
        console.error('Load error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const generateInvite = async (deptId: number, deptName: string) => {
    setGeneratingId(deptId);
    try {
      const res = await api.post(`/auth/departments/${deptId}/generate-invite/`);
      const token = res.data.invite_token;
      setDepartments(prev =>
        prev.map(d =>
          d.id === deptId ? { ...d, invite_token: token } : d
        )
      );
      showToast(`لینک دعوت برای «${deptName}» ساخته شد`);
    } catch (err: any) {
      console.error('Generate invite error:', err);
      showToast(err.response?.data?.error || 'خطا در ساخت لینک', 'error');
    } finally {
      setGeneratingId(null);
    }
  };

  const copyInviteLink = (token: string, deptName: string) => {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    showToast(`لینک دعوت «${deptName}» کپی شد`);
  };

  const getDisplayName = () => {
    if (!user) return 'کاربر';
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
    if (user.first_name) return user.first_name;
    if (user.username) return user.username;
    return 'کاربر';
  };

  const getRoleLabel = () => {
    if (user?.role === 'super_admin') return 'ادمین کل پلتفرم';
    if (user?.role === 'org_admin') return 'مدیرعامل / رییس سازمان';
    if (user?.role === 'org_user') return 'رییس واحد';
    return 'کاربر';
  };

  const formatMoney = (value: number) => {
    if (!value || value === 0) return '۰';
    if (value >= 1e9) return `${(value / 1e9).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} میلیارد`;
    if (value >= 1e6) return `${(value / 1e6).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} میلیون`;
    if (value >= 1e3) return `${(value / 1e3).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} هزار`;
    return value.toLocaleString('fa-IR');
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

  const isPending = organization?.status === 'pending';
  const isActive = organization?.status === 'active';
  const isRejected = organization?.status === 'rejected';

  return (
    <div className="container mx-auto p-6 rtl max-w-7xl">
      {/* 🎯 Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in duration-300">
          <div
            className={`px-6 py-3 rounded-xl shadow-lg border-2 flex items-center gap-3 ${
              toast.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <span className="text-lg">{toast.type === 'success' ? '✅' : '❌'}</span>
            <span className="font-medium text-sm">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">داشبورد مدیریتی</h1>
          <p className="text-gray-600 mt-1">
            {getDisplayName()}
            <span className="mr-2 text-sm text-gray-400">({getRoleLabel()})</span>
          </p>
          {organization && (
            <p className="text-sm text-gray-500 mt-1">
              🏢 {organization.name}
              {organization.code && (
                <span className="mr-2 font-mono text-xs text-gray-400">({organization.code})</span>
              )}
            </p>
          )}
        </div>

        {organization && (
          <div>
            {isPending && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                <Clock size={14} />
                در انتظار تأیید
              </span>
            )}
            {isActive && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                <CheckCircle size={14} />
                فعال
              </span>
            )}
          </div>
        )}
      </div>

      {/* Pending */}
      {isPending && (
        <>
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <Clock className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-lg font-bold text-yellow-800 mb-1">
                  سازمان شما در انتظار تأیید است
                </h2>
                <p className="text-yellow-700 text-sm leading-6">
                  درخواست شما در انتظار بررسی توسط مدیر پلتفرم است.
                </p>
              </div>
            </div>
          </div>

          <Link href="/viam/establishment/list">
            <div className="bg-white border-2 border-blue-500 rounded-xl p-6 hover:shadow-lg transition cursor-pointer">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                📋 تکمیل مراحل استقرار
              </h3>
              <p className="text-gray-600 text-sm">
                برای تکمیل فرآیند تأسیس واحد IAM، مراحل را دنبال کنید.
              </p>
            </div>
          </Link>
        </>
      )}

      {/* Active */}
      {isActive && (
        <>
          {/* کارت‌های آمار */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={<DollarSign className="w-6 h-6" />}
              title="ارزش کل پورتفولیو"
              value={formatMoney(stats.total_value) + ' ریال'}
              color="gold"
            />
            <StatCard
              icon={<Package className="w-6 h-6" />}
              title="کل دارایی‌ها"
              value={stats.total_assets.toLocaleString('fa-IR')}
              color="blue"
            />
            <StatCard
              icon={<Building2 className="w-6 h-6" />}
              title="تعداد واحدها"
              value={stats.total_departments.toLocaleString('fa-IR')}
              color="purple"
            />
            <StatCard
              icon={<CheckCircle className="w-6 h-6" />}
              title="دارایی‌های ثبت‌شده"
              value={stats.registered_assets.toLocaleString('fa-IR')}
              color="green"
            />
          </div>

          {/* آمار تفصیلی */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">ارزش‌گذاری DCF</p>
                  <p className="text-lg font-bold text-gray-800">{formatMoney(stats.dcf_value)}</p>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-blue-500 h-1.5 rounded-full"
                  style={{ width: `${stats.total_value > 0 ? (stats.dcf_value / stats.total_value) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">ارزش‌گذاری NAV</p>
                  <p className="text-lg font-bold text-gray-800">{formatMoney(stats.nav_value)}</p>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-purple-500 h-1.5 rounded-full"
                  style={{ width: `${stats.total_value > 0 ? (stats.nav_value / stats.total_value) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">در حال بررسی</p>
                  <p className="text-lg font-bold text-gray-800">{formatMoney(stats.unknown_value)}</p>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-gray-400 h-1.5 rounded-full"
                  style={{ width: `${stats.total_value > 0 ? (stats.unknown_value / stats.total_value) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* جدول واحدها */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
            <div className="bg-gradient-to-l from-purple-50 to-blue-50 border-b border-gray-200 p-5 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-purple-600" />
                  واحدهای سازمان ({departments.length})
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  آمار دارایی‌ها و ارزش هر واحد
                </p>
              </div>
              <Link href="/viam/establishment/list">
                <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                  مدیریت واحدها →
                </button>
              </Link>
            </div>

            {departments.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                هنوز واحدی تعریف نشده است
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">واحد</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">مدیر</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">دارایی‌ها</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">ارزش</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">وضعیت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((dept) => (
                      <tr key={dept.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">{dept.name}</span>
                            <span className="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">
                              {dept.code}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {dept.manager ? (
                            <div>
                              <p className="text-sm text-gray-800">{dept.manager.name}</p>
                              <p className="text-xs text-gray-500">{dept.manager.email}</p>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <span className="text-xs text-yellow-700">⏳ منتظر ثبت‌نام</span>
                              {dept.invite_token && !dept.invite_used ? (
                                <div className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded p-1">
                                  <span className="text-[10px] font-mono text-blue-700 truncate flex-1">
                                    /invite/{dept.invite_token.slice(0, 12)}...
                                  </span>
                                  <button
                                    onClick={() => copyInviteLink(dept.invite_token!, dept.name)}
                                    className="px-1.5 py-0.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] rounded transition flex-shrink-0"
                                  >
                                    📋 کپی
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => generateInvite(dept.id, dept.name)}
                                  disabled={generatingId === dept.id}
                                  className="flex items-center gap-1 px-2 py-1 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white text-[11px] font-medium rounded transition"
                                >
                                  {generatingId === dept.id ? '⏳ در حال ساخت...' : '⚡ ساخت لینک دعوت'}
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-bold text-gray-800">
                            {dept.asset_count.toLocaleString('fa-IR')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-gray-800">
                            {formatMoney(dept.total_value)}
                          </span>
                          <span className="text-xs text-gray-400 mr-1">ریال</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {dept.manager ? (
                            <span className="inline-block px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                              ✅ فعال
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                              ⏳ منتظر
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                    <tr>
                      <td className="py-3 px-4 font-bold text-gray-800">جمع کل</td>
                      <td></td>
                      <td className="py-3 px-4 text-center font-bold text-gray-800">
                        {stats.total_assets.toLocaleString('fa-IR')}
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-800">
                        {formatMoney(stats.total_value)} <span className="text-xs text-gray-400">ریال</span>
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* دکمه‌های اقدام */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ActionButton href="/viam/establishment/list" icon="📋" label="مدیریت VIAM" />
            <ActionButton href="/dashboard/intangible/assets" icon="📦" label="دارایی‌ها" />
            <ActionButton href="/viam/raci" icon="📊" label="RACI" />
            <ActionButton href="/viam/committee" icon="👥" label="کمیته" />
          </div>
        </>
      )}

      {/* Rejected */}
      {isRejected && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-red-800 mb-2">❌ سازمان شما رد شده است</h2>
          <p className="text-red-700 text-sm">
            برای اطلاعات بیشتر با پشتیبانی تماس بگیرید.
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, title, value, color }: any) {
  const colors: any = {
    gold: 'from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-700',
    blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-700',
    purple: 'from-purple-50 to-purple-100 border-purple-200 text-purple-700',
    green: 'from-green-50 to-green-100 border-green-200 text-green-700',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-5`}>
      <div className="flex items-start justify-between mb-2">
        <div className="opacity-70">{icon}</div>
      </div>
      <p className="text-xs text-gray-600 mb-1">{title}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

function ActionButton({ href, icon, label }: any) {
  return (
    <Link href={href}>
      <button className="w-full bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md transition rounded-xl p-4 flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </button>
    </Link>
  );
}
