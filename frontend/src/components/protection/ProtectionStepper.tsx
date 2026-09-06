'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FullProtectionData } from '@/lib/protection-api';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, Loader2, ShieldOff, FileText } from 'lucide-react';
import Step1_Analysis from './steps/Step1_Analysis';
import Step2_Strategy from './steps/Step2_Strategy';
import Step3_Legal from './steps/Step3_Legal';
import Step4_Technical from './steps/Step4_Technical';
import Step5_Map from './steps/Step5_Map';

interface ProtectionStepperProps {
  id: number;
  data: FullProtectionData | undefined;
  isLoading: boolean;
}

// 🔥 تبدیل عدد به فارسی
const toPersianNumber = (num: number): string => {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return num.toString().replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};

const STEP_CONFIGS: Record<string, { step3: string; step4: string }> = {
  'PA-1': { step3: 'full', step4: 'medium' },
  'PA-2': { step3: 'full', step4: 'minimal' },
  'PA-3': { step3: 'medium', step4: 'full' },
  'PA-4': { step3: 'low', step4: 'full' },
  'PA-5': { step3: 'minimal', step4: 'medium' },
};

// 🔥 رنگ‌های آرکی‌تایپ
const ARCHETYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'PA-1': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'PA-2': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  'PA-3': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'PA-4': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  'PA-5': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
};

export function ProtectionStepper({ id, data, isLoading }: ProtectionStepperProps) {
  const [currentStep, setCurrentStep] = useState(0);

  // 🔥 حالت بارگذاری
  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white">
          <Loader2 className="h-7 w-7 animate-spin text-emerald-600" />
          <p className="text-sm text-slate-500">در حال بارگذاری اطلاعات دارایی...</p>
        </div>
      </div>
    );
  }

  // 🔥 حالت نبود داده
  if (!data) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60">
          <ShieldOff className="h-7 w-7 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">داده‌ای برای این دارایی یافت نشد</p>
        </div>
      </div>
    );
  }

  // 🔥 Fix: بررسی وجود profile
  if (!data.profile) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-rose-200 bg-rose-50/40">
          <AlertTriangle className="h-7 w-7 text-rose-400" />
          <p className="text-sm font-medium text-rose-600">پروفایل حفاظتی برای این دارایی یافت نشد</p>
        </div>
      </div>
    );
  }

  const { profile } = data;
  const archetype = profile.archetype || 'PA-5';
  const config = STEP_CONFIGS[archetype] || STEP_CONFIGS['PA-5'];
  const color = ARCHETYPE_COLORS[archetype] || ARCHETYPE_COLORS['PA-5'];

  // 🔥 ساخت Asset ID
  const assetId = `IA-${String(id).padStart(6, '0')}`;

  const steps = [
    { title: 'تحلیل قابلیت حفاظت', description: 'بررسی ابزارهای قابل اعمال', active: true },
    { title: 'طراحی استراتژی حفاظت', description: 'انتخاب مسیر حفاظتی', active: true },
    { title: 'حفاظت حقوقی (IP)', description: 'ثبت و مدیریت مالکیت فکری', active: config.step3 !== 'minimal' },
    { title: 'امنیت فنی', description: 'کنترل‌های امنیتی', active: config.step4 !== 'minimal' },
    { title: 'نقشه حفاظت نهایی', description: 'ثبت و تأیید نهایی', active: true },
  ];

  const activeSteps = steps.filter(s => s.active);

  const nextStep = () => {
    if (currentStep < activeSteps.length - 1) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  // Step component mapping
  const stepComponents = [
    <Step1_Analysis key={0} id={id} data={data.step1} archetype={archetype} onComplete={nextStep} />,
    <Step2_Strategy key={1} id={id} data={data.step2} archetype={archetype} onComplete={nextStep} />,
    <Step3_Legal key={2} id={id} data={data.step3} archetype={archetype} config={config} onComplete={nextStep} />,
    <Step4_Technical key={3} id={id} data={data.step4} archetype={archetype} config={config} onComplete={nextStep} />,
    <Step5_Map key={4} id={id} data={data.step5} profile={profile} onComplete={() => {}} />,
  ];

  const activeComponents = stepComponents.filter((_, index) => steps[index].active);
  const progressPercent = Math.round(((currentStep + 1) / activeSteps.length) * 100);

  // 🔥 بررسی آیا گام آخر است
  const isLastStep = currentStep === activeSteps.length - 1;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 font-vazir">
      {/* 🔥 هدر دارایی با Asset ID، نام و آرکی‌تایپ */}
      <Card className="rounded-xl border-slate-200 shadow-none overflow-hidden">
        <div className={`border-r-8 ${color.border}`}>
          <CardHeader className="pb-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono text-xs font-medium text-slate-500">
                    {assetId}
                  </Badge>
                  <Badge className={cn('font-medium', color.bg, color.text)}>
                    {profile.archetype_display || 'نامشخص'}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold text-slate-900">
                  {profile.screening_template_name || 'دارایی بدون نام'}
                </CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  فرآیند {toPersianNumber(5)} گام حفاظت و امنیت
                </CardDescription>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <Badge
                  className="px-3 py-1 text-sm font-medium"
                  variant={profile.status === 'approved' ? 'default' : 'secondary'}
                >
                  {profile.status_display || 'پیش‌نویس'}
                </Badge>
                <span className="text-xs text-slate-400">
                  {profile.archetype === 'N/A' ? 'غیرقابل حفاظت' : `آرکی‌تایپ: ${archetype}`}
                </span>
              </div>
            </div>
          </CardHeader>
        </div>
      </Card>

      {/* نوار پیشرفت + نشانگر مراحل */}
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-5">
        <div className="mb-5 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">
            گام {toPersianNumber(currentStep + 1)} از {toPersianNumber(activeSteps.length)}
          </span>
          <span className="text-xs font-semibold text-emerald-600">{toPersianNumber(progressPercent)}٪ تکمیل‌شده</span>
        </div>

        <div className="relative flex items-start justify-between">
          {/* خط اتصال پس‌زمینه */}
          <div className="absolute right-0 top-4 h-0.5 w-full bg-slate-100" />
          {/* خط اتصال پیشرفت */}
          <div
            className="absolute right-0 top-4 h-0.5 bg-emerald-500 transition-all duration-500"
            style={{ width: activeSteps.length > 1 ? `${(currentStep / (activeSteps.length - 1)) * 100}%` : '0%' }}
          />

          {activeSteps.map((step, index) => {
            const isDone = index < currentStep;
            const isCurrent = index === currentStep;
            return (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentStep(index)}
                className="relative z-10 flex flex-1 flex-col items-center gap-2 text-center"
                disabled={isDone}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors ${
                    isDone
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : isCurrent
                      ? 'border-emerald-500 bg-white text-emerald-600 ring-4 ring-emerald-50'
                      : 'border-slate-200 bg-white text-slate-300'
                  }`}
                >
                  {isDone ? <Check className="h-4 w-4" /> : toPersianNumber(index + 1)}
                </div>
                <div
                  className={`max-w-[6.5rem] text-xs leading-snug transition-colors ${
                    isCurrent ? 'font-semibold text-slate-800' : isDone ? 'text-slate-500' : 'text-slate-300'
                  }`}
                >
                  {step.title}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* محتوای گام جاری */}
      <Card className="rounded-xl border-slate-200 shadow-none">
        <CardContent className="pt-6">{activeComponents[currentStep]}</CardContent>
        <CardFooter className="flex items-center justify-between border-t border-slate-100 pt-4">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="gap-2 border-slate-200"
          >
            <ArrowRight className="h-4 w-4" />
            قبلی
          </Button>
          <div className="text-sm text-slate-400">
            {toPersianNumber(currentStep + 1)} از {toPersianNumber(activeSteps.length)}
          </div>
          {!isLastStep && (
            <Button
              onClick={nextStep}
              disabled={currentStep === activeSteps.length - 1}
              className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
            >
              بعدی
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
