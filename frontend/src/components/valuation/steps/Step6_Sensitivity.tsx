'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

interface Step6Props {
  onNext: () => void;
  onPrev: () => void;
  valuationCaseId?: number;
  methodId?: string;
  assetId?: number;
  baseValue?: number;
}

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
  validation?: any;
}

interface Scenario {
  id: string;
  label_fa: string;
  label_en: string;
  color: string;
  driver_changes: Record<string, { type: string; value: number }>;
  description_fa: string;
  description_en: string;
  value?: number;
  change_percent?: number;
}

interface SensitivityResult {
  driver_id: string;
  driver_name: string;
  driver_name_fa: string;
  base_value: number;
  low_range: number;
  high_range: number;
  impact_percent: number;
  sensitivity_results: Array<{ driver_value: number; result_value: number }>;
}

export function Step6_Sensitivity({ 
  onNext, 
  onPrev, 
  valuationCaseId,
  methodId = 'M-01',
  assetId,
  baseValue = 135882961249
}: Step6Props) {
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [scenarios, setScenarios] = useState<Record<string, Scenario>>({});
  const [sensitivityResults, setSensitivityResults] = useState<SensitivityResult[]>([]);
  const [tornadoRanking, setTornadoRanking] = useState<any[]>([]);
  const [confidenceBand, setConfidenceBand] = useState<any>(null);
  const [interpretation, setInterpretation] = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // ============================================
  // تبدیل اعداد به فارسی
  // ============================================
  const toPersianNumber = (num: number | string): string => {
    if (num === undefined || num === null) return '۰';
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    const str = String(num);
    return str.replace(/\d/g, (d) => persianDigits[parseInt(d)]);
  };

  const formatCurrency = (value: number): string => {
    if (value >= 1e12) return `${(value / 1e12).toFixed(1)}B`;
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    return value.toFixed(0);
  };

  const formatPercent = (value: number): string => {
    return `${toPersianNumber((value * 100).toFixed(1))}%`;
  };

  // ============================================
  // بارگذاری Config
  // ============================================
  useEffect(() => {
    loadConfigs();
  }, [methodId]);

  const loadConfigs = async () => {
    try {
      setLoading(true);

      // ۱. بارگذاری متغیرهای کلیدی
      const driversRes = await fetch(`/config/sensitivity/drivers/${methodId}_drivers.json`);
      const driversData = await driversRes.json();
      setDrivers(driversData.drivers.filter((d: Driver) => d.enabled !== false));

      // ۲. بارگذاری سناریوها
      const scenariosRes = await fetch(`/config/sensitivity/scenarios/${methodId}_scenarios.json`);
      const scenariosData = await scenariosRes.json();
      setScenarios(scenariosData.scenarios);

      // ۳. بارگذاری تفسیر مدیریتی
      const interpRes = await fetch(`/config/sensitivity/interpretation/${methodId}_interpretation.json`);
      const interpData = await interpRes.json();
      setInterpretation(interpData);

      // ۴. بارگذاری پیکربندی اعتماد
      const confRes = await fetch('/config/sensitivity/confidence/confidence_config.json');
      const confData = await confRes.json();

      // ۵. تولید نتایج تحلیل
      generateResults(driversData.drivers, scenariosData.scenarios, confData);

      setLoading(false);
    } catch (error) {
      console.error('Error loading sensitivity configs:', error);
      setLoading(false);
    }
  };

  // ============================================
  // تولید نتایج تحلیل
  // ============================================
  const generateResults = (driversList: Driver[], scenariosData: any, confData: any) => {
    // ۱. تحلیل یک‌متغیره
    const results: SensitivityResult[] = [];
    
    for (const driver of driversList) {
      if (!driver.enabled) continue;
      
      const steps = 10;
      const driverResults = [];
      let minResult = Infinity;
      let maxResult = -Infinity;
      
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const driverValue = driver.low + t * (driver.high - driver.low);
        const resultValue = recalculateValue(driver.id, driverValue);
        driverResults.push({ driver_value: driverValue, result_value: resultValue });
        if (resultValue < minResult) minResult = resultValue;
        if (resultValue > maxResult) maxResult = resultValue;
      }
      
      const impactPercent = ((maxResult - minResult) / baseValue) * 100;
      
      results.push({
        driver_id: driver.id,
        driver_name: driver.name,
        driver_name_fa: driver.name_fa,
        base_value: driver.base,
        low_range: driver.low,
        high_range: driver.high,
        impact_percent: impactPercent,
        sensitivity_results: driverResults,
      });
    }

    setSensitivityResults(results);

    // ۲. رتبه‌بندی تورنادو
    const sorted = [...results].sort((a, b) => b.impact_percent - a.impact_percent);
    setTornadoRanking(sorted.map((item, index) => ({
      rank: index + 1,
      driver_id: item.driver_id,
      driver_name: item.driver_name_fa,
      impact_percent: item.impact_percent,
    })));

    // ۳. محاسبه سناریوها
    const scenarioResults: Record<string, any> = {};
    for (const [key, scenario] of Object.entries(scenariosData)) {
      let value = baseValue;
      for (const [driverId, change] of Object.entries(scenario.driver_changes)) {
        const driver = driversList.find(d => d.id === driverId);
        if (!driver) continue;
        let newValue;
        if (change.type === 'relative') {
          newValue = driver.base * (1 + change.value);
        } else {
          newValue = driver.base + change.value;
        }
        value = recalculateValue(driverId, newValue);
      }
      scenarioResults[key] = {
        ...scenario,
        value: value,
        change_percent: ((value - baseValue) / baseValue) * 100,
      };
    }
    setScenarios(scenarioResults as any);

    // ۴. محاسبه بازه اطمینان
    let allValues: number[] = [];
    for (const result of results) {
      allValues.push(result.low_range);
      allValues.push(result.high_range);
    }
    const low = Math.min(...allValues);
    const high = Math.max(...allValues);
    
    const avgImpact = results.reduce((sum, r) => sum + r.impact_percent, 0) / results.length;
    let confidenceLevel = 100 - (avgImpact * 1.5);
    confidenceLevel = Math.max(confData.defaults.min_confidence, Math.min(confData.defaults.max_confidence, confidenceLevel));
    
    setConfidenceBand({
      low: low,
      base: baseValue,
      high: high,
      confidence_level_percent: Math.round(confidenceLevel),
      range_percent: ((high - low) / baseValue) * 100,
    });

    // ۵. داشبورد
    setDashboard({
      pessimistic_value: scenarioResults.pessimistic?.value || null,
      base_value: baseValue,
      optimistic_value: scenarioResults.optimistic?.value || null,
      pessimistic_change_percent: scenarioResults.pessimistic?.change_percent || null,
      optimistic_change_percent: scenarioResults.optimistic?.change_percent || null,
    });
  };

  // ============================================
  // بازمحاسبه ارزش (شبیه‌سازی)
  // ============================================
  const recalculateValue = (driverId: string, newValue: number): number => {
    // این تابع باید بر اساس روش واقعی محاسبه شود
    // در حال حاضر یک شبیه‌سازی ساده
    let base = baseValue;
    if (driverId === 'royalty_rate' || driverId === 'discount_rate') {
      const ratio = newValue / 0.04;
      base = baseValue * (1 + (ratio - 1) * 0.5);
    } else if (driverId === 'terminal_growth' || driverId === 'revenue_growth') {
      const ratio = newValue / 0.05;
      base = baseValue * (1 + (ratio - 1) * 0.3);
    } else {
      const ratio = newValue / 0.08;
      base = baseValue * (1 + (ratio - 1) * 0.4);
    }
    return Math.round(base);
  };

  // ============================================
  // رندر
  // ============================================
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-dark-green" />
        <span className="mr-3 text-gray-500 font-[family-name:var(--font-vazir)]">در حال بارگذاری تحلیل حساسیت...</span>
      </div>
    );
  }

  const topDriver = tornadoRanking.length > 0 ? tornadoRanking[0] : null;

  return (
    <div className="space-y-6" dir="rtl">
      {/* هدر */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="w-7 h-7 rounded-full bg-dark-green text-white flex items-center justify-center text-xs font-bold font-[family-name:var(--font-vazir)]">۶</span>
        <span className="font-[family-name:var(--font-vazir)]">مرحله ۶ از ۷ - تحلیل حساسیت و سناریو</span>
      </div>

      <div>
        <h2 className="text-xl font-bold text-dark-green font-[family-name:var(--font-vazir)]">تحلیل حساسیت و سناریو</h2>
        <p className="text-sm text-gray-500 font-[family-name:var(--font-vazir)]">
          روش: <span className="font-medium text-dark-green">{methodId}</span>
        </p>
      </div>

      {/* داشبورد سناریوها */}
      {dashboard && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm bg-red-50 border-red-200">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-gray-500 font-[family-name:var(--font-vazir)]">بدبینانه</p>
              <p className="text-xl font-bold text-red-600 font-[family-name:var(--font-vazir)]">
                {formatCurrency(dashboard.pessimistic_value)}
              </p>
              <p className="text-xs text-red-500 font-[family-name:var(--font-vazir)]">
                {dashboard.pessimistic_change_percent?.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-blue-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-gray-500 font-[family-name:var(--font-vazir)]">مبنا</p>
              <p className="text-xl font-bold text-blue-600 font-[family-name:var(--font-vazir)]">
                {formatCurrency(dashboard.base_value)}
              </p>
              <p className="text-xs text-blue-500 font-[family-name:var(--font-vazir)]">ارزش پایه</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-gray-500 font-[family-name:var(--font-vazir)]">خوش‌بینانه</p>
              <p className="text-xl font-bold text-green-600 font-[family-name:var(--font-vazir)]">
                {formatCurrency(dashboard.optimistic_value)}
              </p>
              <p className="text-xs text-green-500 font-[family-name:var(--font-vazir)]">
                {dashboard.optimistic_change_percent?.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* نمودار تورنادو */}
      {tornadoRanking.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-dark-green mb-3 font-[family-name:var(--font-vazir)]">📊 رتبه‌بندی متغیرهای حساس (تورنادو)</h3>
            <div style={{ width: '100%', height: 300 }} dir="ltr">
              <ResponsiveContainer>
                <BarChart
                  data={tornadoRanking}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => `${value}%`} />
                  <YAxis type="category" dataKey="driver_name" />
                  <Tooltip 
                    formatter={(value: any) => `${value.toFixed(1)}%`}
                    contentStyle={{ fontFamily: 'var(--font-vazir)' }}
                  />
                  <Bar dataKey="impact_percent" fill="#015345" radius={[0, 4, 4, 0]}>
                    {tornadoRanking.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#D4A547' : '#015345'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* تحلیل حساسیت یک‌متغیره */}
      {sensitivityResults.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-dark-green mb-3 font-[family-name:var(--font-vazir)]">📈 منحنی‌های حساسیت</h3>
            <div style={{ width: '100%', height: 300 }} dir="ltr">
              <ResponsiveContainer>
                <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="driver_value" type="number" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(value)}
                    contentStyle={{ fontFamily: 'var(--font-vazir)' }}
                  />
                  <Legend wrapperStyle={{ fontFamily: 'var(--font-vazir)' }} />
                  {sensitivityResults.map((result, index) => (
                    <Line
                      key={result.driver_id}
                      data={result.sensitivity_results}
                      dataKey="result_value"
                      name={result.driver_name_fa}
                      stroke={['#015345', '#D4A547', '#3B7A6E', '#8ECFAF'][index % 4]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* سناریوها */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <h3 className="text-sm font-bold text-dark-green mb-3 font-[family-name:var(--font-vazir)]">🎯 سناریوها</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(scenarios).map(([key, scenario]: [string, any]) => (
              <Card key={key} className={`border-2 ${key === 'base' ? 'border-blue-300' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: scenario.color }} />
                    <span className="font-bold font-[family-name:var(--font-vazir)]">{scenario.label_fa}</span>
                  </div>
                  <p className="text-sm font-bold text-dark-green font-[family-name:var(--font-vazir)]">
                    {formatCurrency(scenario.value || 0)}
                  </p>
                  <p className="text-xs text-gray-500 font-[family-name:var(--font-vazir)]">
                    {scenario.change_percent?.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-400 mt-1 font-[family-name:var(--font-vazir)]">
                    {scenario.description_fa}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* بازه اطمینان */}
      {confidenceBand && (
        <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-white">
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-dark-green mb-2 font-[family-name:var(--font-vazir)]">📊 بازه اطمینان</h3>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">پایین</p>
                <p className="text-lg font-bold text-red-600 font-[family-name:var(--font-vazir)]">
                  {formatCurrency(confidenceBand.low)}
                </p>
              </div>
              <div className="flex-1">
                <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="absolute h-full bg-gradient-to-r from-red-500 via-blue-500 to-green-500 rounded-full"
                    style={{ 
                      left: `${((confidenceBand.low - baseValue * 0.5) / (baseValue * 1.5)) * 100}%`,
                      right: `${100 - ((confidenceBand.high - baseValue * 0.5) / (baseValue * 1.5)) * 100}%`
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1 font-[family-name:var(--font-vazir)]">
                  <span>{formatCurrency(confidenceBand.low)}</span>
                  <span className="font-bold text-dark-green">مبنا: {formatCurrency(confidenceBand.base)}</span>
                  <span>{formatCurrency(confidenceBand.high)}</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">سطح اطمینان</p>
                <p className="text-lg font-bold text-dark-green font-[family-name:var(--font-vazir)]">
                  {toPersianNumber(confidenceBand.confidence_level_percent)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* تفسیر مدیریتی */}
      {topDriver && interpretation && (
        <Card className="border-0 shadow-sm border-t-4 border-t-golden-amber">
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-dark-green mb-2 font-[family-name:var(--font-vazir)]">💡 تفسیر مدیریتی</h3>
            <div className="bg-gray-50 p-3 rounded-lg border">
              <p className="text-sm text-gray-700 font-[family-name:var(--font-vazir)]">
                {interpretation.templates?.[0]?.summary_fa?.replace('{driver_name}', topDriver.driver_name)
                  .replace('{impact_percent}', topDriver.impact_percent.toFixed(1)) || 
                  `متغیر {top_driver} با تأثیر ${topDriver.impact_percent.toFixed(1)}% بیشترین تأثیر را بر ارزش دارد.`}
              </p>
            </div>
            <div className="mt-3 space-y-1">
              <p className="text-xs font-bold text-gray-600 font-[family-name:var(--font-vazir)]">توصیه‌ها:</p>
              {interpretation.templates?.[0]?.recommendations_fa?.map((rec: string, i: number) => (
                <p key={i} className="text-xs text-gray-500 mr-4 font-[family-name:var(--font-vazir)]">
                  • {rec}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* دکمه‌ها */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onPrev} className="flex items-center gap-1 font-[family-name:var(--font-vazir)]">
          <ChevronLeft className="w-4 h-4" />
          قبلی
        </Button>
        <Button
          className="bg-dark-green hover:bg-dark-green/90 flex items-center gap-1 font-[family-name:var(--font-vazir)]"
          onClick={onNext}
        >
          ادامه به مرحله ۷
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
