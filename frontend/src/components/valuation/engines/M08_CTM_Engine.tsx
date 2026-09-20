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
  tokenValue?: number;
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
  tokenValue: propTokenValue,
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
  const deals = data?.comparable_deals || [];
  const chartData = data?.chart_data || [];
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
    rows.push(['ارزش بر حسب تک توکن', displayToken]);

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
    <div className="space-y-6 font-[family-name:var(--font-vazir)]" dir="rtl">
      {/* Executive Header */}
      <section className="relative overflow-hidden rounded-[30px] border border-slate-200/80 bg-white p-5 shadow-[0_14px_45px_rgba(15,23,42,0.055)] sm:p-7">
        <div className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full bg-indigo-100/60 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-emerald-100/45 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-dark-green text-white shadow-lg shadow-emerald-950/10">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-black text-indigo-700">M-08</span>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500">Comparable Transactions Method</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">روش بازار</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 sm:text-2xl">نتایج ارزش‌گذاری روش CTM</h2>
              <p className="mt-1 max-w-2xl text-xs leading-6 text-slate-500 sm:text-sm">
                ارزش دارایی با مقایسه معاملات مشابه، اعمال تعدیلات اندازه، زمان، جغرافیا و سایر عوامل و استخراج قیمت تعدیل‌شده محاسبه شده است.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={exportExcel}
            className="h-11 self-start rounded-xl border-dark-green/20 bg-dark-green/[0.03] px-4 font-bold text-dark-green hover:bg-dark-green/10 lg:self-auto">
            <Download className="ml-2 h-4 w-4" /> خروجی Excel
          </Button>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.045)] sm:p-6">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-800">شاخص‌های کلیدی بازار</h3>
            <p className="mt-1 text-[10px] text-slate-400">خلاصه آماری معاملات و تعدیلات استفاده‌شده در مدل</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-500">M-08 Engine</span>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ['تعداد معاملات', toPersianDigit(summary?.deal_count || 0), 'text-indigo-700'],
            ['میانگین وزنی', formatRial(summary?.weighted_average_price || 0), 'text-dark-green'],
            ['میانه قیمت', formatRial(summary?.median_price || 0), 'text-blue-600'],
            ['میانگین تعدیلات', formatPercent((summary?.avg_adjustment_percent || 0) * 100), 'text-amber-600'],
          ].map(([label, value, tone], i) => (
            <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md">
              <p className="text-[9px] font-bold text-slate-400">{label}</p>
              <p className={`mt-1.5 text-sm font-black ${tone}`}>{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparable Deals Table */}
      {deals.length > 0 && (
        <Card className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.045)]">
          <CardContent className="p-0">
            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
              <h4 className="text-sm font-black text-slate-800">جدول معاملات مشابه و تعدیلات</h4>
              <p className="mt-1 text-[10px] text-slate-400">مقایسه قیمت اولیه، تعدیلات و قیمت نهایی تعدیل‌شده هر معامله</p>
            </div>
            <div className="overflow-x-auto p-4 sm:p-5">
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full min-w-[1050px] border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold text-slate-500">
                      <th className="p-3 text-center">شناسه</th>
                      <th className="p-3 text-right">قیمت (IRR)</th>
                      <th className="p-3 text-center">تعدیل اندازه</th>
                      <th className="p-3 text-center">تعدیل زمان</th>
                      <th className="p-3 text-center">تعدیل جغرافیایی</th>
                      <th className="p-3 text-center">سایر تعدیلات</th>
                      <th className="p-3 text-center">مجموع تعدیل</th>
                      <th className="p-3 text-right">قیمت تعدیل‌شده</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {deals.map((deal: any, index: number) => (
                      <tr key={index} className="bg-white transition-colors hover:bg-slate-50/70">
                        <td className="p-3 text-center font-black text-slate-700">{deal.deal_id || '-'}</td>
                        <td className="p-3 text-right text-slate-600">{formatRial(deal.transaction_price)}</td>
                        {[deal.size_adjustment, deal.time_adjustment, deal.geographic_adjustment, deal.other_adjustments].map((adj: any, j: number) => (
                          <td key={j} className={`p-3 text-center font-bold ${(adj || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {(adj || 0) >= 0 ? '+' : ''}{toPersianDigit(((adj || 0) * 100).toFixed(1))}%
                          </td>
                        ))}
                        <td className="p-3 text-center font-black text-amber-600">
                          {toPersianDigit(((deal.total_adjustment || 0) * 100).toFixed(1))}%
                        </td>
                        <td className="p-3 text-right font-black text-emerald-700">{formatRial(deal.adjusted_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-indigo-50/70">
                      <td className="p-3 text-center font-black text-indigo-700">میانه</td>
                      <td className="p-3 text-right font-black text-indigo-700">{formatRial(summary?.median_price || 0)}</td>
                      <td className="p-3 text-center font-bold text-slate-600" colSpan={6}>ارزش نهایی: {formatRial(displayFinal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <p className="mt-3 text-[10px] text-slate-400">* مجموع تعدیلات هر معامله نباید از ±۴۰٪ تجاوز کند.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comparison Chart */}
      {deals.length > 0 && (
        <Card className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.045)]">
          <CardContent className="p-0">
            <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <h4 className="text-sm font-black text-slate-800">مقایسه قیمت معاملات</h4>
                <p className="mt-1 text-[10px] text-slate-400">قیمت اولیه و تعدیل‌شده معاملات در کنار میانگین وزنی بازار</p>
              </div>
              <div className="flex flex-wrap gap-4 text-[10px] font-bold text-slate-500">
                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-blue-500" />قیمت اصلی</span>
                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-green-500" />قیمت تعدیل‌شده</span>
                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-red-500" />میانگین وزنی</span>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <div style={{ width: '100%', height: 350 }} dir="ltr">
                <ResponsiveContainer>
                  <ComposedChart
                    data={deals.map((d: any, index: number) => ({
                      name: d.deal_id || `Deal ${String.fromCharCode(65 + index)}`,
                      price: d.transaction_price,
                      adjusted: d.adjusted_price,
                      weight: (d.deal_weight_percent || 0) * 100,
                      index,
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'var(--font-vazir)' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'var(--font-vazir)' }} tickFormatter={(value) => formatMillions(value)} />
                    <Tooltip formatter={(value: any) => formatRial(value)} contentStyle={{ fontFamily: 'var(--font-vazir)', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 12px 30px rgba(15,23,42,.08)' }} />
                    <Legend wrapperStyle={{ fontFamily: 'var(--font-vazir)', fontSize: 11 }} />
                    <Line type="monotone" dataKey="price" name="قیمت اصلی" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 5, fill: '#3b82f6' }} activeDot={{ r: 7 }} />
                    <Line type="monotone" dataKey="adjusted" name="قیمت تعدیل‌شده" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 5, fill: '#22c55e' }} activeDot={{ r: 7 }} />
                    <Scatter name="نقاط" data={deals.map((d: any, index: number) => ({ x: index + 1, y: d.adjusted_price, name: d.deal_id || `Deal ${String.fromCharCode(65 + index)}` }))} fill="#ef4444" shape="circle" />
                    <ReferenceLine y={summary?.weighted_average_price || 0} stroke="#ef4444" strokeDasharray="5 5"
                      label={{ value: `میانگین وزنی: ${formatRial(summary?.weighted_average_price || 0)}`, position: 'right', fill: '#ef4444', fontSize: 10, fontFamily: 'var(--font-vazir)' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                  <p className="text-[10px] font-bold text-slate-400">کمترین قیمت</p>
                  <p className="mt-1 text-sm font-black text-blue-600">{formatRial(summary?.min_price || 0)}</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                  <p className="text-[10px] font-bold text-slate-400">بیشترین قیمت</p>
                  <p className="mt-1 text-sm font-black text-emerald-700">{formatRial(summary?.max_price || 0)}</p>
                </div>
                <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
                  <p className="text-[10px] font-bold text-slate-400">دامنه تغییرات</p>
                  <p className="mt-1 text-sm font-black text-rose-600">{formatRial(summary?.price_range || 0)}</p>
                </div>
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
            <p className="mt-2 text-[10px] text-emerald-100/60">پس از اعمال تعدیلات و ضریب کیفیت</p>
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
