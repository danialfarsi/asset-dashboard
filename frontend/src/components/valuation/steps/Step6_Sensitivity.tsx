'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  CircleDollarSign,
  Gauge,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
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
  methodId = 'M-01',
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
            impact_percent: d.impact_percent !== undefined ? d.impact_percent : 0,
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

  const changeFromOriginalBase = (value: number) => {
    const originalBase = originalBaseRef.current;
    if (!originalBase) return '۰%';

    const change = ((value - originalBase) / originalBase) * 100;
    const rounded = Math.round(change);
    const sign = rounded > 0 ? '+' : rounded < 0 ? '-' : '';

    return `${sign}${toPersianNumber(Math.abs(rounded))}%`;
  };

  const tornadoData = useMemo(() => {
    if (!drivers || drivers.length === 0) return [];
    const sorted = [...drivers].sort((a, b) => (b.impact_percent || 0) - (a.impact_percent || 0));
    return sorted.map(d => ({
      name: d.name_fa,
      impact: d.impact_percent !== undefined ? d.impact_percent : 0,
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
      <div dir="rtl" className="flex min-h-[420px] items-center justify-center rounded-3xl border border-emerald-100 bg-gradient-to-b from-emerald-50/70 to-white">
        <div className="flex flex-col items-center gap-4">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-200">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-slate-800">در حال آماده‌سازی تحلیل حساسیت</p>
            <p className="mt-1 text-sm text-slate-500">اطلاعات و سناریوهای مالی در حال پردازش هستند</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card dir="rtl" className="overflow-hidden rounded-2xl border-red-200 bg-red-50/80 shadow-sm">
        <CardContent className="flex items-start gap-3 p-5">
          <div className="rounded-xl bg-red-100 p-2.5 text-red-600">
            <TriangleAlert className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-red-800">بارگذاری اطلاعات با خطا مواجه شد</p>
            <p className="mt-1 text-sm leading-6 text-red-700">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative space-y-6 overflow-hidden rounded-[28px] bg-slate-50/70 p-4 sm:p-6 lg:p-8" dir="rtl" style={{ fontFamily: 'var(--font-vazir)' }}>
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-100/50 blur-3xl" />
      <div className="pointer-events-none absolute -left-28 top-72 h-64 w-64 rounded-full bg-teal-100/40 blur-3xl" />

      {calculating && (
        <div className="fixed left-1/2 top-5 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-emerald-400/30 bg-slate-900/95 px-5 py-3 text-sm font-medium text-white shadow-2xl shadow-slate-400/30 backdrop-blur-xl">
          <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" />
          در حال به‌روزرسانی محاسبات
        </div>
      )}

      <Card className="relative overflow-hidden rounded-3xl border-slate-200/80 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-5 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700"><CircleDollarSign className="h-5 w-5" /></div>
            <div>
              <CardTitle className="text-lg font-extrabold text-slate-800">چشم‌انداز ارزش‌گذاری</CardTitle>
              <p className="mt-1 text-sm text-slate-500">مقایسه ارزش تخمینی در سه سناریوی اصلی</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 sm:p-7">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="group relative overflow-hidden rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="mb-7 flex items-center justify-between">
                <span className="font-bold text-rose-700">سناریوی بدبینانه</span>
                <span className="rounded-xl bg-rose-100 p-2 text-rose-600"><ArrowDownLeft className="h-5 w-5" /></span>
              </div>
              <p className="text-3xl font-black tracking-tight text-slate-900">{formatCurrency(pessimisticValue)}</p>
              <p className="mt-2 text-sm font-semibold text-rose-600">{changeFromOriginalBase(pessimisticValue)} نسبت به مبنا</p>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-emerald-500 bg-gradient-to-br from-emerald-700 to-emerald-950 p-5 text-white shadow-lg shadow-emerald-900/15 transition-all hover:-translate-y-0.5">
              <div className="absolute -left-8 -top-8 h-28 w-28 rounded-full bg-white/5" />
              <div className="relative mb-7 flex items-center justify-between">
                <span className="font-bold text-emerald-50">سناریوی مبنا</span>
                <span className="rounded-xl bg-white/10 p-2 text-emerald-200"><Gauge className="h-5 w-5" /></span>
              </div>
              <p className="relative text-3xl font-black tracking-tight">{formatCurrency(baseValue)}</p>
              <p className="relative mt-2 text-sm font-medium text-emerald-200">بر اساس مفروضات فعلی</p>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50 to-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="mb-7 flex items-center justify-between">
                <span className="font-bold text-teal-700">سناریوی خوش‌بینانه</span>
                <span className="rounded-xl bg-teal-100 p-2 text-teal-600"><ArrowUpRight className="h-5 w-5" /></span>
              </div>
              <p className="text-3xl font-black tracking-tight text-slate-900">{formatCurrency(optimisticValue)}</p>
              <p className="mt-2 text-sm font-semibold text-teal-600">{changeFromOriginalBase(optimisticValue)} نسبت به مبنا</p>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
            <span className="text-slate-500">دامنه کل تغییرات</span>
            <span className="font-extrabold text-slate-800">{formatCurrency(optimisticValue - pessimisticValue)}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-slate-200/80 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-5 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700"><SlidersHorizontal className="h-5 w-5" /></div>
            <div>
              <CardTitle className="text-lg font-extrabold text-slate-800">تنظیم متغیرهای کلیدی</CardTitle>
              <p className="mt-1 text-sm text-slate-500">برای مشاهده اثر هر متغیر، مقدار آن را در بازه مجاز تغییر دهید</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 sm:p-7">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {drivers.map((driver, index) => (
              <div key={driver.id} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-5 transition-colors hover:border-emerald-200 hover:bg-emerald-50/30">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">{driver.name_fa}</span>
                  <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-sm font-extrabold text-emerald-700">{displayPercent(driver.current_value)}</span>
                </div>
                <input 
                  type="range" 
                  min={driver.low * 100} 
                  max={driver.high * 100} 
                  step={(driver.high - driver.low) * 100 / 50} 
                  value={driver.current_value * 100} 
                  onChange={(e) => handleDriverChange(index, parseFloat(e.target.value) / 100)} 
                  aria-label={driver.name_fa}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-emerald-600" 
                />
                <div className="flex justify-between text-xs font-medium text-slate-400">
                  <span>{displayPercent(driver.low)}</span>
                  <span className="text-emerald-700">مقدار فعلی</span>
                  <span>{displayPercent(driver.high)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-xs">
                  <span className="text-slate-500">میزان تأثیرگذاری</span>
                  <span className="font-bold text-slate-700">{displayPercent(driver.impact_percent)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-slate-200/80 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-5 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700"><BarChart3 className="h-5 w-5" /></div>
            <div>
              <CardTitle className="text-lg font-extrabold text-slate-800">اثر متغیرها بر ارزش پایه</CardTitle>
              <p className="mt-1 text-sm text-slate-500">بازه تغییر ارزش در کمینه و بیشینه هر عامل</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 sm:p-7">
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="hidden grid-cols-[1fr_1.15fr_1fr] bg-slate-50 px-5 py-3 text-xs font-bold text-slate-500 sm:grid">
              <span>کمینه ارزش</span><span className="text-center">متغیر کلیدی</span><span className="text-left">بیشینه ارزش</span>
            </div>
            {impactTableData.map((item, index) => (
              <div key={index} className={`grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-[1fr_1.15fr_1fr] sm:items-center ${index < impactTableData.length - 1 ? 'border-b border-slate-100' : ''}`}>
                  <div className="flex items-center justify-between sm:block">
                    <span className="text-xs text-slate-400 sm:hidden">کمینه</span>
                    <span className="font-extrabold text-rose-600">{formatCurrency(item.lowValue)} <small className="font-semibold">({toPersianNumber(parseFloat(item.lowPercent))}%)</small></span>
                  </div>
                  <div className="order-first rounded-lg bg-slate-50 px-3 py-2 text-center font-bold text-slate-700 sm:order-none sm:bg-transparent">{item.name}</div>
                  <div className="flex items-center justify-between sm:block sm:text-left">
                    <span className="text-xs text-slate-400 sm:hidden">بیشینه</span>
                    <span className="font-extrabold text-emerald-600">{formatCurrency(item.highValue)} <small className="font-semibold">(+{toPersianNumber(parseFloat(item.highPercent))}%)</small></span>
                  </div>
                </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-slate-200/80 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100 px-5 py-5 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700"><BarChart3 className="h-5 w-5" /></div>
            <div>
              <CardTitle className="text-lg font-extrabold text-slate-800">نمودار تورنادو</CardTitle>
              <p className="mt-1 text-sm text-slate-500">رتبه‌بندی عوامل بر اساس شدت اثرگذاری</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 sm:p-7">
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

      <div className="relative flex flex-col-reverse gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-slate-500">شناسه پرونده: <span className="font-bold text-slate-700">{toPersianNumber(valuationCaseId)}</span></div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.history.back()} className="h-11 flex-1 rounded-xl border-slate-200 px-5 font-bold text-slate-700 sm:flex-none">
            <ChevronRight className="ml-2 h-4 w-4" /> بازگشت
          </Button>
          {onNext && <Button onClick={onNext} className="h-11 flex-1 rounded-xl bg-emerald-700 px-5 font-bold text-white shadow-md shadow-emerald-200 hover:bg-emerald-800 sm:flex-none">ادامه به مرحله ۷ <ChevronLeft className="mr-2 h-4 w-4" /></Button>}
        </div>
      </div>
    </div>
  );
}
