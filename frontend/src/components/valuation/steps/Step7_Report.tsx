'use client';

import { Button } from '@/components/ui/button';
import { Check, Download, Award, ChevronLeft } from 'lucide-react';

interface Step7Props {
  onPrev: () => void;
  selectedMethod: string;
  methods: { id: string; name: string }[];
  formData: { name: string; assetId: string };
}

export function Step7_Report({ onPrev, selectedMethod, methods, formData }: Step7Props) {
  const getMethodName = (id: string) => methods.find(m => m.id === id)?.name || id;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="w-7 h-7 rounded-full bg-dark-green text-white flex items-center justify-center text-xs font-bold">۷</span>
        <span>مرحله ۷ از ۷</span>
      </div>
      <h2 className="text-xl font-bold text-dark-green">گزارش و تایید نهایی</h2>

      <div className="bg-dark-green/5 rounded-lg p-6 border border-dark-green/20">
        <div className="flex items-center gap-3 mb-4">
          <Award className="w-8 h-8 text-dark-green" />
          <div>
            <p className="text-lg font-bold text-dark-green">ارزش‌گذاری تکمیل شد!</p>
            <p className="text-sm text-gray-500">تمامی مراحل با موفقیت انجام شده است</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-3 bg-white rounded-lg">
            <p className="text-xs text-gray-500">ارزش نهایی</p>
            <p className="text-xl font-bold text-dark-green">۱۲,۴۵۰,۰۰۰</p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg">
            <p className="text-xs text-gray-500">روش</p>
            <p className="text-sm font-bold">{selectedMethod}</p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg">
            <p className="text-xs text-gray-500">امتیاز کیفی</p>
            <p className="text-xl font-bold text-blue-600">۴.۲</p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg">
            <p className="text-xs text-gray-500">وضعیت</p>
            <p className="text-sm font-bold text-emerald-600">✅ آماده تایید</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onPrev}>
          <ChevronLeft className="w-4 h-4 ml-1" />
          قبلی
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-1">
            <Download className="w-4 h-4" />
            دانلود گزارش
          </Button>
          <Button className="bg-dark-green hover:bg-dark-green/90 flex items-center gap-1">
            <Check className="w-4 h-4" />
            تایید نهایی
          </Button>
        </div>
      </div>
    </div>
  );
}
