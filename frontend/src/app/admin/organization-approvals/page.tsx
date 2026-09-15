'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import {
  CheckCircle2,
  XCircle,
  Building2,
  Clock3,
  Users,
  Pencil,
  X,
  AlertCircle,
  ArrowRight,
  Loader2,
  ShieldCheck,
  CalendarDays,
  UserRound,
  Mail,
  Hash,
  Inbox,
  Sparkles,
  Save,
  Layers3,
} from 'lucide-react';

interface Department {
  id: number;
  name: string;
  code: string;
}

interface OrgRequest {
  id: number;
  name: string;
  code: string;
  status: string;
  created_at: string;
  admin: {
    id: number;
    name: string;
    email: string;
  } | null;
  departments_count: number;
  departments: Department[];
}

export default function OrganizationApprovalsPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [organizations, setOrganizations] = useState<OrgRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [editingCode, setEditingCode] = useState<number | null>(null);
  const [newCode, setNewCode] = useState('');

  // ═══════════════════════════════════════════════════════
  // چک دسترسی
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    if (user && user.role !== 'super_admin') {
      router.push('/viam/dashboard');
    }
  }, [user, router]);

  // ═══════════════════════════════════════════════════════
  // بارگذاری
  // ═══════════════════════════════════════════════════════
  const loadOrganizations = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.get('/auth/organizations/pending/');
      setOrganizations(res.data.organizations || []);
    } catch (err: any) {
      console.error('Load error:', err);
      setError(
        err.response?.data?.error || 'خطا در بارگذاری درخواست‌ها'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, []);

  // ═══════════════════════════════════════════════════════
  // تأیید / رد
  // ═══════════════════════════════════════════════════════
  const handleAction = async (
    id: number,
    action: 'approve' | 'reject',
    code?: string
  ) => {
    if (action === 'reject') {
      if (
        !confirm(
          'آیا مطمئنید که می‌خواهید این سازمان را رد کنید؟'
        )
      )
        return;
    }

    setProcessingId(id);

    try {
      await api.post(`/auth/organizations/${id}/approve/`, {
        action,
        code: code || undefined,
      });

      setOrganizations((prev) =>
        prev.filter((o) => o.id !== id)
      );

      if (action === 'approve') {
        alert('✅ سازمان با موفقیت تأیید شد');
      } else {
        alert('❌ سازمان رد شد');
      }
    } catch (err: any) {
      console.error('Action error:', err);
      alert(
        err.response?.data?.error || 'خطا در انجام عملیات'
      );
    } finally {
      setProcessingId(null);
      setEditingCode(null);
      setNewCode('');
    }
  };

  // ═══════════════════════════════════════════════════════
  // شروع ویرایش کد
  // ═══════════════════════════════════════════════════════
  const startEditCode = (org: OrgRequest) => {
    setEditingCode(org.id);
    setNewCode(org.code);
  };

  const cancelEditCode = () => {
    setEditingCode(null);
    setNewCode('');
  };

  // ═══════════════════════════════════════════════════════
  // فرمت تاریخ
  // ═══════════════════════════════════════════════════════
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // ═══════════════════════════════════════════════════════
  // Loading
  // ═══════════════════════════════════════════════════════
  if (loading) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#f8fafc]"
      >
        <div className="flex flex-col items-center">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-blue-100/70 blur-xl" />

            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
              <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
            </div>
          </div>

          <p className="mt-5 text-sm font-semibold text-slate-600">
            در حال دریافت درخواست‌های سازمان...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f8fafc] text-slate-900"
    >
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[420px] w-[420px] rounded-full bg-blue-100/40 blur-3xl" />
        <div className="absolute -left-40 top-[35%] h-[360px] w-[360px] rounded-full bg-indigo-100/30 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">

        {/* ═════════════════ HEADER ═════════════════ */}

        <section className="mb-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-start gap-4">
              <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900 shadow-lg shadow-slate-900/10 sm:flex">
                <Building2 className="h-6 w-6 text-white" />
              </div>

              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-blue-600">
                    VIAM
                  </span>

                  <span className="h-1 w-1 rounded-full bg-slate-300" />

                  <span className="text-xs font-medium text-slate-400">
                    مدیریت سازمان‌ها
                  </span>
                </div>

                <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  تأیید سازمان‌ها
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
                  درخواست‌های ثبت سازمان را بررسی کرده و پس از
                  بررسی اطلاعات، آن‌ها را تأیید یا رد کنید.
                </p>
              </div>
            </div>

            <Link href="/dashboard">
              <button
                className="
                  flex h-11 items-center gap-2 rounded-xl
                  border border-slate-200 bg-white px-5
                  text-sm font-semibold text-slate-700
                  shadow-sm transition-all duration-200
                  hover:border-slate-300 hover:bg-slate-50
                  hover:shadow-md
                "
              >
                <ArrowRight className="h-4 w-4" />
                بازگشت به داشبورد
              </button>
            </Link>
          </div>
        </section>

        {/* ═════════════════ SUMMARY ═════════════════ */}

        <section className="mb-7">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">

            <div className="absolute right-0 top-0 h-full w-1 bg-gradient-to-b from-blue-500 to-indigo-600" />

            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">

              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50">
                  <Inbox className="h-5 w-5 text-amber-600" />
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-400">
                    وضعیت درخواست‌ها
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-800">
                    سازمان‌های نیازمند بررسی
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-2.5">
                <Clock3 className="h-4 w-4 text-amber-600" />

                <span className="text-sm font-semibold text-amber-700">
                  در انتظار تأیید
                </span>

                <span className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-amber-500 px-2 text-xs font-black text-white shadow-sm">
                  {organizations.length.toLocaleString('fa-IR')}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ═════════════════ ERROR ═════════════════ */}

        {error && (
          <div className="mb-7 overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-sm">
            <div className="flex items-start gap-4 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50">
                <AlertCircle className="h-5 w-5 text-rose-600" />
              </div>

              <div>
                <p className="text-sm font-bold text-rose-700">
                  خطا در دریافت اطلاعات
                </p>

                <p className="mt-1 text-sm leading-6 text-rose-600/80">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════ EMPTY ═════════════════ */}

        {organizations.length === 0 && !error && (
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white px-6 py-20 text-center shadow-sm">

            <div className="relative mx-auto mb-7 flex h-24 w-24 items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-emerald-100/60 blur-xl" />

              <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-emerald-100 bg-emerald-50">
                <CheckCircle2 className="h-9 w-9 text-emerald-500" />
              </div>
            </div>

            <div className="mx-auto max-w-md">
              <div className="mb-3 flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-500" />

                <span className="text-xs font-bold text-emerald-600">
                  همه‌چیز مرتب است
                </span>
              </div>

              <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
                درخواستی در انتظار تأیید نیست
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-500">
                در حال حاضر تمام درخواست‌های ثبت سازمان بررسی
                شده‌اند و مورد جدیدی وجود ندارد.
              </p>
            </div>
          </div>
        )}

        {/* ═════════════════ ORGANIZATIONS ═════════════════ */}

        <section className="space-y-5">
          {organizations.map((org) => {
            const isProcessing = processingId === org.id;
            const isEditing = editingCode === org.id;

            return (
              <article
                key={org.id}
                className="
                  group overflow-hidden rounded-2xl
                  border border-slate-200/80 bg-white
                  shadow-sm transition-all duration-300
                  hover:-translate-y-0.5
                  hover:border-slate-300
                  hover:shadow-xl hover:shadow-slate-200/50
                "
              >
                {/* Accent */}
                <div className="h-1 w-full bg-gradient-to-l from-amber-400 via-amber-500 to-orange-400" />

                <div className="p-5 sm:p-6 lg:p-7">

                  {/* ───────────── Organization Header ───────────── */}

                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                    <div className="flex min-w-0 items-start gap-4">

                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 transition-all group-hover:bg-blue-100">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h2 className="text-lg font-black text-slate-900 sm:text-xl">
                            {org.name}
                          </h2>

                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                            در انتظار تأیید
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-3">

                          <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1">
                            <Hash className="h-3 w-3 text-slate-400" />

                            <span
                              dir="ltr"
                              className="font-mono text-xs font-semibold text-slate-600"
                            >
                              {org.code}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {formatDate(org.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Organization ID */}
                    <div className="hidden rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-400 lg:block">
                      شناسه سازمان
                      <span className="mr-1 font-bold text-slate-600">
                        #{org.id.toLocaleString('fa-IR')}
                      </span>
                    </div>
                  </div>

                  {/* ───────────── Main Info ───────────── */}

                  <div className="mt-6 grid gap-4 lg:grid-cols-3">

                    {/* Admin */}

                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 lg:col-span-2">

                      <div className="mb-4 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                          <UserRound className="h-4 w-4 text-blue-600" />
                        </div>

                        <div>
                          <p className="text-xs font-bold text-slate-700">
                            مدیرعامل سازمان
                          </p>

                          <p className="mt-0.5 text-[10px] text-slate-400">
                            اطلاعات مدیر ثبت‌شده برای سازمان
                          </p>
                        </div>
                      </div>

                      {org.admin ? (
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            {org.admin.name}
                          </p>

                          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                            <Mail className="h-3.5 w-3.5 text-slate-400" />

                            <span dir="ltr">
                              {org.admin.email}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400">
                          اطلاعات مدیرعامل ثبت نشده است.
                        </p>
                      )}
                    </div>

                    {/* Department count */}

                    <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-4">

                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
                          <Layers3 className="h-4 w-4 text-violet-600" />
                        </div>

                        <span className="text-xs font-bold text-slate-600">
                          ساختار سازمانی
                        </span>
                      </div>

                      <div className="mt-5">
                        <div className="flex items-end gap-2">
                          <span className="text-3xl font-black tracking-tight text-slate-900">
                            {org.departments_count.toLocaleString(
                              'fa-IR'
                            )}
                          </span>

                          <span className="mb-1 text-xs font-medium text-slate-400">
                            واحد سازمانی
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ───────────── Departments ───────────── */}

                  {org.departments.length > 0 && (
                    <div className="mt-5">

                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-slate-400" />

                          <span className="text-xs font-bold text-slate-600">
                            واحدهای سازمان
                          </span>
                        </div>

                        <span className="text-[10px] font-medium text-slate-400">
                          {org.departments.length.toLocaleString(
                            'fa-IR'
                          )}{' '}
                          واحد ثبت‌شده
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {org.departments.map((dept) => (
                          <div
                            key={dept.id}
                            className="
                              flex items-center gap-2 rounded-xl
                              border border-blue-100 bg-blue-50/60
                              px-3 py-2 transition-colors
                              hover:bg-blue-50
                            "
                          >
                            <span className="text-xs font-semibold text-blue-800">
                              {dept.name}
                            </span>

                            <span
                              dir="ltr"
                              className="rounded-md bg-white/80 px-1.5 py-0.5 font-mono text-[10px] font-medium text-blue-500"
                            >
                              {dept.code}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ───────────── Edit Code ───────────── */}

                  {isEditing ? (
                    <div className="mt-6 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/60">

                      <div className="border-b border-amber-100 px-4 py-3 sm:px-5">
                        <div className="flex items-center gap-2">
                          <Pencil className="h-4 w-4 text-amber-600" />

                          <div>
                            <p className="text-xs font-bold text-amber-800">
                              ویرایش کد سازمان
                            </p>

                            <p className="mt-0.5 text-[10px] text-amber-700/70">
                              کد جدید را وارد کرده و سازمان را تأیید
                              کنید.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 sm:p-5">
                        <label className="mb-2 block text-xs font-bold text-slate-600">
                          کد سازمان جدید
                        </label>

                        <div className="flex flex-col gap-2 sm:flex-row">

                          <div className="relative flex-1">
                            <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                            <input
                              type="text"
                              dir="ltr"
                              value={newCode}
                              onChange={(e) =>
                                setNewCode(
                                  e.target.value.toUpperCase()
                                )
                              }
                              className="
                                h-11 w-full rounded-xl
                                border border-amber-200 bg-white
                                px-4 pl-10 font-mono text-sm
                                font-semibold text-slate-800
                                outline-none transition-all
                                placeholder:text-slate-300
                                focus:border-amber-400
                                focus:ring-4 focus:ring-amber-100
                              "
                              placeholder="ORG-CODE"
                            />
                          </div>

                          <button
                            onClick={() =>
                              handleAction(
                                org.id,
                                'approve',
                                newCode
                              )
                            }
                            disabled={isProcessing}
                            className="
                              flex h-11 items-center justify-center
                              gap-2 rounded-xl bg-emerald-600
                              px-5 text-sm font-bold text-white
                              shadow-sm shadow-emerald-600/20
                              transition-all hover:bg-emerald-700
                              hover:shadow-md
                              disabled:cursor-not-allowed
                              disabled:opacity-50
                            "
                          >
                            {isProcessing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}

                            {isProcessing
                              ? 'در حال ذخیره...'
                              : 'ذخیره و تأیید'}
                          </button>

                          <button
                            onClick={cancelEditCode}
                            className="
                              flex h-11 w-11 shrink-0
                              items-center justify-center
                              rounded-xl border border-slate-200
                              bg-white text-slate-500
                              transition-all
                              hover:border-slate-300
                              hover:bg-slate-50
                              hover:text-slate-700
                            "
                            title="انصراف"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ───────────── Actions ───────────── */

                    <div className="mt-6 border-t border-slate-100 pt-5">

                      <div className="flex flex-col gap-2 sm:flex-row">

                        <button
                          onClick={() =>
                            handleAction(org.id, 'approve')
                          }
                          disabled={isProcessing}
                          className="
                            flex h-11 flex-1 items-center
                            justify-center gap-2 rounded-xl
                            bg-emerald-600 px-5 text-sm
                            font-bold text-white
                            shadow-sm shadow-emerald-600/20
                            transition-all
                            hover:bg-emerald-700
                            hover:shadow-md
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                          "
                        >
                          {isProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}

                          {isProcessing
                            ? 'در حال تأیید...'
                            : 'تأیید سازمان'}
                        </button>

                        <button
                          onClick={() => startEditCode(org)}
                          disabled={isProcessing}
                          className="
                            flex h-11 items-center
                            justify-center gap-2 rounded-xl
                            border border-amber-200
                            bg-amber-50 px-5 text-sm
                            font-bold text-amber-700
                            transition-all
                            hover:border-amber-300
                            hover:bg-amber-100
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                          "
                        >
                          <Pencil className="h-4 w-4" />
                          ویرایش کد
                        </button>

                        <button
                          onClick={() =>
                            handleAction(org.id, 'reject')
                          }
                          disabled={isProcessing}
                          className="
                            flex h-11 items-center
                            justify-center gap-2 rounded-xl
                            border border-rose-200
                            bg-rose-50 px-5 text-sm
                            font-bold text-rose-600
                            transition-all
                            hover:border-rose-300
                            hover:bg-rose-100
                            hover:text-rose-700
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                          "
                        >
                          {isProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}

                          رد درخواست
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
