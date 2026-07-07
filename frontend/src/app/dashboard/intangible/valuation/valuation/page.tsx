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
import { 
  Award, 
  Search,
  Eye,
  BarChart3,
  TrendingUp,
  DollarSign,
  PieChart,
  Target,
  Building2,
  User,
  Calendar
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
}

export default function ValuationValuationPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [valuations, setValuations] = useState<ValuationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchValuations();
  }, []);

  const fetchValuations = async () => {
    try {
      setLoading(true);
      
      const allValuations = await fetchAllValuations('completed');
      
      const summaries = await Promise.all(
        allValuations.map(async (val: any) => {
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
      
      setValuations(sorted);
    } catch (error) {
      console.error('Error fetching valuations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-emerald-600';
    if (score >= 3) return 'text-amber-600';
    return 'text-red-600';
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

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch { return dateString; }
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
      {/* هدر */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-green">ارزش‌گذاری دارایی‌ها</h1>
          <p className="text-sm text-gray-500">
            تحلیل و ارزش‌گذاری مالی دارایی‌های نامشهود
          </p>
        </div>
        <div className="text-sm text-gray-500">
          <span className="font-bold text-dark-green">{valuations.length}</span> دارایی ارزش‌گذاری شده
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

      {/* آمار کلی */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">میانگین ارزش</p>
              <p className="text-sm font-bold text-dark-green">
                {(valuations.reduce((acc, v) => acc + v.weighted_score, 0) / (valuations.length || 1)).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Award className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">بالاترین ارزش</p>
              <p className="text-sm font-bold text-emerald-600">
                {Math.max(...valuations.map(v => v.weighted_score), 0).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">پایین‌ترین ارزش</p>
              <p className="text-sm font-bold text-red-600">
                {Math.min(...valuations.map(v => v.weighted_score), 0).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">تعداد کل</p>
              <p className="text-sm font-bold text-dark-green">{valuations.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* لیست دارایی‌ها */}
      {filteredValuations.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Award className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">هیچ دارایی ارزش‌گذاری شده‌ای یافت نشد</p>
          <p className="text-sm mt-1">پس از تکمیل ارزیابی، دارایی‌ها در اینجا نمایش داده می‌شوند</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredValuations.map((val) => {
            const displayScore = val.weighted_score || val.final_score;
            
            return (
              <Card key={val.id} className="hover:shadow-lg transition-all hover:-translate-y-1 border-0 shadow-sm">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{val.asset || 'نامشخص'}</p>
                      <p className="text-xs text-gray-400">{val.asset_uid || 'بدون کد'}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      displayScore >= 4 ? 'bg-emerald-100 text-emerald-800' :
                      displayScore >= 3 ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {getScoreEmoji(displayScore)} {getScoreLabel(displayScore)}
                    </div>
                  </div>

                  <div className="text-center py-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">ارزش نهایی</p>
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
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageTransition>
  );
}
