'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';

interface Scenario {
  id: string;
  label_fa: string;
  label_en: string;
  color: string;
  driver_changes: Record<string, { type: string; value: number }>;
  description_fa: string;
  description_en: string;
}

interface ScenarioResult {
  value: number;
  change_percent: number;
}

interface Props {
  scenarios: Record<string, Scenario>;
  results: Record<string, ScenarioResult>;
  selectedId: string;
  onSelect: (id: string) => void;
  onRun: (id: string) => void;
  loading: boolean;
}

export function SensitivityScenarios({
  scenarios,
  results,
  selectedId,
  onSelect,
  onRun,
  loading
}: Props) {
  const scenarioList = Object.values(scenarios);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {scenarioList.map((scenario) => {
        const result = results[scenario.id];
        const isSelected = selectedId === scenario.id;
        const isCalculated = !!result;

        return (
          <Card
            key={scenario.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              isSelected ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onSelect(scenario.id)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg" style={{ color: scenario.color }}>
                  {scenario.label_fa}
                </CardTitle>
                <Badge
                  variant={isCalculated ? 'default' : 'secondary'}
                  className={isCalculated ? 'bg-green-500' : ''}
                >
                  {isCalculated ? 'محاسبه شده' : 'انجام نشده'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{scenario.description_fa}</p>

              {result && (
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">ارزش:</span>
                    <span className="font-bold">{result.value.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-muted-foreground">تغییر:</span>
                    <span
                      className={`font-bold flex items-center gap-1 ${
                        result.change_percent > 0
                          ? 'text-green-600'
                          : result.change_percent < 0
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {result.change_percent > 0 && <TrendingUp className="h-3 w-3" />}
                      {result.change_percent < 0 && <TrendingDown className="h-3 w-3" />}
                      {result.change_percent > 0 ? '+' : ''}
                      {result.change_percent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                variant={isCalculated ? 'outline' : 'default'}
                onClick={(e) => {
                  e.stopPropagation();
                  onRun(scenario.id);
                }}
                disabled={loading}
              >
                {loading && isSelected ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    در حال محاسبه
                  </>
                ) : (
                  <>
                    {isCalculated ? 'محاسبه مجدد' : 'اجرای سناریو'}
                    <ArrowRight className="mr-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
