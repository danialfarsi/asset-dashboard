'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Package, ArrowLeft, FileText, TrendingUp, User, Eye, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DepartmentDetail {
  id: number;
  name: string;
  code: string;
  organization: {
    id: number;
    name: string;
    code: string;
  };
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
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  const departmentCode = params.code as string;

  useEffect(() => {
    if (departmentCode) {
      fetchDepartmentDetail();
    }
  }, [departmentCode]);

  useEffect(() => {
    if (department) {
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

  const fetchDepartmentAssets = async () => {
    try {
      const { data } = await api.get('/intangible/screened-assets/');
      const allAssets = data.results || data || [];
      
      // فیلتر بر اساس واحد
      const filtered = allAssets.filter((a: any) => {
        if (a.department_name) {
          return a.department_name === department?.name;
        }
        return true;
      });
      
      setAssets(filtered);
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
    const colors = {
      confirmed: 'bg-green-100 text-green-800',
      conditional: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
    };
    const labels = {
      confirmed: 'تأیید شده',
      conditional: 'مشروط',
      rejected: 'رد شده',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[result as keyof typeof colors] || 'bg-gray-100'}`}>
        {labels[result as keyof typeof labels] || result}
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

  // ============ تابع نمایش اسم کاربر ============
  const getUserDisplayName = (asset: Asset) => {
    // اگر اطلاعات کاربر در asset موجود است
    if (asset.created_by) {
      const { first_name, last_name, role, department_name } = asset.created_by;
      
      // ساخت نام کامل
      let fullName = '';
      if (first_name && last_name) {
        fullName = `${first_name} ${last_name}`;
      } else if (first_name) {
        fullName = first_name;
      } else {
        fullName = asset.created_by_name || 'کاربر';
      }
      
      // اضافه کردن سمت
      let roleText = '';
      if (role === 'org_admin') {
        roleText = 'مدیر مجموعه';
      } else if (role === 'super_admin') {
        roleText = 'مدیر کل سیستم';
      } else if (role === 'org_user') {
        if (department_name) {
          roleText = `مدیر واحد ${department_name}`;
        } else {
          roleText = 'کاربر مجموعه';
        }
      }
      
      return `${fullName} (${roleText})`;
    }
    
    // Fallback: فقط از created_by_name استفاده کن
    return asset.created_by_name || 'کاربر';
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
        <button 
          onClick={() => router.back()}
          className="mt-4 text-primary hover:underline"
        >
          بازگشت
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{department.name}</h1>
          <p className="text-sm text-gray-500">
            {department.organization?.name || 'سازمان'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {assets.length} دارایی ثبت شده
          </p>
        </div>
        <div className="bg-blue-100 p-3 rounded-full">
          <Building className="w-6 h-6 text-blue-600" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">کل دارایی‌ها</p>
                <p className="text-2xl font-bold">{assets.length}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">تأیید شده</p>
                <p className="text-2xl font-bold text-green-600">
                  {assets.filter(a => a.result === 'confirmed').length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">در انتظار</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {assets.filter(a => a.result === 'conditional').length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">لیست دارایی‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>هیچ دارایی برای این واحد ثبت نشده است</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assets.map((asset) => (
                <div key={asset.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <p className="font-medium">{asset.asset_name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-gray-500">{asset.asset_uid}</span>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                        {getCategoryLabel(asset.category)}
                      </span>
                      {/* نمایش نام کاربر با سمت */}
                      <span className="text-xs text-blue-600 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-full">
                        <User className="w-3 h-3" />
                        {getUserDisplayName(asset)}
                      </span>
                    </div>
                    {asset.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">{asset.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {getResultBadge(asset.result)}
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(asset.created_at).toLocaleDateString('fa-IR')}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={() => handleViewAsset(asset.id)}
                    >
                      <Eye className="w-4 h-4" />
                      مشاهده
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
