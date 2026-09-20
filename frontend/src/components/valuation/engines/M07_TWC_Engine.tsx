'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, AlertCircle, Loader2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useState } from 'react';
import * as XLSX from 'xlsx';

interface M07_TWC_EngineProps {
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

// نقش‌های فارسی
const ROLE_LABELS: Record<string, string> = {
  'senior_developer': 'توسعه‌دهنده ارشد',
  'developer': 'توسعه‌دهنده',
  'project_manager': 'مدیر پروژه',
  'qa_engineer': 'مهندس کیفیت',
  'devops': 'متخصص DevOps',
  'data_scientist': 'دانشمند داده',
  'ui_ux_designer': 'طراح رابط کاربری',
  'business_analyst': 'تحلیل‌گر کسب‌وکار',
  'product_owner': 'محصول‌دار',
  'scrum_master': 'اسکرام مستر',
  'technical_lead': 'رهبر فنی',
  'architect': 'معمار سیستم',
  'Software Engineer': 'مهندس نرم‌افزار',
  'Data Scientist': 'دانشمند داده',
  'Product Manager': 'مدیر محصول',
  'UX/UI Designer': 'طراح رابط کاربری',
  'QA Analyst': 'تحلیل‌گر کیفیت',
};

const getRoleLabel = (role: string): string => {
  return ROLE_LABELS[role] || role;
};

export function M07_TWC_Engine({ 
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
}: M07_TWC_EngineProps) {
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

  const formatNumber = (num: any): string => {
    const value = safeNumber(num);
    if (value === 0) return '۰';
    const parts = Math.round(value).toString().split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return toPersianDigit(integerPart);
  };

  const formatRial = (num: any): string => {
    const value = safeNumber(num);
    if (value === 0) return '۰ ریال';
    return `${formatNumber(value)} ریال`;
  };

  const formatPercent = (num: number): string => {
    if (!num && num !== 0) return '۰٪';
    const value = num * 100;
    const str = value.toFixed(1);
    return toPersianDigit(str) + '٪';
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
  const teamMembers = data?.team_details || data?.team_members || data?.inputs_used?.team_composition || [];
  const hasData = summary && (summary.final_value || finalValue);
  
  // 🔥 اولویت: propTokenValue > محاسبه از finalValue
  let displayToken = 0;
  const displayFinal = safeNumber(finalValue) || safeNumber(summary?.final_value) || 0;
  if (propTokenValue && propTokenValue > 0) {
    displayToken = propTokenValue;
  } else {
    displayToken = calculateTokenValue(displayFinal);
  }

  // ============================================
  // داده‌های جدول هر نقش (با نقش‌های فارسی)
  // ============================================
  const tableData: Array<{
    role: string;
    headcount: number;
    recruitCost: number;
    trainCost: number;
    rampUpLoss: number;
    total: number;
  }> = teamMembers.map((member: any) => {
    const headcount = member.headcount || 0;
    const recruitCost = member.recruit_cost_per_person || member.recruit_cost || 0;
    const trainCost = member.train_cost_per_person || member.train_cost || 0;
    const salary = member.salary_per_year || member.avg_salary || member.salary || 0;
    const rampUpLoss = salary * (summary?.ramp_up_duration || 6) / 12 * (summary?.productivity_loss || 0.3);
    const total = (headcount * recruitCost) + (headcount * trainCost) + (headcount * rampUpLoss);
    
    return {
      role: getRoleLabel(member.role || member.role_name || '-'),
      headcount: headcount,
      recruitCost: headcount * recruitCost,
      trainCost: headcount * trainCost,
      rampUpLoss: headcount * rampUpLoss,
      total: total,
    };
  });

  const totalHeadcount = tableData.reduce((sum: number, row: any) => sum + row.headcount, 0);
  const totalRecruit = tableData.reduce((sum: number, row: any) => sum + row.recruitCost, 0);
  const totalTrain = tableData.reduce((sum: number, row: any) => sum + row.trainCost, 0);
  const totalRampUp = tableData.reduce((sum: number, row: any) => sum + row.rampUpLoss, 0);
  const totalAll = tableData.reduce((sum: number, row: any) => sum + row.total, 0);

  // ============================================
  // داده‌های نمودار میله‌ای
  // ============================================
  const barData = tableData.map((row: any) => ({
    role: row.role,
    recruitCost: row.recruitCost,
    trainCost: row.trainCost,
    rampUpLoss: row.rampUpLoss,
  }));

  // ============================================
  // خروجی Excel
  // ============================================
  const exportExcel = (): void => {
    const rows: any[][] = [
      ['گزارش ارزش‌گذاری روش M-07 (TWC)'],
      [''],
      ['دارایی:', assetName],
      ['کد:', assetCode || '-'],
      ['تاریخ:', new Date().toLocaleDateString('fa-IR')],
      [''],
      ['ترکیب تیم'],
      ['نقش', 'تعداد', 'هزینه جذب', 'هزینه آموزش', 'کاهش بهره‌وری', 'مجموع'],
    ];

    tableData.forEach((row: any) => {
      rows.push([
        row.role,
        row.headcount,
        row.recruitCost,
        row.trainCost,
        row.rampUpLoss,
        row.total,
      ]);
    });

    rows.push(['مجموع', totalHeadcount, totalRecruit, totalTrain, totalRampUp, totalAll]);
    rows.push(['']);
    rows.push(['خلاصه هزینه‌ها']);
    rows.push(['نوع هزینه', 'مبلغ (IRR)']);
    rows.push(['هزینه جذب', totalRecruit]);
    rows.push(['هزینه آموزش', totalTrain]);
    rows.push(['کاهش بهره‌وری', totalRampUp]);
    rows.push(['هزینه کل بازسازی', totalAll]);
    rows.push(['']);
    rows.push(['ارزش نهایی', summary?.final_value || 0]);
    rows.push(['ارزش بر حسب تک توکن', displayToken]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws, 'M07_TWC');
    XLSX.writeFile(wb, `${assetName}-M07-TWC-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // ============================================
  // رندر
  // ============================================
  if (!hasData && !calculating) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-bold text-dark-green mb-2 font-[family-name:var(--font-vazir)]">محاسبه ارزش دارایی (M-07 TWC)</h3>
        <p className="text-gray-500 max-w-md mx-auto font-[family-name:var(--font-vazir)]">
          برای محاسبه ارزش دارایی با روش هزینه نیروی کار آموزش‌دیده (TWC)، دکمه زیر را بزنید.
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
    <div className="space-y-6 font-[family-name:var(--font-vazir)]" dir="rtl">

      {/* Executive Header */}
      <section className="relative overflow-hidden rounded-[30px] border border-slate-200/80 bg-white p-5 shadow-[0_14px_45px_rgba(15,23,42,0.055)] sm:p-7">
        <div className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full bg-orange-100/55 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-emerald-100/45 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-dark-green text-white shadow-lg shadow-emerald-950/10">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-black text-orange-700">M-07</span>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500">Trained Workforce Cost</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">روش هزینه</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 sm:text-2xl">نتایج ارزش‌گذاری روش TWC</h2>
              <p className="mt-1 max-w-2xl text-xs leading-6 text-slate-500 sm:text-sm">
                ارزش نیروی کار آموزش‌دیده بر مبنای هزینه جذب، آموزش و زیان بهره‌وری در دوره رسیدن اعضای تیم به ظرفیت عملیاتی محاسبه شده است.
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

      {/* Key parameters */}
      <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.045)] sm:p-6">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-800">پارامترهای کلیدی مدل</h3>
            <p className="mt-1 text-[10px] text-slate-400">خلاصه ورودی‌های مؤثر در ارزش‌گذاری نیروی کار آموزش‌دیده</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-500">M-07 Engine</span>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="text-[9px] font-bold text-slate-400">تعداد کل تیم</p>
            <p className="mt-1.5 text-sm font-black text-dark-green">{toPersianDigit(totalHeadcount)} نفر</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="text-[9px] font-bold text-slate-400">نرخ تنزیل</p>
            <p className="mt-1.5 text-sm font-black text-dark-green">{formatPercent(summary?.discount_rate || 0.18)}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="text-[9px] font-bold text-slate-400">ضریب کیفیت</p>
            <p className="mt-1.5 text-sm font-black text-dark-green">{summary?.quality_multiplier?.toFixed(2) || '۰.۰۰'}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="text-[9px] font-bold text-slate-400">نرخ مالیات</p>
            <p className="mt-1.5 text-sm font-black text-dark-green">{formatPercent(summary?.tax_rate || 0.25)}</p>
          </div>
        </div>
      </section>

      {/* Team composition */}
      <Card className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.045)]">
        <CardContent className="p-0">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
            <h4 className="text-sm font-black text-slate-800">ترکیب تیم</h4>
            <p className="mt-1 text-[10px] text-slate-400">هزینه‌های جذب، آموزش و کاهش بهره‌وری به تفکیک نقش سازمانی</p>
          </div>

          <div className="overflow-x-auto p-4 sm:p-5">
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full min-w-[920px] border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500">
                    <th className="p-3 text-right">نقش</th>
                    <th className="p-3 text-center">تعداد</th>
                    <th className="p-3 text-right">هزینه جذب</th>
                    <th className="p-3 text-right">هزینه آموزش</th>
                    <th className="p-3 text-right">کاهش بهره‌وری</th>
                    <th className="p-3 text-right">مجموع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tableData.map((row: any, index: number) => (
                    <tr key={index} className="bg-white transition-colors hover:bg-slate-50/70">
                      <td className="p-3 font-bold text-slate-700">{row.role}</td>
                      <td className="p-3 text-center font-black text-slate-600">{toPersianDigit(row.headcount)}</td>
                      <td className="p-3 text-right text-slate-600">{formatRial(row.recruitCost)}</td>
                      <td className="p-3 text-right text-slate-600">{formatRial(row.trainCost)}</td>
                      <td className="p-3 text-right text-slate-600">{formatRial(row.rampUpLoss)}</td>
                      <td className="p-3 text-right font-black text-orange-600">{formatRial(row.total)}</td>
                    </tr>
                  ))}
                  <tr className="bg-orange-50/70">
                    <td className="p-3 font-black text-slate-800">مجموع</td>
                    <td className="p-3 text-center font-black text-slate-800">{toPersianDigit(totalHeadcount)}</td>
                    <td className="p-3 text-right font-black text-orange-700">{formatRial(totalRecruit)}</td>
                    <td className="p-3 text-right font-black text-orange-700">{formatRial(totalTrain)}</td>
                    <td className="p-3 text-right font-black text-orange-700">{formatRial(totalRampUp)}</td>
                    <td className="p-3 text-right font-black text-dark-green">{formatRial(totalAll)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost composition chart */}
      <Card className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.045)]">
        <CardContent className="p-0">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
            <h4 className="text-sm font-black text-slate-800">ترکیب هزینه‌ها بر اساس نقش</h4>
            <p className="mt-1 text-[10px] text-slate-400">مقایسه سهم هزینه جذب، آموزش و افت بهره‌وری برای هر نقش</p>
          </div>

          <div className="p-4 sm:p-6">
            <div style={{ width: '100%', height: 330 }} dir="ltr">
              <ResponsiveContainer>
                <BarChart data={barData} margin={{ top: 20, right: 25, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="role"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'var(--font-vazir)' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'var(--font-vazir)' }}
                    tickFormatter={(v: any) => formatNumber(v)}
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
                  <Bar dataKey="recruitCost" name="هزینه جذب" fill="#015345" stackId="stack" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="trainCost" name="هزینه آموزش" fill="#8ECFAF" stackId="stack" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="rampUpLoss" name="کاهش بهره‌وری" fill="#D4A547" stackId="stack" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost breakdown */}
      <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.045)] sm:p-6">
        <div className="mb-5">
          <h4 className="text-sm font-black text-slate-800">تفکیک هزینه‌ها</h4>
          <p className="mt-1 text-[10px] text-slate-400">ساختار هزینه کل بازسازی نیروی کار آموزش‌دیده</p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="text-[10px] font-bold text-slate-400">هزینه جذب</p>
            <p className="mt-1.5 text-base font-black text-dark-green">{formatRial(totalRecruit)}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="text-[10px] font-bold text-slate-400">هزینه آموزش</p>
            <p className="mt-1.5 text-base font-black text-dark-green">{formatRial(totalTrain)}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="text-[10px] font-bold text-slate-400">کاهش بهره‌وری</p>
            <p className="mt-1.5 text-base font-black text-dark-green">{formatRial(totalRampUp)}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2 rounded-2xl border border-orange-100 bg-orange-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs font-black text-slate-700">هزینه کل بازسازی</span>
          <span className="text-lg font-black text-orange-700">{formatRial(totalAll)}</span>
        </div>
      </section>

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
