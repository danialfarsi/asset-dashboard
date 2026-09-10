
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
  Users,
  Crown,
  PieChart,
  Sparkles,
  BarChart3,
  LineChart as LineChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Layers,
  FileCheck,
  ClipboardCheck,
  Gauge,
  AlertTriangle,
  DollarSign,
  Clock as ClockIcon,
  ChevronLeft,
} from 'lucide-react';

import {
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Line,
  ComposedChart,
  Bar,
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
  dcfValue: number;
  navValue: number;
  portfolioValue: number;
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
    dcfValue: 0,
    navValue: 0,
    portfolioValue: 0,
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
      const avgApprovalTime = 4.5; // روز

      // ====================================================
      // 📌 محاسبه ارزش دارایی‌های DCF / NAV / مجموع پرتفوی
      // از endpoint اختصاصی بک‌اند (بهینه - یک درخواست واحد)
      // ====================================================
      let dcfValue = 0;
      let navValue = 0;
      let estimatedValue = 0;
      let portfolioValue = 0;

      try {
        const { data: portfolioData } = await api.get('/intangible/dashboard/portfolio/');
        dcfValue = Number(portfolioData.dcf_value) || 0;
        navValue = Number(portfolioData.nav_value) || 0;
        estimatedValue = Number(portfolioData.total_value) || 0;
        portfolioValue = Number(portfolioData.portfolio_value) || 0;

        console.log('💰 Portfolio Data:', {
          dcf: dcfValue,
          nav: navValue,
          total: estimatedValue,
          portfolio: portfolioValue,
          records: portfolioData.records_count,
        });
      } catch (e) {
        console.error('Error fetching portfolio values:', e);
        dcfValue = 0;
        navValue = 0;
        estimatedValue = 0;
        portfolioValue = 0;
      }

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
        dcfValue,
        navValue,
        portfolioValue,
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
    const styles: Record<string, string> = {
      confirmed: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
      conditional: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
      rejected: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
    };
    const labels: Record<string, string> = { confirmed: 'تأیید', conditional: 'مشروط', rejected: 'رد' };
    return (
      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${styles[result] || 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-200'}`}>
        {labels[result] || result}
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
    if (hour < 12) return 'صبح بخیر';
    if (hour < 17) return 'ظهر بخیر';
    if (hour < 21) return 'عصر بخیر';
    return 'شب بخیر';
  };

  const approvalRate = stats.totalAssets > 0 ? Math.round((stats.verifiedAssets / stats.totalAssets) * 100) : 0;

  const renderStatCard = (stat: { label: string; value: number; icon: any; color: string; subtitle?: string; trend?: 'up' | 'down' | 'flat' }) => {
    const Icon = stat.icon;
    const TrendIcon = stat.trend === 'up' ? ArrowUpRight : stat.trend === 'down' ? ArrowDownRight : Minus;
    return (
      <Card className="group relative overflow-hidden border border-gray-100 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_24px_rgba(1,83,69,0.08)] hover:-translate-y-0.5 transition-all duration-300">
        <div className={`absolute inset-x-0 top-0 h-0.5 ${stat.color.replace('text', 'bg')} opacity-70`} />
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className={`${stat.color.replace('text', 'bg')}/10 p-2.5 rounded-xl`}>
              <Icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            {stat.trend && (
              <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${stat.trend === 'up' ? 'text-emerald-600' : stat.trend === 'down' ? 'text-red-500' : 'text-gray-400'}`}>
                <TrendIcon className="w-3 h-3" />
              </span>
            )}
          </div>
          <p className={`text-[26px] leading-none font-bold ${stat.color} mt-4 tabular-nums`}>
            {toPersianNumberWithComma(stat.value)}
          </p>
          <p className="text-xs text-gray-500 font-medium mt-2">{stat.label}</p>
          {stat.subtitle && (
            <p className="text-[10px] text-gray-400 mt-1">{stat.subtitle}</p>
          )}
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
    <PageTransition className="p-6 space-y-6 bg-[#F7F8F7] min-h-screen">

      {/* ============================================
          HEADER
      ============================================ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-dark-green via-medium-green to-aqua-green p-7 md:p-8 text-white shadow-[0_20px_50px_rgba(1,83,69,0.25)]">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '22px 22px',
          }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-golden-amber/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/15 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">
              {isSuperAdmin ? <Crown className="w-7 h-7" /> : <Building2 className="w-7 h-7" />}
            </div>
            <div>
              <p className="text-sm text-white/70 font-medium">{getGreeting()}،</p>
              <h1 className="text-2xl md:text-[28px] font-bold tracking-tight mt-0.5">{getFullName()}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="bg-white/15 px-3 py-1 rounded-full text-[11px] font-medium backdrop-blur-sm border border-white/10 flex items-center gap-1.5">
                  {isSuperAdmin ? <Crown className="w-3 h-3" /> : <User className="w-3 h-3" />}
                  {getRoleDisplay(role)}
                </span>
                {user?.organization_name && (
                  <span className="bg-golden-amber/25 px-3 py-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 border border-golden-amber/30">
                    <Building2 className="w-3 h-3" /> {user.organization_name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-5 py-4">
            <div className="relative w-16 h-16 shrink-0">
              <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
                <circle cx="32" cy="32" r="27" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="6" />
                <circle
                  cx="32" cy="32" r="27" fill="none" stroke="#D4A547" strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={`${(approvalRate / 100) * 169.6} 169.6`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                {toPersianPercent(approvalRate)}
              </div>
            </div>
            <div>
              <p className="text-[11px] text-white/70">نرخ تأیید کلی</p>
              <p className="text-sm font-semibold">{toPersianNumberWithComma(stats.verifiedAssets)} از {toPersianNumberWithComma(stats.totalAssets)} دارایی</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/dashboard/intangible/screening/new">
              <Button className="bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white text-sm h-10 px-4 rounded-xl">
                <Search className="w-4 h-4 ml-2" />
                غربالگری جدید
              </Button>
            </Link>
            <Link href="/dashboard/intangible/discovery-wizard">
              <Button className="bg-golden-amber hover:bg-golden-amber/90 text-white border-0 text-sm h-10 px-4 rounded-xl shadow-lg shadow-golden-amber/30">
                <Sparkles className="w-4 h-4 ml-2" />
                موتور شناسایی
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ============================================
          KPI CARDS
      ============================================ */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
        {renderStatCard({
          label: 'کل دارایی‌ها',
          value: stats.totalAssets,
          icon: Package,
          color: 'text-dark-green',
          subtitle: `${stats.growthRate > 0 ? '+' : ''}${toPersianNumber(stats.growthRate)}٪ نسبت به ماه قبل`,
          trend: stats.growthRate > 0 ? 'up' : stats.growthRate < 0 ? 'down' : 'flat',
        })}
        {renderStatCard({ label: 'تأیید شده', value: stats.verifiedAssets, icon: CheckCircle, color: 'text-emerald-600' })}
        {renderStatCard({ label: 'در انتظار', value: stats.pendingAssets, icon: Clock, color: 'text-amber-600' })}
        {renderStatCard({ label: 'رد شده', value: stats.rejectedAssets, icon: AlertCircle, color: 'text-red-600' })}
        {renderStatCard({
          label: 'نرخ تأیید',
          value: approvalRate,
          icon: TrendingUp,
          color: 'text-emerald-600',
          subtitle: stats.totalAssets > 0 ? `${toPersianNumber(stats.totalAssets - stats.verifiedAssets - stats.pendingAssets)} رد` : '',
        })}
      </div>

      {/* ============================================
          SECOND ROW - عملیاتی
      ============================================ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {[
          { label: 'کاربران', value: stats.totalUsers, icon: Users, bg: 'bg-blue-50', color: 'text-blue-600' },
          { label: 'واحدها', value: stats.totalDepartments, icon: Building, bg: 'bg-purple-50', color: 'text-purple-600' },
          { label: 'قالب‌ها', value: stats.totalScreeningTemplates, icon: FileCheck, bg: 'bg-amber-50', color: 'text-amber-600' },
          { label: 'ارزیابی‌ها', value: stats.totalValuations, icon: ClipboardCheck, bg: 'bg-emerald-50', color: 'text-emerald-600' },
        ].map((row) => (
          <Card key={row.label} className="border border-gray-100 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3.5">
              <div className={`${row.bg} p-2.5 rounded-xl`}><row.icon className={`w-5 h-5 ${row.color}`} /></div>
              <div>
                <p className="text-[10px] text-gray-400 font-medium">{row.label}</p>
                <p className="text-lg font-bold text-dark-green tabular-nums">{toPersianNumberWithComma(row.value)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ============================================
          VALUATION BREAKDOWN - DCF / NAV / Portfolio
      ============================================ */}
      <div>
        <p className="text-xs font-semibold text-gray-400 mb-2.5 px-1">ارزش پرتفوی دارایی‌ها</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* DCF */}
          <Card className="border border-gray-100 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-md transition-shadow border-r-4 border-r-blue-500">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-50 p-2 rounded-xl">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-blue-700">ارزش دارایی‌های DCF</p>
                    <p className="text-[9px] text-gray-400">جریان نقدی تنزیل شده</p>
                  </div>
                </div>
              </div>
              <p className="text-2xl font-bold text-blue-700 tabular-nums" title={`${stats.dcfValue} ریال`}>
                {toPersianNumberWithComma(Math.round(stats.dcfValue))}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">ریال</p>
              <p className="text-[10px] text-blue-600 mt-2 font-medium">
                وزن در پرتفوی: ۵۰٪
              </p>
            </CardContent>
          </Card>

          {/* NAV */}
          <Card className="border border-gray-100 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-md transition-shadow border-r-4 border-r-purple-500">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-purple-50 p-2 rounded-xl">
                    <Package className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-purple-700">ارزش دارایی‌های NAV</p>
                    <p className="text-[9px] text-gray-400">ارزش خالص دارایی</p>
                  </div>
                </div>
              </div>
              <p className="text-2xl font-bold text-purple-700 tabular-nums" title={`${stats.navValue} ریال`}>
                {toPersianNumberWithComma(Math.round(stats.navValue))}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">ریال</p>
              <p className="text-[10px] text-purple-600 mt-2 font-medium">
                وزن در پرتفوی: ۹۵٪
              </p>
            </CardContent>
          </Card>

          {/* Portfolio Total */}
          <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-[0_4px_12px_rgba(16,185,129,0.15)] hover:shadow-[0_8px_20px_rgba(16,185,129,0.2)] transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-emerald-100 p-2 rounded-xl">
                    <DollarSign className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-800">مجموع پرتفوی</p>
                    <p className="text-[9px] text-emerald-600">(۰.۹۵ × NAV) + (۰.۵ × DCF)</p>
                  </div>
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-700 tabular-nums" title={`${stats.portfolioValue} ریال`}>
                {toPersianNumberWithComma(Math.round(stats.portfolioValue))}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">ریال</p>
              <p className="text-[10px] text-emerald-600 mt-2 font-medium">
                ✓ وزن‌دهی‌شده بر اساس نوع ارزش‌گذاری
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ============================================
          CHARTS ROW
      ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">

        {/* 1. توزیع دسته‌بندی */}
        <Card className="border border-gray-100 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-dark-green font-semibold">
              <div className="bg-dark-green/10 p-1.5 rounded-lg"><PieChart className="w-4 h-4" /></div>
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
                  innerRadius={38}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="white" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontFamily: 'var(--font-vazir)', fontSize: 12, borderRadius: 10, border: '1px solid #eee' }} />
              </RePieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 2. وضعیت ارزیابی */}
        <Card className="border border-gray-100 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-dark-green font-semibold">
              <div className="bg-dark-green/10 p-1.5 rounded-lg"><ClipboardCheck className="w-4 h-4" /></div>
              وضعیت ارزیابی‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3.5">
              {[
                { label: 'تکمیل شده', value: valuationStatus.completed, color: 'bg-emerald-500', text: 'text-emerald-600' },
                { label: 'در حال انجام', value: valuationStatus.inProgress, color: 'bg-amber-500', text: 'text-amber-600' },
                { label: 'شروع نشده', value: valuationStatus.notStarted, color: 'bg-gray-300', text: 'text-gray-500' },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between items-center text-sm mb-1.5">
                    <span className="text-gray-600">{row.label}</span>
                    <span className={`font-semibold tabular-nums ${row.text}`}>{toPersianNumber(row.value)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`${row.color} h-2 rounded-full transition-all duration-700`}
                      style={{ width: `${stats.totalAssets > 0 ? (row.value / stats.totalAssets) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 3. توزیع نوع دارایی */}
        <Card className="border border-gray-100 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-dark-green font-semibold">
              <div className="bg-dark-green/10 p-1.5 rounded-lg"><Layers className="w-4 h-4" /></div>
              نوع دارایی‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {assetTypeDistribution.length > 0 ? (
                assetTypeDistribution.slice(0, 5).map((item, index) => (
                  <div key={item.name} className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 truncate max-w-[120px]">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-1.5 rounded-full transition-all duration-700"
                          style={{
                            width: `${(item.value / stats.totalAssets) * 100}%`,
                            backgroundColor: COLORS[index % COLORS.length]
                          }}
                        />
                      </div>
                      <span className="font-semibold text-gray-700 text-xs w-6 text-left tabular-nums">{toPersianNumber(item.value)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400 text-center py-6">داده‌ای برای نمایش وجود ندارد</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================
          TREND CHART
      ============================================ */}
      <Card className="border border-gray-100 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-dark-green font-semibold">
            <div className="bg-dark-green/10 p-1.5 rounded-lg"><LineChartIcon className="w-4 h-4" /></div>
            روند ثبت دارایی‌ها (۳۰ روز اخیر)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={trendData}>
              <defs>
                <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#015345" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#015345" stopOpacity={0.55} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF1F0" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontFamily: 'var(--font-vazir)', fontSize: 12, borderRadius: 10, border: '1px solid #eee' }} />
              <Legend wrapperStyle={{ fontFamily: 'var(--font-vazir)', fontSize: 11 }} />
              <Bar dataKey="count" fill="url(#barFill)" radius={[4, 4, 0, 0]} name="ثبت‌شده" />
              <Line type="monotone" dataKey="count" stroke="#D4A547" strokeWidth={2.5} dot={false} name="روند" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ============================================
          ALERTS & RECENT ACTIVITY
      ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* هشدارها */}
        <Card className="border border-gray-100 shadow-[0_1px_2px_rgba(15,23,42,0.04)] border-r-4 border-r-amber-400 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-600 font-semibold">
              <AlertTriangle className="w-4 h-4" />
              نیاز به توجه
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingAlerts.length > 0 ? (
              <div className="space-y-2">
                {pendingAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between text-sm p-3 bg-amber-50/70 rounded-xl border border-amber-100">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-700 truncate">{alert.asset_name}</p>
                      <p className="text-[10px] text-gray-400">{alert.asset_uid}</p>
                    </div>
                    <div className="text-left shrink-0 pl-2">
                      <p className="text-amber-600 font-bold tabular-nums">{toPersianNumber(alert.days)} روز</p>
                      <p className="text-[10px] text-gray-400">در انتظار</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-6">همه چیز خوب است، هیچ هشداری وجود ندارد</p>
            )}
          </CardContent>
        </Card>

        {/* آخرین فعالیت‌ها */}
        <Card className="border border-gray-100 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2 text-dark-green font-semibold">
              <ClockIcon className="w-4 h-4" />
              آخرین فعالیت‌ها
            </CardTitle>
            <Link href="/dashboard/intangible/screening/list">
              <Button variant="ghost" size="sm" className="text-xs text-dark-green h-7 gap-1">
                مشاهده همه <ChevronLeft className="w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-50">
              {recentAssets.map((asset) => (
                <Link href={`/dashboard/intangible/screening/${asset.id}`} key={asset.id}>
                  <div className="flex items-center justify-between py-2.5 px-1 hover:bg-gray-50 rounded-lg transition-colors -mx-1">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{asset.asset_name}</p>
                      <p className="text-[10px] text-gray-400">{asset.asset_uid}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 pl-1">
                      {getResultBadge(asset.result)}
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">{formatDate(asset.created_at)}</span>
                    </div>
                  </div>
                </Link>
              ))}
              {recentAssets.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-6">هیچ فعالیتی ثبت نشده است</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================
          QUICK ACTIONS
      ============================================ */}
      <div>
        <p className="text-xs font-semibold text-gray-400 mb-2.5 px-1">دسترسی سریع</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {[
            { href: '/dashboard/intangible/screening/new', icon: Search, label: 'غربالگری جدید', color: 'text-dark-green', bg: 'bg-dark-green/10' },
            { href: '/dashboard/intangible/discovery-wizard', icon: Sparkles, label: 'موتور شناسایی', color: 'text-golden-amber', bg: 'bg-golden-amber/10' },
            { href: '/dashboard/intangible/evaluation/list', icon: ClipboardCheck, label: 'ارزیابی‌ها', color: 'text-medium-green', bg: 'bg-medium-green/10' },
            { href: '/dashboard/intangible/valuation/valuation', icon: Gauge, label: 'ارزش‌گذاری', color: 'text-dark-green', bg: 'bg-dark-green/10' },
          ].map((action) => (
            <Link href={action.href} key={action.href}>
              <Card className="group border border-gray-100 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-lg hover:-translate-y-0.5 hover:border-dark-green/30 transition-all cursor-pointer">
                <CardContent className="p-4 text-center">
                  <div className={`${action.bg} w-11 h-11 mx-auto rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform`}>
                    <action.icon className={`w-5 h-5 ${action.color}`} />
                  </div>
                  <p className="text-xs font-medium mt-2.5 text-gray-700">{action.label}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* ============================================
    CLAIM ASSETS BUTTON (برای کاربران لاگین شده)
    ============================================ */}
      <ClaimAssetsButton />
    </PageTransition>
  );
}
