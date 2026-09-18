
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { viamApi } from '@/services/viam/api';
import { EstablishmentRequest } from '@/types/viam';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronLeft,
  CircleDot,
  Clock3,
  FilePlus2,
  FileText,
  LayoutList,
  Plus,
  RotateCcw,
  SearchX,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react';

export default function EstablishmentRequestList() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<EstablishmentRequest[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const response = await viamApi.getEstablishmentRequests();
        setRequests(response.data.results || []);
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft:
        'border-slate-200 bg-slate-50 text-slate-600',
      submitted:
        'border-amber-200 bg-amber-50 text-amber-700',
      approved:
        'border-emerald-200 bg-emerald-50 text-emerald-700',
      rejected:
        'border-red-200 bg-red-50 text-red-700',
    };

    const labels: Record<string, string> = {
      draft: 'پیش‌نویس',
      submitted: 'ارسال شده',
      approved: 'تأیید شده',
      rejected: 'رد شده',
    };

    const dots: Record<string, string> = {
      draft: 'bg-slate-400',
      submitted: 'bg-amber-500',
      approved: 'bg-emerald-500',
      rejected: 'bg-red-500',
    };

    return (
      <span
        className={`
          inline-flex items-center gap-2 rounded-full border
          px-3.5 py-1.5 text-[13px] font-bold
          ${styles[status] || styles.draft}
        `}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            dots[status] || 'bg-slate-400'
          }`}
        />
        {labels[status] || status}
      </span>
    );
  };

  const filteredRequests =
    filter === 'all'
      ? requests
      : requests.filter((req) => req.status === filter);

  const canManage =
    user?.role === 'super_admin' || user?.role === 'org_admin';

  const totalCount = requests.length;
  const draftCount = requests.filter((r) => r.status === 'draft').length;
  const submittedCount = requests.filter(
    (r) => r.status === 'submitted'
  ).length;
  const approvedCount = requests.filter(
    (r) => r.status === 'approved'
  ).length;
  const rejectedCount = requests.filter(
    (r) => r.status === 'rejected'
  ).length;

  const filters = [
    {
      id: 'all',
      label: 'همه درخواست‌ها',
      count: totalCount,
      icon: LayoutList,
      active:
        'bg-emerald-600 text-white border-emerald-600 shadow-[0_8px_25px_rgba(5,150,105,0.22)]',
    },
    {
      id: 'draft',
      label: 'پیش‌نویس',
      count: draftCount,
      icon: FileText,
      active:
        'bg-slate-700 text-white border-slate-700 shadow-[0_8px_25px_rgba(51,65,85,0.18)]',
    },
    {
      id: 'submitted',
      label: 'ارسال شده',
      count: submittedCount,
      icon: Clock3,
      active:
        'bg-amber-500 text-white border-amber-500 shadow-[0_8px_25px_rgba(245,158,11,0.2)]',
    },
    {
      id: 'approved',
      label: 'تأیید شده',
      count: approvedCount,
      icon: CheckCircle2,
      active:
        'bg-emerald-600 text-white border-emerald-600 shadow-[0_8px_25px_rgba(5,150,105,0.22)]',
    },
    {
      id: 'rejected',
      label: 'رد شده',
      count: rejectedCount,
      icon: XCircle,
      active:
        'bg-red-500 text-white border-red-500 shadow-[0_8px_25px_rgba(239,68,68,0.18)]',
    },
  ];

  if (loading) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-[#f7f9f8] flex items-center justify-center font-vazir"
      >
        <div className="relative flex flex-col items-center">
          <div className="relative">
            <div className="h-20 w-20 rounded-3xl bg-white shadow-xl shadow-emerald-900/5 border border-emerald-100 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-emerald-600" />
            </div>

            <div className="absolute -inset-2 rounded-[28px] border-2 border-emerald-500/20 border-t-emerald-600 animate-spin" />
          </div>

          <p className="mt-7 text-[16px] font-bold text-slate-700">
            در حال دریافت درخواست‌ها
          </p>

          <p className="mt-1 text-[13px] text-slate-400">
            لطفاً چند لحظه منتظر بمانید...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#f7f9f8] font-vazir text-slate-900"
    >
      {/* Decorative background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-48 -top-48 h-[500px] w-[500px] rounded-full bg-emerald-100/30 blur-3xl" />
        <div className="absolute -left-56 top-[35%] h-[450px] w-[450px] rounded-full bg-teal-100/20 blur-3xl" />
      </div>

      <main className="relative mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
     
        {/* Back to Dashboard */}
        <div className="mb-4 flex items-center justify-start">
          <Link
            href="/dashboard"
            className="
              group inline-flex h-11 items-center gap-2.5
              rounded-xl border border-slate-200 bg-white px-4
              text-[13px] font-bold text-slate-600
              shadow-[0_4px_15px_rgba(15,23,42,0.04)]
              transition-all duration-200
              hover:-translate-y-0.5
              hover:border-emerald-200
              hover:bg-emerald-50
              hover:text-emerald-700
              hover:shadow-[0_8px_20px_rgba(5,150,105,0.08)]
            "
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
            بازگشت به داشبورد
          </Link>
        </div>


        {/* ================= HEADER ================= */}
        <section className="relative overflow-hidden rounded-[28px] border border-emerald-800/10 bg-gradient-to-l from-[#064e3b] via-[#047857] to-[#059669] shadow-[0_20px_60px_rgba(6,78,59,0.15)]">
          {/* decorative patterns */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full border-[45px] border-white/[0.04]" />
            <div className="absolute -bottom-32 right-[30%] h-72 w-72 rounded-full border-[55px] border-white/[0.035]" />

            <div
              className="absolute inset-0 opacity-[0.045]"
              style={{
                backgroundImage:
                  'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '22px 22px',
              }}
            />
          </div>

          <div className="relative p-6 sm:p-8 lg:p-9">
            <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">

              <div className="max-w-3xl">
                <div className="mb-5 flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[12px] font-medium text-emerald-50 backdrop-blur-md">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    مدیریت ساختار سازمانی
                  </span>
                </div>

                <div className="flex items-start gap-4 sm:gap-5">
                  <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-inner backdrop-blur-md sm:flex">
                    <Building2 className="h-7 w-7 text-white" />
                  </div>

                  <div>
                    <h1 className="text-[26px] font-black leading-tight tracking-tight text-white sm:text-[32px]">
                      درخواست‌های تأسیس
                    </h1>

                    <p className="mt-3 max-w-2xl text-[14px] leading-7 text-emerald-50/75 sm:text-[15px]">
                      مشاهده، پیگیری و مدیریت درخواست‌های تأسیس واحدهای
                      سازمانی و بررسی وضعیت هر درخواست در فرآیند تأیید
                    </p>
                  </div>
                </div>
              </div>

              {canManage && (
                <Link href="/viam/establishment/new">
                  <button
                    className="
                      group inline-flex h-12 items-center justify-center
                      gap-2.5 rounded-2xl bg-white px-5
                      text-[14px] font-extrabold text-emerald-700
                      shadow-[0_10px_30px_rgba(0,0,0,0.12)]
                      transition-all duration-300
                      hover:-translate-y-0.5 hover:bg-emerald-50
                      hover:shadow-[0_14px_35px_rgba(0,0,0,0.16)]
                      active:translate-y-0
                    "
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 transition-colors group-hover:bg-emerald-200">
                      <Plus className="h-4 w-4" />
                    </span>

                    ثبت درخواست جدید
                  </button>
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* ================= STATS ================= */}
        <section className="relative z-10 -mt-1 grid grid-cols-2 gap-3 px-0 pt-5 md:grid-cols-4 lg:gap-4">

          <StatCard
            icon={<LayoutList className="h-5 w-5" />}
            title="کل درخواست‌ها"
            value={totalCount}
            description="مجموع درخواست‌های ثبت‌شده"
            iconClass="bg-slate-100 text-slate-700"
          />

          <StatCard
            icon={<Clock3 className="h-5 w-5" />}
            title="در انتظار تأیید"
            value={submittedCount}
            description="درخواست‌های ارسال‌شده"
            iconClass="bg-amber-50 text-amber-600"
          />

          <StatCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            title="تأیید شده"
            value={approvedCount}
            description="درخواست‌های نهایی‌شده"
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <StatCard
            icon={<FileText className="h-5 w-5" />}
            title="پیش‌نویس"
            value={draftCount}
            description="درخواست‌های تکمیل‌نشده"
            iconClass="bg-blue-50 text-blue-600"
          />
        </section>

        {/* ================= FILTERS ================= */}
        <section className="mt-6 rounded-[22px] border border-slate-200/80 bg-white p-3 shadow-[0_8px_30px_rgba(15,23,42,0.035)] sm:p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-center gap-3 px-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CircleDot className="h-5 w-5" />
              </div>

              <div>
                <p className="text-[14px] font-extrabold text-slate-800">
                  فیلتر درخواست‌ها
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  نمایش بر اساس وضعیت فرآیند
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {filters.map((item) => {
                const Icon = item.icon;
                const isActive = filter === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setFilter(item.id)}
                    className={`
                      inline-flex h-10 items-center gap-2 rounded-xl border
                      px-3.5 text-[12px] font-bold transition-all duration-200
                      ${
                        isActive
                          ? item.active
                          : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-700'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />

                    <span>{item.label}</span>

                    <span
                      className={`
                        flex min-w-[22px] items-center justify-center
                        rounded-md px-1.5 py-0.5 text-[10px]
                        ${
                          isActive
                            ? 'bg-white/15 text-white'
                            : 'bg-slate-100 text-slate-500'
                        }
                      `}
                    >
                      {item.count.toLocaleString('fa-IR')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================= REQUEST LIST ================= */}
        <section className="mt-5 overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.04)]">

          {/* section heading */}
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[17px] font-black text-slate-800">
                  لیست درخواست‌ها
                </h2>

                <span className="rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
                  {filteredRequests.length.toLocaleString('fa-IR')} مورد
                </span>
              </div>

              <p className="mt-1.5 text-[12px] text-slate-400">
                برای مشاهده جزئیات، درخواست موردنظر را انتخاب کنید.
              </p>
            </div>

            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="inline-flex items-center gap-2 self-start rounded-xl px-3 py-2 text-[12px] font-bold text-slate-500 transition hover:bg-slate-50 hover:text-emerald-700"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                حذف فیلتر
              </button>
            )}
          </div>

          {filteredRequests.length === 0 ? (
            /* ================= EMPTY ================= */
            <div className="px-6 py-20 text-center">
              <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
                <div className="absolute inset-0 rounded-[30px] bg-emerald-50 rotate-6" />
                <div className="absolute inset-2 rounded-[24px] border border-emerald-100 bg-white shadow-sm" />

                <SearchX className="relative h-9 w-9 text-emerald-500" />
              </div>

              <h3 className="mt-6 text-[18px] font-black text-slate-800">
                درخواستی یافت نشد
              </h3>

              <p className="mx-auto mt-2 max-w-md text-[13px] leading-6 text-slate-400">
                در حال حاضر درخواستی مطابق با وضعیت انتخاب‌شده وجود
                ندارد.
              </p>

              {canManage && (
                <Link href="/viam/establishment/new">
                  <button className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-5 text-[13px] font-bold text-white shadow-lg shadow-emerald-600/15 transition hover:-translate-y-0.5 hover:bg-emerald-700">
                    <FilePlus2 className="h-4 w-4" />
                    ثبت اولین درخواست
                  </button>
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* ================= DESKTOP TABLE ================= */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#fafcfb]">
                      <th className="w-[70px] px-6 py-4 text-right text-[11px] font-bold text-slate-400">
                        ردیف
                      </th>

                      <th className="px-5 py-4 text-right text-[11px] font-bold text-slate-400">
                        عنوان درخواست
                      </th>

                      <th className="px-5 py-4 text-right text-[11px] font-bold text-slate-400">
                        وضعیت
                      </th>

                      <th className="px-5 py-4 text-right text-[11px] font-bold text-slate-400">
                        پیشرفت فرآیند
                      </th>

                      <th className="px-5 py-4 text-right text-[11px] font-bold text-slate-400">
                        تاریخ ثبت
                      </th>

                      <th className="w-[120px] px-6 py-4 text-left text-[11px] font-bold text-slate-400">
                        عملیات
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRequests.map((req, index) => {
                      const currentStep = req.current_step || 1;
                      const progress = Math.min(
                        100,
                        (currentStep / 12) * 100
                      );

                      return (
                        <tr
                          key={req.id}
                          className="group border-t border-slate-100 transition-all duration-200 hover:bg-emerald-[0.015]"
                        >
                          <td className="px-6 py-5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-[11px] font-bold text-slate-500 transition group-hover:bg-emerald-50 group-hover:text-emerald-700">
                              {(index + 1).toLocaleString('fa-IR')}
                            </span>
                          </td>

                          <td className="px-5 py-5">
                            <div className="flex items-center gap-3.5">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-emerald-100 bg-emerald-50/60 text-emerald-600 transition-all duration-200 group-hover:border-emerald-200 group-hover:bg-emerald-100/70">
                                <Building2 className="h-5 w-5" />
                              </div>

                              <div className="min-w-0">
                                <p className="max-w-[420px] truncate text-[14px] font-extrabold text-slate-800">
                                  {req.title}
                                </p>

                                <p className="mt-1 text-[11px] text-slate-400">
                                  شناسه درخواست #{req.id}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-5">
                            {getStatusBadge(req.status)}
                          </td>

                          <td className="px-5 py-5">
                            <div className="w-[155px]">
                              <div className="mb-2 flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-600">
                                  گام{' '}
                                  {currentStep.toLocaleString('fa-IR')}
                                </span>

                                <span className="text-[10px] text-slate-400">
                                  از ۱۲
                                </span>
                              </div>

                              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-teal-500 transition-all duration-500"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-5">
                            <div className="flex items-center gap-2 text-[12px] font-medium text-slate-500">
                              <Clock3 className="h-4 w-4 text-slate-300" />

                              {new Date(
                                req.created_at
                              ).toLocaleDateString('fa-IR')}
                            </div>
                          </td>

                          <td className="px-6 py-5">
                            <Link
                              href={`/viam/establishment/${req.id}`}
                              className="
                                group/action mr-auto flex h-9 w-fit
                                items-center gap-1.5 rounded-xl border
                                border-slate-200 bg-white px-3
                                text-[11px] font-bold text-slate-600
                                transition-all duration-200
                                hover:border-emerald-200
                                hover:bg-emerald-50
                                hover:text-emerald-700
                              "
                            >
                              مشاهده
                              <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover/action:-translate-x-0.5" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ================= MOBILE CARDS ================= */}
              <div className="divide-y divide-slate-100 md:hidden">
                {filteredRequests.map((req, index) => {
                  const currentStep = req.current_step || 1;
                  const progress = Math.min(
                    100,
                    (currentStep / 12) * 100
                  );

                  return (
                    <div
                      key={req.id}
                      className="p-5 transition hover:bg-slate-50/50"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-emerald-50 text-emerald-600">
                          <Building2 className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[14px] font-extrabold leading-6 text-slate-800">
                                {req.title}
                              </p>

                              <p className="mt-0.5 text-[10px] text-slate-400">
                                درخواست #
                                {req.id}
                              </p>
                            </div>

                            <span className="text-[10px] font-bold text-slate-300">
                              {(index + 1).toLocaleString('fa-IR')}
                            </span>
                          </div>

                          <div className="mt-4">
                            {getStatusBadge(req.status)}
                          </div>

                          <div className="mt-5">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-600">
                                گام{' '}
                                {currentStep.toLocaleString('fa-IR')}{' '}
                                از ۱۲
                              </span>

                              <span className="text-[10px] text-slate-400">
                                {Math.round(progress).toLocaleString(
                                  'fa-IR'
                                )}
                                ٪
                              </span>
                            </div>

                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-teal-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>

                          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                            <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                              <Clock3 className="h-3.5 w-3.5" />
                              {new Date(
                                req.created_at
                              ).toLocaleDateString('fa-IR')}
                            </span>

                            <Link
                              href={`/viam/establishment/${req.id}`}
                              className="inline-flex items-center gap-1 text-[12px] font-extrabold text-emerald-700"
                            >
                              مشاهده جزئیات
                              <ChevronLeft className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* footer */}
          {filteredRequests.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 bg-[#fafcfb] px-5 py-3.5 sm:px-6">
              <p className="text-[11px] text-slate-400">
                نمایش{' '}
                <span className="font-bold text-slate-600">
                  {filteredRequests.length.toLocaleString('fa-IR')}
                </span>{' '}
                درخواست
              </p>

              <div className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                اطلاعات به‌روز
              </div>
            </div>
          )}
        </section>

        {/* Bottom space */}
        <div className="h-8" />
      </main>
    </div>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  icon,
  title,
  value,
  description,
  iconClass,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  description: string;
  iconClass: string;
}) {
  return (
    <div
      className="
        group relative overflow-hidden rounded-[20px]
        border border-slate-200/80 bg-white p-4
        shadow-[0_8px_25px_rgba(15,23,42,0.035)]
        transition-all duration-300
        hover:-translate-y-0.5
        hover:border-emerald-200
        hover:shadow-[0_15px_35px_rgba(15,23,42,0.06)]
        sm:p-5
      "
    >
      <div className="absolute -left-8 -top-8 h-20 w-20 rounded-full bg-emerald-50/40 opacity-0 blur-xl transition group-hover:opacity-100" />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold text-slate-400 sm:text-[12px]">
            {title}
          </p>

          <p className="mt-2 text-[25px] font-black tracking-tight text-slate-800 sm:text-[29px]">
            {value.toLocaleString('fa-IR')}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] ${iconClass}`}
        >
          {icon}
        </div>
      </div>

      <p className="relative mt-2 hidden text-[10px] text-slate-400 sm:block">
        {description}
      </p>
    </div>
  );
}
