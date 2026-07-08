'use client';

import { Button } from '@/components/ui/button';
import { Check, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface Step5Props {
  onNext: () => void;
  onPrev: () => void;
}

export function Step5_QualityControl({ onNext, onPrev }: Step5Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="w-7 h-7 rounded-full bg-dark-green text-white flex items-center justify-center text-xs font-bold">۵</span>
        <span>مرحله ۵ از ۷</span>
      </div>
      <h2 className="text-xl font-bold text-dark-green">کنترل کیفیت (QC)</h2>

      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <Check className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-800">داده‌ها کامل هستند</p>
            <p className="text-xs text-green-600">همه فیلدهای مورد نیاز پر شده‌اند</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <Check className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-800">روش انتخاب شده مناسب است</p>
            <p className="text-xs text-green-600">روش هزینه جایگزینی برای این نوع دارایی مناسب است</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-800">نیاز به بررسی مجدد</p>
            <p className="text-xs text-amber-600">توصیه می‌شود داده‌های بازار نیز بررسی شوند</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onPrev}>
          <ChevronLeft className="w-4 h-4 ml-1" />
          قبلی
        </Button>
        <Button className="bg-dark-green hover:bg-dark-green/90" onClick={onNext}>
          ادامه
          <ChevronRight className="w-4 h-4 mr-1" />
        </Button>
      </div>
    </div>
  );
}
