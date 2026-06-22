'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Building, 
  Users, 
  Package, 
  ArrowLeft, 
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  Eye,
  ChevronLeft,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Department {
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

interface DepartmentStats {
  totalAssets: number;
  verifiedAssets: number;
  pendingAssets: number;
  rejectedAssets: number;
}

export default function DepartmentsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentStats, setDepartmentStats] = useState<Record<number, DepartmentStats>>({});
  const [loading, setLoading] = useState(true);
  const [allAssets, setAllAssets] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. دریافت واحدها
      const { data: deptsData } = await api.get('/auth/departments/');
      const depts = deptsData.results || deptsData || [];
      setDepartments(depts);

      // 2. دریافت دارایی‌ها
      const { data: assetsData } = await api.get('/intangible/screened-assets/');
      const assets = assetsData.results || assetsData || [];
      setAllAssets(assets);

      // 3. محاسبه آمار هر واحد
      const stats: Record<number, DepartmentStats> = {};
      depts.forEach((dept: Department) => {
        const deptAssets = assets.filter((a: any) => a.department_name === dept.name);
        stats[dept.id] = {
          totalAssets: deptAssets.length,
          verifiedAssets: deptAssets.filter((a: any) => a.result === 'confirmed').length,
          pendingAssets: deptAssets.filter((a: any) => a.result === 'conditional').length,
          rejectedAssets: deptAssets.filter((a: any) => a.result === 'rejected').length,
        };
      });
      setDepartmentStats(stats);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (result: string) => {
    switch (result) {
      case 'confirmed': return 'text-emerald-600 bg-emerald-50';
      case 'conditional': return 'text-amber-600 bg-amber-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (result: string) => {
    switch (result) {
      case 'confirmed': return <CheckCircle className="w-3 h-3" />;
      case 'conditional': return <Clock className="w-3 h-3" />;
      case 'rejected': return <AlertCircle className="w-3 h-3" />;
      default: return null;
    }
  };

  const getStatusLabel = (result: string) => {
    switch (result) {
      case 'confirmed': return 'تأیید شده';
      case 'conditional': return 'در انتظار';
      case 'rejected': return 'رد شده';
      default: return 'نامشخص';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors bg-white shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">واحدهای سازمانی</h1>
            <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
              <Building2 className="w-4 h-4" />
              {user?.organization_name || 'سازمان'} • {departments.length} واحد
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm">
          <Calendar className="w-4 h-4" />
          آخرین به‌روزرسانی: {formatDate(new Date().toISOString())}
        </div>
      </div>

      {/* کارت‌های واحدها */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => {
          const stats = departmentStats[dept.id] || { totalAssets: 0, verifiedAssets: 0, pendingAssets: 0, rejectedAssets: 0 };
          const hasAssets = stats.totalAssets > 0;
          
          return (
            <Link 
              href={`/dashboard/departments/${dept.code}`} 
              key={dept.id}
              className="group"
            >
              <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 shadow-sm bg-white overflow-hidden relative">
                {/* خط رنگی بالای کارت */}
                <div className={`h-1 w-full ${hasAssets ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gray-300'}`}></div>
                
                <CardContent className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${hasAssets ? 'bg-blue-50' : 'bg-gray-100'}`}>
                        <Building className={`w-6 h-6 ${hasAssets ? 'text-blue-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {dept.name}
                        </h3>
                        <p className="text-xs text-gray-400">کد: {dept.code}</p>
                      </div>
                    </div>
                    {hasAssets && (
                      <div className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full text-xs font-medium">
                        فعال
                      </div>
                    )}
                  </div>

                  {/* آمار */}
                  {hasAssets ? (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div className="text-center p-2 bg-blue-50 rounded-lg">
                        <p className="text-lg font-bold text-blue-600">{stats.totalAssets}</p>
                        <p className="text-[10px] text-gray-500">کل</p>
                      </div>
                      <div className="text-center p-2 bg-emerald-50 rounded-lg">
                        <p className="text-lg font-bold text-emerald-600">{stats.verifiedAssets}</p>
                        <p className="text-[10px] text-gray-500">تأیید</p>
                      </div>
                      <div className="text-center p-2 bg-amber-50 rounded-lg">
                        <p className="text-lg font-bold text-amber-600">{stats.pendingAssets}</p>
                        <p className="text-[10px] text-gray-500">در انتظار</p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 text-center py-4 text-gray-400 text-sm">
                      <Package className="w-8 h-8 mx-auto opacity-30 mb-2" />
                      <p>هنوز دارایی ثبت نشده</p>
                    </div>
                  )}

                  {/* پایین کارت */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />
                      {formatDate(dept.created_at)}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-blue-600 font-medium group-hover:gap-2 transition-all">
                      مشاهده
                      <ChevronLeft className="w-4 h-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* کارت خلاصه کل */}
      {departments.length > 0 && (
        <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">خلاصه کل واحدها</p>
                  <p className="text-xl font-bold text-gray-900">
                    {departments.length} واحد • 
                    {Object.values(departmentStats).reduce((sum, s) => sum + s.totalAssets, 0)} دارایی
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle className="w-4 h-4" />
                  {Object.values(departmentStats).reduce((sum, s) => sum + s.verifiedAssets, 0)} تأیید
                </span>
                <span className="flex items-center gap-1 text-amber-600">
                  <Clock className="w-4 h-4" />
                  {Object.values(departmentStats).reduce((sum, s) => sum + s.pendingAssets, 0)} در انتظار
                </span>
                <span className="flex items-center gap-1 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  {Object.values(departmentStats).reduce((sum, s) => sum + s.rejectedAssets, 0)} رد
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
