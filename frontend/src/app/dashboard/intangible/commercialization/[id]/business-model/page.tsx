'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, Check, AlertTriangle, TrendingUp, TrendingDown,
  Clock, DollarSign, Zap, Award, Save, Info, ChevronDown, ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  businessModelApi, casesApi,
  CommercializationCase, RecommendationsResponse, ModelRanking,
  BusinessCaseInput,
} from '@/lib/engine06-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const toFa = (num: any): string => {
  if (num === null || num === undefined) return '—';
  return String(num).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
};

const COMPLEXITY_LABELS: Record<string, { label: string; color: string }> = {
  low: { label: 'کم', color: 'text-green-600 bg-green-50' },
  medium: { label: 'متوسط', color: 'text-amber-600 bg-amber-50' },
  high: { label: 'زیاد', color: 'text-orange-600 bg-orange-50' },
  very_high: { label: 'خیلی زیاد', color: 'text-red-600 bg-red-50' },
};

const REVENUE_LABELS: Record<string, { label: string; color: string }> = {
  low: { label: 'کم', color: 'text-gray-600 bg-gray-50' },
  medium: { label: 'متوسط', color: 'text-blue-600 bg-blue-50' },
  high: { label: 'بالا', color: 'text-emerald-600 bg-emerald-50' },
  very_high: { label: 'خیلی بالا', color: 'text-green-600 bg-green-50' },
};

const RISK_LABELS: Record<string, { label: string; color: string }> = {
  low: { label: 'کم', color: 'text-green-600 bg-green-50' },
  medium: { label: 'متوسط', color: 'text-amber-600 bg-amber-50' },
  high: { label: 'زیاد', color: 'text-orange-600 bg-orange-50' },
  very_high: { label: 'خیلی زیاد', color: 'text-red-600 bg-red-50' },
};

// مقادیر پیش‌فرض برای هر سناریو
const DEFAULT_CASH_FLOWS = {
  pessimistic: [
    { year: 0, amount: -500000000 },
    { year: 1, amount: 100000000 },
    { year: 2, amount: 150000000 },
    { year: 3, amount: 200000000 },
  ],
  base: [
    { year: 0, amount: -500000000 },
    { year: 1, amount: 200000000 },
    { year: 2, amount: 300000000 },
    { year: 3, amount: 400000000 },
    { year: 4, amount: 500000000 },
  ],
  optimistic: [
    { year: 0, amount: -500000000 },
    { year: 1, amount: 300000000 },
    { year: 2, amount: 500000000 },
    { year: 3, amount: 700000000 },
    { year: 4, amount: 900000000 },
    { year: 5, amount: 1000000000 },
  ],
};

export default function BusinessModelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: caseId } = use(params);
  const cid = parseInt(caseId);
  const router = useRouter();

  const [caseData, setCaseData] = useState<CommercializationCase | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationsResponse | null>(null);
  const [existing, setExisting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [justification, setJustification] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCaseForm, setShowCaseForm] = useState(false);
  const [cashFlows, setCashFlows] = useState(DEFAULT_CASH_FLOWS);
  const [discountRate, setDiscountRate] = useState(18);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [cid]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [caseRes, recRes, existingRes] = await Promise.all([
        casesApi.get(cid),
        businessModelApi.getRecommendations(cid),
        businessModelApi.getByCase(cid).catch(() => null),
      ]);
      setCaseData(caseRes);
      setRecommendations(recRes);

      if (existingRes) {
        setExisting(existingRes);
        setSelectedModel(existingRes.selected_model);
        setJustification(existingRes.justification || '');
        if (existingRes.business_case_data?.scenarios) {
          const sc = existingRes.business_case_data.scenarios;
          setCashFlows({
            pessimistic: sc.pessimistic?.cash_flows || DEFAULT_CASH_FLOWS.pessimistic,
            base: sc.base?.cash_flows || DEFAULT_CASH_FLOWS.base,
            optimistic: sc.optimistic?.cash_flows || DEFAULT_CASH_FLOWS.optimistic,
          });
          setDiscountRate(existingRes.business_case_data.discount_rate || 18);
        }
      } else if (recRes.system_rank_1) {
        setSelectedModel(recRes.system_rank_1);
      }
    } catch (error: any) {
      console.error(error);
      toast.error('خطا در بارگذاری');
    } finally {
      setLoading(false);
    }
  };

  const updateCashFlow = (scenario: 'pessimistic' | 'base' | 'optimistic', year: number, amount: number) => {
    setCashFlows((prev) => {
      const updated = { ...prev };
      const existing = updated[scenario].find((cf) => cf.year === year);
      if (existing) {
        existing.amount = amount;
      } else {
        updated[scenario] = [...updated[scenario], { year, amount }].sort((a, b) => a.year - b.year);
      }
      return updated;
    });
  };

  const addYear = (scenario: 'pessimistic' | 'base' | 'optimistic') => {
    setCashFlows((prev) => {
      const updated = { ...prev };
      const maxYear = Math.max(...updated[scenario].map((cf) => cf.year));
      updated[scenario] = [...updated[scenario], { year: maxYear + 1, amount: 0 }];
      return updated;
    });
  };

  const removeYear = (scenario: 'pessimistic' | 'base' | 'optimistic', year: number) => {
    if (year === 0) return; // سال ۰ (سرمایه‌گذاری) حذف نشه
    setCashFlows((prev) => {
      const updated = { ...prev };
      updated[scenario] = updated[scenario].filter((cf) => cf.year !== year);
      return updated;
    });
  };

  const requiresJustification = recommendations && selectedModel !== recommendations.system_rank_1;

  const handleSubmit = async () => {
    if (!selectedModel) {
      toast.error('لطفاً یک مدل انتخاب کنید');
      return;
    }
    if (requiresJustification && !justification.trim()) {
      toast.error('توجیه مکتوب الزامی است (شما مدل غیر از رتبه ۱ انتخاب کردید)');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        case_id: cid,
        selected_model: selectedModel,
        pessimistic: { cash_flows: cashFlows.pessimistic, discount_rate: discountRate },
        base: { cash_flows: cashFlows.base, discount_rate: discountRate },
        optimistic: { cash_flows: cashFlows.optimistic, discount_rate: discountRate },
        justification: justification,
        system_rank_1_model: recommendations?.system_rank_1 || '',
      };
      const res = await businessModelApi.selectModel(payload);
      setResult(res);
      toast.success('Business Case ثبت شد');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      console.error(error);
      const detail = error?.response?.data?.justification || error?.response?.data?.detail || 'خطا';
      toast.error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally {
      setSubmitting(false);
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
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen" style={{ fontFamily: 'Vazirmatn, Tahoma, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(`/dashboard/intangible/commercialization/${cid}`)}
          className="p-2 hover:bg-gray-100 rounded-lg bg-white shadow-sm"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">گام ۲ — انتخاب مدل تجاری‌سازی</h1>
          <p className="text-sm text-gray-500 mt-1">
            {caseData?.asset_name} • دسته: {recommendations?.asset_category || '—'}
          </p>
        </div>
      </div>

      {/* پیشنهاد سیستم */}
      {recommendations && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Award className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold text-sm">
                  پیشنهاد سیستم: {recommendations.system_rank_1_display}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {recommendations.recommended_reason}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* نتیجه ذخیره‌شده */}
      {result && (
        <Card className="border-green-400 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              Business Case ثبت شد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="text-xl font-bold">{toFa(result.computed.base.npv.toLocaleString())}</div>
                <div className="text-xs text-gray-500 mt-1">NPV (سناریوی پایه)</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="text-xl font-bold text-green-600">{toFa(result.computed.base.irr)}%</div>
                <div className="text-xs text-gray-500 mt-1">IRR</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="text-xl font-bold">{toFa(result.computed.base.payback_months)}</div>
                <div className="text-xs text-gray-500 mt-1">دوره بازگشت (ماه)</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className={`text-xl font-bold ${
                  result.computed.base.npv > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {result.computed.base.npv > 0 ? 'سودآور' : 'زیان‌ده'}
                </div>
                <div className="text-xs text-gray-500 mt-1">وضعیت</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* مدل‌های قابل انتخاب */}
      <div>
        <h2 className="text-lg font-bold mb-3">مدل‌های تجاری‌سازی مجاز</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {recommendations?.applicable_models.map((model) => {
            const isSelected = selectedModel === model.model;
            const isSystemTop = model.model === recommendations.system_rank_1;
            const complexity = COMPLEXITY_LABELS[model.attributes.complexity] || COMPLEXITY_LABELS.medium;
            const revenue = REVENUE_LABELS[model.attributes.revenue_potential] || REVENUE_LABELS.medium;
            const risk = RISK_LABELS[model.attributes.risk] || RISK_LABELS.medium;

            return (
              <Card
                key={model.model}
                onClick={() => setSelectedModel(model.model)}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? 'border-blue-500 border-2' : ''
                }`}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-sm">{model.model_display}</div>
                      <div className="text-xs text-gray-500 mt-0.5">رتبه {toFa(model.rank)}</div>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-blue-600" />}
                  </div>

                  {isSystemTop && (
                    <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded inline-block">
                      ⭐ پیشنهاد سیستم
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                    <div className={`px-2 py-1 rounded ${revenue.color}`}>
                      درآمد: {revenue.label}
                    </div>
                    <div className={`px-2 py-1 rounded ${risk.color}`}>
                      ریسک: {risk.label}
                    </div>
                    <div className={`px-2 py-1 rounded ${complexity.color}`}>
                      پیچیدگی: {complexity.label}
                    </div>
                    <div className="px-2 py-1 rounded bg-gray-50 text-gray-600">
                      {toFa(model.attributes.time_horizon_months)} ماه
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 pt-2 border-t">
                    امتیاز: {toFa(model.score.toFixed(1))} از ۱۰۰
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* توجیه (اگه غیر رتبه ۱) */}
      {requiresJustification && (
        <Card className="border-amber-300 bg-amber-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2 text-amber-800">
              <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-bold text-sm mb-2">
                  شما مدلی غیر از پیشنهاد سیستم انتخاب کردید
                </div>
                <div className="text-xs mb-2">
                  لطفاً دلیل انتخاب خود را بنویسید (الزامی).
                </div>
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="دلیل انتخاب این مدل..."
                  className="w-full p-2 border rounded text-sm"
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Business Case Form */}
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => setShowCaseForm(!showCaseForm)}
        >
          <CardTitle className="flex items-center justify-between text-base">
            <span className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Business Case (۳ سناریو)
            </span>
            {showCaseForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </CardTitle>
        </CardHeader>
        {showCaseForm && (
          <CardContent className="space-y-4">
            {/* نرخ تنزیل */}
            <div>
              <label className="text-sm font-medium block mb-1">نرخ تنزیل (%)</label>
              <input
                type="number"
                value={discountRate}
                onChange={(e) => setDiscountRate(parseFloat(e.target.value) || 18)}
                className="w-32 px-3 py-2 border rounded"
                min="0"
                max="100"
              />
            </div>

            {/* ۳ سناریو */}
            {(['pessimistic', 'base', 'optimistic'] as const).map((scenario) => {
              const colors = {
                pessimistic: { bg: 'bg-red-50', border: 'border-red-200', label: 'بدبینانه', color: 'text-red-600' },
                base: { bg: 'bg-blue-50', border: 'border-blue-200', label: 'پایه', color: 'text-blue-600' },
                optimistic: { bg: 'bg-green-50', border: 'border-green-200', label: 'خوش‌بینانه', color: 'text-green-600' },
              }[scenario];

              return (
                <div key={scenario} className={`${colors.bg} ${colors.border} border rounded p-3`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`font-bold text-sm ${colors.color}`}>{colors.label}</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addYear(scenario)}
                      className="text-xs"
                    >
                      + افزودن سال
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {cashFlows[scenario].map((cf) => (
                      <div key={cf.year} className="flex items-center gap-2">
                        <span className="text-xs w-16">سال {toFa(cf.year)}:</span>
                        <input
                          type="number"
                          value={cf.amount}
                          onChange={(e) => updateCashFlow(scenario, cf.year, parseFloat(e.target.value) || 0)}
                          className="flex-1 px-2 py-1 border rounded text-sm text-left"
                          dir="ltr"
                          placeholder="مبلغ (ریال)"
                        />
                        {cf.year > 0 && (
                          <button
                            onClick={() => removeYear(scenario, cf.year)}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        )}
      </Card>

      {/* Submit */}
      <div className="flex gap-3 justify-end sticky bottom-4">
        <Button
          variant="outline"
          onClick={() => router.push(`/dashboard/intangible/commercialization/${cid}`)}
        >
          انصراف
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || !selectedModel}
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          {submitting ? 'در حال محاسبه...' : 'ثبت و محاسبه'}
        </Button>
      </div>
    </div>
  );
}
