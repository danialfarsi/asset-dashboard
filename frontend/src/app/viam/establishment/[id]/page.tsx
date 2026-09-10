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

const STEP_NAMES: { [key: number]: string } = {
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

const STEP_COMPONENTS: { [key: number]: React.ComponentType<any> } = {
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const requestRes = await viamApi.getEstablishmentRequest(parseInt(id));
        setRequest(requestRes.data);
        setCurrentStep(requestRes.data.current_step || 1);

        // محاسبه گام‌های تکمیل شده
        const completed = [];
        for (let i = 1; i < (requestRes.data.current_step || 1); i++) {
          completed.push(i);
        }
        setCompletedSteps(completed);

        try {
          const stepsRes = await viamApi.getEstablishmentRequestSteps(parseInt(id));
          setSteps(stepsRes.data.steps || []);
        } catch (stepsErr) {
          console.warn('Steps API error:', stepsErr);
        }

        // بارگذاری داده‌های گام‌ها از localStorage
        try {
          const savedData = localStorage.getItem(`viam_step_data_${id}`);
          if (savedData) {
            setStepData(JSON.parse(savedData));
          }
        } catch (e) {
          console.warn('Error loading step data:', e);
        }

      } catch (err: any) {
        console.error('Error:', err);
        setError(err.response?.data?.detail || err.message || 'خطا در دریافت اطلاعات');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const handleStepComplete = async (data: any) => {
    setActionLoading(true);
    setError(null);
    try {
      const newStepData = { ...stepData, [currentStep]: data };
      setStepData(newStepData);
      
      // ذخیره در localStorage
      localStorage.setItem(`viam_step_data_${id}`, JSON.stringify(newStepData));
      
      if (currentStep === 12 && data.isFinal) {
        await viamApi.completeEstablishment(parseInt(id));
        alert('🎉 واحد IAM با موفقیت تأسیس شد!');
        router.push('/strategic-plan');
        return;
      }
      
      await viamApi.advanceStep(parseInt(id));
      
      const requestRes = await viamApi.getEstablishmentRequest(parseInt(id));
      setRequest(requestRes.data);
      setCurrentStep(requestRes.data.current_step || 1);
      
      // به‌روزرسانی گام‌های تکمیل شده
      const completed = [];
      for (let i = 1; i < (requestRes.data.current_step || 1); i++) {
        completed.push(i);
      }
      setCompletedSteps(completed);
      
      try {
        const stepsRes = await viamApi.getEstablishmentRequestSteps(parseInt(id));
        setSteps(stepsRes.data.steps || []);
      } catch (stepsErr) {
        console.warn('Steps update error:', stepsErr);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'خطا در پیشروی گام');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitToAdmin = async () => {
    setActionLoading(true);
    setError(null);
    try {
      await viamApi.submitToAdmin(parseInt(id));
      const requestRes = await viamApi.getEstablishmentRequest(parseInt(id));
      setRequest(requestRes.data);
      alert('✅ درخواست با موفقیت برای تایید ارسال شد!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'خطا در ارسال درخواست');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: { [key: string]: string } = {
      'draft': 'bg-gray-100 text-gray-800',
      'submitted': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'active': 'bg-blue-100 text-blue-800',
    };
    const labels: { [key: string]: string } = {
      'draft': 'پیش‌نویس',
      'submitted': 'ارسال شده',
      'approved': 'تأیید شده',
      'rejected': 'رد شده',
      'active': 'فعال',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${map[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  // تابع برای نمایش داده‌های هر گام
  const renderStepData = (stepNumber: number) => {
    const data = stepData[stepNumber];
    if (!data) return null;

    switch (stepNumber) {
      case 2: // حامی اجرایی
        return (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
            <p><span className="font-medium">حامی:</span> {data.sponsor || 'انتخاب نشده'}</p>
            {data.notes && <p><span className="font-medium">یادداشت:</span> {data.notes}</p>}
          </div>
        );
      case 3: // مدل حکمرانی
        const models: { [key: string]: string } = {
          'centralized': 'متمرکز و فنی',
          'network': 'شبکه‌ای و مشتری‌محور',
          'staged': 'مرحله‌ای و فناوری‌محور',
          'federal': 'فدرال و چندشرکتی'
        };
        return (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
            <p><span className="font-medium">مدل:</span> {models[data.model] || data.model}</p>
            {data.reason && <p><span className="font-medium">دلیل:</span> {data.reason}</p>}
          </div>
        );
      case 4: // محل استقرار
        const locations: { [key: string]: string } = {
          'tech': 'معاونت فنی، R&D یا کیفیت',
          'strategy': 'راهبرد، توسعه کسب‌وکار یا تحول دیجیتال',
          'research': 'معاونت پژوهش، فناوری یا انتقال فناوری',
          'ceo': 'معاونت راهبرد، سرمایه‌گذاری یا دفتر مدیرعامل'
        };
        return (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
            <p><span className="font-medium">محل:</span> {locations[data.location] || data.location}</p>
            {data.notes && <p><span className="font-medium">توضیحات:</span> {data.notes}</p>}
          </div>
        );
      case 5: // منشور
        return (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
            {data.vision && <p><span className="font-medium">چشم‌انداز:</span> {data.vision}</p>}
            {data.mission && <p><span className="font-medium">رسالت:</span> {data.mission}</p>}
            {data.values && data.values.length > 0 && (
              <p><span className="font-medium">ارزش‌ها:</span> {data.values.join('، ')}</p>
            )}
            {data.objectives && data.objectives.length > 0 && (
              <p><span className="font-medium">اهداف:</span> {data.objectives.join('، ')}</p>
            )}
          </div>
        );
      case 6: // کمیته
        return (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
            <p><span className="font-medium">نام کمیته:</span> {data.committeeName || 'نامشخص'}</p>
            <p><span className="font-medium">رئیس:</span> {data.chair || 'انتخاب نشده'}</p>
            <p><span className="font-medium">دبیر:</span> {data.secretary || 'انتخاب نشده'}</p>
            {data.members && data.members.length > 0 && (
              <p><span className="font-medium">اعضا:</span> {data.members.length} نفر</p>
            )}
          </div>
        );
      case 7: // مدیر IAM
        return (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
            <p><span className="font-medium">مدیر IAM:</span> {data.manager || 'انتخاب نشده'}</p>
          </div>
        );
      case 8: // نمایندگان
        return (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
            <p><span className="font-medium">تعداد نمایندگان:</span> {data.representatives?.length || 0}</p>
          </div>
        );
      case 9: // RACI
        return (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
            <p><span className="font-medium">دارایی:</span> {data.assetName || 'نامشخص'}</p>
            <p><span className="font-medium">تعداد فعالیت‌ها:</span> {data.raciItems?.length || 0}</p>
          </div>
        );
      case 10: // مدل عملیاتی
        return (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
            {data.processes && data.processes.length > 0 && (
              <p><span className="font-medium">فرآیندها:</span> {data.processes.join('، ')}</p>
            )}
            {data.workflows && data.workflows.length > 0 && (
              <p><span className="font-medium">گردش‌کارها:</span> {data.workflows.join('، ')}</p>
            )}
            {data.kpis && data.kpis.length > 0 && (
              <p><span className="font-medium">KPIها:</span> {data.kpis.join('، ')}</p>
            )}
          </div>
        );
      case 11: // پیکربندی
        return (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
            <p><span className="font-medium">Tenant:</span> {data.tenantName || 'نامشخص'}</p>
            <p><span className="font-medium">ماژول‌ها:</span> {data.modules?.length || 0} ماژول</p>
          </div>
        );
      case 12: // پایلوت
        return (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
            <p><span className="font-medium">محدوده:</span> {data.scope || 'نامشخص'}</p>
            <p><span className="font-medium">تعداد دارایی هدف:</span> {data.targetAssets || 0}</p>
            <p><span className="font-medium">مدت زمان:</span> {data.duration || 0} هفته</p>
            <p><span className="font-medium">تاریخ شروع:</span> {data.startDate || 'نامشخص'}</p>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="container mx-auto p-6 rtl">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-bold">❌ خطا</p>
          <p>{error || 'درخواست یافت نشد'}</p>
          <p className="text-sm mt-2 text-gray-600">شناسه درخواست: {id}</p>
        </div>
        <Link href="/viam/dashboard">
          <button className="mt-4 text-blue-600 hover:text-blue-800">← بازگشت به داشبورد</button>
        </Link>
      </div>
    );
  }

  const isCompleted = request.status === 'approved' || request.status === 'active';
  const canManage = user?.role === 'super_admin' || user?.role === 'org_admin';
  const progressPercent = Math.round(((currentStep - 1) / 12) * 100);
  const StepComponent = STEP_COMPONENTS[currentStep as keyof typeof STEP_COMPONENTS];
  const isSubmitted = request.status === 'submitted';

  return (
    <div className="container mx-auto p-6 rtl max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{request.title}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-gray-600">#{request.id}</span>
            {getStatusBadge(request.status)}
            <span className="text-sm text-gray-500">
              {new Date(request.created_at).toLocaleDateString('fa-IR')}
            </span>
          </div>
        </div>
        <Link href="/viam/dashboard">
          <button className="text-gray-600 hover:text-gray-800">← بازگشت</button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">توضیحات</h2>
        <p className="text-gray-600">{request.description || 'توضیحی وارد نشده است'}</p>
        {request.justification && (
          <>
            <h2 className="text-sm font-semibold text-gray-700 mt-4 mb-2">دلایل توجیهی</h2>
            <p className="text-gray-600">{request.justification}</p>
          </>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">گام‌های ۱۲ گانه</h2>
          <span className="text-sm text-gray-500">
            {isCompleted ? '✅ تکمیل شده' : `گام ${currentStep} از ۱۲`}
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
          <div 
            className={`h-2.5 rounded-full transition-all duration-500 ${isCompleted ? 'bg-green-600' : 'bg-blue-600'}`}
            style={{ width: `${isCompleted ? 100 : progressPercent}%` }}
          />
        </div>

        <div className="grid grid-cols-1 gap-3">
          {steps.map((step) => {
            const num = step.number;
            const title = step.title || STEP_NAMES[num] || `گام ${num}`;
            const isDone = completedSteps.includes(num) || num < currentStep;
            const isCurrent = num === currentStep;
            const stepInfo = stepData[num];
            
            return (
              <div key={num} className={`flex flex-col p-4 rounded-lg border-2 transition ${
                isDone ? 'border-green-200 bg-green-50' :
                isCurrent ? 'border-blue-500 bg-blue-50' :
                'border-gray-200 bg-gray-50 opacity-60'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    isDone ? 'bg-green-500 text-white' :
                    isCurrent ? 'bg-blue-500 text-white' :
                    'bg-gray-300 text-gray-600'
                  }`}>
                    {isDone ? '✓' : num}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      isDone ? 'text-green-700' :
                      isCurrent ? 'text-blue-700' :
                      'text-gray-500'
                    }`}>
                      {title}
                    </p>
                    {isCurrent && <p className="text-xs text-blue-600">در حال انجام</p>}
                    {isDone && stepInfo && (
                      <p className="text-xs text-green-600">✅ تکمیل شده</p>
                    )}
                  </div>
                  {isCurrent && <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
                </div>
                
                {/* نمایش داده‌های گام تکمیل شده */}
                {isDone && stepInfo && (
                  <div className="mt-2 mr-11">
                    {renderStepData(num)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!isCompleted && canManage && currentStep < 12 && StepComponent && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <StepComponent onComplete={handleStepComplete} initialData={stepData[currentStep]} />
          </div>
        )}

        {!isCompleted && canManage && currentStep < 12 && !StepComponent && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">
              برای گام {currentStep} ({STEP_NAMES[currentStep]}) فرم اختصاصی در حال تکمیل است.
            </p>
            <button
              onClick={() => handleStepComplete({})}
              disabled={actionLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition disabled:opacity-50"
            >
              {actionLoading ? 'در حال پردازش...' : `پیشروی به گام ${currentStep + 1}`}
            </button>
          </div>
        )}

        {!isCompleted && canManage && currentStep >= 12 && request.status !== 'submitted' && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleSubmitToAdmin}
              disabled={actionLoading}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-3 px-4 rounded-lg transition disabled:opacity-50"
            >
              {actionLoading ? 'در حال ارسال...' : '📤 ارسال برای تایید'}
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              پس از ارسال، درخواست به ادمین کل برای تایید نهایی ارسال می‌شود.
            </p>
          </div>
        )}

        {isSubmitted && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
              ⏳ درخواست به ادمین کل ارسال شده و در انتظار تایید نهایی است.
            </div>
          </div>
        )}

        {isCompleted && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              <p className="font-bold text-lg">🎉 واحد IAM با موفقیت تأسیس شد!</p>
              <p className="text-sm mt-1">تمام ۱۲ گام تکمیل و تایید شده است.</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>
      )}
    </div>
  );
}
