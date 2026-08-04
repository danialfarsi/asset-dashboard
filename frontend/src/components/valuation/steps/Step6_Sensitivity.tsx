'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronRight } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import api from '@/lib/api';

export function Step6_Sensitivity({
  valuationCaseId = 6,
  methodId = 'M-04',
  onNext,
}: {
  valuationCaseId?: number;
  methodId?: string;
  onNext?: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [baseValue, setBaseValue] = useState(0);
  const [optimisticValue, setOptimisticValue] = useState(0);
  const [pessimisticValue, setPessimisticValue] = useState(0);
  const [confidenceLevel, setConfidenceLevel] = useState(0);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [tornadoData, setTornadoData] = useState<any[]>([]);
  const [scenarios, setScenarios] = useState<any>({});
  const [matrixData, setMatrixData] = useState<any>(null);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingRequestRef = useRef<AbortController | null>(null);
  const isFirstLoad = useRef<boolean>(true);

  const generateRange = (low: number, high: number, steps: number = 4) => {
    const values = [];
    const step = (high - low) / steps;
    for (let i = 0; i <= steps; i++) {
      values.push(Number((low + i * step).toFixed(4)));
    }
    return values;
  };

  const buildTwoWayMatrix = (driverList: any[], baseVal: number) => {
    if (!driverList || driverList.length < 2 || !baseVal || baseVal === 0) return null;
    
    const d1 = driverList[0];
    const d2 = driverList[1];
    const xValues = generateRange(d1.low, d1.high, 4);
    const yValues = generateRange(d2.low, d2.high, 4);
    const data: number[][] = [];
    
    for (let y of yValues) {
      const row: number[] = [];
      for (let x of xValues) {
        const factor = 1 + ((x - d1.base) / d1.base) * 0.5 + ((y - d2.base) / d2.base) * 0.3;
        row.push(Math.round(baseVal * factor / 1e9));
      }
      data.push(row);
    }
    
    return { xValues, yValues, data, xLabel: d1.name_fa, yLabel: d2.name_fa };
  };

  useEffect(() => {
    if (drivers.length >= 2 && baseValue > 0) {
      setMatrixData(buildTwoWayMatrix(drivers, baseValue));
    } else {
      setMatrixData(null);
    }
  }, [drivers, baseValue]);

  const loadData = useCallback(async (customDrivers?: any[]) => {
    if (pendingRequestRef.current) {
      pendingRequestRef.current.abort();
      pendingRequestRef.current = null;
    }

    const controller = new AbortController();
    pendingRequestRef.current = controller;

    try {
      setCalculating(true);
      
      const payload: any = {
        valuation_case_id: valuationCaseId,
        method_id: methodId
      };
      
      if (customDrivers) {
        payload.drivers = customDrivers.map(d => ({
          id: d.id,
          value: d.current_value
        }));
      }
      
      const sensitivityRes = await api.post('/intangible/sensitivity/calculate/', payload, {
        signal: controller.signal
      });
      
      const data = sensitivityRes.data;
      
      console.log('📊 API Response:', data);
      
      // 🔥 دریافت همه مقادیر از API
      if (data.sensitivity_dashboard) {
        setBaseValue(data.sensitivity_dashboard.base_value || 0);
        setOptimisticValue(data.sensitivity_dashboard.optimistic_value || 0);
        setPessimisticValue(data.sensitivity_dashboard.pessimistic_value || 0);
      }

      if (data.scenarios) {
        setScenarios(data.scenarios);
      }

      if (data.key_drivers && data.key_drivers.length > 0) {
        const driverList = data.key_drivers.map((d: any) => {
          let currentVal = d.base_value;
          if (customDrivers) {
            const found = customDrivers.find(cd => cd.id === d.driver_id);
            if (found) currentVal = found.current_value;
          }
          return {
            id: d.driver_id,
            name_fa: d.driver_name,
            base: d.base_value,
            low: d.low_range,
            high: d.high_range,
            current_value: currentVal,
            impact_percent: d.impact_percent,
          };
        });
        setDrivers(driverList);
      }

      if (data.tornado_ranking && data.tornado_ranking.length > 0) {
        setTornadoData(data.tornado_ranking.map((d: any) => ({
          name: d.driver_name,
          impact: d.impact_percent,
        })));
      }

      if (data.confidence_band) {
        setConfidenceLevel(data.confidence_band.confidence_level_percent || 85);
      }

      setCalculating(false);
      pendingRequestRef.current = null;
    } catch (err: any) {
      if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
      console.error('Error:', err);
      setError(err.message || 'خطا در بارگذاری داده‌ها');
      setCalculating(false);
      pendingRequestRef.current = null;
    }
  }, [valuationCaseId, methodId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadData();
      setLoading(false);
    };
    init();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (pendingRequestRef.current) pendingRequestRef.current.abort();
    };
  }, []);

  const handleDriverChange = (index: number, value: number) => {
    const newDrivers = [...drivers];
    newDrivers[index].current_value = value;
    setDrivers(newDrivers);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    timeoutRef.current = setTimeout(() => {
      loadData(newDrivers);
      timeoutRef.current = null;
    }, 300);
  };

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

  const toPersianNumber = (num: number) => {
    if (!num && num !== 0) return '۰';
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    return String(Math.round(num)).replace(/\d/g, (d) => persianDigits[parseInt(d)]);
  };

  const tornadoChartData = tornadoData.map(d => ({
    name: d.name,
    value: d.impact,
  })).sort((a, b) => b.value - a.value);

  const impactTableData = drivers.map(d => {
    const lowChange = ((d.low - d.base) / d.base * 100);
    const highChange = ((d.high - d.base) / d.base * 100);
    return {
      name: d.name_fa,
      lowPercent: lowChange.toFixed(1),
      highPercent: highChange.toFixed(1),
      lowValue: baseValue * (1 + lowChange / 100),
      highValue: baseValue * (1 + highChange / 100),
    };
  });

  const confidenceData = [
    { name: 'بدبینانه', value: pessimisticValue / 1e9 },
    { name: 'مبنا', value: baseValue / 1e9 },
    { name: 'خوش‌بینانه', value: optimisticValue / 1e9 }
  ];

  const scenariosList = Object.values(scenarios).map((s: any) => ({
    name: s.label_fa,
    value: s.value / 1e9,
    color: s.color || '#3b82f6',
    change: s.change_percent
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-700">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const findBaseCell = () => {
    if (!matrixData) return null;
    const d1 = drivers[0];
    const d2 = drivers[1];
    if (!d1 || !d2) return null;
    const xIndex = matrixData.xValues.findIndex(v => Math.abs(v - d1.base) < 0.001);
    const yIndex = matrixData.yValues.findIndex(v => Math.abs(v - d2.base) < 0.001);
    if (xIndex === -1 || yIndex === -1) return null;
    return { xIndex, yIndex };
  };

  const baseCell = findBaseCell();
  const showMatrix = matrixData && matrixData.data && matrixData.data.length > 0 && matrixData.data[0] && matrixData.data[0].length > 0;

  return (
    <div className="space-y-6 p-4" dir="rtl">
      {calculating && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 text-sm">
          <Loader2 className="h-4 w-4 inline-block ml-2 animate-spin" />
          در حال بروزرسانی...
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">تحلیل حساسیت و سناریو</h2>
          <p className="text-sm text-muted-foreground">روش: {methodId} | شناسه مورد: {valuationCaseId}</p>
        </div>
        <Button onClick={onNext}>مرحله بعد <ChevronRight className="mr-2 h-4 w-4" /></Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">پیش‌بینی مالی</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-6 bg-red-50 rounded-xl border border-red-200">
              <p className="text-xs text-red-600 font-medium">بدبینانه</p>
              <p className="text-3xl font-bold text-red-700">{formatCurrency(pessimisticValue)}</p>
              <p className="text-sm text-red-500">{toPersianNumber((baseValue ? ((pessimisticValue - baseValue) / baseValue * 100) : 0))}%</p>
            </div>
            <div className="text-center p-6 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-xs text-blue-600 font-medium">مبنا</p>
              <p className="text-3xl font-bold text-blue-700">{formatCurrency(baseValue)}</p>
              <p className="text-sm text-blue-500">بر اساس مفروضات فعلی</p>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-xl border border-green-200">
              <p className="text-xs text-green-600 font-medium">خوش‌بینانه</p>
              <p className="text-3xl font-bold text-green-700">{formatCurrency(optimisticValue)}</p>
              <p className="text-sm text-green-500">+{toPersianNumber((baseValue ? ((optimisticValue - baseValue) / baseValue * 100) : 0))}%</p>
            </div>
          </div>
          <div className="mt-4 text-center text-sm text-gray-500">دامنه تغییرات: {formatCurrency(optimisticValue - pessimisticValue)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">انتخاب متغیرهای کلیدی</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-12">
            {drivers.map((driver, index) => (
              <div key={driver.id} className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{driver.name_fa}</span>
                  <span className="text-sm font-bold text-blue-600">{(driver.current_value * 100).toFixed(1)}%</span>
                </div>
                <input type="range" min={driver.low * 100} max={driver.high * 100} step={(driver.high - driver.low) * 100 / 50} value={driver.current_value * 100} onChange={(e) => handleDriverChange(index, parseFloat(e.target.value) / 100)} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{(driver.low * 100).toFixed(1)}%</span>
                  <span className="text-blue-600 font-medium">{(driver.current_value * 100).toFixed(1)}%</span>
                  <span>{(driver.high * 100).toFixed(1)}%</span>
                </div>
                <div className="text-xs text-gray-500">تأثیر: {driver.impact_percent.toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">تأثیر متغیرهای کلیدی بر ارزش پایه</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {impactTableData.map((item, index) => (
              <div key={index} className="relative">
                <div className="flex items-center justify-between">
                  <div className="text-right w-[30%]"><span className="text-red-600 font-medium">{formatCurrency(item.lowValue)}</span><span className="text-red-500 text-sm mr-1">({item.lowPercent}%)</span></div>
                  <div className="text-center w-[40%]"><span className="text-sm font-medium text-gray-700 border-b-2 border-gray-300 px-4 py-1">{item.name}</span></div>
                  <div className="text-left w-[30%]"><span className="text-green-600 font-medium">{formatCurrency(item.highValue)}</span><span className="text-green-500 text-sm mr-1">(+{item.highPercent}%)</span></div>
                </div>
                {index < impactTableData.length - 1 && <div className="border-b border-gray-100 mt-3" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">نمودار تورنادو</CardTitle></CardHeader>
        <CardContent>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tornadoChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip formatter={(value: any) => `${value.toFixed(1)}%`} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">بازه اطمینان</CardTitle></CardHeader>
          <CardContent>
            <div style={{ height: '150px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={confidenceData} layout="vertical">
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={60} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-2"><span className="text-sm text-muted-foreground">سطح اطمینان: </span><span className="font-bold text-blue-600">{toPersianNumber(confidenceLevel)}%</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">مقایسه سناریوها</CardTitle></CardHeader>
          <CardContent>
            <div style={{ height: '150px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scenariosList}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `${value.toFixed(1)}B`} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {scenariosList.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">ماتریس حساسیت</CardTitle></CardHeader>
        <CardContent>
          {showMatrix ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead><tr><th className="p-2 border bg-gray-50 w-16"></th>
                  {matrixData.xValues.map((x: number, idx: number) => <th key={idx} className="p-2 border text-center font-medium bg-gray-50 min-w-[70px]">{(x * 100).toFixed(1)}%</th>)}
                </tr></thead>
                <tbody>
                  {matrixData.data.map((row: number[], i: number) => (
                    <tr key={i}>
                      <td className="p-2 border text-center font-medium bg-gray-50 whitespace-nowrap">{(matrixData.yValues[i] * 100).toFixed(1)}%</td>
                      {row.map((val: number, j: number) => {
                        const isBase = baseCell && i === baseCell.yIndex && j === baseCell.xIndex;
                        const allValues = matrixData.data.flat();
                        const minVal = Math.min(...allValues);
                        const maxVal = Math.max(...allValues);
                        const range = maxVal - minVal || 1;
                        const normalized = (val - minVal) / range;
                        let r, g, b;
                        if (normalized < 0.5) { const t = normalized / 0.5; r = 255; g = Math.round(255 * t); b = Math.round(255 * t); } 
                        else { const t = (normalized - 0.5) / 0.5; r = Math.round(255 * (1 - t)); g = 255; b = Math.round(255 * (1 - t)); }
                        const bgColor = isBase ? '#dbeafe' : `rgb(${r}, ${g}, ${b})`;
                        const textColor = normalized > 0.7 ? '#ffffff' : '#1a1a1a';
                        return <td key={j} className={`p-2 border text-center font-mono text-sm min-w-[60px] ${isBase ? 'ring-2 ring-blue-500 font-bold' : ''}`} style={{ backgroundColor: bgColor, color: textColor }}>{val.toFixed(0)}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {drivers.length < 2 ? 'برای نمایش ماتریس به حداقل ۲ متغیر نیاز است' : 'در حال بارگذاری ماتریس...'}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between items-center pt-4 border-t">
        <div className="text-sm text-muted-foreground">شناسه مورد: {valuationCaseId}</div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.history.back()}>بازگشت</Button>
          {onNext && <Button onClick={onNext}>ادامه به مرحله ۷ <ChevronRight className="mr-2 h-4 w-4" /></Button>}
        </div>
      </div>
    </div>
  );
}
