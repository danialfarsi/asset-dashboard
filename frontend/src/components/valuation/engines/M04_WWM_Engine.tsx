'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, AlertCircle, Loader2, ArrowUpRight, ArrowDownRight, Sigma } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface M04_WWM_EngineProps {
  data?: any;
  finalValue?: number;
  tokenValue?: number;
  confidenceLevel?: number;
  qcScore?: number;
  onCalculate?: () => void;
  calculating?: boolean;
  error?: string | null;
}

export function M04_WWM_Engine({ 
  data, 
  finalValue = 0,
  tokenValue: propTokenValue,
  confidenceLevel = 0.82,
  qcScore = 82,
  onCalculate,
  calculating = false,
  error = null
}: M04_WWM_EngineProps) {
  
  const safeNumber = (value: any): number => {
    if (value === undefined || value === null) return 0;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? 0 : num;
  };

  // تبدیل اعداد به فرمت فارسی با جداکننده هزارگان
  const formatNumber = (num: any) => {
    const value = safeNumber(num);
    if (value === 0) return '۰';
    const parts = Math.round(value).toString().split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    const persianInteger = integerPart.replace(/\d/g, (d) => persianDigits[parseInt(d)]);
    return persianInteger;
  };

  // تبدیل به ریال فارسی
  const formatRial = (num: any) => {
    const value = safeNumber(num);
    if (value === 0) return '۰ ریال';
    return `${formatNumber(value)} ریال`;
  };

  // تبدیل درصد به فارسی
  const formatPercent = (num: number) => {
    if (!num && num !== 0) return '۰٪';
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    const str = num.toString();
    const persianStr = str.replace(/\d/g, (d) => persianDigits[parseInt(d)]);
    return persianStr + '٪';
  };

  // برای اعداد کوچک (میلیون) در نمودار
  const formatMillions = (num: any) => {
    const value = safeNumber(num);
    if (value === 0) return '۰';
    if (value >= 1000000) {
      const million = value / 1000000;
      const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
      const str = million.toFixed(1);
      const persianStr = str.replace(/\d/g, (d) => persianDigits[parseInt(d)]);
      return persianStr + ' میلیون';
    }
    return formatNumber(value);
  };

  // محاسبه ارزش بر حسب تک توکن (هر تک توکن = ۱۰۰۰ هزار ریال = ۱,۰۰۰,۰۰۰ ریال)
  const calculateTokenValue = (valueInRial: number): number => {
    if (!valueInRial) return 0;
    const TOKEN_VALUE_IN_RIAL = 1000000;
    return Math.round(valueInRial / TOKEN_VALUE_IN_RIAL);
  };

  // چک کردن وجود داده
  const hasData = data && data.fcf_data && data.fcf_data.length > 0;
  
  // 🔥 محاسبه تک توکن
  let displayToken = 0;
  if (propTokenValue && propTokenValue > 0) {
    displayToken = propTokenValue;
  } else {
    const totalPV = data?.differential_data?.reduce((sum: number, row: any) => sum + safeNumber(row.pv), 0) || 0;
    const displayFinal = safeNumber(finalValue) || safeNumber(data?.final_value) || totalPV;
    displayToken = calculateTokenValue(displayFinal);
  }
  
  if (!hasData) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-bold text-dark-green mb-2 font-[family-name:var(--font-vazir)]">محاسبه ارزش دارایی</h3>
        <p className="text-gray-500 max-w-md mx-auto font-[family-name:var(--font-vazir)]">
          برای محاسبه ارزش دارایی با روش WWM، دکمه زیر را بزنید.
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

  const fcfData = data.fcf_data || [];
  const differentialData = data.differential_data || [];
  
  const totalPV = differentialData.reduce((sum: number, row: any) => sum + safeNumber(row.pv), 0);
  const displayFinal = safeNumber(finalValue) || safeNumber(data?.final_value) || totalPV;

  const totalWith = fcfData.reduce((sum: number, row: any) => sum + safeNumber(row.withFCF), 0);
  const totalWithout = fcfData.reduce((sum: number, row: any) => sum + safeNumber(row.withoutFCF), 0);
  const totalDelta = totalWith - totalWithout;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg font-[family-name:var(--font-vazir)]" dir="rtl">
          <p className="mb-2 text-xs font-bold text-slate-700">{`سال ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {formatRial(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 font-[family-name:var(--font-vazir)]" dir="rtl">

      {/* Executive Header */}
      <section className="relative overflow-hidden rounded-[30px] border border-slate-200/80 bg-white p-5 shadow-[0_14px_45px_rgba(15,23,42,0.055)] sm:p-7">
        <div className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full bg-blue-100/60 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-amber-100/40 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-dark-green text-white shadow-lg shadow-emerald-950/10">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-700">M-04</span>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500">With & Without Method</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">روش درآمد</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 sm:text-2xl">نتایج ارزش‌گذاری روش WWM</h2>
              <p className="mt-1 max-w-2xl text-xs leading-6 text-slate-500 sm:text-sm">
                ارزش دارایی از تفاوت جریان نقدی آزاد در سناریوی «با دارایی» و «بدون دارایی» و تنزیل جریان تفاضلی استخراج شده است.
              </p>
            </div>
          </div>

          <span className="inline-flex self-start items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-500 lg:self-auto">
            داده از دیتابیس
          </span>
        </div>
      </section>

      {/* Scenario summary */}
      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-[22px] border border-blue-100 bg-blue-50/50 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <ArrowUpRight className="h-4 w-4" />
            </div>
            <p className="text-[10px] font-bold text-slate-400">جمع FCF با دارایی</p>
          </div>
          <p className="mt-3 text-base font-black text-blue-700">{formatRial(totalWith)}</p>
        </div>

        <div className="rounded-[22px] border border-amber-100 bg-amber-50/50 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <ArrowDownRight className="h-4 w-4" />
            </div>
            <p className="text-[10px] font-bold text-slate-400">جمع FCF بدون دارایی</p>
          </div>
          <p className="mt-3 text-base font-black text-amber-600">{formatRial(totalWithout)}</p>
        </div>

        <div className="rounded-[22px] border border-emerald-100 bg-emerald-50/50 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Sigma className="h-4 w-4" />
            </div>
            <p className="text-[10px] font-bold text-slate-400">تفاضل کل (Δ)</p>
          </div>
          <p className="mt-3 text-base font-black text-emerald-700">{formatRial(totalDelta)}</p>
        </div>
      </section>

      {/* FCF Chart */}
      <Card className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.045)]">
        <CardContent className="p-0">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h4 className="text-sm font-black text-slate-800">جریان نقدی آزاد (FCF)</h4>
              <p className="mt-1 text-[10px] text-slate-400">مقایسه روند جریان نقدی در دو سناریوی با دارایی و بدون دارایی</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500">
              <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-blue-700" />با دارایی</span>
              <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-amber-500" />بدون دارایی</span>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div style={{ width: '100%', height: 340 }} dir="ltr">
              <ResponsiveContainer>
                <LineChart data={fcfData} margin={{ top: 20, right: 25, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'var(--font-vazir)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'var(--font-vazir)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => formatMillions(value)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontFamily: 'var(--font-vazir)', fontSize: 11 }} />
                  <Line type="monotone" dataKey="withFCF" name="با دارایی" stroke="#1d4ed8" strokeWidth={3} dot={{ fill: '#1d4ed8', r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="withoutFCF" name="بدون دارایی" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 3 }} activeDot={{ r: 5 }} />
                  <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Differential Calculation */}
      <Card className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.045)]">
        <CardContent className="p-0">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
            <h4 className="text-sm font-black text-slate-800">جدول محاسبه تفاضلی</h4>
            <p className="mt-1 text-[10px] text-slate-400">جزئیات اختلاف جریان نقدی، اثر مالیات و ارزش فعلی هر سال</p>
          </div>

          <div className="overflow-x-auto p-4 sm:p-5">
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full min-w-[850px] border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500">
                    <th className="p-3 text-center">سال</th>
                    <th className="p-3 text-right">FCF با دارایی</th>
                    <th className="p-3 text-right">FCF بدون دارایی</th>
                    <th className="p-3 text-right">Δ</th>
                    <th className="p-3 text-right">پس از مالیات</th>
                    <th className="p-3 text-right">PV</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {differentialData.map((row: any, index: number) => (
                    <tr key={index} className="bg-white transition-colors hover:bg-slate-50/70">
                      <td className="p-3 text-center font-black text-slate-600">{row.year}</td>
                      <td className="p-3 text-right text-blue-700">{formatRial(row.withFCF)}</td>
                      <td className="p-3 text-right text-amber-600">{formatRial(row.withoutFCF)}</td>
                      <td className="p-3 text-right font-black text-slate-700">{formatRial(row.delta)}</td>
                      <td className="p-3 text-right text-slate-600">{formatRial(row.afterTax)}</td>
                      <td className="p-3 text-right font-black text-emerald-700">{formatRial(row.pv)}</td>
                    </tr>
                  ))}
                  <tr className="bg-emerald-50/60">
                    <td className="p-3 text-center text-xs font-black text-emerald-800">مجموع PV</td>
                    <td className="p-3 text-right font-black text-emerald-800" colSpan={5}>{formatRial(totalPV)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

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
            <p className="mt-2 text-[10px] text-emerald-100/60">ارزش خالص فعلی (NPV)</p>
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

      {/* Existing output actions intentionally preserved */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" className="h-11 rounded-xl border-dark-green/20 bg-dark-green/[0.03] px-4 font-bold text-dark-green hover:bg-dark-green/10">
          <Download className="ml-2 h-4 w-4" /> خروجی Excel
        </Button>
        <Button variant="outline" className="h-11 rounded-xl border-slate-200 px-4 font-bold text-slate-600 hover:bg-slate-50">
          <FileText className="ml-2 h-4 w-4" /> خروجی PDF
        </Button>
      </div>
    </div>
  );
}
