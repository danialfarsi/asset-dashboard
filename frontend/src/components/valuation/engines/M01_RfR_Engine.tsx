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
      <div dir="rtl" className="font-[family-name:var(--font-vazir)]">
        <div className="relative overflow-hidden rounded-[32px] border border-slate-200/80 bg-white px-6 py-14 text-center shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:px-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-dark-green/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-blue-100/70 blur-3xl" />
          <div className="relative mx-auto max-w-xl">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[26px] border border-dark-green/10 bg-dark-green/[0.06] text-dark-green shadow-sm">
              <FileText className="h-8 w-8" />
            </div>
            <span className="inline-flex rounded-full bg-dark-green/10 px-3 py-1 text-[11px] font-black text-dark-green">M-01 • Relief-from-Royalty</span>
            <h3 className="mt-4 text-2xl font-black tracking-tight text-slate-900">محاسبه ارزش دارایی</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-slate-500">
              برای محاسبه ارزش دارایی بر مبنای صرفه‌جویی ناشی از عدم پرداخت حق‌الامتیاز، فرآیند ارزش‌گذاری را آغاز کنید.
            </p>
            <Button
              className="mt-7 h-12 rounded-2xl bg-dark-green px-8 text-sm font-bold text-white shadow-lg shadow-emerald-950/10 transition-all hover:-translate-y-0.5 hover:bg-dark-green/90 hover:shadow-xl"
              onClick={onCalculate}
              disabled={calculating}
            >
              {calculating ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  در حال محاسبه...
                </>
              ) : (
                'شروع ارزش‌گذاری'
              )}
            </Button>
            {error && (
              <div className="mx-auto mt-5 flex max-w-md items-center justify-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-600">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const displayConfidence = confidenceLevel || 0.82;
  const displayQcScore = qcScore || 82;

  return (
    <div className="space-y-6 font-[family-name:var(--font-vazir)]" dir="rtl">
      {/* Executive header */}
      <section className="relative overflow-hidden rounded-[30px] border border-slate-200/80 bg-white p-5 shadow-[0_14px_45px_rgba(15,23,42,0.055)] sm:p-7">
        <div className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full bg-dark-green/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-blue-100/50 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-dark-green text-white shadow-lg shadow-emerald-950/10">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-dark-green/10 px-2.5 py-1 text-[10px] font-black text-dark-green">M-01</span>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500">Relief-from-Royalty</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 sm:text-2xl">نتایج ارزش‌گذاری روش حق‌الامتیاز</h2>
              <p className="mt-1 max-w-2xl text-xs leading-6 text-slate-500 sm:text-sm">
                ارزش دارایی بر اساس صرفه‌جویی ناشی از عدم پرداخت حق‌الامتیاز و تنزیل جریان‌های مالی محاسبه شده است.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={exportExcel}
            className="h-11 self-start rounded-xl border-dark-green/20 bg-dark-green/[0.03] px-4 font-bold text-dark-green hover:bg-dark-green/10 lg:self-auto"
          >
            <Download className="ml-2 h-4 w-4" />
            خروجی Excel
          </Button>
        </div>
      </section>

      {/* Main result + compact KPIs */}
      <div>
        <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.045)]">
          <div className="mb-4">
            <h3 className="text-sm font-black text-slate-800">پارامترهای کلیدی مدل</h3>
            <p className="mt-1 text-[10px] text-slate-400">خلاصه ورودی‌های مؤثر در محاسبه</p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              ['نرخ حق‌الامتیاز', formatPercent(summary?.royalty_rate || 0)],
              ['تخصیص درآمد', formatPercent(summary?.revenue_attribution || 0)],
              ['نرخ مؤثر', formatPercent(summary?.effective_rate || 0)],
              ['نرخ تنزیل', formatPercent(summary?.discount_rate || 0)],
              ['نرخ مالیات', formatPercent(summary?.tax_rate || 0)],
              ['ضریب کیفیت', toPersianDigit((summary?.quality_multiplier || 0).toFixed(2))],
              ['افق پیش‌بینی', `${toPersianDigit(summary?.forecast_horizon || 0)} سال`],
              ['درآمد پایه', formatRial(summary?.current_revenue || 0)],
            ].map(([label, value], index) => (
              <div key={index} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 transition-colors hover:border-dark-green/10 hover:bg-dark-green/[0.025]">
                <p className="text-[9px] font-bold text-slate-400">{label}</p>
                <p className={`mt-1 text-xs font-black ${index === 2 ? 'text-blue-600' : 'text-dark-green'}`}>{value}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Chart */}
      {yearlyData.length > 0 && (
        <Card className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.045)]">
          <CardContent className="p-0">
            <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <h4 className="text-sm font-black text-slate-800">جریان‌های نقدی و ارزش فعلی</h4>
                <p className="mt-1 text-[10px] text-slate-400">مقایسه حق‌الامتیاز، جریان پس از مالیات و PV در افق پیش‌بینی</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-500">
                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-blue-700" />حق‌الامتیاز ناخالص</span>
                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500" />پس از مالیات</span>
                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-rose-400" />ارزش فعلی</span>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <div style={{ width: '100%', height: 340 }} dir="ltr">
                <ResponsiveContainer>
                  <ComposedChart data={yearlyData} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="year"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'var(--font-vazir)' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'var(--font-vazir)' }}
                      tickFormatter={(value) => formatMillions(value)}
                    />
                    <Tooltip
                      formatter={(value: any) => formatRial(value)}
                      contentStyle={{
                        fontFamily: 'var(--font-vazir)',
                        borderRadius: 16,
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 12px 30px rgba(15,23,42,.08)'
                      }}
                    />
                    <Legend wrapperStyle={{ fontFamily: 'var(--font-vazir)', fontSize: 11 }} />
                    <Bar dataKey="gross_royalty" name="حق‌الامتیاز ناخالص" fill="#1d4ed8" radius={[5, 5, 0, 0]} />
                    <Bar dataKey="after_tax" name="پس از مالیات" fill="#10b981" radius={[5, 5, 0, 0]} />
                    <Line type="monotone" dataKey="pv" name="ارزش فعلی (PV)" stroke="#fb7185" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Yearly table */}
      {yearlyData.length > 0 && (
        <Card className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.045)]">
          <CardContent className="p-0">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
              <h4 className="text-sm font-black text-slate-800">جدول محاسبات سالانه</h4>
              <p className="mt-1 text-[10px] text-slate-400">جزئیات محاسبات مالی برای هر سال از دوره پیش‌بینی</p>
            </div>
            <div className="overflow-x-auto p-4 sm:p-5">
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full min-w-[760px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-500">
                      <th className="p-3 text-center">سال</th>
                      <th className="p-3 text-right">درآمد</th>
                      <th className="p-3 text-right">حق‌الامتیاز ناخالص</th>
                      <th className="p-3 text-right">پس از مالیات</th>
                      <th className="p-3 text-right">ارزش فعلی (PV)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {yearlyData.map((row: any, index: number) => (
                      <tr key={index} className="bg-white transition-colors hover:bg-slate-50/70">
                        <td className="p-3 text-center font-black text-slate-600">{toPersianDigit(row.year)}</td>
                        <td className="p-3 text-right text-slate-600">{formatRial(row.revenue)}</td>
                        <td className="p-3 text-right text-slate-600">{formatRial(row.gross_royalty)}</td>
                        <td className="p-3 text-right font-bold text-emerald-600">{formatRial(row.after_tax)}</td>
                        <td className="p-3 text-right font-black text-blue-600">{formatRial(row.pv)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Final valuation — intentionally placed at the end for stronger visual hierarchy */}
      <section className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#073f35] via-dark-green to-[#0b6b58] p-6 text-white shadow-[0_18px_50px_rgba(5,75,63,0.18)] sm:p-7">
        <div className="pointer-events-none absolute -left-16 -top-20 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-8 h-52 w-52 rounded-full bg-emerald-300/10 blur-3xl" />

        <div className="relative">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
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
        </div>
      </section>
    </div>
  );
}