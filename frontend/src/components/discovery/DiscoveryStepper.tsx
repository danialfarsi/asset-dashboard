'use client';

import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: number;
  title: string;
  subtitle: string;
}

interface DiscoveryStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (step: number) => void;
  isStepComplete: (step: number) => boolean;
  isStepActive: (step: number) => boolean;
}

// تبدیل عدد به فارسی
const toPersianNumber = (num: number): string => {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return String(num).replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};

export function DiscoveryStepper({
  steps,
  currentStep,
  onStepClick,
  isStepComplete,
  isStepActive,
}: DiscoveryStepperProps) {
  const progress =
    steps.length > 1
      ? Math.min(Math.max(((currentStep - 1) / (steps.length - 1)) * 100, 0), 100)
      : 100;

  return (
    <div
      dir="rtl"
      className="w-full rounded-[26px] border border-slate-200/80 bg-white px-4 py-5 font-vazir shadow-[0_10px_35px_rgba(15,23,42,0.045)] sm:px-6 sm:py-6"
    >
      {/* Desktop / Tablet */}
      <div className="hidden sm:block">
        <div className="relative">
          {/* Connection track */}
          <div className="absolute left-[5%] right-[5%] top-5 h-[3px] overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-l from-dark-green to-emerald-500 transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="relative z-10 flex items-start justify-between">
            {steps.map((step) => {
              const isComplete = isStepComplete(step.id);
              const isActive = isStepActive(step.id);
              const isAvailable = isComplete || isActive;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => onStepClick(step.id)}
                  disabled={!isAvailable}
                  aria-current={isActive ? 'step' : undefined}
                  className={cn(
                    'group flex min-w-0 flex-1 flex-col items-center px-1 text-center outline-none',
                    'transition-all duration-300',
                    isAvailable
                      ? 'cursor-pointer'
                      : 'cursor-not-allowed'
                  )}
                >
                  {/* Step circle */}
                  <div
                    className={cn(
                      'relative flex h-10 w-10 items-center justify-center rounded-2xl border-2',
                      'transition-all duration-300',
                      'ring-offset-2 ring-offset-white',
                      isComplete &&
                        'border-dark-green bg-dark-green text-white shadow-[0_7px_18px_rgba(5,83,69,0.18)] group-hover:-translate-y-0.5 group-hover:shadow-[0_10px_24px_rgba(5,83,69,0.22)]',
                      isActive &&
                        !isComplete &&
                        'scale-110 border-dark-green bg-white text-dark-green shadow-[0_8px_22px_rgba(5,83,69,0.13)] ring-4 ring-emerald-50',
                      !isComplete &&
                        !isActive &&
                        'border-slate-200 bg-slate-50 text-slate-400'
                    )}
                  >
                    {isComplete ? (
                      <CheckCircle className="h-[18px] w-[18px]" strokeWidth={2.4} />
                    ) : (
                      <span className="text-xs font-black">
                        {toPersianNumber(step.id)}
                      </span>
                    )}

                    {isActive && (
                      <span className="absolute -bottom-2 h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,.10)]" />
                    )}
                  </div>

                  {/* Labels */}
                  <div className="mt-3 min-w-0 max-w-[150px]">
                    <p
                      className={cn(
                        'truncate text-[11px] font-black transition-colors md:text-xs',
                        isActive
                          ? 'text-dark-green'
                          : isComplete
                            ? 'text-slate-700'
                            : 'text-slate-400'
                      )}
                    >
                      {step.title}
                    </p>
                    <p
                      className={cn(
                        'mt-1 line-clamp-2 text-[9px] leading-4 transition-colors md:text-[10px]',
                        isActive
                          ? 'text-emerald-700/70'
                          : isComplete
                            ? 'text-slate-400'
                            : 'text-slate-300'
                      )}
                    >
                      {step.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="space-y-2 sm:hidden">
        {steps.map((step, index) => {
          const isComplete = isStepComplete(step.id);
          const isActive = isStepActive(step.id);
          const isAvailable = isComplete || isActive;

          return (
            <div key={step.id} className="relative">
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'absolute right-[19px] top-10 h-[calc(100%-24px)] w-[2px]',
                    isComplete ? 'bg-emerald-400' : 'bg-slate-100'
                  )}
                />
              )}

              <button
                type="button"
                onClick={() => onStepClick(step.id)}
                disabled={!isAvailable}
                aria-current={isActive ? 'step' : undefined}
                className={cn(
                  'relative z-10 flex w-full items-center gap-3 rounded-2xl border p-3 text-right',
                  'transition-all duration-200',
                  isActive &&
                    'border-emerald-200 bg-emerald-50/60 shadow-sm',
                  isComplete &&
                    !isActive &&
                    'border-transparent bg-white',
                  !isComplete &&
                    !isActive &&
                    'cursor-not-allowed border-transparent bg-white opacity-50'
                )}
              >
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2',
                    isComplete &&
                      'border-dark-green bg-dark-green text-white',
                    isActive &&
                      !isComplete &&
                      'border-dark-green bg-white text-dark-green ring-4 ring-emerald-50',
                    !isComplete &&
                      !isActive &&
                      'border-slate-200 bg-slate-50 text-slate-400'
                  )}
                >
                  {isComplete ? (
                    <CheckCircle className="h-[18px] w-[18px]" />
                  ) : (
                    <span className="text-xs font-black">
                      {toPersianNumber(step.id)}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        'truncate text-xs font-black',
                        isActive
                          ? 'text-dark-green'
                          : isComplete
                            ? 'text-slate-700'
                            : 'text-slate-400'
                      )}
                    >
                      {step.title}
                    </p>

                    {isActive && (
                      <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-1 text-[8px] font-black text-emerald-700">
                        مرحله فعلی
                      </span>
                    )}
                  </div>

                  <p className="mt-1 truncate text-[10px] text-slate-400">
                    {step.subtitle}
                  </p>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
