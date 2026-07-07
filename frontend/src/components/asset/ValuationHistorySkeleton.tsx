'use client';

import { Card, CardContent } from '@/components/ui/card';

export function ValuationHistorySkeleton() {
  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <CardContent className="p-6 space-y-4">
        {/* هدر */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-gray-200 rounded-lg animate-pulse" />
            <div>
              <div className="h-5 w-48 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-4 w-32 bg-gray-100 rounded-lg animate-pulse mt-1" />
            </div>
          </div>
          <div className="h-6 w-20 bg-gray-200 rounded-lg animate-pulse" />
        </div>

        {/* تایم‌لاین شبیه‌سازی شده */}
        <div className="relative space-y-6 pr-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="relative">
              <div className="absolute right-1 top-1 w-3 h-3 bg-gray-300 rounded-full animate-pulse" />
              <div className="mr-8 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse" />
                  </div>
                  <div className="h-6 w-12 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="mt-2 flex flex-wrap gap-3">
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-28 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="mt-3 h-7 w-28 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* خلاصه آماری */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-2 bg-gray-50 rounded-lg text-center">
              <div className="h-3 w-16 bg-gray-200 rounded mx-auto animate-pulse" />
              <div className="h-6 w-12 bg-gray-300 rounded mx-auto mt-1 animate-pulse" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
