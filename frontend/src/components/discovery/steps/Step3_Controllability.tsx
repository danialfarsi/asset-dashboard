'use client';

import { Label } from '@/components/ui/label';
import { C_QUESTIONS, DiscoveryAnswers } from '@/types/discovery.types';
import {
  Check,
  CheckCircle2,
  Info,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  TriangleAlert,
  X,
  XCircle,
} from 'lucide-react';

interface Step3Props {
  answers: DiscoveryAnswers;
  setAnswers: (answers: DiscoveryAnswers) => void;
}

export function Step3_Controllability({ answers, setAnswers }: Step3Props) {
  const handleChange = (id: keyof DiscoveryAnswers, value: boolean) => {
    setAnswers({ ...answers, [id]: value });
  };

  const cStrong = [answers.c1, answers.c2, answers.c3, answers.c4, answers.c5];
  const cStatus = cStrong.some(Boolean)
    ? 'PASS'
    : answers.c6
      ? 'CONDITIONAL'
      : 'FAIL';

  const cScore = [
    answers.c1,
    answers.c2,
    answers.c3,
    answers.c4,
    answers.c5,
    answers.c6,
    answers.c7,
  ].filter(Boolean).length;

  const strongScore = cStrong.filter(Boolean).length;

  const getStatusColor = () => {
    switch (cStatus) {
      case 'PASS':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'CONDITIONAL':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      default:
        return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getStatusText = () => {
    switch (cStatus) {
      case 'PASS':
        return 'شرط کنترل منافع احراز شد';
      case 'CONDITIONAL':
        return 'کنترل دارایی صرفاً موقعیتی است';
      default:
        return 'شرط کنترل منافع احراز نشد';
    }
  };

  return (
    <div
      dir="rtl"
      className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white font-vazir shadow-[0_14px_45px_rgba(15,23,42,0.055)]"
    >
      {/* Header */}
      <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-l from-emerald-50/75 via-white to-white px-5 py-6 sm:px-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-emerald-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-8 h-44 w-44 rounded-full bg-blue-100/30 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-dark-green text-white shadow-lg shadow-emerald-950/10">
              <LockKeyhole className="h-5 w-5" />
            </div>

            <div>
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-100/80 px-2.5 py-1 text-[9px] font-black text-emerald-700">
                  شرط ۳ از فرآیند شناسایی
                </span>
                <span className="text-[10px] font-bold tracking-[0.12em] text-slate-400">
                  CONTROLLABILITY TEST
                </span>
              </div>

              <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
                کنترل منافع دارایی
              </h2>

              <p className="mt-1.5 max-w-2xl text-xs leading-6 text-slate-500">
                برای احراز کنترل منافع، حداقل یکی از مکانیزم‌های قوی
                <span className="mx-1 font-black text-emerald-700">C1 تا C5</span>
                باید برقرار باشد. مثبت بودن C6 به‌تنهایی وضعیت را مشروط می‌کند.
              </p>
            </div>
          </div>

          {/* Status summary */}
          <div
            className={`min-w-[195px] rounded-[22px] border p-4 ${
              cStatus === 'PASS'
                ? 'border-emerald-100 bg-emerald-50/70'
                : cStatus === 'CONDITIONAL'
                  ? 'border-amber-100 bg-amber-50/70'
                  : 'border-rose-100 bg-rose-50/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold text-slate-400">امتیاز فعلی</p>
                <div className="mt-1 flex items-baseline gap-1">
                  <span
                    className={`text-2xl font-black ${
                      cStatus === 'PASS'
                        ? 'text-emerald-700'
                        : cStatus === 'CONDITIONAL'
                          ? 'text-amber-600'
                          : 'text-rose-600'
                    }`}
                  >
                    {cScore}
                  </span>
                  <span className="text-xs font-bold text-slate-400">/ ۷</span>
                </div>
              </div>

              <div
                className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                  cStatus === 'PASS'
                    ? 'bg-emerald-100 text-emerald-700'
                    : cStatus === 'CONDITIONAL'
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-rose-100 text-rose-600'
                }`}
              >
                {cStatus === 'PASS' ? (
                  <ShieldCheck className="h-5 w-5" />
                ) : cStatus === 'CONDITIONAL' ? (
                  <TriangleAlert className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-400">
                کنترل قوی مثبت
              </span>
              <span
                className={`rounded-full px-2 py-1 text-[9px] font-black ${
                  strongScore > 0
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-white text-slate-500'
                }`}
              >
                {strongScore} / ۵
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-7">
        {/* Decision rule */}
        <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="rounded-[18px] border border-emerald-100 bg-emerald-50/45 p-3.5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-black text-emerald-800">احراز کامل</p>
                <p className="mt-0.5 text-[9px] text-emerald-700/70">
                  حداقل یکی از C1 تا C5
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[18px] border border-amber-100 bg-amber-50/50 p-3.5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <TriangleAlert className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-black text-amber-800">احراز مشروط</p>
                <p className="mt-0.5 text-[9px] text-amber-700/70">
                  فقط کنترل موقعیتی C6
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[18px] border border-rose-100 bg-rose-50/45 p-3.5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                <XCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-black text-rose-800">عدم احراز</p>
                <p className="mt-0.5 text-[9px] text-rose-700/70">
                  نبود مکانیزم کنترلی مؤثر
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-slate-800">
              مکانیزم‌های کنترل
            </h3>
            <p className="mt-1 text-[10px] text-slate-400">
              وضعیت هر مکانیزم را بر اساس شرایط واقعی دارایی مشخص کنید.
            </p>
          </div>

          <div className="hidden items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[9px] font-black text-emerald-700 sm:flex">
            <KeyRound className="h-3.5 w-3.5" />
            C1 تا C5 کنترل قوی
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-3">
          {C_QUESTIONS.map((q) => {
            const isStrong =
              q.id === 'c1' ||
              q.id === 'c2' ||
              q.id === 'c3' ||
              q.id === 'c4' ||
              q.id === 'c5';

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
                      : isStrong
                        ? 'border-blue-200 bg-gradient-to-l from-blue-50/55 via-white to-white'
                        : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div
                  className={`absolute bottom-0 right-0 top-0 w-1 ${
                    isYes
                      ? 'bg-emerald-500'
                      : isNo
                        ? 'bg-rose-400'
                        : isStrong
                          ? 'bg-blue-400'
                          : 'bg-transparent'
                  }`}
                />

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[10px] font-black uppercase ${
                      isYes
                        ? 'bg-emerald-100 text-emerald-700'
                        : isNo
                          ? 'bg-rose-100 text-rose-600'
                          : isStrong
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {String(q.id).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Label
                        className={`text-sm font-black leading-6 ${
                          isStrong ? 'text-blue-800' : 'text-slate-800'
                        }`}
                      >
                        {q.label}
                      </Label>

                      {isStrong && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[8px] font-black text-blue-700">
                          <KeyRound className="h-2.5 w-2.5" />
                          کنترل قوی
                        </span>
                      )}

                      {q.id === 'c6' && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[8px] font-black text-amber-700">
                          <TriangleAlert className="h-2.5 w-2.5" />
                          کنترل موقعیتی
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

        {/* Final Status */}
        <div className={`mt-5 overflow-hidden rounded-[22px] border p-4 sm:p-5 ${getStatusColor()}`}>
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                cStatus === 'PASS'
                  ? 'bg-emerald-100 text-emerald-700'
                  : cStatus === 'CONDITIONAL'
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-rose-100 text-rose-600'
              }`}
            >
              {cStatus === 'PASS' ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : cStatus === 'CONDITIONAL' ? (
                <TriangleAlert className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-black">{getStatusText()}</p>

              <p className="mt-1 text-[10px] leading-5 opacity-80">
                {cStatus === 'PASS'
                  ? `حداقل یکی از مکانیزم‌های قوی C1 تا C5 برقرار است. در مجموع ${cScore} معیار از ۷ معیار پاسخ مثبت دارد.`
                  : cStatus === 'CONDITIONAL'
                    ? 'در حال حاضر کنترل دارایی صرفاً از طریق C6 برقرار است و برای احراز کامل، کنترل باید از طریق یک مکانیزم قوی‌تر رسمی شود.'
                    : 'هیچ‌یک از مکانیزم‌های کنترل قوی C1 تا C5 و کنترل موقعیتی C6 برقرار نیست.'}
              </p>

              {cStatus === 'CONDITIONAL' && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200/70 bg-white/60 p-3">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                  <p className="text-[9px] leading-5 text-amber-800">
                    پیشنهاد: کنترل دارایی از طریق انعقاد قرارداد، ثبت کپی‌رایت یا افزودن بند محرمانگی تقویت شود.
                  </p>
                </div>
              )}
            </div>

            <span className="hidden shrink-0 rounded-full bg-white/70 px-3 py-1.5 text-[9px] font-black shadow-sm ring-1 ring-black/5 sm:inline-flex">
              {cScore} / ۷
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
