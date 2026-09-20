'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { viamApi } from '@/services/viam/api';
import { useAuthStore } from '@/store/auth-store';

import { Step2Sponsor } from '@/components/viam/steps/Step2Sponsor';
import { Step3Governance } from '@/components/viam/steps/Step3Governance';
import { Step4Location } from '@/components/viam/steps/Step4Location';
import { Step5Charter } from '@/components/viam/steps/Step5Charter';
import { Step6Committee } from '@/components/viam/steps/Step6Committee';
import { Step7Manager } from '@/components/viam/steps/Step7Manager';
import { Step8Representatives } from '@/components/viam/steps/Step8Representatives';
import { Step9RACI } from '@/components/viam/steps/Step9RACI';
import { Step10OperationalModel } from '@/components/viam/steps/Step10OperationalModel';
import { Step11PlatformConfig } from '@/components/viam/steps/Step11PlatformConfig';
import { Step12Pilot } from '@/components/viam/steps/Step12Pilot';

/* -------------------------------------------------------------------------- */
/*                              HELPERS                                       */
/* -------------------------------------------------------------------------- */

/** تبدیل اعداد به فارسی */
const toFa = (num: number | string | null | undefined): string => {
  if (num === null || num === undefined) return '—';
  return String(num).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
};

/** تبدیل + Locale به فارسی */
const faNum = (num: number | string): string => {
  return Number(num).toLocaleString('fa-IR');
};

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

const STEP_NAMES: Record<number, string> = {
  1: 'ثبت درخواست تأسیس',
  2: 'تعیین حامی اجرایی',
  3: 'انتخاب مدل حکمرانی',
  4: 'تعیین محل استقرار سازمانی',
  5: 'تدوین منشور',
  6: 'تشکیل کمیته',
  7: 'تعیین مدیر IAM',
  8: 'تعیین نمایندگان واحدها',
  9: 'تعریف RACI اولیه',
  10: 'تصویب مدل عملیاتی',
  11: 'پیکربندی در پلتفرم',
  12: 'آغاز پایلوت',
};

const STEP_DESCRIPTIONS: Record<number, string> = {
  1: 'ثبت اطلاعات و توجیه اولیه',
  2: 'انتخاب Sponsor سازمانی',
  3: 'مشخص‌کردن ساختار حکمرانی',
  4: 'تعیین جایگاه واحد در سازمان',
  5: 'تعریف مأموریت و اهداف',
  6: 'تشکیل ساختار تصمیم‌گیری',
  7: 'انتخاب مسئول اصلی واحد',
  8: 'معرفی نمایندگان سازمان',
  9: 'تعیین مسئولیت‌ها و نقش‌ها',
  10: 'تعریف فرآیندهای عملیاتی',
  11: 'آماده‌سازی محیط پلتفرم',
  12: 'راه‌اندازی و ارزیابی پایلوت',
};

const STEP_COMPONENTS: Record<number, React.ComponentType<any>> = {
  2: Step2Sponsor,
  3: Step3Governance,
  4: Step4Location,
  5: Step5Charter,
  6: Step6Committee,
  7: Step7Manager,
  8: Step8Representatives,
  9: Step9RACI,
  10: Step10OperationalModel,
  11: Step11PlatformConfig,
  12: Step12Pilot,
};

/* -------------------------------------------------------------------------- */
/*                                    ICONS                                   */
/* -------------------------------------------------------------------------- */

function ArrowRightIcon() {
  return (
    <svg
      width="18"
      height="18"
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

function CalendarIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

function HashIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" x2="20" y1="9" y2="9" />
      <line x1="4" x2="20" y1="15" y2="15" />
      <line x1="10" x2="8" y1="3" y2="21" />
      <line x1="16" x2="14" y1="3" y2="21" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h6" />
    </svg>
  );
}

function WorkflowIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="6" height="6" x="3" y="3" rx="1" />
      <rect width="6" height="6" x="15" y="15" rx="1" />
      <path d="M6 9v4a2 2 0 0 0 2 2h7" />
      <path d="M15 6h2a2 2 0 0 1 2 2v7" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*                              MAIN COMPONENT                                */
/* -------------------------------------------------------------------------- */

export default function EstablishmentRequestDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepData, setStepData] = useState<Record<number, any>>({});
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  /* ------------------------------------------------------------------------ */
  /*                                LOAD DATA                                 */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const requestRes =
          await viamApi.getEstablishmentRequest(parseInt(id));

        setRequest(requestRes.data);

        const step = requestRes.data.current_step || 1;

        setCurrentStep(step);

        const completed = [];

        for (let i = 1; i < step; i++) {
          completed.push(i);
        }

        setCompletedSteps(completed);

        try {
          const stepsRes =
            await viamApi.getEstablishmentRequestSteps(parseInt(id));

          setSteps(stepsRes.data.steps || []);
        } catch (stepsErr) {
          console.warn('Steps API error:', stepsErr);
        }

        try {
          const savedData = localStorage.getItem(
            `viam_step_data_${id}`
          );

          if (savedData) {
            setStepData(JSON.parse(savedData));
          }
        } catch (e) {
          console.warn('Error loading step data:', e);
        }
      } catch (err: any) {
        console.error('Error:', err);

        setError(
          err.response?.data?.detail ||
            err.message ||
            'خطا در دریافت اطلاعات'
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  /* ------------------------------------------------------------------------ */
  /*                              STEP COMPLETE                               */
  /* ------------------------------------------------------------------------ */

  const handleStepComplete = async (data: any) => {
    setActionLoading(true);
    setError(null);

    try {
      const newStepData = {
        ...stepData,
        [currentStep]: data,
      };

      setStepData(newStepData);

      localStorage.setItem(
        `viam_step_data_${id}`,
        JSON.stringify(newStepData)
      );

      if (currentStep === 12 && data.isFinal) {
        await viamApi.completeEstablishment(parseInt(id));

        alert('🎉 واحد IAM با موفقیت تأسیس شد!');

        router.push('/dashboard');

        return;
      }

      await viamApi.advanceStep(parseInt(id));

      const requestRes =
        await viamApi.getEstablishmentRequest(parseInt(id));

      setRequest(requestRes.data);

      const newCurrentStep = requestRes.data.current_step || 1;

      setCurrentStep(newCurrentStep);

      const completed = [];

      for (let i = 1; i < newCurrentStep; i++) {
        completed.push(i);
      }

      setCompletedSteps(completed);

      try {
        const stepsRes =
          await viamApi.getEstablishmentRequestSteps(parseInt(id));

        setSteps(stepsRes.data.steps || []);
      } catch (stepsErr) {
        console.warn('Steps update error:', stepsErr);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error || 'خطا در پیشروی گام'
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                            SUBMIT TO ADMIN                               */
  /* ------------------------------------------------------------------------ */

  const handleSubmitToAdmin = async () => {
    setActionLoading(true);
    setError(null);

    try {
      await viamApi.submitToAdmin(parseInt(id));

      const requestRes =
        await viamApi.getEstablishmentRequest(parseInt(id));

      setRequest(requestRes.data);

      alert('✅ درخواست با موفقیت برای تایید ارسال شد!');
    } catch (err: any) {
      setError(
        err.response?.data?.error || 'خطا در ارسال درخواست'
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                              STATUS BADGE                                */
  /* ------------------------------------------------------------------------ */

  const getStatusBadge = (status: string) => {
    const config: Record<
      string,
      {
        label: string;
        className: string;
        dot: string;
      }
    > = {
      draft: {
        label: 'پیش‌نویس',
        className:
          'bg-slate-100 text-slate-700 ring-slate-200',
        dot: 'bg-slate-400',
      },

      submitted: {
        label: 'در انتظار تأیید',
        className:
          'bg-amber-50 text-amber-700 ring-amber-200',
        dot: 'bg-amber-500',
      },

      approved: {
        label: 'تأیید شده',
        className:
          'bg-emerald-50 text-emerald-700 ring-emerald-200',
        dot: 'bg-emerald-500',
      },

      rejected: {
        label: 'رد شده',
        className:
          'bg-rose-50 text-rose-700 ring-rose-200',
        dot: 'bg-rose-500',
      },

      active: {
        label: 'فعال',
        className:
          'bg-emerald-50 text-emerald-700 ring-emerald-200',
        dot: 'bg-emerald-500',
      },
    };

    const item = config[status] || {
      label: status,
      className:
        'bg-slate-100 text-slate-700 ring-slate-200',
      dot: 'bg-slate-400',
    };

    return (
      <span
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${item.className}`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${item.dot}`}
        />

        {item.label}
      </span>
    );
  };

  /* ------------------------------------------------------------------------ */
  /*                              STEP DATA                                   */
  /* ------------------------------------------------------------------------ */

  const renderStepData = (stepNumber: number) => {
    const data = stepData[stepNumber];

    if (!data) return null;

    switch (stepNumber) {
      case 2:
        return (
          <StepDataBox>
            <DataRow
              label="حامی"
              value={data.sponsor || 'انتخاب نشده'}
            />

            {data.notes && (
              <DataRow
                label="یادداشت"
                value={data.notes}
              />
            )}
          </StepDataBox>
        );

      case 3: {
        const models: Record<string, string> = {
          centralized: 'متمرکز و فنی',
          network: 'شبکه‌ای و مشتری‌محور',
          staged: 'مرحله‌ای و فناوری‌محور',
          federal: 'فدرال و چندشرکتی',
        };

        return (
          <StepDataBox>
            <DataRow
              label="مدل"
              value={models[data.model] || data.model}
            />

            {data.reason && (
              <DataRow
                label="دلیل"
                value={data.reason}
              />
            )}
          </StepDataBox>
        );
      }

      case 4: {
        const locations: Record<string, string> = {
          tech: 'معاونت فنی، R&D یا کیفیت',
          strategy:
            'راهبرد، توسعه کسب‌وکار یا تحول دیجیتال',
          research:
            'معاونت پژوهش، فناوری یا انتقال فناوری',
          ceo: 'معاونت راهبرد، سرمایه‌گذاری یا دفتر مدیرعامل',
        };

        return (
          <StepDataBox>
            <DataRow
              label="محل"
              value={
                locations[data.location] ||
                data.location
              }
            />

            {data.notes && (
              <DataRow
                label="توضیحات"
                value={data.notes}
              />
            )}
          </StepDataBox>
        );
      }

      case 5:
        return (
          <StepDataBox>
            {data.vision && (
              <DataRow
                label="چشم‌انداز"
                value={data.vision}
              />
            )}

            {data.mission && (
              <DataRow
                label="رسالت"
                value={data.mission}
              />
            )}

            {data.values?.length > 0 && (
              <DataRow
                label="ارزش‌ها"
                value={data.values.join('، ')}
              />
            )}

            {data.objectives?.length > 0 && (
              <DataRow
                label="اهداف"
                value={data.objectives.join('، ')}
              />
            )}
          </StepDataBox>
        );

      case 6:
        return (
          <StepDataBox>
            <DataRow
              label="نام کمیته"
              value={
                data.committeeName || 'نامشخص'
              }
            />

            <DataRow
              label="رئیس"
              value={data.chair || 'انتخاب نشده'}
            />

            <DataRow
              label="دبیر"
              value={
                data.secretary || 'انتخاب نشده'
              }
            />

            {data.members?.length > 0 && (
              <DataRow
                label="اعضا"
                value={`${toFa(data.members.length)} نفر`}
              />
            )}
          </StepDataBox>
        );

      case 7:
        return (
          <StepDataBox>
            <DataRow
              label="مدیر IAM"
              value={
                data.manager || 'انتخاب نشده'
              }
            />
          </StepDataBox>
        );

      case 8:
        return (
          <StepDataBox>
            <DataRow
              label="تعداد نمایندگان"
              value={`${toFa(data.representatives?.length || 0)} نفر`}
            />
          </StepDataBox>
        );

      case 9:
        return (
          <StepDataBox>
            <DataRow
              label="دارایی"
              value={
                data.assetName || 'نامشخص'
              }
            />

            <DataRow
              label="تعداد فعالیت‌ها"
              value={`${toFa(data.raciItems?.length || 0)} مورد`}
            />
          </StepDataBox>
        );

      case 10:
        return (
          <StepDataBox>
            {data.processes?.length > 0 && (
              <DataRow
                label="فرآیندها"
                value={data.processes.join('، ')}
              />
            )}

            {data.workflows?.length > 0 && (
              <DataRow
                label="گردش‌کارها"
                value={data.workflows.join('، ')}
              />
            )}

            {data.kpis?.length > 0 && (
              <DataRow
                label="KPIها"
                value={data.kpis.join('، ')}
              />
            )}
          </StepDataBox>
        );

      case 11:
        return (
          <StepDataBox>
            <DataRow
              label="Tenant"
              value={
                data.tenantName || 'نامشخص'
              }
            />

            <DataRow
              label="ماژول‌ها"
              value={`${toFa(data.modules?.length || 0)} ماژول`}
            />
          </StepDataBox>
        );

      case 12:
        return (
          <StepDataBox>
            <DataRow
              label="محدوده"
              value={data.scope || 'نامشخص'}
            />

            <DataRow
              label="تعداد دارایی هدف"
              value={toFa(data.targetAssets || 0)}
            />

            <DataRow
              label="مدت زمان"
              value={`${toFa(data.duration || 0)} هفته`}
            />

            <DataRow
              label="تاریخ شروع"
              value={
                data.startDate || 'نامشخص'
              }
            />
          </StepDataBox>
        );

      default:
        return null;
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                               LOADING                                    */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#f7f9f8]"
      >
        <div className="text-center">
          <div className="relative mx-auto h-14 w-14">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200" />

            <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-emerald-600" />
          </div>

          <p className="mt-5 text-sm font-bold text-slate-700">
            در حال بارگذاری درخواست
          </p>

          <p className="mt-1 text-xs text-slate-400">
            لطفاً چند لحظه صبر کنید...
          </p>
        </div>
      </main>
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                                  ERROR                                   */
  /* ------------------------------------------------------------------------ */

  if (error || !request) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[#f7f9f8] px-4 py-10"
      >
        <div className="mx-auto max-w-2xl">
          <div className="rounded-[28px] border border-rose-200 bg-white p-7 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <AlertIcon />
              </div>

              <div>
                <h1 className="text-lg font-black text-slate-900">
                  دریافت اطلاعات با خطا مواجه شد
                </h1>

                <p className="mt-2 text-sm leading-7 text-slate-600">
                  {error || 'درخواست یافت نشد'}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  شناسه درخواست: #{id}
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/viam/dashboard"
            className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-900"
          >
            <ArrowRightIcon />
            بازگشت به داشبورد
          </Link>
        </div>
      </main>
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                              COMPUTED DATA                               */
  /* ------------------------------------------------------------------------ */

  const isCompleted =
    request.status === 'approved' ||
    request.status === 'active';

  const canManage =
    user?.role === 'super_admin' ||
    user?.role === 'org_admin';

  const progressPercent = Math.round(
    ((currentStep - 1) / 12) * 100
  );

  const StepComponent =
    STEP_COMPONENTS[currentStep];

  const isSubmitted =
    request.status === 'submitted';

  /* ------------------------------------------------------------------------ */
  /*                                  VIEW                                    */
  /* ------------------------------------------------------------------------ */

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#f7f9f8] font-vazir text-slate-900"
    >
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full bg-emerald-100/40 blur-3xl" />

        <div className="absolute -left-40 top-[30%] h-[450px] w-[450px] rounded-full bg-teal-100/30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        {/* -------------------------------------------------------------- */}
        {/* BACK */}
        {/* -------------------------------------------------------------- */}

        <div className="mb-5">
          <Link
            href="/viam/dashboard"
            className="group inline-flex h-11 items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-bold text-slate-600 shadow-[0_4px_15px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 hover:shadow-[0_8px_20px_rgba(5,150,105,0.08)]"
          >
            <ArrowRightIcon />
            بازگشت به داشبورد
          </Link>
        </div>

        {/* -------------------------------------------------------------- */}
        {/* HERO */}
        {/* -------------------------------------------------------------- */}

        <section className="relative mb-6 overflow-hidden rounded-[30px] bg-gradient-to-l from-[#064e3b] via-[#047857] to-[#059669] px-6 py-7 text-white border border-emerald-800/10 shadow-[0_20px_60px_rgba(6,78,59,0.15)] sm:px-8 sm:py-9">
          <div className="pointer-events-none absolute -left-20 -top-28 h-72 w-72 rounded-full bg-emerald-300/15 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-32 right-20 h-64 w-64 rounded-full bg-teal-200/10 blur-3xl" />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                {getStatusBadge(request.status)}

                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-slate-300">
                  <HashIcon />
                  {toFa(request.id)}
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-slate-300">
                  <CalendarIcon />

                  {new Date(
                    request.created_at
                  ).toLocaleDateString('fa-IR')}
                </span>
              </div>

              <p className="mb-2 text-xs font-bold tracking-wide text-emerald-100/80">
                درخواست تأسیس واحد IAM
              </p>

              <h1 className="text-2xl font-black leading-[1.6] tracking-tight sm:text-3xl lg:text-[34px]">
                {request.title}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                فرآیند ایجاد واحد را از طریق مراحل
                تعریف‌شده تکمیل و وضعیت پیشرفت درخواست را
                مدیریت کنید.
              </p>
            </div>

            {/* Current Step */}

            <div className="min-w-[250px] rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-base font-black text-slate-950 shadow-lg">
                  {isCompleted ? (
                    <CheckIcon />
                  ) : (
                    toFa(currentStep)
                  )}
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    {isCompleted
                      ? 'وضعیت فرآیند'
                      : 'مرحله فعلی'}
                  </p>

                  <p className="mt-1 text-sm font-black text-white">
                    {isCompleted
                      ? 'فرآیند تکمیل شده'
                      : STEP_NAMES[currentStep]}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* OVERVIEW */}
        {/* -------------------------------------------------------------- */}

        <section className="mb-6 grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
          {/* Description */}

          <div className="rounded-[26px] border border-slate-200/70 bg-white p-6 shadow-sm sm:p-7">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <DocumentIcon />
              </div>

              <div>
                <h2 className="text-sm font-black text-slate-900">
                  درباره درخواست
                </h2>

                <p className="mt-0.5 text-xs text-slate-400">
                  شرح و دلایل ایجاد واحد
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400">
                توضیحات
              </p>

              <p className="mt-2 whitespace-pre-line text-sm leading-8 text-slate-600">
                {request.description ||
                  'توضیحی وارد نشده است'}
              </p>
            </div>

            {request.justification && (
              <div className="mt-6 border-t border-slate-100 pt-5">
                <p className="text-xs font-bold text-slate-400">
                  دلایل توجیهی
                </p>

                <p className="mt-2 whitespace-pre-line text-sm leading-8 text-slate-600">
                  {request.justification}
                </p>
              </div>
            )}
          </div>

          {/* Progress Summary */}

          <div className="rounded-[26px] border border-slate-200/70 bg-white p-6 shadow-sm sm:p-7">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <WorkflowIcon />
              </div>

              <div>
                <h2 className="text-sm font-black text-slate-900">
                  پیشرفت فرآیند
                </h2>

                <p className="mt-0.5 text-xs text-slate-400">
                  وضعیت کلی تأسیس
                </p>
              </div>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <span className="text-4xl font-black tracking-tight text-slate-950">
                  {toFa(isCompleted ? 100 : progressPercent)}
                </span>

                <span className="mr-1 text-sm font-bold text-slate-400">
                  ٪
                </span>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                {isCompleted
                  ? '۱۲ از ۱۲'
                  : `${toFa(currentStep)} از ۱۲`}
              </span>
            </div>

            <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isCompleted
                    ? 'bg-emerald-500'
                    : 'bg-gradient-to-l from-emerald-600 to-teal-400'
                }`}
                style={{
                  width: `${
                    isCompleted
                      ? 100
                      : progressPercent
                  }%`,
                }}
              />
            </div>

            <div className="mt-5 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                {toFa(completedSteps.length)} مرحله تکمیل شده
              </span>

              {!isCompleted && (
                <span className="font-bold text-emerald-700">
                  {toFa(12 - currentStep + 1)} مرحله باقی‌مانده
                </span>
              )}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* MAIN WORKFLOW */}
        {/* -------------------------------------------------------------- */}

        <section className="grid items-start gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          {/* ------------------------------------------------------------ */}
          {/* TIMELINE */}
          {/* ------------------------------------------------------------ */}

          <aside className="rounded-[28px] border border-slate-200/70 bg-white p-5 shadow-sm lg:sticky lg:top-6">
            <div className="mb-5 px-1">
              <h2 className="text-base font-black text-slate-900">
                مسیر تأسیس
              </h2>

              <p className="mt-1 text-xs leading-6 text-slate-400">
                فرآیند استاندارد ۱۲ مرحله‌ای ایجاد واحد IAM
              </p>
            </div>

            <div className="space-y-1">
              {steps.map((step) => {
                const num = step.number;

                const title =
                  step.title ||
                  STEP_NAMES[num] ||
                  `گام ${toFa(num)}`;

                const isDone =
                  completedSteps.includes(num) ||
                  num < currentStep;

                const isCurrent =
                  num === currentStep &&
                  !isCompleted;

                return (
                  <div
                    key={num}
                    className={`relative rounded-2xl p-3.5 transition-all ${
                      isCurrent
                        ? 'bg-emerald-50 ring-1 ring-inset ring-emerald-200'
                        : isDone
                          ? 'hover:bg-slate-50'
                          : 'opacity-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black transition ${
                          isDone
                            ? 'bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200'
                            : isCurrent
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                              : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {isDone ? (
                          <CheckIcon />
                        ) : (
                          toFa(num)
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm font-bold ${
                            isCurrent
                              ? 'text-emerald-800'
                              : isDone
                                ? 'text-slate-700'
                                : 'text-slate-500'
                          }`}
                        >
                          {title}
                        </p>

                        <p
                          className={`mt-1 truncate text-[11px] ${
                            isCurrent
                              ? 'text-emerald-700'
                              : 'text-slate-400'
                          }`}
                        >
                          {isCurrent
                            ? 'در حال انجام'
                            : isDone
                              ? 'تکمیل شده'
                              : STEP_DESCRIPTIONS[
                                  num
                                ]}
                        </p>
                      </div>

                      {isCurrent && (
                        <span className="mt-3 h-2 w-2 shrink-0 animate-pulse rounded-full bg-emerald-500" />
                      )}
                    </div>

                    {isDone &&
                      stepData[num] && (
                        <div className="mr-12 mt-2">
                          {renderStepData(num)}
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          </aside>

          {/* ------------------------------------------------------------ */}
          {/* CURRENT STEP WORKSPACE */}
          {/* ------------------------------------------------------------ */}

          <div className="min-w-0">
            {/* Error */}

            {error && (
              <div className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                <div className="mt-0.5">
                  <AlertIcon />
                </div>

                <div>
                  <p className="font-black">
                    عملیات انجام نشد
                  </p>

                  <p className="mt-1">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* Submitted */}

            {isSubmitted && (
              <div className="mb-5 rounded-[26px] border border-amber-200 bg-gradient-to-l from-amber-50 to-white p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-xl">
                    ⏳
                  </div>

                  <div>
                    <h3 className="font-black text-amber-900">
                      در انتظار تأیید نهایی
                    </h3>

                    <p className="mt-1 text-sm leading-7 text-amber-700">
                      درخواست برای ادمین کل ارسال شده
                      و در انتظار بررسی و تأیید نهایی است.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Completed */}

            {isCompleted && (
              <div className="overflow-hidden rounded-[28px] border border-emerald-200 bg-white shadow-sm">
                <div className="bg-gradient-to-l from-emerald-600 to-emerald-500 p-7 text-white">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                      <CheckIcon />
                    </div>

                    <div>
                      <p className="text-xs font-bold text-emerald-100">
                        فرآیند با موفقیت پایان یافت
                      </p>

                      <h2 className="mt-1 text-xl font-black">
                        واحد IAM تأسیس شد
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="p-7">
                  <p className="text-sm leading-8 text-slate-600">
                    تمام ۱۲ مرحله فرآیند تأسیس با موفقیت
                    تکمیل و درخواست نهایی تأیید شده است.
                  </p>

                  <div className="mt-5 flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                    <CheckIcon />
                    تمامی مراحل تکمیل شده‌اند.
                  </div>
                </div>
              </div>
            )}

            {/* Current step */}

            {!isCompleted &&
              !isSubmitted &&
              currentStep <= 12 && (
                <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_16px_50px_-32px_rgba(15,23,42,0.28)]">
                  {/* Workspace Header */}

                  <div className="border-b border-slate-100 bg-gradient-to-l from-white to-slate-50/60 px-6 py-6 sm:px-8">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-base font-black text-white shadow-md shadow-emerald-600/20">
                          {toFa(currentStep)}
                        </div>

                        <div>
                          <div className="mb-1 flex items-center gap-2">
                            <span className="text-[11px] font-black uppercase tracking-wide text-emerald-700">
                              مرحله فعلی
                            </span>

                            <span className="h-1 w-1 rounded-full bg-slate-300" />

                            <span className="text-[11px] font-medium text-slate-400">
                              گام {toFa(currentStep)} از ۱۲
                            </span>
                          </div>

                          <h2 className="text-lg font-black text-slate-900 sm:text-xl">
                            {STEP_NAMES[currentStep]}
                          </h2>

                          <p className="mt-1 text-xs leading-6 text-slate-400">
                            {
                              STEP_DESCRIPTIONS[
                                currentStep
                              ]
                            }
                          </p>
                        </div>
                      </div>

                      <div className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 sm:block">
                        در حال انجام
                      </div>
                    </div>
                  </div>

                  {/* Workspace Content */}

                  <div className="p-6 sm:p-8">
                    {!canManage && (
                      <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                        این مرحله در حال انجام است. شما
                        دسترسی لازم برای ویرایش این مرحله را
                        ندارید.
                      </div>
                    )}

                    {canManage &&
                      currentStep < 12 &&
                      StepComponent && (
                        <StepComponent
                          onComplete={
                            handleStepComplete
                          }
                          initialData={
                            stepData[currentStep]
                          }
                        />
                      )}

                    {canManage &&
                      currentStep < 12 &&
                      !StepComponent && (
                        <div>
                          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center">
                            <p className="text-sm font-bold text-slate-700">
                              فرم اختصاصی این مرحله هنوز
                              تعریف نشده است.
                            </p>

                            <p className="mt-2 text-xs text-slate-400">
                              برای ادامه می‌توانید مرحله را
                              تکمیل کنید.
                            </p>
                          </div>

                          <button
                            onClick={() =>
                              handleStepComplete({})
                            }
                            disabled={
                              actionLoading
                            }
                            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:pointer-events-none disabled:opacity-50"
                          >
                            {actionLoading ? (
                              <>
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                در حال پردازش...
                              </>
                            ) : (
                              <>
                                تکمیل و رفتن به گام{' '}
                                {currentStep + 1}
                                <span className="text-lg">
                                  ←
                                </span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                    {canManage &&
                      currentStep >= 12 &&
                      request.status !==
                        'submitted' && (
                        <div>
                          {StepComponent && (
                            <div className="mb-8">
                              <StepComponent
                                onComplete={
                                  handleStepComplete
                                }
                                initialData={
                                  stepData[
                                    currentStep
                                  ]
                                }
                              />
                            </div>
                          )}

                          <div className="border-t border-slate-100 pt-6">
                            <div className="mb-5 rounded-2xl bg-amber-50 p-4">
                              <p className="text-sm font-black text-amber-800">
                                مرحله نهایی
                              </p>

                              <p className="mt-1 text-xs leading-6 text-amber-700">
                                پس از تکمیل اطلاعات، درخواست
                                را برای تأیید نهایی ادمین کل
                                ارسال کنید.
                              </p>
                            </div>

                            <button
                              onClick={
                                handleSubmitToAdmin
                              }
                              disabled={
                                actionLoading
                              }
                              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 text-sm font-black text-white shadow-lg shadow-amber-500/15 transition hover:-translate-y-0.5 hover:bg-amber-600 disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-50"
                            >
                              {actionLoading ? (
                                <>
                                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                  در حال ارسال...
                                </>
                              ) : (
                                <>
                                  ارسال برای تأیید نهایی
                                  <span>←</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              )}
          </div>
        </section>

        {/* Footer */}

        <p className="mt-8 text-center text-xs leading-6 text-slate-400">
          سامانه مدیریت فرآیند تأسیس و راه‌اندازی واحد IAM
        </p>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/*                              SMALL COMPONENTS                              */
/* -------------------------------------------------------------------------- */

function StepDataBox({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
      {children}
    </div>
  );
}

function DataRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="text-[11px] leading-5 text-slate-500">
      <span className="font-bold text-slate-600">
        {label}:
      </span>{' '}
      <span>{value}</span>
    </div>
  );
}