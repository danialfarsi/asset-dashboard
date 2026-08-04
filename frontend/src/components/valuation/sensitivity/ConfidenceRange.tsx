'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ConfidenceRangeProps {
  pessimisticValue: number;
  baseValue: number;
  optimisticValue: number;
  confidenceLevel: number;
}

export function ConfidenceRange({
  pessimisticValue,
  baseValue,
  optimisticValue,
  confidenceLevel,
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
    return isNegative ? `-${formatted}` : formatted;
  };

  // 🔥 محاسبه موقعیت‌ها هر بار که مقادیر تغییر کنن
  const minVal = Math.min(pessimisticValue, baseValue, optimisticValue);
  const maxVal = Math.max(pessimisticValue, baseValue, optimisticValue);
  const range = maxVal - minVal || 1;

  const getPosition = (value: number) => {
    const pos = ((value - minVal) / range) * 100;
    return Math.min(Math.max(pos, 0), 100);
  };

  const positions = {
    pessimistic: getPosition(pessimisticValue),
    base: getPosition(baseValue),
    optimistic: getPosition(optimisticValue),
  };

  // 🔥 لاگ برای دیباگ
  useEffect(() => {
    console.log('🔍 ConfidenceRange updated:', {
      pessimisticValue,
      baseValue,
      optimisticValue,
      positions,
      minVal,
      maxVal,
    });
  }, [pessimisticValue, baseValue, optimisticValue]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">بازه اطمینان</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* سه کارت - همیشه در جای خودشون */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-red-50 rounded-xl p-4 text-center border-2 border-red-200">
              <p className="text-xs text-red-600 font-medium">بدبینانه</p>
              <p className="text-xl font-bold text-red-700">
                {formatCurrency(pessimisticValue)}
              </p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center border-2 border-blue-200">
              <p className="text-xs text-blue-600 font-medium">مبنا</p>
              <p className="text-xl font-bold text-blue-700">
                {formatCurrency(baseValue)}
              </p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center border-2 border-green-200">
              <p className="text-xs text-green-600 font-medium">خوش‌بینانه</p>
              <p className="text-xl font-bold text-green-700">
                {formatCurrency(optimisticValue)}
              </p>
            </div>
          </div>

          {/* نوار پیشرفت */}
          <div className="relative h-12 bg-gray-100 rounded-full overflow-hidden">
            {/* پس‌زمینه گرادیان */}
            <div 
              className="absolute inset-0 rounded-full transition-all duration-300"
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

            {/* خطوط عمودی */}
            <div 
              className="absolute top-2 bottom-2 w-0.5 bg-red-500 z-10 transition-all duration-300"
              style={{ left: `${positions.pessimistic}%` }}
            />
            <div 
              className="absolute top-2 bottom-2 w-0.5 bg-blue-500 z-10 transition-all duration-300"
              style={{ left: `${positions.base}%` }}
            />
            <div 
              className="absolute top-2 bottom-2 w-0.5 bg-green-500 z-10 transition-all duration-300"
              style={{ left: `${positions.optimistic}%` }}
            />

            {/* نقطه‌ها */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-white shadow-lg z-20 transition-all duration-500 ease-in-out"
              style={{ 
                left: `${positions.pessimistic}%`, 
                transform: 'translate(-50%, -50%)',
                backgroundColor: '#ef4444',
              }}
            />
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-white shadow-lg z-20 transition-all duration-500 ease-in-out"
              style={{ 
                left: `${positions.base}%`, 
                transform: 'translate(-50%, -50%)',
                backgroundColor: '#3b82f6',
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

            {/* برچسب‌های پایین */}
            <div 
              className="absolute top-full mt-2 text-[10px] font-medium text-red-600 whitespace-nowrap transition-all duration-300"
              style={{ left: `${positions.pessimistic}%`, transform: 'translateX(-50%)' }}
            >
              حد پایین
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
              حد بالایی
            </div>
          </div>

          {/* اطلاعات پایین */}
          <div className="flex justify-between items-center pt-3 border-t">
            <div>
              <span className="text-sm text-muted-foreground">سطح اطمینان: </span>
              <span className="text-lg font-bold text-blue-600">{confidenceLevel}%</span>
            </div>
            <div className="text-sm text-muted-foreground">
              دامنه: {formatCurrency(minVal)} - {formatCurrency(maxVal)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
