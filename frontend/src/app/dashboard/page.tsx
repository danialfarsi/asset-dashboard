'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth-store';
import { Building2, Package, Clock, TrendingUp } from 'lucide-react';

interface DashboardStats {
  total_assets: number;
  active_assets: number;
  pending_assets: number;
  total_value: number;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    total_assets: 0,
    active_assets: 0,
    pending_assets: 0,
    total_value: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];
        
        if (!token) {
          console.log('No token found');
          setLoading(false);
          return;
        }

        console.log('Fetching discovery forms...');
        const response = await fetch('http://localhost:8000/api/intangible/discovery-forms/', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          console.log('API response not OK:', response.status);
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        console.log('API response:', data);
        
        const forms = data.results || [];
        
        // محاسبه آمار
        let totalAssets = 0;
        let activeAssets = 0;
        let pendingAssets = 0;
        
        forms.forEach((form: any) => {
          const strategic = form.strategic_assets?.length || 0;
          const operational = form.operational_assets?.length || 0;
          const support = form.support_assets?.length || 0;
          totalAssets += strategic + operational + support;
          
          // دارایی‌های با اولویت بالا = فعال
          const highPriority = (form.strategic_assets || []).filter((a: any) => a.priority === 'high').length;
          activeAssets += highPriority;
          
          // دارایی‌های بدون اولویت = در انتظار بررسی
          const noPriority = (form.strategic_assets || []).filter((a: any) => !a.priority || a.priority === '').length;
          pendingAssets += noPriority;
        });
        
        setStats({
          total_assets: totalAssets,
          active_assets: activeAssets,
          pending_assets: pendingAssets,
          total_value: totalAssets * 1000000, // ارزش تقریبی
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  const displayName = user?.first_name || user?.email?.split('@')[0] || 'کاربر';

  return (
    <div dir="rtl" className="space-y-8">
      {/* Header */}
      <div className="flex flex-col items-center justify-center text-center border-b pb-8">
        <div className="flex items-center gap-3 mb-2">
          <Building2 className="w-8 h-8 text-indigo-600" />
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            مدیریت دارایی‌ها
          </h1>
        </div>
        <p className="text-sm text-gray-500">
          خوش آمدید، {displayName} عزیز
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Package className="w-4 h-4" />
              کل دارایی‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? '...' : stats.total_assets}
            </div>
            <p className="text-xs text-gray-400 mt-1">دارایی نامشهود</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              دارایی‌های فعال
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? '...' : stats.active_assets}
            </div>
            <p className="text-xs text-gray-400 mt-1">با اولویت بالا</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-600" />
              در انتظار بررسی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {loading ? '...' : stats.pending_assets}
            </div>
            <p className="text-xs text-gray-400 mt-1">بدون اولویت</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              ارزش کل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {loading ? '...' : `${(stats.total_value / 1000000).toFixed(1)} میلیون`}
            </div>
            <p className="text-xs text-gray-400 mt-1">ریال</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Debug info (remove later) */}
      {!loading && (
        <div className="text-xs text-gray-400 text-center border-t pt-4">
          {stats.total_assets} دارایی یافت شد
        </div>
      )}
    </div>
  );
}
