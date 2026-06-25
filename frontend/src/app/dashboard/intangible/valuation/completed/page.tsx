'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';
import { PageTransition } from '@/components/ui/page-transition';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { 
  Award, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Building2,
  Building,
  User,
  Calendar,
  Search,
  Eye,
  BarChart3,
  RefreshCw,
  Trash2
} from 'lucide-react';

interface ValuationSummary {
  id: number;
  asset: string;
  asset_id: number;
  asset_uid: string;
  status: string;
  final_score: number;
  strategic_score: number;
  technical_score: number;
  operational_score: number;
  market_score: number;
  risk_score: number;
  total_questions: number;
  answered_questions: number;
}

export default function CompletedValuationsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [valuations, setValuations] = useState<ValuationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingRevaluate, setPendingRevaluate] = useState<{ assetId: number; valuationId: number; assetName: string } | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchValuations();
  }, []);

  const fetchValuations = async () => {
    try {
      setLoading(true);
      
      const { data } = await api.get('/intangible/asset-valuations/?status=completed');
      const items = data.results || data || [];
      
      const summaries = await Promise.all(
        items.map(async (val: any) => {
          try {
            const { data: summary } = await api.get(`/intangible/asset-valuations/${val.id}/summary/`);
            return { ...summary, id: val.id, asset_id: val.asset };
          } catch (e) {
            return null;
          }
        })
      );
      
      // مرتب‌سازی بر اساس امتیاز (بیشترین به کمترین)
      const sorted = summaries
        .filter(s => s !== null)
        .sort((a, b) => (b?.final_score || 0) - (a?.final_score || 0));
      
      setValuations(sorted);
    } catch (error) {
      console.error('Error fetching completed valuations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevaluateClick = (assetId: number, valuationId: number, assetName: string) => {
    if (!assetId) {
      alert('خطا: شناسه دارایی یافت نشد');
      return;
    }
    setPendingRevaluate({ assetId, valuationId, assetName });
    setShowConfirmModal(true);
  };

  const handleConfirmRevaluate = async () => {
    if (!pendingRevaluate) return;

    setModalLoading(true);
    try {
      const { assetId, valuationId } = pendingRevaluate;
      
      console.log('🔄 شروع ارزیابی مجدد برای assetId:', assetId);
      
      // 1. حذف ارزیابی قبلی
      await api.delete(`/intangible/asset-valuations/${valuationId}/`);
      console.log('✅ ارزیابی قبلی حذف شد');
      
      // 2. ایجاد ارزیابی جدید
      const response = await api.post('/intangible/asset-valuations/', {
        asset: assetId,
        asset_type: 1,
        status: 'draft'
      });
      console.log('✅ ارزیابی جدید ایجاد شد:', response.data.id);
      
      setShowConfirmModal(false);
      setPendingRevaluate(null);
      
      // 3. رفتن به صفحه ارزیابی با assetId
      router.push(`/dashboard/intangible/valuation/${assetId}`);
      
    } catch (error: any) {
      console.error('❌ Error revaluating:', error);
      alert(error.response?.data?.detail || '❌ خطا در شروع ارزیابی مجدد');
    } finally {
      setModalLoading(false);
    }
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
    if (score >= 2) return 'متوسط';
    return 'ضعیف';
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 4) return '🌟';
    if (score >= 3) return '👍';
    if (score >= 2) return '📊';
    return '⚠️';
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-green">دارایی‌های ارزیابی شده</h1>
          <p className="text-sm text-gray-500">
            دارایی‌هایی که فرآیند ارزیابی آنها تکمیل شده است
          </p>
        </div>
        <div className="text-sm text-gray-500">
          <span className="font-bold text-dark-green">{valuations.length}</span> دارایی ارزیابی شده
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredValuations.map((val) => (
            <Card key={val.id} className="hover:shadow-lg transition-all hover:-translate-y-1 border-0 shadow-sm overflow-hidden">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{val.asset || 'نامشخص'}</p>
                    <p className="text-xs text-gray-400">{val.asset_uid || 'بدون کد'}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getScoreBg(val.final_score)}`}>
                    {getScoreEmoji(val.final_score)} {getScoreLabel(val.final_score)}
                  </div>
                </div>

                <div className="text-center py-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">امتیاز نهایی</p>
                  <p className={`text-3xl font-bold ${getScoreColor(val.final_score)}`}>
                    {val.final_score?.toFixed(2) || '0.00'}
                  </p>
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

                {/* دکمه‌ها */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                  <Link href={`/dashboard/intangible/assets/${val.asset_id}`} className="flex-1 min-w-[80px]">
                    <Button variant="outline" size="sm" className="w-full flex items-center gap-1 text-xs">
                      <Eye className="w-3 h-3" />
                      مشاهده دارایی
                    </Button>
                  </Link>
                  <Link href={`/dashboard/intangible/valuation/${val.asset_id}`} className="flex-1 min-w-[80px]">
                    <Button size="sm" className="w-full bg-dark-green hover:bg-dark-green/90 flex items-center gap-1 text-xs">
                      <BarChart3 className="w-3 h-3" />
                      مشاهده ارزیابی
                    </Button>
                  </Link>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 min-w-[80px] border-amber-400 text-amber-600 hover:bg-amber-50 flex items-center gap-1 text-xs"
                    onClick={() => {
                      if (val.asset_id) {
                        handleRevaluateClick(val.asset_id, val.id, val.asset || '');
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
          ))}
        </div>
      )}

      {/* Modal تأیید ارزیابی مجدد */}
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
