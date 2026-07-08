'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Step6Props {
  onNext: () => void;
  onPrev: () => void;
}

export function Step6_Sensitivity({ onNext, onPrev }: Step6Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="w-7 h-7 rounded-full bg-dark-green text-white flex items-center justify-center text-xs font-bold">۶</span>
        <span>مرحله ۶ از ۷</span>
      </div>
      <h2 className="text-xl font-bold text-dark-green">حساسیت/سناریو</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500">بهترین حالت</p>
            <p className="text-xl font-bold text-emerald-600">۱۴,۸۰۰,۰۰۰</p>
            <p className="text-xs text-gray-400">+۱۹%</p>
          </CardContent>
        </Card>
        <Card className="border-dark-green">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500">حالت پایه</p>
            <p className="text-xl font-bold text-dark-green">۱۲,۴۵۰,۰۰۰</p>
            <p className="text-xs text-gray-400">مرجع</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500">بدترین حالت</p>
            <p className="text-xl font-bold text-red-600">۹,۲۰۰,۰۰۰</p>
            <p className="text-xs text-gray-400">-۲۶%</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <p className="text-sm text-gray-600">دامنه ارزش: <strong>۹,۲۰۰,۰۰۰ - ۱۴,۸۰۰,۰۰۰</strong></p>
        <p className="text-xs text-gray-400 mt-1">بر اساس تغییرات ±۲۰% در نرخ تنزیل و رشد درآمد</p>
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
