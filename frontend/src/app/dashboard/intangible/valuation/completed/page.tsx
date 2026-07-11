'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import { fetchAllValuations } from '@/lib/api-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';
import { PageTransition } from '@/components/ui/page-transition';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { 
  Award, 
  Search,
  Eye,
  BarChart3,
  RefreshCw,
  Hash
} from 'lucide-react';

interface ValuationSummary {
  id: number;
  asset: string;
  asset_id: number;
  asset_uid: string;
  status: string;
  final_score: number;
  weighted_score: number;
  strategic_score: number;
  technical_score: number;
  operational_score: number;
  market_score: number;
  risk_score: number;
  total_questions: number;
  answered_questions: number;
  rank?: number;
}

export default function CompletedValuationsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [valuations, setValuations] = useState<ValuationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingRevaluate, setPendingRevaluate] = useState<{ assetId: number; assetName: string } | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchValuations();
  }, []);

  const fetchValuations = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      
      console.log('📥 دریافت همه دارایی‌های ارزیابی شده...');
      
      const allValuations = await fetchAllValuations('completed');
      console.log(`📋 ${allValuations.length} ارزیابی کامل دریافت شد`);
      
      // 🔥 گروه‌بندی بر اساس asset_id و انتخاب آخرین ارزیابی هر دارایی
      const latestByAsset = new Map();
      
      for (const val of allValuations) {
        const assetId = val.asset;
        const existing = latestByAsset.get(assetId);
        
        // اگر قبلاً این دارایی رو نداشتیم، اضافه کن
        if (!existing) {
          latestByAsset.set(assetId, val);
        } else {
          // اگر ارزیابی جدیدتر است، جایگزین کن
          if (new Date(val.evaluated_at) > new Date(existing.evaluated_at)) {
            latestByAsset.set(assetId, val);
          }
        }
      }
      
      // تبدیل به آرایه
      const latestValuations = Array.from(latestByAsset.values());
      console.log(`✅ ${latestValuations.length} آخرین ارزیابی هر دارایی انتخاب شد`);
      
      const summaries = await Promise.all(
        latestValuations.map(async (val: any) => {
          try {
            const { data: summary } = await api.get(`/intangible/asset-valuations/${val.id}/summary/`);
            return { 
              ...summary, 
              id: val.id, 
              asset_id: val.asset,
              weighted_score: summary.weighted_score || summary.final_score
            };
          } catch (e) {
            return null;
          }
        })
      );
      
      const sorted = summaries
        .filter(s => s !== null)
        .sort((a, b) => (b?.weighted_score || 0) - (a?.weighted_score || 0));
      
      const ranked = sorted.map((item, index) => ({
        ...item,
        rank: index + 1
      }));
      
      setValuations(ranked);
      console.log(`✅ ${ranked.length} دارایی ارزیابی شده نمایش داده شد`);
      
    } catch (error) {
      console.error('❌ Error fetching completed valuations:', error);
    } finally {
      if (showRefresh) setRefreshing(false);
      else setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchValuations(true);
  };

  const handleRevaluateClick = (assetId: number, assetName: string) => {
    if (!assetId) {
      alert('خطا: شناسه دارایی یافت نشد');
      return;
    }
    setPendingRevaluate({ assetId, assetName });
    setShowConfirmModal(true);
  };

  const handleConfirmRevaluate = async () => {
    if (!pendingRevaluate) return;

    setModalLoading(true);
    try {
      const { assetId } = pendingRevaluate;
      
      console.log('🔄 شروع ارزیابی مجدد برای assetId:', assetId);
      
      const { data: assetData } = await api.get(`/intangible/screened-assets/${assetId}/`);
      const assetTypeId = assetData.asset_type?.id || 1;
      
      const response = await api.post('/intangible/asset-valuations/', {
        asset: assetId,
        asset_type: assetTypeId,
        status: 'draft'
      });
      
      console.log('✅ ارزیابی جدید ایجاد شد:', response.data.id);
      
      setShowConfirmModal(false);
      setPendingRevaluate(null);
      
      router.push(`/dashboard/intangible/valuation/${assetId}?new=true`);
      
    } catch (error: any) {
      console.error('❌ Error revaluating:', error);
      alert(error.response?.data?.detail || '❌ خطا در شروع ارزیابی مجدد');
    } finally {
      setModalLoading(false);
    }
  };

  const getDisplayScore = (val: ValuationSummary) => {
    return val.weighted_score || val.final_score;
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-emerald-600';
    if (score >= 3) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 4) return 'bg-emerald-50 border-emerald-200';
    if (score >= 3) return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 4) return 'عالی';
    if (score >= 3) return 'خوب';
    if (score >= 2) return 'قابل قبول';
    return 'ضعیف';
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 4) return '🌟🌟';
    if (score >= 3) return '👍';
    if (score >= 2) return '📊';
    return '⚠️';
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (rank === 2) return 'text-gray-600 bg-gray-50 border-gray-200';
    if (rank === 3) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-blue-600 bg-blue-50 border-blue-200';
  };

  const filteredValuations = valuations.filter(v =>
    v.asset?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.asset_uid?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold text-dark-green">دارایی‌های ارزیابی شده</h1>
          <p className="text-sm text-gray-500">
            {valuations.length} دارایی ارزیابی شده
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

      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="جستجو در دارایی‌های ارزیابی شده..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pr-10 pl-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-dark-green"
        />
      </div>

      {filteredValuations.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Award className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">هیچ دارایی ارزیابی شده‌ای یافت نشد</p>
          <p className="text-sm mt-1">ابتدا دارایی‌ها را ارزیابی کنید</p>
          <Link href="/dashboard/intangible/valuation/list">
            <Button className="mt-4 bg-dark-green hover:bg-dark-green/90">
              رفتن به ارزیابی دارایی‌ها
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredValuations.map((val) => {
              const displayScore = getDisplayScore(val);
              const rankColor = getRankColor(val.rank || 0);
              
              return (
                <Card key={val.id} className="hover:shadow-lg transition-all hover:-translate-y-1 border-0 shadow-sm overflow-hidden relative">
                  <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-sm border ${rankColor} z-10`}>
                    <Hash className="w-3 h-3" />
                    <span className="text-xs font-bold">{val.rank}</span>
                  </div>

                  <CardContent className="p-5 space-y-3 pt-12">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{val.asset || 'نامشخص'}</p>
                        <p className="text-xs text-gray-400">{val.asset_uid || 'بدون کد'}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getScoreBg(displayScore)}`}>
                        {getScoreEmoji(displayScore)} {getScoreLabel(displayScore)}
                      </div>
                    </div>

                    <div className="text-center py-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">امتیاز نهایی</p>
                      <p className={`text-3xl font-bold ${getScoreColor(displayScore)}`}>
                        {displayScore?.toFixed(2) || '0.00'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">از ۵ (وزنی)</p>
                    </div>

                    <div className="grid grid-cols-5 gap-1 text-center">
                      <div className="p-1 bg-blue-50 rounded">
                        <p className="text-[10px] text-gray-500">استراتژیک</p>
                        <p className="text-xs font-bold text-blue-600">{val.strategic_score?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div className="p-1 bg-purple-50 rounded">
                        <p className="text-[10px] text-gray-500">فنی</p>
                        <p className="text-xs font-bold text-purple-600">{val.technical_score?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div className="p-1 bg-amber-50 rounded">
                        <p className="text-[10px] text-gray-500">عملیاتی</p>
                        <p className="text-xs font-bold text-amber-600">{val.operational_score?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div className="p-1 bg-green-50 rounded">
                        <p className="text-[10px] text-gray-500">بازار</p>
                        <p className="text-xs font-bold text-green-600">{val.market_score?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div className="p-1 bg-red-50 rounded">
                        <p className="text-[10px] text-gray-500">ریسک</p>
                        <p className="text-xs font-bold text-red-600">{val.risk_score?.toFixed(2) || '0.00'}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>پاسخ داده شده: {val.answered_questions || 0}/{val.total_questions || 23}</span>
                      <span>{val.total_questions > 0 ? Math.round(((val.answered_questions || 0) / (val.total_questions || 23)) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-dark-green h-1.5 rounded-full transition-all"
                        style={{ width: `${val.total_questions > 0 ? Math.round(((val.answered_questions || 0) / (val.total_questions || 23)) * 100) : 0}%` }}
                      />
                    </div>

                    {/* ======================================== */}
                    {/* دکمه‌های واکنش‌گرا - با grid و responsive */}
                    {/* ======================================== */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t">
                      <Link href={`/dashboard/intangible/assets/${val.asset_id}`} className="w-full">
                        <Button variant="outline" size="sm" className="w-full flex items-center justify-center gap-1 text-xs">
                          <Eye className="w-3 h-3" />
                          مشاهده دارایی
                        </Button>
                      </Link>
                      <Link href={`/dashboard/intangible/valuation/${val.asset_id}`} className="w-full">
                        <Button size="sm" className="w-full bg-dark-green hover:bg-dark-green/90 flex items-center justify-center gap-1 text-xs">
                          <BarChart3 className="w-3 h-3" />
                          مشاهده ارزیابی
                        </Button>
                      </Link>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full border-amber-400 text-amber-600 hover:bg-amber-50 flex items-center justify-center gap-1 text-xs"
                        onClick={() => {
                          if (val.asset_id) {
                            handleRevaluateClick(val.asset_id, val.asset || '');
                          } else {
                            alert('خطا: شناسه دارایی یافت نشد');
                          }
                        }}
                      >
                        <RefreshCw className="w-3 h-3" />
                        ارزیابی مجدد
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {valuations.length > 0 && (
            <div className="text-center text-sm text-gray-400 border-t pt-4">
              نمایش {filteredValuations.length} از {valuations.length} دارایی
              {searchTerm && ` (فیلتر شده)`}
            </div>
          )}
        </>
      )}

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setPendingRevaluate(null);
        }}
        onConfirm={handleConfirmRevaluate}
        title="ارزیابی مجدد دارایی"
        message="آیا از ارزیابی مجدد این دارایی مطمئن هستید؟"
        itemName={pendingRevaluate?.assetName}
        loading={modalLoading}
        confirmText="ارزیابی مجدد"
        cancelText="انصراف"
      />
    </PageTransition>
  );
}