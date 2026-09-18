'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building, 
  Package, 
  ArrowLeft, 
  TrendingUp, 
  User, 
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  Building2,
  FileText,
  BarChart3,
  Crown,
  Star,
  Search,
  XCircle,
  Shield,
  ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const toPersianNumber = (num: number): string => {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return num.toString().replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};

const convertScore = (score: number): number => {
  if (!score) return 0;
  if (score <= 5) return Math.round(score * 10) / 10;
  return Math.round((score / 20) * 10) / 10;
};

interface DepartmentDetail {
  id: number;
  name: string;
  code: string;
  organization: {
    id: number;
    name: string;
    code: string;
  };
  created_at: string;
}

interface DepartmentManager {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department_name: string;
}

interface Asset {
  id: number;
  asset_name: string;
  asset_uid: string;
  category: string;
  result: string;
  created_at: string;
  created_by_name: string;
  created_by: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    department_name: string;
  };
  organization_name: string;
  department_name: string;
  description: string;
  valuation_score?: number;
  is_approved_for_valuation?: boolean;
  is_approved_for_protection?: boolean;
  valuation_case_id?: number;
  protection_profile?: {
    id: number;
    status: string;
    status_display: string;
    protection_score: number;
    archetype_display: string;
    step5_completed: boolean;
  };
}

export default function DepartmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [department, setDepartment] = useState<DepartmentDetail | null>(null);
  const [manager, setManager] = useState<DepartmentManager | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedList, setSelectedList] = useState<'all' | 'valuation' | 'protection'>('all');
  const [approving, setApproving] = useState<number | null>(null);

  const departmentCode = params.code as string;
  const isAdmin = user?.role === 'org_admin' || user?.role === 'super_admin';

  useEffect(() => {
    if (departmentCode) {
      fetchDepartmentDetail();
    }
  }, [departmentCode]);

  useEffect(() => {
    if (department) {
      fetchDepartmentManager();
      fetchDepartmentAssets();
    }
  }, [department]);

  const fetchDepartmentDetail = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/auth/departments/');
      const depts = data.results || data || [];
      const found = depts.find((d: any) => d.code.toLowerCase() === departmentCode.toLowerCase());
      setDepartment(found || null);
    } catch (error) {
      console.error('Error fetching department:', error);
    }
  };

  const fetchDepartmentManager = async () => {
    try {
      const { data } = await api.get('/auth/users/');
      const users = data.results || data || [];
      const deptManager = users.find((u: any) => {
        return u.department === department?.id || u.department_id === department?.id;
      });
      
      if (deptManager) {
        setManager({
          id: deptManager.id,
          email: deptManager.email,
          first_name: deptManager.first_name || '',
          last_name: deptManager.last_name || '',
          role: deptManager.role,
          department_name: deptManager.department_name || department?.name || '',
        });
      }
    } catch (error) {
      console.error('Error fetching manager:', error);
    }
  };

  const fetchDepartmentAssets = async () => {
    try {
      const { data } = await api.get('/intangible/screened-assets/');
      const allAssets = data.results || data || [];
      
      const filtered = allAssets.filter((a: any) => {
        if (a.department_name) {
          return a.department_name === department?.name;
        }
        return true;
      });
      
      // دریافت valuation_case_id برای هر دارایی
      const assetsWithData = [];
      for (const asset of filtered) {
        let valuationCaseId = null;
        try {
          const vcRes = await api.get(`/intangible/valuation-cases/?asset=${asset.id}`);
          const vcData = vcRes.data.results || vcRes.data || [];
          if (vcData.length > 0) {
            valuationCaseId = vcData[0].id;
          }
        } catch (e) {}
        
        assetsWithData.push({
          ...asset,
          valuation_case_id: valuationCaseId,
        });
      }
      
      setAssets(assetsWithData);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveValuation = async (assetId: number) => {
    setApproving(assetId);
    try {
      await api.patch(`/intangible/screened-assets/${assetId}/`, {
        is_approved_for_valuation: true,
        approved_at: new Date().toISOString(),
      });
      await fetchDepartmentAssets();
    } catch (error) {
      console.error('Error approving valuation:', error);
      alert('خطا در تایید ارزش‌گذاری');
    } finally {
      setApproving(null);
    }
  };

  const handleApproveProtection = async (assetId: number) => {
    setApproving(assetId);
    try {
      await api.patch(`/intangible/screened-assets/${assetId}/`, {
        is_approved_for_protection: true,
      });
      await fetchDepartmentAssets();
    } catch (error) {
      console.error('Error approving protection:', error);
      alert('خطا در تایید حفاظت');
    } finally {
      setApproving(null);
    }
  };

  const handleViewAsset = (assetId: number) => {
    router.push(`/dashboard/intangible/assets/${assetId}`);
  };

  // ============================================================
  // 🔥 لیست‌ها با سه شرط
  // ============================================================
  const allAssets = assets;
  
  // شرط ۱: نیازمند تایید ارزش‌گذاری (امتیاز >= 3 و تایید نشده)
  const pendingValuationAssets = assets.filter((a: any) => {
    const rawScore = a.valuation_score || 0;
    const score = convertScore(rawScore);
    return score >= 3 && !a.is_approved_for_valuation;
  });
  
  // شرط ۲: نیازمند تایید حفاظت (تایید ارزش‌گذاری شده و تایید حفاظت نشده)
  const pendingProtectionAssets = assets.filter((a: any) => {
    return a.is_approved_for_valuation === true && a.is_approved_for_protection !== true;
  });

  const getCurrentList = () => {
    if (selectedList === 'all') return allAssets;
    if (selectedList === 'valuation') return pendingValuationAssets;
    return pendingProtectionAssets;
  };

  const getListLabel = () => {
    if (selectedList === 'all') return '📦 کل دارایی‌ها';
    if (selectedList === 'valuation') return '📊 نیازمند تایید ارزش‌گذاری';
    return '🛡️ نیازمند تایید حفاظت';
  };

  const getListCount = () => {
    if (selectedList === 'all') return allAssets.length;
    if (selectedList === 'valuation') return pendingValuationAssets.length;
    return pendingProtectionAssets.length;
  };

  const filteredAssets = getCurrentList().filter((asset: any) => {
    return asset.asset_name?.includes(searchTerm) || asset.asset_uid?.includes(searchTerm);
  });

  const getValuationStatusBadge = (asset: any) => {
    const rawScore = asset.valuation_score || 0;
    const score = convertScore(rawScore);
    
    if (asset.is_approved_for_valuation === true) {
      return (
        <Badge className="bg-green-500 text-white text-xs">
          <CheckCircle className="w-3 h-3 ml-1" />
          تأیید ارزش‌گذاری
        </Badge>
      );
    }
    if (score >= 3) {
      return (
        <Badge className="bg-amber-500 text-white text-xs">
          <Clock className="w-3 h-3 ml-1" />
          نیاز به تایید ارزش‌گذاری
        </Badge>
      );
    }
    return null;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      strategic_economic: 'استراتژیک - اقتصادی',
      strategic_social: 'استراتژیک - اجتماعی',
      strategic_knowledge: 'استراتژیک - دانشی',
      strategic_cultural: 'استراتژیک - فرهنگی',
      strategic_environmental: 'استراتژیک - زیست‌محیطی',
      operational_economic: 'عملیاتی - اقتصادی',
      operational_social: 'عملیاتی - اجتماعی',
      operational_knowledge: 'عملیاتی - دانشی',
      operational_cultural: 'عملیاتی - فرهنگی',
      operational_environmental: 'عملیاتی - زیست‌محیطی',
      support_economic: 'پشتیبان - اقتصادی',
      support_social: 'پشتیبان - اجتماعی',
      support_knowledge: 'پشتیبان - دانشی',
      support_cultural: 'پشتیبان - فرهنگی',
      support_environmental: 'پشتیبان - زیست‌محیطی',
    };
    return labels[category] || category;
  };

  const getUserDisplayName = (asset: Asset) => {
    if (asset.created_by) {
      const { first_name, last_name, role, department_name } = asset.created_by;
      let fullName = '';
      if (first_name && last_name) {
        fullName = `${first_name} ${last_name}`;
      } else if (first_name) {
        fullName = first_name;
      } else {
        fullName = asset.created_by_name || 'کاربر';
      }
      let roleText = '';
      if (role === 'org_admin') roleText = 'مدیر مجموعه';
      else if (role === 'super_admin') roleText = 'مدیر کل';
      else if (role === 'org_user' && department_name) roleText = `مدیر واحد ${department_name}`;
      else roleText = 'کاربر';
      return `${fullName} (${roleText})`;
    }
    return asset.created_by_name || 'کاربر';
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
    } catch {
      return dateString;
    }
  };

  const getFullName = () => {
    if (!manager) return 'نامشخص';
    if (manager.first_name && manager.last_name) {
      return `${manager.first_name} ${manager.last_name}`;
    }
    return manager.email || 'نامشخص';
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
      <div dir="rtl" className="min-h-[70vh] bg-[#f7faf8] font-vazir flex items-center justify-center px-6">
        <div className="flex flex-col items-center gap-5">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-2xl bg-emerald-100 rotate-6 animate-pulse" />
            <div className="absolute inset-0 rounded-2xl bg-white border border-emerald-100 shadow-lg flex items-center justify-center">
              <Building2 className="h-7 w-7 text-emerald-700" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-slate-800">در حال بارگذاری اطلاعات واحد</p>
            <p className="mt-1 text-sm text-slate-400">لطفاً چند لحظه صبر کنید...</p>
          </div>
          <div className="h-1.5 w-40 overflow-hidden rounded-full bg-emerald-100">
            <div className="h-full w-1/2 rounded-full bg-emerald-600 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!department) {
    return (
      <div dir="rtl" className="min-h-[70vh] bg-[#f7faf8] font-vazir flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-[28px] border border-slate-200/80 bg-white p-8 text-center shadow-[0_20px_60px_-30px_rgba(15,23,42,0.25)]">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <XCircle className="h-7 w-7 text-slate-500" />
          </div>
          <h2 className="text-xl font-black text-slate-900">واحد مورد نظر یافت نشد</h2>
          <p className="mt-2 text-sm leading-7 text-slate-500">اطلاعات این واحد در دسترس نیست یا شناسه آن معتبر نیست.</p>
          <Button onClick={() => router.back()} className="mt-6 h-11 rounded-xl bg-emerald-700 px-6 text-white shadow-sm hover:bg-emerald-800">
            بازگشت
            <ArrowLeft className="mr-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#f6f9f7] font-vazir text-slate-900">
      <div className="mx-auto w-full max-w-[1600px] space-y-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-[30px] border border-emerald-800/10 bg-[#0f5132] shadow-[0_24px_70px_-32px_rgba(15,81,50,0.65)]">
          <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_20%_10%,rgba(255,255,255,.18),transparent_25%),radial-gradient(circle_at_90%_90%,rgba(52,211,153,.18),transparent_30%)]" />
          <div className="absolute -left-20 -top-24 h-64 w-64 rounded-full border border-white/10" />
          <div className="absolute -left-8 -top-10 h-40 w-40 rounded-full border border-white/10" />

          <div className="relative p-5 sm:p-7 lg:p-9">
            <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 items-start gap-4 sm:gap-5">
                <button
                  onClick={() => router.back()}
                  aria-label="بازگشت"
                  className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>

                <div className="min-w-0">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-inner backdrop-blur-md">
                      <Building className="h-7 w-7 text-emerald-50" />
                    </div>
                    <div className="min-w-0">
                      <p className="mb-1 text-xs font-medium tracking-wide text-emerald-100/75">داشبورد واحد سازمانی</p>
                      <h1 className="truncate text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-[34px]">{department.name}</h1>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5 text-sm text-emerald-50/80">
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/10 px-3 py-1.5 backdrop-blur-sm">
                      <Building2 className="h-4 w-4" />
                      {department.organization?.name || 'سازمان'}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/10 px-3 py-1.5 backdrop-blur-sm">
                      <Calendar className="h-4 w-4" />
                      {formatDate(department.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-auto lg:min-w-[330px]">
                {manager ? (
                  <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-300/15 ring-1 ring-amber-200/20">
                        <Crown className="h-5 w-5 text-amber-200" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-emerald-100/65">مسئول واحد</p>
                        <p className="mt-1 truncate text-base font-bold text-white">{getFullName()}</p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium text-emerald-50/80">
                        {getRoleDisplay(manager.role)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10"><User className="h-5 w-5 text-white/60" /></div>
                      <div><p className="text-xs text-white/50">مسئول واحد</p><p className="mt-1 text-sm font-semibold text-white/70">تعیین نشده</p></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between"><span className="text-sm text-emerald-50/70">کل دارایی‌ها</span><Package className="h-5 w-5 text-emerald-200" /></div>
                <p className="mt-3 text-3xl font-black text-white">{toPersianNumber(assets.length)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between"><span className="text-sm text-emerald-50/70">در انتظار ارزش‌گذاری</span><Clock className="h-5 w-5 text-amber-200" /></div>
                <p className="mt-3 text-3xl font-black text-white">{toPersianNumber(pendingValuationAssets.length)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between"><span className="text-sm text-emerald-50/70">در انتظار حفاظت</span><Shield className="h-5 w-5 text-violet-200" /></div>
                <p className="mt-3 text-3xl font-black text-white">{toPersianNumber(pendingProtectionAssets.length)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Toolbar */}
        <section className="rounded-[24px] border border-slate-200/80 bg-white p-3 shadow-[0_12px_35px_-24px_rgba(15,23,42,0.25)] sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="جستجو بر اساس نام یا شناسه دارایی..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 rounded-2xl border-slate-200 bg-slate-50/70 pr-12 text-[15px] shadow-none transition-all placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-emerald-500/10"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-12 min-w-[285px] justify-between rounded-2xl border-slate-200 bg-white px-4 text-slate-700 shadow-none hover:border-emerald-200 hover:bg-emerald-50/50">
                  <span className="flex items-center gap-2.5 font-bold">
                    {selectedList === 'all' && <Package className="h-4.5 w-4.5 text-emerald-700" />}
                    {selectedList === 'valuation' && <TrendingUp className="h-4.5 w-4.5 text-amber-600" />}
                    {selectedList === 'protection' && <Shield className="h-4.5 w-4.5 text-violet-600" />}
                    {getListLabel().replace(/^\S+\s/, '')}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge className="border-0 bg-slate-100 text-slate-600 hover:bg-slate-100">{toPersianNumber(getListCount())}</Badge>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[330px] rounded-2xl border-slate-200 bg-white p-2 shadow-2xl">
                <DropdownMenuItem onClick={() => setSelectedList('all')} className="cursor-pointer gap-3 rounded-xl p-3 focus:bg-emerald-50">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50"><Package className="h-4 w-4 text-emerald-700" /></div>
                  <div className="flex flex-1 flex-col"><span className="font-bold text-slate-800">کل دارایی‌ها</span><span className="mt-0.5 text-xs text-slate-400">همه دارایی‌های ثبت‌شده واحد</span></div>
                  <Badge variant="secondary" className="bg-slate-100 text-slate-600">{toPersianNumber(allAssets.length)}</Badge>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedList('valuation')} className="mt-1 cursor-pointer gap-3 rounded-xl p-3 focus:bg-amber-50">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50"><TrendingUp className="h-4 w-4 text-amber-600" /></div>
                  <div className="flex flex-1 flex-col"><span className="font-bold text-slate-800">نیازمند تایید ارزش‌گذاری</span><span className="mt-0.5 text-xs text-slate-400">امتیاز ارزیابی بالای ۳</span></div>
                  <Badge className="border-0 bg-amber-100 text-amber-700 hover:bg-amber-100">{toPersianNumber(pendingValuationAssets.length)}</Badge>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedList('protection')} className="mt-1 cursor-pointer gap-3 rounded-xl p-3 focus:bg-violet-50">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50"><Shield className="h-4 w-4 text-violet-600" /></div>
                  <div className="flex flex-1 flex-col"><span className="font-bold text-slate-800">نیازمند تایید حفاظت</span><span className="mt-0.5 text-xs text-slate-400">ارزش‌گذاری تایید شده و در انتظار حفاظت</span></div>
                  <Badge className="border-0 bg-violet-100 text-violet-700 hover:bg-violet-100">{toPersianNumber(pendingProtectionAssets.length)}</Badge>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </section>

        {/* Assets */}
        <Card className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_18px_50px_-35px_rgba(15,23,42,0.28)]">
          <CardHeader className="border-b border-slate-100 px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-3 text-lg font-black text-slate-900">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50"><FileText className="h-5 w-5 text-emerald-700" /></span>
                <span>{getListLabel().replace(/^\S+\s/, '')}</span>
              </CardTitle>
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {toPersianNumber(filteredAssets.length)} مورد نمایش داده می‌شود
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            {filteredAssets.length === 0 ? (
              <div className="flex min-h-[330px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/60 px-6 text-center">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-sm ring-1 ring-slate-200"><Package className="h-9 w-9 text-slate-300" /></div>
                <h3 className="text-lg font-black text-slate-800">هیچ دارایی یافت نشد</h3>
                <p className="mt-2 max-w-md text-sm leading-7 text-slate-400">
                  {selectedList === 'all' && 'در حال حاضر هیچ دارایی در این واحد ثبت نشده است.'}
                  {selectedList === 'valuation' && 'هیچ دارایی در صف تایید ارزش‌گذاری قرار ندارد.'}
                  {selectedList === 'protection' && 'هیچ دارایی در صف تایید حفاظت قرار ندارد.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredAssets.map((asset: any) => {
                  const rawScore = asset.valuation_score || 0;
                  const displayScore = convertScore(rawScore);
                  const isPendingValuation = displayScore >= 3 && !asset.is_approved_for_valuation;
                  const isApprovedValuation = asset.is_approved_for_valuation === true;
                  const isValuationDone = asset.valuation_case_id !== null && asset.valuation_case_id !== undefined;
                  const isPendingProtection = isApprovedValuation && isValuationDone && asset.is_approved_for_protection !== true;

                  return (
                    <article
                      key={asset.id}
                      onClick={() => handleViewAsset(asset.id)}
                      className={`group relative cursor-pointer overflow-hidden rounded-[22px] border bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_-28px_rgba(15,23,42,0.35)] sm:p-5 ${
                        isPendingValuation ? 'border-amber-200/80' :
                        isPendingProtection ? 'border-violet-200/80' :
                        isApprovedValuation ? 'border-emerald-200/80' :
                        'border-slate-200/80'
                      }`}
                    >
                      <div className={`absolute bottom-0 right-0 top-0 w-1 ${isPendingValuation ? 'bg-amber-400' : isPendingProtection ? 'bg-violet-500' : isApprovedValuation ? 'bg-emerald-500' : 'bg-slate-200'}`} />

                      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                        <div className="min-w-0 flex-1 pr-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <h3 className="max-w-full truncate text-base font-black text-slate-900 transition-colors group-hover:text-emerald-800 sm:text-lg">{asset.asset_name}</h3>
                            {rawScore > 0 && (
                              <Badge variant="outline" className="h-7 rounded-lg border-amber-200 bg-amber-50 px-2.5 text-xs font-black text-amber-700">
                                <Star className="ml-1 h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                امتیاز {toPersianNumber(displayScore)}
                              </Badge>
                            )}
                            {getValuationStatusBadge(asset)}
                            {isPendingProtection && <Badge className="h-7 rounded-lg border-0 bg-violet-100 px-2.5 text-xs font-bold text-violet-700 hover:bg-violet-100"><Shield className="ml-1 h-3.5 w-3.5" />نیاز به تایید حفاظت</Badge>}
                            {isValuationDone && isApprovedValuation && <Badge className="h-7 rounded-lg border-0 bg-sky-100 px-2.5 text-xs font-bold text-sky-700 hover:bg-sky-100"><CheckCircle className="ml-1 h-3.5 w-3.5" />ارزش‌گذاری مالی شده</Badge>}
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 sm:text-sm">
                            <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-400" dir="ltr">{asset.asset_uid}</span>
                            <span className="hidden h-4 w-px bg-slate-200 sm:block" />
                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{getCategoryLabel(asset.category)}</span>
                            <span className="hidden h-4 w-px bg-slate-200 sm:block" />
                            <span className="flex min-w-0 items-center gap-1.5"><User className="h-4 w-4 shrink-0 text-slate-400" /><span className="truncate">{getUserDisplayName(asset)}</span></span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 xl:border-0 xl:pt-0" onClick={(e) => e.stopPropagation()}>
                          {isAdmin && isPendingValuation && (
                            <Button size="sm" className="h-10 rounded-xl bg-emerald-700 px-4 font-bold text-white shadow-sm hover:bg-emerald-800" onClick={() => handleApproveValuation(asset.id)} disabled={approving === asset.id}>
                              <CheckCircle className="ml-1.5 h-4 w-4" />{approving === asset.id ? 'در حال تایید...' : 'تایید ارزش‌گذاری'}
                            </Button>
                          )}
                          {isApprovedValuation && (
                            <Link href={`/dashboard/intangible/valuation/${asset.id}`}>
                              <Button size="sm" variant="outline" className="h-10 rounded-xl border-emerald-200 bg-white px-4 font-bold text-emerald-700 hover:bg-emerald-50"><TrendingUp className="ml-1.5 h-4 w-4" />ارزش‌گذاری</Button>
                            </Link>
                          )}
                          {isPendingProtection && isAdmin && (
                            <Button size="sm" className="h-10 rounded-xl bg-violet-600 px-4 font-bold text-white shadow-sm hover:bg-violet-700" onClick={() => handleApproveProtection(asset.id)} disabled={approving === asset.id}>
                              <Shield className="ml-1.5 h-4 w-4" />{approving === asset.id ? 'در حال تایید...' : 'تایید حفاظت'}
                            </Button>
                          )}
                          {isApprovedValuation && isValuationDone && (
                            <Link href={`/dashboard/intangible/protection/${asset.id}`}>
                              <Button size="sm" variant="outline" className="h-10 rounded-xl border-violet-200 bg-white px-4 font-bold text-violet-700 hover:bg-violet-50"><Shield className="ml-1.5 h-4 w-4" />شروع حفاظت</Button>
                            </Link>
                          )}
                          <Button variant="ghost" size="sm" className="h-10 w-10 rounded-xl p-0 text-slate-400 hover:bg-emerald-50 hover:text-emerald-700" onClick={() => handleViewAsset(asset.id)} aria-label="مشاهده دارایی">
                            <Eye className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {assets.length > 0 && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50"><BarChart3 className="h-5 w-5 text-emerald-700" /></div>
              <div><p className="text-xs font-medium text-slate-400">مجموع دارایی‌ها</p><p className="mt-1 text-xl font-black text-slate-900">{toPersianNumber(assets.length)}</p></div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-amber-200/70 bg-amber-50/40 p-4 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100"><Clock className="h-5 w-5 text-amber-700" /></div>
              <div><p className="text-xs font-medium text-amber-700/70">نیازمند تایید ارزش‌گذاری</p><p className="mt-1 text-xl font-black text-amber-800">{toPersianNumber(pendingValuationAssets.length)}</p></div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-violet-200/70 bg-violet-50/40 p-4 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100"><Shield className="h-5 w-5 text-violet-700" /></div>
              <div><p className="text-xs font-medium text-violet-700/70">نیازمند تایید حفاظت</p><p className="mt-1 text-xl font-black text-violet-800">{toPersianNumber(pendingProtectionAssets.length)}</p></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
