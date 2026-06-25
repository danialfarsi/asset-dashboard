'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';
import { PageTransition } from '@/components/ui/page-transition';
import { ArrowLeft, Save, Award, Eye, Info, ChevronDown, ChevronUp } from 'lucide-react';

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

interface AssetDetail {
  id: number;
  asset_name: string;
  asset_uid: string;
  category: string;
}

export default function ValuationPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const assetId = params.id as string;

  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedScores, setSelectedScores] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [valuationId, setValuationId] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [expandedGuide, setExpandedGuide] = useState<{ questionId: number; score: number } | null>(null);

  useEffect(() => {
    if (assetId) {
      fetchData();
    }
  }, [assetId]);

  const toggleGuide = (questionId: number, score: number) => {
    if (expandedGuide?.questionId === questionId && expandedGuide?.score === score) {
      setExpandedGuide(null);
    } else {
      setExpandedGuide({ questionId, score });
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📥 1. دریافت اطلاعات دارایی...');
      const { data: assetData } = await api.get(`/intangible/screened-assets/${assetId}/`);
      setAsset(assetData);

      console.log('📥 2. دریافت سوالات...');
      const { data: questionsData } = await api.get('/intangible/valuation-questions/?asset_type=1');
      const items = questionsData.results || questionsData || [];
      setQuestions(items);

      console.log('📥 3. پیدا کردن ارزیابی...');
      
      const { data: allValuations } = await api.get('/intangible/asset-valuations/');
      const valuations = allValuations.results || allValuations || [];
      const assetValuations = valuations.filter((v: any) => v.asset === parseInt(assetId));
      
      console.log(`📋 ${assetValuations.length} ارزیابی پیدا شد`);

      let valId: number | null = null;
      let existingAnswers: any[] = [];
      let existingStatus = 'draft';
      let existingScore = 0;

      if (assetValuations.length > 0) {
        // پیدا کردن بهترین ارزیابی (اولویت با completed، سپس بیشترین پاسخ)
        let bestValuation = null;
        let maxAnswers = -1;

        for (const v of assetValuations) {
          const { data: valData } = await api.get(`/intangible/asset-valuations/${v.id}/`);
          const answers = valData.answers || [];
          console.log(`  - ارزیابی ${v.id}: ${answers.length} پاسخ, status: ${v.status}`);
          
          // اولویت با completed
          if (v.status === 'completed' && answers.length > 0) {
            bestValuation = { ...v, answers };
            break;
          }
          
          // اگر completed نبود، بیشترین پاسخ را انتخاب کن
          if (answers.length > maxAnswers) {
            maxAnswers = answers.length;
            bestValuation = { ...v, answers };
          }
        }

        if (bestValuation) {
          valId = bestValuation.id;
          existingAnswers = bestValuation.answers || [];
          existingStatus = bestValuation.status;
          existingScore = bestValuation.final_score || 0;
          console.log(`✅ بهترین ارزیابی: ${valId} با ${existingAnswers.length} پاسخ, status: ${existingStatus}`);
        } else {
          valId = assetValuations[0].id;
          console.log(`⚠️ ارزیابی بدون پاسخ: ${valId}`);
        }
      }

      if (!valId) {
        console.log('📥 4. ایجاد ارزیابی جدید...');
        try {
          const response = await api.post('/intangible/asset-valuations/', {
            asset: parseInt(assetId),
            asset_type: 1,
            status: 'draft'
          });
          
          if (response.data && response.data.id) {
            valId = response.data.id;
            console.log('✅ ارزیابی جدید ایجاد شد:', valId);
          } else {
            const { data: retryValuations } = await api.get('/intangible/asset-valuations/');
            const retryList = retryValuations.results || retryValuations || [];
            const newVal = retryList.find((v: any) => v.asset === parseInt(assetId));
            if (newVal) {
              valId = newVal.id;
              console.log('✅ ارزیابی در تلاش مجدد پیدا شد:', valId);
            }
          }
        } catch (err: any) {
          console.error('❌ خطا در ایجاد ارزیابی:', err);
          const { data: retryValuations } = await api.get('/intangible/asset-valuations/');
          const retryList = retryValuations.results || retryValuations || [];
          const newVal = retryList.find((v: any) => v.asset === parseInt(assetId));
          if (newVal) {
            valId = newVal.id;
            console.log('✅ ارزیابی موجود پیدا شد:', valId);
          }
        }
      }

      if (valId) {
        // دریافت کامل ارزیابی با پاسخ‌ها
        const { data: valData } = await api.get(`/intangible/asset-valuations/${valId}/`);
        existingAnswers = valData.answers || [];
        existingStatus = valData.status;
        existingScore = valData.final_score || 0;
        console.log(`📥 پاسخ‌ها از API: ${existingAnswers.length}`);
        
        const scores: Record<number, number> = {};
        existingAnswers.forEach((answer: any) => {
          if (answer.score !== null && answer.score !== undefined) {
            scores[answer.question] = answer.score;
            console.log(`  - سوال ${answer.question}: امتیاز ${answer.score}`);
          }
        });
        setSelectedScores(scores);
        setValuationId(valId);
        
        // تعیین حالت صفحه
        if (existingStatus === 'completed') {
          // ارزیابی کامل شده → حالت مشاهده
          setIsViewMode(true);
          setIsComplete(true);
          setFinalScore(existingScore);
          console.log(`✅ ارزیابی تکمیل شده با ${Object.keys(scores).length} پاسخ - حالت مشاهده`);
        } else if (Object.keys(scores).length > 0) {
          // ارزیابی ناقص با پاسخ‌های قبلی → حالت ادامه
          setIsViewMode(false);
          setIsComplete(false);
          console.log(`📝 ارزیابی ناقص با ${Object.keys(scores).length} پاسخ - قابل ادامه`);
        } else {
          // ارزیابی جدید بدون پاسخ
          setIsViewMode(false);
          setIsComplete(false);
          console.log('📝 ارزیابی جدید - بدون پاسخ');
        }
      } else {
        console.error('❌ valId هنوز null است!');
        setError('خطا در ایجاد ارزیابی. لطفاً مجدداً تلاش کنید.');
      }

      setLoading(false);
    } catch (error: any) {
      console.error('❌ Error:', error);
      setError(error.message || 'خطا در دریافت اطلاعات');
      setLoading(false);
    }
  };

  const handleScoreSelect = (questionId: number, score: number) => {
    if (isViewMode) return; // در حالت مشاهده غیرفعال است
    setSelectedScores(prev => ({ ...prev, [questionId]: score }));
    // وقتی گزینه‌ای انتخاب می‌شود، راهنمای آن را باز کن
    setExpandedGuide({ questionId, score });
  };

  const handleSubmitAll = async () => {
    if (isViewMode) {
      router.push('/dashboard/intangible/valuation/completed');
      return;
    }
    
    if (!valuationId) {
      console.log('🔄 valuationId null است، تلاش برای دریافت مجدد...');
      try {
        const { data: allValuations } = await api.get('/intangible/asset-valuations/');
        const valuations = allValuations.results || allValuations || [];
        const found = valuations.find((v: any) => v.asset === parseInt(assetId));
        if (found) {
          setValuationId(found.id);
          const newValuationId = found.id;
          
          const answeredCount = Object.keys(selectedScores).length;
          if (answeredCount < questions.length) {
            alert(`لطفاً به همه سوالات پاسخ دهید (${answeredCount}/${questions.length})`);
            return;
          }

          setSubmitting(true);
          try {
            for (const [questionId, score] of Object.entries(selectedScores)) {
              await api.post(`/intangible/asset-valuations/${newValuationId}/submit_answer/`, {
                question_id: parseInt(questionId),
                score: score,
              });
            }

            const { data } = await api.post(`/intangible/asset-valuations/${newValuationId}/complete/`);
            setFinalScore(data.final_score);
            setIsComplete(true);
            setIsViewMode(true);
            
            alert(`✅ ارزیابی تکمیل شد! امتیاز: ${data.final_score.toFixed(2)}`);
            router.push('/dashboard/intangible/valuation/completed');
          } catch (err: any) {
            console.error('❌ Error:', err);
            alert(err.response?.data?.error || '❌ خطا در ثبت ارزیابی');
          } finally {
            setSubmitting(false);
          }
          return;
        }
      } catch (err) {
        console.error('❌ خطا در دریافت مجدد valuationId:', err);
      }
      alert('ارزیابی یافت نشد! لطفاً صفحه را مجدداً بارگذاری کنید.');
      return;
    }

    const answeredCount = Object.keys(selectedScores).length;
    if (answeredCount < questions.length) {
      alert(`لطفاً به همه سوالات پاسخ دهید (${answeredCount}/${questions.length})`);
      return;
    }

    setSubmitting(true);
    try {
      for (const [questionId, score] of Object.entries(selectedScores)) {
        await api.post(`/intangible/asset-valuations/${valuationId}/submit_answer/`, {
          question_id: parseInt(questionId),
          score: score,
        });
      }

      const { data } = await api.post(`/intangible/asset-valuations/${valuationId}/complete/`);
      setFinalScore(data.final_score);
      setIsComplete(true);
      setIsViewMode(true);
      
      alert(`✅ ارزیابی تکمیل شد! امتیاز: ${data.final_score.toFixed(2)}`);
      router.push('/dashboard/intangible/valuation/completed');
    } catch (error: any) {
      console.error('❌ Error:', error);
      alert(error.response?.data?.error || '❌ خطا در ثبت ارزیابی');
    } finally {
      setSubmitting(false);
    }
  };

  const getAnsweredCount = () => {
    return Object.keys(selectedScores).filter(key => selectedScores[parseInt(key)] !== undefined).length;
  };

  const getProgress = () => {
    if (questions.length === 0) return 0;
    return Math.round((getAnsweredCount() / questions.length) * 100);
  };

  const showViewMode = isViewMode;

  if (loading) {
    return (
      <div className="p-6">
        <SkeletonLoader variant="detail" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500 text-lg mb-4">⚠️ {error}</div>
        <button onClick={() => router.back()} className="text-primary hover:underline">بازگشت</button>
      </div>
    );
  }

  return (
    <PageTransition className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-dark-green">
              {showViewMode ? 'مشاهده ارزیابی' : 'ارزیابی دارایی'}
            </h1>
            <p className="text-sm text-gray-500">
              {asset?.asset_name} - {asset?.asset_uid}
            </p>
            {isComplete && (
              <p className="text-xs text-green-600 mt-1">✅ ارزیابی تکمیل شده</p>
            )}
            {!isComplete && Object.keys(selectedScores).length > 0 && (
              <p className="text-xs text-amber-600 mt-1">⏳ ادامه ارزیابی - {Object.keys(selectedScores).length}/{questions.length} پاسخ</p>
            )}
            {!isComplete && Object.keys(selectedScores).length === 0 && (
              <p className="text-xs text-gray-400 mt-1">📝 ارزیابی جدید</p>
            )}
          </div>
        </div>
        <div className="text-sm text-gray-500">
          <span className="font-bold text-dark-green">{getAnsweredCount()}</span> از {questions.length} سوال
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">پیشرفت ارزیابی</span>
            <span className="font-medium text-dark-green">{getProgress()}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-dark-green h-2 rounded-full transition-all duration-500"
              style={{ width: `${getProgress()}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {questions.map((question) => {
          const selectedScore = selectedScores[question.id] || null;
          const sortedGuides = [...(question.score_guides || [])].sort((a, b) => a.score - b.score);

          return (
            <Card key={question.id} className={`border-r-4 ${showViewMode ? 'border-r-green-500' : 'border-r-dark-green'} hover:shadow-md transition-shadow`}>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-dark-green bg-dark-green/10 px-2 py-0.5 rounded-full">
                      {question.code}
                    </span>
                    <span className="text-xs text-gray-400">{question.dimension_name}</span>
                  </div>
                  {selectedScore !== null && showViewMode && (
                    <span className="text-xs font-medium text-white bg-dark-green px-2 py-0.5 rounded-full">
                      انتخاب شده: {selectedScore}
                    </span>
                  )}
                </div>

                <p className="text-sm font-medium text-gray-800">
                  {question.question_text}
                </p>

                {question.hint && (
                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded-lg border border-blue-100">
                    💡 {question.hint}
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-xs text-gray-500">
                    {showViewMode ? 'گزینه انتخاب شده:' : 'گزینه مورد نظر را انتخاب کنید:'}
                  </p>
                  <div className="space-y-2">
                    {sortedGuides.map((guide) => {
                      const isSelected = selectedScore === guide.score;
                      const isExpanded = expandedGuide?.questionId === question.id && expandedGuide?.score === guide.score;

                      return (
                        <div 
                          key={guide.score} 
                          className={`border-2 rounded-lg overflow-hidden transition-all ${
                            isSelected ? 'border-dark-green bg-dark-green/5 shadow-sm' : 'border-gray-200'
                          } ${showViewMode && !isSelected ? 'opacity-60' : ''}`}
                        >
                          {/* گزینه */}
                          <button
                            onClick={() => handleScoreSelect(question.id, guide.score)}
                            disabled={submitting || showViewMode}
                            className={`
                              w-full text-right px-4 py-3 transition-all text-sm flex items-center gap-3
                              ${isSelected ? 'bg-dark-green/5' : 'hover:bg-gray-50'}
                              ${(submitting || showViewMode) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                          >
                            <span className={`font-bold min-w-6 ${isSelected ? 'text-dark-green' : 'text-gray-400'}`}>
                              {guide.score}
                            </span>
                            <span className={`flex-1 text-right ${isSelected ? 'text-dark-green font-medium' : 'text-gray-700'}`}>
                              {guide.condition}
                            </span>
                            {isSelected && (
                              <span className="text-dark-green text-xs flex items-center gap-1">
                                ✓ {showViewMode ? 'انتخاب شده' : ''}
                              </span>
                            )}
                          </button>

                          {/* دکمه نمایش راهنما */}
                          <button
                            onClick={() => toggleGuide(question.id, guide.score)}
                            className={`
                              w-full text-right px-4 py-1.5 text-xs transition-colors flex items-center justify-between gap-1 border-t
                              ${isExpanded ? 'bg-blue-50 text-blue-700' : 'text-blue-500 hover:text-blue-700 hover:bg-blue-50'}
                            `}
                          >
                            <span className="flex items-center gap-1">
                              <Info className="w-3 h-3" />
                              {isExpanded ? 'بستن راهنما' : 'مشاهده شواهد لازم'}
                            </span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>

                          {/* شواهد لازم */}
                          {isExpanded && guide.evidence_required && (
                            <div className={`px-4 py-3 ${isSelected ? 'bg-dark-green/5' : 'bg-blue-50'} border-t border-blue-100`}>
                              <p className="text-xs font-medium text-gray-700 mb-2">📎 شواهد لازم:</p>
                              <div className="bg-white/80 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap border border-blue-200 leading-relaxed">
                                {guide.evidence_required}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedScore !== null && !showViewMode && (
                  <p className="text-xs text-green-600 text-center border-t pt-2 mt-2">
                    ✅ گزینه {selectedScore} انتخاب شد
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={() => router.back()}>بازگشت</Button>
        {!showViewMode && (
          <Button
            className="bg-dark-green hover:bg-dark-green/90 flex items-center gap-2"
            onClick={handleSubmitAll}
            disabled={submitting || getAnsweredCount() < questions.length}
          >
            <Save className="w-4 h-4" />
            {submitting ? 'در حال ثبت...' : 'تکمیل ارزیابی'}
          </Button>
        )}
        {showViewMode && (
          <Button
            className="bg-dark-green hover:bg-dark-green/90 flex items-center gap-2"
            onClick={() => router.push('/dashboard/intangible/valuation/completed')}
          >
            <Eye className="w-4 h-4" />
            بازگشت به دارایی‌های ارزیابی شده
          </Button>
        )}
      </div>

      {!showViewMode && getAnsweredCount() < questions.length && (
        <p className="text-sm text-amber-600 text-center">
          ⚠️ برای تکمیل ارزیابی، به همه سوالات پاسخ دهید ({questions.length - getAnsweredCount()} سوال باقی‌مانده)
        </p>
      )}
    </PageTransition>
  );
}
