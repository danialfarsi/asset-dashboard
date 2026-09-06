'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  CheckCircle2, 
  FileCheck, 
  ShieldCheck, 
  Shield, 
  FileText, 
  Lock, 
  Users,
  Database,
  Gavel,
  Scale,
  Key,
  Download,
  Printer,
  Check,
  X,
  Home,
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProtectionStep5 } from '@/hooks/useProtection';

interface Step5MapProps {
  id: number;
  data: any;
  profile: any;
  onComplete: () => void;
}

// 🔥 تبدیل عدد به فارسی
const toPersianNumber = (num: number): string => {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return num.toString().replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};

const STEP_STATUS = [
  { id: 0, name: 'تحلیل قابلیت حفاظت', icon: Shield },
  { id: 1, name: 'طراحی استراتژی حفاظت', icon: FileText },
  { id: 2, name: 'حفاظت حقوقی (IP)', icon: Gavel },
  { id: 3, name: 'امنیت فنی', icon: Lock },
];

export default function Step5_Map({ id, data, profile, onComplete }: Step5MapProps) {
  const router = useRouter();
  const [notes, setNotes] = useState(data?.notes || '');
  const [isApproved, setIsApproved] = useState(data?.is_approved || false);
  const step5Mutation = useProtectionStep5();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const step1Complete = profile?.step1_result && Object.keys(profile.step1_result).length > 0;
  const step2Complete = profile?.step2_result && Object.keys(profile.step2_result).length > 0;
  const step3Complete = profile?.step3_result && Object.keys(profile.step3_result).length > 0;
  const step4Complete = profile?.step4_result && Object.keys(profile.step4_result).length > 0;

  const allStepsComplete = step1Complete && step2Complete && step3Complete && step4Complete;

  const handleSubmit = () => {
    if (!allStepsComplete) {
      return;
    }

    step5Mutation.mutate(
      { 
        id, 
        data: {
          protection_map: {
            status: 'completed',
            legal_score: profile.legal_score,
            technical_score: profile.technical_score,
            protection_score: (profile.legal_score + profile.technical_score) / 2,
            completed_at: new Date().toISOString(),
            steps: {
              step1: step1Complete,
              step2: step2Complete,
              step3: step3Complete,
              step4: step4Complete,
            }
          },
          is_approved: isApproved,
          notes: notes,
        }
      },
      {
        onSuccess: () => {
          setIsSubmitted(true);
          onComplete();
          // 🔥 بعد از ۲ ثانیه به داشبورد هدایت کن
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        },
      }
    );
  };

  const isComplete = data && data.is_completed;
  const finalScore = profile.protection_score || Math.round((profile.legal_score + profile.technical_score) / 2);

  const getScoreStatus = (score: number) => {
    if (score >= 80) return { label: 'عالی', color: 'text-emerald-600', bg: 'bg-emerald-50' };
    if (score >= 60) return { label: 'خوب', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (score >= 40) return { label: 'متوسط', color: 'text-amber-600', bg: 'bg-amber-50' };
    return { label: 'نیاز به بهبود', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const scoreStatus = getScoreStatus(finalScore);

  if (isComplete || isSubmitted) {
    return (
      <div className="space-y-6 font-vazir">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">نقشه حفاظت نهایی</h3>
            <Badge className="bg-emerald-500 text-white">✅ تکمیل شده</Badge>
          </div>
          <p className="text-muted-foreground">حفاظت دارایی با موفقیت ثبت و تأیید شد</p>
        </div>

        <Alert className="bg-emerald-50 border-emerald-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <AlertTitle className="text-emerald-800 font-semibold">حفاظت کامل شد!</AlertTitle>
          <AlertDescription className="text-emerald-700">
            نقشه حفاظت دارایی با موفقیت ثبت شد.
            {data?.is_approved && ' و تأیید نهایی شده است.'}
            <div className="mt-2 text-sm">
              امتیاز نهایی: <span className="font-bold">{toPersianNumber(finalScore)}/۱۰۰</span>
              <Badge className={cn("mr-2", scoreStatus.bg, scoreStatus.color)}>
                {scoreStatus.label}
              </Badge>
            </div>
          </AlertDescription>
        </Alert>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            دانلود گزارش PDF
          </Button>
          <Button variant="outline" className="gap-2">
            <Printer className="h-4 w-4" />
            چاپ
          </Button>
          <Button 
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => router.push('/dashboard')}
          >
            <Home className="h-4 w-4" />
            بازگشت به داشبورد
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-vazir">
      <div>
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">گام ۵: نقشه حفاظت نهایی</h3>
          <Badge variant="default">ثبت و تأیید</Badge>
        </div>
        <p className="text-muted-foreground">
          جمع‌بندی نهایی حفاظت دارایی و ثبت نقشه حفاظت
        </p>
      </div>

      {/* وضعیت تکمیل گام‌ها */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">وضعیت گام‌های حفاظت</CardTitle>
          <CardDescription className="text-xs">همه گام‌ها باید تکمیل شوند</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {STEP_STATUS.map((step) => {
              const isDone = profile?.[`step${step.id + 1}_result`] && 
                Object.keys(profile[`step${step.id + 1}_result`]).length > 0;
              const Icon = step.icon;
              return (
                <div key={step.id} className="flex items-center gap-3 p-2 rounded-lg border">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center",
                    isDone ? "bg-emerald-100" : "bg-slate-100"
                  )}>
                    {isDone ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Icon className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                  <span className={cn(
                    "text-sm flex-1",
                    isDone ? "text-slate-800" : "text-slate-400"
                  )}>
                    {step.name}
                  </span>
                  <Badge variant={isDone ? "default" : "secondary"} className="text-xs">
                    {isDone ? 'تکمیل شده' : 'در انتظار'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* امتیازات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">امتیاز حقوقی</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{toPersianNumber(profile.legal_score || 0)}</div>
            <div className="text-xs text-muted-foreground">از ۱۰۰</div>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">امتیاز فنی</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{toPersianNumber(profile.technical_score || 0)}</div>
            <div className="text-xs text-muted-foreground">از ۱۰۰</div>
          </CardContent>
        </Card>
        <Card className={cn("border-2", scoreStatus.bg)}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">امتیاز کل حفاظت</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", scoreStatus.color)}>
              {toPersianNumber(finalScore)}
            </div>
            <div className="text-xs text-muted-foreground">
              {scoreStatus.label}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* هشدار اگر گام‌ها کامل نباشند */}
      {!allStepsComplete && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertDescription className="text-amber-700 text-sm">
            ⚠️ همه گام‌های قبلی تکمیل نشده‌اند. لطفاً گام‌های ناقص را تکمیل کنید.
          </AlertDescription>
        </Alert>
      )}

      {/* تأیید نهایی */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">تأیید نهایی</CardTitle>
          <CardDescription className="text-xs">
            پس از بررسی نهایی، نقشه حفاظت را تأیید کنید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="approve"
                checked={isApproved}
                onChange={(e) => setIsApproved(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                disabled={!allStepsComplete}
              />
              <label htmlFor="approve" className="font-medium text-sm">
                نقشه حفاظت را تأیید می‌کنم
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">یادداشت‌های نهایی</label>
              <Textarea
                placeholder="یادداشت‌های نهایی را وارد کنید..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="border-slate-200"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={handleSubmit} 
          disabled={!allStepsComplete || step5Mutation.isPending}
          className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
        >
          {step5Mutation.isPending ? (
            'در حال ثبت...'
          ) : (
            <>
              <ShieldCheck className="h-4 w-4 mr-2" />
              ثبت نهایی حفاظت
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
