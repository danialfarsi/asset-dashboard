/**
 * 🎯 پرسشنامه سنجش بلوغ
 * مسیر: /dashboard/intangible/maturity/[id]
 */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, ArrowLeft, Save, Send, Loader2, CheckCircle,
  AlertCircle, FileText, Upload, Award, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { maturityApi } from '@/services/engine05/maturity-api';
import { toast } from 'sonner';

interface Question {
  id: number;
  code: string;
  number: number;
  text: string;
  component_name: string;
  component_number: number;
  component_domain: string;
  question_type: string;
}

interface Component {
  id: number;
  code: string;
  number: number;
  name: string;
  domain: string;
  domain_display: string;
}

const SCALE_OPTIONS = [
  { value: 1, label: 'غیرموجود / بحرانی', description: 'هیچ اقدام یا سازوکاری وجود ندارد', color: 'red' },
  { value: 2, label: 'آغازین / موردی', description: 'اقدام پراکنده، فردی و غیرمصوب', color: 'orange' },
  { value: 3, label: 'تعریف‌شده / استاندارد', description: 'مصوب، مستند و به‌طور منظم اجرا می‌شود', color: 'amber' },
  { value: 4, label: 'مدیریت‌شده / اندازه‌گیری‌شده', description: 'با شاخص پایش می‌شود و مبنای تصمیم است', color: 'blue' },
  { value: 5, label: 'بهینه / هوشمند', description: 'خودکار، پیش‌دستانه و خوداصلاح‌گر', color: 'emerald' },
];

export default function MaturityQuestionnairePage() {
  const params = useParams();
  const router = useRouter();
  const assessmentId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [assessment, setAssessment] = useState<any>(null);
  const [responses, setResponses] = useState<Record<number, any>>({});
  const [currentComponent, setCurrentComponent] = useState(1);
  const [showScale, setShowScale] = useState(true);

  const toFa = (num: any): string => {
    if (num === null || num === undefined) return '—';
    return String(num).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
  };

  useEffect(() => {
    loadData();
  }, [assessmentId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [assessRes, questionsRes, componentsRes] = await Promise.all([
        maturityApi.getAssessment(assessmentId),
        maturityApi.getQuestions({ type: 'measure' }),
        maturityApi.getComponents(),
      ]);

      setAssessment(assessRes.data);
      setQuestions(questionsRes.data);
      setComponents(componentsRes.data);

      // پر کردن پاسخ‌های قبلی
      const existingResponses: Record<number, any> = {};
      (assessRes.data.responses || []).forEach((r: any) => {
        existingResponses[r.question] = {
          score: r.score,
          has_evidence: r.has_evidence,
          evidence_type: r.evidence_type,
          evidence_description: r.evidence_description,
          note: r.note,
        };
      });
      setResponses(existingResponses);
    } catch (err) {
      console.error(err);
      toast.error('خطا در بارگذاری');
    } finally {
      setLoading(false);
    }
  };

  const updateResponse = (questionId: number, field: string, value: any) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || { score: 0, has_evidence: false }),
        [field]: value,
      },
    }));
  };

  const currentQuestions = questions.filter(
    (q) => q.component_number === currentComponent
  );

  const answeredCount = Object.values(responses).filter((r) => r.score > 0).length;
  const totalQuestions = questions.length;
  const progress = Math.round((answeredCount / totalQuestions) * 100);

  const handleSubmit = async () => {
    if (answeredCount < totalQuestions) {
      toast.error(`لطفاً به همه پرسش‌ها پاسخ دهید (${answeredCount}/${totalQuestions})`);
      return;
    }

    setSubmitting(true);
    try {
      const payload = Object.entries(responses).map(([qid, data]: [string, any]) => ({
        question_id: Number(qid),
        score: data.score,
        has_evidence: data.has_evidence || false,
        evidence_type: data.evidence_type || '',
        evidence_description: data.evidence_description || '',
        note: data.note || '',
      }));

      await maturityApi.submitResponses(assessmentId, payload);
      toast.success('پاسخ‌ها ذخیره شد');

      // حالا محاسبه کن
      setCalculating(true);
      await maturityApi.calculate(assessmentId, { has_external_auditor: false });
      toast.success('محاسبه انجام شد');
      
      router.push(`/dashboard/intangible/maturity/${assessmentId}/results`);
    } catch (err: any) {
      console.error(err);
      toast.error('خطا در ثبت');
    } finally {
      setSubmitting(false);
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#04241D]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 rtl" style={{ fontFamily: 'Vazirmatn, Tahoma, sans-serif' }}>
      {/* Header */}
      <Link
        href="/dashboard/intangible/maturity"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#04241D]"
      >
        <ArrowRight className="h-4 w-4" />
        بازگشت به لیست
      </Link>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#04241D]" />
            <span className="font-bold text-sm">سنجش بلوغ IAMS</span>
          </div>
          <span className="text-xs text-gray-500">
            {toFa(answeredCount)} از {toFa(totalQuestions)} پاسخ داده شده
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-l from-[#04241D] to-[#0B4A3C] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[10px] text-gray-500 mt-1 text-center">{toFa(progress)}٪ تکمیل</p>
      </div>

      {/* Scale Reference */}
      {showScale && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-bold text-blue-800 mb-2">📊 مقیاس پاسخ:</p>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                  {SCALE_OPTIONS.map((opt) => (
                    <div key={opt.value} className="bg-white rounded-lg p-2 border text-center">
                      <div className={`text-lg font-bold text-${opt.color}-600`}>{toFa(opt.value)}</div>
                      <div className="text-[10px] font-bold text-gray-700">{opt.label}</div>
                      <div className="text-[9px] text-gray-500 mt-1">{opt.description}</div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-blue-700 mt-2">
                  ⚠️ قاعده طلایی: نمره ≥ ۳ باید با شاهد پشتیبانی شود، وگرنه خودکار به ۲ تنزل می‌یابد
                </p>
              </div>
              <button
                onClick={() => setShowScale(false)}
                className="text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Component Navigation */}
      <div className="grid grid-cols-4 gap-2">
        {['hardware', 'brainware', 'orgware', 'software'].map((domain) => {
          const domainComponents = components.filter((c) => c.domain === domain);
          const domainNames: Record<string, string> = {
            hardware: 'سخت‌افزار',
            brainware: 'مغزافزار',
            orgware: 'سازمان‌افزار',
            software: 'نرم‌افزار',
          };
          return (
            <div key={domain} className="bg-white rounded-lg border p-2">
              <p className="text-[10px] font-bold text-gray-600 mb-1">
                {domainNames[domain]}
              </p>
              <div className="space-y-0.5">
                {domainComponents.map((c) => {
                  const compQuestions = questions.filter((q) => q.component_number === c.number);
                  const answered = compQuestions.filter((q) => responses[q.id]?.score > 0).length;
                  const total = compQuestions.length;
                  const isActive = currentComponent === c.number;
                  
                  return (
                    <button
                      key={c.id}
                      onClick={() => setCurrentComponent(c.number)}
                      className={`w-full text-right px-2 py-1 rounded text-[9px] transition ${
                        isActive
                          ? 'bg-[#04241D] text-white font-bold'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      {toFa(c.number)}. {c.name}
                      <span className={`mr-1 ${isActive ? 'text-white/70' : 'text-gray-400'}`}>
                        ({toFa(answered)}/{toFa(total)})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Questions */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            مؤلفه {toFa(currentComponent)}: {components.find((c) => c.number === currentComponent)?.name}
          </h2>

          <div className="space-y-4">
            {currentQuestions.map((q) => {
              const resp = responses[q.id] || { score: 0, has_evidence: false };
              const needsEvidence = resp.score >= 3;
              const hasWarning = needsEvidence && !resp.has_evidence;
              
              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-lg border-2 transition ${
                    resp.score > 0
                      ? hasWarning
                        ? 'border-amber-200 bg-amber-50/30'
                        : 'border-emerald-200 bg-emerald-50/30'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#04241D] text-white text-xs font-bold">
                      {toFa(q.number)}
                    </span>
                    <p className="text-sm leading-7 text-gray-800 flex-1">{q.text}</p>
                  </div>

                  {/* Score Buttons */}
                  <div className="grid grid-cols-5 gap-2 mb-3">
                    {SCALE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => updateResponse(q.id, 'score', opt.value)}
                        className={`p-2 rounded-lg border-2 text-center transition ${
                          resp.score === opt.value
                            ? `border-${opt.color}-500 bg-${opt.color}-50`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`text-lg font-bold ${
                          resp.score === opt.value ? `text-${opt.color}-600` : 'text-gray-400'
                        }`}>
                          {toFa(opt.value)}
                        </div>
                        <div className="text-[9px] text-gray-600">{opt.label}</div>
                      </button>
                    ))}
                  </div>

                  {/* Evidence Section (اگر نمره ≥ 3) */}
                  {needsEvidence && (
                    <div className="mt-3 p-3 bg-white rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={resp.has_evidence || false}
                          onChange={(e) => updateResponse(q.id, 'has_evidence', e.target.checked)}
                          className="rounded border-gray-300 text-[#04241D]"
                        />
                        <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          شاهد مستند دارم
                        </label>
                      </div>

                      {resp.has_evidence && (
                        <div className="space-y-2 mt-2">
                          <select
                            value={resp.evidence_type || ''}
                            onChange={(e) => updateResponse(q.id, 'evidence_type', e.target.value)}
                            className="w-full text-xs border rounded px-2 py-1"
                          >
                            <option value="">نوع شاهد...</option>
                            <option value="document">سند مصوب</option>
                            <option value="system">سامانه</option>
                            <option value="meeting">صورت‌جلسه</option>
                            <option value="data">داده عملکردی</option>
                            <option value="interview">مصاحبه</option>
                            <option value="other">سایر</option>
                          </select>
                          <input
                            type="text"
                            value={resp.evidence_description || ''}
                            onChange={(e) => updateResponse(q.id, 'evidence_description', e.target.value)}
                            placeholder="توضیح شاهد..."
                            className="w-full text-xs border rounded px-2 py-1"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {hasWarning && (
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-amber-700">
                      <AlertCircle className="w-3 h-3" />
                      بدون شاهد، نمره به ۲ تنزل می‌یابد
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentComponent(Math.max(1, currentComponent - 1))}
              disabled={currentComponent === 1}
              className="text-xs"
            >
              <ChevronRight className="w-4 h-4 ml-1" />
              مؤلفه قبلی
            </Button>
            <span className="text-xs text-gray-500">
              {toFa(currentComponent)} از {toFa(16)}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentComponent(Math.min(16, currentComponent + 1))}
              disabled={currentComponent === 16}
              className="text-xs"
            >
              مؤلفه بعدی
              <ChevronLeft className="w-4 h-4 mr-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-2">
        <Button
          onClick={handleSubmit}
          disabled={submitting || calculating || answeredCount < totalQuestions}
          className="bg-[#04241D] hover:bg-[#0B4A3C]"
        >
          {submitting || calculating ? (
            <>
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              {calculating ? 'در حال محاسبه...' : 'در حال ثبت...'}
            </>
          ) : (
            <>
              <Send className="w-4 h-4 ml-2" />
              ثبت و محاسبه ({toFa(answeredCount)}/{toFa(totalQuestions)})
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
