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
  tokenValue?: number;
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
  tokenValue: propTokenValue,
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

  // محاسبه ارزش بر حسب تک توکن (هر تک توکن = ۱۰۰۰ هزار ریال = ۱,۰۰۰,۰۰۰ ریال)
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
  let displayToken = 0;
  if (propTokenValue && propTokenValue > 0) {
    displayToken = propTokenValue;
  } else {
    const displayFinal = safeNumber(finalValue) || safeNumber(summary?.final_value) || 0;
    displayToken = calculateTokenValue(displayFinal);
  }

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
      ['ارزش بر حسب تک توکن', displayToken],
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
    <div className="space-y-6 font-[family-name:var(--font-vazir)]" dir="rtl">

      {/* Executive Header */}
      <section className="relative overflow-hidden rounded-[30px] border border-slate-200/80 bg-white p-5 shadow-[0_14px_45px_rgba(15,23,42,0.055)] sm:p-7">
        <div className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full bg-amber-100/60 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-emerald-100/45 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-dark-green text-white shadow-lg shadow-emerald-950/10">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black text-amber-700">M-09</span>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500">Market Multiple Method</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">روش بازار</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 sm:text-2xl">نتایج ارزش‌گذاری روش MMM</h2>
              <p className="mt-1 max-w-2xl text-xs leading-6 text-slate-500 sm:text-sm">
                ارزش دارایی با اعمال ضریب بازار بر شاخص پایه و سپس تعدیلات صرف کنترل، بازارپذیری، سهم دارایی نامشهود و ضریب کیفیت محاسبه شده است.
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

      {/* Key Parameters */}
      <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.045)] sm:p-6">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-800">پارامترهای کلیدی مدل</h3>
            <p className="mt-1 text-[10px] text-slate-400">ورودی‌ها و تعدیلات اصلی مورد استفاده در مدل ضریب بازار</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-500">M-09 Engine</span>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="text-[9px] font-bold text-slate-400">شاخص پایه</p>
            <p className="mt-1.5 text-sm font-black text-dark-green">{summary?.base_metric || 'درآمد'}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="text-[9px] font-bold text-slate-400">ضریب بازار</p>
            <p className="mt-1.5 text-sm font-black text-dark-green">{summary?.market_multiple || 0}x</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
            <p className="text-[9px] font-bold text-slate-400">صرف کنترل</p>
            <p className="mt-1.5 text-sm font-black text-emerald-700">{formatPercent((summary?.control_premium_percent || 0) * 100)}</p>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
            <p className="text-[9px] font-bold text-slate-400">تخفیف بازارپذیری</p>
            <p className="mt-1.5 text-sm font-black text-rose-600">{formatPercent((summary?.marketability_discount_percent || 0) * 100)}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="text-[9px] font-bold text-slate-400">سهم دارایی نامشهود</p>
            <p className="mt-1.5 text-sm font-black text-dark-green">{formatPercent((summary?.intangible_share_percent || 0) * 100)}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="text-[9px] font-bold text-slate-400">ضریب کیفیت</p>
            <p className="mt-1.5 text-sm font-black text-dark-green">{summary?.quality_multiplier?.toFixed(2) || '۰.۰۰'}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="text-[9px] font-bold text-slate-400">ارزش شرکت (EV)</p>
            <p className="mt-1.5 text-sm font-black text-dark-green">{formatRial(summary?.enterprise_value || 0)}</p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
            <p className="text-[9px] font-bold text-slate-400">مقدار شاخص پایه</p>
            <p className="mt-1.5 text-sm font-black text-amber-700">{formatRial(summary?.base_metric_value || 0)}</p>
          </div>
        </div>
      </section>

      {/* Waterfall */}
      {summary && (
        <Card className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.045)]">
          <CardContent className="p-0">
            <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <h4 className="text-sm font-black text-slate-800">مسیر تعدیل ارزش</h4>
                <p className="mt-1 text-[10px] text-slate-400">نمایش اثر مرحله‌ای ضریب بازار، صرف کنترل، بازارپذیری، سهم دارایی و کیفیت</p>
              </div>
              <div className="flex flex-wrap gap-3 text-[10px] font-bold text-slate-500">
                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500" />افزایش</span>
                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-rose-500" />کاهش</span>
                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-amber-500" />تعدیل</span>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div style={{ width: '100%', height: 350 }} dir="ltr">
                <ResponsiveContainer>
                  <ComposedChart
                    data={[
                      { step: 'ارزش شرکت', value: summary?.enterprise_value || 0, color: '#015345' },
                      { step: 'صرف کنترل', value: (summary?.enterprise_value_after_premium || 0) - (summary?.enterprise_value || 0), color: '#22c55e' },
                      { step: 'تخفیف بازارپذیری', value: (summary?.enterprise_value_after_premium || 0) - (summary?.enterprise_value_after_discount || 0), color: '#ef4444' },
                      { step: 'سهم دارایی', value: (summary?.intangible_value_before_quality || 0) - (summary?.enterprise_value_after_discount || 0), color: '#8b5cf6' },
                      { step: 'ضریب کیفیت', value: (summary?.final_value || 0) - (summary?.intangible_value_before_quality || 0), color: '#f59e0b' },
                      { step: 'ارزش نهایی', value: summary?.final_value || 0, color: '#015345' },
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="step" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'var(--font-vazir)' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'var(--font-vazir)' }} tickFormatter={(value) => formatMillions(value)} />
                    <Tooltip
                      formatter={(value: any) => formatRial(value)}
                      contentStyle={{ fontFamily: 'var(--font-vazir)', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 12px 30px rgba(15,23,42,.08)' }}
                    />
                    <Bar dataKey="value" fill="#015345" radius={[6, 6, 0, 0]} barSize={46} />
                    <Line type="monotone" dataKey="value" stroke="#D4A547" strokeWidth={2.5} dot={{ r: 4, fill: '#D4A547' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step-by-step calculation */}
      {summary && (
        <Card className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.045)]">
          <CardContent className="p-0">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
              <h4 className="text-sm font-black text-slate-800">محاسبه گام‌به‌گام</h4>
              <p className="mt-1 text-[10px] text-slate-400">ردیابی تبدیل شاخص پایه به ارزش نهایی دارایی</p>
            </div>

            <div className="overflow-x-auto p-4 sm:p-5">
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full min-w-[720px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-500">
                      <th className="p-3 text-center">مرحله</th>
                      <th className="p-3 text-right">شرح</th>
                      <th className="p-3 text-right">مقدار</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="bg-white hover:bg-slate-50/70">
                      <td className="p-3 text-center font-black text-slate-500">۱</td>
                      <td className="p-3 font-bold text-slate-700">ضریب بازار × مقدار شاخص پایه</td>
                      <td className="p-3 text-right font-black text-dark-green">{formatRial(summary?.enterprise_value || 0)}</td>
                    </tr>
                    <tr className="bg-white hover:bg-slate-50/70">
                      <td className="p-3 text-center font-black text-slate-500">۲</td>
                      <td className="p-3 font-bold text-slate-700">+ صرف کنترل ({formatPercent((summary?.control_premium_percent || 0) * 100)})</td>
                      <td className="p-3 text-right font-black text-emerald-700">{formatRial(summary?.enterprise_value_after_premium || 0)}</td>
                    </tr>
                    <tr className="bg-white hover:bg-slate-50/70">
                      <td className="p-3 text-center font-black text-slate-500">۳</td>
                      <td className="p-3 font-bold text-slate-700">- تخفیف بازارپذیری ({formatPercent((summary?.marketability_discount_percent || 0) * 100)})</td>
                      <td className="p-3 text-right font-black text-rose-600">{formatRial(summary?.enterprise_value_after_discount || 0)}</td>
                    </tr>
                    <tr className="bg-white hover:bg-slate-50/70">
                      <td className="p-3 text-center font-black text-slate-500">۴</td>
                      <td className="p-3 font-bold text-slate-700">× سهم دارایی نامشهود ({formatPercent((summary?.intangible_share_percent || 0) * 100)})</td>
                      <td className="p-3 text-right font-black text-violet-700">{formatRial(summary?.intangible_value_before_quality || 0)}</td>
                    </tr>
                    <tr className="bg-amber-50/50">
                      <td className="p-3 text-center font-black text-amber-700">۵</td>
                      <td className="p-3 font-black text-slate-800">× ضریب کیفیت ({summary?.quality_multiplier?.toFixed(2) || '۰.۰۰'})</td>
                      <td className="p-3 text-right font-black text-dark-green">{formatRial(summary?.final_value || 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Final valuation at bottom */}
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
    </div>
  );
}
