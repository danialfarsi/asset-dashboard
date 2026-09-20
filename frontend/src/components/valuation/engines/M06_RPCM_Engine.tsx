'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, AlertCircle, Loader2, Users } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  LabelList,
} from 'recharts';

interface M06_RPCM_EngineProps {
  data?: any;
  finalValue?: number;
  tokenValue?: number;
  confidenceLevel?: number;
  qcScore?: number;
  onCalculate?: () => void;
  calculating?: boolean;
  error?: string | null;
}

export function M06_RPCM_Engine({ 
  data, 
  finalValue = 0,
  tokenValue: propTokenValue,
  confidenceLevel = 0.90,
  qcScore = 90,
  onCalculate,
  calculating = false,
  error = null
}: M06_RPCM_EngineProps) {
  
  // تبدیل اعداد به فرمت فارسی با جداکننده هزارگان
  const formatNumber = (num: number) => {
    if (!num && num !== 0) return '۰';
    // تبدیل عدد به رشته با جداکننده هزارگان و سپس تبدیل به فارسی
    const parts = Math.round(num).toString().split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    // تبدیل اعداد انگلیسی به فارسی
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    const persianInteger = integerPart.replace(/\d/g, (d) => persianDigits[parseInt(d)]);
    return persianInteger;
  };

  // تبدیل درصد به فارسی
  const formatPercent = (num: number) => {
    if (!num && num !== 0) return '۰٪';
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    const str = num.toString();
    const persianStr = str.replace(/\d/g, (d) => persianDigits[parseInt(d)]);
    return persianStr + '٪';
  };

  // محاسبه ارزش بر حسب تک توکن (هر تک توکن = ۱۰۰۰ هزار ریال = ۱,۰۰۰,۰۰۰ ریال)
  const calculateTokenValue = (valueInRial: number): number => {
    if (!valueInRial) return 0;
    const TOKEN_VALUE_IN_RIAL = 1000000;
    return Math.round(valueInRial / TOKEN_VALUE_IN_RIAL);
  };

  // داده‌های پیش‌فرض (فقط در صورت نبود data)
  const defaultWaterfall = [
    { step: 1, title: 'هزینه مستقیم نیروی کار', amount: 235500000, cumulative: 235500000, is_final: false, type: 'increase' },
    { step: 2, title: '+ هزینه مستقیم بازتولید', amount: 85000000, cumulative: 320500000, is_final: false, type: 'increase' },
    { step: 3, title: '+ سربار هماهنگی (۱۲٪)', amount: 38460000, cumulative: 358960000, is_final: false, type: 'increase' },
    { step: 4, title: '- استهلاک محتوایی (۱۵٪)', amount: -53844000, cumulative: 305116000, is_final: false, type: 'decrease' },
    { step: 5, title: '- عامل سن (۶.۷٪)', amount: -20442772, cumulative: 284673228, is_final: false, type: 'decrease' },
    { step: 6, title: '- استهلاک فیزیکی (۰٪)', amount: 0, cumulative: 284673228, is_final: true, type: 'final' },
  ];

  const defaultLaborDetails = [
    { role: 'کارشناس انرژی', person_days: 45, daily_rate: 2500000 },
    { role: 'کارشناس محیط زیست', person_days: 30, daily_rate: 2200000 },
    { role: 'تکنیسین اندازه‌گیری', person_days: 20, daily_rate: 1500000 },
    { role: 'کارشناس مستندسازی', person_days: 15, daily_rate: 1800000 },
  ];

  // استفاده از داده‌های واقعی یا پیش‌فرض
  const hasData = data && data.waterfall && data.waterfall.length > 0;
  const waterfallData = hasData ? data.waterfall : defaultWaterfall;
  const laborDetails = hasData && data.labor_details ? data.labor_details : defaultLaborDetails;
  
  // 🔥 اولویت: propTokenValue > محاسبه از finalValue
  let displayToken = 0;
  if (propTokenValue && propTokenValue > 0) {
    displayToken = propTokenValue;
  } else {
    const displayFinal = finalValue || (hasData ? data.final_value : 0) || 284673228;
    displayToken = calculateTokenValue(displayFinal);
  }
  
  const displayFinal = finalValue || (hasData ? data.final_value : 0) || 284673228;

  const chartData = waterfallData.map((item: any) => ({
    name: `مرحله ${item.step}`,
    value: Math.abs(item.amount),
    cumulative: item.cumulative,
    isFinal: item.is_final,
    type: item.type,
    amount: item.amount,
    displayValue: item.amount > 0 ? `+${formatNumber(item.amount)}` : 
                 item.amount < 0 ? `-${formatNumber(Math.abs(item.amount))}` :
                 formatNumber(item.amount),
  }));

  const getColor = (item: any) => {
    if (item.isFinal) return '#14b8a6';
    if (item.type === 'decrease') return '#ef4444';
    if (item.type === 'increase') return '#22c55e';
    return '#94a3b8';
  };

  const CustomLabel = (props: any) => {
    const { x, y, width, index } = props;
    const item = chartData[index];
    if (!item) return null;
    
    const isFinal = item.isFinal;
    const isDecrease = item.type === 'decrease';
    const isIncrease = item.type === 'increase';
    
    let color = '#374151';
    if (isFinal) color = '#0d9488';
    else if (isDecrease) color = '#dc2626';
    else if (isIncrease) color = '#16a34a';
    
    return (
      <g>
        <text
          x={x + width / 2}
          y={y - 8}
          textAnchor="middle"
          fontSize={11}
          fontWeight={isFinal ? 'bold' : 'normal'}
          fill={color}
        >
          {item.displayValue}
        </text>
        <text
          x={x + width / 2}
          y={y - 24}
          textAnchor="middle"
          fontSize={11}
          fontWeight="bold"
          fill="#1f2937"
        >
          {formatNumber(item.cumulative)}
        </text>
      </g>
    );
  };

  return (
    <div className="space-y-6 font-[family-name:var(--font-vazir)]" dir="rtl">

      {/* Executive Header */}
      <section className="relative overflow-hidden rounded-[30px] border border-slate-200/80 bg-white p-5 shadow-[0_14px_45px_rgba(15,23,42,0.055)] sm:p-7">
        <div className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full bg-purple-100/60 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-emerald-100/45 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-dark-green text-white shadow-lg shadow-emerald-950/10">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-black text-purple-700">M-06</span>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500">Reproduction Cost Method</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">روش هزینه</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 sm:text-2xl">نتایج ارزش‌گذاری روش RPCM</h2>
              <p className="mt-1 max-w-2xl text-xs leading-6 text-slate-500 sm:text-sm">
                ارزش دارایی بر مبنای هزینه بازتولید دقیق و پس از اعمال سربار هماهنگی، استهلاک محتوایی، عامل سن و استهلاک فیزیکی محاسبه شده است.
              </p>
            </div>
          </div>

          {hasData && (
            <span className="inline-flex self-start rounded-full border border-purple-100 bg-purple-50 px-3.5 py-2 text-xs font-bold text-purple-700 lg:self-auto">
              داده از دیتابیس
            </span>
          )}
        </div>
      </section>

      {!data && (
        <section className="relative overflow-hidden rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-[0_8px_30px_rgba(15,23,42,0.035)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
            <Users className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-black text-slate-800">آماده محاسبه هزینه بازتولید</h3>
          <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-slate-500">
            برای دریافت داده‌ها و اجرای مدل RPCM، فرآیند محاسبه را آغاز کنید.
          </p>
          <Button
            className="mt-5 h-11 rounded-xl bg-dark-green px-6 font-bold text-white hover:bg-dark-green/90"
            onClick={onCalculate}
            disabled={calculating}
          >
            {calculating ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                در حال محاسبه...
              </>
            ) : (
              'شروع محاسبه'
            )}
          </Button>
          {error && (
            <p className="mt-3 flex items-center justify-center gap-1 text-xs font-bold text-rose-600">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          )}
        </section>
      )}

      {data && (
        <>
          {/* Labor Details */}
          <Card className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.045)]">
            <CardContent className="p-0">
              <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5 sm:px-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800">جزئیات نیروی کار</h4>
                  <p className="mt-0.5 text-[10px] text-slate-400">نفر-روز، نرخ روزانه و هزینه مستقیم بازتولید</p>
                </div>
              </div>

              <div className="overflow-x-auto p-4 sm:p-5">
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <table className="w-full min-w-[620px] border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-500">
                        <th className="p-3 text-right">نقش</th>
                        <th className="p-3 text-center">نفر-روز</th>
                        <th className="p-3 text-right">نرخ روزانه</th>
                        <th className="p-3 text-right">هزینه</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {laborDetails.map((item: any, index: number) => (
                        <tr key={index} className="bg-white transition-colors hover:bg-slate-50/70">
                          <td className="p-3 font-bold text-slate-700">{item.role}</td>
                          <td className="p-3 text-center font-black text-slate-600">{item.person_days}</td>
                          <td className="p-3 text-right text-slate-600">{formatNumber(item.daily_rate)}</td>
                          <td className="p-3 text-right font-black text-dark-green">
                            {formatNumber(item.person_days * item.daily_rate)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Waterfall */}
          <Card className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.045)]">
            <CardContent className="p-0">
              <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <h4 className="text-sm font-black text-slate-800">آبشار هزینه بازتولید</h4>
                  <p className="mt-1 text-[10px] text-slate-400">
                    اثر هزینه‌های بازتولید و تعدیلات استهلاک بر ارزش تجمعی دارایی
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 text-[10px] font-bold text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <i className="h-2.5 w-2.5 rounded-full bg-green-500" />
                    افزایش
                  </span>
                  <span className="flex items-center gap-1.5">
                    <i className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    کاهش
                  </span>
                  <span className="flex items-center gap-1.5">
                    <i className="h-2.5 w-2.5 rounded-full bg-teal-500" />
                    ارزش نهایی
                  </span>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <div style={{ width: '100%', height: 410 }} dir="ltr">
                  <ResponsiveContainer>
                    <BarChart
                      data={chartData}
                      margin={{ top: 48, right: 25, left: 10, bottom: 25 }}
                      barGap={8}
                    >
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'var(--font-vazir)' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'var(--font-vazir)' }}
                        tickFormatter={(value) => formatNumber(value)}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value: any) => formatNumber(value)}
                        contentStyle={{
                          fontFamily: 'var(--font-vazir)',
                          borderRadius: 16,
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 12px 30px rgba(15,23,42,.08)'
                        }}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={48}>
                        {chartData.map((entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={getColor(entry)}
                            opacity={entry.isFinal ? 1 : 0.86}
                          />
                        ))}
                        <LabelList content={<CustomLabel />} />
                      </Bar>
                      <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calculation Steps */}
          <Card className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.045)]">
            <CardContent className="p-0">
              <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                <h4 className="text-sm font-black text-slate-800">مراحل محاسبه</h4>
                <p className="mt-1 text-[10px] text-slate-400">
                  مسیر تبدیل هزینه مستقیم بازتولید به ارزش نهایی دارایی
                </p>
              </div>

              <div className="overflow-x-auto p-4 sm:p-5">
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <table className="w-full min-w-[760px] border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-bold text-slate-500">
                        <th className="p-3 text-center">مرحله</th>
                        <th className="p-3 text-right">شرح</th>
                        <th className="p-3 text-right">ورودی / تعدیل</th>
                        <th className="p-3 text-right">ارزش تجمعی</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {waterfallData.map((item: any, index: number) => {
                        const isFinal = item.is_final;
                        const isDecrease = item.type === 'decrease';
                        const isIncrease = item.type === 'increase';

                        const displayAmount = item.amount > 0
                          ? `+ ${formatNumber(item.amount)}`
                          : item.amount < 0
                            ? `- ${formatNumber(Math.abs(item.amount))}`
                            : formatNumber(item.amount);

                        return (
                          <tr
                            key={index}
                            className={`transition-colors ${
                              isFinal ? 'bg-teal-50/60' : 'bg-white hover:bg-slate-50/70'
                            }`}
                          >
                            <td className="p-3 text-center font-black text-slate-600">{item.step}</td>
                            <td className="p-3 font-bold text-slate-700">{item.title}</td>
                            <td
                              className={`p-3 font-black ${
                                isFinal
                                  ? 'text-teal-700'
                                  : isDecrease
                                    ? 'text-red-600'
                                    : isIncrease
                                      ? 'text-green-600'
                                      : 'text-slate-600'
                              }`}
                            >
                              {displayAmount}
                            </td>
                            <td
                              className={`p-3 ${
                                isFinal
                                  ? 'text-base font-black text-teal-700'
                                  : 'font-bold text-slate-600'
                              }`}
                            >
                              {formatNumber(item.cumulative)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formula */}
          <section className="rounded-[26px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.04)] sm:p-6">
            <div className="mb-4">
              <h4 className="text-sm font-black text-slate-800">منطق محاسبه RPCM</h4>
              <p className="mt-1 text-[10px] text-slate-400">
                ساختار تعدیلات اعمال‌شده بر هزینه بازتولید دقیق دارایی
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-5 py-5 text-center">
              <p className="text-sm font-black leading-8 text-dark-green">
                ارزش = [(هزینه نیروی کار + هزینه بازتولید) × (۱ + سربار هماهنگی)] ×
                (۱ - استهلاک محتوایی) × (۱ - عامل سن) × (۱ - استهلاک فیزیکی)
              </p>
              <p className="mt-2 text-[10px] text-slate-400">با استفاده از داده‌های STEP 2 و STEP 3</p>
            </div>
          </section>

          {/* Final valuation — deliberately at bottom */}
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
                <p className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                  {formatNumber(displayFinal)}
                  <span className="mr-2 text-base font-bold text-emerald-100/70">ریال</span>
                </p>
                <p className="mt-2 text-[10px] text-emerald-100/60">
                  ارزش نهایی پس از اعمال تعدیلات بازتولید و استهلاک
                </p>
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

          {/* Existing output actions preserved */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              className="h-11 rounded-xl border-dark-green/20 bg-dark-green/[0.03] px-4 font-bold text-dark-green hover:bg-dark-green/10"
            >
              <Download className="ml-2 h-4 w-4" />
              خروجی Excel
            </Button>
            <Button
              variant="outline"
              className="h-11 rounded-xl border-slate-200 px-4 font-bold text-slate-600 hover:bg-slate-50"
            >
              <FileText className="ml-2 h-4 w-4" />
              خروجی PDF
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
