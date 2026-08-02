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

interface M09_MMM_EngineProps {
  data?: any;
  finalValue?: number;
  confidenceLevel?: number;
  qcScore?: number;
  assetName?: string;
  assetCode?: string;
  onCalculate?: () => void;
  calculating?: boolean;
  error?: string | null;
}

export function M09_MMM_Engine({ 
  data, 
  finalValue = 0,
  confidenceLevel = 0.82,
  qcScore = 82,
  assetName = 'دارایی',
  assetCode = '',
  onCalculate,
  calculating = false,
  error = null
}: M09_MMM_EngineProps) {
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

  // ============================================
  // استخراج داده‌ها
  // ============================================
  const summary = data?.summary || data;
  const yearlyData = data?.yearly_data || [];
  const hasData = summary && (summary.final_value || finalValue);

  // ============================================
  // خروجی Excel
  // ============================================
  const exportExcel = () => {
    const rows: any[][] = [
      ['گزارش ارزش‌گذاری روش M-09 (MMM)'],
      [''],
      ['دارایی:', assetName],
      ['کد:', assetCode || '-'],
      ['تاریخ:', new Date().toLocaleDateString('fa-IR')],
      [''],
      ['پارامترهای ورودی'],
      ['پارامتر', 'مقدار'],
      ['شاخص پایه', summary?.base_metric || ''],
      ['مقدار شاخص پایه', (summary?.base_metric_value || 0).toLocaleString()],
      ['ضریب بازار', `${summary?.market_multiple || 0}x`],
      ['صرف کنترل', `${((summary?.control_premium_percent || 0) * 100)}%`],
      ['تخفیف بازارپذیری', `${((summary?.marketability_discount_percent || 0) * 100)}%`],
      ['سهم دارایی نامشهود', `${((summary?.intangible_share_percent || 0) * 100)}%`],
      ['ضریب کیفیت', (summary?.quality_multiplier || 0).toFixed(2)],
      [''],
      ['نتایج محاسبه'],
      ['ارزش شرکت (EV)', (summary?.enterprise_value || 0).toLocaleString()],
      ['ارزش پس از صرف کنترل', (summary?.enterprise_value_after_premium || 0).toLocaleString()],
      ['ارزش پس از تخفیف بازارپذیری', (summary?.enterprise_value_after_discount || 0).toLocaleString()],
      ['ارزش دارایی نامشهود', (summary?.intangible_value_before_quality || 0).toLocaleString()],
      ['ارزش نهایی', (summary?.final_value || 0).toLocaleString()],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 30 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, ws, 'M09_MMM');
    XLSX.writeFile(wb, `${assetName}-M09-MMM-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // ============================================
  // رندر
  // ============================================
  if (!hasData && !calculating) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-bold text-dark-green mb-2 font-[family-name:var(--font-vazir)]">محاسبه ارزش دارایی (M-09 MMM)</h3>
        <p className="text-gray-500 max-w-md mx-auto font-[family-name:var(--font-vazir)]">
          برای محاسبه ارزش دارایی با روش ضریب بازار (MMM)، دکمه زیر را بزنید.
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

  const displayFinal = safeNumber(finalValue) || safeNumber(summary?.final_value) || 0;
  const displayConfidence = confidenceLevel || 0.82;
  const displayQcScore = qcScore || 82;

  return (
    <div className="space-y-6" dir="rtl">

      {/* توضیحات روش */}
      <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
        <p className="text-sm text-amber-700 font-[family-name:var(--font-vazir)]">
           روش ضریب بازار (MMM) 
          <span className="inline-block mr-2 px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full text-xs font-medium">
             روش بازار
          </span>
        </p>
      </div>

      {/* پارامترهای ورودی */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg border">
        <div className="text-center p-2 bg-white rounded-lg shadow-sm">
          <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">شاخص پایه</p>
          <p className="text-sm font-bold text-dark-green font-[family-name:var(--font-vazir)]">
            {summary?.base_metric || 'درآمد'}
          </p>
        </div>
        <div className="text-center p-2 bg-white rounded-lg shadow-sm">
          <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">ضریب بازار</p>
          <p className="text-sm font-bold text-dark-green font-[family-name:var(--font-vazir)]">
            {summary?.market_multiple || 0}x
          </p>
        </div>
        <div className="text-center p-2 bg-white rounded-lg shadow-sm">
          <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">صرف کنترل</p>
          <p className="text-sm font-bold text-green-600 font-[family-name:var(--font-vazir)]">
            {formatPercent((summary?.control_premium_percent || 0) * 100)}
          </p>
        </div>
        <div className="text-center p-2 bg-white rounded-lg shadow-sm">
          <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">تخفیف بازارپذیری</p>
          <p className="text-sm font-bold text-red-600 font-[family-name:var(--font-vazir)]">
            {formatPercent((summary?.marketability_discount_percent || 0) * 100)}
          </p>
        </div>
        <div className="text-center p-2 bg-white rounded-lg shadow-sm">
          <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">سهم دارایی نامشهود</p>
          <p className="text-sm font-bold text-dark-green font-[family-name:var(--font-vazir)]">
            {formatPercent((summary?.intangible_share_percent || 0) * 100)}
          </p>
        </div>
        <div className="text-center p-2 bg-white rounded-lg shadow-sm">
          <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">ضریب کیفیت</p>
          <p className="text-sm font-bold text-dark-green font-[family-name:var(--font-vazir)]">
            {summary?.quality_multiplier?.toFixed(2) || '۰.۰۰'}
          </p>
        </div>
        <div className="text-center p-2 bg-white rounded-lg shadow-sm">
          <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">ارزش شرکت (EV)</p>
          <p className="text-sm font-bold text-dark-green font-[family-name:var(--font-vazir)]">
            {formatRial(summary?.enterprise_value || 0)}
          </p>
        </div>
        <div className="text-center p-2 bg-white rounded-lg shadow-sm">
          <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">ارزش نهایی</p>
          <p className="text-sm font-bold text-dark-green font-[family-name:var(--font-vazir)]">
            {formatRial(displayFinal)}
          </p>
        </div>
      </div>

      {/* نمودار آبشار */}
      {summary && (
        <Card className="border-amber-200 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-dark-green font-[family-name:var(--font-vazir)]">📊 نمودار آبشار ارزش</h4>
            </div>
            
            <div style={{ width: '100%', height: 320 }} dir="ltr">
              <ResponsiveContainer>
                <ComposedChart
                  data={[
                    { 
                      step: 'ارزش شرکت', 
                      value: summary?.enterprise_value || 0,
                      color: '#015345'
                    },
                    { 
                      step: 'صرف کنترل', 
                      value: (summary?.enterprise_value_after_premium || 0) - (summary?.enterprise_value || 0),
                      color: '#22c55e'
                    },
                    { 
                      step: 'تخفیف بازارپذیری', 
                      value: (summary?.enterprise_value_after_premium || 0) - (summary?.enterprise_value_after_discount || 0),
                      color: '#ef4444'
                    },
                    { 
                      step: 'سهم دارایی', 
                      value: (summary?.intangible_value_before_quality || 0) - (summary?.enterprise_value_after_discount || 0),
                      color: '#8b5cf6'
                    },
                    { 
                      step: 'ضریب کیفیت', 
                      value: (summary?.final_value || 0) - (summary?.intangible_value_before_quality || 0),
                      color: '#f59e0b'
                    },
                    { 
                      step: 'ارزش نهایی', 
                      value: summary?.final_value || 0,
                      color: '#015345'
                    },
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="step" tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={(value) => formatMillions(value)} />
                  <Tooltip formatter={(value: any) => formatRial(value)} contentStyle={{ fontFamily: 'var(--font-vazir)' }} />
                  <Bar dataKey="value" fill="#015345" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="value" stroke="#D4A547" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* جدول محاسبه گام‌به‌گام */}
      {summary && (
        <Card className="border-amber-200">
          <CardContent className="p-4">
            <h4 className="text-sm font-bold text-dark-green mb-3 font-[family-name:var(--font-vazir)]">📊 محاسبه گام‌به‌گام</h4>
            <div className="overflow-x-auto font-[family-name:var(--font-vazir)]">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-amber-50">
                    <th className="border p-2 text-right">مرحله</th>
                    <th className="border p-2 text-right">شرح</th>
                    <th className="border p-2 text-right">مقدار</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="border p-2 text-center">۱</td>
                    <td className="border p-2">ضریب بازار × مقدار شاخص پایه</td>
                    <td className="border p-2 text-right font-bold text-green-600">{formatRial(summary?.enterprise_value || 0)}</td>
                  </tr>
                  <tr className="bg-gray-50/50">
                    <td className="border p-2 text-center">۲</td>
                    <td className="border p-2">+ صرف کنترل ({formatPercent((summary?.control_premium_percent || 0) * 100)})</td>
                    <td className="border p-2 text-right font-bold text-green-600">{formatRial(summary?.enterprise_value_after_premium || 0)}</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="border p-2 text-center">۳</td>
                    <td className="border p-2">- تخفیف بازارپذیری ({formatPercent((summary?.marketability_discount_percent || 0) * 100)})</td>
                    <td className="border p-2 text-right font-bold text-green-600">{formatRial(summary?.enterprise_value_after_discount || 0)}</td>
                  </tr>
                  <tr className="bg-gray-50/50">
                    <td className="border p-2 text-center">۴</td>
                    <td className="border p-2">× سهم دارایی نامشهود ({formatPercent((summary?.intangible_share_percent || 0) * 100)})</td>
                    <td className="border p-2 text-right font-bold text-green-600">{formatRial(summary?.intangible_value_before_quality || 0)}</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="border p-2 text-center">۵</td>
                    <td className="border p-2">× ضریب کیفیت ({summary?.quality_multiplier?.toFixed(2) || '۰.۰۰'})</td>
                    <td className="border p-2 text-right font-bold text-green-600">{formatRial(summary?.final_value || 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}


      {/* خلاصه نتایج */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 font-[family-name:var(--font-vazir)]">ارزش نهایی دارایی</p>
            <p className="text-2xl font-bold text-dark-green font-[family-name:var(--font-vazir)]">{formatRial(displayFinal)}</p>
            <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">پس از اعمال ضریب کیفیت</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 font-[family-name:var(--font-vazir)]">ارزش شرکت (EV)</p>
            <p className="text-2xl font-bold text-blue-600 font-[family-name:var(--font-vazir)]">{formatRial(summary?.enterprise_value || 0)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-teal-50 to-white border-teal-200">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 font-[family-name:var(--font-vazir)]">سطح اطمینان</p>
            <p className="text-2xl font-bold text-teal-700 font-[family-name:var(--font-vazir)]">{formatPercent(displayConfidence * 100)}</p>
            <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">امتیاز QC: {formatNumber(displayQcScore)}</p>
          </CardContent>
        </Card>
      </div>

      {/* دکمه خروجی Excel */}
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
