'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Shield,
  FileText,
  Lock,
  Building2,
  ArrowLeft,
  CheckCircle2,
  Info,
  Gavel,
} from 'lucide-react';
import { useProtectionStep2 } from '@/hooks/useProtection';

interface Step2StrategyProps {
  id: number;
  data: any;
  archetype: string;
  onComplete: () => void;
}

// 🔥 پیکربندی مسیرها بر اساس آرکی‌تایپ (طبق PDF صفحه ۶-۷)
const PATH_CONFIGS: Record<string, {
  paths: Array<{ id: string; label: string; icon: any; description: string }>;
  defaultPath: string;
  legalFocus: string;
  technicalFocus: string;
}> = {
  'PA-1': {
    paths: [
      { id: 'A', label: 'ثبت رسمی', icon: Gavel, description: 'ثبت پتنت و علامت تجاری' },
      { id: 'C', label: 'محرمانگی + فنی', icon: Lock, description: 'حفاظت از اسرار تجاری' },
    ],
    defaultPath: 'A',
    legalFocus: 'ثبت اختراع فرآیند',
    technicalFocus: 'امنیت فرمولاسیون',
  },
  'PA-2': {
    paths: [
      { id: 'B', label: 'قراردادی', icon: FileText, description: 'قراردادهای انحصاری و NDA' },
      { id: 'D', label: 'کنترل فنی', icon: Shield, description: 'کنترل دسترسی و امنیت داده' },
    ],
    defaultPath: 'B',
    legalFocus: 'حفاظت داده مشتری',
    technicalFocus: 'امنیت سایبری داده',
  },
  'PA-3': {
    paths: [
      { id: 'A', label: 'ثبت رسمی', icon: Gavel, description: 'ثبت مالکیت فکری تحقیق' },
      { id: 'C', label: 'محرمانگی + فنی', icon: Lock, description: 'کنترل دسترسی آزمایشگاه' },
    ],
    defaultPath: 'C',
    legalFocus: 'ثبت مالکیت فکری تحقیق',
    technicalFocus: 'کنترل دسترسی آزمایشگاه',
  },
  'PA-4': {
    paths: [
      { id: 'B', label: 'قراردادی', icon: FileText, description: 'حفاظت قرارداد سهام/برند' },
      { id: 'D', label: 'کنترل فنی', icon: Shield, description: 'امنیت اطلاعات مالی گروه' },
    ],
    defaultPath: 'D',
    legalFocus: 'حفاظت قرارداد سهام/برند',
    technicalFocus: 'امنیت اطلاعات مالی گروه',
  },
  'PA-5': {
    paths: [
      { id: 'B', label: 'قراردادی', icon: FileText, description: 'حفاظت قرارداد' },
    ],
    defaultPath: 'B',
    legalFocus: 'حفاظت قرارداد',
    technicalFocus: 'رگولاتوری خاص',
  },
};

// 🔥 پیکربندی سازمانی (طبق PDF صفحه ۴)
const ORGANIZATION_FOCUS: Record<string, { label: string; description: string }> = {
  'manufacturing': {
    label: 'تولیدی',
    description: 'تمرکز بر پتنت محصول و فرمول تولید',
  },
  'service': {
    label: 'خدماتی',
    description: 'تمرکز بر برند خدمات و پلتفرم CRM',
  },
  'rto': {
    label: 'پژوهش و فناوری',
    description: 'تمرکز بر پتنت و دانش فنی',
  },
  'holding': {
    label: 'هلدینگ',
    description: 'تمرکز بر سبد برند و قراردادهای بین‌شرکتی',
  },
};

// مسیرهای A/B «حقوقی-محور» و C/D «فنی-محور» هستند — فقط برای رنگ‌بندی نمایش
const isLegalPath = (pathId: string) => pathId === 'A' || pathId === 'B';

const PATH_LEGEND = [
  { id: 'A', label: 'مسیر A: مناسب برای دارایی‌های قابل ثبت (پتنت، برند)', dot: 'bg-indigo-500' },
  { id: 'B', label: 'مسیر B: مناسب برای دارایی‌های قراردادی', dot: 'bg-indigo-500' },
  { id: 'C', label: 'مسیر C: مناسب برای اسرار تجاری و دانش فنی', dot: 'bg-teal-500' },
  { id: 'D', label: 'مسیر D: مناسب برای دارایی‌های دیجیتال و داده', dot: 'bg-teal-500' },
];

export default function Step2_Strategy({ id, data, archetype, onComplete }: Step2StrategyProps) {
  const [selectedPath, setSelectedPath] = useState(data?.decision_tree?.path || '');
  const [organizationType, setOrganizationType] = useState('manufacturing');
  const step2Mutation = useProtectionStep2();
  const [showResult, setShowResult] = useState(false);

  const config = PATH_CONFIGS[archetype] || PATH_CONFIGS['PA-5'];
  const orgFocus = ORGANIZATION_FOCUS[organizationType] || ORGANIZATION_FOCUS['manufacturing'];

  // اگر داده قبلی وجود داشت، مسیر رو تنظیم کن
  useEffect(() => {
    if (data?.decision_tree?.path) {
      setSelectedPath(data.decision_tree.path);
      setShowResult(true);
    }
  }, [data]);

  // وقتی مسیر تغییر میکنه، پیش‌فرض‌ها رو تنظیم کن
  useEffect(() => {
    if (!selectedPath && config.paths.length > 0) {
      setSelectedPath(config.defaultPath);
    }
  }, [config.paths, config.defaultPath, selectedPath]);

  const handleSubmit = () => {
    if (!selectedPath) return;

    const selectedPathData = config.paths.find(p => p.id === selectedPath);

    step2Mutation.mutate(
      {
        id,
        data: {
          decision_tree: {
            path: selectedPath,
            label: selectedPathData?.label,
            description: selectedPathData?.description,
          },
          legal_focus: config.legalFocus,
          technical_focus: config.technicalFocus,
          organization_focus: orgFocus,
          priority_weights: {
            legal: selectedPath === 'A' || selectedPath === 'B' ? 0.6 : 0.4,
            technical: selectedPath === 'C' || selectedPath === 'D' ? 0.6 : 0.4,
            procedural: 0.2,
          },
        },
      },
      {
        onSuccess: () => {
          setShowResult(true);
          onComplete();
        },
      }
    );
  };

  // 🔥 حالت: نمایش نتیجه
  if (showResult && data) {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">گام ۲ · طراحی استراتژی حفاظت</h3>
            <p className="text-sm text-slate-500">
              مسیر {data?.decision_tree?.path} — {data?.decision_tree?.label}
            </p>
          </div>
          <Badge className="gap-1.5 border-0 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 hover:bg-emerald-50">
            <CheckCircle2 className="h-3.5 w-3.5" />
            استراتژی تعیین شد
          </Badge>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <p className="text-sm font-semibold text-emerald-800">استراتژی حفاظت تعیین شد</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-emerald-100 bg-white p-3">
              <p className="text-xs text-slate-400">محوریت حقوقی</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{data?.legal_focus || config.legalFocus}</p>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-white p-3">
              <p className="text-xs text-slate-400">محوریت فنی</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{data?.technical_focus || config.technicalFocus}</p>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-white p-3">
              <p className="text-xs text-slate-400">تمرکز سازمانی</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{data?.organization_focus?.label || orgFocus.label}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={onComplete} className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700">
            ادامه به گام بعدی
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // 🔥 حالت: انتخاب مسیر
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-slate-900">گام ۲ · طراحی استراتژی حفاظت</h3>
        <p className="text-sm text-slate-500">
          انتخاب مسیر استراتژیک برای حفاظت از دارایی بر اساس آرکی‌تایپ {archetype}
        </p>
      </div>

      <Card className="rounded-xl border-slate-200 shadow-none">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-800">درخت تصمیم</CardTitle>
              <CardDescription className="text-xs text-slate-400">مسیر حفاظتی مناسب را انتخاب کنید</CardDescription>
            </div>
            <Badge variant="outline" className="border-slate-200 text-xs font-normal text-slate-500">
              {config.paths.length} مسیر قابل انتخاب
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedPath} onValueChange={setSelectedPath} className="space-y-2.5">
            {config.paths.map((path) => {
              const Icon = path.icon;
              const legal = isLegalPath(path.id);
              const selected = selectedPath === path.id;
              const accentTint = legal ? 'bg-indigo-100 text-indigo-600' : 'bg-teal-100 text-teal-600';
              return (
                <div
                  key={path.id}
                  className={`flex items-start gap-3 space-x-reverse rounded-lg border p-3 transition-colors ${
                    selected ? 'border-emerald-400 bg-emerald-50/40' : 'border-slate-200 hover:border-emerald-200'
                  }`}
                >
                  <RadioGroupItem value={path.id} id={path.id} className="mt-1" />
                  <Label htmlFor={path.id} className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${accentTint}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-800">
                          مسیر {path.id} — {path.label}
                        </div>
                        <div className="text-xs text-slate-400">{path.description}</div>
                      </div>
                    </div>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-slate-200 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-800">تمرکز سازمانی</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2.5 rounded-lg bg-slate-50 px-3 py-2.5">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-200">
              <Building2 className="h-3.5 w-3.5 text-slate-600" />
            </div>
            <div>
              <span className="text-sm font-medium text-slate-800">{orgFocus.label}</span>
              <span className="mr-2 text-xs text-slate-400">{orgFocus.description}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
        <div className="mb-2.5 flex items-center gap-2">
          <Info className="h-4 w-4 text-slate-400" />
          <p className="text-sm font-semibold text-slate-700">راهنمای انتخاب مسیر</p>
        </div>
        <p className="mb-3 text-sm text-slate-500">
          مسیر انتخاب‌شده، استراتژی حقوقی و فنی شما را تعیین می‌کند.
        </p>
        <ul className="space-y-1.5">
          {PATH_LEGEND.map((item) => (
            <li key={item.id} className="flex items-start gap-2 text-sm text-slate-600">
              <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${item.dot}`} />
              {item.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!selectedPath || step2Mutation.isPending}
          className="bg-emerald-600 text-white hover:bg-emerald-700"
        >
          {step2Mutation.isPending ? 'در حال ذخیره...' : 'تأیید استراتژی'}
        </Button>
      </div>
    </div>
  );
}
