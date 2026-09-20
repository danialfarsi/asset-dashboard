'use client';

import { Label } from '@/components/ui/label';
import { I_QUESTIONS, DiscoveryAnswers } from '@/types/discovery.types';
import {
  Check,
  CheckCircle2,
  Fingerprint,
  Info,
  KeyRound,
  X,
  XCircle,
} from 'lucide-react';

interface Step2Props {
  answers: DiscoveryAnswers;
  setAnswers: (answers: DiscoveryAnswers) => void;
}

export function Step2_Identifiability({ answers, setAnswers }: Step2Props) {
  const handleChange = (id: keyof DiscoveryAnswers, value: boolean) => {
    setAnswers({ ...answers, [id]: value });
  };

  const iStatus = answers.i1 || answers.i2 || answers.i4;
  const iScore = [
    answers.i1,
    answers.i2,
    answers.i3,
    answers.i4,
    answers.i5,
    answers.i6,
    answers.i7,
  ].filter(Boolean).length;

  const keyScore = [answers.i1, answers.i2, answers.i4].filter(Boolean).length;

  return (
    <div
      dir="rtl"
      className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white font-vazir shadow-[0_14px_45px_rgba(15,23,42,0.055)]"
    >
      {/* Header */}
      <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-l from-blue-50/80 via-white to-white px-5 py-6 sm:px-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-blue-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-8 h-44 w-44 rounded-full bg-emerald-100/30 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-dark-green text-white shadow-lg shadow-emerald-950/10">
              <Fingerprint className="h-5 w-5" />
            </div>

            <div>
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-100/80 px-2.5 py-1 text-[9px] font-black text-blue-700">
                  شرط ۲ از فرآیند شناسایی
                </span>
                <span className="text-[10px] font-bold tracking-[0.12em] text-slate-400">
                  IDENTIFIABILITY TEST
                </span>
              </div>

              <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
                شناسایی‌پذیری دارایی
              </h2>

              <p className="mt-1.5 max-w-2xl text-xs leading-6 text-slate-500">
                دارایی باید قابل شناسایی و تفکیک باشد. برای احراز این شرط، حداقل یکی از معیارهای
                <span className="mx-1 font-black text-blue-700">I1</span>
                یا
                <span className="mx-1 font-black text-blue-700">I2</span>
                یا
                <span className="mx-1 font-black text-blue-700">I4</span>
                باید برقرار باشد.
              </p>
            </div>
          </div>

          {/* Status card */}
          <div
            className={`min-w-[190px] rounded-[22px] border p-4 ${
              iStatus
                ? 'border-emerald-100 bg-emerald-50/70'
                : 'border-rose-100 bg-rose-50/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold text-slate-400">امتیاز فعلی</p>
                <div className="mt-1 flex items-baseline gap-1">
                  <span
                    className={`text-2xl font-black ${
                      iStatus ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                  >
                    {iScore}
                  </span>
                  <span className="text-xs font-bold text-slate-400">/ ۷</span>
                </div>
              </div>

              <div
                className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                  iStatus
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-600'
                }`}
              >
                {iStatus ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-400">
                معیار کلیدی مثبت
              </span>
              <span
                className={`rounded-full px-2 py-1 text-[9px] font-black ${
                  keyScore > 0
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-white text-rose-600'
                }`}
              >
                {keyScore} / ۳
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-7">
        {/* Key rule */}
        <div
          className={`mb-5 rounded-[20px] border p-4 ${
            iStatus
              ? 'border-emerald-100 bg-emerald-50/40'
              : 'border-blue-100 bg-blue-50/50'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                iStatus
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              <KeyRound className="h-4 w-4" />
            </div>

            <div>
              <p className="text-xs font-black text-slate-700">
                قاعده احراز این مرحله
              </p>
              <p className="mt-1 text-[10px] leading-5 text-slate-500">
                امتیاز کل ۷ معیار برای نمایش وضعیت ارزیابی استفاده می‌شود؛ اما عبور از این شرط
                مستقیماً به مثبت بودن حداقل یکی از سه معیار کلیدی I1، I2 یا I4 وابسته است.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-800">
              معیارهای شناسایی‌پذیری
            </h3>
            <p className="mt-1 text-[10px] text-slate-400">
              معیارهای کلیدی با نشان اختصاصی مشخص شده‌اند.
            </p>
          </div>

          <div className="hidden items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[9px] font-black text-blue-700 sm:flex">
            <KeyRound className="h-3.5 w-3.5" />
            I1 · I2 · I4 کلیدی
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-3">
          {I_QUESTIONS.map((q, index) => {
            const isKey = q.id === 'i1' || q.id === 'i2' || q.id === 'i4';
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
                      : isKey
                        ? 'border-blue-200 bg-gradient-to-l from-blue-50/60 via-white to-white'
                        : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div
                  className={`absolute bottom-0 right-0 top-0 w-1 ${
                    isYes
                      ? 'bg-emerald-500'
                      : isNo
                        ? 'bg-rose-400'
                        : isKey
                          ? 'bg-blue-400'
                          : 'bg-transparent'
                  }`}
                />

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[10px] font-black ${
                      isYes
                        ? 'bg-emerald-100 text-emerald-700'
                        : isNo
                          ? 'bg-rose-100 text-rose-600'
                          : isKey
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {String(q.id).toUpperCase() || index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Label
                        className={`text-sm font-black leading-6 ${
                          isKey ? 'text-blue-800' : 'text-slate-800'
                        }`}
                      >
                        {q.label}
                      </Label>

                      {isKey && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[8px] font-black text-blue-700">
                          <KeyRound className="h-2.5 w-2.5" />
                          معیار کلیدی
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-[10px] leading-5 text-slate-400 sm:text-xs">
                      {q.description}
                    </p>
                  </div>

                  <div className="grid shrink-0 grid-cols-2 gap-2 sm:w-[180px]">
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

        {/* Final result */}
        <div
          className={`mt-5 overflow-hidden rounded-[22px] border p-4 sm:p-5 ${
            iStatus
              ? 'border-emerald-200 bg-gradient-to-l from-emerald-50 via-white to-white'
              : 'border-rose-200 bg-gradient-to-l from-rose-50 via-white to-white'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                iStatus
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-600'
              }`}
            >
              {iStatus ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p
                className={`text-sm font-black ${
                  iStatus ? 'text-emerald-800' : 'text-rose-800'
                }`}
              >
                {iStatus
                  ? 'شرط شناسایی‌پذیری احراز شد'
                  : 'شرط شناسایی‌پذیری احراز نشده است'}
              </p>

              <p
                className={`mt-1 text-[10px] leading-5 ${
                  iStatus
                    ? 'text-emerald-700/75'
                    : 'text-rose-700/75'
                }`}
              >
                {iStatus
                  ? `حداقل یکی از معیارهای کلیدی I1، I2 یا I4 برقرار است. در مجموع ${iScore} معیار از ۷ معیار پاسخ مثبت دارد.`
                  : 'برای عبور از این مرحله باید حداقل یکی از معیارهای کلیدی I1، I2 یا I4 پاسخ مثبت داشته باشد.'}
              </p>
            </div>

            <div className="hidden shrink-0 items-center gap-1 rounded-full bg-white/80 px-3 py-1.5 text-[9px] font-black shadow-sm ring-1 ring-black/5 sm:flex">
              <Info className="h-3 w-3" />
              {iScore} / ۷
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
