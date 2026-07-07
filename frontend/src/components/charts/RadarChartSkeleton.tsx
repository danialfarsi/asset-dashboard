'use client';

import { Card, CardContent } from '@/components/ui/card';

export function RadarChartSkeleton() {
  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <CardContent className="p-6">
        {/* هدر */}
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-2">
            <div className="h-5 w-40 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-4 w-32 bg-gray-100 rounded-lg animate-pulse" />
          </div>
          <div className="h-8 w-24 bg-gray-200 rounded-full animate-pulse" />
        </div>

        {/* نمودار شبیه‌سازی شده */}
        <div className="relative w-full h-[400px] flex items-center justify-center">
          <div className="relative w-72 h-72">
            {/* پنتاگون خالی */}
            <div className="absolute inset-0 border-2 border-gray-200 rounded-full animate-pulse" />
            <div className="absolute inset-[15%] border-2 border-gray-100 rounded-full animate-pulse" />
            <div className="absolute inset-[30%] border-2 border-gray-100 rounded-full animate-pulse" />
            <div className="absolute inset-[45%] border-2 border-gray-100 rounded-full animate-pulse" />
            
            {/* نقطه‌های مرکزی */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-gray-300 rounded-full animate-pulse" />
            
            {/* ۵ نقطه شبیه‌سازی شده */}
            {[...Array(5)].map((_, i) => {
              const angle = (i * 72 - 90) * Math.PI / 180;
              const radius = 40 + Math.random() * 30;
              const x = 50 + radius * Math.cos(angle);
              const y = 50 + radius * Math.sin(angle);
              return (
                <div
                  key={i}
                  className="absolute w-4 h-4 bg-gray-300 rounded-full animate-pulse"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* امتیازات پایین */}
        <div className="grid grid-cols-5 gap-2 mt-4 pt-4 border-t border-gray-200">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="text-center">
              <div className="h-3 w-12 bg-gray-200 rounded mx-auto animate-pulse" />
              <div className="h-5 w-10 bg-gray-300 rounded mx-auto mt-1 animate-pulse" />
              <div className="h-1.5 w-full bg-gray-200 rounded-full mt-1 animate-pulse" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
