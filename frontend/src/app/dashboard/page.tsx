'use client';

import { useAuthStore } from '@/store/auth-store';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';
import { PageTransition } from '@/components/ui/page-transition';
import {
  Building2,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Building,
  TrendingUp,
  Search,
  Calendar,
  Users,
  Activity,
  Award,
  Crown,
  PieChart,
  Sparkles,
  Target,
  Rocket,
  Shield,
  Star,
  Briefcase,
  Globe,
  Compass,
  BarChart3,
  LineChart as LineChartIcon,
  Zap,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Layers,
  FileCheck,
  GitBranch,
  Workflow,
  Users2,
  ClipboardCheck,
  Gauge
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
  AreaChart,
  ComposedChart
} from 'recharts';

const COLORS = ['#015345', '#8ECFAF', '#D4A547', '#3B7A6E', '#F5A8A8', '#6B8E9C'];

const toPersianNumber = (num: number | string): string => {
  if (num === undefined || num === null) return '۰';
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  const str = String(num);
  return str.replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};

const toPersianNumberWithComma = (num: number): string => {
  if (!num && num !== 0) return '۰';
  const formatted = num.toLocaleString();
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return formatted.replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};

const toPersianPercent = (num: number): string => {
  if (!num && num !== 0) return '۰٪';
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  const str = Math.round(num).toString();
  const persianStr = str.replace(/\d/g, (d) => persianDigits[parseInt(d)]);
  return persianStr + '٪';
};

interface DashboardStats {
  totalAssets: number;
  verifiedAssets: number;
  pendingAssets: number;
  rejectedAssets: number;
  totalUsers: number;
  totalDepartments: number;
  totalValuations: number;
  completedValuations: number;
  inProgressValuations: number;
  totalScreeningTemplates: number;
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

interface TrendData {
  date: string;
  count: number;
  confirmed: number;
  pending: number;
  rejected: number;
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
    totalValuations: 0,
    completedValuations: 0,
    inProgressValuations: 0,
    totalScreeningTemplates: 0,
  });
  const [recentAssets, setRecentAssets] = useState<RecentAsset[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  const role = user?.role || 'org_user';
  const isSuperAdmin = role === 'super_admin';
  const isOrgAdmin = role === 'org_admin';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // ============================================
      // ۱. دریافت دارایی‌های غربالگری شده
      // ============================================
      const { data: assetsData } = await api.get('/intangible/screened-assets/');
      const assets = assetsData.results || assetsData || [];

      const verified = assets.filter((a: any) => a.result === 'confirmed').length;
      const pending = assets.filter((a: any) => a.result === 'conditional').length;
      const rejected = assets.filter((a: any) => a.result === 'rejected').length;

      // ============================================
      // ۲. دریافت کاربران
      // ============================================
      let totalUsers = 0;
      try {
        const { data: usersData } = await api.get('/auth/users/');
        totalUsers = (usersData.results || usersData || []).length;
      } catch (e) {}

      // ============================================
      // ۳. دریافت واحدها
      // ============================================
      let totalDepartments = 0;
      try {
        const { data: deptsData } = await api.get('/auth/departments/');
        totalDepartments = (deptsData.results || deptsData || []).length;
      } catch (e) {}

      // ============================================
      // ۴. دریافت ارزیابی‌ها
      // ============================================
      let totalValuations = 0, completedValuations = 0, inProgressValuations = 0;
      try {
        const { data: valData } = await api.get('/intangible/asset-valuations/');
        const vals = valData.results || valData || [];
        totalValuations = vals.length;
        completedValuations = vals.filter((v: any) => v.status === 'completed').length;
        inProgressValuations = vals.filter((v: any) => v.status === 'draft' || v.status === 'in_progress').length;
      } catch (e) {}

      // ============================================
      // ۵. دریافت قالب‌ها
      // ============================================
      let totalScreeningTemplates = 0;
      try {
        const { data: templatesData } = await api.get('/intangible/screening-templates/');
        totalScreeningTemplates = (templatesData.results || templatesData || []).length;
      } catch (e) {}

      setStats({
        totalAssets: assets.length,
        verifiedAssets: verified,
        pendingAssets: pending,
        rejectedAssets: rejected,
        totalUsers,
        totalDepartments,
        totalValuations,
        completedValuations,
        inProgressValuations,
        totalScreeningTemplates,
      });

      // ============================================
      // ۶. توزیع دسته‌بندی
      // ============================================
      const categoryMap: Record<string, string> = {
        'strategic_economic': 'استراتژیک',
        'strategic_knowledge': 'استراتژیک',
        'operational_economic': 'عملیاتی',
        'operational_knowledge': 'عملیاتی',
        'support_economic': 'پشتیبان',
        'support_knowledge': 'پشتیبان',
      };

      const chartDataMap: Record<string, number> = { 'استراتژیک': 0, 'عملیاتی': 0, 'پشتیبان': 0 };
      assets.forEach((a: any) => {
        const cat = categoryMap[a.category] || 'سایر';
        if (chartDataMap[cat] !== undefined) chartDataMap[cat]++;
      });
      setChartData(Object.keys(chartDataMap).map(key => ({ name: key, value: chartDataMap[key] })));

      // ============================================
      // ۷. روند ۳۰ روز اخیر (گزارش تعداد دارایی‌ها برحسب روز)
      // ============================================
      const now = new Date();
      const trend: Record<string, TrendData> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const persianDate = new Intl.DateTimeFormat('fa-IR', { month: 'short', day: 'numeric' }).format(d);
        trend[key] = { date: key, count: 0, confirmed: 0, pending: 0, rejected: 0 };
      }

      assets.forEach((a: any) => {
        const date = a.created_at?.split('T')[0];
        if (date && trend[date]) {
          trend[date].count++;
          if (a.result === 'confirmed') trend[date].confirmed++;
          else if (a.result === 'conditional') trend[date].pending++;
          else if (a.result === 'rejected') trend[date].rejected++;
        }
      });

      const trendArray = Object.values(trend).map((item, index) => {
        const d = new Date(item.date);
        return {
          ...item,
          day: index + 1,
          label: new Intl.DateTimeFormat('fa-IR', { month: 'short', day: 'numeric' }).format(d)
        };
      });
      setTrendData(trendArray);

      // ============================================
      // ۸. آخرین دارایی‌ها (۵ مورد اخیر)
      // ============================================
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
    const colors = { confirmed: 'bg-emerald-100 text-emerald-800', conditional: 'bg-amber-100 text-amber-800', rejected: 'bg-red-100 text-red-800' };
    const labels = { confirmed: 'تأیید شده', conditional: 'مشروط', rejected: 'رد شده' };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[result as keyof typeof colors] || 'bg-gray-100'}`}>
        {labels[result as keyof typeof labels] || result}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return dateString; }
  };

  const getFullName = () => {
    if (user?.first_name && user?.last_name) return `${user.first_name} ${user.last_name}`;
    return user?.email?.split('@')[0] || 'کاربر';
  };

  const getRoleDisplay = (role: string) => {
    const roles: Record<string, string> = { super_admin: 'ادمین کل سیستم', org_admin: 'مدیر مجموعه', org_user: 'مدیر واحد' };
    return roles[role] || role;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'صبح بخیر ☀️';
    if (hour < 17) return 'ظهر بخیر 🌤️';
    if (hour < 21) return 'عصر بخیر 🌅';
    return 'شب بخیر 🌙';
  };

  const renderStatCard = (stat: { label: string; value: number; icon: any; color: string }) => {
    const Icon = stat.icon;
    return (
      <Card className="border-0 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] duration-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.color} mt-1`}>
                {toPersianNumberWithComma(stat.value)}
              </p>
            </div>
            <div className={`${stat.color.replace('text', 'bg')}/10 p-3 rounded-xl`}>
              <Icon className={`w-6 h-6 ${stat.color}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <SkeletonLoader variant="dashboard" />
      </div>
    );
  }

  // ============================================================
  // DASHBOARD SUPER_ADMIN / ORG_ADMIN
  // ============================================================
  const showAdminDashboard = isSuperAdmin || isOrgAdmin;

  if (showAdminDashboard) {
    return (
      <PageTransition className="p-6 space-y-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">

        {/* ============================================
            هدر خوش‌آمدگویی
        ============================================ */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-dark-green via-medium-green to-aqua-green p-8 text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-golden-amber rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          </div>
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/20">
                {isSuperAdmin ? <Crown className="w-8 h-8" /> : <Building2 className="w-8 h-8" />}
              </div>
              <div>
                <p className="text-sm text-white/80">{getGreeting()}</p>
                <h1 className="text-2xl md:text-3xl font-bold">{getFullName()}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-xs backdrop-blur-sm border border-white/10 flex items-center gap-1">
                    {isSuperAdmin ? <Crown className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    {getRoleDisplay(role)}
                  </span>
                  {user?.organization_name && (
                    <span className="bg-golden-amber/30 px-3 py-1 rounded-full text-xs flex items-center gap-1 border border-golden-amber/30">
                      <Building2 className="w-3 h-3" /> {user.organization_name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/dashboard/intangible/screening/new">
                <Button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20 text-white">
                  <Search className="w-4 h-4 ml-2" />
                  غربالگری جدید
                </Button>
              </Link>
              <Link href="/dashboard/intangible/discovery-wizard">
                <Button className="bg-golden-amber hover:bg-golden-amber/90 text-white border-0">
                  <Sparkles className="w-4 h-4 ml-2" />
                  موتور شناسایی
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { label: 'کل دارایی‌ها', value: stats.totalAssets },
              { label: 'تأیید شده', value: stats.verifiedAssets },
              { label: 'در انتظار', value: stats.pendingAssets },
              { label: 'نرخ تأیید', value: stats.totalAssets > 0 ? Math.round((stats.verifiedAssets / stats.totalAssets) * 100) : 0, isPercent: true },
            ].map((stat, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <p className="text-xs text-white/70">{stat.label}</p>
                <p className="text-2xl font-bold text-white">
                  {stat.isPercent ? toPersianPercent(stat.value) : toPersianNumberWithComma(stat.value as number)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ============================================
            کارت‌های KPI (با داده‌های واقعی از دیتابیس)
        ============================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {renderStatCard({ label: 'کل دارایی‌ها', value: stats.totalAssets, icon: Package, color: 'text-dark-green' })}
          {renderStatCard({ label: 'تأیید شده', value: stats.verifiedAssets, icon: CheckCircle, color: 'text-emerald-600' })}
          {renderStatCard({ label: 'در انتظار', value: stats.pendingAssets, icon: Clock, color: 'text-amber-600' })}
          {renderStatCard({ label: 'رد شده', value: stats.rejectedAssets, icon: AlertCircle, color: 'text-red-600' })}
        </div>

        {/* ============================================
            ردیف دوم کارت‌ها
        ============================================ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-dark-green/10 p-3 rounded-xl"><Users className="w-6 h-6 text-dark-green" /></div>
              <div>
                <p className="text-sm text-gray-500">کاربران</p>
                <p className="text-2xl font-bold text-dark-green">{toPersianNumberWithComma(stats.totalUsers)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-aqua-green/20 p-3 rounded-xl"><Building className="w-6 h-6 text-medium-green" /></div>
              <div>
                <p className="text-sm text-gray-500">واحدها</p>
                <p className="text-2xl font-bold text-dark-green">{toPersianNumberWithComma(stats.totalDepartments)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="bg-golden-amber/20 p-3 rounded-xl"><FileCheck className="w-6 h-6 text-golden-amber" /></div>
              <div>
                <p className="text-sm text-gray-500">قالب‌های غربالگری</p>
                <p className="text-2xl font-bold text-dark-green">{toPersianNumberWithComma(stats.totalScreeningTemplates)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ============================================
            نمودارها
        ============================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* نمودار توزیع */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-dark-green">
                <PieChart className="w-5 h-5 text-dark-green" />
                توزیع دارایی‌ها بر اساس دسته‌بندی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <RePieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name} ${toPersianPercent((percent || 0) * 100)}`}
                    outerRadius={90}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontFamily: 'var(--font-vazir)' }} />
                  <Legend wrapperStyle={{ fontFamily: 'var(--font-vazir)' }} />
                </RePieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* نمودار گزارش تعداد دارایی‌ها برحسب روز */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-dark-green">
                <LineChartIcon className="w-5 h-5 text-dark-green" />
                تعداد دارایی‌ها برحسب روز (۳۰ روز اخیر)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip contentStyle={{ fontFamily: 'var(--font-vazir)' }} />
                  <Legend wrapperStyle={{ fontFamily: 'var(--font-vazir)' }} />
                  <Bar dataKey="count" fill="#015345" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="count" stroke="#D4A547" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* ============================================
            آخرین دارایی‌ها (از دیتابیس)
        ============================================ */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2 text-dark-green">
              <Clock className="w-5 h-5 text-dark-green" />
              آخرین دارایی‌های ثبت شده
            </CardTitle>
            <Link href="/dashboard/intangible/screening/list">
              <Button variant="ghost" size="sm" className="text-dark-green">مشاهده همه</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentAssets.length > 0 ? (
                recentAssets.map((asset) => (
                  <Link href={`/dashboard/intangible/screening/${asset.id}`} key={asset.id}>
                    <div className="p-4 border rounded-xl hover:shadow-md hover:border-dark-green transition-all cursor-pointer bg-white">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{asset.asset_name}</span>
                        {getResultBadge(asset.result)}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{asset.asset_uid}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        <User className="w-3 h-3" />
                        {asset.created_by_name || 'نامشخص'}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {formatDate(asset.created_at)}
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-3 text-center text-gray-400 py-8">
                  هیچ دارایی ثبت نشده است
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ============================================
            Quick Actions
        ============================================ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/dashboard/intangible/screening/new">
            <Card className="border-0 shadow-sm hover:shadow-md hover:border-dark-green transition-all cursor-pointer">
              <CardContent className="p-4 text-center">
                <Search className="w-8 h-8 mx-auto text-dark-green" />
                <p className="text-sm font-medium mt-2">غربالگری جدید</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/intangible/discovery-wizard">
            <Card className="border-0 shadow-sm hover:shadow-md hover:border-dark-green transition-all cursor-pointer">
              <CardContent className="p-4 text-center">
                <Sparkles className="w-8 h-8 mx-auto text-golden-amber" />
                <p className="text-sm font-medium mt-2">موتور شناسایی</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/intangible/evaluation/list">
            <Card className="border-0 shadow-sm hover:shadow-md hover:border-dark-green transition-all cursor-pointer">
              <CardContent className="p-4 text-center">
                <ClipboardCheck className="w-8 h-8 mx-auto text-medium-green" />
                <p className="text-sm font-medium mt-2">ارزیابی‌ها</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/intangible/valuation/valuation">
            <Card className="border-0 shadow-sm hover:shadow-md hover:border-dark-green transition-all cursor-pointer">
              <CardContent className="p-4 text-center">
                <Gauge className="w-8 h-8 mx-auto text-dark-green" />
                <p className="text-sm font-medium mt-2">ارزش‌گذاری</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </PageTransition>
    );
  }

  // ============================================================
  // DASHBOARD ORG_USER
  // ============================================================
  return (
    <PageTransition className="p-6 space-y-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-dark-green via-medium-green to-aqua-green p-8 text-white">
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
                {user?.organization_name && (
                  <span className="bg-golden-amber/30 px-3 py-1 rounded-full text-xs flex items-center gap-1 border border-golden-amber/30">
                    <Building2 className="w-3 h-3" /> {user.organization_name}
                  </span>
                )}
                {user?.department_name && (
                  <span className="bg-white/20 px-3 py-1 rounded-full text-xs flex items-center gap-1 border border-white/20">
                    <Building className="w-3 h-3" /> {user.department_name}
                  </span>
                )}
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
      </div>

      {/* کارت‌های KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderStatCard({ label: 'کل دارایی‌ها', value: stats.totalAssets, icon: Package, color: 'text-dark-green' })}
        {renderStatCard({ label: 'تأیید شده', value: stats.verifiedAssets, icon: CheckCircle, color: 'text-emerald-600' })}
        {renderStatCard({ label: 'در انتظار', value: stats.pendingAssets, icon: Clock, color: 'text-amber-600' })}
        {renderStatCard({ label: 'رد شده', value: stats.rejectedAssets, icon: AlertCircle, color: 'text-red-600' })}
      </div>

      {/* کارت‌های جزئی */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-dark-green/10 p-3 rounded-xl"><Users className="w-6 h-6 text-dark-green" /></div>
            <div>
              <p className="text-sm text-gray-500">همکاران</p>
              <p className="text-2xl font-bold text-dark-green">{toPersianNumberWithComma(stats.totalUsers)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="bg-golden-amber/20 p-3 rounded-xl"><TrendingUp className="w-6 h-6 text-golden-amber" /></div>
            <div>
              <p className="text-sm text-gray-500">نرخ تأیید</p>
              <p className="text-2xl font-bold text-emerald-600">
                {stats.totalAssets > 0 ? toPersianPercent(Math.round((stats.verifiedAssets / stats.totalAssets) * 100)) : '۰٪'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* نمودارها */}
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
                <Pie data={chartData} cx="50%" cy="50%" labelLine={true} label={({ name, percent }) => `${name} ${toPersianPercent((percent || 0) * 100)}`} outerRadius={90} dataKey="value">
                  {chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                </Pie>
                <Tooltip contentStyle={{ fontFamily: 'var(--font-vazir)' }} />
                <Legend wrapperStyle={{ fontFamily: 'var(--font-vazir)' }} />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-dark-green">
              <LineChartIcon className="w-5 h-5 text-dark-green" />
              تعداد دارایی‌ها برحسب روز
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip contentStyle={{ fontFamily: 'var(--font-vazir)' }} />
                <Legend wrapperStyle={{ fontFamily: 'var(--font-vazir)' }} />
                <Bar dataKey="count" fill="#015345" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="count" stroke="#D4A547" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* آخرین دارایی‌ها */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2 text-dark-green">
            <Clock className="w-5 h-5 text-dark-green" />
            آخرین دارایی‌ها
          </CardTitle>
          <Link href="/dashboard/intangible/screening/list">
            <Button variant="ghost" size="sm" className="text-dark-green">مشاهده همه</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentAssets.length > 0 ? (
              recentAssets.map((asset) => (
                <Link href={`/dashboard/intangible/screening/${asset.id}`} key={asset.id}>
                  <div className="p-4 border rounded-xl hover:shadow-md hover:border-dark-green transition-all cursor-pointer bg-white">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{asset.asset_name}</span>
                      {getResultBadge(asset.result)}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{asset.asset_uid}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <User className="w-3 h-3" />
                      {asset.created_by_name || 'نامشخص'}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />
                      {formatDate(asset.created_at)}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-3 text-center text-gray-400 py-8">
                هیچ دارایی ثبت نشده است
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Link href="/dashboard/intangible/screening/new">
          <Card className="border-0 shadow-sm hover:shadow-md cursor-pointer">
            <CardContent className="p-4 text-center">
              <Search className="w-8 h-8 mx-auto text-dark-green" />
              <p className="text-sm font-medium mt-2">غربالگری جدید</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/intangible/discovery-wizard">
          <Card className="border-0 shadow-sm hover:shadow-md cursor-pointer">
            <CardContent className="p-4 text-center">
              <Sparkles className="w-8 h-8 mx-auto text-golden-amber" />
              <p className="text-sm font-medium mt-2">موتور شناسایی</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/intangible/evaluation/list">
          <Card className="border-0 shadow-sm hover:shadow-md cursor-pointer">
            <CardContent className="p-4 text-center">
              <ClipboardCheck className="w-8 h-8 mx-auto text-medium-green" />
              <p className="text-sm font-medium mt-2">ارزیابی‌ها</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </PageTransition>
  );
}


