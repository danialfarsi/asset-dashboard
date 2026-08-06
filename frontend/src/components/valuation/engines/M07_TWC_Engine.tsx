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
    const value = num * 100;
    const str = value.toFixed(1);
    return toPersianDigit(str) + '٪';
  };

  // ============================================
  // استخراج داده‌ها
  // ============================================
  const summary = data?.summary || data;
  // 🔥 اصلاح: پشتیبانی از team_details
  const teamMembers = data?.team_details || data?.team_members || data?.inputs_used?.team_composition || [];
  const hasData = summary && (summary.final_value || finalValue);

  // ============================================
  // داده‌های جدول هر نقش (با نقش‌های فارسی)
  // ============================================
  const tableData = teamMembers.map((member: any) => {
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

  const totalHeadcount = tableData.reduce((sum, row) => sum + row.headcount, 0);
  const totalRecruit = tableData.reduce((sum, row) => sum + row.recruitCost, 0);
  const totalTrain = tableData.reduce((sum, row) => sum + row.trainCost, 0);
  const totalRampUp = tableData.reduce((sum, row) => sum + row.rampUpLoss, 0);
  const totalAll = tableData.reduce((sum, row) => sum + row.total, 0);

  // ============================================
  // داده‌های نمودار میله‌ای
  // ============================================
  const barData = tableData.map(row => ({
    role: row.role,
    recruitCost: row.recruitCost,
    trainCost: row.trainCost,
    rampUpLoss: row.rampUpLoss,
  }));

  // ============================================
  // خروجی Excel
  // ============================================
  const exportExcel = () => {
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

    tableData.forEach((row) => {
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

  const displayFinal = safeNumber(finalValue) || safeNumber(summary?.final_value) || 0;
  const displayConfidence = confidenceLevel || 0.82;
  const displayQcScore = qcScore || 82;

  return (
    <div className="space-y-6" dir="rtl">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 flex-1">
          <p className="text-sm text-orange-700 flex items-center gap-2 font-[family-name:var(--font-vazir)]">
            <span className="font-bold">📊 M-07: هزینه نیروی کار آموزش‌دیده (TWC)</span>
            <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full">روش هزینه</span>
          </p>
        </div>
      </div>

      {/* پارامترهای ورودی */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg border">
        <div className="text-center p-2 bg-white rounded-lg shadow-sm">
          <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">تعداد کل تیم</p>
          <p className="text-sm font-bold text-dark-green font-[family-name:var(--font-vazir)]">
            {toPersianDigit(totalHeadcount)} نفر
          </p>
        </div>
        <div className="text-center p-2 bg-white rounded-lg shadow-sm">
          <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">نرخ تنزیل</p>
          <p className="text-sm font-bold text-dark-green font-[family-name:var(--font-vazir)]">
            {formatPercent(summary?.discount_rate || 0.18)}
          </p>
        </div>
        <div className="text-center p-2 bg-white rounded-lg shadow-sm">
          <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">ضریب کیفیت</p>
          <p className="text-sm font-bold text-dark-green font-[family-name:var(--font-vazir)]">
            {summary?.quality_multiplier?.toFixed(2) || '۰.۰۰'}
          </p>
        </div>
        <div className="text-center p-2 bg-white rounded-lg shadow-sm">
          <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">نرخ مالیات</p>
          <p className="text-sm font-bold text-dark-green font-[family-name:var(--font-vazir)]">
            {formatPercent(summary?.tax_rate || 0.25)}
          </p>
        </div>
      </div>

      {/* جدول هر نقش */}
      <Card className="border-orange-200">
        <CardContent className="p-4">
          <h4 className="text-sm font-bold text-dark-green mb-3 font-[family-name:var(--font-vazir)]">👥 ترکیب تیم</h4>
          <div className="overflow-x-auto font-[family-name:var(--font-vazir)]">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-orange-50">
                  <th className="border p-2 text-right">نقش</th>
                  <th className="border p-2 text-center">تعداد</th>
                  <th className="border p-2 text-right">هزینه جذب</th>
                  <th className="border p-2 text-right">هزینه آموزش</th>
                  <th className="border p-2 text-right">کاهش بهره‌وری</th>
                  <th className="border p-2 text-right font-bold">مجموع</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="border p-2">{row.role}</td>
                    <td className="border p-2 text-center">{toPersianDigit(row.headcount)}</td>
                    <td className="border p-2 text-right">{formatRial(row.recruitCost)}</td>
                    <td className="border p-2 text-right">{formatRial(row.trainCost)}</td>
                    <td className="border p-2 text-right">{formatRial(row.rampUpLoss)}</td>
                    <td className="border p-2 text-right font-bold text-orange-600">{formatRial(row.total)}</td>
                  </tr>
                ))}
                <tr className="bg-orange-100 font-bold">
                  <td className="border p-2">مجموع</td>
                  <td className="border p-2 text-center">{toPersianDigit(totalHeadcount)}</td>
                  <td className="border p-2 text-right text-orange-600">{formatRial(totalRecruit)}</td>
                  <td className="border p-2 text-right text-orange-600">{formatRial(totalTrain)}</td>
                  <td className="border p-2 text-right text-orange-600">{formatRial(totalRampUp)}</td>
                  <td className="border p-2 text-right text-orange-700">{formatRial(totalAll)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* نمودار میله‌ای */}
      <Card className="border-orange-200">
        <CardContent className="p-4">
          <h4 className="text-sm font-bold text-dark-green mb-3 font-[family-name:var(--font-vazir)]">📊 ترکیب هزینه‌ها بر اساس نقش</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="role" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatNumber(v)} />
              <Tooltip formatter={(value: any) => formatRial(value)} />
              <Legend />
              <Bar dataKey="recruitCost" name="هزینه جذب" fill="#015345" stackId="stack" />
              <Bar dataKey="trainCost" name="هزینه آموزش" fill="#8ECFAF" stackId="stack" />
              <Bar dataKey="rampUpLoss" name="کاهش بهره‌وری" fill="#D4A547" stackId="stack" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* خلاصه هزینه‌ها */}
      <Card className="border-orange-200">
        <CardContent className="p-4">
          <h4 className="text-sm font-bold text-dark-green mb-3 font-[family-name:var(--font-vazir)]">💰 تفکیک هزینه‌ها</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm text-gray-600">هزینه جذب</span>
              <span className="text-sm font-bold text-dark-green">{formatRial(totalRecruit)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm text-gray-600">هزینه آموزش</span>
              <span className="text-sm font-bold text-dark-green">{formatRial(totalTrain)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-sm text-gray-600">کاهش بهره‌وری</span>
              <span className="text-sm font-bold text-dark-green">{formatRial(totalRampUp)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t-2 border-orange-200">
              <span className="text-sm font-bold text-dark-green">هزینه کل بازسازی</span>
              <span className="text-lg font-bold text-orange-700">{formatRial(totalAll)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* خلاصه نتایج */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-200">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 font-[family-name:var(--font-vazir)]">ارزش نهایی دارایی</p>
            <p className="text-2xl font-bold text-dark-green font-[family-name:var(--font-vazir)]">{formatRial(displayFinal)}</p>
            <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">پس از اعمال ضریب کیفیت</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 font-[family-name:var(--font-vazir)]">هزینه کل بازسازی</p>
            <p className="text-2xl font-bold text-blue-600 font-[family-name:var(--font-vazir)]">{formatRial(totalAll)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-teal-50 to-white border-teal-200">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 font-[family-name:var(--font-vazir)]">سطح اطمینان</p>
            <p className="text-2xl font-bold text-teal-700 font-[family-name:var(--font-vazir)]">{formatPercent(displayConfidence)}</p>
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