'use client';

import { useAuthStore } from '@/store/auth-store';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Building2,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Building,
  TrendingUp,
  FileText,
  Search,
  Eye,
  Calendar,
  Users,
  BarChart3,
  Activity,
  Award,
  Zap,
  Crown,
  PieChart,
  Sparkles
} from 'lucide-react';

// Recharts
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const COLORS = ['#6366f1', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

interface DashboardStats {
  totalAssets: number;
  verifiedAssets: number;
  pendingAssets: number;
  rejectedAssets: number;
  totalUsers: number;
  totalDepartments: number;
}

interface RecentAsset {
  id: number;
  asset_name: string;
  asset_uid: string;
  category: string;
  result: string;
  created_at: string;
  created_by_name: string;
  organization_name: string;
  department_name: string;
  description: string;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalAssets: 0,
    verifiedAssets: 0,
    pendingAssets: 0,
    rejectedAssets: 0,
    totalUsers: 0,
    totalDepartments: 0,
  });
  const [recentAssets, setRecentAssets] = useState<RecentAsset[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const role = user?.role || 'org_user';
  const isSuperAdmin = role === 'super_admin';
  const isOrgAdmin = role === 'org_admin';
  const isOrgUser = role === 'org_user';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // دریافت دارایی‌ها
      const { data: assetsData } = await api.get('/intangible/screened-assets/');
      const assets = assetsData.results || assetsData || [];

      const verified = assets.filter((a: any) => a.result === 'confirmed').length;
      const pending = assets.filter((a: any) => a.result === 'conditional').length;
      const rejected = assets.filter((a: any) => a.result === 'rejected').length;

      let totalUsers = 0;
      let totalDepartments = 0;

      try {
        const { data: usersData } = await api.get('/auth/users/');
        const users = usersData.results || usersData || [];
        totalUsers = users.length;
      } catch (e) {}

      try {
        const { data: deptsData } = await api.get('/auth/departments/');
        const depts = deptsData.results || deptsData || [];
        totalDepartments = depts.length;
      } catch (e) {}

      setStats({
        totalAssets: assets.length,
        verifiedAssets: verified,
        pendingAssets: pending,
        rejectedAssets: rejected,
        totalUsers: totalUsers,
        totalDepartments: totalDepartments,
      });

      // داده‌های نمودار
      const categoryMap: Record<string, string> = {
        'strategic_economic': 'استراتژیک',
        'strategic_social': 'استراتژیک',
        'strategic_knowledge': 'استراتژیک',
        'strategic_cultural': 'استراتژیک',
        'strategic_environmental': 'استراتژیک',
        'operational_economic': 'عملیاتی',
        'operational_social': 'عملیاتی',
        'operational_knowledge': 'عملیاتی',
        'operational_cultural': 'عملیاتی',
        'operational_environmental': 'عملیاتی',
        'support_economic': 'پشتیبان',
        'support_social': 'پشتیبان',
        'support_knowledge': 'پشتیبان',
        'support_cultural': 'پشتیبان',
        'support_environmental': 'پشتیبان',
      };

      const chartDataMap: Record<string, number> = {
        'استراتژیک': 0,
        'عملیاتی': 0,
        'پشتیبان': 0,
      };

      assets.forEach((a: any) => {
        const cat = categoryMap[a.category] || 'سایر';
        if (chartDataMap[cat] !== undefined) {
          chartDataMap[cat]++;
        }
      });

      setChartData(Object.keys(chartDataMap).map(key => ({
        name: key,
        value: chartDataMap[key],
      })));

      const sorted = [...assets].sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setRecentAssets(sorted.slice(0, 5));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getResultBadge = (result: string) => {
    const colors = {
      confirmed: 'bg-emerald-100 text-emerald-800',
      conditional: 'bg-amber-100 text-amber-800',
      rejected: 'bg-red-100 text-red-800',
    };
    const labels = {
      confirmed: 'تأیید شده',
      conditional: 'مشروط',
      rejected: 'رد شده',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[result as keyof typeof colors] || 'bg-gray-100'}`}>
        {labels[result as keyof typeof labels] || result}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch { return dateString; }
  };

  const getFullName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.email?.split('@')[0] || 'کاربر';
  };

  const getRoleDisplay = (role: string) => {
    const roles: Record<string, string> = {
      super_admin: 'ادمین کل سیستم',
      org_admin: 'مدیر مجموعه',
      org_user: 'مدیر واحد',
    };
    return roles[role] || role;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // ============================================================
  // 1. داشبورد super_admin (رضا پازن) - مدیریت کلان
  // ============================================================
  if (isSuperAdmin) {
    return (
      <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
        <div className="bg-gradient-to-r from-indigo-700 to-purple-800 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          <div className="relative flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm border border-white/10"><User className="w-8 h-8" /></div>
                <div>
                  <h1 className="text-2xl font-bold">خوش آمدید، {getFullName()} عزیز</h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm backdrop-blur-sm border border-white/10">{getRoleDisplay(role)}</span>
                    <span className="bg-yellow-400/20 px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-yellow-400/20"><Award className="w-4 h-4" /> دسترسی کامل</span>
                  </div>
                </div>
              </div>
            </div>
            <Link href="/dashboard/companies">
              <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm transition-all backdrop-blur-sm border border-white/10 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> مدیریت شرکت‌ها
              </button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500 font-medium">کل دارایی‌ها</p><p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalAssets}</p></div><div className="bg-blue-50 p-3 rounded-xl"><Package className="w-6 h-6 text-blue-600" /></div></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500 font-medium">تأیید شده</p><p className="text-3xl font-bold text-emerald-600 mt-1">{stats.verifiedAssets}</p></div><div className="bg-emerald-50 p-3 rounded-xl"><CheckCircle className="w-6 h-6 text-emerald-600" /></div></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500 font-medium">در انتظار</p><p className="text-3xl font-bold text-amber-600 mt-1">{stats.pendingAssets}</p></div><div className="bg-amber-50 p-3 rounded-xl"><Clock className="w-6 h-6 text-amber-600" /></div></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500 font-medium">رد شده</p><p className="text-3xl font-bold text-red-600 mt-1">{stats.rejectedAssets}</p></div><div className="bg-red-50 p-3 rounded-xl"><AlertCircle className="w-6 h-6 text-red-600" /></div></div></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="p-6 flex items-center gap-4"><div className="bg-indigo-100 p-3 rounded-xl"><Building2 className="w-6 h-6 text-indigo-600" /></div><div><p className="text-sm text-gray-500">شرکت‌ها</p><p className="text-2xl font-bold">2</p></div></CardContent></Card>
          <Card><CardContent className="p-6 flex items-center gap-4"><div className="bg-blue-100 p-3 rounded-xl"><Building className="w-6 h-6 text-blue-600" /></div><div><p className="text-sm text-gray-500">واحدها</p><p className="text-2xl font-bold">{stats.totalDepartments}</p></div></CardContent></Card>
          <Card><CardContent className="p-6 flex items-center gap-4"><div className="bg-purple-100 p-3 rounded-xl"><Users className="w-6 h-6 text-purple-600" /></div><div><p className="text-sm text-gray-500">کاربران</p><p className="text-2xl font-bold">{stats.totalUsers}</p></div></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><PieChart className="w-5 h-5 text-indigo-600" /> توزیع دارایی‌ها</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <RePieChart>
                  <Pie data={chartData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={90} dataKey="value">
                    {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                  </Pie>
                  <Tooltip /><Legend />
                </RePieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Activity className="w-5 h-5 text-indigo-600" /> خلاصه عملکرد</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-3"><span className="text-sm text-gray-500">کل دارایی‌ها</span><span className="text-lg font-bold">{stats.totalAssets}</span></div>
                <div className="flex justify-between items-center border-b pb-3"><span className="text-sm text-gray-500">نرخ تأیید</span><span className="text-lg font-bold text-emerald-600">{stats.totalAssets > 0 ? Math.round((stats.verifiedAssets / stats.totalAssets) * 100) : 0}%</span></div>
                <div className="flex justify-between items-center border-b pb-3"><span className="text-sm text-gray-500">شرکت‌ها</span><span className="text-lg font-bold">2</span></div>
                <div className="flex justify-between items-center"><span className="text-sm text-gray-500">کاربران</span><span className="text-lg font-bold">{stats.totalUsers}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Clock className="w-5 h-5 text-indigo-600" /> آخرین فعالیت‌ها</CardTitle>
            <Link href="/dashboard/intangible/assets"><Button variant="ghost" size="sm" className="text-indigo-600">مشاهده همه</Button></Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentAssets.map((asset) => (
                <Link href={`/dashboard/intangible/assets/${asset.id}`} key={asset.id}>
                  <div className="p-4 border rounded-xl hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer bg-white">
                    <div className="flex items-center justify-between"><span className="font-medium text-sm">{asset.asset_name}</span>{getResultBadge(asset.result)}</div>
                    <p className="text-xs text-gray-400 mt-1">{asset.asset_uid}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500"><Building2 className="w-3 h-3" />{asset.organization_name || 'نامشخص'}</div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400"><Calendar className="w-3 h-3" />{formatDate(asset.created_at)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================================
  // 2. داشبورد org_admin (رضا تنهایی، محمد رضا سعیدی) - مدیریت مجموعه
  // ============================================================
  if (isOrgAdmin) {
    return (
      <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          <div className="relative flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm border border-white/10"><User className="w-8 h-8" /></div>
                <div>
                  <h1 className="text-2xl font-bold">خوش آمدید، {getFullName()} عزیز</h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm backdrop-blur-sm border border-white/10">{getRoleDisplay(role)}</span>
                    <span className="bg-emerald-400/20 px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-emerald-400/20"><Building2 className="w-4 h-4" />{user?.organization_name}</span>
                  </div>
                </div>
              </div>
            </div>
            <Link href="/dashboard/intangible/screening/new">
              <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm transition-all backdrop-blur-sm border border-white/10 flex items-center gap-2">
                <Search className="w-4 h-4" /> غربالگری جدید
              </button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500 font-medium">کل دارایی‌ها</p><p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalAssets}</p></div><div className="bg-blue-50 p-3 rounded-xl"><Package className="w-6 h-6 text-blue-600" /></div></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500 font-medium">تأیید شده</p><p className="text-3xl font-bold text-emerald-600 mt-1">{stats.verifiedAssets}</p></div><div className="bg-emerald-50 p-3 rounded-xl"><CheckCircle className="w-6 h-6 text-emerald-600" /></div></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500 font-medium">در انتظار</p><p className="text-3xl font-bold text-amber-600 mt-1">{stats.pendingAssets}</p></div><div className="bg-amber-50 p-3 rounded-xl"><Clock className="w-6 h-6 text-amber-600" /></div></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500 font-medium">رد شده</p><p className="text-3xl font-bold text-red-600 mt-1">{stats.rejectedAssets}</p></div><div className="bg-red-50 p-3 rounded-xl"><AlertCircle className="w-6 h-6 text-red-600" /></div></div></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="p-6 flex items-center gap-4"><div className="bg-indigo-100 p-3 rounded-xl"><Building className="w-6 h-6 text-indigo-600" /></div><div><p className="text-sm text-gray-500">واحدها</p><p className="text-2xl font-bold">{stats.totalDepartments}</p></div></CardContent></Card>
          <Card><CardContent className="p-6 flex items-center gap-4"><div className="bg-purple-100 p-3 rounded-xl"><Users className="w-6 h-6 text-purple-600" /></div><div><p className="text-sm text-gray-500">کاربران</p><p className="text-2xl font-bold">{stats.totalUsers}</p></div></CardContent></Card>
          <Card><CardContent className="p-6 flex items-center gap-4"><div className="bg-emerald-100 p-3 rounded-xl"><TrendingUp className="w-6 h-6 text-emerald-600" /></div><div><p className="text-sm text-gray-500">نرخ تأیید</p><p className="text-2xl font-bold text-emerald-600">{stats.totalAssets > 0 ? Math.round((stats.verifiedAssets / stats.totalAssets) * 100) : 0}%</p></div></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><PieChart className="w-5 h-5 text-blue-600" /> توزیع دارایی‌ها</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <RePieChart>
                  <Pie data={chartData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={90} dataKey="value">
                    {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                  </Pie>
                  <Tooltip /><Legend />
                </RePieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Activity className="w-5 h-5 text-blue-600" /> خلاصه عملکرد</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-3"><span className="text-sm text-gray-500">کل دارایی‌ها</span><span className="text-lg font-bold">{stats.totalAssets}</span></div>
                <div className="flex justify-between items-center border-b pb-3"><span className="text-sm text-gray-500">تأیید شده</span><span className="text-lg font-bold text-emerald-600">{stats.verifiedAssets}</span></div>
                <div className="flex justify-between items-center border-b pb-3"><span className="text-sm text-gray-500">در انتظار</span><span className="text-lg font-bold text-amber-600">{stats.pendingAssets}</span></div>
                <div className="flex justify-between items-center border-b pb-3"><span className="text-sm text-gray-500">رد شده</span><span className="text-lg font-bold text-red-600">{stats.rejectedAssets}</span></div>
                <div className="flex justify-between items-center pt-2"><span className="text-sm text-gray-500">نرخ تأیید</span><span className="text-lg font-bold text-emerald-600">{stats.totalAssets > 0 ? Math.round((stats.verifiedAssets / stats.totalAssets) * 100) : 0}%</span></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Clock className="w-5 h-5 text-blue-600" /> آخرین دارایی‌ها</CardTitle>
            <Link href="/dashboard/intangible/assets"><Button variant="ghost" size="sm" className="text-blue-600">مشاهده همه</Button></Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentAssets.map((asset) => (
                <Link href={`/dashboard/intangible/assets/${asset.id}`} key={asset.id}>
                  <div className="p-4 border rounded-xl hover:shadow-md hover:border-blue-200 transition-all cursor-pointer bg-white">
                    <div className="flex items-center justify-between"><span className="font-medium text-sm">{asset.asset_name}</span>{getResultBadge(asset.result)}</div>
                    <p className="text-xs text-gray-400 mt-1">{asset.asset_uid}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500"><User className="w-3 h-3" />{asset.created_by_name || 'نامشخص'}</div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400"><Calendar className="w-3 h-3" />{formatDate(asset.created_at)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================================
  // 3. داشبورد org_user (دانیال فارسی، رعنا رحمانی) - مدیریت واحد
  // ============================================================
  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        <div className="relative flex items-start justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm border border-white/10"><User className="w-8 h-8" /></div>
              <div>
                <h1 className="text-2xl font-bold">خوش آمدید، {getFullName()} عزیز</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm backdrop-blur-sm border border-white/10">{getRoleDisplay(role)}</span>
                  <span className="bg-emerald-400/20 px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-emerald-400/20"><Building2 className="w-4 h-4" />{user?.organization_name}</span>
                  <span className="bg-teal-400/20 px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-teal-400/20"><Building className="w-4 h-4" />{user?.department_name}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>مدیریت دارایی‌های واحد {user?.department_name || ''}</span>
            </div>
          </div>
          <Link href="/dashboard/intangible/screening/new">
            <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm transition-all backdrop-blur-sm border border-white/10 flex items-center gap-2">
              <Search className="w-4 h-4" /> غربالگری جدید
            </button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500 font-medium">کل دارایی‌ها</p><p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalAssets}</p></div><div className="bg-blue-50 p-3 rounded-xl"><Package className="w-6 h-6 text-blue-600" /></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500 font-medium">تأیید شده</p><p className="text-3xl font-bold text-emerald-600 mt-1">{stats.verifiedAssets}</p></div><div className="bg-emerald-50 p-3 rounded-xl"><CheckCircle className="w-6 h-6 text-emerald-600" /></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500 font-medium">در انتظار</p><p className="text-3xl font-bold text-amber-600 mt-1">{stats.pendingAssets}</p></div><div className="bg-amber-50 p-3 rounded-xl"><Clock className="w-6 h-6 text-amber-600" /></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-500 font-medium">رد شده</p><p className="text-3xl font-bold text-red-600 mt-1">{stats.rejectedAssets}</p></div><div className="bg-red-50 p-3 rounded-xl"><AlertCircle className="w-6 h-6 text-red-600" /></div></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card><CardContent className="p-6 flex items-center gap-4"><div className="bg-purple-100 p-3 rounded-xl"><Users className="w-6 h-6 text-purple-600" /></div><div><p className="text-sm text-gray-500">همکاران</p><p className="text-2xl font-bold">{stats.totalUsers}</p></div></CardContent></Card>
        <Card><CardContent className="p-6 flex items-center gap-4"><div className="bg-indigo-100 p-3 rounded-xl"><TrendingUp className="w-6 h-6 text-indigo-600" /></div><div><p className="text-sm text-gray-500">نرخ تأیید</p><p className="text-2xl font-bold text-emerald-600">{stats.totalAssets > 0 ? Math.round((stats.verifiedAssets / stats.totalAssets) * 100) : 0}%</p></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><PieChart className="w-5 h-5 text-emerald-600" /> توزیع دارایی‌ها</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <RePieChart>
                <Pie data={chartData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={90} dataKey="value">
                  {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                </Pie>
                <Tooltip /><Legend />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Activity className="w-5 h-5 text-emerald-600" /> خلاصه عملکرد</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-3"><span className="text-sm text-gray-500">کل دارایی‌ها</span><span className="text-lg font-bold">{stats.totalAssets}</span></div>
              <div className="flex justify-between items-center border-b pb-3"><span className="text-sm text-gray-500">تأیید شده</span><span className="text-lg font-bold text-emerald-600">{stats.verifiedAssets}</span></div>
              <div className="flex justify-between items-center border-b pb-3"><span className="text-sm text-gray-500">در انتظار</span><span className="text-lg font-bold text-amber-600">{stats.pendingAssets}</span></div>
              <div className="flex justify-between items-center border-b pb-3"><span className="text-sm text-gray-500">رد شده</span><span className="text-lg font-bold text-red-600">{stats.rejectedAssets}</span></div>
              <div className="flex justify-between items-center pt-2"><span className="text-sm text-gray-500">نرخ تأیید</span><span className="text-lg font-bold text-emerald-600">{stats.totalAssets > 0 ? Math.round((stats.verifiedAssets / stats.totalAssets) * 100) : 0}%</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><Clock className="w-5 h-5 text-emerald-600" /> آخرین دارایی‌ها</CardTitle>
          <Link href="/dashboard/intangible/assets"><Button variant="ghost" size="sm" className="text-emerald-600">مشاهده همه</Button></Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentAssets.map((asset) => (
              <Link href={`/dashboard/intangible/assets/${asset.id}`} key={asset.id}>
                <div className="p-4 border rounded-xl hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer bg-white">
                  <div className="flex items-center justify-between"><span className="font-medium text-sm">{asset.asset_name}</span>{getResultBadge(asset.result)}</div>
                  <p className="text-xs text-gray-400 mt-1">{asset.asset_uid}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500"><User className="w-3 h-3" />{asset.created_by_name || 'نامشخص'}</div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400"><Calendar className="w-3 h-3" />{formatDate(asset.created_at)}</div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
