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
  Scatter,
  ZAxis,
  ReferenceLine,
} from 'recharts';
import { useState } from 'react';
import * as XLSX from 'xlsx';

interface M08_CTM_EngineProps {
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

export function M08_CTM_Engine({ 
  data, 
  finalValue = 0,
  confidenceLevel = 0.82,
  qcScore = 82,
  assetName = 'دارایی',
  assetCode = '',
  onCalculate,
  calculating = false,
  error = null
}: M08_CTM_EngineProps) {
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
  const deals = data?.comparable_deals || [];
  const chartData = data?.chart_data || [];
  const hasData = summary && (summary.final_value || finalValue);

  // ============================================
  // خروجی Excel
  // ============================================
  const exportExcel = () => {
    const rows: any[][] = [
      ['گزارش ارزش‌گذاری روش M-08 (CTM)'],
      [''],
      ['دارایی:', assetName],
      ['کد:', assetCode || '-'],
      ['تاریخ:', new Date().toLocaleDateString('fa-IR')],
      [''],
      ['معاملات مشابه - جدول تعدیلات'],
      ['شناسه', 'قیمت (IRR)', 'تعدیل اندازه', 'تعدیل زمان', 'تعدیل جغرافیایی', 'سایر تعدیلات', 'مجموع تعدیل', 'قیمت تعدیل‌شده (IRR)'],
    ];
    deals.forEach((deal: any) => {
      rows.push([
        deal.deal_id || '-',
        deal.transaction_price || 0,
        `${((deal.size_adjustment || 0) * 100).toFixed(1)}%`,
        `${((deal.time_adjustment || 0) * 100).toFixed(1)}%`,
        `${((deal.geographic_adjustment || 0) * 100).toFixed(1)}%`,
        `${((deal.other_adjustments || 0) * 100).toFixed(1)}%`,
        `${((deal.total_adjustment || 0) * 100).toFixed(1)}%`,
        deal.adjusted_price || 0,
      ]);
    });
    rows.push(['']);
    rows.push(['خلاصه نتایج']);
    rows.push(['میانگین وزنی قیمت تعدیل‌شده', (summary?.weighted_average_price || 0).toLocaleString()]);
    rows.push(['میانه قیمت تعدیل‌شده', (summary?.median_price || 0).toLocaleString()]);
    rows.push(['کمترین قیمت', (summary?.min_price || 0).toLocaleString()]);
    rows.push(['بیشترین قیمت', (summary?.max_price || 0).toLocaleString()]);
    rows.push(['دامنه تغییرات', (summary?.price_range || 0).toLocaleString()]);
    rows.push(['تعداد معاملات', summary?.deal_count || 0]);
    rows.push(['میانگین تعدیلات', `${((summary?.avg_adjustment_percent || 0) * 100).toFixed(1)}%`]);
    rows.push(['ارزش نهایی', (summary?.final_value || 0).toLocaleString()]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 18 }, { wch: 22 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, ws, 'M08_CTM');
    XLSX.writeFile(wb, `${assetName}-M08-CTM-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // ============================================
  // رندر
  // ============================================
  if (!hasData && !calculating) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-bold text-dark-green mb-2 font-[family-name:var(--font-vazir)]">محاسبه ارزش دارایی (M-08 CTM)</h3>
        <p className="text-gray-500 max-w-md mx-auto font-[family-name:var(--font-vazir)]">
          برای محاسبه ارزش دارایی با روش معاملات مشابه (CTM)، دکمه زیر را بزنید.
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
      <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
        <p className="text-sm text-indigo-700 font-[family-name:var(--font-vazir)]">
          🔹 روش معاملات مشابه (CTM) - ارزش دارایی را بر اساس معاملات اخیر دارایی‌های مشابه محاسبه می‌کند.
          <span className="inline-block mr-2 px-2 py-0.5 bg-indigo-200 text-indigo-800 rounded-full text-xs font-medium">
            ⭐ روش بازار
          </span>
        </p>
      </div>

      {/* پارامترهای ورودی - اعداد فارسی */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg border">
        <div className="text-center p-2 bg-white rounded-lg shadow-sm">
          <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">تعداد معاملات</p>
          <p className="text-sm font-bold text-indigo-600 font-[family-name:var(--font-vazir)]">
            {toPersianDigit(summary?.deal_count || 0)}
          </p>
        </div>
        <div className="text-center p-2 bg-white rounded-lg shadow-sm">
          <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">میانگین وزنی</p>
          <p className="text-sm font-bold text-dark-green font-[family-name:var(--font-vazir)]">
            {formatRial(summary?.weighted_average_price || 0)}
          </p>
        </div>
        <div className="text-center p-2 bg-white rounded-lg shadow-sm">
          <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">میانه قیمت</p>
          <p className="text-sm font-bold text-blue-600 font-[family-name:var(--font-vazir)]">
            {formatRial(summary?.median_price || 0)}
          </p>
        </div>
        <div className="text-center p-2 bg-white rounded-lg shadow-sm">
          <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">میانگین تعدیلات</p>
          <p className="text-sm font-bold text-amber-600 font-[family-name:var(--font-vazir)]">
            {formatPercent((summary?.avg_adjustment_percent || 0) * 100)}
          </p>
        </div>
      </div>

      {/* ============================================
          جدول معاملات کامل با همه ستون‌ها
      ============================================ */}
      {deals.length > 0 && (
        <Card className="border-indigo-200 shadow-md">
          <CardContent className="p-4">
            <h4 className="text-sm font-bold text-dark-green mb-3 font-[family-name:var(--font-vazir)]">
              📊 جدول معاملات مشابه - تعدیلات
            </h4>
            <div className="overflow-x-auto font-[family-name:var(--font-vazir)]">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-indigo-50">
                    <th className="border p-2 text-center">شناسه</th>
                    <th className="border p-2 text-right">قیمت (IRR)</th>
                    <th className="border p-2 text-center">تعدیل اندازه</th>
                    <th className="border p-2 text-center">تعدیل زمان</th>
                    <th className="border p-2 text-center">تعدیل جغرافیایی</th>
                    <th className="border p-2 text-center">سایر تعدیلات</th>
                    <th className="border p-2 text-center">مجموع تعدیل</th>
                    <th className="border p-2 text-right">قیمت تعدیل‌شده (IRR)</th>
                  </tr>
                </thead>
                <tbody>
                  {deals.map((deal: any, index: number) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="border p-2 text-center font-[family-name:var(--font-vazir)] font-medium">
                        {deal.deal_id || '-'}
                      </td>
                      <td className="border p-2 text-right font-[family-name:var(--font-vazir)]">
                        {formatRial(deal.transaction_price)}
                      </td>
                      <td className="border p-2 text-center font-[family-name:var(--font-vazir)]">
                        <span className={deal.size_adjustment >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {deal.size_adjustment >= 0 ? '+' : ''}{toPersianDigit(((deal.size_adjustment || 0) * 100).toFixed(1))}%
                        </span>
                      </td>
                      <td className="border p-2 text-center font-[family-name:var(--font-vazir)]">
                        <span className={deal.time_adjustment >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {deal.time_adjustment >= 0 ? '+' : ''}{toPersianDigit(((deal.time_adjustment || 0) * 100).toFixed(1))}%
                        </span>
                      </td>
                      <td className="border p-2 text-center font-[family-name:var(--font-vazir)]">
                        <span className={deal.geographic_adjustment >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {deal.geographic_adjustment >= 0 ? '+' : ''}{toPersianDigit(((deal.geographic_adjustment || 0) * 100).toFixed(1))}%
                        </span>
                      </td>
                      <td className="border p-2 text-center font-[family-name:var(--font-vazir)]">
                        <span className={deal.other_adjustments >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {deal.other_adjustments >= 0 ? '+' : ''}{toPersianDigit(((deal.other_adjustments || 0) * 100).toFixed(1))}%
                        </span>
                      </td>
                      <td className="border p-2 text-center font-bold text-amber-600 font-[family-name:var(--font-vazir)]">
                        {toPersianDigit(((deal.total_adjustment || 0) * 100).toFixed(1))}%
                      </td>
                      <td className="border p-2 text-right font-bold text-green-600 font-[family-name:var(--font-vazir)]">
                        {formatRial(deal.adjusted_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-indigo-100 font-bold">
                    <td className="border p-2 text-center">میانه</td>
                    <td className="border p-2 text-right">{formatRial(summary?.median_price || 0)}</td>
                    <td className="border p-2 text-center" colSpan={6}>
                      ارزش نهایی: {formatRial(displayFinal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="mt-2 text-xs text-gray-400 font-[family-name:var(--font-vazir)]">
              * مجموع تعدیلات هر معامله نباید از ±۴۰٪ تجاوز کند
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============================================
          نمودار مقایسه معاملات (نقطه‌ای + خطی)
      ============================================ */}
      {deals.length > 0 && (
        <Card className="border-indigo-200 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-dark-green font-[family-name:var(--font-vazir)]">
                📈 مقایسه قیمت معاملات
              </h4>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-gray-600 font-[family-name:var(--font-vazir)]">قیمت اصلی</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-gray-600 font-[family-name:var(--font-vazir)]">قیمت تعدیل‌شده</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-gray-600 font-[family-name:var(--font-vazir)]">میانگین وزنی</span>
                </div>
              </div>
            </div>

            <div style={{ width: '100%', height: 340 }} dir="ltr">
              <ResponsiveContainer>
                <ComposedChart
                  data={deals.map((d: any, index: number) => ({
                    name: d.deal_id || `Deal ${String.fromCharCode(65 + index)}`,
                    price: d.transaction_price,
                    adjusted: d.adjusted_price,
                    weight: (d.deal_weight_percent || 0) * 100,
                    index: index,
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11, fill: '#6b7280', fontFamily: 'var(--font-vazir)' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#6b7280', fontFamily: 'var(--font-vazir)' }}
                    tickFormatter={(value) => formatMillions(value)}
                  />
                  <Tooltip 
                    formatter={(value: any, name: string) => {
                      if (name === 'وزن') return `${toPersianDigit(value)}%`;
                      return formatRial(value);
                    }}
                    contentStyle={{ fontFamily: 'var(--font-vazir)' }}
                  />
                  <Legend wrapperStyle={{ fontFamily: 'var(--font-vazir)' }} />

                  {/* خطوط */}
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    name="قیمت اصلی" 
                    stroke="#3b82f6" 
                    strokeWidth={2.5}
                    dot={{ r: 6, fill: '#3b82f6' }}
                    activeDot={{ r: 8 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="adjusted" 
                    name="قیمت تعدیل‌شده" 
                    stroke="#22c55e" 
                    strokeWidth={2.5}
                    dot={{ r: 6, fill: '#22c55e' }}
                    activeDot={{ r: 8 }}
                  />

                  {/* نقاط */}
                  <Scatter 
                    name="نقاط" 
                    data={deals.map((d: any, index: number) => ({
                      x: index + 1,
                      y: d.adjusted_price,
                      name: d.deal_id || `Deal ${String.fromCharCode(65 + index)}`,
                    }))}
                    fill="#ef4444"
                    shape="circle"
                  >
                    <ZAxis range={[100]} />
                  </Scatter>

                  {/* خط میانگین وزنی */}
                  <ReferenceLine 
                    y={summary?.weighted_average_price || 0} 
                    stroke="#ef4444" 
                    strokeDasharray="5 5"
                    label={{ 
                      value: `میانگین وزنی: ${formatRial(summary?.weighted_average_price || 0)}`,
                      position: 'right',
                      fill: '#ef4444',
                      fontSize: 10,
                      fontFamily: 'var(--font-vazir)',
                    }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* آمار پایین نمودار */}
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-blue-50 rounded">
                <span className="text-gray-500">کمترین قیمت</span>
                <p className="font-bold text-blue-600">{formatRial(summary?.min_price || 0)}</p>
              </div>
              <div className="p-2 bg-green-50 rounded">
                <span className="text-gray-500">بیشترین قیمت</span>
                <p className="font-bold text-green-600">{formatRial(summary?.max_price || 0)}</p>
              </div>
              <div className="p-2 bg-red-50 rounded">
                <span className="text-gray-500">دامنه تغییرات</span>
                <p className="font-bold text-red-600">{formatRial(summary?.price_range || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* خلاصه نتایج */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-200">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 font-[family-name:var(--font-vazir)]">ارزش نهایی دارایی</p>
            <p className="text-2xl font-bold text-dark-green font-[family-name:var(--font-vazir)]">{formatRial(displayFinal)}</p>
            <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">پس از اعمال ضریب کیفیت</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 font-[family-name:var(--font-vazir)]">میانگین وزنی قیمت</p>
            <p className="text-2xl font-bold text-blue-600 font-[family-name:var(--font-vazir)]">
              {formatRial(summary?.weighted_average_price || 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-teal-50 to-white border-teal-200">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 font-[family-name:var(--font-vazir)]">سطح اطمینان</p>
            <p className="text-2xl font-bold text-teal-700 font-[family-name:var(--font-vazir)]">
              {formatPercent(displayConfidence * 100)}
            </p>
            <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">امتیاز QC: {formatNumber(displayQcScore)}</p>
          </CardContent>
        </Card>
      </div>

      {/* فرمول محاسبه */}
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="p-4">
          <h4 className="text-sm font-bold text-dark-green mb-2 font-[family-name:var(--font-vazir)]">🧮 فرمول محاسبه</h4>
          <div className="bg-white p-4 rounded border border-gray-200 text-sm text-center font-[family-name:var(--font-vazir)]" dir="rtl">
            <p className="text-dark-green font-bold">
              قیمت تعدیل‌شده = قیمت معامله × (۱ + مجموع تعدیلات)
            </p>
            <p className="text-dark-green font-bold mt-1">
              میانگین وزنی = Σ(قیمت تعدیل‌شده × وزن)
            </p>
            <p className="text-dark-green font-bold mt-1">
              ارزش نهایی = میانگین وزنی × ضریب کیفیت
            </p>
            <p className="text-gray-400 text-xs mt-2">
              CTM-1.9 | روش بازار
            </p>
          </div>
        </CardContent>
      </Card>

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
