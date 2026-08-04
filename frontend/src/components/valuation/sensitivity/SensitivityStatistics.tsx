'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity, Target } from 'lucide-react';

interface SensitivityResult {
  id: number;
  base_value: number;
  min_value: number;
  max_value: number;
  std_deviation: number;
  confidence_interval_low: number;
  confidence_interval_high: number;
  confidence_level: number;
  critical_drivers: Array<{ driver_id: string; driver_name: string; impact_percent: number }>;
}

interface Props {
  results: SensitivityResult | null;
}

export function SensitivityStatistics({ results }: Props) {
  if (!results) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        داده‌ای برای نمایش وجود ندارد
      </div>
    );
  }

  const stats = [
    {
      title: 'مقدار پایه',
      value: results.base_value,
      icon: Target,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950'
    },
    {
      title: 'حداقل مقدار',
      value: results.min_value,
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950'
    },
    {
      title: 'حداکثر مقدار',
      value: results.max_value,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950'
    },
    {
      title: 'انحراف معیار',
      value: results.std_deviation,
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
      format: 'number'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const formattedValue = stat.format === 'number'
            ? stat.value.toFixed(0)
            : stat.value.toLocaleString();

          return (
            <Card key={stat.title}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">{stat.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <span className="text-xl font-bold">{formattedValue}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">فاصله اطمینان {results.confidence_level * 100}%</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">حد پایین:</span>
              <span className="font-medium text-red-600">
                {results.confidence_interval_low.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">حد بالایی:</span>
              <span className="font-medium text-green-600">
                {results.confidence_interval_high.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-muted-foreground">دامنه تغییرات:</span>
              <span className="font-medium">
                {(results.confidence_interval_high - results.confidence_interval_low).toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {results.critical_drivers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-red-600">درایورهای بحرانی</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.critical_drivers.map((driver, index) => (
                <div
                  key={driver.driver_id}
                  className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950 rounded"
                >
                  <span className="font-medium">
                    {index + 1}. {driver.driver_name}
                  </span>
                  <span className="text-xs px-2 py-1 bg-red-200 text-red-800 rounded-full">
                    {driver.impact_percent.toFixed(1)}% تأثیر
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
