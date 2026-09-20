'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, AlertCircle, Loader2 } from 'lucide-react';
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
  ComposedChart,
} from 'recharts';
import { useState } from 'react';
import * as XLSX from 'xlsx';

interface M02_MEEM_EngineProps {
  data?: any;
  finalValue?: number;
  tokenValue?: number;
  confidenceLevel?: number;
  qcScore?: number;
  assetName?: string;
  assetCode?: string;
  onCalculate?: () => void;
  calculating?: boolean;
  error?: string | null;
}

export function M02_MEEM_Engine({ 
  data, 
  finalValue = 0,
  tokenValue: propTokenValue,
  confidenceLevel = 0.82,
  qcScore = 82,
  assetName = 'دارایی',
  assetCode = '',
  onCalculate,
  calculating = false,
  error = null
}: M02_MEEM_EngineProps) {
  const [showWaterfall, setShowWaterfall] = useState(true);

  // ============================================
  // توابع تبدیل اعداد به فارسی
  // ============================================
  const safeNumber = (value: any): number => {
    if (value === undefined || value === null) return 0;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? 0 : num;
  };

  const toPersianDigit = (num: any): string => {
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    return String(num).replace(/\d/g, (d) => persianDigits[parseInt(d)]);
  };

  const formatNumber = (num: any) => {
    const value = safeNumber(num);
    if (value === 0) return '۰';
    const parts = Math.round(value).toString().split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return toPersianDigit(integerPart);
  };

  const formatRial = (num: any) => {
    const value = safeNumber(num);
    if (value === 0) return '۰ ریال';
    return `${formatNumber(value)} ریال`;
  };

  const formatPercent = (num: number) => {
    if (!num && num !== 0) return '۰٪';
    const value = num > 1 ? num : num * 100;
    const str = value.toFixed(1);
    return toPersianDigit(str) + '٪';
  };

  const formatMillions = (num: any) => {
    const value = safeNumber(num);
    if (value === 0) return '۰';
    if (value >= 1000000) {
      const million = value / 1000000;
      const str = million.toFixed(1);
      return toPersianDigit(str) + ' میلیون';
    }
    return formatNumber(value);
  };

  // محاسبه تک توکن
  const calculateTokenValue = (valueInRial: number): number => {
    if (!valueInRial) return 0;
    const TOKEN_VALUE_IN_RIAL = 1000000;
    return Math.round(valueInRial / TOKEN_VALUE_IN_RIAL);
  };

  // ============================================
  // استخراج داده‌ها
  // ============================================
  const summary = data?.summary || data;
  const yearlyData = data?.yearly_data || [];
  const contributoryAssets = data?.contributory_assets || [];
  const hasData = summary && (summary.final_value || finalValue);

  // 🔥 محاسبه تک توکن
  const displayFinal = safeNumber(finalValue) || safeNumber(summary?.final_value) || 0;
  let displayToken = 0;
  if (propTokenValue && propTokenValue > 0) {
    displayToken = propTokenValue;
  } else {
    displayToken = calculateTokenValue(displayFinal);
  }
  const displayConfidence = confidenceLevel || 0.82;
  const displayQcScore = qcScore || 82;

  // ============================================
  // خروجی Excel
  // ============================================
  const exportExcel = () => {
    const rows: any[][] = [
      ['گزارش ارزش‌گذاری روش M-02 (MEEM)'],
      [''],
      ['دارایی:', assetName],
      ['کد:', assetCode || '-'],
      ['تاریخ:', new Date().toLocaleDateString('fa-IR')],
      [''],
      ['پارامترهای ورودی'],
      ['پارامتر', 'مقدار'],
      ['EBIT منتسب به دارایی', (summary?.ebit_attributable || 0).toLocaleString()],
      ['نرخ ریزش مشتری', `${(summary?.attrition_rate || 0) * 100}%`],
      ['نرخ تنزیل', `${(summary?.discount_rate || 0) * 100}%`],
      ['نرخ مالیات', `${(summary?.tax_rate || 0) * 100}%`],
      ['نرخ رشد پایانی', `${(summary?.terminal_growth_rate || 0) * 100}%`],
      ['افق پیش‌بینی', `${summary?.forecast_horizon || 0} سال`],
      ['ضریب کیفیت', (summary?.quality_multiplier || 0).toFixed(2)],
      [''],
      ['دارایی‌های مشارکت‌کننده'],
      ['نوع دارایی', 'ارزش (IRR)', 'نرخ بازده', 'هزینه سالانه'],
    ];
    contributoryAssets.forEach((asset: any) => {
      rows.push([
        asset.type || asset.asset_type,
        asset.value || asset.asset_value,
        `${((asset.return_rate || 0) * 100)}%`,
        (asset.annual_charge || 0).toLocaleString(),
      ]);
    });
    rows.push(['']);
    rows.push(['جدول محاسبات سالانه']);
    rows.push(['سال', 'سود مازاد پس از مالیات', 'ارزش فعلی (PV)']);
    yearlyData.forEach((row: any) => {
      rows.push([row.year, row.excess_earnings_after_tax, row.pv]);
    });
    rows.push(['']);
    rows.push(['خلاصه نتایج']);
    rows.push(['جمع ارزش فعلی دوره صریح', (summary?.total_pv || 0).toLocaleString()]);
    rows.push(['ارزش پایانی تنزیل‌شده', (summary?.pv_terminal || 0).toLocaleString()]);
    rows.push(['ارزش نهایی', (summary?.final_value || 0).toLocaleString()]);
    rows.push(['ارزش بر حسب تک توکن', displayToken]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 30 }, { wch: 25 }, { wch: 25 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, ws, 'M02_MEEM');
    XLSX.writeFile(wb, `${assetName}-M02-MEEM-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // ============================================
  // رندر
  // ============================================
  if (!hasData && !calculating) {
    return (
      <div className="relative overflow-hidden rounded-[32px] border border-slate-200/80 bg-white px-6 py-16 text-center shadow-[0_16px_50px_rgba(15,23,42,0.06)] font-[family-name:var(--font-vazir)]">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[26px] bg-violet-50 text-violet-700"><FileText className="h-8 w-8" /></div>
        <h3 className="text-xl font-bold text-dark-green mb-2 font-[family-name:var(--font-vazir)]">محاسبه ارزش دارایی (M-02 MEEM)</h3>
        <p className="text-gray-500 max-w-md mx-auto font-[family-name:var(--font-vazir)]">
          برای محاسبه ارزش دارایی با روش سود مازاد چند دوره‌ای (MEEM)، دکمه زیر را بزنید.
        </p>
        <Button
          className="mt-6 bg-dark-green hover:bg-dark-green/90 text-white px-8 py-3 text-lg font-[family-name:var(--font-vazir)]"
          onClick={onCalculate}
          disabled={calculating}
        >
          {calculating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin ml-2" />
              در حال محاسبه...
            </>
          ) : (
            'شروع ارزش‌گذاری 🚀'
          )}
        </Button>
        {error && (
          <p className="mt-4 text-sm text-red-500 font-[family-name:var(--font-vazir)]">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">

      {/* توضیحات روش */}
      <div className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
        <p className="text-sm leading-7 text-slate-600 font-[family-name:var(--font-vazir)]">
          🔹 روش سود مازاد چند دوره‌ای (MEEM) - ارزش دارایی را بر اساس سود مازاد پس از کسر هزینه دارایی‌های مشارکت‌کننده محاسبه می‌کند.
          <span className="inline-block mr-2 px-2 py-0.5 bg-purple-200 text-purple-800 rounded-full text-xs font-medium">
            ⭐ روش درآمد
          </span>
        </p>
      </div>

      {/* پارامترهای ورودی - اعداد فارسی */}
      <div className="grid grid-cols-2 gap-3 rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.045)] md:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-center transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md">
          <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">EBIT منتسب</p>
          <p className="text-sm font-bold text-purple-600 font-[family-name:var(--font-vazir)]">
            {formatRial(summary?.ebit_attributable || 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-center transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md">
          <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">نرخ ریزش مشتری</p>
          <p className="text-sm font-bold text-dark-green font-[family-name:var(--font-vazir)]">
            {formatPercent((summary?.attrition_rate || 0) * 100)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-center transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md">
          <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">نرخ تنزیل</p>
          <p className="text-sm font-bold text-dark-green font-[family-name:var(--font-vazir)]">
            {formatPercent((summary?.discount_rate || 0) * 100)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-center transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md">
          <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">ضریب کیفیت</p>
          <p className="text-sm font-bold text-dark-green font-[family-name:var(--font-vazir)]">
            {toPersianDigit((summary?.quality_multiplier || 0).toFixed(2))}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-center transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md">
          <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">افق پیش‌بینی</p>
          <p className="text-sm font-bold text-dark-green font-[family-name:var(--font-vazir)]">
            {toPersianDigit(summary?.forecast_horizon || 0)} سال
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-center transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md">
          <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">مجموع هزینه CAC</p>
          <p className="text-sm font-bold text-amber-600 font-[family-name:var(--font-vazir)]">
            {formatRial(summary?.total_cac_charge || 0)}
          </p>
        </div>
      </div>

      {/* نمودار ترکیبی */}
      {yearlyData.length > 0 && (
        <Card className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.045)]">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-dark-green font-[family-name:var(--font-vazir)]">📈 جریان‌های نقدی سود مازاد</h4>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-purple-600" />
                  <span className="text-gray-600 font-[family-name:var(--font-vazir)]">سود مازاد پس از مالیات</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="text-gray-600 font-[family-name:var(--font-vazir)]">ارزش فعلی (PV)</span>
                </div>
              </div>
            </div>
            
            <div style={{ width: '100%', height: 320 }} dir="ltr">
              <ResponsiveContainer>
                <ComposedChart
                  data={yearlyData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="year" 
                    tick={{ fontSize: 11, fill: '#6b7280', fontFamily: 'var(--font-vazir)' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#6b7280', fontFamily: 'var(--font-vazir)' }}
                    tickFormatter={(value) => formatMillions(value)}
                  />
                  <Tooltip 
                    formatter={(value: any) => formatRial(value)}
                    contentStyle={{ fontFamily: 'var(--font-vazir)' }}
                  />
                  <Legend wrapperStyle={{ fontFamily: 'var(--font-vazir)' }} />
                  <Bar dataKey="excess_earnings_after_tax" name="سود مازاد پس از مالیات" fill="#7c3aed" />
                  <Line type="monotone" dataKey="pv" name="ارزش فعلی (PV)" stroke="#ef4444" strokeWidth={2.5} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* جدول محاسبات سالانه */}
      {yearlyData.length > 0 && (
        <Card className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.045)]">
          <CardContent className="p-5 sm:p-6">
            <h4 className="text-sm font-bold text-dark-green mb-3 font-[family-name:var(--font-vazir)]">📊 جدول محاسبات سالانه</h4>
            <div className="overflow-x-auto font-[family-name:var(--font-vazir)]">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500">
                    <th className="border-b border-slate-100 p-3 text-center">سال</th>
                    <th className="border-b border-slate-100 p-3 text-right">نرخ بقا</th>
                    <th className="border-b border-slate-100 p-3 text-right">سود مازاد پس از مالیات</th>
                    <th className="border-b border-slate-100 p-3 text-right">ارزش فعلی (PV)</th>
                  </tr>
                </thead>
                <tbody>
                  {yearlyData.map((row: any, index: number) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="border p-2 text-center font-[family-name:var(--font-vazir)]">{toPersianDigit(row.year)}</td>
                      <td className="border p-2 text-right font-[family-name:var(--font-vazir)]">{formatPercent(row.survival_rate * 100)}</td>
                      <td className="border p-2 text-right font-bold text-purple-600 font-[family-name:var(--font-vazir)]">
                        {formatRial(row.excess_earnings_after_tax)}
                      </td>
                      <td className="border p-2 text-right font-bold text-blue-600 font-[family-name:var(--font-vazir)]">
                        {formatRial(row.pv)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* نتیجه نهایی - در انتهای صفحه */}
      <section className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#073f35] via-dark-green to-[#0b6b58] p-6 text-white shadow-[0_18px_50px_rgba(5,75,63,0.18)] sm:p-7">
        <div className="pointer-events-none absolute -left-16 -top-20 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-8 h-52 w-52 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_0_5px_rgba(110,231,183,0.12)]" />
              <span className="text-xs font-bold text-emerald-100/80">نتیجه نهایی ارزش‌گذاری</span>
            </div>
            <p className="text-sm font-bold text-white/70">ارزش نهایی دارایی</p>
            <p className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{formatRial(displayFinal)}</p>
            <p className="mt-2 text-[10px] text-emerald-100/60">پس از اعمال ضریب کیفیت</p>
          </div>
          <div className="grid w-full grid-cols-2 gap-3 md:w-auto md:min-w-[390px]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
              <p className="text-[10px] font-bold text-emerald-100/70">ارزش بر حسب تک توکن</p>
              <p className="mt-1 text-xl font-black">{formatNumber(displayToken)}</p>
              <p className="mt-0.5 text-[10px] text-emerald-100/60">تک توکن</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
              <p className="text-[10px] font-bold text-emerald-100/70">تاریخ محاسبه</p>
              <p className="mt-1 text-base font-black">{new Date().toLocaleDateString('fa-IR')}</p>
              <p className="mt-0.5 text-[10px] text-emerald-100/60">تحلیلگر: سیستم</p>
            </div>
          </div>
        </div>
      </section>

      {/* دکمه خروجی Excel */}
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          onClick={exportExcel}
          className="h-11 rounded-xl border-dark-green/20 bg-dark-green/[0.03] px-4 font-bold text-dark-green font-[family-name:var(--font-vazir)] hover:bg-dark-green/10"
        >
          <Download className="w-4 h-4" /> خروجی Excel
        </Button>
      </div>
    </div>
  );
}
