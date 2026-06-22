'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Building2, 
  Users, 
  Package, 
  ArrowLeft, 
  Building,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Crown
} from 'lucide-react';
import Link from 'next/link';

interface Organization {
  id: number;
  name: string;
  code: string;
  created_at: string;
  departments: {
    id: number;
    name: string;
    code: string;
  }[];
}

interface UserInfo {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  organization_id: number;
  department_id: number | null;
}

interface CompanyStats {
  totalAssets: number;
  verifiedAssets: number;
  pendingAssets: number;
  rejectedAssets: number;
  totalUsers: number;
  managerName: string;
  managerEmail: string;
}

export default function CompaniesPage() {
  const { user } = useAuthStore();
  const [companies, setCompanies] = useState<Organization[]>([]);
  const [allUsers, setAllUsers] = useState<UserInfo[]>([]);
  const [stats, setStats] = useState<Record<number, CompanyStats>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. دریافت شرکت‌ها
      const { data: orgsData } = await api.get('/auth/organizations/');
      const orgs = orgsData.results || orgsData || [];
      setCompanies(orgs);

      // 2. دریافت کاربران
      const { data: usersData } = await api.get('/auth/users/');
      const users = usersData.results || usersData || [];
      setAllUsers(users);

      // 3. دریافت دارایی‌ها
      const { data: assetsData } = await api.get('/intangible/screened-assets/');
      const assets = assetsData.results || assetsData || [];

      // 4. محاسبه آمار هر شرکت
      const companyStats: Record<number, CompanyStats> = {};
      
      orgs.forEach((org: Organization) => {
        // دارایی‌های شرکت
        const orgAssets = assets.filter((a: any) => a.organization_name === org.name);
        
        // مدیر شرکت (org_admin)
        const manager = users.find((u: any) => 
          u.organization_id === org.id && u.role === 'org_admin'
        );
        
        // کاربران شرکت
        const orgUsers = users.filter((u: any) => u.organization_id === org.id);
        
        companyStats[org.id] = {
          totalAssets: orgAssets.length,
          verifiedAssets: orgAssets.filter((a: any) => a.result === 'confirmed').length,
          pendingAssets: orgAssets.filter((a: any) => a.result === 'conditional').length,
          rejectedAssets: orgAssets.filter((a: any) => a.result === 'rejected').length,
          totalUsers: orgUsers.length,
          managerName: manager ? `${manager.first_name || ''} ${manager.last_name || ''}`.trim() || manager.email : 'تعیین نشده',
          managerEmail: manager?.email || '',
        };
      });
      
      setStats(companyStats);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (value: number, total: number) => {
    if (total === 0) return 'text-gray-400';
    const ratio = value / total;
    if (ratio >= 0.8) return 'text-emerald-600';
    if (ratio >= 0.5) return 'text-amber-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors bg-white shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">شرکت‌ها و سازمان‌ها</h1>
          <p className="text-sm text-gray-500 mt-1">
            مدیریت همه شرکت‌ها و سازمان‌های تحت پوشش
          </p>
        </div>
      </div>

      {/* کارت‌های شرکت‌ها */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {companies.map((company) => {
          const s = stats[company.id] || { 
            totalAssets: 0, 
            verifiedAssets: 0, 
            pendingAssets: 0, 
            rejectedAssets: 0,
            totalUsers: 0,
            managerName: 'تعیین نشده',
            managerEmail: ''
          };
          const hasAssets = s.totalAssets > 0;
          
          return (
            <Link href={`/dashboard/companies/${company.code}`} key={company.id} className="group">
              <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-sm bg-white overflow-hidden relative">
                {/* خط رنگی بالای کارت */}
                <div className={`h-1 w-full ${hasAssets ? 'bg-gradient-to-r from-indigo-500 to-purple-600' : 'bg-gray-300'}`}></div>
                
                <CardContent className="p-6">
                  {/* Header شرکت */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${hasAssets ? 'bg-indigo-50' : 'bg-gray-100'}`}>
                        <Building2 className={`w-6 h-6 ${hasAssets ? 'text-indigo-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {company.name}
                        </h3>
                        <p className="text-xs text-gray-400">کد: {company.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasAssets && (
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full text-xs font-medium">
                          فعال
                        </span>
                      )}
                    </div>
                  </div>

                  {/* آمار سریع */}
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-blue-50 rounded-lg">
                      <p className="text-lg font-bold text-blue-600">{s.totalAssets}</p>
                      <p className="text-[10px] text-gray-500">کل دارایی</p>
                    </div>
                    <div className="text-center p-2 bg-emerald-50 rounded-lg">
                      <p className="text-lg font-bold text-emerald-600">{s.verifiedAssets}</p>
                      <p className="text-[10px] text-gray-500">تأیید</p>
                    </div>
                    <div className="text-center p-2 bg-amber-50 rounded-lg">
                      <p className="text-lg font-bold text-amber-600">{s.pendingAssets}</p>
                      <p className="text-[10px] text-gray-500">در انتظار</p>
                    </div>
                  </div>

                  {/* اطلاعات مدیر و کاربران */}
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                    {/* مدیر شرکت */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-gray-500">
                        <Crown className="w-4 h-4 text-yellow-500" />
                        <span className="text-xs">مدیر:</span>
                        <span className="font-medium text-gray-700">{s.managerName}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Users className="w-3 h-3" />
                        {s.totalUsers} کاربر
                      </div>
                    </div>
                    
                    {/* واحدها */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Building className="w-3 h-3" />
                      <span>{company.departments?.length || 0} واحد</span>
                      <span className="text-gray-300">•</span>
                      <span className={getStatusColor(s.verifiedAssets, s.totalAssets)}>
                        {s.totalAssets > 0 ? Math.round((s.verifiedAssets / s.totalAssets) * 100) : 0}% نرخ تأیید
                      </span>
                    </div>
                  </div>

                  {/* لینک مشاهده */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {company.departments?.length || 0} واحد
                    </span>
                    <span className="text-sm text-indigo-600 font-medium group-hover:gap-2 transition-all flex items-center gap-1">
                      مشاهده جزئیات
                      <ArrowLeft className="w-4 h-4" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* خلاصه کل */}
      {companies.length > 0 && (
        <Card className="border-0 shadow-sm bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">خلاصه کل</p>
                  <p className="text-xl font-bold text-gray-900">
                    {companies.length} شرکت • 
                    {Object.values(stats).reduce((sum, s) => sum + s.totalAssets, 0)} دارایی • 
                    {Object.values(stats).reduce((sum, s) => sum + s.totalUsers, 0)} کاربر
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle className="w-4 h-4" />
                  {Object.values(stats).reduce((sum, s) => sum + s.verifiedAssets, 0)} تأیید
                </span>
                <span className="flex items-center gap-1 text-amber-600">
                  <Clock className="w-4 h-4" />
                  {Object.values(stats).reduce((sum, s) => sum + s.pendingAssets, 0)} در انتظار
                </span>
                <span className="flex items-center gap-1 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  {Object.values(stats).reduce((sum, s) => sum + s.rejectedAssets, 0)} رد
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
