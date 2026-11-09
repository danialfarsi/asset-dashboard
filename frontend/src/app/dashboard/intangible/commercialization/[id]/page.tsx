'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, Briefcase, CheckCircle, Clock, AlertCircle,
  FileText, Users, DollarSign, TrendingUp, ChevronLeft,
  Building2, Calendar, User, Activity, Shield, Award,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  casesApi, readinessApi,
  CommercializationCase, ReadinessAssessment,
} from '@/lib/engine06-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const toFa = (num: any): string => {
  if (num === null || num === undefined) return '—';
  return String(num).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
};

const STEP_META = [
  { step: 1, title: 'ارزیابی آمادگی', icon: Shield, path: 'readiness', description: 'ارزیابی ۴۳ گویه در ۳ بخش' },
  { step: 2, title: 'انتخاب مدل تجاری‌سازی', icon: Briefcase, path: 'business-model', description: 'Business Case با ۳ سناریو' },
  { step: 3, title: 'شناسایی شرکا', icon: Users, path: 'partners', description: 'جستجو، امتیازدهی، Shortlist' },
  { step: 4, title: 'مذاکره و قرارداد', icon: FileText, path: 'contract', description: 'چک‌لیست ۱۴ بندی، امضا' },
  { step: 5, title: 'وصول درآمد', icon: DollarSign, path: 'revenue', description: 'ثبت درآمد، شاخص سلامت' },
];

export default function CaseOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const caseId = parseInt(id);
  const router = useRouter();

  const [caseData, setCaseData] = useState<CommercializationCase | null>(null);
  const [readiness, setReadiness] = useState<ReadinessAssessment | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [caseId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [caseRes, readinessRes, timelineRes] = await Promise.all([
        casesApi.get(caseId),
        readinessApi.getByCase(caseId).catch(() => null),
        casesApi.timeline(caseId).catch(() => []),
      ]);
      setCaseData(caseRes);
      setReadiness(readinessRes);
      setTimeline(timelineRes || []);
    } catch (error: any) {
      console.error(error);
      toast.error('خطا در بارگذاری پرونده');
    } finally {
      setLoading(false);
    }
  };

  const handleAdvance = async () => {
    if (!caseData) return;
    if (!confirm('آیا مطمئنی می‌خوای به گام بعدی بری؟')) return;
    try {
      const updated = await casesApi.advance(caseId);
      setCaseData(updated);
      toast.success(`به گام ${toFa(updated.current_step)} منتقل شدید`);
    } catch (error: any) {
      const detail = error?.response?.data?.detail || 'خطا در پیشبرد';
      toast.error(detail);
    }
  };

  const handleClose = async (won: boolean) => {
    const reason = prompt(won ? 'دلیل موفقیت:' : 'دلیل عدم موفقیت:');
    if (!reason) return;
    try {
      await casesApi.close(caseId, won, reason);
      toast.success('پرونده بسته شد');
      fetchData();
    } catch {
      toast.error('خطا');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-3" />
        <p>پرونده یافت نشد</p>
        <Button onClick={() => router.push('/dashboard/intangible/commercialization')} className="mt-3">
          بازگشت
        </Button>
      </div>
    );
  }

  const isClosed = caseData.status === 'closed_won' || caseData.status === 'closed_lost';

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen" style={{ fontFamily: 'Vazirmatn, Tahoma, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/intangible/commercialization')}
            className="p-2 hover:bg-gray-100 rounded-lg bg-white shadow-sm"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{caseData.asset_name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              COM-{toFa(caseData.id)} • {caseData.asset_type_name || '—'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isClosed && caseData.current_step < 5 && (
            <Button onClick={handleAdvance} className="gap-2">
              <ChevronLeft className="w-4 h-4" />
              پیشبرد به گام {toFa(caseData.current_step + 1)}
            </Button>
          )}
          {!isClosed && (
            <>
              <Button onClick={() => handleClose(true)} variant="outline" className="text-green-600">
                <CheckCircle className="w-4 h-4 mr-1" />
                بستن موفق
              </Button>
              <Button onClick={() => handleClose(false)} variant="outline" className="text-red-600">
                <AlertCircle className="w-4 h-4 mr-1" />
                بستن ناموفق
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status Banner */}
      {isClosed && (
        <Card className={caseData.status === 'closed_won' ? 'border-green-500 border-2' : 'border-red-500 border-2'}>
          <CardContent className="p-4 flex items-center gap-3">
            {caseData.status === 'closed_won' ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600" />
            )}
            <div>
              <div className="font-bold">
                پرونده بسته شده — {caseData.status === 'closed_won' ? 'موفق' : 'ناموفق'}
              </div>
              {caseData.closed_at && (
                <div className="text-xs text-gray-500 mt-1">
                  تاریخ: {new Date(caseData.closed_at).toLocaleDateString('fa-IR')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <Activity className="w-4 h-4" />
              وضعیت
            </div>
            <div className="font-bold mt-1 text-sm">{caseData.status_display}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <Clock className="w-4 h-4" />
              گام فعلی
            </div>
            <div className="font-bold mt-1 text-sm">گام {toFa(caseData.current_step)} از ۵</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <Building2 className="w-4 h-4" />
              سازمان
            </div>
            <div className="font-bold mt-1 text-sm truncate">{caseData.organization_name || '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <User className="w-4 h-4" />
              مسئول
            </div>
            <div className="font-bold mt-1 text-sm truncate">{caseData.owner_name || '—'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Steps */}
      <div>
        <h2 className="text-lg font-bold mb-3">گام‌های تجاری‌سازی</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {STEP_META.map((meta) => {
            const isCompleted = caseData.current_step > meta.step;
            const isCurrent = caseData.current_step === meta.step;
            const isLocked = caseData.current_step < meta.step;

            // وضعیت تکمیل هر گام
            const hasData =
              meta.step === 1 ? caseData.has_readiness :
              meta.step === 2 ? caseData.has_business_model :
              meta.step === 3 ? caseData.has_shortlist :
              meta.step === 4 ? caseData.has_contract :
              meta.step === 5 ? caseData.has_revenue : false;

            return (
              <Card
                key={meta.step}
                className={`transition-all ${
                  isCurrent ? 'border-blue-500 border-2 shadow-lg' :
                  isCompleted ? 'border-green-300 bg-green-50/30' :
                  isLocked ? 'opacity-50' :
                  'hover:shadow-md'
                }`}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isCompleted ? 'bg-green-500 text-white' :
                      isCurrent ? 'bg-blue-500 text-white' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                      {isCompleted ? <CheckCircle className="w-4 h-4" /> : toFa(meta.step)}
                    </div>
                    {hasData && <span className="text-xs text-green-600">✓</span>}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{meta.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{meta.description}</div>
                  </div>
                  {!isLocked && (
                    <Button
                      size="sm"
                      variant={isCurrent ? 'default' : 'outline'}
                      onClick={() => router.push(`/dashboard/intangible/commercialization/${caseId}/${meta.path}`)}
                      className="w-full text-xs mt-2"
                    >
                      {isCurrent ? 'ادامه' : 'مشاهده'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Readiness Summary (اگه هست) */}
      {readiness && readiness.recommendation !== 'pending' && (
        <Card className={
          readiness.recommendation === 'go' ? 'border-green-300' :
          readiness.recommendation === 'develop' ? 'border-amber-300' :
          'border-red-300'
        }>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="w-4 h-4" />
              خلاصه ارزیابی آمادگی (گام ۱)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="text-xl font-bold">{toFa(Number(readiness.final_score).toFixed(1))}</div>
                <div className="text-xs text-gray-500">امتیاز</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="text-xl font-bold">{toFa(readiness.confidence_level)}</div>
                <div className="text-xs text-gray-500">اطمینان</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className={`text-xl font-bold ${
                  readiness.recommendation === 'go' ? 'text-green-600' :
                  readiness.recommendation === 'develop' ? 'text-amber-600' :
                  'text-red-600'
                }`}>
                  {readiness.recommendation_display}
                </div>
                <div className="text-xs text-gray-500">توصیه</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="text-xl font-bold">{toFa(readiness.responses_answered)}</div>
                <div className="text-xs text-gray-500">پاسخ داده</div>
              </div>
            </div>
            {readiness.recommendation_message && (
              <div className="text-sm p-2 bg-blue-50 rounded">
                {readiness.recommendation_message}
              </div>
            )}
            <Button
              onClick={() => router.push(`/dashboard/intangible/commercialization/${caseId}/readiness`)}
              variant="outline"
              size="sm"
            >
              مشاهده جزئیات کامل
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      {timeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="w-4 h-4" />
              تاریخچه فعالیت‌ها ({toFa(timeline.length)})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {timeline.map((log: any, idx: number) => (
                <div key={log.id || idx} className="flex gap-3 items-start pb-3 border-b last:border-0">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{log.action_display}</div>
                    {log.description && (
                      <div className="text-xs text-gray-600 mt-1">{log.description}</div>
                    )}
                    <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                      <span>{log.user_name || '—'}</span>
                      <span>•</span>
                      <span>{new Date(log.created_at).toLocaleString('fa-IR')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
