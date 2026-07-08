'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Clock, 
  CheckCircle, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  Eye,
  ArrowUp,
  ArrowDown,
  Calendar,
  BarChart3,
  ChevronRight,
  Award
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { fetchAllValuations } from '@/lib/api-utils';

interface ValuationHistoryItem {
  id: number;
  status: 'draft' | 'in_progress' | 'completed' | 'verified';
  final_score: number;
  weighted_score: number;
  answered_questions: number;
  total_questions: number;
  evaluated_at: string;
  is_latest?: boolean;
  previous_score?: number;
  score_change?: number;
}

interface ValuationHistoryProps {
  assetId: number;
  assetName?: string;
}

const STATUS_CONFIG = {
  draft: { 
    icon: Clock, 
    label: 'پیش‌نویس', 
    color: 'text-gray-500', 
    bg: 'bg-gray-100',
    border: 'border-gray-300'
  },
  in_progress: { 
    icon: Clock, 
    label: 'در حال انجام', 
    color: 'text-amber-600', 
    bg: 'bg-amber-50',
    border: 'border-amber-300'
  },
  completed: { 
    icon: CheckCircle, 
    label: 'تکمیل شده', 
    color: 'text-emerald-600', 
    bg: 'bg-emerald-50',
    border: 'border-emerald-300'
  },
  verified: { 
    icon: Award, 
    label: 'تأیید شده', 
    color: 'text-blue-600', 
    bg: 'bg-blue-50',
    border: 'border-blue-300'
  },
};

export function ValuationHistory({ assetId, assetName }: ValuationHistoryProps) {
  const router = useRouter();
  const [history, setHistory] = useState<ValuationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [assetId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      
      console.log('📥 دریافت تاریخچه ارزیابی برای assetId:', assetId);
      
      const allValuations = await fetchAllValuations();
      console.log('📋 کل ارزیابی‌ها:', allValuations.length);
      
      const assetValuations = allValuations
        .filter((v: any) => v.asset === assetId && (v.status === 'completed' || v.status === 'verified'))
        .sort((a: any, b: any) => new Date(b.evaluated_at).getTime() - new Date(a.evaluated_at).getTime());
      
      console.log('📋 ارزیابی‌های completed این دارایی:', assetValuations.length);
      
      if (assetValuations.length === 0) {
        setHistory([]);
        setLoading(false);
        return;
      }
      
      const historyData: ValuationHistoryItem[] = [];
      
      for (let i = 0; i < assetValuations.length; i++) {
        const v = assetValuations[i];
        try {
          console.log(`📥 دریافت جزئیات ارزیابی ${v.id}...`);
          const { data: summary } = await api.get(`/intangible/asset-valuations/${v.id}/summary/`);
          
          const weighted_score = summary.weighted_score || summary.final_score || 0;
          const previous = i < assetValuations.length - 1 ? historyData[i - 1] : null;
          
          historyData.push({
            id: v.id,
            status: v.status,
            final_score: summary.final_score || 0,
            weighted_score: weighted_score,
            answered_questions: summary.answered_questions || 0,
            total_questions: summary.total_questions || 23,
            evaluated_at: v.evaluated_at || v.updated_at || new Date().toISOString(),
            is_latest: i === 0,
            previous_score: previous?.weighted_score,
            score_change: previous ? weighted_score - previous.weighted_score : undefined,
          });
          
          console.log(`✅ ارزیابی ${v.id} اضافه شد:`, weighted_score);
        } catch (e) {
          console.error(`❌ Error fetching valuation ${v.id}:`, e);
        }
      }
      
      console.log('✅ تاریخچه نهایی:', historyData.length);
      setHistory(historyData);
    } catch (error) {
      console.error('❌ Error fetching valuation history:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return {
        date: date.toLocaleDateString('fa-IR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        time: date.toLocaleTimeString('fa-IR', {
          hour: '2-digit',
          minute: '2-digit'
        })
      };
    } catch {
      return { date: 'نامشخص', time: 'نامشخص' };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-emerald-600';
    if (score >= 3) return 'text-amber-600';
    return 'text-red-600';
  };

  const getChangeDisplay = (change: number | undefined) => {
    if (change === undefined) return null;
    const isPositive = change > 0;
    return (
      <span className={`flex items-center gap-0.5 text-xs font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
        {isPositive ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
        {Math.abs(change).toFixed(2)}
      </span>
    );
  };

  const handleViewValuation = (valuationId: number) => {
    // ✅ رفتن به صفحه مشاهده ارزیابی با ID
    router.push(`/dashboard/intangible/valuation/view/${valuationId}`);
  };

  const displayedHistory = expanded ? history : history.slice(0, 5);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dark-green"></div>
            <span className="mr-3 text-gray-500">در حال بارگذاری تاریخچه...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">هیچ تاریخچه ارزیابی برای این دارایی یافت نشد</p>
          <p className="text-xs text-gray-400 mt-1">پس از اولین ارزیابی، تاریخچه در اینجا نمایش داده می‌شود</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <CardContent className="p-6 space-y-4">
        {/* هدر */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-dark-green" />
            <div>
              <h3 className="text-lg font-bold text-dark-green">تاریخچه ارزیابی</h3>
              <p className="text-sm text-gray-500">
                {history.length} ارزیابی برای {assetName || 'این دارایی'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">آخرین امتیاز:</span>
                <span className={`font-bold ${getScoreColor(history[0]?.weighted_score || 0)}`}>
                  {history[0]?.weighted_score?.toFixed(2) || '0.00'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* تایم‌لاین */}
        <div className="relative space-y-0 pr-4">
          {/* خط عمودی */}
          <div className="absolute right-1.5 top-0 bottom-0 w-0.5 bg-gray-200" />

          {displayedHistory.map((item, index) => {
            const statusConfig = getStatusConfig(item.status);
            const StatusIcon = statusConfig.icon;
            const { date, time } = formatDate(item.evaluated_at);
            const isCompleted = item.status === 'completed' || item.status === 'verified';
            const isLatest = index === 0;

            return (
              <div key={item.id} className="relative pb-6 last:pb-0 group">
                {/* نقطه روی خط */}
                <div className={`absolute right-1 top-1 w-3 h-3 rounded-full border-2 border-white shadow-sm z-10 ${statusConfig.bg} ${statusConfig.border}`} />
                
                {/* محتوای آیتم */}
                <div className={`mr-8 p-4 rounded-lg transition-all ${isLatest ? 'bg-dark-green/5 border border-dark-green/20' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                      <span className="text-sm font-medium">
                        ارزیابی #{history.length - index}
                        {isLatest && (
                          <span className="mr-2 text-xs bg-dark-green text-white px-2 py-0.5 rounded-full">
                            آخرین
                          </span>
                        )}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig.bg} ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {isCompleted && (
                        <span className={`text-lg font-bold ${getScoreColor(item.weighted_score)}`}>
                          {item.weighted_score.toFixed(2)}
                        </span>
                      )}
                      {item.score_change !== undefined && isCompleted && (
                        <div className="text-xs">
                          {getChangeDisplay(item.score_change)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{date}</span>
                      <span className="text-gray-300">•</span>
                      <span>{time}</span>
                    </div>
                    {isCompleted && (
                      <>
                        <span className="text-gray-300">•</span>
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          <span>{item.answered_questions}/{item.total_questions} پاسخ</span>
                        </div>
                        {item.previous_score !== undefined && (
                          <>
                            <span className="text-gray-300">•</span>
                            <div className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              <span>قبلی: {item.previous_score.toFixed(2)}</span>
                            </div>
                          </>
                        )}
                      </>
                    )}
                    {!isCompleted && (
                      <span className="text-amber-500">⏳ در حال انجام</span>
                    )}
                  </div>

                  {/* دکمه اقدام */}
                  <div className="mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-dark-green hover:text-dark-green/70 hover:bg-dark-green/10 h-7 px-3 text-xs"
                      onClick={() => handleViewValuation(item.id)}
                    >
                      <Eye className="w-3 h-3 ml-1" />
                      مشاهده جزئیات
                      <ChevronRight className="w-3 h-3 mr-1" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* دکمه نمایش بیشتر */}
        {history.length > 5 && (
          <div className="pt-2 border-t">
            <Button
              variant="ghost"
              className="w-full text-sm text-gray-500 hover:text-dark-green"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'نمایش کمتر' : `نمایش ${history.length - 5} ارزیابی دیگر`}
            </Button>
          </div>
        )}

        {/* خلاصه آماری */}
        <div className="pt-3 border-t grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-xs">
          <div className="p-2 bg-gray-50 rounded-lg">
            <p className="text-gray-400">تعداد ارزیابی‌ها</p>
            <p className="text-lg font-bold text-dark-green">{history.length}</p>
          </div>
          <div className="p-2 bg-gray-50 rounded-lg">
            <p className="text-gray-400">میانگین امتیاز</p>
            <p className="text-lg font-bold text-dark-green">
              {(history.reduce((acc, h) => acc + h.weighted_score, 0) / history.length || 0).toFixed(2)}
            </p>
          </div>
          <div className="p-2 bg-gray-50 rounded-lg">
            <p className="text-gray-400">بهترین امتیاز</p>
            <p className="text-lg font-bold text-emerald-600">
              {Math.max(...history.map(h => h.weighted_score), 0).toFixed(2)}
            </p>
          </div>
          <div className="p-2 bg-gray-50 rounded-lg">
            <p className="text-gray-400">وضعیت</p>
            <p className="text-lg font-bold text-amber-600">
              {history[0]?.status === 'completed' || history[0]?.status === 'verified' ? '✅ تکمیل شده' : '⏳ در حال انجام'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
