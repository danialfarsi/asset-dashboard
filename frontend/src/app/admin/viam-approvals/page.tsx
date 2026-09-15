'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { viamApi } from '@/services/viam/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  XCircle,
  Clock3,
  Eye,
  Building2,
  FileText,
  ArrowRight,
  ShieldCheck,
  CalendarDays,
  Inbox,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface VIAMRequest {
  id: number;
  title: string;
  description: string;
  justification: string;
  status: string;
  current_step: number;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  organization?: number;
  organization_name?: string;
}

export default function VIAMApprovalsPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<VIAMRequest[]>([]);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    if (!isSuperAdmin) {
      router.push('/dashboard');
      return;
    }

    fetchData();
  }, [isSuperAdmin]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const response = await viamApi.getEstablishmentRequests();
      const allRequests = response.data.results || [];

      const pending = allRequests.filter(
        (r: any) => r.status === 'submitted'
      );

      setRequests(pending);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    setActionLoading(id);

    try {
      await viamApi.adminApprove(id);

      setRequests((prev) => prev.filter((r) => r.id !== id));

      alert('✅ درخواست با موفقیت تایید شد!');
    } catch (error) {
      console.error('Error approving request:', error);
      alert('❌ خطا در تایید درخواست');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    if (
      !confirm(
        'آیا مطمئن هستید که می‌خواهید این درخواست را رد کنید؟'
      )
    )
      return;

    setActionLoading(id);

    try {
      await viamApi.adminReject(id);

      setRequests((prev) => prev.filter((r) => r.id !== id));

      alert('✅ درخواست با موفقیت رد شد!');
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('❌ خطا در رد درخواست');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft:
        'border-slate-200 bg-slate-50 text-slate-600',
      submitted:
        'border-amber-200 bg-amber-50 text-amber-700',
      approved:
        'border-emerald-200 bg-emerald-50 text-emerald-700',
      rejected:
        'border-rose-200 bg-rose-50 text-rose-700',
      active:
        'border-blue-200 bg-blue-50 text-blue-700',
    };

    const labels: Record<string, string> = {
      draft: 'پیش‌نویس',
      submitted: 'در انتظار تایید',
      approved: 'تایید شده',
      rejected: 'رد شده',
      active: 'فعال',
    };

    return (
      <span
        className={`
          inline-flex items-center gap-1.5 rounded-full border
          px-3 py-1 text-[11px] font-bold
          ${styles[status] || styles.draft}
        `}
      >
        {status === 'submitted' && (
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
        )}

        {labels[status] || status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';

    try {
      return new Date(dateString).toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  if (!isSuperAdmin) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-50 px-4"
      >
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-rose-100 bg-rose-50 shadow-sm">
            <ShieldCheck className="h-9 w-9 text-rose-500" />
          </div>

          <h1 className="text-2xl font-black text-slate-900">
            دسترسی غیرمجاز
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-500">
            شما مجوز لازم برای مشاهده این صفحه را ندارید.
          </p>
        </div>
      </div>
    );
  }

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
            در حال دریافت درخواست‌ها...
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
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[420px] w-[420px] rounded-full bg-blue-100/40 blur-3xl" />
        <div className="absolute -left-40 top-[35%] h-[360px] w-[360px] rounded-full bg-indigo-100/30 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">

        {/* ================= HEADER ================= */}

        <section className="mb-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-start gap-4">
              <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900 shadow-lg shadow-slate-900/10 sm:flex">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>

              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-blue-600">
                    VIAM
                  </span>

                  <span className="h-1 w-1 rounded-full bg-slate-300" />

                  <span className="text-xs font-medium text-slate-400">
                    مدیریت درخواست‌ها
                  </span>
                </div>

                <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  تایید درخواست‌های VIAM
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
                  درخواست‌های ارسال‌شده توسط مدیران شرکت را بررسی،
                  تایید یا رد کنید.
                </p>
              </div>
            </div>

            <Link href="/viam/dashboard">
              <Button
                variant="outline"
                className="
                  h-11 gap-2 rounded-xl border-slate-200
                  bg-white px-5 font-semibold text-slate-700
                  shadow-sm transition-all duration-200
                  hover:border-slate-300 hover:bg-slate-50
                  hover:shadow-md
                "
              >
                <ArrowRight className="h-4 w-4" />
                بازگشت به داشبورد
              </Button>
            </Link>
          </div>
        </section>

        {/* ================= SUMMARY ================= */}

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
                    وضعیت فعلی
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-800">
                    درخواست‌های نیازمند بررسی
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-2.5">
                  <Clock3 className="h-4 w-4 text-amber-600" />

                  <span className="text-sm font-semibold text-amber-700">
                    در انتظار تایید
                  </span>

                  <span className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-amber-500 px-2 text-xs font-black text-white shadow-sm">
                    {requests.length.toLocaleString('fa-IR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= EMPTY STATE ================= */}

        {requests.length === 0 ? (
          <Card className="overflow-hidden rounded-3xl border-slate-200/80 bg-white shadow-sm">
            <CardContent className="px-6 py-20 text-center">

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
                  درخواستی در انتظار تایید نیست
                </h2>

                <p className="mt-3 text-sm leading-7 text-slate-500">
                  در حال حاضر تمام درخواست‌های ارسال‌شده بررسی
                  شده‌اند و مورد جدیدی برای تایید وجود ندارد.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* ================= REQUESTS ================= */

          <section className="space-y-5">
            {requests.map((req) => {
              const isProcessing = actionLoading === req.id;

              return (
                <Card
                  key={req.id}
                  className="
                    group overflow-hidden rounded-2xl
                    border border-slate-200/80 bg-white
                    shadow-sm transition-all duration-300
                    hover:-translate-y-0.5
                    hover:border-slate-300
                    hover:shadow-xl hover:shadow-slate-200/50
                  "
                >
                  {/* Top accent */}

                  <div className="h-1 w-full bg-gradient-to-l from-amber-400 via-amber-500 to-orange-400" />

                  <CardContent className="p-0">
                    <div className="p-5 sm:p-6 lg:p-7">

                      {/* Request header */}

                      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">

                        <div className="min-w-0 flex-1">

                          <div className="mb-4 flex flex-wrap items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 transition-colors group-hover:bg-slate-100">
                              <FileText className="h-4.5 w-4.5 text-slate-600" />
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2.5">
                                <h3 className="text-lg font-black text-slate-900 sm:text-xl">
                                  {req.title}
                                </h3>

                                {getStatusBadge(req.status)}
                              </div>

                              <p className="mt-1 text-xs font-medium text-slate-400">
                                شناسه درخواست #
                                {req.id.toLocaleString('fa-IR')}
                              </p>
                            </div>
                          </div>

                          {/* Description */}

                          <div className="grid gap-3 lg:grid-cols-2">

                            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                              <div className="mb-2 flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />

                                <span className="text-xs font-bold text-slate-500">
                                  شرح درخواست
                                </span>
                              </div>

                              <p className="text-sm leading-7 text-slate-700">
                                {req.description ||
                                  'توضیحی برای این درخواست ثبت نشده است.'}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                              <div className="mb-2 flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />

                                <span className="text-xs font-bold text-slate-500">
                                  دلایل توجیهی
                                </span>
                              </div>

                              <p className="text-sm leading-7 text-slate-700">
                                {req.justification ||
                                  'دلیل توجیهی برای این درخواست ثبت نشده است.'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Desktop actions */}

                        <div className="hidden shrink-0 xl:flex xl:items-center xl:gap-2">

                          <Link
                            href={`/viam/establishment/${req.id}/admin-view`}
                          >
                            <Button
                              variant="outline"
                              className="
                                h-10 gap-2 rounded-xl
                                border-slate-200 bg-white px-4
                                text-xs font-bold text-slate-700
                                shadow-sm
                                hover:border-blue-200
                                hover:bg-blue-50
                                hover:text-blue-700
                              "
                            >
                              <Eye className="h-4 w-4" />
                              مشاهده کامل
                            </Button>
                          </Link>

                          <Button
                            onClick={() => handleApprove(req.id)}
                            disabled={isProcessing}
                            className="
                              h-10 gap-2 rounded-xl
                              bg-emerald-600 px-4
                              text-xs font-bold text-white
                              shadow-sm shadow-emerald-600/20
                              transition-all
                              hover:bg-emerald-700
                              hover:shadow-md
                              disabled:opacity-60
                            "
                          >
                            {isProcessing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}

                            تایید
                          </Button>

                          <Button
                            onClick={() => handleReject(req.id)}
                            disabled={isProcessing}
                            variant="outline"
                            className="
                              h-10 gap-2 rounded-xl
                              border-rose-200 bg-rose-50
                              px-4 text-xs font-bold
                              text-rose-600 shadow-sm
                              transition-all
                              hover:border-rose-300
                              hover:bg-rose-100
                              hover:text-rose-700
                              disabled:opacity-60
                            "
                          >
                            {isProcessing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}

                            رد
                          </Button>
                        </div>
                      </div>

                      {/* Metadata */}

                      <div className="mt-5 border-t border-slate-100 pt-5">
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">

                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
                              <FileText className="h-3.5 w-3.5 text-blue-600" />
                            </div>

                            <span>
                              گام{' '}
                              <strong className="font-bold text-slate-700">
                                {(req.current_step || 1).toLocaleString(
                                  'fa-IR'
                                )}
                              </strong>{' '}
                              از ۱۲
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                              <CalendarDays className="h-3.5 w-3.5 text-slate-500" />
                            </div>

                            <span>{formatDate(req.created_at)}</span>
                          </div>

                          {req.organization_name && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50">
                                <Building2 className="h-3.5 w-3.5 text-violet-600" />
                              </div>

                              <span className="font-medium text-slate-600">
                                {req.organization_name}
                              </span>
                            </div>
                          )}

                          {req.status === 'submitted' && (
                            <div className="flex items-center gap-2 text-xs font-semibold text-amber-600">
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
                                <Clock3 className="h-3.5 w-3.5" />
                              </div>

                              <span>منتظر تصمیم مدیر سیستم</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Mobile / tablet actions */}

                      <div className="mt-5 grid grid-cols-1 gap-2 border-t border-slate-100 pt-5 sm:grid-cols-3 xl:hidden">

                        <Link
                          className="w-full"
                          href={`/viam/establishment/${req.id}/admin-view`}
                        >
                          <Button
                            variant="outline"
                            className="h-11 w-full gap-2 rounded-xl border-slate-200 font-bold"
                          >
                            <Eye className="h-4 w-4" />
                            مشاهده کامل
                          </Button>
                        </Link>

                        <Button
                          onClick={() => handleApprove(req.id)}
                          disabled={isProcessing}
                          className="
                            h-11 w-full gap-2 rounded-xl
                            bg-emerald-600 font-bold text-white
                            hover:bg-emerald-700
                          "
                        >
                          {isProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}

                          تایید درخواست
                        </Button>

                        <Button
                          onClick={() => handleReject(req.id)}
                          disabled={isProcessing}
                          variant="outline"
                          className="
                            h-11 w-full gap-2 rounded-xl
                            border-rose-200 bg-rose-50
                            font-bold text-rose-600
                            hover:bg-rose-100
                            hover:text-rose-700
                          "
                        >
                          {isProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}

                          رد درخواست
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
