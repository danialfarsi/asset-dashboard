'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';
import { PageTransition } from '@/components/ui/page-transition';
import { ArrowLeft, Eye, CheckCircle } from 'lucide-react';

interface ScoreGuide {
  id: number;
  score: number;
  condition: string;
  evidence_required: string;
}

interface Question {
  id: number;
  code: string;
  question_text: string;
  hint: string;
  dimension_name: string;
  score_guides: ScoreGuide[];
}

interface Answer {
  id: number;
  question: number;
  question_code: string;
  question_text: string;
  dimension_name: string;
  score: number;
  evidence: string;
  notes: string;
}

interface ValuationDetail {
  id: number;
  asset: number;
  asset_name: string;
  asset_uid: string;
  status: string;
  final_score: number;
  weighted_score: number;
  strategic_score: number;
  technical_score: number;
  operational_score: number;
  market_score: number;
  risk_score: number;
  answers: Answer[];
  total_questions: number;
  answered_questions: number;
}

export default function ViewValuationPage() {
  const params = useParams();
  const router = useRouter();
  const valuationId = params.id as string;
  const [valuation, setValuation] = useState<ValuationDetail | null>(null);
  const [questionsMap, setQuestionsMap] = useState<Record<string, Question>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (valuationId) {
      fetchData();
    }
  }, [valuationId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      console.log('📥 دریافت جزئیات ارزیابی:', valuationId);
      
      // 1. دریافت خلاصه ارزیابی
      const { data: summary } = await api.get(`/intangible/asset-valuations/${valuationId}/summary/`);
      console.log('✅ خلاصه:', summary);
      
      // 2. دریافت پاسخ‌ها
      const { data: valData } = await api.get(`/intangible/asset-valuations/${valuationId}/`);
      console.log('✅ پاسخ‌ها:', valData);
      
      // 3. دریافت AssetType از دارایی
      const assetId = valData.asset;
      const { data: assetData } = await api.get(`/intangible/screened-assets/${assetId}/`);
      
      let assetTypeId = 1;
      if (assetData.asset_type?.id) {
        assetTypeId = assetData.asset_type.id;
      }
      console.log('🔍 AssetType ID:', assetTypeId);
      
      // 4. دریافت سوالات کامل با گزینه‌ها
      const { data: questionsData } = await api.get(`/intangible/valuation-questions/?asset_type=${assetTypeId}`);
      const items = questionsData.results || questionsData || [];
      console.log('📋 تعداد سوالات دریافت شده:', items.length);
      
      // ساخت مپ سوالات با code
      const map: Record<string, Question> = {};
      items.forEach((q: Question) => {
        map[q.code] = q;
      });
      setQuestionsMap(map);
      
      // 5. ترکیب پاسخ‌ها با سوالات کامل
      const answersWithQuestions = (valData.answers || []).map((answer: Answer) => {
        const questionCode = answer.question_code;
        const question = map[questionCode];
        return {
          ...answer,
          question_detail: question || null,
        };
      });
      
      setValuation({
        ...summary,
        answers: answersWithQuestions,
      });
      
    } catch (error: any) {
      console.error('Error fetching valuation:', error);
      setError(error.message || 'خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-emerald-600';
    if (score >= 3) return 'text-amber-600';
    if (score >= 2) return 'text-orange-500';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 4) return 'bg-emerald-50 border-emerald-200';
    if (score >= 3) return 'bg-amber-50 border-amber-200';
    if (score >= 2) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 4) return 'عالی';
    if (score >= 3) return 'خوب';
    if (score >= 2) return 'متوسط';
    return 'ضعیف';
  };

  if (loading) {
    return (
      <div className="p-6">
        <SkeletonLoader variant="detail" />
      </div>
    );
  }

  if (error || !valuation) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500 text-lg mb-4">⚠️ {error || 'ارزیابی یافت نشد'}</div>
        <button onClick={() => router.back()} className="text-primary hover:underline">بازگشت</button>
      </div>
    );
  }

  return (
    <PageTransition className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* هدر */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-dark-green">مشاهده ارزیابی</h1>
            <p className="text-sm text-gray-500">
              {valuation.asset_name} - {valuation.asset_uid}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            valuation.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {valuation.status === 'completed' ? '✅ تکمیل شده' : '⏳ در حال انجام'}
          </span>
        </div>
      </div>

      {/* کارت‌های امتیاز */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-gradient-to-br from-dark-green/5 to-dark-green/10 border-dark-green/20">
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-gray-500">امتیاز نهایی</p>
            <p className={`text-xl font-bold ${getScoreColor(valuation.weighted_score || valuation.final_score)}`}>
              {(valuation.weighted_score || valuation.final_score).toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-gray-500">استراتژیک</p>
            <p className="text-lg font-bold text-blue-600">{valuation.strategic_score?.toFixed(2) || '0.00'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-gray-500">فنی</p>
            <p className="text-lg font-bold text-purple-600">{valuation.technical_score?.toFixed(2) || '0.00'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-gray-500">بازار</p>
            <p className="text-lg font-bold text-green-600">{valuation.market_score?.toFixed(2) || '0.00'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-[10px] text-gray-500">ریسک</p>
            <p className="text-lg font-bold text-red-600">{valuation.risk_score?.toFixed(2) || '0.00'}</p>
          </CardContent>
        </Card>
      </div>

      {/* سوالات با گزینه‌ها - بدون شواهد */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-dark-green">پاسخ‌ها و گزینه‌ها</h3>
        {valuation.answers && valuation.answers.length > 0 ? (
          valuation.answers.map((item: any, index: number) => {
            const selectedScore = item.score || 0;
            const question = item.question_detail;
            const scoreGuides = question?.score_guides || [];
            
            return (
              <Card key={index} className="border-r-4 border-r-dark-green hover:shadow-md transition-shadow overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  {/* هدر سوال */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-dark-green bg-dark-green/10 px-2 py-0.5 rounded-full">
                        {question?.code || item.question_code || `سوال ${index + 1}`}
                      </span>
                      <span className="text-xs text-gray-400">{question?.dimension_name || item.dimension_name || 'نامشخص'}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getScoreBg(selectedScore)}`}>
                      امتیاز: {selectedScore}
                    </span>
                  </div>
                  
                  {/* متن سوال */}
                  <p className="text-sm font-medium text-gray-800">
                    {question?.question_text || item.question_text || 'متن سوال موجود نیست'}
                  </p>
                  
                  {question?.hint && (
                    <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded-lg border border-blue-100">
                      💡 {question.hint}
                    </div>
                  )}
                  
                  {/* گزینه‌ها */}
                  <div className="space-y-1.5 mt-2">
                    <p className="text-xs text-gray-500">گزینه‌های انتخاب:</p>
                    {scoreGuides.length > 0 ? (
                      scoreGuides.map((guide: ScoreGuide) => {
                        const isSelected = guide.score === selectedScore;
                        return (
                          <div
                            key={guide.score}
                            className={`p-2.5 rounded-lg border-2 transition-all ${
                              isSelected 
                                ? 'border-dark-green bg-dark-green/10 shadow-sm' 
                                : 'border-gray-200 bg-gray-50/50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                isSelected 
                                  ? 'bg-dark-green text-white' 
                                  : 'bg-gray-200 text-gray-400'
                              }`}>
                                {guide.score}
                              </div>
                              <div className="flex-1">
                                <p className={`text-sm ${isSelected ? 'text-dark-green font-medium' : 'text-gray-600'}`}>
                                  {guide.condition}
                                </p>
                                {isSelected && (
                                  <p className="text-xs text-green-600 mt-0.5 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    گزینه انتخاب شده
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-gray-400">گزینه‌ای برای این سوال ثبت نشده است</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-6 text-center text-gray-400">
              <p>هیچ پاسخی برای این ارزیابی ثبت نشده است</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* دکمه مشاهده دارایی */}
      <div className="flex justify-end pt-4 border-t">
        <Button
          className="bg-dark-green hover:bg-dark-green/90"
          onClick={() => router.push(`/dashboard/intangible/assets/${valuation.asset}`)}
        >
          <Eye className="w-4 h-4 ml-2" />
          مشاهده دارایی
        </Button>
      </div>
    </PageTransition>
  );
}