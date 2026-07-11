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
  confidenceLevel?: number;
  qcScore?: number;
  onCalculate?: () => void;
  calculating?: boolean;
  error?: string | null;
}

export function M06_RPCM_Engine({ 
  data, 
  finalValue = 0,
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

  // داده‌های پیش‌فرض (فقط در صورت نبود data)
  const defaultWaterfall = [
    { step: 1, title: 'هزینه مستقیم نیروی کار', amount: 235500000, cumulative: 235500000, is_final: false, type: 'increase' },
    { step: 2, title: '+ هزینه مستقیم بازتولید', amount: 85000000, cumulative: 320500000, is_final: false, type: 'increase' },
    { step: 3, title: '+ سربار هماهنگی (۱۲٪)', amount: 38460000, cumulative: 358960000, is_final: false, type: 'increase' },
    { step: 4, title: '- منسوخی محتوایی (۱۵٪)', amount: -53844000, cumulative: 305116000, is_final: false, type: 'decrease' },
    { step: 5, title: '- عامل سن (۶.۷٪)', amount: -20442772, cumulative: 284673228, is_final: false, type: 'decrease' },
    { step: 6, title: '- منسوخی فیزیکی (۰٪)', amount: 0, cumulative: 284673228, is_final: true, type: 'final' },
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
          dir="rtl"
          fontFamily="var(--font-vazir)"
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
          dir="rtl"
          fontFamily="var(--font-vazir)"
        >
          {formatNumber(item.cumulative)}
        </text>
      </g>
    );
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* توضیحات روش */}
      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
        <p className="text-sm text-purple-700 font-[family-name:var(--font-vazir)]">
          🔹 روش هزینه بازتولید (RPCM) - ارزش‌گذاری بر اساس هزینه بازتولید دقیق دارایی.
          <span className="inline-block mr-2 px-2 py-0.5 bg-purple-200 text-purple-800 rounded-full text-xs font-medium">
          </span>
          {hasData && (
            <span className="inline-block mr-2 px-2 py-0.5 bg-purple-300 text-purple-800 rounded-full text-xs font-medium">
              📥 داده از دیتابیس
            </span>
          )}
        </p>
      </div>

      {!data && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-8 text-center">
            <p className="text-gray-500 font-[family-name:var(--font-vazir)]">برای شروع محاسبه، روی دکمه زیر کلیک کنید</p>
            <Button
              className="mt-4 bg-dark-green hover:bg-dark-green/90 font-[family-name:var(--font-vazir)]"
              onClick={onCalculate}
              disabled={calculating}
            >
              {calculating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  در حال محاسبه...
                </>
              ) : (
                'شروع محاسبه'
              )}
            </Button>
            {error && (
              <p className="mt-3 text-sm text-red-500 flex items-center justify-center gap-1 font-[family-name:var(--font-vazir)]">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          {/* جزئیات نیروی کار */}
          <Card className="border-purple-200">
            <CardContent className="p-4">
              <h4 className="text-sm font-bold text-dark-green mb-3 flex items-center gap-2 font-[family-name:var(--font-vazir)]">
                <Users className="w-4 h-4" />
                جزئیات نیروی کار (نفر-روز)
              </h4>
              <div className="overflow-x-auto font-[family-name:var(--font-vazir)]">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-purple-50">
                      <th className="border p-2 text-right">نقش</th>
                      <th className="border p-2 text-right">نفر-روز</th>
                      <th className="border p-2 text-right">نرخ روزانه</th>
                      <th className="border p-2 text-right">هزینه</th>
                    </tr>
                  </thead>
                  <tbody>
                    {laborDetails.map((item: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border p-2">{item.role}</td>
                        <td className="border p-2 text-center">{item.person_days}</td>
                        <td className="border p-2 font-[family-name:var(--font-vazir)]">{formatNumber(item.daily_rate)}</td>
                        <td className="border p-2 font-[family-name:var(--font-vazir)]">{formatNumber(item.person_days * item.daily_rate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* نمودار آبشار */}
          <Card className="border-purple-200 shadow-md">
            <CardContent className="p-4">
              <div style={{ width: '100%', height: 400 }} dir="ltr">
                <ResponsiveContainer>
                  <BarChart
                    data={chartData}
                    margin={{ top: 40, right: 30, left: 20, bottom: 30 }}
                    barGap={8}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 11, fontFamily: 'var(--font-vazir)' }} 
                      axisLine={{ stroke: '#e5e7eb' }} 
                      tickLine={false} 
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fontFamily: 'var(--font-vazir)' }} 
                      tickFormatter={(value) => formatNumber(value)} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <Tooltip 
                      formatter={(value: any) => formatNumber(value)} 
                      contentStyle={{ fontFamily: 'var(--font-vazir)' }}
                    />
                    <Legend 
                      content={() => (
                        <div className="flex justify-center gap-8 mt-4 font-[family-name:var(--font-vazir)]" dir="rtl">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded" style={{ backgroundColor: '#22c55e' }}></span>
                            <span className="text-gray-700 text-sm">افزایش (+)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded" style={{ backgroundColor: '#ef4444' }}></span>
                            <span className="text-gray-700 text-sm">کاهش (-)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded" style={{ backgroundColor: '#14b8a6' }}></span>
                            <span className="text-gray-700 text-sm font-medium">ارزش نهایی</span>
                          </div>
                        </div>
                      )} 
                    />
                    <Bar dataKey="value" radius={[2, 2, 0, 0]} barSize={50}>
                      {chartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={getColor(entry)} opacity={entry.isFinal ? 1 : 0.85} />
                      ))}
                      <LabelList content={<CustomLabel />} />
                    </Bar>
                    <ReferenceLine y={0} stroke="#e5e7eb" strokeWidth={1} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* جدول مراحل */}
          <Card className="border-purple-200">
            <CardContent className="p-4">
              <h4 className="text-sm font-bold text-dark-green mb-3 font-[family-name:var(--font-vazir)]">📋 مراحل محاسبه</h4>
              <div className="overflow-x-auto font-[family-name:var(--font-vazir)]">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-purple-50">
                      <th className="border p-2 text-center">مرحله</th>
                      <th className="border p-2 text-right">شرح</th>
                      <th className="border p-2 text-right">ورودی / تعدیل</th>
                      <th className="border p-2 text-right">ارزش تجمعی</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waterfallData.map((item: any, index: number) => {
                      const isFinal = item.is_final;
                      const isDecrease = item.type === 'decrease';
                      const isIncrease = item.type === 'increase';
                      
                      let rowColor = 'hover:bg-gray-50';
                      let valueColor = 'text-gray-700';
                      if (isFinal) {
                        rowColor = 'bg-teal-50';
                        valueColor = 'text-teal-700 font-bold';
                      } else if (isDecrease) {
                        rowColor = 'bg-red-50';
                        valueColor = 'text-red-600';
                      } else if (isIncrease) {
                        rowColor = 'bg-green-50';
                        valueColor = 'text-green-600';
                      }
                      
                      const displayAmount = item.amount > 0 ? `+ ${formatNumber(item.amount)}` : 
                                           item.amount < 0 ? `- ${formatNumber(Math.abs(item.amount))}` :
                                           formatNumber(item.amount);
                      
                      return (
                        <tr key={index} className={`${rowColor} transition-colors`}>
                          <td className="border p-2 text-center font-[family-name:var(--font-vazir)]">{item.step}</td>
                          <td className="border p-2">{item.title}</td>
                          <td className={`border p-2 font-[family-name:var(--font-vazir)] ${valueColor}`}>{displayAmount}</td>
                          <td className={`border p-2 font-[family-name:var(--font-vazir)] ${isFinal ? 'text-teal-700 font-bold text-base' : ''}`}>
                            {formatNumber(item.cumulative)}
                          </td>
                        </tr>
                      );
                    })}
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
                <span className="text-dark-green font-bold">ارزش = [(هزینه نیروی کار + هزینه بازتولید) × (۱ + سربار هماهنگی)] × (۱ - منسوخی محتوایی) × (۱ - عامل سن) × (۱ - منسوخی فیزیکی)</span>
                <br />
                <span className="text-gray-400 text-xs">با استفاده از داده‌های STEP 2 و STEP 3</span>
                <br />
                <span className="text-teal-700 font-bold text-base">= {formatNumber(displayFinal)} ریال</span>
              </div>
            </CardContent>
          </Card>

          {/* خلاصه نتایج */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-gray-500 font-[family-name:var(--font-vazir)]">ارزش برآوردی</p>
                <p className="text-2xl font-bold text-dark-green font-[family-name:var(--font-vazir)]">{formatNumber(displayFinal)}</p>
                <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">ریال</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-gray-500 font-[family-name:var(--font-vazir)]">سطح اطمینان</p>
                <p className="text-2xl font-bold text-blue-600 font-[family-name:var(--font-vazir)]">{formatPercent(confidenceLevel * 100)}</p>
                <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">امتیاز QC: {formatNumber(qcScore)}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-teal-50 to-white border-teal-200">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-gray-500 font-[family-name:var(--font-vazir)]">تاریخ محاسبه</p>
                <p className="text-lg font-bold text-teal-700 font-[family-name:var(--font-vazir)]">{new Date().toLocaleDateString('fa-IR')}</p>
                <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">تحلیلگر: سیستم</p>
              </CardContent>
            </Card>
          </div>

          {/* دکمه خروجی */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" className="flex items-center gap-1 font-[family-name:var(--font-vazir)]">
              <Download className="w-4 h-4" /> خروجی Excel
            </Button>
            <Button variant="outline" className="flex items-center gap-1 font-[family-name:var(--font-vazir)]">
              <FileText className="w-4 h-4" /> خروجی PDF
            </Button>
          </div>
        </>
      )}
    </div>
  );
}