'use client';

import { useAuthStore } from '@/store/auth-store';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';
import { PageTransition } from '@/components/ui/page-transition';
import { NotificationBar } from '@/components/ui/notification-bar';
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
  Layers,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Target,
  Rocket,
  Shield,
  Star,
  Gift,
  Coffee,
  Brain,
  Lightbulb,
  Briefcase,
  Globe,
  Heart,
  Compass
} from 'lucide-react';

// Recharts
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

const COLORS = ['#015345', '#8ECFAF', '#D4A547', '#3B7A6E', '#F5F5F5', '#EF4444'];

interface DashboardStats {
  totalAssets: number;
  verifiedAssets: number;
  pendingAssets: number;
  rejectedAssets: number;
  totalUsers: number;
  totalDepartments: number;
  valuationProgress: number;
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
    valuationProgress: 0,
  });
  const [recentAssets, setRecentAssets] = useState<RecentAsset[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [valuationStatus, setValuationStatus] = useState<{
    completed: number;
    inProgress: number;
    notStarted: number;
  }>({ completed: 0, inProgress: 0, notStarted: 0 });

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

      // وضعیت ارزیابی
      let completed = 0,
        inProgress = 0,
        notStarted = 0;
      try {
        const { data: valData } = await api.get('/intangible/asset-valuations/');
        const vals = valData.results || valData || [];
        completed = vals.filter((v: any) => v.status === 'completed').length;
        inProgress = vals.filter((v: any) => v.status === 'draft' || v.status === 'in_progress').length;
        notStarted = Math.max(0, assets.length - completed - inProgress);
      } catch (e) {}

      setStats({
        totalAssets: assets.length,
        verifiedAssets: verified,
        pendingAssets: pending,
        rejectedAssets: rejected,
        totalUsers: totalUsers,
        totalDepartments: totalDepartments,
        valuationProgress: assets.length > 0 ? Math.round((completed / assets.length) * 100) : 0,
      });

      setValuationStatus({ completed, inProgress, notStarted });

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'صبح بخیر ☀️';
    if (hour < 17) return 'ظهر بخیر 🌤️';
    if (hour < 21) return 'عصر بخیر 🌅';
    return 'شب بخیر 🌙';
  };

  // تابع کمکی برای فرمت درصد
  const formatPercent = (percent: number | undefined) => {
    if (percent === undefined || isNaN(percent)) return '۰%';
    return `${(percent * 100).toFixed(0)}%`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <SkeletonLoader variant="dashboard" />
      </div>
    );
  }

  // ============================================================
  // 1. DASHBOARD SUPER_ADMIN
  // ============================================================
  if (isSuperAdmin) {
    return (
      <PageTransition className="p-6 space-y-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">
        <NotificationBar />

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-dark-green via-medium-green to-aqua-green p-8 text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-golden-amber rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          </div>
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/20">
                <Crown className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm text-white/80">{getGreeting()}</p>
                <h1 className="text-2xl md:text-3xl font-bold">{getFullName()}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-xs backdrop-blur-sm border border-white/10 flex items-center gap-1">
                    <Crown className="w-3 h-3" /> {getRoleDisplay(role)}
                  </span>
                  <span className="bg-golden-amber/30 px-3 py-1 rounded-full text-xs flex items-center gap-1 border border-golden-amber/30">
                    <Award className="w-3 h-3" /> دسترسی کامل
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/dashboard/companies">
                <Button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20 text-white">
                  <Building2 className="w-4 h-4 ml-2" />
                  مدیریت شرکت‌ها
                </Button>
              </Link>
              <Link href="/dashboard/intangible/screening/new">
                <Button className="bg-golden-amber hover:bg-golden-amber/90 text-white border-0">
                  <Search className="w-4 h-4 ml-2" />
                  غربالگری جدید
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { label: 'کل دارایی‌ها', value: stats.totalAssets, icon: Package },
              { label: 'تأیید شده', value: stats.verifiedAssets, icon: CheckCircle },
              { label: 'در انتظار', value: stats.pendingAssets, icon: Clock },
              { label: 'نرخ تأیید', value: stats.totalAssets > 0 ? `${Math.round((stats.verifiedAssets / stats.totalAssets) * 100)}%` : '۰%', icon: TrendingUp },
            ].map((stat, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <p className="text-xs text-white/70">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">کل دارایی‌ها</p>
                  <p className="text-3xl font-bold text-dark-green mt-1">{stats.totalAssets}</p>
                </div>
                <div className="bg-dark-green/10 p-3 rounded-xl">
                  <Package className="w-6 h-6 text-dark-green" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">تأیید شده</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.verifiedAssets}</p>
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">در انتظار</p>
                  <p className="text-3xl font-bold text-amber-600 mt-1">{stats.pendingAssets}</p>
                </div>
                <div className="bg-amber-50 p-3 rounded-xl">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">رد شده</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">{stats.rejectedAssets}</p>
                </div>
                <div className="bg-red-50 p-3 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-dark-green/10 p-3 rounded-xl">
                <Building2 className="w-6 h-6 text-dark-green" />
              </div>
              <div>
                <p className="text-sm text-gray-500">شرکت‌ها</p>
                <p className="text-2xl font-bold text-dark-green">2</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-aqua-green/20 p-3 rounded-xl">
                <Building className="w-6 h-6 text-medium-green" />
              </div>
              <div>
                <p className="text-sm text-gray-500">واحدها</p>
                <p className="text-2xl font-bold text-dark-green">{stats.totalDepartments}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-golden-amber/20 p-3 rounded-xl">
                <Users className="w-6 h-6 text-golden-amber" />
              </div>
              <div>
                <p className="text-sm text-gray-500">کاربران</p>
                <p className="text-2xl font-bold text-dark-green">{stats.totalUsers}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-dark-green">
                <PieChart className="w-5 h-5 text-dark-green" />
                توزیع دارایی‌ها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <RePieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${formatPercent(percent)}`}
                    outerRadius={90}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-dark-green">
                <Activity className="w-5 h-5 text-dark-green" />
                خلاصه عملکرد
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: 'کل دارایی‌ها', value: stats.totalAssets, color: 'dark-green' },
                  { label: 'تأیید شده', value: stats.verifiedAssets, color: 'emerald-600' },
                  { label: 'در انتظار', value: stats.pendingAssets, color: 'amber-600' },
                  { label: 'رد شده', value: stats.rejectedAssets, color: 'red-600' },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center border-b pb-3">
                    <span className="text-sm text-gray-500">{item.label}</span>
                    <span className={`text-lg font-bold text-${item.color}`}>{item.value}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2">
                  <span className="text-sm text-gray-500">نرخ تأیید</span>
                  <span className="text-lg font-bold text-emerald-600">
                    {stats.totalAssets > 0 ? Math.round((stats.verifiedAssets / stats.totalAssets) * 100) : 0}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2 text-dark-green">
              <Clock className="w-5 h-5 text-dark-green" />
              آخرین فعالیت‌ها
            </CardTitle>
            <Link href="/dashboard/intangible/assets">
              <Button variant="ghost" size="sm" className="text-dark-green">مشاهده همه</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentAssets.map((asset) => (
                <Link href={`/dashboard/intangible/assets/${asset.id}`} key={asset.id}>
                  <div className="p-4 border rounded-xl hover:shadow-md hover:border-dark-green transition-all cursor-pointer bg-white">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{asset.asset_name}</span>
                      {getResultBadge(asset.result)}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{asset.asset_uid}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <Building2 className="w-3 h-3" />
                      {asset.organization_name || 'نامشخص'}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />
                      {formatDate(asset.created_at)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </PageTransition>
    );
  }

  // ============================================================
  // 2. DASHBOARD ORG_ADMIN
  // ============================================================
  if (isOrgAdmin) {
    return (
      <PageTransition className="p-6 space-y-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">
        <NotificationBar />

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-dark-green via-aqua-green to-medium-green p-8 text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-golden-amber rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          </div>
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/20">
                <Building2 className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm text-white/80">{getGreeting()}</p>
                <h1 className="text-2xl md:text-3xl font-bold">{getFullName()}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-xs backdrop-blur-sm border border-white/10 flex items-center gap-1">
                    <User className="w-3 h-3" /> {getRoleDisplay(role)}
                  </span>
                  <span className="bg-golden-amber/30 px-3 py-1 rounded-full text-xs flex items-center gap-1 border border-golden-amber/30">
                    <Building2 className="w-3 h-3" /> {user?.organization_name}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/dashboard/departments">
                <Button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20 text-white">
                  <Building className="w-4 h-4 ml-2" />
                  مدیریت واحدها
                </Button>
              </Link>
              <Link href="/dashboard/intangible/screening/new">
                <Button className="bg-golden-amber hover:bg-golden-amber/90 text-white border-0">
                  <Search className="w-4 h-4 ml-2" />
                  غربالگری جدید
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { label: 'کل دارایی‌ها', value: stats.totalAssets, icon: Package },
              { label: 'تأیید شده', value: stats.verifiedAssets, icon: CheckCircle },
              { label: 'در انتظار', value: stats.pendingAssets, icon: Clock },
              { label: 'نرخ تأیید', value: stats.totalAssets > 0 ? `${Math.round((stats.verifiedAssets / stats.totalAssets) * 100)}%` : '۰%', icon: TrendingUp },
            ].map((stat, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <p className="text-xs text-white/70">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-gray-500 font-medium">کل دارایی‌ها</p><p className="text-3xl font-bold text-dark-green mt-1">{stats.totalAssets}</p></div>
                <div className="bg-dark-green/10 p-3 rounded-xl"><Package className="w-6 h-6 text-dark-green" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-gray-500 font-medium">تأیید شده</p><p className="text-3xl font-bold text-emerald-600 mt-1">{stats.verifiedAssets}</p></div>
                <div className="bg-emerald-50 p-3 rounded-xl"><CheckCircle className="w-6 h-6 text-emerald-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-gray-500 font-medium">در انتظار</p><p className="text-3xl font-bold text-amber-600 mt-1">{stats.pendingAssets}</p></div>
                <div className="bg-amber-50 p-3 rounded-xl"><Clock className="w-6 h-6 text-amber-600" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-gray-500 font-medium">رد شده</p><p className="text-3xl font-bold text-red-600 mt-1">{stats.rejectedAssets}</p></div>
                <div className="bg-red-50 p-3 rounded-xl"><AlertCircle className="w-6 h-6 text-red-600" /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-dark-green/10 p-3 rounded-xl"><Building className="w-6 h-6 text-dark-green" /></div>
              <div><p className="text-sm text-gray-500">واحدها</p><p className="text-2xl font-bold text-dark-green">{stats.totalDepartments}</p></div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-aqua-green/20 p-3 rounded-xl"><Users className="w-6 h-6 text-medium-green" /></div>
              <div><p className="text-sm text-gray-500">کاربران</p><p className="text-2xl font-bold text-dark-green">{stats.totalUsers}</p></div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-golden-amber/20 p-3 rounded-xl"><TrendingUp className="w-6 h-6 text-golden-amber" /></div>
              <div><p className="text-sm text-gray-500">نرخ تأیید</p><p className="text-2xl font-bold text-emerald-600">{stats.totalAssets > 0 ? Math.round((stats.verifiedAssets / stats.totalAssets) * 100) : 0}%</p></div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base flex items-center gap-2 text-dark-green"><PieChart className="w-5 h-5 text-dark-green" /> توزیع دارایی‌ها</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <RePieChart>
                  <Pie data={chartData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${formatPercent(percent)}`} outerRadius={90} dataKey="value">
                    {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                  </Pie>
                  <Tooltip /><Legend />
                </RePieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base flex items-center gap-2 text-dark-green"><Activity className="w-5 h-5 text-dark-green" /> خلاصه عملکرد</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-3"><span className="text-sm text-gray-500">کل دارایی‌ها</span><span className="text-lg font-bold text-dark-green">{stats.totalAssets}</span></div>
                <div className="flex justify-between items-center border-b pb-3"><span className="text-sm text-gray-500">تأیید شده</span><span className="text-lg font-bold text-emerald-600">{stats.verifiedAssets}</span></div>
                <div className="flex justify-between items-center border-b pb-3"><span className="text-sm text-gray-500">در انتظار</span><span className="text-lg font-bold text-amber-600">{stats.pendingAssets}</span></div>
                <div className="flex justify-between items-center border-b pb-3"><span className="text-sm text-gray-500">رد شده</span><span className="text-lg font-bold text-red-600">{stats.rejectedAssets}</span></div>
                <div className="flex justify-between items-center pt-2"><span className="text-sm text-gray-500">نرخ تأیید</span><span className="text-lg font-bold text-emerald-600">{stats.totalAssets > 0 ? Math.round((stats.verifiedAssets / stats.totalAssets) * 100) : 0}%</span></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2 text-dark-green"><Clock className="w-5 h-5 text-dark-green" /> آخرین دارایی‌ها</CardTitle>
            <Link href="/dashboard/intangible/assets"><Button variant="ghost" size="sm" className="text-dark-green">مشاهده همه</Button></Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentAssets.map((asset) => (
                <Link href={`/dashboard/intangible/assets/${asset.id}`} key={asset.id}>
                  <div className="p-4 border rounded-xl hover:shadow-md hover:border-dark-green transition-all cursor-pointer bg-white">
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
      </PageTransition>
    );
  }

  // ============================================================
  // 3. DASHBOARD ORG_USER
  // ============================================================
  return (
    <PageTransition className="p-6 space-y-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      <NotificationBar />

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-dark-green via-aqua-green to-medium-green p-8 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-golden-amber rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/20">
              <User className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-white/80">{getGreeting()}</p>
              <h1 className="text-2xl md:text-3xl font-bold">{getFullName()}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs backdrop-blur-sm border border-white/10 flex items-center gap-1">
                  <User className="w-3 h-3" /> {getRoleDisplay(role)}
                </span>
                <span className="bg-golden-amber/30 px-3 py-1 rounded-full text-xs flex items-center gap-1 border border-golden-amber/30">
                  <Building2 className="w-3 h-3" /> {user?.organization_name}
                </span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs flex items-center gap-1 border border-white/20">
                  <Building className="w-3 h-3" /> {user?.department_name}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/dashboard/intangible/screening/new">
              <Button className="bg-golden-amber hover:bg-golden-amber/90 text-white border-0">
                <Search className="w-4 h-4 ml-2" />
                غربالگری جدید
              </Button>
            </Link>
          </div>
        </div>

        <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { label: 'کل دارایی‌ها', value: stats.totalAssets, icon: Package },
            { label: 'تأیید شده', value: stats.verifiedAssets, icon: CheckCircle },
            { label: 'در انتظار', value: stats.pendingAssets, icon: Clock },
            { label: 'نرخ تأیید', value: stats.totalAssets > 0 ? `${Math.round((stats.verifiedAssets / stats.totalAssets) * 100)}%` : '۰%', icon: TrendingUp },
          ].map((stat, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <p className="text-xs text-white/70">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500 font-medium">کل دارایی‌ها</p><p className="text-3xl font-bold text-dark-green mt-1">{stats.totalAssets}</p></div>
              <div className="bg-dark-green/10 p-3 rounded-xl"><Package className="w-6 h-6 text-dark-green" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500 font-medium">تأیید شده</p><p className="text-3xl font-bold text-emerald-600 mt-1">{stats.verifiedAssets}</p></div>
              <div className="bg-emerald-50 p-3 rounded-xl"><CheckCircle className="w-6 h-6 text-emerald-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500 font-medium">در انتظار</p><p className="text-3xl font-bold text-amber-600 mt-1">{stats.pendingAssets}</p></div>
              <div className="bg-amber-50 p-3 rounded-xl"><Clock className="w-6 h-6 text-amber-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-500 font-medium">رد شده</p><p className="text-3xl font-bold text-red-600 mt-1">{stats.rejectedAssets}</p></div>
              <div className="bg-red-50 p-3 rounded-xl"><AlertCircle className="w-6 h-6 text-red-600" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-dark-green/10 p-3 rounded-xl"><Users className="w-6 h-6 text-dark-green" /></div>
            <div><p className="text-sm text-gray-500">همکاران</p><p className="text-2xl font-bold text-dark-green">{stats.totalUsers}</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-golden-amber/20 p-3 rounded-xl"><TrendingUp className="w-6 h-6 text-golden-amber" /></div>
            <div><p className="text-sm text-gray-500">نرخ تأیید</p><p className="text-2xl font-bold text-emerald-600">{stats.totalAssets > 0 ? Math.round((stats.verifiedAssets / stats.totalAssets) * 100) : 0}%</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base flex items-center gap-2 text-dark-green"><PieChart className="w-5 h-5 text-dark-green" /> توزیع دارایی‌ها</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <RePieChart>
                <Pie data={chartData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${formatPercent(percent)}`} outerRadius={90} dataKey="value">
                  {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                </Pie>
                <Tooltip /><Legend />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base flex items-center gap-2 text-dark-green"><Activity className="w-5 h-5 text-dark-green" /> خلاصه عملکرد</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-3"><span className="text-sm text-gray-500">کل دارایی‌ها</span><span className="text-lg font-bold text-dark-green">{stats.totalAssets}</span></div>
              <div className="flex justify-between items-center border-b pb-3"><span className="text-sm text-gray-500">تأیید شده</span><span className="text-lg font-bold text-emerald-600">{stats.verifiedAssets}</span></div>
              <div className="flex justify-between items-center border-b pb-3"><span className="text-sm text-gray-500">در انتظار</span><span className="text-lg font-bold text-amber-600">{stats.pendingAssets}</span></div>
              <div className="flex justify-between items-center border-b pb-3"><span className="text-sm text-gray-500">رد شده</span><span className="text-lg font-bold text-red-600">{stats.rejectedAssets}</span></div>
              <div className="flex justify-between items-center pt-2"><span className="text-sm text-gray-500">نرخ تأیید</span><span className="text-lg font-bold text-emerald-600">{stats.totalAssets > 0 ? Math.round((stats.verifiedAssets / stats.totalAssets) * 100) : 0}%</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2 text-dark-green"><Clock className="w-5 h-5 text-dark-green" /> آخرین دارایی‌ها</CardTitle>
          <Link href="/dashboard/intangible/assets"><Button variant="ghost" size="sm" className="text-dark-green">مشاهده همه</Button></Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentAssets.map((asset) => (
              <Link href={`/dashboard/intangible/assets/${asset.id}`} key={asset.id}>
                <div className="p-4 border rounded-xl hover:shadow-md hover:border-dark-green transition-all cursor-pointer bg-white">
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
    </PageTransition>
  );
}
