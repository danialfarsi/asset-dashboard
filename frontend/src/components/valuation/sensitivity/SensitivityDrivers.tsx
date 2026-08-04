'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface Driver {
  id: string;
  name: string;
  name_fa: string;
  base: number;
  low: number;
  high: number;
  step: number;
  unit: string;
  decimal_places: number;
  is_editable: boolean;
  enabled: boolean;
  validation?: {
    type: string;
    min: number;
    max: number;
    severity: string;
    message_fa: string;
  };
}

interface CriticalDriver {
  driver_id: string;
  driver_name: string;
  impact_percent: number;
}

interface Props {
  drivers: Driver[];
  criticalDrivers: CriticalDriver[];
}

export function SensitivityDrivers({ drivers, criticalDrivers }: Props) {
  const criticalIds = new Set(criticalDrivers.map(d => d.driver_id));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {drivers.map((driver) => {
        const isCritical = criticalIds.has(driver.id);
        const criticalInfo = criticalDrivers.find(d => d.driver_id === driver.id);

        return (
          <Card
            key={driver.id}
            className={`transition-all ${
              isCritical ? 'border-red-300 dark:border-red-700' : ''
            }`}
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{driver.name_fa}</CardTitle>
              {isCritical ? (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                  <AlertCircle className="h-3 w-3" />
                  بحرانی
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                  <CheckCircle className="h-3 w-3" />
                  عادی
                </span>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">مقدار پایه:</span>
                  <span className="font-medium">
                    {driver.base.toFixed(driver.decimal_places)} {driver.unit === 'percent' ? '%' : ''}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">دامنه تغییرات:</span>
                  <span className="font-medium">
                    {driver.low.toFixed(driver.decimal_places)} - {driver.high.toFixed(driver.decimal_places)}
                    {driver.unit === 'percent' ? '%' : ''}
                  </span>
                </div>
                {isCritical && criticalInfo && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-950 rounded text-sm text-red-700 dark:text-red-300">
                    تأثیر: {criticalInfo.impact_percent.toFixed(1)}% بر ارزش نهایی
                  </div>
                )}
                {driver.validation && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <span className="text-yellow-600">⚠️</span> {driver.validation.message_fa}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
