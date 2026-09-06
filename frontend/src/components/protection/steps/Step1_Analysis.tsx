'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Shield,
  AlertCircle,
  FileCheck,
  Scale,
  Cpu,
  Lock,
  Users,
  FileText,
  Gavel,
  ArrowLeft,
  CircleCheck,
  Clock,
  ShieldCheck,
  Database,
  Key,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useProtectionStep1 } from '@/hooks/useProtection';

interface Step1AnalysisProps {
  id: number;
  data: any;
  archetype: string;
  onComplete: () => void;
}

// 🔥 تبدیل عدد به فارسی
const toPersianNumber = (num: number): string => {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return num.toString().replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};

// 🔥 هر آرکی‌تایپ یک رنگ ملایم و اختصاصی می‌گیرد؛ فقط برای نمایش استفاده می‌شود
const ARCHETYPE_LABELS: Record<
  string,
  { name: string; tint: string; text: string; ring: string; icon: any }
> = {
  'PA-1': { name: 'مالکیت فکری ثبتی', tint: 'bg-indigo-50', text: 'text-indigo-700', ring: 'ring-indigo-100', icon: Shield },
  'PA-2': { name: 'قراردادی', tint: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-100', icon: FileText },
  'PA-3': { name: 'راز تجاری', tint: 'bg-violet-50', text: 'text-violet-700', ring: 'ring-violet-100', icon: Lock },
  'PA-4': { name: 'دیجیتال/داده', tint: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-100', icon: Database },
  'PA-5': { name: 'رویه‌ای/فرهنگی', tint: 'bg-slate-100', text: 'text-slate-700', ring: 'ring-slate-200', icon: Users },
};

const TOOL_ICONS: Record<string, any> = {
  'L1': Gavel, 'L2': Scale, 'L3': ShieldCheck, 'L4': FileCheck,
  'L5': FileText, 'L6': Lock, 'L7': Users, 'L8': CircleCheck,
  'L9': Lock, 'L10': Shield, 'L11': Key, 'L12': FileText,
  'L13': Cpu, 'L14': FileCheck, 'L15': Clock,
  'T1': Key, 'T2': Lock, 'T3': Database, 'T4': Users,
  'T5': FileText, 'T6': Lock, 'T7': Shield, 'T8': ShieldCheck,
  'T9': Lock, 'T10': Database, 'T11': Users, 'T12': Database,
  'T13': Shield, 'T14': ShieldCheck, 'T15': Key, 'T16': FileText,
  'T17': Clock,
};

// 🔥 تابع محاسبه امتیاز با استفاده از code
const calculateScores = (tools: Array<{ id: number; code: string; name: string; weight: number }>) => {
  if (!tools || tools.length === 0) {
    return { overall: 0, legal: 0, procedural: 0, technical: 0 };
  }

  const legalTools = tools.filter(t => t.code && t.code.startsWith('L')).length;
  const technicalTools = tools.filter(t => t.code && t.code.startsWith('T')).length;

  const legalScore = Math.min(legalTools * 25, 100);
  const technicalScore = Math.min(technicalTools * 20, 100);
  const proceduralScore = Math.min(Math.round((legalScore + technicalScore) / 2), 100);
  const overall = Math.round((legalScore + technicalScore + proceduralScore) / 3);

  return { overall, legal: legalScore, procedural: proceduralScore, technical: technicalScore };
};

// 🔥 حلقه‌ی امتیاز کلی به‌صورت SVG با اعداد فارسی
function ScoreRing({ value }: { value: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;
  const strokeColor =
    value >= 70 ? 'stroke-emerald-500' : value >= 50 ? 'stroke-amber-500' : 'stroke-rose-500';
  const textColor =
    value >= 70 ? 'text-emerald-600' : value >= 50 ? 'text-amber-600' : 'text-rose-600';
  const label = value >= 70 ? 'قابلیت حفاظت بالا' : value >= 50 ? 'قابلیت حفاظت متوسط' : 'قابلیت حفاظت پایین';

  return (
    <div className="flex flex-col items-center gap-3 font-vazir">
      <div className="relative h-36 w-36">
        <svg viewBox="0 0 120 120" className="h-36 w-36 -rotate-90">
          <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="10" className="stroke-slate-100" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            className={`${strokeColor} transition-all duration-700 ease-out`}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold tabular-nums ${textColor}`}>{toPersianNumber(value)}</span>
          <span className="text-xs text-slate-400">از ۱۰۰</span>
        </div>
      </div>
      <p className={`text-sm font-medium ${textColor}`}>{label}</p>
    </div>
  );
}

// 🔥 نوار ریز‌متریک با رنگ اختصاصی هر دسته و اعداد فارسی
function SubMetricBar({
  icon: Icon,
  label,
  value,
  colorClass,
  trackClass,
}: {
  icon: any;
  label: string;
  value: number;
  colorClass: string;
  trackClass: string;
}) {
  return (
    <div className="font-vazir">
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-slate-600">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
        <span className="font-semibold tabular-nums text-slate-800">{toPersianNumber(value)}%</span>
      </div>
      <div className={`h-1.5 w-full overflow-hidden rounded-full ${trackClass}`}>
        <div
          className={`h-full rounded-full ${colorClass} transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export default function Step1_Analysis({ id, data, archetype, onComplete }: Step1AnalysisProps) {
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const step1Mutation = useProtectionStep1();
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (data) {
      setIsAnalyzed(true);
      setShowResult(true);
      setResult(data);
    }
  }, [data]);

  const handleAnalyze = () => {
    step1Mutation.mutate(
      { id, data: { analyzed_at: new Date().toISOString().split('T')[0] } },
      {
        onSuccess: (response) => {
          setResult(response);
          setIsAnalyzed(true);
          setShowResult(true);
        },
      }
    );
  };

  const handleContinue = () => {
    if (isAnalyzed) {
      onComplete();
    }
  };

  const archetypeInfo = ARCHETYPE_LABELS[archetype] || {
    name: 'نامشخص',
    tint: 'bg-slate-100',
    text: 'text-slate-700',
    ring: 'ring-slate-200',
    icon: Shield,
  };

  // 🔥 گرفتن ابزارها از result
  const apiTools = result?.available_tools?.legal || [];
  const apiTechTools = result?.available_tools?.technical || [];
  const allApiTools = [...apiTools, ...apiTechTools];

  const tools = allApiTools.length > 0 ? allApiTools : [];

  // 🔥 محاسبه امتیازات
  const scores = calculateScores(tools);

  const validations = [
    { label: 'اعتبارسنجی قراردادها', icon: FileCheck, status: isAnalyzed ? 'done' : 'pending' },
    { label: 'تحلیل محتوا', icon: FileText, status: isAnalyzed ? 'done' : 'pending' },
    { label: 'تایید مالکیت', icon: ShieldCheck, status: isAnalyzed ? 'done' : 'pending' },
    { label: 'بررسی صلاحیت', icon: Users, status: isAnalyzed ? 'done' : 'pending' },
  ];

  // 🔥 استفاده از asset_name واقعی از API
  const assetName = result?.analysis_result?.asset_name || result?.analysis_result?.archetype_name || archetypeInfo.name;
  const assetId = `IA-${String(id).padStart(6, '0')}`;

  const ArchetypeIcon = archetypeInfo.icon;

  // 🔥 حالت: در حال بارگذاری
  if (step1Mutation.isPending) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-slate-200 bg-white py-16 font-vazir">
        <div className="relative flex h-14 w-14 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-100" />
          <Loader2 className="relative h-8 w-8 animate-spin text-emerald-600" />
        </div>
        <div className="text-center">
          <p className="text-base font-semibold text-slate-800">در حال تحلیل قابلیت‌های حفاظتی</p>
          <p className="mt-1 text-sm text-slate-400">این فرآیند معمولاً چند ثانیه طول می‌کشد</p>
        </div>
      </div>
    );
  }

  // 🔥 حالت: نمایش نتیجه
  if (showResult && isAnalyzed) {
    return (
      <div className="space-y-5 font-vazir">
        {/* هدر */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-full ${archetypeInfo.tint} ring-4 ${archetypeInfo.ring}`}>
              <ArchetypeIcon className={`h-5 w-5 ${archetypeInfo.text}`} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">گام ۱ · تحلیل قابلیت حفاظت</h3>
              <p className="text-sm text-slate-500">
                {archetypeInfo.name} — شناسایی ابزارهای حفاظتی قابل اعمال
              </p>
            </div>
          </div>
          <Badge className="gap-1.5 border-0 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 hover:bg-emerald-50">
            <CheckCircle2 className="h-3.5 w-3.5" />
            تحلیل انجام شد
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* مشخصات دارایی */}
          <Card className="rounded-xl border-slate-200 shadow-none lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-800">مشخصات دارایی</CardTitle>
              <CardDescription className="text-xs text-slate-400">Asset Profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-400">شناسه دارایی</p>
                  <p className="mt-0.5 font-mono text-sm font-semibold text-slate-800">{assetId}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">نوع</p>
                  <p className={`mt-0.5 text-sm font-semibold ${archetypeInfo.text}`}>{archetypeInfo.name}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400">نام دارایی</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-800">{assetName}</p>
              </div>

              <div className="space-y-2.5 border-t border-slate-100 pt-4">
                {validations.map((v, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50">
                      {v.status === 'done' ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                      )}
                    </div>
                    <span>{v.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* امتیاز محافظت‌پذیری */}
          <Card className="rounded-xl border-slate-200 shadow-none lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-800">امتیاز محافظت‌پذیری</CardTitle>
              <CardDescription className="text-xs text-slate-400">Protectability Score</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex justify-center py-1">
                <ScoreRing value={scores.overall} />
              </div>

              <div className="space-y-4 border-t border-slate-100 pt-4">
                <SubMetricBar icon={Gavel} label="حقوقی" value={scores.legal} colorClass="bg-indigo-500" trackClass="bg-indigo-50" />
                <SubMetricBar icon={FileText} label="فرآیندی" value={scores.procedural} colorClass="bg-amber-500" trackClass="bg-amber-50" />
                <SubMetricBar icon={Cpu} label="فنی" value={scores.technical} colorClass="bg-teal-500" trackClass="bg-teal-50" />
              </div>
            </CardContent>
          </Card>

          {/* ابزارهای حفاظتی */}
          <Card className="rounded-xl border-slate-200 shadow-none lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-800">ابزارهای حفاظتی قابل اجرا</CardTitle>
              <CardDescription className="text-xs text-slate-400">Applicable Protection Tools</CardDescription>
            </CardHeader>
            <CardContent className="flex h-full flex-col">
              <div className="flex-1 space-y-2">
                {tools.length > 0 ? (
                  tools.map((tool: any) => {
                    const Icon = TOOL_ICONS[tool.code] || Shield;
                    const isLegal = tool.code && tool.code.startsWith('L');
                    const accent = isLegal ? 'border-indigo-400 bg-indigo-50 text-indigo-600' : 'border-teal-400 bg-teal-50 text-teal-600';
                    const desc = tool.description || 'قابل اعمال برای این دارایی';
                    return (
                      <div
                        key={tool.id}
                        className={`flex items-start gap-3 rounded-lg border-r-2 bg-slate-50/60 p-2.5 ${isLegal ? 'border-indigo-400' : 'border-teal-400'}`}
                      >
                        <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${isLegal ? 'bg-indigo-100 text-indigo-600' : 'bg-teal-100 text-teal-600'}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800">{tool.name}</p>
                          <p className="truncate text-xs text-slate-400">{desc}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                    <Sparkles className="h-5 w-5 text-slate-300" />
                    <p className="text-sm text-slate-400">هیچ ابزاری برای این دارایی یافت نشد</p>
                  </div>
                )}
              </div>
              <Button
                className="mt-4 w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={handleContinue}
              >
                ادامه به گام بعدی
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 🔥 حالت: قبل از تحلیل
  return (
    <div className="space-y-5 font-vazir">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 items-center justify-center rounded-full ${archetypeInfo.tint} ring-4 ${archetypeInfo.ring}`}>
            <ArchetypeIcon className={`h-5 w-5 ${archetypeInfo.text}`} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">گام ۱ · تحلیل قابلیت حفاظت</h3>
            <p className="text-sm text-slate-500">
              {archetypeInfo.name} — شناسایی ابزارهای حفاظتی قابل اعمال
            </p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1.5 border-slate-200 px-3 py-1 text-sm font-medium text-slate-500">
          <Clock className="h-3.5 w-3.5" />
          در انتظار تحلیل
        </Badge>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-14 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
          <AlertCircle className="h-6 w-6 text-amber-500" />
        </div>
        <div className="max-w-sm space-y-1">
          <p className="text-base font-semibold text-slate-800">تحلیل هنوز انجام نشده است</p>
          <p className="text-sm text-slate-500">
            برای شروع فرآیند حفاظت، ابتدا باید قابلیت‌های حفاظتی این دارایی بررسی شود.
          </p>
        </div>
        <Button
          onClick={handleAnalyze}
          className="gap-2 bg-emerald-600 px-6 text-white hover:bg-emerald-700"
          disabled={step1Mutation.isPending}
        >
          {step1Mutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              در حال تحلیل...
            </>
          ) : (
            'شروع تحلیل'
          )}
        </Button>
      </div>
    </div>
  );
}
