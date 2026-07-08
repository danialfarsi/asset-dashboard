'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Step4Props {
  onNext: () => void;
  onPrev: () => void;
  formData: { associatedCosts: string; usefulLife: string };
  selectedMethod: string;
  methods: { id: string; name: string }[];
}

export function Step4_Calculation({ onNext, onPrev, formData, selectedMethod, methods }: Step4Props) {
  const getMethodName = (id: string) => methods.find(m => m.id === id)?.name || id;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="w-7 h-7 rounded-full bg-dark-green text-white flex items-center justify-center text-xs font-bold">۴</span>
        <span>مرحله ۴ از ۷</span>
      </div>
      <h2 className="text-xl font-bold text-dark-green">موتور محاسبه</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500">ارزش تخمینی</p>
            <p className="text-2xl font-bold text-dark-green">۱۲,۴۵۰,۰۰۰</p>
            <p className="text-xs text-gray-400">تومان</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500">امتیاز کیفی</p>
            <p className="text-2xl font-bold text-blue-600">۴.۲</p>
            <p className="text-xs text-gray-400">از ۵</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500">ضریب ریسک</p>
            <p className="text-2xl font-bold text-amber-600">۰.۷۵</p>
            <p className="text-xs text-gray-400">متوسط</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <p className="text-sm text-gray-600">
          محاسبه بر اساس روش <strong>{getMethodName(selectedMethod)}</strong> انجام شده است.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          پارامترهای ورودی: هزینه تاریخی {formData.associatedCosts || 'نامشخص'}، عمر مفید {formData.usefulLife || 'نامشخص'} سال
        </p>
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
