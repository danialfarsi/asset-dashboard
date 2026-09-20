'use client';

import { Label } from '@/components/ui/label';
import { V_QUESTIONS, DiscoveryAnswers } from '@/types/discovery.types';
import {
  Check,
  CheckCircle2,
  CircleDollarSign,
  Info,
  Sparkles,
  TrendingUp,
  X,
  XCircle,
} from 'lucide-react';

interface Step4Props {
  answers: DiscoveryAnswers;
  setAnswers: (answers: DiscoveryAnswers) => void;
}

export function Step4_ValueCreation({ answers, setAnswers }: Step4Props) {
  const handleChange = (id: keyof DiscoveryAnswers, value: boolean) => {
    setAnswers({ ...answers, [id]: value });
  };

  const vScore = [
    answers.v1,
    answers.v2,
    answers.v3,
    answers.v4,
    answers.v5,
    answers.v6,
    answers.v7,
    answers.v8,
    answers.v9,
  ].filter(Boolean).length;

  const passed = vScore >= 1;
  const highPriority = vScore >= 5;
  const progress = (vScore / 9) * 100;

  return (
    <div
      dir="rtl"
      className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white font-vazir shadow-[0_14px_45px_rgba(15,23,42,0.055)]"
    >
      {/* Header */}
      <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-l from-emerald-50/75 via-white to-white px-5 py-6 sm:px-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-emerald-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-8 h-44 w-44 rounded-full bg-amber-100/30 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-dark-green text-white shadow-lg shadow-emerald-950/10">
              <CircleDollarSign className="h-5 w-5" />
            </div>

            <div>
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-100/80 px-2.5 py-1 text-[9px] font-black text-emerald-700">
                  شرط ۴ از فرآیند شناسایی
                </span>
                <span className="text-[10px] font-bold tracking-[0.12em] text-slate-400">
                  VALUE CREATION TEST
                </span>
              </div>

              <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
                ارزش‌آفرینی دارایی
              </h2>

              <p className="mt-1.5 max-w-2xl text-xs leading-6 text-slate-500">
                دارایی باید حداقل یک مسیر ارزش‌آفرینی مشخص داشته باشد. افزایش تعداد مسیرهای مثبت،
                اولویت ارزش‌گذاری دارایی را تقویت می‌کند.
              </p>
            </div>
          </div>

          {/* Score */}
          <div
            className={`min-w-[190px] rounded-[22px] border p-4 ${
              highPriority
                ? 'border-emerald-200 bg-emerald-50/80'
                : passed
                  ? 'border-emerald-100 bg-emerald-50/60'
                  : 'border-rose-100 bg-rose-50/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold text-slate-400">
                  مسیرهای شناسایی‌شده
                </p>
                <div className="mt-1 flex items-baseline gap-1">
                  <span
                    className={`text-2xl font-black ${
                      passed ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {vScore}
                  </span>
                  <span className="text-xs font-bold text-slate-400">/ ۹</span>
                </div>
              </div>

              <div
                className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                  highPriority
                    ? 'bg-emerald-600 text-white'
                    : passed
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-600'
                }`}
              >
                {highPriority ? (
                  <Sparkles className="h-5 w-5" />
                ) : passed ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
              </div>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  passed ? 'bg-emerald-500' : 'bg-rose-400'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="mt-2 text-[9px] font-bold text-slate-400">
              حداقل مورد نیاز: ۱ مسیر
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-7">
        {/* Rule */}
        <div className="mb-5 flex items-start gap-3 rounded-[20px] border border-blue-100 bg-blue-50/45 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <Info className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-700">
              قاعده ارزیابی ارزش‌آفرینی
            </p>
            <p className="mt-1 text-[10px] leading-5 text-slate-500">
              وجود یک مسیر مثبت برای احراز این شرط کافی است. در عین حال، دارایی‌هایی که ۵ مسیر
              یا بیشتر دارند به‌عنوان دارایی با اولویت بالاتر برای ارزش‌گذاری نمایش داده می‌شوند.
            </p>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-800">
              مسیرهای بالقوه ارزش‌آفرینی
            </h3>
            <p className="mt-1 text-[10px] text-slate-400">
              هر مورد را بر اساس اثر واقعی یا قابل انتظار دارایی انتخاب کنید.
            </p>
          </div>

          {highPriority && (
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[9px] font-black text-emerald-700 sm:flex">
              <Sparkles className="h-3.5 w-3.5" />
              اولویت بالای ارزش‌گذاری
            </span>
          )}
        </div>

        {/* Questions */}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {V_QUESTIONS.map((q) => {
            const answer = answers[q.id as keyof DiscoveryAnswers];
            const isYes = answer === true;
            const isNo = answer === false;

            return (
              <div
                key={q.id}
                className={`group relative overflow-hidden rounded-[22px] border p-4 transition-all duration-200 sm:p-5 ${
                  isYes
                    ? 'border-emerald-200 bg-gradient-to-l from-emerald-50/65 via-white to-white shadow-[0_7px_22px_rgba(5,150,105,.055)]'
                    : isNo
                      ? 'border-rose-100 bg-gradient-to-l from-rose-50/40 via-white to-white'
                      : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div
                  className={`absolute bottom-0 right-0 top-0 w-1 ${
                    isYes
                      ? 'bg-emerald-500'
                      : isNo
                        ? 'bg-rose-400'
                        : 'bg-transparent'
                  }`}
                />

                <div className="flex h-full flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[10px] font-black uppercase ${
                        isYes
                          ? 'bg-emerald-100 text-emerald-700'
                          : isNo
                            ? 'bg-rose-100 text-rose-600'
                            : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {String(q.id).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <Label className="text-sm font-black leading-6 text-slate-800">
                        {q.label}
                      </Label>
                      <p className="mt-1 text-[10px] leading-5 text-slate-400 sm:text-xs">
                        {q.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleChange(q.id as keyof DiscoveryAnswers, true)
                      }
                      className={`flex h-10 items-center justify-center gap-1.5 rounded-xl border text-xs font-black transition-all ${
                        isYes
                          ? 'border-emerald-600 bg-dark-green text-white shadow-md shadow-emerald-950/10'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                    >
                      {isYes && <Check className="h-3.5 w-3.5" />}
                      بله
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleChange(q.id as keyof DiscoveryAnswers, false)
                      }
                      className={`flex h-10 items-center justify-center gap-1.5 rounded-xl border text-xs font-black transition-all ${
                        isNo
                          ? 'border-rose-500 bg-rose-500 text-white shadow-md shadow-rose-500/10'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600'
                      }`}
                    >
                      {isNo && <X className="h-3.5 w-3.5" />}
                      خیر
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Final status */}
        <div
          className={`mt-5 overflow-hidden rounded-[22px] border p-4 sm:p-5 ${
            passed
              ? 'border-emerald-200 bg-gradient-to-l from-emerald-50 via-white to-white'
              : 'border-rose-200 bg-gradient-to-l from-rose-50 via-white to-white'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                passed
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-600'
              }`}
            >
              {passed ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p
                className={`text-sm font-black ${
                  passed ? 'text-emerald-800' : 'text-rose-800'
                }`}
              >
                {passed
                  ? 'شرط ارزش‌آفرینی احراز شد'
                  : 'شرط ارزش‌آفرینی احراز نشده است'}
              </p>

              <p
                className={`mt-1 text-[10px] leading-5 ${
                  passed ? 'text-emerald-700/75' : 'text-rose-700/75'
                }`}
              >
                {passed
                  ? `${vScore} مسیر ارزش‌آفرینی برای این دارایی شناسایی شده است.`
                  : 'در حال حاضر هیچ مسیر ارزش‌آفرینی برای دارایی شناسایی نشده و شرط توجیه اقتصادی احراز نشده است.'}
              </p>

              {highPriority && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-200/70 bg-white/65 p-3">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <p className="text-[9px] font-bold leading-5 text-emerald-800">
                    اولویت بالای ارزش‌گذاری — این دارایی دارای {vScore} مسیر ارزش‌آفرینی است.
                  </p>
                </div>
              )}
            </div>

            <span
              className={`hidden shrink-0 rounded-full px-3 py-1.5 text-[9px] font-black shadow-sm ring-1 ring-black/5 sm:inline-flex ${
                passed
                  ? 'bg-white/80 text-emerald-700'
                  : 'bg-white/80 text-rose-600'
              }`}
            >
              {vScore} / ۹
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
