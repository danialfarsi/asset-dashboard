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

interface M01_RfR_EngineProps {
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

export function M01_RfR_Engine({ 
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
}: M01_RfR_EngineProps) {
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

  // 🔥 محاسبه تک توکن
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
  const hasData = summary && (summary.final_value || finalValue);

  // 🔥 محاسبه تک توکن
  const displayFinal = safeNumber(finalValue) || safeNumber(summary?.final_value) || 0;
  let displayToken = 0;
  if (propTokenValue && propTokenValue > 0) {
    displayToken = propTokenValue;
  } else {
    displayToken = calculateTokenValue(displayFinal);
  }

  // ============================================
  // خروجی Excel
  // ============================================
  const exportExcel = () => {
    const rows: any[][] = [
      ['گزارش ارزش‌گذاری روش M-01 (Relief-from-Royalty)'],
      [''],
      ['دارایی:', assetName],
      ['کد:', assetCode || '-'],
      ['تاریخ:', new Date().toLocaleDateString('fa-IR')],
      [''],
      ['پارامترهای ورودی'],
      ['پارامتر', 'مقدار'],
      ['نرخ حق‌الامتیاز', `${(summary?.royalty_rate || 0).toFixed(1)}%`],
      ['تخصیص درآمد', `${(summary?.revenue_attribution || 0).toFixed(0)}%`],
      ['نرخ مؤثر', `${(summary?.effective_rate || 0).toFixed(1)}%`],
      ['نرخ تنزیل', `${(summary?.discount_rate || 0).toFixed(1)}%`],
      ['نرخ مالیات', `${(summary?.tax_rate || 0).toFixed(0)}%`],
      ['نرخ رشد پایانی', `${(summary?.terminal_growth_rate || 0).toFixed(1)}%`],
      ['افق پیش‌بینی', `${summary?.forecast_horizon || 0} سال`],
      ['ضریب کیفیت', (summary?.quality_multiplier || 0).toFixed(2)],
      ['درآمد پایه', (summary?.current_revenue || 0).toLocaleString()],
      [''],
      ['جدول محاسبات سالانه'],
      ['سال', 'درآمد (ریال)', 'حق‌الامتیاز ناخالص (ریال)', 'پس از مالیات (ریال)', 'ارزش فعلی (ریال)'],
    ];
    yearlyData.forEach((row: any) => {
      rows.push([row.year, row.revenue, row.gross_royalty, row.after_tax, row.pv]);
    });
    rows.push(['']);
    rows.push(['خلاصه نتایج']);
    rows.push(['جمع ارزش فعلی دوره صریح', (summary?.total_pv || 0).toLocaleString()]);
    rows.push(['ارزش پایانی تنزیل‌شده', (summary?.pv_terminal || 0).toLocaleString()]);
    rows.push(['ارزش نهایی (ریال)', (summary?.final_value || 0).toLocaleString()]);
    rows.push(['ارزش بر حسب تک توکن', displayToken]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 30 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, ws, 'M01_RfR');
    XLSX.writeFile(wb, `${assetName}-M01-RfR-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // ============================================
  // رندر
  // ============================================
  if (!hasData && !calculating) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-bold text-dark-green mb-2 font-[family-name:var(--font-vazir)]">محاسبه ارزش دارایی (M-01 RfR)</h3>
        <p className="text-gray-500 max-w-md mx-auto font-[family-name:var(--font-vazir)]">
          برای محاسبه ارزش دارایی با روش حق‌الامتیاز (Relief-from-Royalty)، دکمه زیر را بزنید.
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

  const displayConfidence = confidenceLevel || 0.82;
  const displayQcScore = qcScore || 82;

  return (
    <div className="space-y-6" dir="rtl">

      {/* توضیحات روش */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700 font-[family-name:var(--font-vazir)]">
          🔹 روش حق‌الامتیاز (RfR) - ارزش دارایی را بر اساس صرفه‌جویی ناشی از عدم پرداخت حق‌الامتیاز محاسبه می‌کند.
          <span className="inline-block mr-2 px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full text-xs font-medium">
            ⭐ روش هزینه
          </span>
        </p>
      </div>

      {/* پارامترهای ورودی - اعداد فارسی */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg border">
        <div className="text-center p-2 bg-white rounded-lg shadow-sm">
          <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">نرخ حق‌الامتیاز</p>
          <p className="text-sm font-bold text-dark-green font-[family-name:var(--font-vazir)]">
            {formatPercent(summary?.royalty_rate || 0)}
          </p>
        </div>
        <div className="text-center p-2 bg-white rounded-lg shadow-sm">
          <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">تخصیص درآمد</p>
          <p className="text-sm font-bold text-dark-green font-[family-name:var(--font-vazir)]">
            {formatPercent(summary?.revenue_attribution || 0)}
          </p>
        </div>
        <div className="text-center p-2 bg-white rounded-lg shadow-sm">
          <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">نرخ مؤثر</p>
          <p className="text-sm font-bold text-blue-600 font-[family-name:var(--font-vazir)]">
            {formatPercent(summary?.effective_rate || 0)}
          </p>
        </div>
        <div className="text-center p-2 bg-white rounded-lg shadow-sm">
          <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">نرخ تنزیل</p>
          <p className="text-sm font-bold text-dark-green font-[family-name:var(--font-vazir)]">
            {formatPercent(summary?.discount_rate || 0)}
          </p>
        </div>
        <div className="text-center p-2 bg-white rounded-lg shadow-sm">
          <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">نرخ مالیات</p>
          <p className="text-sm font-bold text-dark-green font-[family-name:var(--font-vazir)]">
            {formatPercent(summary?.tax_rate || 0)}
          </p>
        </div>
        <div className="text-center p-2 bg-white rounded-lg shadow-sm">
          <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">ضریب کیفیت</p>
          <p className="text-sm font-bold text-dark-green font-[family-name:var(--font-vazir)]">
            {toPersianDigit((summary?.quality_multiplier || 0).toFixed(2))}
          </p>
        </div>
        <div className="text-center p-2 bg-white rounded-lg shadow-sm">
          <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">افق پیش‌بینی</p>
          <p className="text-sm font-bold text-dark-green font-[family-name:var(--font-vazir)]">
            {toPersianDigit(summary?.forecast_horizon || 0)} سال
          </p>
        </div>
        <div className="text-center p-2 bg-white rounded-lg shadow-sm">
          <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">درآمد پایه</p>
          <p className="text-sm font-bold text-dark-green font-[family-name:var(--font-vazir)]">
            {formatRial(summary?.current_revenue || 0)}
          </p>
        </div>
      </div>

      {/* نمودار - به حالت اولیه (ComposedChart) */}
      {yearlyData.length > 0 && (
        <Card className="border-blue-200 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-dark-green font-[family-name:var(--font-vazir)]">📈 جریان‌های نقدی و ارزش فعلی</h4>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-blue-600" />
                  <span className="text-gray-600 font-[family-name:var(--font-vazir)]">حق‌الامتیاز ناخالص</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-gray-600 font-[family-name:var(--font-vazir)]">پس از مالیات</span>
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
                  <Bar dataKey="gross_royalty" name="حق‌الامتیاز ناخالص" fill="#1e40af" />
                  <Bar dataKey="after_tax" name="پس از مالیات" fill="#22c55e" />
                  <Line type="monotone" dataKey="pv" name="ارزش فعلی (PV)" stroke="#ef4444" strokeWidth={2.5} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* جدول محاسبات سالانه */}
      {yearlyData.length > 0 && (
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <h4 className="text-sm font-bold text-dark-green mb-3 font-[family-name:var(--font-vazir)]">📊 جدول محاسبات سالانه</h4>
            <div className="overflow-x-auto font-[family-name:var(--font-vazir)]">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border p-2 text-center">سال</th>
                    <th className="border p-2 text-right">درآمد</th>
                    <th className="border p-2 text-right">حق‌الامتیاز ناخالص</th>
                    <th className="border p-2 text-right">پس از مالیات</th>
                    <th className="border p-2 text-right">ارزش فعلی (PV)</th>
                  </tr>
                </thead>
                <tbody>
                  {yearlyData.map((row: any, index: number) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="border p-2 text-center font-[family-name:var(--font-vazir)]">{toPersianDigit(row.year)}</td>
                      <td className="border p-2 text-right font-[family-name:var(--font-vazir)]">{formatRial(row.revenue)}</td>
                      <td className="border p-2 text-right font-[family-name:var(--font-vazir)]">{formatRial(row.gross_royalty)}</td>
                      <td className="border p-2 text-right font-bold text-green-600 font-[family-name:var(--font-vazir)]">
                        {formatRial(row.after_tax)}
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

      {/* 🔥 خلاصه نتایج - حذف کارت سطح اطمینان و اضافه کردن تک توکن */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 font-[family-name:var(--font-vazir)]">ارزش نهایی دارایی</p>
            <p className="text-2xl font-bold text-dark-green font-[family-name:var(--font-vazir)]">{formatRial(displayFinal)}</p>
            <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">پس از اعمال ضریب کیفیت</p>
          </CardContent>
        </Card>
        {/* 🔥 کارت تک توکن - جایگزین سطح اطمینان */}
        <Card className="bg-gradient-to-br from-blue-100 to-white border-blue-300">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 font-[family-name:var(--font-vazir)]">ارزش بر حسب تک توکن</p>
            <p className="text-3xl font-bold text-blue-700 font-[family-name:var(--font-vazir)]">{formatNumber(displayToken)}</p>
            <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">تک توکن</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-teal-50 to-white border-teal-200">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 font-[family-name:var(--font-vazir)]">تاریخ محاسبه</p>
            <p className="text-lg font-bold text-teal-700 font-[family-name:var(--font-vazir)]">{new Date().toLocaleDateString('fa-IR')}</p>
            <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">تحلیلگر: سیستم</p>
          </CardContent>
        </Card>
      </div>

      {/* دکمه خروجی Excel (PDF حذف شد) */}
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          onClick={exportExcel}
          className="flex items-center gap-1 font-[family-name:var(--font-vazir)] hover:bg-green-50 hover:border-green-300"
        >
          <Download className="w-4 h-4" /> خروجی Excel
        </Button>
      </div>
    </div>
  );
}
