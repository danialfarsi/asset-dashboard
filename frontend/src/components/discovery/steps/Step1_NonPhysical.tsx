'use client';

import { Label } from '@/components/ui/label';
import { N_QUESTIONS, DiscoveryAnswers } from '@/types/discovery.types';
import {
  Check,
  CheckCircle2,
  CircleHelp,
  Info,
  ShieldCheck,
  X,
} from 'lucide-react';

interface Step1Props {
  answers: DiscoveryAnswers;
  setAnswers: (answers: DiscoveryAnswers) => void;
}

export function Step1_NonPhysical({ answers, setAnswers }: Step1Props) {
  const handleChange = (id: keyof DiscoveryAnswers, value: boolean) => {
    setAnswers({ ...answers, [id]: value });
  };

  const nScore = [
    answers.n1,
    answers.n2,
    answers.n3,
    answers.n4,
    answers.n5,
    answers.n6,
  ].filter(Boolean).length;

  const passed = nScore >= 2;
  const progress = Math.min((nScore / 2) * 100, 100);

  return (
    <div
      dir="rtl"
      className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white font-vazir shadow-[0_14px_45px_rgba(15,23,42,0.055)]"
    >
      {/* Header */}
      <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-l from-emerald-50/80 via-white to-white px-5 py-6 sm:px-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-emerald-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-8 h-44 w-44 rounded-full bg-blue-100/30 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-dark-green text-white shadow-lg shadow-emerald-950/10">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div>
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-100/80 px-2.5 py-1 text-[9px] font-black text-emerald-700">
                  شرط ۱ از فرآیند شناسایی
                </span>
                <span className="text-[10px] font-bold tracking-[0.12em] text-slate-400">
                  NON-PHYSICAL TEST
                </span>
              </div>

              <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
                غیرفیزیکی بودن دارایی
              </h2>
              <p className="mt-1.5 max-w-xl text-xs leading-6 text-slate-500">
                ماهیت دارایی را بر اساس مؤلفه‌های زیر بررسی کنید. برای احراز این شرط، حداقل ۲ مؤلفه باید برقرار باشد.
              </p>
            </div>
          </div>

          {/* Score */}
          <div
            className={`min-w-[170px] rounded-[22px] border p-4 ${
              passed
                ? 'border-emerald-100 bg-emerald-50/70'
                : 'border-amber-100 bg-amber-50/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold text-slate-400">امتیاز فعلی</p>
                <div className="mt-1 flex items-baseline gap-1">
                  <span
                    className={`text-2xl font-black ${
                      passed ? 'text-emerald-700' : 'text-amber-600'
                    }`}
                  >
                    {nScore}
                  </span>
                  <span className="text-xs font-bold text-slate-400">/ ۶</span>
                </div>
              </div>

              <div
                className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                  passed
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-600'
                }`}
              >
                {passed ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <CircleHelp className="h-5 w-5" />
                )}
              </div>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  passed ? 'bg-emerald-500' : 'bg-amber-400'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>

            <p className="mt-2 text-[9px] font-bold text-slate-400">
              حداقل مورد نیاز: ۲ از ۶
            </p>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="p-5 sm:p-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-800">
              مؤلفه‌های ارزیابی
            </h3>
            <p className="mt-1 text-[10px] text-slate-400">
              برای هر مؤلفه یکی از گزینه‌های بله یا خیر را انتخاب کنید.
            </p>
          </div>

          <div className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[9px] font-bold text-slate-500 sm:flex">
            <Info className="h-3.5 w-3.5" />
            ۶ معیار
          </div>
        </div>

        <div className="space-y-3">
          {N_QUESTIONS.map((q, index) => {
            const answer = answers[q.id as keyof DiscoveryAnswers];
            const isYes = answer === true;
            const isNo = answer === false;

            return (
              <div
                key={q.id}
                className={`group relative overflow-hidden rounded-[22px] border p-4 transition-all duration-200 sm:p-5 ${
                  isYes
                    ? 'border-emerald-200 bg-gradient-to-l from-emerald-50/70 via-white to-white shadow-[0_7px_22px_rgba(5,150,105,.055)]'
                    : isNo
                      ? 'border-rose-100 bg-gradient-to-l from-rose-50/45 via-white to-white'
                      : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {isYes && (
                  <div className="absolute bottom-0 right-0 top-0 w-1 bg-emerald-500" />
                )}
                {isNo && (
                  <div className="absolute bottom-0 right-0 top-0 w-1 bg-rose-400" />
                )}

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-black ${
                      isYes
                        ? 'bg-emerald-100 text-emerald-700'
                        : isNo
                          ? 'bg-rose-100 text-rose-600'
                          : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <Label className="text-sm font-black leading-6 text-slate-800">
                      {q.label}
                    </Label>
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

        {/* Result */}
        <div
          className={`mt-5 overflow-hidden rounded-[22px] border p-4 sm:p-5 ${
            passed
              ? 'border-emerald-200 bg-gradient-to-l from-emerald-50 via-white to-white'
              : 'border-amber-200 bg-gradient-to-l from-amber-50 via-white to-white'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                passed
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-600'
              }`}
            >
              {passed ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <Info className="h-5 w-5" />
              )}
            </div>

            <div className="flex-1">
              <p
                className={`text-sm font-black ${
                  passed ? 'text-emerald-800' : 'text-amber-800'
                }`}
              >
                {passed
                  ? 'شرط غیرفیزیکی بودن احراز شد'
                  : 'شرط هنوز احراز نشده است'}
              </p>

              <p
                className={`mt-1 text-[10px] leading-5 ${
                  passed ? 'text-emerald-700/75' : 'text-amber-700/80'
                }`}
              >
                {passed
                  ? `${nScore} مورد از ۶ مؤلفه برقرار است و حداقل مورد نیاز برای عبور از این شرط تأمین شده است.`
                  : `در حال حاضر ${nScore} مورد برقرار است. برای احراز این شرط حداقل ۲ مؤلفه باید پاسخ مثبت داشته باشند.`}
              </p>
            </div>

            <span
              className={`shrink-0 rounded-full px-3 py-1.5 text-[9px] font-black ${
                passed
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {nScore} / ۶
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
