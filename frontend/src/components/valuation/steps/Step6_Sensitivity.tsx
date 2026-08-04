'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronRight } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import api from '@/lib/api';
import { MatrixTable } from '../sensitivity/MatrixTable';
import { TornadoChart } from '../sensitivity/TornadoChart';
import { ConfidenceRange } from '../sensitivity/ConfidenceRange';

// 🔥 تبدیل اعداد به فارسی
const toPersianNumber = (num: number) => {
  if (!num && num !== 0) return '۰';
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  const str = String(Math.round(num));
  return str.replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};

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
  const [scenarios, setScenarios] = useState<any>({});
  
  const [globalMin, setGlobalMin] = useState<number | undefined>(undefined);
  const [globalMax, setGlobalMax] = useState<number | undefined>(undefined);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingRequestRef = useRef<AbortController | null>(null);
  const isFirstLoad = useRef<boolean>(true);
  const originalBaseRef = useRef<number>(0);

  const calculateScenarioValues = (driverList: any[], currentBase: number) => {
    if (!currentBase || driverList.length === 0) {
      return { optimistic: currentBase, pessimistic: currentBase };
    }
    
    let optFactor = 1;
    let pesFactor = 1;
    
    driverList.forEach(d => {
      const maxChange = ((d.high - d.base) / d.base) * 0.5;
      const minChange = ((d.low - d.base) / d.base) * 0.5;
      
      optFactor = optFactor * (1 + maxChange);
      pesFactor = pesFactor * (1 + minChange);
    });
    
    return { 
      optimistic: currentBase * optFactor, 
      pessimistic: currentBase * pesFactor 
    };
  };

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
      
      let newBaseValue = baseValue;
      
      if (data.sensitivity_dashboard) {
        newBaseValue = data.sensitivity_dashboard.base_value || 0;
        setBaseValue(newBaseValue);
        
        if (isFirstLoad.current && newBaseValue > 0) {
          originalBaseRef.current = newBaseValue;
          isFirstLoad.current = false;
          console.log('✅ Original base saved:', originalBaseRef.current);
        }
      }

      let driverList = [];
      if (data.key_drivers && data.key_drivers.length > 0) {
        driverList = data.key_drivers.map((d: any) => {
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
            impact_percent: d.impact_percent || 0,
          };
        });
        setDrivers(driverList);
        
        if (driverList.length > 0 && originalBaseRef.current > 0) {
          let tempMin = originalBaseRef.current;
          let tempMax = originalBaseRef.current;
          driverList.forEach(d => {
            const minFactor = 1 + ((d.low - d.base) / d.base) * 0.5;
            const maxFactor = 1 + ((d.high - d.base) / d.base) * 0.5;
            tempMin = tempMin * minFactor;
            tempMax = tempMax * maxFactor;
          });
          setGlobalMin(tempMin);
          setGlobalMax(tempMax);
          console.log('📊 Global range:', { min: tempMin, max: tempMax });
        }
      }

      if (data.scenarios) {
        setScenarios(data.scenarios);
      }

      if (data.confidence_band) {
        setConfidenceLevel(data.confidence_band.confidence_level_percent || 85);
      }

      if (driverList.length > 0 && newBaseValue > 0) {
        const { optimistic, pessimistic } = calculateScenarioValues(
          driverList,
          newBaseValue
        );
        setOptimisticValue(optimistic);
        setPessimisticValue(pessimistic);
        console.log('📊 Calculated values:', { 
          optimistic, 
          pessimistic, 
          currentBase: newBaseValue 
        });
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
  }, [valuationCaseId, methodId, baseValue]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      isFirstLoad.current = true;
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
    
    let newBase = originalBaseRef.current;
    newDrivers.forEach(d => {
      const change = ((d.current_value - d.base) / d.base);
      newBase = newBase * (1 + change * 0.5);
    });
    setBaseValue(newBase);
    
    if (newBase > 0) {
      const { optimistic, pessimistic } = calculateScenarioValues(
        newDrivers,
        newBase
      );
      setOptimisticValue(optimistic);
      setPessimisticValue(pessimistic);
      console.log('🔄 Quick update:', { optimistic, pessimistic, newBase });
    }
    
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
    const result = isNegative ? `-${formatted}` : formatted;
    return result.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
  };

  const displayPercent = (value: number) => {
    if (value === undefined || value === null) return '۰%';
    const num = value > 1 ? value : value * 100;
    return toPersianNumber(num) + '%';
  };

  const tornadoData = useMemo(() => {
    if (!drivers || drivers.length === 0) return [];
    const sorted = [...drivers].sort((a, b) => (b.impact_percent || 0) - (a.impact_percent || 0));
    return sorted.map(d => ({
      name: d.name_fa,
      impact: d.impact_percent || 0,
    }));
  }, [drivers]);

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

  return (
    <div className="space-y-6 p-4" dir="rtl" style={{ fontFamily: 'var(--font-vazir)' }}>
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
                  <span className="text-sm font-bold text-blue-600">{displayPercent(driver.current_value)}</span>
                </div>
                <input 
                  type="range" 
                  min={driver.low * 100} 
                  max={driver.high * 100} 
                  step={(driver.high - driver.low) * 100 / 50} 
                  value={driver.current_value * 100} 
                  onChange={(e) => handleDriverChange(index, parseFloat(e.target.value) / 100)} 
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{displayPercent(driver.low)}</span>
                  <span className="text-blue-600 font-medium">{displayPercent(driver.current_value)}</span>
                  <span>{displayPercent(driver.high)}</span>
                </div>
                <div className="text-xs text-gray-500">تأثیر: {toPersianNumber(driver.impact_percent)}%</div>
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
                  <div className="text-right w-[30%]"><span className="text-red-600 font-medium">{formatCurrency(item.lowValue)}</span><span className="text-red-500 text-sm mr-1">({toPersianNumber(parseFloat(item.lowPercent))}%)</span></div>
                  <div className="text-center w-[40%]"><span className="text-sm font-medium text-gray-700 border-b-2 border-gray-300 px-4 py-1">{item.name}</span></div>
                  <div className="text-left w-[30%]"><span className="text-green-600 font-medium">{formatCurrency(item.highValue)}</span><span className="text-green-500 text-sm mr-1">(+{toPersianNumber(parseFloat(item.highPercent))}%)</span></div>
                </div>
                {index < impactTableData.length - 1 && <div className="border-b border-gray-100 mt-3" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">نمودار تورنادو</CardTitle>
        </CardHeader>
        <CardContent>
          <TornadoChart data={tornadoData} key={JSON.stringify(tornadoData.map(d => d.impact))} />
        </CardContent>
      </Card>

      <ConfidenceRange
        pessimisticValue={pessimisticValue}
        baseValue={baseValue}
        optimisticValue={optimisticValue}
        confidenceLevel={confidenceLevel}
        globalMin={globalMin}
        globalMax={globalMax}
      />

      

      <MatrixTable drivers={drivers} baseValue={baseValue} methodId={methodId} />

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
