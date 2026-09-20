'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Info, 
  ArrowRight,
  Copy,
  Award,
  Sparkles,
  Loader2,
  ChevronLeft,
  TrendingUp,
  LogIn
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ResultPageProps {
  result: any;
  assetData: any;
  generatedCode?: string;
  suggestion?: any;
  onRegister?: () => void;
  onSelectAlternative?: () => void;
  onBack?: () => void;
  loading?: boolean;
  error?: string | null;
  selectedTemplateName?: string | null;
  isRegistered?: boolean;
  isLoggedIn?: boolean;  // اضافه شد
}

export function ResultPage({ 
  result, 
  assetData, 
  generatedCode, 
  suggestion,
  onRegister,
  onSelectAlternative,
  onBack,
  loading = false,
  error = null,
  selectedTemplateName = null,
  isRegistered = false,
  isLoggedIn = false  // اضافه شد
}: ResultPageProps) {
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  const statusColors: Record<string, string> = {
    CONFIRMED: 'text-green-600 bg-green-50 border-green-200',
    CONDITIONAL: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    REJECTED: 'text-red-600 bg-red-50 border-red-200'
  };

  const statusIcons: Record<string, React.ReactNode> = {
    CONFIRMED: <CheckCircle className="w-6 h-6 text-green-600" />,
    CONDITIONAL: <AlertCircle className="w-6 h-6 text-yellow-600" />,
    REJECTED: <XCircle className="w-6 h-6 text-red-600" />
  };

  const statusText: Record<string, string> = {
    CONFIRMED: 'قطعی ✅',
    CONDITIONAL: 'مشروط ⚠️',
    REJECTED: 'رد ❌'
  };

  const statusDesc: Record<string, string> = {
    CONFIRMED: 'تمامی ۴ شرط لازم و کافی احراز شده است. دارایی به پورتفولیوی غربالگری منتقل می‌شود.',
    CONDITIONAL: 'برخی از شروط به طور کامل احراز نشده‌اند. برای انتقال به غربالگری نیاز به بررسی تکمیلی است.',
    REJECTED: 'دارایی شرایط لازم برای شناسایی به عنوان دارایی نامشهود را ندارد.'
  };

  const status = result?.status || 'REJECTED';
  const isConfirmed = status === 'CONFIRMED';

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
    }
  };

  const handleValuationClick = () => {
    if (!isLoggedIn) {
      setShowLoginDialog(true);
    } else {
      // اگر لاگین هست، به صفحه ارزش‌گذاری برو
      window.location.href = '/dashboard/intangible/valuation';
    }
  };

  // اگر دارایی ثبت شده، پیام موفقیت نشون بده
  if (isRegistered && generatedCode) {
    return (
      <div dir="rtl" className="rounded-[30px] border border-emerald-100 bg-gradient-to-b from-emerald-50/70 via-white to-white px-5 py-12 text-center font-vazir shadow-[0_14px_45px_rgba(15,23,42,.055)]">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[24px] bg-emerald-100 text-emerald-700 shadow-lg shadow-emerald-950/10">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-green-800 mt-4">✅ دارایی با موفقیت ثبت شد!</h3>
        <p className="text-gray-600 mt-2">دارایی شما با کد زیر در سیستم ثبت گردید:</p>
        <div className="mt-5 inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
          <span className="font-mono text-lg font-bold text-dark-green">{generatedCode}</span>
          <button
            onClick={handleCopyCode}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="کپی کد"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>

        {/* دکمه ارزیابی و ارزش‌گذاری - فقط برای دارایی قطعی */}
        {isConfirmed && (
          <div className="mt-6">
            <Button 
              onClick={handleValuationClick}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
            >
              <TrendingUp className="w-5 h-5 ml-2" />
              ارزیابی و ارزش‌گذاری دارایی
              <ArrowRight className="w-5 h-5 mr-2" />
            </Button>
          </div>
        )}

        <div className="mt-6 flex gap-4 justify-center flex-wrap">
          <Button
            className="bg-primary hover:bg-primary-dark"
            onClick={() => window.location.href = '/dashboard/intangible/screening/list'}
          >
            📋 مشاهده دارایی‌های غربالگری شده
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/dashboard/intangible/discovery-wizard'}
          >
            🔄 ثبت دارایی جدید
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 rounded-[32px] bg-gradient-to-b from-[#f7fbfa] via-white to-[#f8faf9] p-4 font-vazir md:p-7" dir="rtl">
      {/* هدر */}
      <div className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-gradient-to-l from-emerald-50/80 via-white to-white p-5 shadow-[0_12px_38px_rgba(15,23,42,.05)] md:p-7 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            🔍 نتیجه ارزیابی دارایی نامشهود
          </h2>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-lg font-black text-slate-700">{assetData?.asset_name || 'نامشخص'}</span>
            {generatedCode && (
              <Badge variant="outline" className="font-mono bg-gray-50 flex items-center gap-1">
                {generatedCode}
                <button 
                  className="hover:text-primary transition-colors" 
                  onClick={handleCopyCode}
                  title="کپی کد"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </Badge>
            )}
          </div>
        </div>
        <Badge className={cn("text-sm px-4 py-2 border", statusColors[status] || statusColors.REJECTED)}>
          {statusIcons[status] || statusIcons.REJECTED}
          <span className="mr-2">{statusText[status] || statusText.REJECTED}</span>
        </Badge>
      </div>

      {/* وضعیت نهایی */}
      <Card className={cn("overflow-hidden rounded-[24px] border shadow-[0_8px_28px_rgba(15,23,42,.045)]", statusColors[status] || statusColors.REJECTED)}>
        <CardContent className="p-5 md:p-6 flex items-center gap-4">
          {statusIcons[status] || statusIcons.REJECTED}
          <div>
            <p className="font-medium">{statusDesc[status] || statusDesc.REJECTED}</p>
          </div>
        </CardContent>
      </Card>

      {/* ۴ شرط اصلی */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { key: 'n', label: 'غیرفیزیکی بودن', score: result?.n_score || 0, total: result?.n_total || 6, status: result?.n_status || 'FAIL' },
          { key: 'i', label: 'شناسایی‌پذیری', score: result?.i_score || 0, total: result?.i_total || 7, status: result?.i_status || 'FAIL' },
          { key: 'c', label: 'کنترل منافع', score: result?.c_score || 0, total: result?.c_total || 7, status: result?.c_status || 'FAIL' },
          { key: 'v', label: 'ارزش‌آفرینی', score: result?.v_score || 0, total: result?.v_total || 9, status: result?.v_status || 'FAIL' }
        ].map((item) => (
          <Card key={item.key} className="rounded-[22px] border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,.04)] transition-all hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="p-5 text-center">
              <p className="text-sm text-gray-600">{item.label}</p>
              <p className={cn(
                "text-2xl font-bold",
                item.status === 'PASS' ? 'text-green-600' : 'text-red-600'
              )}>
                {item.score}/{item.total}
              </p>
              <Badge className={cn(
                "mt-1",
                item.status === 'PASS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              )}>
                {item.status === 'PASS' ? '✅ قبول' : '❌ رد'}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* مولفه‌های احراز شده */}
      <Card className="rounded-[26px] border border-slate-200/80 shadow-[0_8px_28px_rgba(15,23,42,.045)]">
        <CardContent className="p-5 md:p-6">
          <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            مولفه‌های احراز شده
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label: 'غیرفیزیکی', items: result?.n_details || [] },
              { label: 'شناسایی', items: result?.i_details || [] },
              { label: 'کنترل', items: result?.c_details || [] },
              { label: 'ارزش', items: result?.v_details || [] }
            ].map((group) => (
              <div key={group.label} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-xs text-gray-500 mb-1">{group.label}</p>
                <div className="flex flex-wrap gap-1">
                  {group.items && group.items.length > 0 ? (
                    group.items.map((item: string) => (
                      <Badge key={item} variant="secondary" className="text-xs">
                        {item}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400">هیچ</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* پیشنهاد قالب */}
      {suggestion && (
        <div className="space-y-5 mt-7 border-t border-slate-100 pt-7">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-black text-slate-900">🎯 پیشنهاد قالب دارایی</h3>
          </div>

          {/* بهترین تطابق */}
          <Card className={cn(
            "rounded-[26px] overflow-hidden shadow-[0_10px_32px_rgba(15,23,42,.05)] border",
            suggestion.best_template?.match_percentage >= 80 
              ? "border-green-300 bg-green-50" 
              : "border-primary/20 bg-primary/5"
          )}>
            <CardContent className="p-5 md:p-6">
              <div className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-gradient-to-l from-emerald-50/80 via-white to-white p-5 shadow-[0_12px_38px_rgba(15,23,42,.05)] md:p-7 flex items-start justify-between flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={cn(
                      "text-white",
                      suggestion.best_template?.match_percentage >= 80 
                        ? "bg-green-600" 
                        : "bg-primary"
                    )}>
                      {suggestion.best_template?.match_percentage >= 80 ? '⭐ بهترین تطابق' : 'بهترین تطابق'}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      امتیاز: {suggestion.best_template?.total_score || 0}/{suggestion.best_template?.max_score || 29}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-dark-green mt-2">
                    {suggestion.best_template?.name || 'نامشخص'}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                    <span>روش: {suggestion.best_template?.valuation_method || 'نامشخص'}</span>
                    <span className="hidden sm:inline">|</span>
                    <span>دسته: {suggestion.best_template?.category || 'نامشخص'}</span>
                    <span className="hidden sm:inline">|</span>
                    <span>سازمان: {suggestion.best_template?.organization_type || 'نامشخص'}</span>
                  </div>
                  <div className="mt-3 max-w-sm">
                    <div className="flex items-center justify-between text-sm">
                      <span>تطابق</span>
                      <span className="font-bold text-primary">{suggestion.best_template?.match_percentage || 0}%</span>
                    </div>
                    <Progress 
                      value={suggestion.best_template?.match_percentage || 0} 
                      className="h-2" 
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* خطاها */}
          {suggestion.errors && suggestion.errors.length > 0 && (
            <Card className="border-2 border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-yellow-800">
                      {suggestion.summary?.message || 'نیاز به اصلاح دارد'}
                    </p>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {suggestion.errors.map((errorGroup: any) => (
                        errorGroup.errors.map((err: any) => (
                          <div 
                            key={err.key}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded-lg text-sm",
                              err.is_critical ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                            )}
                          >
                            {err.is_critical ? (
                              <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            ) : (
                              <Info className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                            )}
                            <span className="break-words">{err.description || err.key}</span>
                            {err.is_critical && (
                              <Badge variant="destructive" className="text-xs whitespace-nowrap">ضروری</Badge>
                            )}
                          </div>
                        ))
                      ))}
                    </div>
                    {suggestion.summary?.alternative_message && (
                      <p className="mt-3 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                        💡 {suggestion.summary.alternative_message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* گزینه جایگزین */}
          {suggestion.alternative && (
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="p-4 flex items-center justify-between flex-wrap gap-4">
                <div className="min-w-[150px]">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-blue-300 text-blue-700">گزینه جایگزین</Badge>
                  </div>
                  <p className="font-semibold text-blue-900 mt-1">{suggestion.alternative.name}</p>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-blue-700 mt-1">
                    <span>تطابق: {suggestion.alternative.match_percentage || 0}%</span>
                    <span className="hidden sm:inline">|</span>
                    <span>روش: {suggestion.alternative.valuation_method || 'نامشخص'}</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="border-blue-300 text-blue-700 hover:bg-blue-100 whitespace-nowrap"
                  onClick={onSelectAlternative}
                  disabled={loading}
                >
                  انتخاب این قالب
                </Button>
              </CardContent>
            </Card>
          )}

          {/* خطا */}
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              ❌ {error}
            </div>
          )}

          {/* ============================================
              دکمه‌های اقدام
              ============================================ */}
          {!isRegistered && (
            <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-[22px] border border-slate-200/80 bg-white/95 p-3 shadow-[0_16px_45px_rgba(15,23,42,.12)] backdrop-blur-xl sm:flex-row">
              {/* دکمه اصلی: ثبت نهایی */}
              <Button 
                className={cn(
                  "flex-1 h-12 rounded-xl bg-dark-green hover:bg-dark-green/90 text-white font-black shadow-lg shadow-emerald-950/10",
                  "transition-all duration-200"
                )}
                onClick={onRegister}
                disabled={loading || !suggestion?.best_template}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    در حال ثبت...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 ml-2" />
                    ثبت نهایی دارایی
                    {selectedTemplateName && (
                      <span className="mr-2 text-xs opacity-70">
                        (با قالب: {selectedTemplateName})
                      </span>
                    )}
                  </>
                )}
              </Button>

              {/* دکمه کمکی: انتخاب قالب دیگر */}
              <Button 
                variant="outline"
                className="flex-1 h-12 rounded-xl border-slate-200 hover:bg-slate-50 font-bold"
                onClick={onSelectAlternative}
                disabled={loading || !suggestion?.alternative}
              >
                <ArrowRight className="w-4 h-4 ml-2" />
                انتخاب قالب دیگر
                {suggestion?.alternative && (
                  <span className="mr-2 text-xs text-gray-500">
                    ({suggestion.alternative.name})
                  </span>
                )}
              </Button>

              {/* دکمه کمکی: بازگشت و ویرایش */}
              <Button 
                variant="ghost"
                className="h-12 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                onClick={onBack}
                disabled={loading}
              >
                <ChevronLeft className="w-4 h-4 ml-2" />
                بازگشت و ویرایش
              </Button>
            </div>
          )}

          {/* ============================================
              دکمه ارزیابی و ارزش‌گذاری - فقط برای دارایی قطعی
              ============================================ */}
          {isRegistered && isConfirmed && (
            <div className="pt-4 border-t">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-green-800 font-medium">
                  ✅ دارایی شما به عنوان یک دارایی نامشهود قطعی شناسایی شده است.
                </p>
                <p className="text-green-700 text-sm mt-1">
                  برای ارزیابی و ارزش‌گذاری دقیق، روی دکمه زیر کلیک کنید.
                </p>
                <Button 
                  onClick={handleValuationClick}
                  className="mt-4 bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                >
                  <TrendingUp className="w-5 h-5 ml-2" />
                  ارزیابی و ارزش‌گذاری دارایی
                  <ArrowRight className="w-5 h-5 mr-2" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================
          دیالوگ برای کاربران لاگین نشده
          ============================================ */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="max-w-md rounded-[28px] border-slate-200 p-6 font-vazir">
          <DialogHeader>
            <DialogTitle className="text-center text-xl text-dark-green">
              🚀 برای ارزش‌گذاری دارایی خود وارد شوید
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              برای ارزیابی و ارزش‌گذاری دارایی نامشهود خود، باید وارد 
              <span className="font-semibold text-blue-600"> پلتفرم مدیریت دارایی‌های نامشهود (META) </span>
              شوید.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-green-50 rounded-lg p-4 my-4 text-center">
            <p className="text-sm text-green-800">
              ✅ دارایی شما به عنوان یک <span className="font-bold">دارایی نامشهود قطعی</span> شناسایی شده است.
            </p>
            <p className="text-sm text-green-700 mt-1">
              برای ادامه فرآیند ارزش‌گذاری، لطفاً وارد حساب کاربری خود شوید.
            </p>
          </div>

          <DialogFooter className="flex flex-col gap-3 sm:flex-row">
            <Link href="/login" className="w-full">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <LogIn className="w-4 h-4 ml-2" />
                ورود به پلتفرم META
              </Button>
            </Link>
            <Button 
              variant="outline" 
              onClick={() => setShowLoginDialog(false)}
              className="w-full"
            >
              بعداً
            </Button>
          </DialogFooter>

          <p className="text-xs text-center text-gray-400 mt-4">
            🔒 اطلاعات شما با امنیت کامل ذخیره شده است
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}