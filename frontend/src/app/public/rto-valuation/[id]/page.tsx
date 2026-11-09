"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, ArrowLeft, CheckCircle, Save } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface Question {
  id: number;
  text: string;
  dimension: string;
  hint: string;
}

export default function RTOValuationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const assetId = parseInt(id);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [assetName, setAssetName] = useState("");
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [files, setFiles] = useState<Record<number, File | null>>({});
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [assetId]);

  const fetchQuestions = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/intangible/public/rto-valuation/${assetId}/questions/`);
      setQuestions(data.questions || []);
      setAssetName(data.asset_name || "");
    } catch (err) {
      console.error(err);
      toast.error("خطا در بارگذاری سوالات");
    } finally {
      setLoading(false);
    }
  };

  const updateResponse = (questionId: number, score: number) => {
    setResponses((prev) => ({ ...prev, [questionId]: score }));
  };

  const handleFileChange = (questionId: number, file: File | null) => {
    setFiles((prev) => ({ ...prev, [questionId]: file }));
  };

  const handleSubmit = async () => {
    const unanswered = questions.filter((q) => !responses[q.id]);
    if (unanswered.length > 0) {
      toast.error(`لطفاً به ${unanswered.length} سوال باقی‌مانده پاسخ دهید`);
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      
      // پاسخ‌ها
      const responsesArray = questions.map((q) => ({
        question_id: q.id,
        score: responses[q.id],
      }));
      formData.append('responses', JSON.stringify(responsesArray));
      
      // فایل‌ها
      Object.entries(files).forEach(([qid, file]) => {
        if (file) {
          formData.append(`file_${qid}`, file);
        }
      });

      await axios.post(
        `${API_BASE}/intangible/public/rto-valuation/${assetId}/submit/`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setSubmitted(true);
      toast.success("ارزیابی با موفقیت ثبت شد!");
    } catch (err) {
      console.error(err);
      toast.error("خطا در ثبت ارزیابی");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" dir="rtl">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ارزیابی ثبت شد!</h1>
          <p className="text-gray-600 mb-6">
            ارزیابی دارایی «{assetName}» با موفقیت ذخیره شد. نتیجه پس از بررسی نهایی، به ایمیل شما ارسال خواهد شد.
          </p>
          <button
            onClick={() => router.push("/public/rto-screening")}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            ثبت دارایی جدید
          </button>
        </div>
      </div>
    );
  }

  // نمایش ۵ سوال در هر مرحله
  const QUESTIONS_PER_PAGE = 5;
  const totalSteps = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const startIdx = step * QUESTIONS_PER_PAGE;
  const endIdx = startIdx + QUESTIONS_PER_PAGE;
  const currentQuestions = questions.slice(startIdx, endIdx);

  const answeredInCurrentStep = currentQuestions.filter(
    (q) => responses[q.id] || files[q.id]
  ).length;
  const totalAnswered = questions.filter((q) => responses[q.id] || files[q.id]).length;
  const progress = (totalAnswered / questions.length) * 100;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 py-10 px-4"
      style={{ fontFamily: "Vazirmatn, Tahoma, sans-serif" }}
      dir="rtl"
    >
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-emerald-900">ارزیابی دارایی</h1>
          <p className="text-gray-600 mt-1">{assetName}</p>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
          <div className="flex justify-between text-xs text-gray-600 mb-2">
            <span>مرحله {step + 1} از {totalSteps}</span>
            <span>{Math.round(progress)}% تکمیل</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4 mb-6">
          {currentQuestions.map((q, idx) => (
            <div key={q.id} className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {startIdx + idx + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{q.text}</p>
                  {q.hint && (
                    <p className="text-xs text-gray-500 mt-1 italic">{q.hint}</p>
                  )}
                </div>
              </div>

              {/* ۵ سطح لیکرت */}
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    onClick={() => updateResponse(q.id, score)}
                    className={`p-2 rounded-lg text-sm font-bold transition-all ${
                      responses[q.id] === score
                        ? "bg-emerald-600 text-white scale-105 shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-emerald-100"
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-1">
                <span>خیلی کم</span>
                <span>خیلی زیاد</span>
              </div>
              
              {/* 🔥 آپلود شاهد */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer hover:text-emerald-600">
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileChange(q.id, e.target.files?.[0] || null)}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx,.zip"
                  />
                  <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded hover:bg-emerald-100">
                    📎 {files[q.id] ? files[q.id]!.name : "آپلود شاهد (اختیاری)"}
                  </span>
                </label>
                {files[q.id] && (
                  <button
                    type="button"
                    onClick={() => handleFileChange(q.id, null)}
                    className="text-xs text-red-500 hover:text-red-700 mr-2"
                  >
                    حذف
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              مرحله قبل
            </button>
          )}

          {step < totalSteps - 1 ? (
            <button
              onClick={() => {
                if (answeredInCurrentStep < currentQuestions.length) {
                  toast.error("لطفاً به همه سوالات این مرحله پاسخ دهید");
                  return;
                }
                setStep(step + 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 flex items-center justify-center gap-2"
            >
              مرحله بعد
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || Object.keys(responses).length < questions.length}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  در حال ثبت...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  ثبت نهایی ارزیابی
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
