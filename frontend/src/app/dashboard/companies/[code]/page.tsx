'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  ChevronDown,
  ChevronLeft,
  FolderOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDept, setExpandedDept] = useState<number | null>(null);

  const companyCode = params.code as string;

  useEffect(() => {
    if (companyCode) {
      fetchCompanyDetail();
    }
  }, [companyCode]);

  const fetchCompanyDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Searching for company with code:', companyCode);
      
      const { data } = await api.get('/auth/organizations/');
      const orgs = data.results || data || [];
      console.log('📋 All organizations:', orgs);
      
      const found = orgs.find((o: any) => 
        o.code.toLowerCase() === companyCode.toLowerCase()
      );
      
      console.log('✅ Found company:', found);
      
      if (found) {
        setCompany(found);
        await fetchCompanyAssets(found.name);
      } else {
        setError('شرکت مورد نظر یافت نشد');
        setLoading(false);
      }
    } catch (error: any) {
      console.error('❌ Error fetching company:', error);
      setError(error.response?.data?.detail || 'خطا در دریافت اطلاعات شرکت');
      setLoading(false);
    }
  };

  const fetchCompanyAssets = async (companyName: string) => {
    try {
      console.log('📥 Fetching assets for company:', companyName);
      const { data } = await api.get('/intangible/screened-assets/');
      const allAssets = data.results || data || [];
      
      const filtered = allAssets.filter((a: any) => 
        a.organization_name === companyName
      );
      
      console.log('📦 Filtered assets:', filtered.length);
      setAssets(filtered);
    } catch (error) {
      console.error('❌ Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAsset = (assetId: number) => {
    router.push(`/dashboard/intangible/assets/${assetId}`);
  };

  const toggleDepartment = (deptId: number) => {
    if (expandedDept === deptId) {
      setExpandedDept(null);
    } else {
      setExpandedDept(deptId);
    }
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

  // دریافت دارایی‌های یک واحد خاص
  const getDepartmentAssets = (deptName: string) => {
    return assets.filter(a => a.department_name === deptName);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500 text-lg mb-4">⚠️ {error || 'شرکت مورد نظر یافت نشد'}</div>
        <p className="text-xs text-gray-400 mt-2">کد جستجو شده: {companyCode}</p>
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
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{company.name}</h1>
          <p className="text-sm text-gray-500">
            کد: {company.code}
          </p>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Users className="w-3 h-3" />
              {company.departments?.length || 0} واحد
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Package className="w-3 h-3" />
              {assets.length} دارایی
            </span>
          </div>
        </div>
        <div className="bg-indigo-100 p-3 rounded-full">
          <Building2 className="w-6 h-6 text-indigo-600" />
        </div>
      </div>

      {/* ============ بخش واحدها با دراپ‌داون ============ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            واحدهای {company.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {company.departments && company.departments.length > 0 ? (
            <div className="space-y-3">
              {company.departments.map((dept) => {
                const deptAssets = getDepartmentAssets(dept.name);
                const isExpanded = expandedDept === dept.id;
                const assetCount = deptAssets.length;
                
                return (
                  <div key={dept.id} className="border rounded-lg overflow-hidden">
                    {/* Header واحد - قابل کلیک */}
                    <button
                      onClick={() => toggleDepartment(dept.id)}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Building className="w-5 h-5 text-gray-500" />
                        <div className="text-right">
                          <span className="font-medium">{dept.name}</span>
                          <span className="text-xs text-gray-400 mr-2">
                            ({assetCount} دارایی)
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronLeft className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {/* لیست دارایی‌های واحد (دراپ‌داون) */}
                    {isExpanded && (
                      <div className="border-t bg-gray-50/50 p-3">
                        {assetCount === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">
                            هیچ دارایی برای این واحد ثبت نشده است
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {deptAssets.map((asset) => (
                              <div 
                                key={asset.id} 
                                className="flex items-center justify-between p-2 bg-white rounded-lg border hover:shadow-sm transition-all"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium">{asset.asset_name}</p>
                                    {getResultBadge(asset.result)}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap text-xs">
                                    <span className="text-gray-500">{asset.asset_uid}</span>
                                    <span className="text-gray-400">•</span>
                                    <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                                      {getCategoryLabel(asset.category)}
                                    </span>
                                    <span className="text-gray-400">•</span>
                                    <span className="flex items-center gap-1 text-blue-600">
                                      <User className="w-3 h-3" />
                                      {getUserDisplayName(asset)}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400">
                                    {formatDate(asset.created_at)}
                                  </span>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewAsset(asset.id);
                                    }}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>هیچ واحدی برای این شرکت تعریف نشده است</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
