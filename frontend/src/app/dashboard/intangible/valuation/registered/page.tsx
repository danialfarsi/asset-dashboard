'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import { fetchAllValuations, fetchAllScreenedAssets } from '@/lib/api-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';
import { PageTransition } from '@/components/ui/page-transition';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Building2,
  User,
  Calendar,
  Search,
  Award,
  Eye,
  Filter,
  X,
  RefreshCw,
  FileCheck,
  Lock,
  Database,
  Printer,
  Download,
  Coins,
  DollarSign
} from 'lucide-react';

const toPersianNumber = (num: number | string): string => {
  if (num === undefined || num === null) return '۰';
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  const str = String(num);
  return str.replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};

const formatCurrency = (value: number) => {
  if (!value) return '۰';
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  const formatted = Math.round(value).toLocaleString();
  return formatted.replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};

const calculateTokenValue = (valueInRial: number): number => {
  if (!valueInRial) return 0;
  const TOKEN_VALUE_IN_RIAL = 1000000;
  return Math.round(valueInRial / TOKEN_VALUE_IN_RIAL);
};

interface RegisteredAsset {
  id: number;
  asset_name: string;
  asset_uid: string;
  category: string;
  result: string;
  description: string;
  created_at: string;
  created_by_name: string;
  organization_name: string;
  department_name: string;
  valuation_case_id: number;
  valuation_method: string;
  final_value: number;
  token_value?: number;
  confidence_level: number;
  qc_score: number;
  certificate_no: string;
  effective_date: string;
  case_status: string;
  is_registered: boolean;
}

type FilterType = 'all' | 'registered' | 'completed' | 'pending';

export default function RegisteredValuationsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assets, setAssets] = useState<RegisteredAsset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<RegisteredAsset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      // 🔥 دریافت همزمان داده‌ها با Promise.all
      const [allAssets, allValuations, casesData, step4Data] = await Promise.all([
        fetchAllScreenedAssets(),
        fetchAllValuations(),
        api.get('/intangible/valuation-cases/').then(res => res.data),
        api.get('/intangible/valuation-step4/').then(res => res.data),
      ]);

      const allCases = casesData.results || casesData || [];
      const allStep4 = step4Data.results || step4Data || [];

      // 🔥 ساخت Map برای STEP 4
      const step4Map = new Map();
      allStep4.forEach((step4: any) => {
        step4Map.set(step4.valuation_case, step4);
      });

      const registered: RegisteredAsset[] = [];

      for (const asset of allAssets) {
        const assetCase = allCases.find((c: any) => c.asset === asset.id);
        if (!assetCase) continue;

        const valuation = allValuations.find((v: any) => 
          v.asset === asset.id && v.status === 'completed'
        );
        if (!valuation) continue;

        const isRegistered = assetCase.case_status === 'REGISTERED' || 
                           assetCase.certificate_no !== undefined;

        const step4 = step4Map.get(assetCase.id);
        let finalValue = 0;
        let confidenceLevel = 0;
        let qcScore = 0;
        let tokenValue = 0;

        if (step4) {
          finalValue = step4.final_value || 0;
          confidenceLevel = step4.confidence_level || 0;
          qcScore = step4.qc_score || 0;
          tokenValue = step4.token_value || calculateTokenValue(finalValue);
        }

        // 🔥 فقط دارایی‌هایی که ارزش نهایی > ۰ دارند یا ثبت شده‌اند
        if (finalValue === 0 && !isRegistered) continue;
        if (finalValue === 0 && qcScore === 0 && !isRegistered) continue;

        registered.push({
          id: asset.id,
          asset_name: asset.asset_name,
          asset_uid: asset.asset_uid,
          category: asset.category || 'unknown',
          result: asset.result || 'confirmed',
          description: asset.description || '',
          created_at: asset.created_at,
          created_by_name: asset.created_by_name || 'نامشخص',
          organization_name: asset.organization_name || 'نامشخص',
          department_name: asset.department_name || 'نامشخص',
          valuation_case_id: assetCase.id,
          valuation_method: asset.valuation_method || assetCase.method_id || 'M-01',
          final_value: finalValue,
          token_value: tokenValue,
          confidence_level: confidenceLevel,
          qc_score: qcScore,
          certificate_no: assetCase.certificate_no || `VAL-${String(assetCase.id).padStart(5, '0')}`,
          effective_date: assetCase.effective_date || assetCase.updated_at || asset.created_at,
          case_status: assetCase.case_status || (isRegistered ? 'REGISTERED' : 'COMPLETED'),
          is_registered: isRegistered,
        });
      }

      registered.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setAssets(registered);
      setTotalCount(registered.length);
      applyFilters(registered, searchTerm, filter);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      if (showRefresh) setRefreshing(false);
      else setLoading(false);
    }
  };

  const applyFilters = (
    data: RegisteredAsset[], 
    term: string, 
    filterType: FilterType
  ) => {
    let filtered = [...data];

    if (term) {
      const lowerTerm = term.toLowerCase();
      filtered = filtered.filter(asset =>
        asset.asset_name.toLowerCase().includes(lowerTerm) ||
        asset.asset_uid.toLowerCase().includes(lowerTerm) ||
        asset.organization_name.toLowerCase().includes(lowerTerm)
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(asset => {
        if (filterType === 'registered') return asset.is_registered;
        if (filterType === 'completed') return !asset.is_registered && asset.case_status === 'COMPLETED' && asset.final_value > 0;
        if (filterType === 'pending') return asset.case_status === 'PENDING_FINAL_APPROVAL';
        return true;
      });
    }

    setFilteredAssets(filtered);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    applyFilters(assets, term, filter);
  };

  const handleFilter = (type: FilterType) => {
    setFilter(type);
    applyFilters(assets, searchTerm, type);
  };

  const handleRefresh = () => {
    fetchData(true);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch { return dateString; }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'REGISTERED') {
      return <Badge className="bg-green-100 text-green-700 border-green-300 font-[family-name:var(--font-vazir)]">✅ ثبت شده</Badge>;
    }
    if (status === 'COMPLETED') {
      return <Badge className="bg-blue-100 text-blue-700 border-blue-300 font-[family-name:var(--font-vazir)]">📋 تکمیل شده</Badge>;
    }
    if (status === 'PENDING_FINAL_APPROVAL') {
      return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 font-[family-name:var(--font-vazir)]">⏳ در انتظار تأیید</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-500 font-[family-name:var(--font-vazir)]">{status}</Badge>;
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      'M-01': 'RfR',
      'M-02': 'MEEM',
      'M-03': 'DCF',
      'M-04': 'WWM',
      'M-05': 'RCM',
      'M-06': 'RPCM',
      'M-07': 'TWC',
      'M-08': 'CTM',
      'M-09': 'MMM',
    };
    return labels[method] || method;
  };

  if (loading) {
    return (
      <div className="p-6">
        <SkeletonLoader variant="list" count={6} />
      </div>
    );
  }

  const filterOptions = [
    { value: 'all', label: 'همه', count: assets.filter(a => a.final_value > 0 || a.is_registered).length },
    { value: 'registered', label: 'ثبت شده', count: assets.filter(a => a.is_registered).length },
    { value: 'completed', label: 'تکمیل شده', count: assets.filter(a => !a.is_registered && a.case_status === 'COMPLETED' && a.final_value > 0).length },
    { value: 'pending', label: 'در انتظار تأیید', count: assets.filter(a => a.case_status === 'PENDING_FINAL_APPROVAL' && a.final_value > 0).length },
  ];

  return (
    <PageTransition className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-green flex items-center gap-2 font-[family-name:var(--font-vazir)]">
            <Database className="w-6 h-6" />
            دارایی‌های ارزش‌گذاری شده
          </h1>
          <p className="text-sm text-gray-500 font-[family-name:var(--font-vazir)]">
            {toPersianNumber(totalCount)} دارایی ارزش‌گذاری شده در سیستم
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 font-[family-name:var(--font-vazir)]"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'در حال به‌روزرسانی...' : 'به‌روزرسانی'}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="جستجو در دارایی‌ها..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pr-10 pl-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-green font-[family-name:var(--font-vazir)]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-sm text-gray-500 ml-2 font-[family-name:var(--font-vazir)]">
            <Filter className="w-4 h-4" />
            <span>فیلتر:</span>
          </div>
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleFilter(option.value as FilterType)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all font-[family-name:var(--font-vazir)]
                ${filter === option.value 
                  ? 'bg-dark-green text-white shadow-sm' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }
              `}
            >
              <span>{option.label}</span>
              <span className={`
                text-xs px-1.5 py-0.5 rounded-full font-[family-name:var(--font-vazir)]
                ${filter === option.value ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'}
              `}>
                {toPersianNumber(option.count)}
              </span>
            </button>
          ))}
          {filter !== 'all' && (
            <button
              onClick={() => handleFilter('all')}
              className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors text-gray-400"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {filteredAssets.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium font-[family-name:var(--font-vazir)]">هیچ دارایی ارزش‌گذاری شده‌ای یافت نشد</p>
          <p className="text-sm mt-1 font-[family-name:var(--font-vazir)]">سعی کنید فیلتر یا جستجو را تغییر دهید</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => {
            const displayToken = (asset.token_value && asset.token_value > 0) 
              ? asset.token_value 
              : calculateTokenValue(asset.final_value);
            
            return (
              <Card 
                key={asset.id} 
                className="hover:shadow-xl transition-all hover:-translate-y-1 border-0 shadow-md overflow-hidden bg-gradient-to-br from-white to-gray-50/50"
              >
                <div className="h-1 bg-dark-green" />
                
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate font-[family-name:var(--font-vazir)] text-base">{asset.asset_name}</p>
                      <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">{asset.asset_uid}</p>
                    </div>
                    {getStatusBadge(asset.case_status)}
                  </div>

                  <div className="text-center py-2">
                    <div className="inline-block bg-gradient-to-br from-dark-green/5 to-dark-green/10 px-6 py-3 rounded-2xl border border-dark-green/10">
                      <p className="text-xs text-gray-500 font-[family-name:var(--font-vazir)]">ارزش نهایی</p>
                      <p className="text-xl font-bold text-dark-green font-[family-name:var(--font-vazir)]">
                        {formatCurrency(asset.final_value)}
                      </p>
                      <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">ریال</p>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="inline-block bg-gradient-to-br from-amber-50 to-amber-100/30 px-6 py-2 rounded-2xl border border-amber-200/50">
                      <p className="text-[10px] text-gray-500 font-[family-name:var(--font-vazir)]">ارزش بر حسب تک توکن</p>
                      <p className="text-lg font-bold text-amber-700 font-[family-name:var(--font-vazir)]">
                        {formatCurrency(displayToken)}
                      </p>
                      <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">تک توکن</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <p className="text-[9px] text-gray-400 font-[family-name:var(--font-vazir)]">روش</p>
                      <p className="text-xs font-bold text-dark-green font-[family-name:var(--font-vazir)]">
                        {getMethodLabel(asset.valuation_method)}
                      </p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <p className="text-[9px] text-gray-400 font-[family-name:var(--font-vazir)]">QC</p>
                      <p className="text-xs font-bold text-blue-600 font-[family-name:var(--font-vazir)]">
                        {toPersianNumber(asset.qc_score)}
                      </p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <p className="text-[9px] text-gray-400 font-[family-name:var(--font-vazir)]">گواهی</p>
                      <p className="text-[9px] font-mono text-gray-600 truncate font-[family-name:var(--font-vazir)]">
                        {asset.certificate_no}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 border-t pt-2">
                    <Calendar className="w-3 h-3" />
                    <span className="font-[family-name:var(--font-vazir)]">{formatDate(asset.effective_date)}</span>
                    <span className="mx-1">•</span>
                    <span className="font-[family-name:var(--font-vazir)]">{asset.organization_name}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Link href={`/dashboard/intangible/assets/${asset.id}`} className="flex-1">
                      <Button 
                        size="sm" 
                        className="w-full bg-dark-green hover:bg-dark-green/90 flex items-center gap-1 font-[family-name:var(--font-vazir)] shadow-sm"
                      >
                        <Eye className="w-4 h-4" />
                        مشاهده جزئیات
                      </Button>
                    </Link>
                    {asset.is_registered && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex items-center gap-1 font-[family-name:var(--font-vazir)] border-gray-300"
                        onClick={() => window.print()}
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {totalCount > 0 && (
        <div className="text-center text-sm text-gray-400 border-t pt-4 font-[family-name:var(--font-vazir)]">
          نمایش {toPersianNumber(filteredAssets.length)} از {toPersianNumber(totalCount)} دارایی
          {searchTerm && ` (فیلتر شده)`}
        </div>
      )}
    </PageTransition>
  );
}
