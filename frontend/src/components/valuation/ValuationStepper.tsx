'use client';

import { Check } from 'lucide-react';

interface Step {
  id: number;
  label: string;
}

interface ValuationStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (step: number) => void;
  isStepComplete: (step: number) => boolean;
}

export function ValuationStepper({ steps, currentStep, onStepClick, isStepComplete }: ValuationStepperProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      <div className="relative">
        {/* خط زمینه */}
        <div className="absolute top-7 left-8 right-8 h-1 bg-gray-200 rounded-full" />
        
        {/* خط پیشرفت (از راست به چپ) */}
        <div 
          className="absolute top-7 right-8 h-1 bg-dark-green rounded-full transition-all duration-700 ease-in-out"
          style={{ 
            width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
            left: 'auto'
          }}
        />
        
        {/* مراحل */}
        <div className="relative flex justify-between items-start">
          {steps.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            const isComplete = isStepComplete(step.id);
            const isFirst = index === 0;
            const isLast = index === steps.length - 1;

            return (
              <div key={step.id} className="flex flex-col items-center flex-1">
                {/* دایره */}
                <button
                  onClick={() => onStepClick(step.id)}
                  className={`
                    relative z-10 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500
                    ${isActive ? 'ring-4 ring-dark-green/20 scale-110 shadow-lg' : ''}
                    ${isCompleted ? 'bg-dark-green hover:bg-dark-green/90 shadow-md' : ''}
                    ${!isCompleted && isActive ? 'bg-dark-green shadow-md' : ''}
                    ${!isCompleted && !isActive ? 'bg-gray-200 hover:bg-gray-300 border-2 border-gray-200' : ''}
                    transform hover:scale-105 cursor-pointer
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-6 h-6 text-white stroke-[3]" />
                  ) : (
                    <span className={`text-base font-bold ${isActive ? 'text-white' : 'text-gray-500'}`}>
                      {step.id}
                    </span>
                  )}
                  
                  {/* نقطه نشانگر مرحله فعال */}
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-dark-green rounded-full animate-pulse" />
                  )}
                </button>

                {/* لیبل */}
                <div className="mt-3 text-center min-h-[48px] flex items-center justify-center px-1">
                  <p className={`
                    text-xs font-medium transition-all duration-300 leading-tight text-center
                    ${isActive ? 'text-dark-green font-bold' : ''}
                    ${isCompleted ? 'text-gray-700' : ''}
                    ${!isCompleted && !isActive ? 'text-gray-400' : ''}
                  `}>
                    {step.label.split('\n').map((line, i) => (
                      <span key={i}>
                        {line}
                        {i < step.label.split('\n').length - 1 && <br />}
                      </span>
                    ))}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
