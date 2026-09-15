'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import {
  Building2, Users, DollarSign, Package, CheckCircle, Clock,
  TrendingUp, BarChart3, AlertCircle, ArrowRight, FileText,
  Settings, Activity, ChevronLeft, Crown, Layers,
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/intangible/dashboard/super-stats/');
        setData(res.data);
      } catch (err) {
        console.error('Load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatMoney = (value: number) => {
    if (!value || value === 0) return '۰';
    if (value >= 1e9) return `${(value / 1e9).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} میلیارد`;
    if (value >= 1e6) return `${(value / 1e6).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} میلیون`;
    if (value >= 1e3) return `${(value / 1e3).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} هزار`;
    return value.toLocaleString('fa-IR');
  };

  const getDisplayName = () => {
    if (!user) return 'کاربر';
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
    if (user.first_name) return user.first_name;
    if (user.username) return user.username;
    return 'کاربر';
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

  if (!data) return <div className="text-center py-12 text-gray-500">اطلاعاتی یافت نشد</div>;

  const { pending, stats, organizations, recent } = data;
  const maxOrgValue = Math.max(...organizations.map((o: any) => o.total_value), 1);

  return (
    <div className="container mx-auto p-6 rtl max-w-7xl">
      {/* ═════════ Header ═════════ */}
      <div className="bg-gradient-to-l from-[#04241D] to-[#0B3D30] rounded-2xl shadow-xl p-6 mb-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-white/60 text-xs mb-1">پنل مدیریت پلتفرم</p>
            <h1 className="text-2xl font-bold mb-2">داشبورد مدیر کل</h1>
            <p className="text-white/80 text-sm">
              {getDisplayName()} · ادمین کل پلتفرم
            </p>
          </div>
          <div className="text-4xl">👑</div>
        </div>
      </div>

      {/* ═════════ بخش ۱: نیازمند اقدام ═════════ */}
      {(pending.organizations > 0 || pending.viam_requests > 0) && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            نیازمند اقدام شما
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pending.organizations > 0 && (
              <Link href="/admin/organization-approvals">
                <div className="bg-gradient-to-l from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl p-5 hover:shadow-lg transition cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-orange-700">{pending.organizations.toLocaleString('fa-IR')}</p>
                        <p className="text-xs text-gray-600">سازمان در انتظار تأیید</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-orange-500" />
                  </div>
                </div>
              </Link>
            )}

            {pending.viam_requests > 0 && (
              <Link href="/admin/viam-approvals">
                <div className="bg-gradient-to-l from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 hover:shadow-lg transition cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-700">{pending.viam_requests.toLocaleString('fa-IR')}</p>
                        <p className="text-xs text-gray-600">درخواست VIAM در انتظار</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ═════════ بخش ۲: آمار کل ═════════ */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-gray-600" />
          آمار کل پلتفرم
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Building2 className="w-5 h-5" />}
            title="سازمان‌ها"
            value={stats.total_organizations.toLocaleString('fa-IR')}
            color="blue"
          />
          <StatCard
            icon={<Users className="w-5 h-5" />}
            title="کاربران"
            value={stats.total_users.toLocaleString('fa-IR')}
            color="purple"
          />
          <StatCard
            icon={<Package className="w-5 h-5" />}
            title="دارایی‌ها"
            value={stats.total_assets.toLocaleString('fa-IR')}
            color="green"
          />
          <StatCard
            icon={<DollarSign className="w-5 h-5" />}
            title="ارزش کل"
            value={formatMoney(stats.total_value) + ' ریال'}
            color="gold"
          />
        </div>

        {/* آمار تفصیلی */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <ProgressCard
            icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
            iconBg="bg-blue-100"
            title="DCF"
            value={formatMoney(stats.dcf_value)}
            percent={stats.total_value > 0 ? (stats.dcf_value / stats.total_value) * 100 : 0}
            color="bg-blue-500"
          />
          <ProgressCard
            icon={<BarChart3 className="w-5 h-5 text-purple-600" />}
            iconBg="bg-purple-100"
            title="NAV"
            value={formatMoney(stats.nav_value)}
            percent={stats.total_value > 0 ? (stats.nav_value / stats.total_value) * 100 : 0}
            color="bg-purple-500"
          />
          <ProgressCard
            icon={<Clock className="w-5 h-5 text-gray-600" />}
            iconBg="bg-gray-100"
            title="در حال بررسی"
            value={formatMoney(stats.unknown_value)}
            percent={stats.total_value > 0 ? (stats.unknown_value / stats.total_value) * 100 : 0}
            color="bg-gray-400"
          />
        </div>
      </div>

      {/* ═════════ بخش ۳: جدول سازمان‌ها ═════════ */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
        <div className="bg-gradient-to-l from-purple-50 to-blue-50 border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-600" />
            سازمان‌های پلتفرم ({organizations.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-right py-3 px-4 font-medium text-gray-600">سازمان</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">مدیرعامل</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">واحدها</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">دارایی‌ها</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">ارزش</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">وضعیت</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((org: any) => (
                <tr key={org.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{org.name}</span>
                      <span className="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">
                        {org.code}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {org.admin ? (
                      <div>
                        <p className="text-sm text-gray-800">{org.admin.name}</p>
                        <p className="text-xs text-gray-500">{org.admin.email}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-bold text-gray-800">{org.departments_count}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-bold text-gray-800">{org.assets_count}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-gray-800">{formatMoney(org.total_value)}</span>
                    <span className="text-xs text-gray-400 mr-1">ریال</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      org.status === 'active' ? 'bg-green-100 text-green-800' :
                      org.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {org.status === 'active' ? '✅ فعال' :
                       org.status === 'pending' ? '⏳ در انتظار' : org.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td className="py-3 px-4 font-bold text-gray-800">جمع کل</td>
                <td></td>
                <td className="py-3 px-4 text-center font-bold text-gray-800">{stats.total_departments}</td>
                <td className="py-3 px-4 text-center font-bold text-gray-800">{stats.total_assets}</td>
                <td className="py-3 px-4 font-bold text-gray-800">
                  {formatMoney(stats.total_value)} <span className="text-xs text-gray-400">ریال</span>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ═════════ بخش ۴: نمودار ارزش ═════════ */}
      {organizations.some((o: any) => o.total_value > 0) && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            ارزش پورتفولیو بر اساس سازمان
          </h2>
          <div className="space-y-3">
            {organizations
              .filter((o: any) => o.total_value > 0)
              .sort((a: any, b: any) => b.total_value - a.total_value)
              .map((org: any) => (
                <div key={org.id} className="flex items-center gap-3">
                  <div className="w-32 text-xs text-gray-600 truncate">{org.name}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                    <div
                      className="bg-gradient-to-l from-green-500 to-green-400 h-6 rounded-full transition-all flex items-center px-2"
                      style={{ width: `${Math.max((org.total_value / maxOrgValue) * 100, 5)}%` }}
                    >
                      <span className="text-[10px] text-white font-bold">
                        {formatMoney(org.total_value)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ═════════ بخش ۵: دسترسی سریع ═════════ */}
      <div>
        <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Layers className="w-5 h-5 text-gray-600" />
          دسترسی سریع
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickAction href="/admin/organization-approvals" icon="🏢" label="تأیید سازمان‌ها" />
          <QuickAction href="/admin/viam-approvals" icon="✅" label="تأیید VIAM" />
          <QuickAction href="/admin/api-dashboard" icon="📊" label="تاریخچه API" />
          <QuickAction href="/dashboard/settings" icon="⚙️" label="تنظیمات" />
        </div>
      </div>
    </div>
  );
}

// ═════════ کامپوننت‌های کمکی ═════════

function StatCard({ icon, title, value, color }: any) {
  const colors: any = {
    gold: 'from-yellow-50 to-yellow-100 border-yellow-200',
    blue: 'from-blue-50 to-blue-100 border-blue-200',
    green: 'from-green-50 to-green-100 border-green-200',
    purple: 'from-purple-50 to-purple-100 border-purple-200',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-5`}>
      <div className="opacity-70 mb-2">{icon}</div>
      <p className="text-xs text-gray-600 mb-1">{title}</p>
      <p className="text-lg font-bold text-gray-800">{value}</p>
    </div>
  );
}

function ProgressCard({ icon, iconBg, title, value, percent, color }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-500">{title}</p>
          <p className="text-lg font-bold text-gray-800">{value}</p>
        </div>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function QuickAction({ href, icon, label }: any) {
  return (
    <Link href={href}>
      <button className="w-full bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md transition rounded-xl p-4 flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </button>
    </Link>
  );
}
