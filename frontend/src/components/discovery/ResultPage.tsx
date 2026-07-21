'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  isRegistered?: boolean;  // ← اضافه شد
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
  isRegistered = false  // ← اضافه شد
}: ResultPageProps) {
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

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
    }
  };

  // اگر دارایی ثبت شده، پیام موفقیت نشون بده
  if (isRegistered && generatedCode) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-green-800 mt-4">✅ دارایی با موفقیت ثبت شد!</h3>
        <p className="text-gray-600 mt-2">دارایی شما با کد زیر در سیستم ثبت گردید:</p>
        <div className="mt-4 p-4 bg-gray-50 rounded-lg inline-flex items-center gap-3">
          <span className="font-mono text-lg font-bold text-dark-green">{generatedCode}</span>
          <button
            onClick={handleCopyCode}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="کپی کد"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
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
    <div className="space-y-6" dir="rtl">
      {/* هدر */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-dark-green flex items-center gap-2">
            🔍 نتیجه ارزیابی دارایی نامشهود
          </h2>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-lg font-semibold">{assetData?.asset_name || 'نامشخص'}</span>
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
      <Card className={cn("border-2", statusColors[status] || statusColors.REJECTED)}>
        <CardContent className="p-4 flex items-center gap-3">
          {statusIcons[status] || statusIcons.REJECTED}
          <div>
            <p className="font-medium">{statusDesc[status] || statusDesc.REJECTED}</p>
          </div>
        </CardContent>
      </Card>

      {/* ۴ شرط اصلی */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { key: 'n', label: 'غیرفیزیکی بودن', score: result?.n_score || 0, total: result?.n_total || 6, status: result?.n_status || 'FAIL' },
          { key: 'i', label: 'شناسایی‌پذیری', score: result?.i_score || 0, total: result?.i_total || 7, status: result?.i_status || 'FAIL' },
          { key: 'c', label: 'کنترل منافع', score: result?.c_score || 0, total: result?.c_total || 7, status: result?.c_status || 'FAIL' },
          { key: 'v', label: 'ارزش‌آفرینی', score: result?.v_score || 0, total: result?.v_total || 9, status: result?.v_status || 'FAIL' }
        ].map((item) => (
          <Card key={item.key} className="border-0 shadow-sm bg-gray-50">
            <CardContent className="p-4 text-center">
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
      <Card>
        <CardContent className="p-4">
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
              <div key={group.label} className="bg-gray-50 rounded-lg p-3">
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
        <div className="space-y-4 mt-6 border-t pt-6">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-dark-green">🎯 پیشنهاد قالب دارایی</h3>
          </div>

          {/* بهترین تطابق */}
          <Card className={cn(
            "border-2",
            suggestion.best_template?.match_percentage >= 80 
              ? "border-green-300 bg-green-50" 
              : "border-primary/20 bg-primary/5"
          )}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between flex-wrap gap-4">
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
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              ❌ {error}
            </div>
          )}

          {/* ============================================
              دکمه‌های اقدام - فقط اگر ثبت نشده باشه
              ============================================ */}
          {!isRegistered && (
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              {/* دکمه اصلی: ثبت نهایی */}
              <Button 
                className={cn(
                  "flex-1 bg-primary hover:bg-primary-dark text-white",
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
                className="flex-1 border-gray-300 hover:bg-gray-50"
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
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                onClick={onBack}
                disabled={loading}
              >
                <ChevronLeft className="w-4 h-4 ml-2" />
                بازگشت و ویرایش
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
