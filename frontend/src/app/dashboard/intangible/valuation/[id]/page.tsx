'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';
import { PageTransition } from '@/components/ui/page-transition';
import { ArrowLeft, Save, Eye, Info, ChevronDown, ChevronUp, Upload, File, X } from 'lucide-react';
import { fetchAllValuations, type ValuationItem } from '@/lib/api-utils';

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
  asset_type?: {
    id: number;
    code: string;
    name: string;
  };
}

interface EvidenceFiles {
  interview?: File | null;
  document?: File | null;
  process?: File | null;
  database?: File | null;
}

const EVIDENCE_TYPES = [
  { key: 'interview', label: 'مصاحبه', icon: '🎙️', color: 'text-purple-600', bg: 'bg-purple-50' },
  { key: 'document', label: 'سند', icon: '📄', color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'process', label: 'فرآیند', icon: '⚙️', color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'database', label: 'پایگاه داده', icon: '🗄️', color: 'text-emerald-600', bg: 'bg-emerald-50' },
];

export default function ValuationPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const assetId = params.id as string;
  const isNewValuation = searchParams.get('new') === 'true';

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
  const [assetTypeName, setAssetTypeName] = useState<string | null>(null);
  const [evidenceFiles, setEvidenceFiles] = useState<Record<number, EvidenceFiles>>({});
  const [showEvidence, setShowEvidence] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (assetId) {
      fetchData();
    }
  }, [assetId, isNewValuation]);

  const toggleGuide = (questionId: number, score: number) => {
    if (expandedGuide?.questionId === questionId && expandedGuide?.score === score) {
      setExpandedGuide(null);
    } else {
      setExpandedGuide({ questionId, score });
    }
  };

  const toggleEvidence = (questionId: number) => {
    setShowEvidence(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📥 1. دریافت اطلاعات دارایی...');
      console.log(`   assetId: ${assetId}`);
      console.log(`   isNewValuation: ${isNewValuation}`);
      
      const { data: assetData } = await api.get(`/intangible/screened-assets/${assetId}/`);
      setAsset(assetData);
      console.log('✅ Asset Data:', assetData);

      let assetTypeId: number | null = null;
      let assetTypeCode: string | null = null;

      if (assetData.asset_type?.id) {
        assetTypeId = assetData.asset_type.id;
        assetTypeCode = assetData.asset_type.code;
        setAssetTypeName(assetData.asset_type.code);
        console.log(`✅ AssetType از دارایی: ${assetTypeId} (${assetTypeCode})`);
      }

      if (!assetTypeId && assetData.asset_uid) {
        try {
          const { data: detection } = await api.get(
            `/intangible/detect-asset-type/${assetData.asset_uid}/`
          );
          console.log('✅ تشخیص AssetType:', detection);
          assetTypeId = detection.asset_type_id;
          assetTypeCode = detection.asset_type_code;
          setAssetTypeName(detection.asset_type_code);
        } catch (detectError) {
          console.error('❌ خطا در تشخیص AssetType:', detectError);
        }
      }

      if (!assetTypeId) {
        assetTypeId = 1;
        assetTypeCode = 'BRAND';
        setAssetTypeName('BRAND');
        console.log('⚠️ استفاده از پیش‌فرض BRAND');
      }

      console.log(`📥 2. دریافت سوالات با asset_type: ${assetTypeId}`);
      const { data: questionsData } = await api.get(`/intangible/valuation-questions/?asset_type=${assetTypeId}`);
      const items = questionsData.results || questionsData || [];
      setQuestions(items);
      console.log(`✅ ${items.length} سوال دریافت شد`);

      if (items.length === 0) {
        setError(`هیچ سوالی برای نوع دارایی "${assetTypeCode}" یافت نشد.`);
        setLoading(false);
        return;
      }

      console.log('📥 3. پیدا کردن ارزیابی...');
      
      const allValuations = await fetchAllValuations();
      console.log(`📋 کل ارزیابی‌ها: ${allValuations.length}`);
      
      const assetValuations = allValuations.filter((v: ValuationItem) => v.asset === parseInt(assetId));
      console.log(`📋 ${assetValuations.length} ارزیابی برای این دارایی پیدا شد`);

      let valId: number | null = null;

      // 🔥 اگر new=true بود، یک ارزیابی جدید ایجاد کن
      if (isNewValuation) {
        console.log('📥 ایجاد ارزیابی جدید (درخواست جدید)...');
        try {
          const response = await api.post('/intangible/asset-valuations/', {
            asset: parseInt(assetId),
            asset_type: assetTypeId,
            status: 'draft'
          });
          
          if (response.data && response.data.id) {
            valId = response.data.id;
            console.log('✅ ارزیابی جدید ایجاد شد:', valId);
            setValuationId(valId);
          }
        } catch (err: any) {
          console.error('❌ خطا در ایجاد ارزیابی:', err);
          setError(err.response?.data?.detail || 'خطا در ایجاد ارزیابی');
          setLoading(false);
          return;
        }
      } else if (assetValuations.length > 0) {
        // 🔥 اگر new نبود، ارزیابی completed رو پیدا کن
        const completedValuation = assetValuations.find((v: ValuationItem) => v.status === 'completed');
        
        if (completedValuation) {
          valId = completedValuation.id;
          console.log(`✅ ارزیابی completed پیدا شد: ${valId}`);
        } else {
          const sortedValuations = [...assetValuations].sort((a, b) => b.id - a.id);
          valId = sortedValuations[0]?.id || null;
          console.log(`📝 جدیدترین ارزیابی: ${valId}`);
        }
      } else {
        // اگر هیچ ارزیابی وجود نداشت، یکی ایجاد کن
        console.log('📥 4. ایجاد ارزیابی جدید...');
        try {
          const response = await api.post('/intangible/asset-valuations/', {
            asset: parseInt(assetId),
            asset_type: assetTypeId,
            status: 'draft'
          });
          
          if (response.data && response.data.id) {
            valId = response.data.id;
            console.log('✅ ارزیابی جدید ایجاد شد:', valId);
            setValuationId(valId);
          }
        } catch (err: any) {
          console.error('❌ خطا در ایجاد ارزیابی:', err);
          setError(err.response?.data?.detail || 'خطا در ایجاد ارزیابی');
          setLoading(false);
          return;
        }
      }

      if (valId) {
        setValuationId(valId);
        console.log(`✅ valuationId ست شد: ${valId}`);
        
        // دریافت پاسخ‌ها
        const { data: valData } = await api.get(`/intangible/asset-valuations/${valId}/`);
        const answers = valData.answers || [];
        const status = valData.status;
        const score = valData.final_score || 0;
        
        console.log(`   - پاسخ‌ها: ${answers.length}, وضعیت: ${status}`);
        
        const scores: Record<number, number> = {};
        answers.forEach((answer: any) => {
          if (answer.score !== null && answer.score !== undefined) {
            scores[answer.question] = answer.score;
          }
        });
        setSelectedScores(scores);
        
        if (status === 'completed') {
          setIsViewMode(true);
          setIsComplete(true);
          setFinalScore(score);
          console.log(`✅ ارزیابی تکمیل شده`);
        } else if (Object.keys(scores).length > 0) {
          setIsViewMode(false);
          setIsComplete(false);
          console.log(`📝 ارزیابی ناقص با ${Object.keys(scores).length} پاسخ`);
        } else {
          setIsViewMode(false);
          setIsComplete(false);
          console.log('📝 ارزیابی جدید - بدون پاسخ');
        }
      } else {
        console.error('❌ valId هنوز null است!');
        setError('خطا در ایجاد یا پیدا کردن ارزیابی. لطفاً صفحه را مجدداً بارگذاری کنید.');
        setLoading(false);
        return;
      }

      setLoading(false);
    } catch (error: any) {
      console.error('❌ Error:', error);
      setError(error.message || 'خطا در دریافت اطلاعات');
      setLoading(false);
    }
  };

  const handleScoreSelect = async (questionId: number, score: number) => {
    if (isViewMode) return;
    
    setSelectedScores(prev => ({ ...prev, [questionId]: score }));
    setExpandedGuide({ questionId, score });
    setShowEvidence(prev => ({ ...prev, [questionId]: true }));
    
    if (!valuationId) {
      console.warn('⚠️ valuationId هنوز ست نشده!');
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('question_id', questionId.toString());
      formData.append('score', score.toString());
      
      const files = evidenceFiles[questionId] || {};
      console.log('📤 فایل‌های شواهد برای سوال', questionId, ':', files);
      
      if (files.interview) {
        console.log('   ✅ اضافه کردن مصاحبه:', files.interview.name);
        formData.append('evidence_interview', files.interview);
      }
      if (files.document) {
        console.log('   ✅ اضافه کردن سند:', files.document.name);
        formData.append('evidence_document', files.document);
      }
      if (files.process) {
        console.log('   ✅ اضافه کردن فرآیند:', files.process.name);
        formData.append('evidence_process', files.process);
      }
      if (files.database) {
        console.log('   ✅ اضافه کردن پایگاه داده:', files.database.name);
        formData.append('evidence_database', files.database);
      }
      
      const response = await api.post(
        `/intangible/asset-valuations/${valuationId}/submit_answer_with_evidence/`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      
      console.log(`✅ پاسخ سوال ${questionId} با امتیاز ${score} ثبت شد`, response.data);
    } catch (error: any) {
      console.error('❌ خطا در ثبت پاسخ:', error);
      console.error('   Response:', error.response?.data);
    }
  };

  const handleEvidenceChange = (questionId: number, files: EvidenceFiles) => {
    console.log('📎 تغییر شواهد برای سوال', questionId, ':', files);
    setEvidenceFiles(prev => ({ ...prev, [questionId]: files }));
  };

  const removeEvidenceFile = (questionId: number, type: string) => {
    setEvidenceFiles(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], [type]: null }
    }));
    const score = selectedScores[questionId];
    if (score && valuationId) {
      handleScoreSelect(questionId, score);
    }
  };

  const handleSubmitAll = async () => {
    if (isViewMode) {
      router.push('/dashboard/intangible/valuation/completed');
      return;
    }
    
    let currentValuationId = valuationId;
    
    if (!currentValuationId) {
      try {
        const allValuations = await fetchAllValuations();
        const found = allValuations.find((v: ValuationItem) => v.asset === parseInt(assetId));
        
        if (found) {
          currentValuationId = found.id;
          setValuationId(currentValuationId);
        } else {
          const assetData = await api.get(`/intangible/screened-assets/${assetId}/`);
          let assetTypeId = assetData.data.asset_type?.id || 1;
          
          const response = await api.post('/intangible/asset-valuations/', {
            asset: parseInt(assetId),
            asset_type: assetTypeId,
            status: 'draft'
          });
          
          if (response.data && response.data.id) {
            currentValuationId = response.data.id;
            setValuationId(currentValuationId);
          }
        }
      } catch (err) {
        console.error('❌ خطا:', err);
        alert('ارزیابی یافت نشد!');
        return;
      }
    }
    
    if (!currentValuationId) {
      alert('ارزیابی یافت نشد!');
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
        const formData = new FormData();
        formData.append('question_id', questionId);
        formData.append('score', score.toString());
        
        const files = evidenceFiles[parseInt(questionId)] || {};
        if (files.interview) formData.append('evidence_interview', files.interview);
        if (files.document) formData.append('evidence_document', files.document);
        if (files.process) formData.append('evidence_process', files.process);
        if (files.database) formData.append('evidence_database', files.database);
        
        await api.post(
          `/intangible/asset-valuations/${currentValuationId}/submit_answer_with_evidence/`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
      }

      const { data } = await api.post(`/intangible/asset-valuations/${currentValuationId}/complete/`);
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
        <button onClick={() => window.location.reload()} className="text-primary hover:underline">
          🔄 بارگذاری مجدد صفحه
        </button>
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
            {assetTypeName && (
              <p className="text-xs text-gray-400 mt-1">
                نوع: {assetTypeName}
              </p>
            )}
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
          const files = evidenceFiles[question.id] || {};
          const showEvidenceUpload = showEvidence[question.id] || false;

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
                  <div className="mt-2">
                    <button
                      onClick={() => toggleEvidence(question.id)}
                      className="text-xs text-dark-green hover:text-dark-green/70 flex items-center gap-1"
                    >
                      {showEvidenceUpload ? ' بستن آپلود شواهد' : '📎 آپلود شواهد'}
                    </button>
                  </div>
                )}

                {showEvidenceUpload && !showViewMode && selectedScore !== null && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <File className="w-4 h-4" />
                      <span>شواهد (اختیاری):</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {EVIDENCE_TYPES.map((type) => {
                        const hasFile = files[type.key as keyof EvidenceFiles];
                        return (
                          <div
                            key={type.key}
                            className={`relative border-2 rounded-lg p-2 transition-all ${
                              hasFile ? `${type.bg} border-green-300` : 'border-dashed border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.xlsx,.pptx,.txt,.mp3,.wav,.m4a,.mp4,.mov,.bpmn,.xml,.json,.sql,.csv"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                if (file) {
                                  const newFiles = { ...files, [type.key]: file };
                                  handleEvidenceChange(question.id, newFiles);
                                  const score = selectedScores[question.id];
                                  if (score && valuationId) {
                                    handleScoreSelect(question.id, score);
                                  }
                                }
                              }}
                              className="hidden"
                              id={`evidence-${question.id}-${type.key}`}
                              disabled={showViewMode || submitting}
                            />
                            {hasFile ? (
                              <div className="flex items-center gap-1">
                                <span className="text-lg">{type.icon}</span>
                                <span className="text-xs truncate flex-1">
                                  {files[type.key as keyof EvidenceFiles]?.name || 'فایل'}
                                </span>
                                <button
                                  onClick={() => removeEvidenceFile(question.id, type.key)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <label
                                htmlFor={`evidence-${question.id}-${type.key}`}
                                className="flex flex-col items-center gap-0.5 cursor-pointer hover:opacity-70"
                              >
                                <span className="text-lg">{type.icon}</span>
                                <span className="text-[10px] text-gray-500">{type.label}</span>
                                <Upload className="w-3 h-3 text-gray-400" />
                              </label>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      💡 می‌توانید برای هر سوال، چندین نوع شواهد متفاوت آپلود کنید
                    </p>
                  </div>
                )}

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
