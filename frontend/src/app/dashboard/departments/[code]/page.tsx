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
  return Math.round((score / 100) * 5 * 10) / 10;
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
      
      setAssets(filtered);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
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
  // 🔥 لیست‌ها
  // ============================================================
  const allAssets = assets;
  
  // دارایی‌های نیازمند تایید ارزش‌گذاری (امتیاز >= 60 و تایید نشده)
  const pendingValuationAssets = assets.filter((a: any) => {
    const score = a.valuation_score || 0;
    return score >= 60 && !a.is_approved_for_valuation;
  });
  
  // 🔥 دارایی‌های نیازمند تایید حفاظت:
  // شرط: is_approved_for_valuation = true و is_approved_for_protection = false
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
    const score = asset.valuation_score || 0;
    
    if (asset.is_approved_for_valuation === true) {
      return (
        <Badge className="bg-green-500 text-white text-xs">
          <CheckCircle className="w-3 h-3 ml-1" />
          تأیید ارزش‌گذاری
        </Badge>
      );
    }
    if (score >= 60) {
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
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen font-vazir">
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

      {/* جستجو */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="جستجوی دارایی..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
      </div>

      {/* ۳ دراپ‌داون */}
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm text-gray-500">لیست:</span>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 min-w-[200px] justify-between">
              <span>{getListLabel()}</span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[300px]">
            <DropdownMenuItem onClick={() => setSelectedList('all')} className="gap-2">
              <Package className="h-4 w-4" />
              <div className="flex flex-col">
                <span>کل دارایی‌ها</span>
                <span className="text-xs text-gray-400">همه دارایی‌های واحد</span>
              </div>
              <Badge variant="secondary" className="mr-auto">{toPersianNumber(allAssets.length)}</Badge>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedList('valuation')} className="gap-2">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              <div className="flex flex-col">
                <span>نیازمند تایید ارزش‌گذاری</span>
                <span className="text-xs text-gray-400">امتیاز ارزیابی بالای ۶۰</span>
              </div>
              <Badge variant="secondary" className="mr-auto bg-amber-100 text-amber-700">
                {toPersianNumber(pendingValuationAssets.length)}
              </Badge>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedList('protection')} className="gap-2">
              <Shield className="h-4 w-4 text-purple-500" />
              <div className="flex flex-col">
                <span>نیازمند تایید حفاظت</span>
                <span className="text-xs text-gray-400">تایید ارزش‌گذاری شده، نیاز به تایید حفاظت</span>
              </div>
              <Badge variant="secondary" className="mr-auto bg-purple-100 text-purple-700">
                {toPersianNumber(pendingProtectionAssets.length)}
              </Badge>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* لیست دارایی‌ها */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            {getListLabel()}
            <span className="text-sm text-gray-400 font-normal mr-2">
              ({toPersianNumber(filteredAssets.length)} مورد)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {filteredAssets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">هیچ دارایی یافت نشد</p>
              <p className="text-sm mt-1">
                {selectedList === 'all' && 'هیچ دارایی در این واحد ثبت نشده است'}
                {selectedList === 'valuation' && 'هیچ دارایی برای تایید ارزش‌گذاری وجود ندارد'}
                {selectedList === 'protection' && 'هیچ دارایی برای حفاظت وجود ندارد'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAssets.map((asset: any) => {
                const score = asset.valuation_score || 0;
                const displayScore = convertScore(score);
                const isPendingValuation = score >= 60 && !asset.is_approved_for_valuation;
                const isApprovedValuation = asset.is_approved_for_valuation === true;
                const isPendingProtection = asset.is_approved_for_valuation === true && asset.is_approved_for_protection !== true;
                
                return (
                  <div 
                    key={asset.id} 
                    className={`flex flex-wrap items-start justify-between p-4 border rounded-xl hover:shadow-md transition-all cursor-pointer ${
                      isPendingValuation ? 'border-amber-200 bg-amber-50/30' : 
                      isApprovedValuation ? 'border-green-200 bg-green-50/30' : 
                      isPendingProtection ? 'border-purple-200 bg-purple-50/30' :
                      'border-gray-200'
                    }`}
                    onClick={() => handleViewAsset(asset.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900 truncate">{asset.asset_name}</p>
                        {score > 0 && (
                          <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700">
                            <Star className="w-3 h-3 ml-1 fill-yellow-400 text-yellow-400" />
                            {toPersianNumber(displayScore)}
                          </Badge>
                        )}
                        {getValuationStatusBadge(asset)}
                        {isPendingProtection && (
                          <Badge className="bg-purple-500 text-white text-xs">
                            <Shield className="w-3 h-3 ml-1" />
                            نیاز به تایید حفاظت
                          </Badge>
                        )}
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
                    
                    <div className="flex items-center gap-2 flex-shrink-0 mt-2 md:mt-0">
                      {isAdmin && isPendingValuation && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApproveProtection(asset.id);
                            }}
                            disabled={approving === asset.id}
                          >
                            <CheckCircle className="w-4 h-4 ml-1" />
                            {approving === asset.id ? '...' : 'تایید'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500 text-red-600 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              // رد ارزش‌گذاری
                            }}
                          >
                            <XCircle className="w-4 h-4 ml-1" />
                            رد
                          </Button>
                        </>
                      )}
                      {isApprovedValuation && (
                        <Link href={`/dashboard/intangible/valuation/${asset.id}`} onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="outline" className="border-blue-200 text-blue-600">
                            <TrendingUp className="w-4 h-4 ml-1" />
                            ارزش‌گذاری
                          </Button>
                        </Link>
                      )}
                      {isPendingProtection && isAdmin && (
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApproveProtection(asset.id);
                          }}
                          disabled={approving === asset.id}
                        >
                          <Shield className="w-4 h-4 ml-1" />
                          {approving === asset.id ? '...' : 'تایید حفاظت'}
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="text-blue-600">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
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
                کل دارایی‌ها: <span className="font-bold">{toPersianNumber(assets.length)}</span>
              </span>
              <span className="flex items-center gap-2 text-amber-600">
                <Clock className="w-4 h-4" />
                نیاز به تایید ارزش‌گذاری: <span className="font-bold">{toPersianNumber(pendingValuationAssets.length)}</span>
              </span>
              <span className="flex items-center gap-2 text-purple-600">
                <Shield className="w-4 h-4" />
                نیاز به حفاظت: <span className="font-bold">{toPersianNumber(pendingProtectionAssets.length)}</span>
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
