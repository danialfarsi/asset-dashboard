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

export function DiscoveryStepper({ 
  steps, 
  currentStep, 
  onStepClick, 
  isStepComplete, 
  isStepActive 
}: DiscoveryStepperProps) {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        {/* خط اتصال */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
          <div 
            className="h-full bg-dark-green transition-all duration-500"
            style={{ 
              width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` 
            }}
          />
        </div>

        {steps.map((step) => {
          const isComplete = isStepComplete(step.id);
          const isActive = isStepActive(step.id);

          return (
            <button
              key={step.id}
              onClick={() => onStepClick(step.id)}
              className={cn(
                "flex flex-col items-center relative z-10",
                "transition-all duration-200",
                isComplete || isActive ? "cursor-pointer" : "cursor-not-allowed opacity-50"
              )}
              disabled={!isComplete && !isActive}
            >
              {/* دایره */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200",
                  isComplete
                    ? "bg-dark-green border-dark-green text-white"
                    : isActive
                    ? "border-dark-green bg-white text-dark-green"
                    : "border-gray-300 bg-white text-gray-400"
                )}
              >
                {isComplete ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </div>

              {/* عنوان */}
              <div className="mt-2 text-center">
                <p className={cn(
                  "text-xs font-medium",
                  isActive ? "text-dark-green" : "text-gray-500"
                )}>
                  {step.title}
                </p>
                <p className="text-[10px] text-gray-400">
                  {step.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
