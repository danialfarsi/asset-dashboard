/**
 * 🎯 نتایج سنجش بلوغ IAMS
 * مسیر: /dashboard/intangible/maturity/[id]/results
 */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, Award, TrendingUp, Target, AlertTriangle,
  CheckCircle, BarChart3, Download, RefreshCw, Loader2,
  Shield, Activity, Layers, Database, Zap, Lock,
} from 'lucide-react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts';
import { maturityApi } from '@/services/engine05/maturity-api';
import { toast } from 'sonner';

const DOMAIN_INFO: Record<string, { name: string; icon: any; color: string; bg: string }> = {
  hardware: { name: 'سخت‌افزار', icon: Shield, color: '#04241D', bg: 'bg-[#04241D]/5' },
  brainware: { name: 'مغزافزار', icon: Award, color: '#0B4A3C', bg: 'bg-[#0B4A3C]/5' },
  orgware: { name: 'سازمان‌افزار', icon: Layers, color: '#D9B65D', bg: 'bg-[#D9B65D]/10' },
  software: { name: 'نرم‌افزار', icon: Database, color: '#9B792B', bg: 'bg-[#9B792B]/5' },
};

const LEVEL_COLORS: Record<number, { bg: string; text: string; border: string; label: string }> = {
  1: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300', label: 'اولیه / بحرانی' },
  2: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-300', label: 'آغازین / موردی' },
  3: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-300', label: 'تعریف‌شده / استاندارد' },
  4: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300', label: 'مدیریت‌شده / اندازه‌گیری‌شده' },
  5: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300', label: 'بهینه / هوشمند' },
};

export default function MaturityResultsPage() {
  const params = useParams();
  const assessmentId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [recalculating, setRecalculating] = useState(false);

  const toFa = (num: any): string => {
    if (num === null || num === undefined) return '—';
    return String(num).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
  };

  useEffect(() => {
    loadResults();
  }, [assessmentId]);

  const loadResults = async () => {
    setLoading(true);
    try {
      const res = await maturityApi.getResults(assessmentId);
      setData(res.data);
    } catch (err: any) {
      console.error(err);
      toast.error('خطا در بارگذاری نتایج');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await maturityApi.calculate(assessmentId, { has_external_auditor: false });
      toast.success('محاسبه مجدد انجام شد');
      await loadResults();
    } catch (err) {
      toast.error('خطا در محاسبه');
    } finally {
      setRecalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#04241D]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6 text-center rtl">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p>نتیجه‌ای یافت نشد</p>
      </div>
    );
  }

  const level = data.maturity_level || 1;
  const levelColor = LEVEL_COLORS[level] || LEVEL_COLORS[1];
  const radarData = data.radar_data || [];
  const gate = data.gate_rules_status || {};
  const gapAnalysis = data.gap_analysis || {};
  const priorities = gapAnalysis.priorities || [];
  const roadmap = gapAnalysis.roadmap || {};

  return (
    <div className="container mx-auto p-6 space-y-6 rtl" style={{ fontFamily: 'Vazirmatn, Tahoma, sans-serif' }}>
      {/* Back */}
      <Link
        href="/dashboard/intangible/maturity"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#04241D]"
      >
        <ArrowRight className="h-4 w-4" />
        بازگشت به لیست
      </Link>

      {/* Header با Index و سطح */}
      <div className={`relative overflow-hidden rounded-2xl ${levelColor.bg} border-2 ${levelColor.border} p-6 shadow-lg`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-right">
            <p className="text-xs text-gray-500 mb-2">سطح بلوغ سازمان</p>
            <div className="flex items-center gap-4">
              <div className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-white border-2 ${levelColor.border}`}>
                <span className={`text-4xl font-black ${levelColor.text}`}>{toFa(level)}</span>
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${levelColor.text}`}>
                  {levelColor.label}
                </h1>
                <p className="text-sm text-gray-600 mt-1">{data.organization_name}</p>
                <p className="text-xs text-gray-500 mt-1">{data.weight_profile_name}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">IAMS Index</p>
              <p className={`text-4xl font-black ${levelColor.text}`}>
                {toFa(data.index?.toFixed(1))}
              </p>
              <p className="text-xs text-gray-400 mt-1">از ۱۰۰</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">نمره کل</p>
              <p className="text-4xl font-black text-gray-800">
                {toFa(data.score_total?.toFixed(2))}
              </p>
              <p className="text-xs text-gray-400 mt-1">از ۵</p>
            </div>
          </div>

          <Button
            onClick={handleRecalculate}
            disabled={recalculating}
            variant="outline"
            size="sm"
            className="bg-white"
          >
            <RefreshCw className={`w-4 h-4 ml-1 ${recalculating ? 'animate-spin' : ''}`} />
            محاسبه مجدد
          </Button>
        </div>
      </div>

      {/* Radar + Domain Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Radar Chart */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#04241D]" />
              پروفایل بخشی (نمودار راداری)
            </h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid stroke="#E5E7EB" />
                  <PolarAngleAxis dataKey="domain" tick={{ fill: '#4B5563', fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fill: '#9CA3AF', fontSize: 9 }} />
                  <Radar
                    name="نمره"
                    dataKey="score"
                    stroke="#04241D"
                    strokeWidth={2}
                    fill="#04241D"
                    fillOpacity={0.3}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-2 rounded shadow text-xs">
                            <p className="font-bold">{payload[0].payload.domain}</p>
                            <p>نمره: {toFa(payload[0].value?.toFixed(2))}</p>
                            <p>درصد: {toFa(payload[0].payload.percent)}٪</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Domain Scores */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#04241D]" />
              نمرات بخش‌ها
            </h3>
            <div className="space-y-3">
              {radarData.map((item: any) => {
                const info = DOMAIN_INFO[item.domain_key] || DOMAIN_INFO.hardware;
                const Icon = info.icon;
                const percent = item.percent || 0;
                
                return (
                  <div key={item.domain_key} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" style={{ color: info.color }} />
                        <span className="text-sm font-bold text-gray-700">{item.domain}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-800">
                        {toFa(item.score?.toFixed(2))} / ۵
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{ width: `${percent}%`, backgroundColor: info.color }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">{toFa(percent)}٪</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gate Rules */}
      {gate.violations && gate.violations.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardContent className="p-6">
            <h3 className="text-sm font-bold text-amber-800 mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              قواعد دروازه‌ای ({toFa(gate.violations.length)} مورد نقض)
            </h3>
            <div className="space-y-2">
              {gate.violations.map((v: any, i: number) => (
                <div key={i} className="bg-white rounded-lg p-3 border">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-800">
                        {v.rule}: {v.message}
                      </p>
                      <p className="text-[10px] text-amber-700 mt-1">→ {v.effect}</p>
                    </div>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">
                      {v.rule}
                    </span>
                  </div>
                  <p className="text-[10px] text-blue-600 mt-2">
                    💡 اقدام: {v.action}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Priorities */}
      {priorities.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-[#04241D]" />
              اولویت اقدامات اصلاحی (Top 10)
            </h3>
            <div className="space-y-2">
              {priorities.slice(0, 10).map((p: any) => (
                <div key={p.component_code} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#04241D] text-white text-xs font-bold">
                    {toFa(p.rank)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">
                      {p.component_name}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      نمره فعلی: {toFa(p.current_score?.toFixed(2))} | 
                      هدف: {toFa(p.target_score)} | 
                      شکاف: {toFa(p.gap?.toFixed(2))}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-red-600">
                      {toFa(p.priority_index?.toFixed(2))}
                    </p>
                    <p className="text-[9px] text-gray-400">اولویت</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Roadmap */}
      {roadmap.current_index && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#04241D]" />
              نقشه راه ۳ ساله
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">وضعیت فعلی</p>
                <p className="text-2xl font-black text-gray-800">
                  {toFa(roadmap.current_index)}
                </p>
                <p className="text-xs text-gray-500">سطح {toFa(roadmap.current_level)}</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 text-center">
                <p className="text-xs text-amber-700 mb-1">پایان سال ۱</p>
                <p className="text-2xl font-black text-amber-700">
                  {toFa(roadmap.year_1?.index)}
                </p>
                <p className="text-xs text-amber-600">سطح {toFa(roadmap.year_1?.level)}</p>
                <p className="text-[9px] text-amber-600 mt-1">{roadmap.year_1?.description}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-xs text-blue-700 mb-1">پایان سال ۲</p>
                <p className="text-2xl font-black text-blue-700">
                  {toFa(roadmap.year_2?.index)}
                </p>
                <p className="text-xs text-blue-600">سطح {toFa(roadmap.year_2?.level)}</p>
                <p className="text-[9px] text-blue-600 mt-1">{roadmap.year_2?.description}</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3 text-center">
                <p className="text-xs text-emerald-700 mb-1">پایان سال ۳</p>
                <p className="text-2xl font-black text-emerald-700">
                  {toFa(roadmap.year_3?.index)}
                </p>
                <p className="text-xs text-emerald-600">سطح {toFa(roadmap.year_3?.level)}</p>
                <p className="text-[9px] text-emerald-600 mt-1">{roadmap.year_3?.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
