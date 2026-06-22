'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Building2,
  Building,
  Package,
  ArrowLeft,
  User,
  Calendar,
  FileText,
  TrendingUp,
  Users,
  Eye,
  Crown,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
  ChevronLeft
} from 'lucide-react';

interface Department {
  id: number;
  name: string;
  code: string;
}

interface CompanyDetail {
  id: number;
  name: string;
  code: string;
  created_at: string;
  departments: Department[];
}

interface UserInfo {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  organization_id: number;
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
}

interface DepartmentStats {
  total: number;
  verified: number;
  pending: number;
  rejected: number;
}

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [manager, setManager] = useState<UserInfo | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [deptStats, setDeptStats] = useState<Record<number, DepartmentStats>>({});

  const companyCode = params.code as string;

  useEffect(() => {
    if (companyCode) {
      fetchCompanyDetail();
    }
  }, [companyCode]);

  useEffect(() => {
    if (company) {
      fetchCompanyManager();
      fetchCompanyAssets();
    }
  }, [company]);

  const fetchCompanyDetail = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/auth/organizations/');
      const orgs = data.results || data || [];
      const found = orgs.find((o: any) => o.code.toLowerCase() === companyCode.toLowerCase());
      setCompany(found || null);
    } catch (error) {
      console.error('Error fetching company:', error);
    }
  };

  const fetchCompanyManager = async () => {
    try {
      const { data } = await api.get('/auth/users/');
      const users = data.results || data || [];
      const found = users.find((u: any) =>
        u.organization_id === company?.id && u.role === 'org_admin'
      );
      if (found) setManager(found);
    } catch (error) {
      console.error('Error fetching manager:', error);
    }
  };

  const fetchCompanyAssets = async () => {
    try {
      const { data } = await api.get('/intangible/screened-assets/');
      const allAssets = data.results || data || [];

      const filtered = allAssets.filter((a: any) =>
        a.organization_name === company?.name
      );
      setAssets(filtered);

      // محاسبه آمار هر واحد
      const stats: Record<number, DepartmentStats> = {};
      company?.departments?.forEach((dept: Department) => {
        const deptAssets = filtered.filter((a: any) => a.department_name === dept.name);
        stats[dept.id] = {
          total: deptAssets.length,
          verified: deptAssets.filter((a: any) => a.result === 'confirmed').length,
          pending: deptAssets.filter((a: any) => a.result === 'conditional').length,
          rejected: deptAssets.filter((a: any) => a.result === 'rejected').length,
        };
      });
      setDeptStats(stats);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getResultBadge = (result: string) => {
    const config = {
      confirmed: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'تأیید شده' },
      conditional: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', label: 'در انتظار' },
      rejected: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'رد شده' },
    };
    const c = config[result as keyof typeof config] || config.confirmed;
    const Icon = c.icon;
    return (
      <span className={`${c.bg} ${c.color} px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {c.label}
      </span>
    );
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
      if (first_name && last_name) fullName = `${first_name} ${last_name}`;
      else if (first_name) fullName = first_name;
      else fullName = asset.created_by_name || 'کاربر';
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
    } catch { return dateString; }
  };

  const getManagerName = () => {
    if (!manager) return 'تعیین نشده';
    if (manager.first_name && manager.last_name) {
      return `${manager.first_name} ${manager.last_name}`;
    }
    return manager.email || 'تعیین نشده';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">شرکت مورد نظر یافت نشد</p>
        <button onClick={() => router.back()} className="mt-4 text-primary hover:underline">بازگشت</button>
      </div>
    );
  }

  const totalAssets = assets.length;
  const verifiedAssets = assets.filter(a => a.result === 'confirmed').length;
  const pendingAssets = assets.filter(a => a.result === 'conditional').length;
  const rejectedAssets = assets.filter(a => a.result === 'rejected').length;

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-700 to-purple-800 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm border border-white/10">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">{company.name}</h1>
                    <p className="text-sm text-white/80 flex items-center gap-2 mt-1">
                      کد: {company.code}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/10">
              <Calendar className="w-4 h-4" />
              {formatDate(company.created_at)}
            </div>
          </div>

          {/* اطلاعات مدیر شرکت */}
          <div className="mt-4 flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2.5">
            <div className="bg-white/20 p-2 rounded-lg">
              <Crown className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <p className="text-xs text-white/70">مدیر شرکت</p>
              <p className="text-sm font-medium flex items-center gap-2">
                {getManagerName()}
                <span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded-full">
                  مدیر مجموعه
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* آمار کل */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">کل دارایی‌ها</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalAssets}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl"><Package className="w-6 h-6 text-blue-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">تأیید شده</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{verifiedAssets}</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl"><CheckCircle className="w-6 h-6 text-emerald-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">در انتظار</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{pendingAssets}</p>
              </div>
              <div className="bg-amber-50 p-3 rounded-xl"><Clock className="w-6 h-6 text-amber-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">رد شده</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{rejectedAssets}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-xl"><AlertCircle className="w-6 h-6 text-red-600" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* واحدها */}
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building className="w-5 h-5 text-indigo-600" />
            واحدهای {company.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {company.departments && company.departments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {company.departments.map((dept) => {
                const stats = deptStats[dept.id] || { total: 0, verified: 0, pending: 0, rejected: 0 };
                const hasAssets = stats.total > 0;

                return (
                  <Link href={`/dashboard/departments/${dept.code}`} key={dept.id}>
                    <div className="p-4 border rounded-xl hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer bg-white">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${hasAssets ? 'bg-indigo-50' : 'bg-gray-100'}`}>
                          <Building className={`w-5 h-5 ${hasAssets ? 'text-indigo-600' : 'text-gray-400'}`} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{dept.name}</p>
                          <p className="text-xs text-gray-400">{dept.code}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-gray-600">
                          <Package className="w-4 h-4" />
                          {stats.total} دارایی
                        </span>
                        {hasAssets && (
                          <>
                            <span className="flex items-center gap-1 text-emerald-600">
                              <CheckCircle className="w-3 h-3" />
                              {stats.verified}
                            </span>
                            {stats.pending > 0 && (
                              <span className="flex items-center gap-1 text-amber-600">
                                <Clock className="w-3 h-3" />
                                {stats.pending}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Building className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>هیچ واحدی برای این شرکت تعریف نشده است</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* آمار پایین */}
      {totalAssets > 0 && (
        <Card className="border-0 shadow-sm bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 text-gray-600">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                نرخ تأیید:
                <span className="font-bold text-emerald-600">
                  {totalAssets > 0 ? Math.round((verifiedAssets / totalAssets) * 100) : 0}%
                </span>
              </span>
              <span className="flex items-center gap-2 text-gray-600">
                <Users className="w-4 h-4 text-indigo-600" />
                {company.departments?.length || 0} واحد
              </span>
              <span className="flex items-center gap-2 text-gray-600">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                {totalAssets} دارایی • {verifiedAssets} تأیید • {pendingAssets} در انتظار • {rejectedAssets} رد
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* دکمه بازگشت */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => router.back()} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          بازگشت به لیست شرکت‌ها
        </Button>
      </div>
    </div>
  );
}
