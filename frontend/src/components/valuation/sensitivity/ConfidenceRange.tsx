'use client';

import React, { useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// 🔥 تبدیل اعداد به فارسی
const toPersianNumber = (num: number) => {
  if (!num && num !== 0) return '۰';
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  const str = String(Math.round(num));
  return str.replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};

interface ConfidenceRangeProps {
  pessimisticValue: number;
  baseValue: number;
  optimisticValue: number;
  confidenceLevel: number;
  globalMin?: number;
  globalMax?: number;
}

export function ConfidenceRange({
  pessimisticValue,
  baseValue,
  optimisticValue,
  confidenceLevel,
  globalMin,
  globalMax,
}: ConfidenceRangeProps) {
  const formatCurrency = (value: number) => {
    if (!value || value === 0) return '۰';
    const isNegative = value < 0;
    const absValue = Math.abs(value);
    let formatted: string;
    if (absValue >= 1e12) formatted = (absValue / 1e12).toFixed(1) + 'T';
    else if (absValue >= 1e9) formatted = (absValue / 1e9).toFixed(1) + 'B';
    else if (absValue >= 1e6) formatted = (absValue / 1e6).toFixed(1) + 'M';
    else formatted = absValue.toFixed(0);
    const result = isNegative ? `-${formatted}` : formatted;
    return result.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
  };

  const minVal = globalMin !== undefined ? globalMin : Math.min(pessimisticValue, baseValue, optimisticValue);
  const maxVal = globalMax !== undefined ? globalMax : Math.max(pessimisticValue, baseValue, optimisticValue);
  const range = maxVal - minVal || 1;

  const getPosition = (value: number) => {
    const pos = ((value - minVal) / range) * 100;
    return Math.min(Math.max(pos, 2), 98);
  };

  const positions = {
    pessimistic: getPosition(pessimisticValue),
    base: getPosition(baseValue),
    optimistic: getPosition(optimisticValue),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground" style={{ fontFamily: 'var(--font-vazir)' }}>
          بازه اطمینان
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6" style={{ fontFamily: 'var(--font-vazir)' }}>
          {/* سه کارت مقادیر */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-red-50 rounded-xl p-3 text-center border border-red-200">
              <p className="text-xs text-red-600 font-medium">بدبینانه</p>
              <p className="text-lg font-bold text-red-700">
                {formatCurrency(pessimisticValue)}
              </p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-200">
              <p className="text-xs text-blue-600 font-medium">مبنا</p>
              <p className="text-lg font-bold text-blue-700">
                {formatCurrency(baseValue)}
              </p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center border border-green-200">
              <p className="text-xs text-green-600 font-medium">خوش‌بینانه</p>
              <p className="text-lg font-bold text-green-700">
                {formatCurrency(optimisticValue)}
              </p>
            </div>
          </div>

          {/* نوار بازه اطمینان */}
          <div className="relative h-12 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="absolute inset-0 rounded-full"
              style={{
                background: `linear-gradient(to right, 
                  rgba(239, 68, 68, 0.15) 0%, 
                  rgba(239, 68, 68, 0.05) ${positions.pessimistic}%, 
                  rgba(59, 130, 246, 0.05) ${positions.base}%, 
                  rgba(34, 197, 94, 0.05) ${positions.optimistic}%, 
                  rgba(34, 197, 94, 0.15) 100%
                )`,
              }}
            />

            <div 
              className="absolute top-2 bottom-2 w-0.5 bg-red-500 z-10 rounded-full"
              style={{ left: `${positions.pessimistic}%` }}
            />
            <div 
              className="absolute top-2 bottom-2 w-0.5 bg-blue-500 z-10 rounded-full"
              style={{ left: `${positions.base}%` }}
            />
            <div 
              className="absolute top-2 bottom-2 w-0.5 bg-green-500 z-10 rounded-full"
              style={{ left: `${positions.optimistic}%` }}
            />

            <div 
              className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white shadow-lg z-20 transition-all duration-500 ease-in-out"
              style={{ 
                left: `${positions.pessimistic}%`, 
                transform: 'translate(-50%, -50%)',
                backgroundColor: '#ef4444',
              }}
            />
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-blue-500 shadow-lg z-20 transition-all duration-500 ease-in-out bg-white"
              style={{ 
                left: `${positions.base}%`, 
                transform: 'translate(-50%, -50%)',
              }}
            />
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white shadow-lg z-20 transition-all duration-500 ease-in-out"
              style={{ 
                left: `${positions.optimistic}%`, 
                transform: 'translate(-50%, -50%)',
                backgroundColor: '#22c55e',
              }}
            />

            <div 
              className="absolute top-full mt-2 text-[10px] font-medium text-red-600 whitespace-nowrap transition-all duration-300"
              style={{ left: `${positions.pessimistic}%`, transform: 'translateX(-50%)' }}
            >
              بدبینانه
            </div>
            <div 
              className="absolute top-full mt-2 text-[10px] font-medium text-blue-600 whitespace-nowrap transition-all duration-300"
              style={{ left: `${positions.base}%`, transform: 'translateX(-50%)' }}
            >
              مبنا
            </div>
            <div 
              className="absolute top-full mt-2 text-[10px] font-medium text-green-600 whitespace-nowrap transition-all duration-300"
              style={{ left: `${positions.optimistic}%`, transform: 'translateX(-50%)' }}
            >
              خوش‌بینانه
            </div>
          </div>

          {/* توضیحات پایین */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">بدبینانه:</span>
              <span className="font-medium text-red-600">{formatCurrency(pessimisticValue)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">خوش‌بینانه:</span>
              <span className="font-medium text-green-600">{formatCurrency(optimisticValue)}</span>
            </div>
            <div className="pt-2 border-t text-sm text-center text-muted-foreground">
              توزیع احتمال نشان می‌دهد که ارزش با {toPersianNumber(confidenceLevel)}% اطمینان در بازه 
              {' '}{formatCurrency(minVal)} - {formatCurrency(maxVal)} قرار دارد.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
