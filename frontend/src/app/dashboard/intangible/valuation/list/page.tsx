'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import { fetchAllScreenedAssets, fetchAllValuations } from '@/lib/api-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';
import { PageTransition } from '@/components/ui/page-transition';
import { 
  Package, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Building2,
  Building,
  User,
  Calendar,
  Search,
  Award,
  Eye,
  Filter,
  X,
  RefreshCw
} from 'lucide-react';

interface Asset {
  id: number;
  asset_name: string;
  asset_uid: string;
  category: string;
  result: string;
  created_at: string;
  created_by_name: string;
  organization_name: string;
  department_name: string;
  description: string;
}

interface ValuationStatus {
  has_valuation: boolean;
  valuation_id: number | null;
  status: string | null;
  final_score: number | null;
  is_completed: boolean;
  is_in_progress: boolean;
}

type FilterType = 'all' | 'not_started' | 'in_progress' | 'completed';

export default function ValuationListPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [valuationStatus, setValuationStatus] = useState<Record<number, ValuationStatus>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      
      console.log('📥 دریافت همه دارایی‌های غربالگری شده...');
      
      // 🔥 دریافت همه دارایی‌ها با Pagination کامل
      const allAssets = await fetchAllScreenedAssets();
      
      // فقط دارایی‌های قطعی (confirmed) قابل ارزیابی هستند
      const confirmedAssets = allAssets.filter((a: any) => a.result === 'confirmed');
      setAssets(confirmedAssets);
      setTotalCount(confirmedAssets.length);
      console.log(`✅ ${confirmedAssets.length} دارایی قابل ارزیابی دریافت شد`);
      
      // 🔥 دریافت همه ارزیابی‌ها با Pagination کامل
      console.log('📥 دریافت همه ارزیابی‌ها...');
      const allValuations = await fetchAllValuations();
      console.log(`✅ ${allValuations.length} ارزیابی دریافت شد`);
      
      // بررسی وضعیت ارزیابی هر دارایی
      const statusMap: Record<number, ValuationStatus> = {};
      
      for (const asset of confirmedAssets) {
        // پیدا کردن ارزیابی‌های این دارایی
        const assetValuations = allValuations.filter((v: any) => v.asset === asset.id);
        
        if (assetValuations.length === 0) {
          statusMap[asset.id] = {
            has_valuation: false,
            valuation_id: null,
            status: null,
            final_score: null,
            is_completed: false,
            is_in_progress: false,
          };
        } else {
          // پیدا کردن ارزیابی تکمیل شده
          const completed = assetValuations.find((v: any) => v.status === 'completed');
          const inProgress = assetValuations.some((v: any) => v.status === 'draft' || v.status === 'in_progress');
          
          statusMap[asset.id] = {
            has_valuation: true,
            valuation_id: assetValuations[assetValuations.length - 1].id,
            status: assetValuations[assetValuations.length - 1].status,
            final_score: completed?.final_score || null,
            is_completed: !!completed,
            is_in_progress: inProgress && !completed,
          };
        }
      }
      
      setValuationStatus(statusMap);
      
    } catch (error) {
      console.error('❌ Error fetching assets:', error);
    } finally {
      if (showRefresh) setRefreshing(false);
      else setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAssets(true);
  };

  const getResultBadge = (result: string) => {
    const colors = {
      confirmed: 'bg-emerald-100 text-emerald-800',
      conditional: 'bg-amber-100 text-amber-800',
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
    } catch { return dateString; }
  };

  const getStatusBadge = (status: ValuationStatus) => {
    if (status.is_completed) {
      return (
        <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
          <Award className="w-3 h-3" />
          ارزیابی شده
        </span>
      );
    }
    if (status.has_valuation && status.is_in_progress) {
      return (
        <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
          <Clock className="w-3 h-3" />
          در حال انجام
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
        <Clock className="w-3 h-3" />
        ارزیابی نشده
      </span>
    );
  };

  // فیلتر کردن دارایی‌ها بر اساس وضعیت
  const getFilteredAssets = () => {
    let filtered = assets;
    
    // فیلتر بر اساس جستجو
    if (searchTerm) {
      filtered = filtered.filter(asset =>
        asset.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.asset_uid.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.organization_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // فیلتر بر اساس وضعیت
    if (filter !== 'all') {
      filtered = filtered.filter(asset => {
        const status = valuationStatus[asset.id];
        if (!status) return filter === 'not_started';
        
        if (filter === 'not_started') {
          return !status.has_valuation;
        }
        if (filter === 'in_progress') {
          return status.has_valuation && status.is_in_progress && !status.is_completed;
        }
        if (filter === 'completed') {
          return status.is_completed;
        }
        return true;
      });
    }
    
    return filtered;
  };

  const filteredAssets = getFilteredAssets();

  // آمار برای نمایش روی فیلترها
  const getFilterCounts = () => {
    let notStarted = 0;
    let inProgress = 0;
    let completed = 0;
    
    for (const asset of assets) {
      const status = valuationStatus[asset.id];
      if (!status || !status.has_valuation) {
        notStarted++;
      } else if (status.is_completed) {
        completed++;
      } else if (status.is_in_progress) {
        inProgress++;
      }
    }
    
    return { notStarted, inProgress, completed, total: assets.length };
  };

  const counts = getFilterCounts();

  const filterOptions = [
    { value: 'all', label: 'همه', icon: null, count: counts.total },
    { value: 'not_started', label: 'ارزیابی نشده', icon: Clock, count: counts.notStarted, color: 'text-gray-500' },
    { value: 'in_progress', label: 'در حال انجام', icon: Clock, count: counts.inProgress, color: 'text-amber-600' },
    { value: 'completed', label: 'ارزیابی شده', icon: CheckCircle, count: counts.completed, color: 'text-emerald-600' },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <SkeletonLoader variant="list" count={6} />
      </div>
    );
  }

  return (
    <PageTransition className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-green">ارزیابی دارایی‌ها</h1>
          <p className="text-sm text-gray-500">
            {totalCount} دارایی قابل ارزیابی
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'در حال به‌روزرسانی...' : 'به‌روزرسانی'}
          </Button>
        </div>
      </div>

      {/* جستجو */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="جستجو در دارایی‌ها..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pr-10 pl-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-green"
        />
      </div>

      {/* نوار فیلتر */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
        <div className="flex items-center gap-1 text-sm text-gray-500 ml-2">
          <Filter className="w-4 h-4" />
          <span>فیلتر:</span>
        </div>
        {filterOptions.map((option) => {
          const isActive = filter === option.value;
          const Icon = option.icon;
          return (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all
                ${isActive 
                  ? 'bg-dark-green text-white shadow-sm' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }
              `}
            >
              {Icon && <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : option.color}`} />}
              <span>{option.label}</span>
              <span className={`
                text-xs px-1.5 py-0.5 rounded-full
                ${isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'}
              `}>
                {option.count}
              </span>
            </button>
          );
        })}
        {filter !== 'all' && (
          <button
            onClick={() => setFilter('all')}
            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {filteredAssets.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">هیچ دارایی با این فیلتر یافت نشد</p>
          <p className="text-sm mt-1">سعی کنید فیلتر یا جستجو را تغییر دهید</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAssets.map((asset) => {
              const status = valuationStatus[asset.id] || { 
                has_valuation: false, 
                valuation_id: null, 
                status: null, 
                final_score: null,
                is_completed: false,
                is_in_progress: false
              };
              const isCompleted = status.is_completed;
              const hasValuation = status.has_valuation;

              return (
                <Card key={asset.id} className="hover:shadow-lg transition-all hover:-translate-y-1 border-0 shadow-sm">
                  <CardContent className="p-5 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{asset.asset_name}</p>
                        <p className="text-xs text-gray-400">{asset.asset_uid}</p>
                      </div>
                      {getResultBadge(asset.result)}
                    </div>

                    {/* اطلاعات */}
                    <div className="space-y-1 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                          {getCategoryLabel(asset.category)}
                        </span>
                      </div>
                      {asset.organization_name && (
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          <span>{asset.organization_name}</span>
                        </div>
                      )}
                      {asset.department_name && (
                        <div className="flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          <span>{asset.department_name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{asset.created_by_name || 'نامشخص'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(asset.created_at)}</span>
                      </div>
                    </div>

                    {/* وضعیت ارزیابی و دکمه */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(status)}
                        {status.final_score !== null && (
                          <span className="text-sm font-bold text-dark-green">
                            {status.final_score.toFixed(2)}
                          </span>
                        )}
                      </div>
                      
                      {isCompleted ? (
                        <Link href={`/dashboard/intangible/valuation/${asset.id}`}>
                          <Button size="sm" className="bg-dark-green hover:bg-dark-green/90 flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            مشاهده ارزیابی
                          </Button>
                        </Link>
                      ) : hasValuation ? (
                        <Link href={`/dashboard/intangible/valuation/${asset.id}`}>
                          <Button size="sm" variant="outline" className="flex items-center gap-1 border-amber-400 text-amber-600 hover:bg-amber-50">
                            <Clock className="w-4 h-4" />
                            ادامه ارزیابی
                          </Button>
                        </Link>
                      ) : (
                        <Link href={`/dashboard/intangible/valuation/${asset.id}`}>
                          <Button size="sm" className="bg-dark-green hover:bg-dark-green/90 flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            شروع ارزیابی
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {/* نمایش تعداد کل */}
          {totalCount > 0 && (
            <div className="text-center text-sm text-gray-400 border-t pt-4">
              نمایش {filteredAssets.length} از {totalCount} دارایی
              {searchTerm && ` (فیلتر شده)`}
            </div>
          )}
        </>
      )}
    </PageTransition>
  );
}
