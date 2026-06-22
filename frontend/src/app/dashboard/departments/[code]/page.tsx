'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Building, 
  Package, 
  ArrowLeft, 
  TrendingUp, 
  User, 
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Building2,
  FileText,
  BarChart3,
  Users,
  Crown
} from 'lucide-react';
import Link from 'next/link';

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
}

export default function DepartmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [department, setDepartment] = useState<DepartmentDetail | null>(null);
  const [manager, setManager] = useState<DepartmentManager | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    rejected: 0,
  });

  const departmentCode = params.code as string;

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
      console.log('🔍 Fetching manager for department:', department?.id);
      
      // دریافت همه کاربران
      const { data } = await api.get('/auth/users/');
      const users = data.results || data || [];
      console.log('👥 Total users:', users.length);
      
      // پیدا کردن کاربری که department_id مطابق دارد
      const deptManager = users.find((u: any) => {
        const match = u.department === department?.id || u.department_id === department?.id;
        if (match) {
          console.log('✅ Found manager:', u.email);
        }
        return match;
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
        console.log('✅ Manager set:', deptManager.first_name, deptManager.last_name);
      } else {
        console.log('⚠️ No manager found for department:', department?.id);
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
      
      setAssets(filtered);
      
      setStats({
        total: filtered.length,
        verified: filtered.filter((a: any) => a.result === 'confirmed').length,
        pending: filtered.filter((a: any) => a.result === 'conditional').length,
        rejected: filtered.filter((a: any) => a.result === 'rejected').length,
      });
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAsset = (assetId: number) => {
    router.push(`/dashboard/intangible/assets/${assetId}`);
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">واحد مورد نظر یافت نشد</p>
        <button onClick={() => router.back()} className="mt-4 text-primary hover:underline">بازگشت</button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.back()}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm border border-white/10"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                    <Building className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">{department.name}</h1>
                    <p className="text-sm text-white/80 flex items-center gap-2 mt-1">
                      <Building2 className="w-4 h-4" />
                      {department.organization?.name || 'سازمان'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/10">
              <Calendar className="w-4 h-4" />
              {formatDate(department.created_at)}
            </div>
          </div>

          {/* اطلاعات مدیر واحد */}
          {manager ? (
            <div className="mt-4 flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2.5">
              <div className="bg-white/20 p-2 rounded-lg">
                <Crown className="w-5 h-5 text-yellow-300" />
              </div>
              <div>
                <p className="text-xs text-white/70">مسئول واحد</p>
                <p className="text-sm font-medium flex items-center gap-2">
                  {getFullName()}
                  <span className="text-xs text-white/60 bg-white/10 px-2 py-0.5 rounded-full">
                    {getRoleDisplay(manager.role)}
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2.5">
              <div className="bg-white/10 p-2 rounded-lg">
                <User className="w-5 h-5 text-white/50" />
              </div>
              <div>
                <p className="text-xs text-white/50">مسئول واحد</p>
                <p className="text-sm font-medium text-white/60">تعیین نشده</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* آمار کارت‌ها */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">کل دارایی‌ها</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">تأیید شده</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.verified}</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">در انتظار</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p>
              </div>
              <div className="bg-amber-50 p-3 rounded-xl">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">رد شده</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.rejected}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-xl">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* لیست دارایی‌ها */}
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            لیست دارایی‌ها
            <span className="text-sm text-gray-400 font-normal mr-2">
              ({assets.length} مورد)
            </span>
          </CardTitle>
          <Link href={`/dashboard/intangible/screening/new?type=${user?.organization_type || 'manufacturing'}`}>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              + افزودن دارایی جدید
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="pt-4">
          {assets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">هیچ دارایی ثبت نشده</p>
              <p className="text-sm mt-1">برای این واحد هنوز دارایی ثبت نشده است</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assets.map((asset) => (
                <div 
                  key={asset.id} 
                  className="flex items-center justify-between p-4 border rounded-xl hover:shadow-md hover:border-blue-200 transition-all cursor-pointer bg-white"
                  onClick={() => handleViewAsset(asset.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">{asset.asset_name}</p>
                      {getResultBadge(asset.result)}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap text-xs">
                      <span className="text-gray-400">{asset.asset_uid}</span>
                      <span className="text-gray-300">•</span>
                      <span className="px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                        {getCategoryLabel(asset.category)}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="flex items-center gap-1 text-gray-500">
                        <User className="w-3 h-3" />
                        {getUserDisplayName(asset)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-gray-400 hidden sm:block">
                      {formatDate(asset.created_at)}
                    </span>
                    <Button variant="ghost" size="sm" className="text-blue-600">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* آمار پایین */}
      {assets.length > 0 && (
        <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 text-gray-600">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                نرخ تأیید: 
                <span className="font-bold text-emerald-600">
                  {stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}%
                </span>
              </span>
              <span className="flex items-center gap-2 text-gray-600">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                {stats.total} دارایی • {stats.verified} تأیید • {stats.pending} در انتظار • {stats.rejected} رد
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
