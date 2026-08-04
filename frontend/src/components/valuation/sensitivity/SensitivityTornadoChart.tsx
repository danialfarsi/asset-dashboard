'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';

interface TornadoData {
  driver_id: string;
  driver_name: string;
  impact_range: number;
  negative_impact: number;
  positive_impact: number;
}

interface Props {
  data: TornadoData[];
  baseValue: number;
}

export function SensitivityTornadoChart({ data, baseValue }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        داده‌ای برای نمایش وجود ندارد
      </div>
    );
  }

  const chartData = data.map(item => ({
    name: item.driver_name,
    'تأثیر منفی': -item.negative_impact,
    'تأثیر مثبت': item.positive_impact,
    total: item.impact_range
  }));

  const formatTooltip = (value: number, name: string) => {
    if (name === 'تأثیر منفی') {
      return `-${Math.abs(value).toLocaleString()}`;
    }
    return value.toLocaleString();
  };

  const formatYAxis = (value: number) => {
    return (value / 1e9).toFixed(0) + 'B';
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 text-sm text-muted-foreground">
          مقدار پایه: {baseValue.toLocaleString()}
        </div>
        <ResponsiveContainer width="100%" height={500}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 20, right: 30, left: 150, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={formatYAxis} />
            <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12 }} />
            <Tooltip formatter={formatTooltip} labelFormatter={(label) => `درایور: ${label}`} />
            <Legend />
            <Bar dataKey="تأثیر مثبت" stackId="a" fill="#22c55e" radius={[0, 4, 4, 0]} />
            <Bar dataKey="تأثیر منفی" stackId="a" fill="#ef4444" radius={[4, 0, 0, 4]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
