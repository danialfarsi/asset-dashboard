'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

interface VIAMStats {
  establishment_requests: number;
  active_establishments: number;
  total_assets: number;
  assets_with_owner: number;
  raci_template_complete: boolean;
  committees: number;
  meetings: number;
  resolutions: number;
  workflows: number;
  cases: number;
  open_cases: number;
  knowledge_extractions: number;
  risk_assessments: number;
  compliance_checklists: number;
  kpis_count: number;
  maturity_level: number;
  engine_connections: number;
}

interface EstablishmentRequest {
  id: number;
  title: string;
  status: string;
  current_step: number;
  created_at: string;
}

export default function VIAMDashboard() {
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<VIAMStats | null>(null);
  const [latestRequest, setLatestRequest] =
    useState<EstablishmentRequest | null>(null);
  const [recentRequests, setRecentRequests] = useState<
    EstablishmentRequest[]
  >([]);

  /* -------------------------------------------------------------------------- */
  /*                                  FETCH DATA                                */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);

      try {
        const requestsRes = await api.get(
          '/intangible/viam/establishment-requests/',
          {
            params: { limit: 5 },
          }
        );

        const requests = requestsRes.data.results || [];

        const [
          chartersRes,
          committeesRes,
          meetingsRes,
          workflowsRes,
          casesRes,
          knowledgeRes,
          risksRes,
          kpisRes,
          raciTemplateRes,
          assetsRes,
        ] = await Promise.allSettled([
          api.get('/intangible/viam/charters/'),
          api.get('/intangible/viam/committee/committees/'),
          api.get('/intangible/viam/committee/meetings/'),
          api.get('/intangible/viam/workflow/workflows/'),
          api.get('/intangible/viam/workflow/cases/'),
          api.get(
            '/intangible/viam/knowledge/knowledge-extractions/'
          ),
          api.get('/intangible/viam/risk/risks/'),
          api.get('/intangible/viam/performance/kpis/'),
          api.get('/intangible/viam/ownership/raci-template/my/'),
          api.get('/intangible/screened-assets/'),
        ]);

        const getCount = (r: any) => {
          if (r.status === 'fulfilled') {
            return r.value.data?.count ?? 0;
          }

          return 0;
        };

        const raciTemplate =
          raciTemplateRes.status === 'fulfilled'
            ? raciTemplateRes.value.data?.template
            : null;

        setStats({
          establishment_requests: requests.length,
          active_establishments: requests.filter(
            (r: any) => r.status === 'active'
          ).length,
          total_assets: getCount(assetsRes),
          assets_with_owner: 0,
          raci_template_complete: !!(
            raciTemplate &&
            Object.keys(raciTemplate.matrix || {}).length >= 10
          ),
          committees: getCount(committeesRes),
          meetings: getCount(meetingsRes),
          resolutions: 0,
          workflows: getCount(workflowsRes),
          cases: getCount(casesRes),
          open_cases: 0,
          knowledge_extractions: getCount(knowledgeRes),
          risk_assessments: getCount(risksRes),
          compliance_checklists: 0,
          kpis_count: getCount(kpisRes),
          maturity_level: 0,
          engine_connections: 0,
        });

        if (requests.length > 0) {
          setLatestRequest(requests[0]);
          setRecentRequests(requests);
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                                   HELPERS                                  */
  /* -------------------------------------------------------------------------- */

  const getDisplayName = () => {
    if (!user) return 'کاربر';

    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }

    if (user.first_name) return user.first_name;
    if (user.username) return user.username;

    return 'کاربر';
  };

  const getRoleLabel = () => {
    if (user?.role === 'super_admin') {
      return 'ادمین کل پلتفرم';
    }

    if (user?.role === 'org_admin') {
      return 'مدیرعامل / رییس سازمان';
    }

    if (
      user?.role === 'org_user' &&
      (user as any)?.department_name
    ) {
      return `رییس واحد ${(user as any).department_name}`;
    }

    if (user?.role === 'org_user') {
      return 'کارشناس';
    }

    return 'کاربر';
  };

  const isSuperAdmin = user?.role === 'super_admin';
  const isOrgAdmin = user?.role === 'org_admin';
  const canManage = isSuperAdmin || isOrgAdmin;

  /* -------------------------------------------------------------------------- */
  /*                                   LOADING                                  */
  /* -------------------------------------------------------------------------- */

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#f6f8fb]"
      >
        <div className="text-center">
          <div className="relative mx-auto h-14 w-14">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200" />

            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-600" />
          </div>

          <p className="mt-5 text-sm font-bold text-slate-700">
            در حال آماده‌سازی داشبورد
          </p>

          <p className="mt-1 text-xs text-slate-400">
            اطلاعات Meta-VIAM در حال دریافت است...
          </p>
        </div>
      </main>
    );
  }

  const currentStep = latestRequest?.current_step || 0;

  const progressPercent = Math.round(
    (currentStep / 12) * 100
  );

  /* -------------------------------------------------------------------------- */
  /*                                    VIEW                                    */
  /* -------------------------------------------------------------------------- */

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f6f8fb] text-slate-900"
    >
      {/* Background */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-blue-100/40 blur-3xl" />

        <div className="absolute -left-48 top-[30%] h-[480px] w-[480px] rounded-full bg-violet-100/30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
        {/* ================================================================== */}
        {/* HERO                                                               */}
        {/* ================================================================== */}

        <section className="relative mb-6 overflow-hidden rounded-[32px] bg-gradient-to-l from-slate-950 via-[#101c34] to-[#10346e] px-6 py-7 text-white shadow-[0_25px_70px_-30px_rgba(15,23,42,0.65)] sm:px-8 sm:py-9">
          {/* Decoration */}

          <div className="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-40 right-[25%] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-blue-100 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                Meta-VIAM Management Console
              </div>

              <p className="text-sm font-medium text-slate-300">
                خوش آمدید،
              </p>

              <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl lg:text-[36px]">
                {getDisplayName()}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-slate-300">
                  {getRoleLabel()}
                </span>

                <span className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-slate-300">
                  سامانه مدیریت دارایی‌های نامشهود
                </span>
              </div>
            </div>

            {canManage && (
              <Link
                href="/viam/establishment/new"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-black text-slate-950 shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-blue-50"
              >
                <PlusIcon />
                ثبت درخواست تأسیس جدید
              </Link>
            )}
          </div>
        </section>

        {/* ================================================================== */}
        {/* KPI CARDS                                                          */}
        {/* ================================================================== */}

        <section className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            title="دارایی‌های ثبت‌شده"
            value={stats?.total_assets || 0}
            description="دارایی‌های شناسایی‌شده"
            icon={<AssetIcon />}
            tone="blue"
            href="/dashboard/intangible/assets"
          />

          <StatCard
            title="درخواست‌های تأسیس"
            value={stats?.establishment_requests || 0}
            description={`${stats?.active_establishments || 0} واحد فعال`}
            icon={<RequestIcon />}
            tone="emerald"
            href="/viam/establishment/list"
          />

          <StatCard
            title="کمیته‌ها"
            value={stats?.committees || 0}
            description={`${stats?.meetings || 0} جلسه ثبت‌شده`}
            icon={<UsersIcon />}
            tone="violet"
            href="/viam/committee"
          />

          <StatCard
            title="شاخص‌های عملکرد"
            value={stats?.kpis_count || 0}
            description="KPI تعریف‌شده"
            icon={<ChartIcon />}
            tone="amber"
            href="/viam/performance"
          />
        </section>

        {/* ================================================================== */}
        {/* CURRENT REQUEST                                                    */}
        {/* ================================================================== */}

        {latestRequest && (
          <section className="mb-6 overflow-hidden rounded-[28px] border border-slate-200/70 bg-white shadow-sm">
            <div className="grid lg:grid-cols-[1fr_300px]">
              {/* Main */}

              <div className="p-6 sm:p-7">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
                        درخواست جاری
                      </span>

                      <StatusBadge
                        status={latestRequest.status}
                      />

                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500">
                        #{latestRequest.id}
                      </span>
                    </div>

                    <h2 className="text-lg font-black leading-8 text-slate-900 sm:text-xl">
                      {latestRequest.title}
                    </h2>

                    <p className="mt-2 text-xs text-slate-400">
                      ایجاد و راه‌اندازی واحد IAM سازمان
                    </p>
                  </div>

                  <Link
                    href={`/viam/establishment/${latestRequest.id}`}
                    className="group inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-blue-700"
                  >
                    ادامه فرآیند
                    <ArrowLeftIcon />
                  </Link>
                </div>

                {/* Progress */}

                <div className="mt-7">
                  <div className="mb-2.5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-600">
                        پیشرفت استقرار
                      </span>

                      <span className="mr-2 text-xs text-slate-400">
                        گام {currentStep} از ۱۲
                      </span>
                    </div>

                    <span className="text-sm font-black text-blue-600">
                      {progressPercent}٪
                    </span>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-l from-blue-600 to-cyan-500 transition-all duration-700"
                      style={{
                        width: `${progressPercent}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Current Step */}

              <div className="border-t border-slate-100 bg-slate-50/70 p-6 lg:border-r lg:border-t-0">
                <p className="text-xs font-bold text-slate-400">
                  مرحله فعلی
                </p>

                <div className="mt-4 flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-base font-black text-white shadow-md shadow-blue-600/20">
                    {currentStep}
                  </div>

                  <div>
                    <p className="text-sm font-black text-slate-900">
                      {getStepName(currentStep)}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      مرحله {currentStep} از فرآیند ۱۲ مرحله‌ای
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ================================================================== */}
        {/* MAIN CONTENT                                                       */}
        {/* ================================================================== */}

        <div className="grid items-start gap-6 xl:grid-cols-[1fr_330px]">
          {/* ================================================================ */}
          {/* VIAM MODULES                                                     */}
          {/* ================================================================ */}

          <div>
            <SectionHeader
              title="ماژول‌های Meta-VIAM"
              description="نمای کلی وضعیت اجزای عملیاتی سیستم"
            />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2">
              <ModuleCard
                code="VIAM-01"
                title="استقرار"
                description="ایجاد و راه‌اندازی واحد IAM"
                href="/viam/establishment/list"
                icon={<RocketIcon />}
                tone="blue"
                metrics={[
                  {
                    label: 'درخواست‌ها',
                    value:
                      stats?.establishment_requests || 0,
                  },
                  {
                    label: 'واحدهای فعال',
                    value:
                      stats?.active_establishments || 0,
                  },
                ]}
              />

              <ModuleCard
                code="VIAM-05"
                title="RACI"
                description="ساختار نقش‌ها و مسئولیت‌ها"
                href="/viam/raci"
                icon={<RaciIcon />}
                tone="violet"
                metrics={[
                  {
                    label: 'وضعیت Template',
                    value: stats?.raci_template_complete
                      ? 'کامل'
                      : 'ناقص',
                    status:
                      stats?.raci_template_complete
                        ? 'success'
                        : 'danger',
                  },
                ]}
              />

              <ModuleCard
                code="VIAM-06"
                title="گردش‌کار"
                description="فرآیندها و پرونده‌های عملیاتی"
                href="/viam/workflow"
                icon={<WorkflowIcon />}
                tone="cyan"
                metrics={[
                  {
                    label: 'گردش‌کارها',
                    value: stats?.workflows || 0,
                  },
                  {
                    label: 'پرونده‌ها',
                    value: stats?.cases || 0,
                  },
                ]}
              />

              <ModuleCard
                code="VIAM-07"
                title="کمیته"
                description="جلسات و ساختار تصمیم‌گیری"
                href="/viam/committee"
                icon={<UsersIcon />}
                tone="emerald"
                metrics={[
                  {
                    label: 'کمیته‌ها',
                    value: stats?.committees || 0,
                  },
                  {
                    label: 'جلسات',
                    value: stats?.meetings || 0,
                  },
                ]}
              />

              <ModuleCard
                code="VIAM-08"
                title="مدیریت دانش"
                description="استخراج و مدیریت دانش سازمانی"
                href="/viam/knowledge"
                icon={<KnowledgeIcon />}
                tone="amber"
                metrics={[
                  {
                    label: 'استخراج‌های دانش',
                    value:
                      stats?.knowledge_extractions || 0,
                  },
                ]}
              />

              <ModuleCard
                code="VIAM-09"
                title="ریسک"
                description="ارزیابی و حفاظت از دارایی‌ها"
                href="/viam/risk"
                icon={<ShieldIcon />}
                tone="rose"
                metrics={[
                  {
                    label: 'ارزیابی‌های ریسک',
                    value:
                      stats?.risk_assessments || 0,
                  },
                ]}
              />
            </div>

            {/* ============================================================ */}
            {/* RECENT REQUESTS                                              */}
            {/* ============================================================ */}

            <div className="mt-7">
              <div className="mb-4 flex items-end justify-between">
                <SectionHeader
                  title="درخواست‌های اخیر"
                  description="آخرین درخواست‌های ثبت‌شده در سامانه"
                  compact
                />

                <Link
                  href="/viam/establishment/list"
                  className="hidden items-center gap-1 text-xs font-bold text-blue-600 transition hover:text-blue-800 sm:flex"
                >
                  مشاهده همه
                  <ArrowLeftIcon />
                </Link>
              </div>

              <div className="overflow-hidden rounded-[26px] border border-slate-200/70 bg-white shadow-sm">
                {recentRequests.length === 0 ? (
                  <EmptyState />
                ) : (
                  <>
                    {/* Desktop table */}

                    <div className="hidden overflow-x-auto md:block">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/70">
                            <th className="px-5 py-4 text-right text-[11px] font-black text-slate-400">
                              درخواست
                            </th>

                            <th className="px-5 py-4 text-right text-[11px] font-black text-slate-400">
                              پیشرفت
                            </th>

                            <th className="px-5 py-4 text-right text-[11px] font-black text-slate-400">
                              وضعیت
                            </th>

                            <th className="px-5 py-4 text-right text-[11px] font-black text-slate-400">
                              تاریخ ثبت
                            </th>

                            <th className="px-5 py-4" />
                          </tr>
                        </thead>

                        <tbody>
                          {recentRequests.map((req) => (
                            <tr
                              key={req.id}
                              className="group border-b border-slate-100 transition last:border-0 hover:bg-slate-50/60"
                            >
                              <td className="px-5 py-4">
                                <p className="max-w-[280px] truncate text-sm font-bold text-slate-800">
                                  {req.title}
                                </p>

                                <p className="mt-1 text-[11px] text-slate-400">
                                  #{req.id}
                                </p>
                              </td>

                              <td className="px-5 py-4">
                                <div className="flex min-w-[120px] items-center gap-3">
                                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                      className="h-full rounded-full bg-blue-500"
                                      style={{
                                        width: `${Math.round(
                                          (req.current_step /
                                            12) *
                                            100
                                        )}%`,
                                      }}
                                    />
                                  </div>

                                  <span className="text-xs font-bold text-slate-500">
                                    {req.current_step}/12
                                  </span>
                                </div>
                              </td>

                              <td className="px-5 py-4">
                                <StatusBadge
                                  status={req.status}
                                />
                              </td>

                              <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                                {new Date(
                                  req.created_at
                                ).toLocaleDateString(
                                  'fa-IR'
                                )}
                              </td>

                              <td className="px-5 py-4">
                                <Link
                                  href={`/viam/establishment/${req.id}`}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                                >
                                  <ArrowLeftIcon />
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile */}

                    <div className="divide-y divide-slate-100 md:hidden">
                      {recentRequests.map((req) => (
                        <Link
                          key={req.id}
                          href={`/viam/establishment/${req.id}`}
                          className="block p-5 transition hover:bg-slate-50"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-800">
                                {req.title}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                #{req.id} · گام{' '}
                                {req.current_step} از ۱۲
                              </p>
                            </div>

                            <StatusBadge
                              status={req.status}
                            />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* QUICK ACTIONS                                                    */}
          {/* ================================================================ */}

          <aside className="space-y-5 xl:sticky xl:top-6">
            {canManage && (
              <div className="rounded-[26px] border border-slate-200/70 bg-white p-5 shadow-sm">
                <div className="mb-5">
                  <h2 className="text-base font-black text-slate-900">
                    اقدامات سریع
                  </h2>

                  <p className="mt-1 text-xs leading-6 text-slate-400">
                    دسترسی مستقیم به عملیات پرکاربرد
                  </p>
                </div>

                <div className="space-y-1.5">
                  <QuickAction
                    href="/viam/charter/new"
                    icon={<DocumentIcon />}
                    label="تدوین منشور"
                  />

                  <QuickAction
                    href="/viam/committee"
                    icon={<UsersIcon />}
                    label="مدیریت کمیته"
                  />

                  <QuickAction
                    href="/viam/raci"
                    icon={<RaciIcon />}
                    label="تعریف RACI"
                  />

                  <QuickAction
                    href="/viam/strategic/plan"
                    icon={<TargetIcon />}
                    label="برنامه استراتژیک"
                  />

                  <QuickAction
                    href="/viam/awareness"
                    icon={<MegaphoneIcon />}
                    label="جریان‌سازی"
                  />

                  <QuickAction
                    href="/viam/competency"
                    icon={<EducationIcon />}
                    label="توانمندسازی"
                  />

                  <QuickAction
                    href="/viam/workflow"
                    icon={<WorkflowIcon />}
                    label="گردش‌کار"
                  />

                  <QuickAction
                    href="/viam/knowledge"
                    icon={<KnowledgeIcon />}
                    label="مدیریت دانش"
                  />

                  <QuickAction
                    href="/viam/risk"
                    icon={<ShieldIcon />}
                    label="ریسک و حفاظت"
                  />

                  <QuickAction
                    href="/viam/performance"
                    icon={<ChartIcon />}
                    label="عملکرد و بلوغ"
                  />

                  <QuickAction
                    href="/viam/integration"
                    icon={<IntegrationIcon />}
                    label="Integration Hub"
                  />
                </div>
              </div>
            )}

            {/* System overview */}

            <div className="overflow-hidden rounded-[26px] border border-slate-200/70 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5">
                <h3 className="text-sm font-black text-slate-900">
                  وضعیت Meta-VIAM
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  خلاصه فعالیت سیستم
                </p>
              </div>

              <div className="space-y-4 p-5">
                <MiniMetric
                  label="دارایی‌های ثبت‌شده"
                  value={stats?.total_assets || 0}
                />

                <MiniMetric
                  label="گردش‌کارها"
                  value={stats?.workflows || 0}
                />

                <MiniMetric
                  label="پرونده‌ها"
                  value={stats?.cases || 0}
                />

                <MiniMetric
                  label="ارزیابی‌های ریسک"
                  value={stats?.risk_assessments || 0}
                />

                <MiniMetric
                  label="استخراج‌های دانش"
                  value={
                    stats?.knowledge_extractions || 0
                  }
                />
              </div>
            </div>
          </aside>
        </div>

        <p className="mt-9 text-center text-xs text-slate-400">
          Meta-VIAM · سامانه مدیریت یکپارچه دارایی‌های
          نامشهود
        </p>
      </div>
    </main>
  );
}

/* =============================================================================
   COMPONENTS
============================================================================= */

function StatCard({
  title,
  value,
  description,
  icon,
  tone,
  href,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  tone: 'blue' | 'emerald' | 'violet' | 'amber';
  href: string;
}) {
  const tones = {
    blue: {
      icon: 'bg-blue-50 text-blue-600',
      hover: 'group-hover:border-blue-200',
    },

    emerald: {
      icon: 'bg-emerald-50 text-emerald-600',
      hover: 'group-hover:border-emerald-200',
    },

    violet: {
      icon: 'bg-violet-50 text-violet-600',
      hover: 'group-hover:border-violet-200',
    },

    amber: {
      icon: 'bg-amber-50 text-amber-600',
      hover: 'group-hover:border-amber-200',
    },
  };

  const style = tones[tone];

  return (
    <Link href={href} className="group">
      <div
        className={`h-full rounded-[22px] border border-slate-200/70 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5 ${style.hover}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${style.icon}`}
          >
            {icon}
          </div>

          <ArrowUpLeftIcon />
        </div>

        <p className="mt-5 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
          {value.toLocaleString('fa-IR')}
        </p>

        <p className="mt-1 text-xs font-bold leading-6 text-slate-700 sm:text-sm">
          {title}
        </p>

        <p className="mt-1 hidden text-[11px] text-slate-400 sm:block">
          {description}
        </p>
      </div>
    </Link>
  );
}

function ModuleCard({
  code,
  title,
  description,
  href,
  icon,
  tone,
  metrics,
}: {
  code: string;
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  tone:
    | 'blue'
    | 'violet'
    | 'cyan'
    | 'emerald'
    | 'amber'
    | 'rose';
  metrics: {
    label: string;
    value: React.ReactNode;
    status?: 'success' | 'danger';
  }[];
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600',
    violet: 'bg-violet-50 text-violet-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  };

  return (
    <Link href={href} className="group">
      <article className="h-full rounded-[24px] border border-slate-200/70 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${tones[tone]}`}
            >
              {icon}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900">
                  {title}
                </h3>

                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-black text-slate-400">
                  {code}
                </span>
              </div>

              <p className="mt-1 text-[11px] text-slate-400">
                {description}
              </p>
            </div>
          </div>

          <span className="text-slate-300 transition group-hover:-translate-x-0.5 group-hover:text-blue-600">
            <ArrowLeftIcon />
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className={`rounded-xl bg-slate-50 px-3 py-2.5 ${
                metrics.length === 1
                  ? 'col-span-2'
                  : ''
              }`}
            >
              <p className="text-[10px] text-slate-400">
                {metric.label}
              </p>

              <p
                className={`mt-1 text-sm font-black ${
                  metric.status === 'success'
                    ? 'text-emerald-600'
                    : metric.status === 'danger'
                      ? 'text-rose-600'
                      : 'text-slate-800'
                }`}
              >
                {typeof metric.value === 'number'
                  ? metric.value.toLocaleString('fa-IR')
                  : metric.value}
              </p>
            </div>
          ))}
        </div>
      </article>
    </Link>
  );
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-xl px-3 py-2.5 transition hover:bg-slate-50"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition group-hover:bg-blue-50 group-hover:text-blue-600">
          {icon}
        </span>

        <span className="text-xs font-bold text-slate-700 transition group-hover:text-slate-950">
          {label}
        </span>
      </div>

      <span className="text-slate-300 transition group-hover:-translate-x-0.5 group-hover:text-blue-500">
        <ArrowLeftIcon />
      </span>
    </Link>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const map: Record<
    string,
    {
      label: string;
      cls: string;
      dot: string;
    }
  > = {
    draft: {
      label: 'پیش‌نویس',
      cls: 'bg-slate-100 text-slate-600',
      dot: 'bg-slate-400',
    },

    submitted: {
      label: 'ارسال شده',
      cls: 'bg-amber-50 text-amber-700',
      dot: 'bg-amber-500',
    },

    approved: {
      label: 'تأیید شده',
      cls: 'bg-emerald-50 text-emerald-700',
      dot: 'bg-emerald-500',
    },

    active: {
      label: 'فعال',
      cls: 'bg-blue-50 text-blue-700',
      dot: 'bg-blue-500',
    },

    rejected: {
      label: 'رد شده',
      cls: 'bg-rose-50 text-rose-700',
      dot: 'bg-rose-500',
    },
  };

  const s = map[status] || map.draft;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${s.cls}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${s.dot}`}
      />

      {s.label}
    </span>
  );
}

function SectionHeader({
  title,
  description,
  compact = false,
}: {
  title: string;
  description: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? '' : 'mb-4'}>
      <h2 className="text-base font-black text-slate-900 sm:text-lg">
        {title}
      </h2>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500">
        {label}
      </span>

      <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-black text-slate-800">
        {value.toLocaleString('fa-IR')}
      </span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="px-6 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <RequestIcon />
      </div>

      <p className="mt-4 text-sm font-bold text-slate-700">
        هنوز درخواستی ثبت نشده است
      </p>

      <p className="mt-1 text-xs text-slate-400">
        درخواست‌های جدید در این بخش نمایش داده می‌شوند.
      </p>
    </div>
  );
}

/* =============================================================================
   HELPERS
============================================================================= */

function getStepName(step: number) {
  const steps: Record<number, string> = {
    1: 'ثبت درخواست تأسیس',
    2: 'تعیین حامی اجرایی',
    3: 'انتخاب مدل حکمرانی',
    4: 'تعیین محل استقرار',
    5: 'تدوین منشور',
    6: 'تشکیل کمیته',
    7: 'تعیین مدیر IAM',
    8: 'تعیین نمایندگان',
    9: 'تعریف RACI',
    10: 'مدل عملیاتی',
    11: 'پیکربندی پلتفرم',
    12: 'آغاز پایلوت',
  };

  return steps[step] || 'فرآیند تأسیس';
}

/* =============================================================================
   ICONS
============================================================================= */

const IconBase = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

function PlusIcon() {
  return (
    <IconBase>
      <path d="M12 5v14M5 12h14" />
    </IconBase>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}

function ArrowUpLeftIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-slate-300 transition group-hover:text-slate-500"
    >
      <path d="M17 7 7 17" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

function AssetIcon() {
  return (
    <IconBase>
      <path d="m21 8-9 5-9-5 9-5 9 5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 16 9 5 9-5" />
    </IconBase>
  );
}

function RequestIcon() {
  return (
    <IconBase>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8M8 17h5" />
    </IconBase>
  );
}

function UsersIcon() {
  return (
    <IconBase>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </IconBase>
  );
}

function ChartIcon() {
  return (
    <IconBase>
      <path d="M3 3v18h18" />
      <path d="m7 16 4-5 4 3 5-7" />
    </IconBase>
  );
}

function RocketIcon() {
  return (
    <IconBase>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.9 12.9 0 0 1 22 2c0 2.72-.78 7.5-6.05 11a22.4 22.4 0 0 1-3.95 2Z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </IconBase>
  );
}

function RaciIcon() {
  return (
    <IconBase>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
      <path d="m13 14 2 2 4-4" />
    </IconBase>
  );
}

function WorkflowIcon() {
  return (
    <IconBase>
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="15" y="15" width="6" height="6" rx="1" />
      <path d="M6 9v4a2 2 0 0 0 2 2h7" />
      <path d="M15 6h2a2 2 0 0 1 2 2v7" />
    </IconBase>
  );
}

function KnowledgeIcon() {
  return (
    <IconBase>
      <path d="M9.5 2A2.5 2.5 0 0 0 7 4.5v.55A3.5 3.5 0 0 0 4 8.5c0 1.06.47 2.01 1.21 2.65A3.5 3.5 0 0 0 7 17.5V19a3 3 0 0 0 3 3h2V2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 1 17 4.5v.55A3.5 3.5 0 0 1 20 8.5c0 1.06-.47 2.01-1.21 2.65A3.5 3.5 0 0 1 17 17.5V19a3 3 0 0 1-3 3h-2V2Z" />
    </IconBase>
  );
}

function ShieldIcon() {
  return (
    <IconBase>
      <path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3v8Z" />
      <path d="m9 12 2 2 4-4" />
    </IconBase>
  );
}

function DocumentIcon() {
  return (
    <IconBase>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
    </IconBase>
  );
}

function TargetIcon() {
  return (
    <IconBase>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </IconBase>
  );
}

function MegaphoneIcon() {
  return (
    <IconBase>
      <path d="m3 11 18-5v12L3 14v-3Z" />
      <path d="M11.6 16.8 13 21H8l-1.5-6" />
    </IconBase>
  );
}

function EducationIcon() {
  return (
    <IconBase>
      <path d="m2 10 10-5 10 5-10 5L2 10Z" />
      <path d="M6 12.5V17c3 2 9 2 12 0v-4.5" />
    </IconBase>
  );
}

function IntegrationIcon() {
  return (
    <IconBase>
      <path d="M12 22v-5" />
      <path d="M9 8V2" />
      <path d="M15 8V2" />
      <path d="M18 8v5a6 6 0 0 1-12 0V8Z" />
    </IconBase>
  );
}
