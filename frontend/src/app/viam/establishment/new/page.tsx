
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { viamApi } from '@/services/viam/api';
import { RoleGuard } from '@/components/RoleGuard';
import { useAuthStore } from '@/store/auth-store';

function NewEstablishmentRequestForm() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    justification: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await viamApi.createEstablishmentRequest(formData);

      setSuccess(true);

      setTimeout(() => {
        router.push(`/viam/establishment/${response.data.id}`);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'خطا در ثبت درخواست.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleConfig = () => {
    switch (user?.role) {
      case 'super_admin':
        return {
          label: 'ادمین کل',
          dot: 'bg-rose-500',
          badge:
            'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200/80',
        };

      case 'org_admin':
        return {
          label: 'مدیر شرکت',
          dot: 'bg-blue-500',
          badge:
            'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200/80',
        };

      default:
        return {
          label: 'مدیر واحد',
          dot: 'bg-emerald-500',
          badge:
            'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200/80',
        };
    }
  };

  const roleConfig = getRoleConfig();

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f6f8fb] text-slate-900"
    >
      {/* Background decorations */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-blue-100/40 blur-3xl" />
        <div className="absolute -left-40 top-40 h-[420px] w-[420px] rounded-full bg-violet-100/30 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        {/* Top navigation */}
        <div className="mb-5 flex items-center justify-between">
          <Link
            href="/viam/dashboard"
            className="group inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-white hover:text-slate-900 hover:shadow-sm"
          >
            <span className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
            بازگشت به داشبورد
          </Link>

          <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${roleConfig.badge}`}
          >
            <span
              className={`h-2 w-2 rounded-full ${roleConfig.dot}`}
            />
            {roleConfig.label}
          </div>
        </div>

        {/* Hero */}
        <section className="mb-6 overflow-hidden rounded-[28px] border border-white/80 bg-gradient-to-l from-slate-950 via-slate-900 to-blue-950 px-6 py-7 text-white shadow-[0_20px_60px_-24px_rgba(15,23,42,0.45)] sm:px-8 sm:py-9">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-100 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                فرآیند ایجاد واحد جدید
              </div>

              <h1 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-[34px]">
                ثبت درخواست تأسیس واحد IAM
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300 sm:text-[15px]">
                اطلاعات اولیه درخواست را ثبت کنید. پس از ثبت، درخواست وارد
                فرآیند بررسی و تکمیل مراحل تأسیس خواهد شد.
              </p>
            </div>

            <div className="flex min-w-[180px] items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-base font-black text-slate-900">
                ۱
              </div>

              <div>
                <p className="text-xs text-slate-400">مرحله فعلی</p>
                <p className="mt-0.5 text-sm font-bold text-white">
                  ثبت درخواست
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Progress */}
        <section className="mb-6 rounded-3xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-800">
                روند تأسیس واحد
              </p>
              <p className="mt-1 text-xs text-slate-500">
                شما در مرحله ۱ از ۱۲ قرار دارید
              </p>
            </div>

            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
              ۸٪ تکمیل
            </span>
          </div>

          <div className="mb-6 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-[8.33%] rounded-full bg-gradient-to-l from-blue-600 to-cyan-500" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <ProgressItem
              step="۱"
              title="ثبت درخواست"
              description="اطلاعات اولیه"
              active
            />

            <ProgressItem
              step="۲"
              title="تعیین حامی"
              description="مرحله بعدی"
            />

            <ProgressItem
              step="۱۲"
              title="پایلوت"
              description="مرحله نهایی"
            />
          </div>
        </section>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_16px_50px_-32px_rgba(15,23,42,0.28)]"
        >
          {/* Form heading */}
          <div className="border-b border-slate-100 px-6 py-6 sm:px-8">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <svg
                  width="21"
                  height="21"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
                </svg>
              </div>

              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  اطلاعات درخواست
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  اطلاعات زیر مبنای بررسی اولیه درخواست تأسیس خواهد بود.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-6 sm:p-8">
            {/* Alerts */}
            {error && (
              <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-sm text-rose-800">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 font-bold">
                  !
                </div>

                <div>
                  <p className="font-bold">ثبت درخواست انجام نشد</p>
                  <p className="mt-0.5 text-rose-700">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-800">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold">
                  ✓
                </div>

                <div>
                  <p className="font-bold">درخواست با موفقیت ثبت شد</p>
                  <p className="mt-0.5 text-emerald-700">
                    در حال انتقال به صفحه درخواست...
                  </p>
                </div>
              </div>
            )}

            {/* Title */}
            <FormField
              label="عنوان درخواست"
              required
              hint="یک عنوان کوتاه، دقیق و قابل تشخیص وارد کنید."
            >
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="مثال: تأسیس واحد IAM در شرکت فولاد"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </FormField>

            {/* Description */}
            <FormField
              label="توضیحات"
              required
              hint="دامنه کلی درخواست و هدف از ایجاد واحد را توضیح دهید."
            >
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={5}
                placeholder="شرح کامل درخواست..."
                className="min-h-[130px] w-full resize-y rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 text-sm leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </FormField>

            {/* Justification */}
            <FormField
              label="دلایل توجیهی"
              required
              hint="ضرورت، ارزش سازمانی و دلایل ایجاد واحد IAM را بیان کنید."
            >
              <textarea
                name="justification"
                value={formData.justification}
                onChange={handleChange}
                required
                rows={5}
                placeholder="دلایل و ضرورت ایجاد واحد IAM..."
                className="min-h-[130px] w-full resize-y rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 text-sm leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />
            </FormField>
          </div>

          {/* Footer actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <Link
              href="/viam/dashboard"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
            >
              انصراف
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="group inline-flex h-12 min-w-[190px] items-center justify-center gap-2 rounded-xl bg-slate-950 px-7 text-sm font-bold text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue-700/20 disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  در حال ثبت...
                </>
              ) : (
                <>
                  ثبت و ادامه
                  <span className="text-lg transition-transform group-hover:-translate-x-0.5">
                    ←
                  </span>
                </>
              )}
            </button>
          </div>
        </form>

        <p className="mt-5 text-center text-xs leading-6 text-slate-400">
          اطلاعات ثبت‌شده در ادامه فرآیند تأسیس قابل بررسی و پیگیری خواهند
          بود.
        </p>
      </div>
    </main>
  );
}

function ProgressItem({
  step,
  title,
  description,
  active = false,
}: {
  step: string;
  title: string;
  description: string;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-3.5 transition sm:p-4 ${
        active
          ? 'border-blue-200 bg-blue-50/70'
          : 'border-slate-100 bg-slate-50/70'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black ${
            active
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
              : 'bg-white text-slate-400 ring-1 ring-slate-200'
          }`}
        >
          {step}
        </div>

        <div className="min-w-0">
          <p
            className={`truncate text-xs font-bold sm:text-sm ${
              active ? 'text-blue-800' : 'text-slate-600'
            }`}
          >
            {title}
          </p>

          <p
            className={`mt-1 hidden text-[11px] sm:block ${
              active ? 'text-blue-600/70' : 'text-slate-400'
            }`}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  hint,
  required = false,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2.5">
        <label className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
          {label}

          {required && (
            <span className="text-rose-500">*</span>
          )}
        </label>

        {hint && (
          <p className="mt-1 text-xs leading-5 text-slate-400">
            {hint}
          </p>
        )}
      </div>

      {children}
    </div>
  );
}

export default function NewEstablishmentRequest() {
  return (
    <RoleGuard
      allowedRoles={['super_admin', 'org_admin']}
      redirectTo="/viam/dashboard"
    >
      <NewEstablishmentRequestForm />
    </RoleGuard>
  );
}
