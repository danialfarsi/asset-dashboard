'use client';

import { useEffect, useState } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';

interface RadarChartProps {
  data: {
    strategic: number;
    technical: number;
    operational: number;
    market: number;
    risk: number;
  };
  assetName?: string;
  maxValue?: number;
  height?: number;
}

interface ChartData {
  dimension: string;
  value: number;
  fullMark: number;
  color: string;
}

const DIMENSION_COLORS = {
  strategic: '#3B82F6',
  technical: '#8B5CF6',
  operational: '#F59E0B',
  market: '#10B981',
  risk: '#EF4444',
};

const DIMENSION_LABELS = {
  strategic: 'استراتژیک',
  technical: 'فنی و بلوغ',
  operational: 'عملیاتی',
  market: 'بازار',
  risk: 'ریسک',
};

// 🔥 تعداد سوالات هر بُعد
const DIMENSION_COUNTS = {
  strategic: 6,
  technical: 4,
  operational: 4,
  market: 5,
  risk: 4,
};

export default function AssetRadarChart({ 
  data, 
  assetName, 
  maxValue = 5,
  height = 400 
}: RadarChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [averages, setAverages] = useState<Record<string, number>>({});

  useEffect(() => {
    // 🔥 محاسبه میانگین هر بُعد
    const avg: Record<string, number> = {};
    let totalAvg = 0;
    let count = 0;

    Object.entries(DIMENSION_COUNTS).forEach(([key, count]) => {
      const rawValue = data[key as keyof typeof data] || 0;
      const average = rawValue / count;
      avg[key] = Math.min(average, maxValue);
      totalAvg += average;
      count++;
    });

    setAverages(avg);

    const formattedData: ChartData[] = [
      {
        dimension: 'استراتژیک',
        value: avg.strategic || 0,
        fullMark: maxValue,
        color: DIMENSION_COLORS.strategic,
      },
      {
        dimension: 'فنی و بلوغ',
        value: avg.technical || 0,
        fullMark: maxValue,
        color: DIMENSION_COLORS.technical,
      },
      {
        dimension: 'عملیاتی',
        value: avg.operational || 0,
        fullMark: maxValue,
        color: DIMENSION_COLORS.operational,
      },
      {
        dimension: 'بازار',
        value: avg.market || 0,
        fullMark: maxValue,
        color: DIMENSION_COLORS.market,
      },
      {
        dimension: 'ریسک',
        value: avg.risk || 0,
        fullMark: maxValue,
        color: DIMENSION_COLORS.risk,
      },
    ];
    setChartData(formattedData);
  }, [data, maxValue]);

  const overallAverage = Object.values(averages).reduce((a, b) => a + b, 0) / 5;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-white text-sm">
            {item.dimension}
          </p>
          <p className="text-lg font-bold" style={{ color: item.color }}>
            {item.value.toFixed(2)} / {maxValue}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            میانگین امتیاز وزنی
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = () => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {Object.entries(DIMENSION_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: DIMENSION_COLORS[key as keyof typeof DIMENSION_COLORS] }}
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {label}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <CardContent className="p-6">
        {/* هدر */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {assetName ? `ارزیابی ${assetName}` : 'ارزیابی دارایی'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              امتیاز کلی: <span className="font-bold text-dark-green">{overallAverage.toFixed(2)}</span> از {maxValue}
            </p>
          </div>
          <div className="px-4 py-1.5 rounded-full bg-dark-green/10 text-dark-green text-sm font-medium">
            ⭐ {overallAverage >= 4 ? 'عالی' : overallAverage >= 3 ? 'خوب' : overallAverage >= 2 ? 'متوسط' : 'نیاز به بهبود'}
          </div>
        </div>

        {/* نمودار */}
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer>
            <RadarChart 
              cx="50%" 
              cy="50%" 
              outerRadius="70%" 
              data={chartData}
            >
              <PolarGrid 
                stroke="#E5E7EB" 
                strokeWidth={1}
                gridType="polygon"
              />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{
                  fill: '#6B7280',
                  fontSize: 12,
                  fontWeight: 500,
                }}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, maxValue]}
                tick={{ fill: '#9CA3AF', fontSize: 10 }}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <Radar
                name="امتیاز"
                dataKey="value"
                stroke="#015345"
                strokeWidth={2.5}
                fill="#015345"
                fillOpacity={0.25}
                animationDuration={1000}
                animationEasing="ease-out"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* امتیازات دقیق با میانگین */}
        <div className="grid grid-cols-5 gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {Object.entries(DIMENSION_LABELS).map(([key, label]) => {
            const avgValue = averages[key as keyof typeof averages] || 0;
            const rawValue = data[key as keyof typeof data] || 0;
            const count = DIMENSION_COUNTS[key as keyof typeof DIMENSION_COUNTS];
            const color = DIMENSION_COLORS[key as keyof typeof DIMENSION_COLORS];
            const percentage = (avgValue / maxValue) * 100;
            
            return (
              <div key={key} className="text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {label}
                </p>
                <p className="text-sm font-bold" style={{ color }}>
                  {avgValue.toFixed(2)}
                </p>
                <p className="text-[10px] text-gray-400">
                  مجموع: {rawValue.toFixed(0)} / {count} سوال
                </p>
                <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${Math.min(percentage, 100)}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
