'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageTransition } from '@/components/ui/page-transition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Loader2, 
  RefreshCw, 
  Key, 
  Users, 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  User,
  Package,
  Eye,
  ExternalLink,
  BarChart3,
  PieChart,
  Zap,
  Server,
  Shield,
  Database,
  Globe,
  Smartphone,
  Laptop,
  ChevronRight
} from 'lucide-react';

interface APIStats {
  summary: {
    total_requests: number;
    total_users: number;
    total_assets: number;
    active_keys: number;
    avg_response_time: number;
  };
  periods: {
    '24h': { requests: number; users: number; assets: number };
    '7d': { requests: number; users: number; assets: number };
    '30d': { requests: number; users: number; assets: number };
  };
  status_breakdown: {
    success: number;
    failed: number;
    error: number;
  };
  daily_stats: Array<{ date: string; total: number; success: number; failed: number; error: number }>;
}

interface ExternalUser {
  id: number;
  user_id: string;
  source: string;
  email: string;
  session_id: string;
  ip_address: string;
  total_requests: number;
  last_seen: string;
  is_active: boolean;
  assets_count?: number;
}

interface ExternalAsset {
  id: number;
  asset_name: string;
  external_user_id: string;
  created_at: string;
  result: string;
  email?: string;
}

export default function APIDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<APIStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [externalUsers, setExternalUsers] = useState<ExternalUser[]>([]);
  const [externalAssets, setExternalAssets] = useState<ExternalAsset[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'assets' | 'logs'>('overview');

  const checkAuth = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return false;
    }
    return true;
  };

  const fetchData = async () => {
    if (!checkAuth()) return;
    
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      const headers: any = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      // دریافت آمار
      const statsResponse = await fetch('http://localhost:8000/api/intangible/api-stats/', { headers });
      if (statsResponse.status === 401) {
        localStorage.removeItem('access_token');
        router.push('/login');
        return;
      }
      if (!statsResponse.ok) {
        throw new Error(`خطا در دریافت آمار: ${statsResponse.status}`);
      }
      const statsData = await statsResponse.json();
      setStats(statsData);

      // دریافت کلیدهای API
      try {
        const keysResponse = await fetch('http://localhost:8000/api/intangible/api-keys/', { headers });
        if (keysResponse.ok) {
          const keysData = await keysResponse.json();
          setKeys(keysData.results || []);
        }
      } catch (e) {}

      // دریافت کاربران خارجی
      try {
        const usersResponse = await fetch('http://localhost:8000/api/intangible/external-users/', { headers });
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          setExternalUsers(usersData.results || usersData || []);
        }
      } catch (e) {}

      // دریافت دارایی‌های خارجی
      try {
        const assetsResponse = await fetch('http://localhost:8000/api/intangible/screened-assets/?source_type=external', { headers });
        if (assetsResponse.ok) {
          const assetsData = await assetsResponse.json();
          setExternalAssets(assetsData.results || assetsData || []);
        }
      } catch (e) {}

    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.message || 'خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!checkAuth()) return;
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      confirmed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      conditional: 'bg-amber-100 text-amber-800 border-amber-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      error: 'bg-red-100 text-red-800 border-red-200',
      failed: 'bg-rose-100 text-rose-800 border-rose-200',
    };
    const labels: Record<string, string> = {
      success: 'موفق',
      confirmed: 'قطعی',
      conditional: 'مشروط',
      rejected: 'رد',
      error: 'خطا',
      failed: 'ناموفق',
    };
    return (
      <Badge variant="outline" className={`${colors[status] || 'bg-gray-100 text-gray-800'} border`}>
        {labels[status] || status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch { return dateString; }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-dark-green" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchData} className="mt-4">تلاش مجدد</Button>
        </div>
      </div>
    );
  }

  return (
    <PageTransition className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-dark-green">📊 پنل مدیریت API</h1>
          <p className="text-sm text-gray-500">مانیتورینگ و مدیریت APIهای خارجی</p>
        </div>
        <Button onClick={fetchData} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          به‌روزرسانی
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'overview'
              ? 'border-dark-green text-dark-green'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <BarChart3 className="w-4 h-4 inline ml-1" />
          نمای کلی
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'users'
              ? 'border-dark-green text-dark-green'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4 inline ml-1" />
          کاربران خارجی
          <Badge className="mr-2 bg-blue-100 text-blue-700">{externalUsers.length}</Badge>
        </button>
        <button
          onClick={() => setActiveTab('assets')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'assets'
              ? 'border-dark-green text-dark-green'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Package className="w-4 h-4 inline ml-1" />
          دارایی‌های خارجی
          <Badge className="mr-2 bg-emerald-100 text-emerald-700">{externalAssets.length}</Badge>
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'logs'
              ? 'border-dark-green text-dark-green'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Activity className="w-4 h-4 inline ml-1" />
          لاگ‌ها
        </button>
      </div>

      {/* ============================================================ */}
      {/* TAB: OVERVIEW */}
      {/* ============================================================ */}
      {activeTab === 'overview' && stats && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">کل درخواست‌ها</p>
                    <p className="text-2xl font-bold text-dark-green">{stats.summary.total_requests}</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Activity className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">کاربران خارجی</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.summary.total_users}</p>
                  </div>
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Users className="w-5 h-5 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">دارایی‌های خارجی</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.summary.total_assets}</p>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <Package className="w-5 h-5 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">کلیدهای فعال</p>
                    <p className="text-2xl font-bold text-amber-600">{stats.summary.active_keys}</p>
                  </div>
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <Key className="w-5 h-5 text-amber-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">میانگین زمان پاسخ</p>
                    <p className="text-2xl font-bold text-purple-600">{Math.round(stats.summary.avg_response_time)}ms</p>
                  </div>
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Zap className="w-5 h-5 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Period Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="border-2 border-blue-100 bg-blue-50/30">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <p className="text-xs text-gray-500">۲۴ ساعت اخیر</p>
                </div>
                <p className="text-2xl font-bold text-blue-600">{stats.periods['24h'].requests}</p>
                <p className="text-xs text-gray-400">{stats.periods['24h'].users} کاربر · {stats.periods['24h'].assets} دارایی</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-emerald-100 bg-emerald-50/30">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  <p className="text-xs text-gray-500">۷ روز اخیر</p>
                </div>
                <p className="text-2xl font-bold text-emerald-600">{stats.periods['7d'].requests}</p>
                <p className="text-xs text-gray-400">{stats.periods['7d'].users} کاربر · {stats.periods['7d'].assets} دارایی</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-amber-100 bg-amber-50/30">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  <p className="text-xs text-gray-500">۳۰ روز اخیر</p>
                </div>
                <p className="text-2xl font-bold text-amber-600">{stats.periods['30d'].requests}</p>
                <p className="text-xs text-gray-400">{stats.periods['30d'].users} کاربر · {stats.periods['30d'].assets} دارایی</p>
              </CardContent>
            </Card>
          </div>

          {/* Status Breakdown */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="border-l-4 border-l-emerald-500 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-medium">موفق</span>
                </div>
                <span className="text-xl font-bold text-emerald-600">{stats.status_breakdown.success}</span>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  <span className="text-sm font-medium">ناموفق</span>
                </div>
                <span className="text-xl font-bold text-amber-600">{stats.status_breakdown.failed}</span>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-500 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-medium">خطا</span>
                </div>
                <span className="text-xl font-bold text-red-600">{stats.status_breakdown.error}</span>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB: USERS */}
      {/* ============================================================ */}
      {activeTab === 'users' && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              کاربران خارجی
              <Badge className="bg-blue-100 text-blue-700">{externalUsers.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {externalUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>شناسه</TableHead>
                      <TableHead>ایمیل</TableHead>
                      <TableHead>منبع</TableHead>
                      <TableHead>درخواست‌ها</TableHead>
                      <TableHead>آخرین فعالیت</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {externalUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-gray-50">
                        <TableCell className="font-mono text-xs">{user.user_id?.slice(0, 8)}...</TableCell>
                        <TableCell>{user.email || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-gray-50">
                            {user.source || 'نامشخص'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-dark-green">{user.total_requests || 0}</span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">{formatDate(user.last_seen)}</TableCell>
                        <TableCell>
                          {user.is_active ? (
                            <Badge className="bg-green-100 text-green-700">فعال</Badge>
                          ) : (
                            <Badge variant="destructive">غیرفعال</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">هیچ کاربر خارجی یافت نشد</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ============================================================ */}
      {/* TAB: ASSETS */}
      {/* ============================================================ */}
      {activeTab === 'assets' && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              دارایی‌های خارجی
              <Badge className="bg-emerald-100 text-emerald-700">{externalAssets.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {externalAssets.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>نام دارایی</TableHead>
                      <TableHead>شناسه کاربر</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>تاریخ ثبت</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {externalAssets.map((asset) => (
                      <TableRow key={asset.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{asset.asset_name}</TableCell>
                        <TableCell className="font-mono text-xs">{asset.external_user_id?.slice(0, 8)}...</TableCell>
                        <TableCell>{getStatusBadge(asset.result)}</TableCell>
                        <TableCell className="text-sm text-gray-500">{formatDate(asset.created_at)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">هیچ دارایی خارجی یافت نشد</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ============================================================ */}
      {/* TAB: LOGS */}
      {/* ============================================================ */}
      {activeTab === 'logs' && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              لاگ‌های درخواست
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-500 py-8">
              📋 برای مشاهده لاگ‌های کامل، از بخش ادمین Django استفاده کنید
            </p>
          </CardContent>
        </Card>
      )}
    </PageTransition>
  );
}
