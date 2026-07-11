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
  ReferenceLine,
} from 'recharts';

interface M04_WWM_EngineProps {
  data?: any;
  finalValue?: number;
  confidenceLevel?: number;
  qcScore?: number;
  onCalculate?: () => void;
  calculating?: boolean;
  error?: string | null;
}

export function M04_WWM_Engine({ 
  data, 
  finalValue = 0,
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

  // چک کردن وجود داده
  const hasData = data && data.fcf_data && data.fcf_data.length > 0;
  
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
  
  const totalPV = differentialData.reduce((sum, row) => sum + safeNumber(row.pv), 0);
  const displayFinal = safeNumber(finalValue) || safeNumber(data?.final_value) || totalPV;

  const totalWith = fcfData.reduce((sum, row) => sum + safeNumber(row.withFCF), 0);
  const totalWithout = fcfData.reduce((sum, row) => sum + safeNumber(row.withoutFCF), 0);
  const totalDelta = totalWith - totalWithout;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-100 font-[family-name:var(--font-vazir)]">
          <p className="font-bold text-dark-green text-sm">{label}</p>
          {payload.map((item: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: item.color }}>
              {item.name}: {formatRial(item.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* توضیحات روش */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700 font-[family-name:var(--font-vazir)]">
          🔹 روش با و بدون دارایی (WWM) - تفاوت ارزش دارایی را با مقایسه سناریوهای با و بدون دارایی محاسبه می‌کند.
          <span className="inline-block mr-2 px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full text-xs font-medium">
            ⭐ ۱۱ دارایی
          </span>
          <span className="inline-block mr-2 px-2 py-0.5 bg-blue-300 text-blue-800 rounded-full text-xs font-medium">
            📥 داده از دیتابیس
          </span>
        </p>
      </div>

      {/* نمودار FCF */}
      <Card className="border-blue-200 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-dark-green font-[family-name:var(--font-vazir)]">📈 جریان نقدی آزاد (FCF)</h4>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-600" />
                <span className="text-gray-600 font-[family-name:var(--font-vazir)]">با دارایی</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-gray-600 font-[family-name:var(--font-vazir)]">بدون دارایی</span>
              </div>
            </div>
          </div>
          
          <div style={{ width: '100%', height: 320 }} dir="ltr">
            <ResponsiveContainer>
              <LineChart
                data={fcfData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="year" 
                  tick={{ fontSize: 11, fill: '#6b7280', fontFamily: 'var(--font-vazir)' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#6b7280', fontFamily: 'var(--font-vazir)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => formatMillions(value)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="withFCF"
                  name="با دارایی"
                  stroke="#1e40af"
                  strokeWidth={2.5}
                  dot={{ fill: '#1e40af', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="withoutFCF"
                  name="بدون دارایی"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ fill: '#f59e0b', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <ReferenceLine y={0} stroke="#9ca3af" strokeWidth={1} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t">
            <div className="text-center">
              <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">جمع با دارایی</p>
              <p className="text-sm font-bold text-blue-600 font-[family-name:var(--font-vazir)]">{formatRial(totalWith)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">جمع بدون دارایی</p>
              <p className="text-sm font-bold text-amber-500 font-[family-name:var(--font-vazir)]">{formatRial(totalWithout)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">تفاضل (Δ)</p>
              <p className="text-sm font-bold text-emerald-600 font-[family-name:var(--font-vazir)]">{formatRial(totalDelta)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* جدول Differential Calculation */}
      <Card className="border-blue-200">
        <CardContent className="p-4">
          <h4 className="text-sm font-bold text-dark-green mb-3 font-[family-name:var(--font-vazir)]">📊 جدول محاسبه تفاضلی</h4>
          <div className="overflow-x-auto font-[family-name:var(--font-vazir)]">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-blue-50">
                  <th className="border p-2 text-center">سال</th>
                  <th className="border p-2 text-right">FCF با دارایی</th>
                  <th className="border p-2 text-right">FCF بدون دارایی</th>
                  <th className="border p-2 text-right">Δ</th>
                  <th className="border p-2 text-right">پس از مالیات</th>
                  <th className="border p-2 text-right">PV</th>
                </tr>
              </thead>
              <tbody>
                {differentialData.map((row: any, index: number) => {
                  const isEven = index % 2 === 0;
                  return (
                    <tr key={index} className={isEven ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="border p-2 text-center font-[family-name:var(--font-vazir)]">{row.year}</td>
                      <td className="border p-2 text-right font-[family-name:var(--font-vazir)]">{formatRial(row.withFCF)}</td>
                      <td className="border p-2 text-right font-[family-name:var(--font-vazir)]">{formatRial(row.withoutFCF)}</td>
                      <td className="border p-2 text-right font-bold text-blue-600 font-[family-name:var(--font-vazir)]">
                        {formatRial(row.delta)}
                      </td>
                      <td className="border p-2 text-right font-[family-name:var(--font-vazir)]">{formatRial(row.afterTax)}</td>
                      <td className="border p-2 text-right font-[family-name:var(--font-vazir)]">{formatRial(row.pv)}</td>
                    </tr>
                  );
                })}
                <tr className="bg-blue-50 font-bold">
                  <td className="border p-2 text-center font-[family-name:var(--font-vazir)]">مجموع PV</td>
                  <td className="border p-2 text-right" colSpan={5}>
                    {formatRial(totalPV)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* فرمول */}
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="p-4">
          <h4 className="text-sm font-bold text-dark-green mb-2 font-[family-name:var(--font-vazir)]">🧮 فرمول محاسبه</h4>
          <div className="bg-white p-4 rounded border border-gray-200 text-sm text-center font-[family-name:var(--font-vazir)]" dir="rtl">
            <span className="text-dark-green font-bold">Δₜ = (FCF_with - FCF_without) × (۱ - نرخ مالیات)</span>
            <br />
            <span className="text-dark-green font-bold">ارزش = Σ PV (با نرخ تنزیل)</span>
            <br />
            <span className="text-gray-400 text-xs">ارزش = تفاضل جریان نقدی × (۱ - نرخ مالیات) × ضریب تنزیل</span>
          </div>
        </CardContent>
      </Card>

      {/* خلاصه نتایج */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 font-[family-name:var(--font-vazir)]">ارزش برآوردی</p>
            <p className="text-2xl font-bold text-dark-green font-[family-name:var(--font-vazir)]">{formatRial(displayFinal)}</p>
            <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">ارزش خالص فعلی (NPV)</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 font-[family-name:var(--font-vazir)]">ارزش پایه (Base Case)</p>
            <p className="text-2xl font-bold text-blue-600 font-[family-name:var(--font-vazir)]">{formatRial(totalPV)}</p>
            <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">NPV جریان نقدی تفاضلی</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-teal-50 to-white border-teal-200">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-500 font-[family-name:var(--font-vazir)]">سطح اطمینان</p>
            <p className="text-2xl font-bold text-teal-700 font-[family-name:var(--font-vazir)]">{formatPercent(confidenceLevel * 100)}</p>
            <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">امتیاز QC: {formatNumber(qcScore)}</p>
          </CardContent>
        </Card>
      </div>

      {/* دکمه‌های خروجی */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" className="flex items-center gap-1 font-[family-name:var(--font-vazir)]">
          <Download className="w-4 h-4" /> خروجی Excel
        </Button>
        <Button variant="outline" className="flex items-center gap-1 font-[family-name:var(--font-vazir)]">
          <FileText className="w-4 h-4" /> خروجی PDF
        </Button>
      </div>
    </div>
  );
}