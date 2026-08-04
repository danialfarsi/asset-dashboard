'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MatrixTableProps {
  drivers: any[];
  baseValue: number;
  methodId: string;
}

export function MatrixTable({ drivers, baseValue, methodId }: MatrixTableProps) {
  const generateRange = (low: number, high: number, steps: number = 4) => {
    const values = [];
    const step = (high - low) / steps;
    for (let i = 0; i <= steps; i++) {
      values.push(Number((low + i * step).toFixed(4)));
    }
    return values;
  };

  // انتخاب دو متغیر مناسب بر اساس روش
  const getMatrixDrivers = (driverList: any[], method: string) => {
    if (!driverList || driverList.length < 2) return null;

    const methodMatrixMap: Record<string, { x: string; y: string }> = {
      'M-01': { x: 'royalty_rate', y: 'discount_rate' },
      'M-02': { x: 'ebit_attributable', y: 'attrition_rate' },
      'M-03': { x: 'discount_rate', y: 'terminal_growth' },
      'M-04': { x: 'discount_rate', y: 'with_asset_growth' },
      'M-05': { x: 'functional_obs', y: 'economic_obs' },
      'M-06': { x: 'obsolescence', y: 'age_factor' },
      'M-07': { x: 'productivity_loss', y: 'recruit_cost' },
      'M-08': { x: 'transaction_multiple', y: 'control_premium' },
      'M-09': { x: 'market_multiple', y: 'intangible_share' },
    };

    const mapping = methodMatrixMap[method];
    if (!mapping) {
      return { d1: driverList[0], d2: driverList[1] };
    }

    const d1 = driverList.find(d => d.id === mapping.x);
    const d2 = driverList.find(d => d.id === mapping.y);

    if (!d1 || !d2) {
      return { d1: driverList[0], d2: driverList[1] };
    }

    return { d1, d2 };
  };

  const matrix = useMemo(() => {
    if (!drivers || drivers.length < 2 || !baseValue || baseValue === 0) {
      return null;
    }

    const selected = getMatrixDrivers(drivers, methodId);
    if (!selected) return null;

    const { d1, d2 } = selected;

    const xValues = generateRange(d1.low, d1.high, 4);
    const yValues = generateRange(d2.low, d2.high, 4);

    const data = yValues.map((y) => {
      return xValues.map((x) => {
        const factor = 1 + ((x - d1.base) / d1.base) * 0.5 + ((y - d2.base) / d2.base) * 0.3;
        return Math.round(baseValue * factor);
      });
    });

    return {
      xValues,
      yValues,
      data,
      xLabel: d1.name_fa,
      yLabel: d2.name_fa,
    };
  }, [drivers, baseValue, methodId]);

  const findBaseCell = () => {
    if (!matrix) return null;
    const d1 = drivers.find(d => d.id === matrix.xLabel) || drivers[0];
    const d2 = drivers.find(d => d.id === matrix.yLabel) || drivers[1];
    if (!d1 || !d2) return null;
    
    const xIndex = matrix.xValues.findIndex(v => Math.abs(v - d1.base) < 0.001);
    const yIndex = matrix.yValues.findIndex(v => Math.abs(v - d2.base) < 0.001);
    
    if (xIndex === -1 || yIndex === -1) return null;
    return { xIndex, yIndex };
  };

  const baseCell = findBaseCell();

  if (!matrix) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">ماتریس حساسیت</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {drivers.length < 2 
              ? 'برای نمایش ماتریس به حداقل ۲ متغیر نیاز است' 
              : 'داده‌ای برای نمایش وجود ندارد'}
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatValue = (val: number) => {
    if (val >= 1e9) return (val / 1e9).toFixed(1) + 'B';
    if (val >= 1e6) return (val / 1e6).toFixed(1) + 'M';
    if (val >= 1e3) return (val / 1e3).toFixed(1) + 'K';
    return val.toFixed(0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          ماتریس حساسیت ({matrix.xLabel} vs {matrix.yLabel})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="p-2 border bg-gray-50 w-16"></th>
                {matrix.xValues.map((x: number, idx: number) => (
                  <th key={idx} className="p-2 border text-center font-medium bg-gray-50 min-w-[70px]">
                    {(x * 100).toFixed(1)}%
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.data.map((row: number[], i: number) => {
                const yLabel = (matrix.yValues[i] * 100).toFixed(1) + '%';
                return (
                  <tr key={i}>
                    <td className="p-2 border text-center font-medium bg-gray-50 whitespace-nowrap">
                      {yLabel}
                    </td>
                    {row.map((val: number, j: number) => {
                      const isBase = baseCell && i === baseCell.yIndex && j === baseCell.xIndex;
                      
                      const allValues = matrix.data.flat();
                      const minVal = Math.min(...allValues);
                      const maxVal = Math.max(...allValues);
                      const range = maxVal - minVal || 1;
                      const normalized = (val - minVal) / range;
                      
                      let r, g, b;
                      if (normalized < 0.5) {
                        const t = normalized / 0.5;
                        r = 255;
                        g = Math.round(255 * t);
                        b = Math.round(255 * t);
                      } else {
                        const t = (normalized - 0.5) / 0.5;
                        r = Math.round(255 * (1 - t));
                        g = 255;
                        b = Math.round(255 * (1 - t));
                      }
                      
                      const bgColor = isBase ? '#dbeafe' : `rgb(${r}, ${g}, ${b})`;
                      const textColor = normalized > 0.7 ? '#ffffff' : '#1a1a1a';
                      
                      return (
                        <td 
                          key={j} 
                          className={`p-2 border text-center font-mono text-sm min-w-[60px] ${isBase ? 'ring-2 ring-blue-500 font-bold' : ''}`}
                          style={{ backgroundColor: bgColor, color: textColor }}
                        >
                          {formatValue(val)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
