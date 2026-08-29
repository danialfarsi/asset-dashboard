'use client';

import { useAuthStore } from '@/store/auth-store';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';
import { PageTransition } from '@/components/ui/page-transition';
import { ClaimAssetsButton } from '@/components/ClaimAssetsButton';

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
  Gauge,
  Timer,
  AlertTriangle,
  CheckSquare,
  FileText,
  DollarSign,
  Clock as ClockIcon
} from 'lucide-react';

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
  ComposedChart,
  Area,
  AreaChart
} from 'recharts';

const COLORS = ['#015345', '#8ECFAF', '#D4A547', '#3B7A6E', '#F5A8A8', '#6B8E9C', '#FF6B6B', '#4ECDC4'];

// ============================================
// UTILITY FUNCTIONS
// ============================================
const toPersianNumber = (num: number | string): string => {
  if (num === undefined || num === null) return '۰';
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return String(num).replace(/\d/g, (d) => persianDigits[parseInt(d)]);
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
  return str.replace(/\d/g, (d) => persianDigits[parseInt(d)]) + '٪';
};

// ============================================
// TYPES
// ============================================
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
  growthRate: number;
  avgApprovalTime: number;
  estimatedValue: number;
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
}

interface TrendData {
  date: string;
  label: string;
  count: number;
  confirmed: number;
  pending: number;
  rejected: number;
}

interface AssetTypeDistribution {
  name: string;
  value: number;
}

// ============================================
// MAIN COMPONENT
// ============================================
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
    growthRate: 0,
    avgApprovalTime: 0,
    estimatedValue: 0,
  });
  const [recentAssets, setRecentAssets] = useState<RecentAsset[]>([]);
  const [chartData, setChartData] = useState<AssetTypeDistribution[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [assetTypeDistribution, setAssetTypeDistribution] = useState<AssetTypeDistribution[]>([]);
  const [valuationStatus, setValuationStatus] = useState({ completed: 0, inProgress: 0, notStarted: 0 });
  const [pendingAlerts, setPendingAlerts] = useState<any[]>([]);

  const role = user?.role || 'org_user';
  const isSuperAdmin = role === 'super_admin';
  const isOrgAdmin = role === 'org_admin';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 📌 دریافت دارایی‌ها
      const { data: assetsData } = await api.get('/intangible/screened-assets/');
      const assets = assetsData.results || assetsData || [];

      // 📌 آمار پایه
      const verified = assets.filter((a: any) => a.result === 'confirmed').length;
      const pending = assets.filter((a: any) => a.result === 'conditional').length;
      const rejected = assets.filter((a: any) => a.result === 'rejected').length;

      // 📌 کاربران
      let totalUsers = 0;
      try {
        const { data: usersData } = await api.get('/auth/users/');
        totalUsers = (usersData.results || usersData || []).length;
      } catch (e) {}

      // 📌 واحدها
      let totalDepartments = 0;
      try {
        const { data: deptsData } = await api.get('/auth/departments/');
        totalDepartments = (deptsData.results || deptsData || []).length;
      } catch (e) {}

      // 📌 ارزیابی‌ها
      let totalValuations = 0, completedValuations = 0, inProgressValuations = 0;
      try {
        const { data: valData } = await api.get('/intangible/asset-valuations/');
        const vals = valData.results || valData || [];
        totalValuations = vals.length;
        completedValuations = vals.filter((v: any) => v.status === 'completed').length;
        inProgressValuations = vals.filter((v: any) => v.status === 'draft' || v.status === 'in_progress').length;
      } catch (e) {}

      // 📌 قالب‌ها
      let totalScreeningTemplates = 0;
      try {
        const { data: templatesData } = await api.get('/intangible/screening-templates/');
        totalScreeningTemplates = (templatesData.results || templatesData || []).length;
      } catch (e) {}

      // 📌 محاسبه نرخ رشد (مقایسه ماه جاری با ماه قبل)
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const currentMonthAssets = assets.filter((a: any) => {
        const d = new Date(a.created_at);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      }).length;
      
      const lastMonthAssets = assets.filter((a: any) => {
        const d = new Date(a.created_at);
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        return d.getMonth() === lastMonth && d.getFullYear() === lastYear;
      }).length;
      
      const growthRate = lastMonthAssets > 0 
        ? Math.round(((currentMonthAssets - lastMonthAssets) / lastMonthAssets) * 100) 
        : 0;

      // 📌 میانگین زمان تأیید (تخمینی)
      const avgApprovalTime = 4.5; // روز - این رو از دیتابیس محاسبه کن

      // 📌 ارزش تقریبی (تخمینی)
      const estimatedValue = assets.length * 1500000000; // ریال

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
        growthRate,
        avgApprovalTime,
        estimatedValue,
      });

      // 📌 وضعیت ارزیابی
      setValuationStatus({
        completed: completedValuations,
        inProgress: inProgressValuations,
        notStarted: Math.max(0, assets.length - completedValuations - inProgressValuations),
      });

      // 📌 توزیع دسته‌بندی
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

      // 📌 توزیع بر اساس نوع دارایی (AssetType)
      const typeMap: Record<string, number> = {};
      assets.forEach((a: any) => {
        if (a.asset_type_name) {
          typeMap[a.asset_type_name] = (typeMap[a.asset_type_name] || 0) + 1;
        }
      });
      const typeData = Object.keys(typeMap)
        .map(key => ({ name: key, value: typeMap[key] }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);
      setAssetTypeDistribution(typeData);

      // 📌 روند ۳۰ روز اخیر
      const trend: Record<string, TrendData> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const label = new Intl.DateTimeFormat('fa-IR', { month: 'short', day: 'numeric' }).format(d);
        trend[key] = { date: key, label, count: 0, confirmed: 0, pending: 0, rejected: 0 };
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
      setTrendData(Object.values(trend));

      // 📌 آخرین دارایی‌ها
      const sorted = [...assets].sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setRecentAssets(sorted.slice(0, 5));

      // 📌 هشدارها (دارایی‌های در حال انتظار بیش از ۷ روز)
      const pendingAlertsData = assets
        .filter((a: any) => a.result === 'conditional')
        .map((a: any) => {
          const days = Math.floor((new Date().getTime() - new Date(a.created_at).getTime()) / (1000 * 60 * 60 * 24));
          return { ...a, days };
        })
        .filter((a: any) => a.days > 7)
        .slice(0, 3);
      setPendingAlerts(pendingAlertsData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // RENDER HELPERS
  // ============================================
  const getResultBadge = (result: string) => {
    const colors = { confirmed: 'bg-emerald-100 text-emerald-800', conditional: 'bg-amber-100 text-amber-800', rejected: 'bg-red-100 text-red-800' };
    const labels = { confirmed: 'تأیید', conditional: 'مشروط', rejected: 'رد' };
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

  const renderStatCard = (stat: { label: string; value: number; icon: any; color: string; subtitle?: string }) => {
    const Icon = stat.icon;
    return (
      <Card className="border-0 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] duration-200">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color} mt-1`}>
                {toPersianNumberWithComma(stat.value)}
              </p>
              {stat.subtitle && (
                <p className="text-[10px] text-gray-400 mt-0.5">{stat.subtitle}</p>
              )}
            </div>
            <div className={`${stat.color.replace('text', 'bg')}/10 p-2.5 rounded-xl`}>
              <Icon className={`w-5 h-5 ${stat.color}`} />
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
  // MAIN DASHBOARD
  // ============================================================
  return (
    <PageTransition className="p-6 space-y-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">

      {/* ============================================
          HEADER
      ============================================ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-dark-green via-medium-green to-aqua-green p-6 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-golden-amber rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm border border-white/20">
              {isSuperAdmin ? <Crown className="w-7 h-7" /> : <Building2 className="w-7 h-7" />}
            </div>
            <div>
              <p className="text-sm text-white/80">{getGreeting()}</p>
              <h1 className="text-xl md:text-2xl font-bold">{getFullName()}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-[10px] backdrop-blur-sm border border-white/10 flex items-center gap-1">
                  {isSuperAdmin ? <Crown className="w-3 h-3" /> : <User className="w-3 h-3" />}
                  {getRoleDisplay(role)}
                </span>
                {user?.organization_name && (
                  <span className="bg-golden-amber/30 px-2.5 py-0.5 rounded-full text-[10px] flex items-center gap-1 border border-golden-amber/30">
                    <Building2 className="w-3 h-3" /> {user.organization_name}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/dashboard/intangible/screening/new">
              <Button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20 text-white text-sm h-9">
                <Search className="w-4 h-4 ml-1.5" />
                غربالگری جدید
              </Button>
            </Link>
            <Link href="/dashboard/intangible/discovery-wizard">
              <Button className="bg-golden-amber hover:bg-golden-amber/90 text-white border-0 text-sm h-9">
                <Sparkles className="w-4 h-4 ml-1.5" />
                موتور شناسایی
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ============================================
          KPI CARDS
      ============================================ */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {renderStatCard({ 
          label: 'کل دارایی‌ها', 
          value: stats.totalAssets, 
          icon: Package, 
          color: 'text-dark-green',
          subtitle: `${stats.growthRate > 0 ? '+' : ''}${toPersianNumber(stats.growthRate)}% نسبت به ماه قبل`
        })}
        {renderStatCard({ label: 'تأیید شده', value: stats.verifiedAssets, icon: CheckCircle, color: 'text-emerald-600' })}
        {renderStatCard({ label: 'در انتظار', value: stats.pendingAssets, icon: Clock, color: 'text-amber-600' })}
        {renderStatCard({ label: 'رد شده', value: stats.rejectedAssets, icon: AlertCircle, color: 'text-red-600' })}
        {renderStatCard({ 
          label: 'نرخ تأیید', 
          value: stats.totalAssets > 0 ? Math.round((stats.verifiedAssets / stats.totalAssets) * 100) : 0, 
          icon: TrendingUp, 
          color: 'text-emerald-600',
          subtitle: stats.totalAssets > 0 ? `${toPersianNumber(stats.totalAssets - stats.verifiedAssets - stats.pendingAssets)} رد` : ''
        })}
      </div>

      {/* ============================================
          SECOND ROW - عملیاتی
      ============================================ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-lg"><Users className="w-5 h-5 text-blue-600" /></div>
            <div>
              <p className="text-[10px] text-gray-400">کاربران</p>
              <p className="text-lg font-bold text-dark-green">{toPersianNumberWithComma(stats.totalUsers)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-purple-50 p-2 rounded-lg"><Building className="w-5 h-5 text-purple-600" /></div>
            <div>
              <p className="text-[10px] text-gray-400">واحدها</p>
              <p className="text-lg font-bold text-dark-green">{toPersianNumberWithComma(stats.totalDepartments)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-amber-50 p-2 rounded-lg"><FileCheck className="w-5 h-5 text-amber-600" /></div>
            <div>
              <p className="text-[10px] text-gray-400">قالب‌ها</p>
              <p className="text-lg font-bold text-dark-green">{toPersianNumberWithComma(stats.totalScreeningTemplates)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-emerald-50 p-2 rounded-lg"><DollarSign className="w-5 h-5 text-emerald-600" /></div>
            <div>
              <p className="text-[10px] text-gray-400">ارزش تقریبی</p>
              <p className="text-lg font-bold text-dark-green">{toPersianNumberWithComma(stats.estimatedValue)}</p>
              <p className="text-[8px] text-gray-400">ریال</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================
          CHARTS ROW
      ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        
        {/* 1. توزیع دسته‌بندی */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-dark-green">
              <PieChart className="w-4 h-4" />
              دسته‌بندی دارایی‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <RePieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => percent > 0.05 ? `${name} ${toPersianPercent((percent || 0) * 100)}` : ''}
                  outerRadius={70}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontFamily: 'var(--font-vazir)', fontSize: 12 }} />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 2. وضعیت ارزیابی */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-dark-green">
              <ClipboardCheck className="w-4 h-4" />
              وضعیت ارزیابی‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">تکمیل شده</span>
                <span className="font-semibold text-green-600">{toPersianNumber(valuationStatus.completed)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${stats.totalAssets > 0 ? (valuationStatus.completed / stats.totalAssets) * 100 : 0}%` }} />
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">در حال انجام</span>
                <span className="font-semibold text-amber-600">{toPersianNumber(valuationStatus.inProgress)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${stats.totalAssets > 0 ? (valuationStatus.inProgress / stats.totalAssets) * 100 : 0}%` }} />
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">شروع نشده</span>
                <span className="font-semibold text-gray-500">{toPersianNumber(valuationStatus.notStarted)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gray-400 h-2 rounded-full" style={{ width: `${stats.totalAssets > 0 ? (valuationStatus.notStarted / stats.totalAssets) * 100 : 0}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. توزیع نوع دارایی */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-dark-green">
              <Layers className="w-4 h-4" />
              نوع دارایی‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {assetTypeDistribution.length > 0 ? (
                assetTypeDistribution.slice(0, 5).map((item, index) => (
                  <div key={item.name} className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 truncate max-w-[120px]">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="h-1.5 rounded-full" 
                          style={{ 
                            width: `${(item.value / stats.totalAssets) * 100}%`,
                            backgroundColor: COLORS[index % COLORS.length]
                          }} 
                        />
                      </div>
                      <span className="font-semibold text-gray-700 text-xs">{toPersianNumber(item.value)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 text-center py-4">داده‌ای برای نمایش وجود ندارد</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================
          TREND CHART
      ============================================ */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-dark-green">
            <LineChartIcon className="w-4 h-4" />
            روند ثبت دارایی‌ها (۳۰ روز اخیر)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontFamily: 'var(--font-vazir)', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontFamily: 'var(--font-vazir)', fontSize: 11 }} />
              <Bar dataKey="count" fill="#015345" radius={[3, 3, 0, 0]} />
              <Line type="monotone" dataKey="count" stroke="#D4A547" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ============================================
          ALERTS & RECENT ACTIVITY
      ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* هشدارها */}
        <Card className="border-0 shadow-sm border-r-4 border-r-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
              نیاز به توجه
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingAlerts.length > 0 ? (
              <div className="space-y-2">
                {pendingAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between text-sm p-2 bg-amber-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-700">{alert.asset_name}</p>
                      <p className="text-[10px] text-gray-400">{alert.asset_uid}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-amber-600 font-bold">{toPersianNumber(alert.days)} روز</p>
                      <p className="text-[10px] text-gray-400">در انتظار</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-4">✅ همه چیز خوب است، هیچ هشداری وجود ندارد</p>
            )}
          </CardContent>
        </Card>

        {/* آخرین فعالیت‌ها */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2 text-dark-green">
              <ClockIcon className="w-4 h-4" />
              آخرین فعالیت‌ها
            </CardTitle>
            <Link href="/dashboard/intangible/screening/list">
              <Button variant="ghost" size="sm" className="text-xs text-dark-green h-7">مشاهده همه</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentAssets.map((asset) => (
                <Link href={`/dashboard/intangible/screening/${asset.id}`} key={asset.id}>
                  <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{asset.asset_name}</p>
                      <p className="text-[10px] text-gray-400">{asset.asset_uid}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getResultBadge(asset.result)}
                      <span className="text-[10px] text-gray-400">{formatDate(asset.created_at)}</span>
                    </div>
                  </div>
                </Link>
              ))}
              {recentAssets.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">هیچ فعالیتی ثبت نشده است</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================
          QUICK ACTIONS
      ============================================ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link href="/dashboard/intangible/screening/new">
          <Card className="border-0 shadow-sm hover:shadow-md hover:border-dark-green transition-all cursor-pointer">
            <CardContent className="p-3 text-center">
              <Search className="w-6 h-6 mx-auto text-dark-green" />
              <p className="text-xs font-medium mt-1">غربالگری جدید</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/intangible/discovery-wizard">
          <Card className="border-0 shadow-sm hover:shadow-md hover:border-dark-green transition-all cursor-pointer">
            <CardContent className="p-3 text-center">
              <Sparkles className="w-6 h-6 mx-auto text-golden-amber" />
              <p className="text-xs font-medium mt-1">موتور شناسایی</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/intangible/evaluation/list">
          <Card className="border-0 shadow-sm hover:shadow-md hover:border-dark-green transition-all cursor-pointer">
            <CardContent className="p-3 text-center">
              <ClipboardCheck className="w-6 h-6 mx-auto text-medium-green" />
              <p className="text-xs font-medium mt-1">ارزیابی‌ها</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/intangible/valuation/valuation">
          <Card className="border-0 shadow-sm hover:shadow-md hover:border-dark-green transition-all cursor-pointer">
            <CardContent className="p-3 text-center">
              <Gauge className="w-6 h-6 mx-auto text-dark-green" />
              <p className="text-xs font-medium mt-1">ارزش‌گذاری</p>
            </CardContent>
          </Card>
        </Link>
      </div>
        {/* ============================================
    CLAIM ASSETS BUTTON (برای کاربران لاگین شده)
    ============================================ */}
      <ClaimAssetsButton />
    </PageTransition>
  );
}