'use client';

import { useAuthStore } from '@/store/auth-store';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// ============ آیکون‌های مشترک ============
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
  Layers,
  ArrowUp,
  ArrowDown,
  Award,
  Zap,
  Plus
} from 'lucide-react';

// ============ نوع داده‌ها ============
interface DashboardStats {
  totalAssets: number;
  verifiedAssets: number;
  pendingAssets: number;
  rejectedAssets: number;
  totalOrganizations: number;
  totalDepartments: number;
  totalUsers: number;
}

interface RecentAsset {
  id: number;
  asset_name: string;
  asset_uid: string;
  category: string;
  result: string;
  created_at: string;
  created_by: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    department_name: string;
  };
  created_by_name: string;
  organization_name: string;
  department_name: string;
  description: string;
}

// ============ کامپوننت اصلی ============
export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalAssets: 0,
    verifiedAssets: 0,
    pendingAssets: 0,
    rejectedAssets: 0,
    totalOrganizations: 0,
    totalDepartments: 0,
    totalUsers: 0,
  });
  const [recentAssets, setRecentAssets] = useState<RecentAsset[]>([]);
  const [loading, setLoading] = useState(true);

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
      console.log('📊 Fetching dashboard data...');
      
      // 1. دریافت دارایی‌ها
      const { data: assetsData } = await api.get('/intangible/screened-assets/');
      const assets = assetsData.results || assetsData || [];
      console.log('📦 Assets:', assets.length);
      
      // محاسبه آمار دارایی‌ها
      const verified = assets.filter((a: any) => a.result === 'confirmed').length;
      const pending = assets.filter((a: any) => a.result === 'conditional').length;
      const rejected = assets.filter((a: any) => a.result === 'rejected').length;
      
      let totalOrgs = 0;
      let totalDepts = 0;
      let totalUsers = 0;
      
      // 2. اگر super_admin است، اطلاعات سازمان‌ها و کاربران را بگیر
      if (isSuperAdmin) {
        try {
          // دریافت سازمان‌ها
          const { data: orgsData } = await api.get('/auth/organizations/');
          const orgs = orgsData.results || orgsData || [];
          totalOrgs = orgs.length;
          console.log('🏢 Organizations:', totalOrgs);
          
          // محاسبه تعداد واحدها
          orgs.forEach((org: any) => {
            totalDepts += (org.departments?.length || 0);
          });
          console.log('📋 Departments:', totalDepts);
        } catch (e) {
          console.error('Error fetching organizations:', e);
        }
        
        try {
          // دریافت کاربران
          const { data: usersData } = await api.get('/auth/users/');
          const users = usersData.results || usersData || [];
          totalUsers = users.length;
          console.log('👥 Users:', totalUsers);
        } catch (e) {
          console.error('Error fetching users:', e);
        }
      }
      
      setStats({
        totalAssets: assets.length,
        verifiedAssets: verified,
        pendingAssets: pending,
        rejectedAssets: rejected,
        totalOrganizations: totalOrgs,
        totalDepartments: totalDepts,
        totalUsers: totalUsers,
      });
      
      // 3. فعالیت‌های اخیر (۵ مورد آخر)
      const sorted = [...assets].sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setRecentAssets(sorted.slice(0, 5));
      
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============ توابع کمکی ============
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
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[result as keyof typeof colors] || 'bg-gray-100'}`}>
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

  const getUserDisplayName = (asset: RecentAsset) => {
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

  const getRoleDisplay = (role: string) => {
    const roles: Record<string, string> = {
      super_admin: 'ادمین کل سیستم',
      org_admin: 'ادمین مجموعه',
      org_user: 'کاربر مجموعه',
    };
    return roles[role] || role;
  };

  const getFullName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.email?.split('@')[0] || 'کاربر';
  };

  // ============ رندر داشبورد برای org_user و org_admin (داشبورد قبلی) ============
  const renderOrgDashboard = () => {
    const statCards = [
      {
        title: 'کل دارایی‌های کشف شده',
        value: stats.totalAssets,
        icon: Package,
        color: 'bg-blue-500',
        href: '/dashboard/intangible/assets',
      },
      {
        title: 'تأیید شده',
        value: stats.verifiedAssets,
        icon: CheckCircle,
        color: 'bg-green-500',
        href: '/dashboard/intangible/screening/list?status=confirmed',
      },
      {
        title: 'در انتظار بررسی',
        value: stats.pendingAssets,
        icon: Clock,
        color: 'bg-yellow-500',
        href: '/dashboard/intangible/screening/list?status=conditional',
      },
      {
        title: 'رد شده',
        value: stats.rejectedAssets,
        icon: AlertCircle,
        color: 'bg-red-500',
        href: '/dashboard/intangible/screening/list?status=rejected',
      },
    ];

    return (
      <>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-full">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">خوش آمدید، {getFullName()} عزیز</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                      {getRoleDisplay(user?.role || 'org_user')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                {user?.organization_name && (
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
                    <Building2 className="w-4 h-4" />
                    <span>{user.organization_name}</span>
                  </div>
                )}
                {user?.department_name && (
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
                    <Building className="w-4 h-4" />
                    <span>{user.department_name}</span>
                  </div>
                )}
                {user?.role === 'org_admin' && !user?.department_name && (
                  <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg">
                    <Building className="w-4 h-4" />
                    <span>مدیریت همه واحدها</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard/intangible/screening/new">
                <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  غربالگری جدید
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* آمار کارت‌ها */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Link href={card.href} key={index}>
                <Card className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">{card.title}</p>
                        <p className="text-2xl font-bold mt-1">{card.value}</p>
                      </div>
                      <div className={`${card.color} p-3 rounded-full text-white`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* دارایی‌های اخیر */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-5 h-5" />
              دارایی‌های اخیر
            </CardTitle>
            <Link href="/dashboard/intangible/assets">
              <Button variant="outline" size="sm">مشاهده همه</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentAssets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>هیچ دارایی ثبت نشده است</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAssets.map((asset) => (
                  <Link href={`/dashboard/intangible/assets/${asset.id}`} key={asset.id}>
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 hover:shadow-sm transition-all cursor-pointer">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{asset.asset_name}</p>
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
                          {asset.department_name && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="flex items-center gap-1 text-gray-500">
                                <Building className="w-3 h-3" />
                                {asset.department_name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(asset.created_at)}
                        </span>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* دسترسی‌های سریع */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">دسترسی‌های سریع</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/dashboard/intangible/screening/new">
                  <button className="w-full p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm transition-colors text-right">🎯 غربالگری جدید</button>
                </Link>
                <Link href="/dashboard/intangible/screening/list">
                  <button className="w-full p-3 bg-green-50 hover:bg-green-100 rounded-lg text-sm transition-colors text-right">📋 لیست غربالگری</button>
                </Link>
                <Link href="/dashboard/intangible/stage2/discovery/new">
                  <button className="w-full p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-sm transition-colors text-right">🔍 کشف دستی</button>
                </Link>
                <Link href="/dashboard/intangible/identity-form">
                  <button className="w-full p-3 bg-orange-50 hover:bg-orange-100 rounded-lg text-sm transition-colors text-right">📝 هویت‌سنجی</button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                خلاصه سازمان
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-gray-500">کل دارایی‌ها</span>
                  <span className="font-bold">{stats.totalAssets}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-gray-500">تأیید شده</span>
                  <span className="font-bold text-green-600">{stats.verifiedAssets}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-sm text-gray-500">در انتظار</span>
                  <span className="font-bold text-yellow-600">{stats.pendingAssets}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">رد شده</span>
                  <span className="font-bold text-red-600">{stats.rejectedAssets}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  };

  // ============ رندر داشبورد برای super_admin (داشبورد جدید مدیریتی) ============
  const renderSuperAdminDashboard = () => {
    return (
      <>
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-purple-800 rounded-2xl p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-full">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">خوش آمدید، {getFullName()} عزیز</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                      {getRoleDisplay(user?.role || 'super_admin')}
                    </span>
                    <span className="bg-yellow-400/20 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      دسترسی کامل به همه سازمان‌ها
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard/companies">
                <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  مدیریت شرکت‌ها
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* آمار کلان */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">کل دارایی‌ها</p>
                  <p className="text-2xl font-bold">{stats.totalAssets}</p>
                </div>
                <div className="bg-blue-500 p-3 rounded-full text-white">
                  <Package className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">تأیید شده</p>
                  <p className="text-2xl font-bold text-green-600">{stats.verifiedAssets}</p>
                </div>
                <div className="bg-green-500 p-3 rounded-full text-white">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">در انتظار</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pendingAssets}</p>
                </div>
                <div className="bg-yellow-500 p-3 rounded-full text-white">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">رد شده</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejectedAssets}</p>
                </div>
                <div className="bg-red-500 p-3 rounded-full text-white">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* آمار سازمانی */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-100 p-3 rounded-full">
                  <Building2 className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalOrganizations}</p>
                  <p className="text-sm text-gray-500">شرکت</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Building className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalDepartments}</p>
                  <p className="text-sm text-gray-500">واحد سازمانی</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 p-3 rounded-full">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-sm text-gray-500">کاربر فعال</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* بخش پایین: فعالیت‌ها و دسترسی‌ها */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* فعالیت‌های اخیر */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-5 h-5" />
                آخرین فعالیت‌ها
              </CardTitle>
              <Link href="/dashboard/intangible/assets">
                <Button variant="ghost" size="sm">مشاهده همه</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentAssets.length === 0 ? (
                <div className="text-center py-8 text-gray-500"><p>هیچ فعالیتی ثبت نشده است</p></div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {recentAssets.map((activity) => (
                    <Link href={`/dashboard/intangible/assets/${activity.id}`} key={activity.id}>
                      <div className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{activity.asset_name}</p>
                            {getResultBadge(activity.result)}
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap text-xs">
                            <span className="text-gray-500">{activity.asset_uid}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-blue-600 truncate max-w-[120px]">
                              {activity.organization_name || 'بدون سازمان'}
                            </span>
                            {activity.department_name && (
                              <>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-500 truncate max-w-[80px]">{activity.department_name}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(activity.created_at)}</span>
                          <Eye className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* دسترسی‌های سریع و خلاصه */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  دسترسی‌های سریع
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/dashboard/companies">
                    <button className="w-full p-3 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-sm transition-colors text-right flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      مدیریت شرکت‌ها
                    </button>
                  </Link>
                  <Link href="/dashboard/intangible/screening/list">
                    <button className="w-full p-3 bg-green-50 hover:bg-green-100 rounded-lg text-sm transition-colors text-right flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-600" />
                      همه دارایی‌ها
                    </button>
                  </Link>
                  <Link href="/dashboard/users">
                    <button className="w-full p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-sm transition-colors text-right flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-600" />
                      مدیریت کاربران
                    </button>
                  </Link>
                  <Link href="/dashboard/reports">
                    <button className="w-full p-3 bg-orange-50 hover:bg-orange-100 rounded-lg text-sm transition-colors text-right flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-orange-600" />
                      گزارش‌ها
                    </button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  خلاصه عملکرد
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-sm text-gray-500">کل دارایی‌ها</span>
                    <span className="font-bold">{stats.totalAssets}</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-sm text-gray-500">نرخ تأیید</span>
                    <span className="font-bold text-green-600">
                      {stats.totalAssets > 0 ? Math.round((stats.verifiedAssets / stats.totalAssets) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-sm text-gray-500">سازمان‌ها</span>
                    <span className="font-bold">{stats.totalOrganizations}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">کاربران</span>
                    <span className="font-bold">{stats.totalUsers}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  };

  // ============ تصمیم‌گیری بر اساس نقش ============
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-500">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  // اگر super_admin باشد، داشبورد مدیریتی نمایش داده شود
  if (isSuperAdmin) {
    return <div className="p-6 space-y-6">{renderSuperAdminDashboard()}</div>;
  }

  // در غیر این صورت (org_admin یا org_user)، داشبورد قبلی نمایش داده شود
  return <div className="p-6 space-y-6">{renderOrgDashboard()}</div>;
}
