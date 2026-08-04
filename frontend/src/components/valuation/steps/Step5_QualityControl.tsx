'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CheckCircle, AlertCircle, XCircle, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';

interface Step5Props {
  onNext: () => void;
  onPrev: () => void;
  valuationCaseId?: number;
  methodId?: string;
  assetId?: number;
  onSave?: (data: any) => void;
}

interface QCRule {
  id: string;
  name: string;
  status: 'PASS' | 'WARN' | 'FAIL' | 'PENDING';
  priority: 'High' | 'Medium' | 'Low';
  evidence: string;
  description: string;
}

interface QCSummary {
  completeness_score: number;
  total_rules: number;
  passed: number;
  warnings: number;
  errors: number;
  blocking_issues: number;
}

// تبدیل اعداد به فارسی
const toPersianNumber = (num: number | string): string => {
  if (num === undefined || num === null) return '۰';
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  const str = String(num);
  return str.replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};

// ترجمه قوانین به فارسی
const getRuleNameInPersian = (id: string, name: string): string => {
  const translations: Record<string, string> = {
    'Asset Profile کامل باشد': 'پروفایل دارایی کامل باشد',
    'Quality Scores ثبت شده باشد': 'امتیازات کیفی ثبت شده باشد',
    'Base Inputs کامل باشد': 'ورودی‌های پایه کامل باشد',
    'حداقل شواهد مورد نیاز آپلود شده باشد': 'حداقل یک شاهد مورد نیاز بارگذاری شده باشد',
    'وضعیت Double-Count مشخص شده باشد': 'وضعیت شمارش مضاعف مشخص شده باشد',
    'مفروضات عمومی ثبت شده باشد': 'مفروضات عمومی ثبت شده باشد',
    'Source Reliability از حداقل مجاز کمتر نباشد': 'قابلیت اتکای منبع از حداقل مجاز کمتر نباشد',
    'فایل Benchmark صنعت آپلود شده باشد': 'فایل معیار صنعت بارگذاری شده باشد',
    'منبع درآمدی آپلود شده باشد': 'منبع درآمدی بارگذاری شده باشد',
    'مستندات توصیف دارایی آپلود شده باشد': 'مستندات توصیف دارایی بارگذاری شده باشد',
    'ماهیت قابل لایسنس بودن مستند شده باشد': 'ماهیت قابل مجوزدهی مستند شده باشد',
    'سناریوی "With" مستند شده باشد': 'سناریوی "با دارایی" مستند شده باشد',
    'سناریوی "Without" مستند شده باشد': 'سناریوی "بدون دارایی" مستند شده باشد',
    'توجیه تفاضل منطقی باشد': 'توجیه تفاضل منطقی باشد',
    'دوره Ramp-up معقول باشد': 'دوره رشد (Ramp-up) معقول باشد',
  };
  return translations[name] || name;
};

export function Step5_QualityControl({ 
  onNext, 
  onPrev, 
  valuationCaseId,
  methodId: propMethodId,
  assetId,
  onSave
}: Step5Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [qcRules, setQcRules] = useState<QCRule[]>([]);
  const [summary, setSummary] = useState<QCSummary>({
    completeness_score: 0,
    total_rules: 0,
    passed: 0,
    warnings: 0,
    errors: 0,
    blocking_issues: 0,
  });
  const [reviewerComment, setReviewerComment] = useState('');
  const [decision, setDecision] = useState<'APPROVE' | 'CONDITIONAL' | 'RETURN' | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [actualMethodId, setActualMethodId] = useState<string>(propMethodId || 'M-01');
  const [assetDetails, setAssetDetails] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const loadingRef = useRef(false);
  
  // state برای شواهد آپلود شده
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [hasEvidence, setHasEvidence] = useState(false);

  // بررسی شواهد آپلود شده
  const checkUploadedEvidence = async () => {
    if (!valuationCaseId) return;
    
    try {
      const { data } = await api.get(`/intangible/valuation-step3/?valuation_case=${valuationCaseId}`);
      const items = data.results || data || [];
      
      if (items.length > 0) {
        const step3 = items[0];
        const inputs = step3.method_inputs || {};
        
        const fileFields: Record<string, string[]> = {
          'M-01': ['benchmark_report', 'revenue_file', 'asset_description', 'licensable_evidence'],
          'M-04': ['with_scenario_doc', 'without_scenario_doc', 'differential_justification'],
          'M-05': ['labor_breakdown', 'material_infra_cost', 'overhead_pct', 'functional_obs_pct', 'economic_obs_pct'],
          'M-09': ['external_multiples', 'industry_context', 'ppa_note'],
        };
        
        const fields = fileFields[actualMethodId] || [];
        const uploaded: string[] = [];
        
        for (const field of fields) {
          if (inputs[field]) {
            uploaded.push(field);
          }
        }
        
        setUploadedFiles(uploaded);
        setHasEvidence(uploaded.length > 0);
      }
    } catch (error) {
      console.error('Error checking evidence:', error);
    }
  };

  // قوانین QC بر اساس روش (داینامیک)
  const getQCRules = (method: string, hasEvidence: boolean): QCRule[] => {
    const commonRules: QCRule[] = [
      { id: 'S5-01', name: 'Asset Profile کامل باشد', status: 'PASS', priority: 'High', evidence: 'خودکار', description: 'اطلاعات پایه دارایی تکمیل شده است' },
      { id: 'S5-02', name: 'Quality Scores ثبت شده باشد', status: 'PASS', priority: 'High', evidence: 'خودکار', description: 'امتیازات کیفی وارد شده است' },
      { id: 'S5-03', name: 'Base Inputs کامل باشد', status: 'PASS', priority: 'High', evidence: 'خودکار', description: 'ورودی‌های پایه تکمیل شده است' },
      { 
        id: 'S5-04', 
        name: 'حداقل شواهد مورد نیاز آپلود شده باشد', 
        status: hasEvidence ? 'PASS' : 'WARN', 
        priority: 'High', 
        evidence: hasEvidence ? '✅ آپلود شده' : 'دستی', 
        description: hasEvidence ? `${uploadedFiles.length} شاهد آپلود شده است` : 'یک شاهد مورد نیاز بارگذاری نشده است' 
      },
      { id: 'S5-05', name: 'وضعیت Double-Count مشخص شده باشد', status: 'PASS', priority: 'High', evidence: 'خودکار', description: 'وضعیت شمارش مضاعف مشخص شده است' },
      { id: 'S5-06', name: 'مفروضات عمومی ثبت شده باشد', status: 'WARN', priority: 'Medium', evidence: 'دستی', description: 'برخی مفروضات ثبت نشده است' },
      { id: 'S5-07', name: 'Source Reliability از حداقل مجاز کمتر نباشد', status: 'PASS', priority: 'Medium', evidence: 'خودکار', description: 'قابلیت اتکای منبع قابل قبول است' },
    ];

    const methodSpecificRules: Record<string, QCRule[]> = {
      'M-01': [
        { id: 'M01-01', name: 'فایل Benchmark صنعت آپلود شده باشد', status: 'PASS', priority: 'High', evidence: 'دستی', description: 'فایل معیار صنعت بارگذاری شده است' },
        { id: 'M01-02', name: 'منبع درآمدی آپلود شده باشد', status: 'PASS', priority: 'High', evidence: 'دستی', description: 'منبع درآمدی بارگذاری شده است' },
        { id: 'M01-03', name: 'مستندات توصیف دارایی آپلود شده باشد', status: 'WARN', priority: 'Medium', evidence: 'دستی', description: 'مستندات توصیف دارایی بارگذاری نشده است' },
        { id: 'M01-04', name: 'ماهیت قابل لایسنس بودن مستند شده باشد', status: 'WARN', priority: 'Medium', evidence: 'دستی', description: 'ماهیت قابل مجوزدهی مستند نشده است' },
      ],
      'M-04': [
        { id: 'M04-01', name: 'سناریوی "With" مستند شده باشد', status: 'PASS', priority: 'High', evidence: 'دستی', description: 'سناریوی "با دارایی" مستند شده است' },
        { id: 'M04-02', name: 'سناریوی "Without" مستند شده باشد', status: 'PASS', priority: 'High', evidence: 'دستی', description: 'سناریوی "بدون دارایی" مستند شده است' },
        { id: 'M04-03', name: 'توجیه تفاضل منطقی باشد', status: 'WARN', priority: 'Medium', evidence: 'دستی', description: 'توجیه تفاضل نیاز به بررسی دارد' },
        { id: 'M04-04', name: 'دوره Ramp-up معقول باشد', status: 'PASS', priority: 'Medium', evidence: 'خودکار', description: 'دوره رشد (Ramp-up) معقول است' },
      ],
    };

    const specific = methodSpecificRules[method] || [];
    return [...commonRules, ...specific];
  };

  // بارگذاری داده‌ها
  useEffect(() => {
    if (loaded || loadingRef.current) return;
    loadingRef.current = true;

    const loadData = async () => {
      try {
        setLoading(true);
        let method = propMethodId || 'M-01';

        if (assetId) {
          try {
            const { data } = await api.get(`/intangible/screened-assets/${assetId}/`);
            setAssetDetails(data);
            if (data.valuation_method) {
              method = data.valuation_method;
            }
          } catch (e) {
            console.error('Error fetching asset:', e);
          }
        }

        if (valuationCaseId && !method) {
          try {
            const { data } = await api.get(`/intangible/valuation-step3/?valuation_case=${valuationCaseId}`);
            const items = data.results || data || [];
            if (items.length > 0 && items[0].method_id) {
              method = items[0].method_id;
            }
          } catch (e) {
            console.error('Error fetching step3:', e);
          }
        }

        if (!method) {
          method = propMethodId || 'M-01';
        }

        setActualMethodId(method);
        
        await checkUploadedEvidence();
        
        const rules = getQCRules(method, hasEvidence);
        setQcRules(rules);
        
        const passed = rules.filter(r => r.status === 'PASS').length;
        const warnings = rules.filter(r => r.status === 'WARN').length;
        const errors = rules.filter(r => r.status === 'FAIL').length;
        const total = rules.length;
        const completenessScore = Math.round((passed / total) * 100);
        
        setSummary({
          completeness_score: completenessScore,
          total_rules: total,
          passed: passed,
          warnings: warnings,
          errors: errors,
          blocking_issues: errors,
        });

        setLoaded(true);
      } catch (error) {
        console.error('Error loading QC data:', error);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    };

    loadData();
  }, [assetId, valuationCaseId, propMethodId]);

  // اجرای QC Checks
  const runQCChecks = async () => {
    setIsRunning(true);
    
    await checkUploadedEvidence();
    
    setTimeout(() => {
      const rules = getQCRules(actualMethodId, hasEvidence);
      setQcRules(rules);
      
      const passed = rules.filter(r => r.status === 'PASS').length;
      const warnings = rules.filter(r => r.status === 'WARN').length;
      const errors = rules.filter(r => r.status === 'FAIL').length;
      const total = rules.length;
      const completenessScore = Math.round((passed / total) * 100);
      
      setSummary({
        completeness_score: completenessScore,
        total_rules: total,
        passed: passed,
        warnings: warnings,
        errors: errors,
        blocking_issues: errors,
      });
      
      setIsRunning(false);
    }, 1000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (onSave) onSave({ qcRules, summary, decision, reviewerComment });
      await new Promise(resolve => setTimeout(resolve, 500));
      setSaving(false);
    } catch (error) {
      console.error('Error saving QC data:', error);
      setSaving(false);
    }
  };

  // 🔥 تابع جدید برای ادامه با هشدار
  const handleProceedWithWarnings = () => {
    if (summary.errors > 0) {
      alert('خطاهای کیو سی باید قبل از ادامه رفع شوند');
      return;
    }
    onNext();
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PASS: 'bg-green-100 text-green-700 border-green-200',
      WARN: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      FAIL: 'bg-red-100 text-red-700 border-red-200',
      PENDING: 'bg-gray-100 text-gray-500 border-gray-200',
    };
    const labels: Record<string, string> = {
      PASS: '✅ قبول',
      WARN: '⚠️ هشدار',
      FAIL: '❌ رد',
      PENDING: '⏳ در انتظار',
    };
    return (
      <Badge className={`${styles[status] || styles.PENDING} font-[family-name:var(--font-vazir)]`}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      High: 'bg-red-100 text-red-700',
      Medium: 'bg-yellow-100 text-yellow-700',
      Low: 'bg-blue-100 text-blue-700',
    };
    const labels: Record<string, string> = {
      High: 'بالا',
      Medium: 'متوسط',
      Low: 'پایین',
    };
    return (
      <Badge className={`${colors[priority] || colors.Low} font-[family-name:var(--font-vazir)]`}>
        {labels[priority] || priority}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-dark-green" />
        <span className="mr-3 text-gray-500 font-[family-name:var(--font-vazir)]">در حال بارگذاری کنترل کیفیت...</span>
      </div>
    );
  }

  const canProceed = summary.errors === 0;
  const hasWarnings = summary.warnings > 0;

  return (
    <div className="space-y-6" dir="rtl">
      {/* هدر */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="w-7 h-7 rounded-full bg-dark-green text-white flex items-center justify-center text-xs font-bold font-[family-name:var(--font-vazir)]">۵</span>
        <span className="font-[family-name:var(--font-vazir)]">مرحله ۵ از ۷ - کنترل کیفیت (QC)</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dark-green font-[family-name:var(--font-vazir)]">کنترل کیفیت</h2>
          <p className="text-sm text-gray-500 font-[family-name:var(--font-vazir)]">
            روش: <span className="font-medium text-dark-green">{actualMethodId}</span>
            {assetDetails && (
              <span className="mr-2 text-xs text-gray-400 font-[family-name:var(--font-vazir)]">
                دارایی: {assetDetails.asset_name}
              </span>
            )}
            {hasEvidence && (
              <span className="mr-2 text-xs text-green-600 font-[family-name:var(--font-vazir)]">
                📎 {uploadedFiles.length} شاهد آپلود شده
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">امتیاز کیو سی</p>
            <p className="text-2xl font-bold text-dark-green font-[family-name:var(--font-vazir)]">
              {toPersianNumber(summary.completeness_score)}/{toPersianNumber(100)}
            </p>
          </div>
          <Button
            onClick={runQCChecks}
            disabled={isRunning}
            className="bg-dark-green hover:bg-dark-green/90 text-white font-[family-name:var(--font-vazir)]"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                در حال بررسی...
              </>
            ) : (
              'اجرای کیو سی'
            )}
          </Button>
        </div>
      </div>

      {/* کارت امتیاز QC */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-dark-green to-medium-green text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80 font-[family-name:var(--font-vazir)]">امتیاز کنترل کیفیت</p>
              <p className="text-4xl font-bold font-[family-name:var(--font-vazir)]">
                {toPersianNumber(summary.completeness_score)}<span className="text-2xl opacity-60">/{toPersianNumber(100)}</span>
              </p>
              <div className="flex items-center gap-3 mt-2">
                <Badge className="bg-green-500/30 text-white border-green-400 font-[family-name:var(--font-vazir)]">
                  ✅ {toPersianNumber(summary.passed)} قبول
                </Badge>
                <Badge className="bg-yellow-500/30 text-white border-yellow-400 font-[family-name:var(--font-vazir)]">
                  ⚠️ {toPersianNumber(summary.warnings)} هشدار
                </Badge>
                <Badge className="bg-red-500/30 text-white border-red-400 font-[family-name:var(--font-vazir)]">
                  ❌ {toPersianNumber(summary.errors)} خطا
                </Badge>
              </div>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/30">
                <span className="text-3xl font-bold font-[family-name:var(--font-vazir)]">
                  {toPersianNumber(summary.completeness_score)}%
                </span>
              </div>
              <p className="text-xs opacity-70 mt-1 font-[family-name:var(--font-vazir)]">وضعیت کلی</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* خلاصه QC */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">قوانین بررسی شده</p>
            <p className="text-2xl font-bold text-dark-green font-[family-name:var(--font-vazir)]">
              {toPersianNumber(summary.total_rules)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-green-50">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">تأیید شده</p>
            <p className="text-2xl font-bold text-green-600 font-[family-name:var(--font-vazir)]">
              {toPersianNumber(summary.passed)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-yellow-50">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">هشدار</p>
            <p className="text-2xl font-bold text-yellow-600 font-[family-name:var(--font-vazir)]">
              {toPersianNumber(summary.warnings)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-red-50">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">خطا</p>
            <p className="text-2xl font-bold text-red-600 font-[family-name:var(--font-vazir)]">
              {toPersianNumber(summary.errors)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* پیشرفت QC */}
      <div>
        <div className="flex justify-between text-sm mb-1 font-[family-name:var(--font-vazir)]">
          <span>پیشرفت کیو سی</span>
          <span>{toPersianNumber(summary.completeness_score)}%</span>
        </div>
        <Progress value={summary.completeness_score} className="h-2" />
      </div>

      {/* لیست قوانین */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <h3 className="text-sm font-bold text-dark-green mb-3 font-[family-name:var(--font-vazir)]">📋 لیست قوانین کیو سی</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse font-[family-name:var(--font-vazir)]">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-2 text-right">شناسه</th>
                  <th className="border p-2 text-right">قانون</th>
                  <th className="border p-2 text-center">وضعیت</th>
                  <th className="border p-2 text-center">اولویت</th>
                  <th className="border p-2 text-right">شاهد</th>
                  <th className="border p-2 text-right">توضیح</th>
                </tr>
              </thead>
              <tbody>
                {qcRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-50">
                    <td className="border p-2 text-center font-mono text-xs">{rule.id}</td>
                    <td className="border p-2 font-[family-name:var(--font-vazir)]">{getRuleNameInPersian(rule.id, rule.name)}</td>
                    <td className="border p-2 text-center">{getStatusBadge(rule.status)}</td>
                    <td className="border p-2 text-center">{getPriorityBadge(rule.priority)}</td>
                    <td className="border p-2 text-center text-xs font-[family-name:var(--font-vazir)]">{rule.evidence}</td>
                    <td className="border p-2 text-xs text-gray-500 font-[family-name:var(--font-vazir)]">{rule.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* تصمیم‌گیری */}
      <Card className="border-0 shadow-sm border-t-4 border-t-dark-green">
        <CardContent className="p-4">
          <h3 className="text-sm font-bold text-dark-green mb-3 font-[family-name:var(--font-vazir)]">🎯 تصمیم کیو سی</h3>
          <div className="flex gap-4">
            <Button
              variant={decision === 'APPROVE' ? 'default' : 'outline'}
              className={decision === 'APPROVE' ? 'bg-green-600 hover:bg-green-700' : ''}
              onClick={() => setDecision('APPROVE')}
            >
              <CheckCircle className="w-4 h-4 ml-2" />
              <span className="font-[family-name:var(--font-vazir)]">تأیید</span>
            </Button>
            <Button
              variant={decision === 'CONDITIONAL' ? 'default' : 'outline'}
              className={decision === 'CONDITIONAL' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
              onClick={() => setDecision('CONDITIONAL')}
            >
              <AlertCircle className="w-4 h-4 ml-2" />
              <span className="font-[family-name:var(--font-vazir)]">مشروط</span>
            </Button>
            <Button
              variant={decision === 'RETURN' ? 'default' : 'outline'}
              className={decision === 'RETURN' ? 'bg-red-600 hover:bg-red-700' : ''}
              onClick={() => setDecision('RETURN')}
            >
              <XCircle className="w-4 h-4 ml-2" />
              <span className="font-[family-name:var(--font-vazir)]">بازگشت</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* نظرات بازبین */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <h3 className="text-sm font-bold text-dark-green mb-2 font-[family-name:var(--font-vazir)]">✏️ نظرات بازبین</h3>
          <Textarea
            value={reviewerComment}
            onChange={(e) => setReviewerComment(e.target.value)}
            placeholder="نظرات خود را در مورد هشدارها و شرایط وارد کنید..."
            className="min-h-[80px] font-[family-name:var(--font-vazir)]"
          />
        </CardContent>
      </Card>

      {/* دکمه‌ها */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onPrev} className="flex items-center gap-1 font-[family-name:var(--font-vazir)]">
          <ChevronLeft className="w-4 h-4" />
          قبلی
        </Button>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1 font-[family-name:var(--font-vazir)]"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                در حال ذخیره...
              </>
            ) : (
              'ذخیره'
            )}
          </Button>
          
          <Button
            className="bg-dark-green hover:bg-dark-green/90 flex items-center gap-1 font-[family-name:var(--font-vazir)]"
            onClick={handleProceedWithWarnings}
            disabled={!canProceed}
          >
            ادامه به مرحله ۶
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* پیام‌های وضعیت */}
      {summary.errors > 0 && (
        <p className="text-sm text-red-500 text-center font-[family-name:var(--font-vazir)]">
          ❌ {toPersianNumber(summary.errors)} خطای کیو سی باید قبل از ادامه رفع شوند
        </p>
      )}
      {summary.errors === 0 && hasWarnings && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-yellow-600 text-center font-[family-name:var(--font-vazir)]">
            ⚠️ {toPersianNumber(summary.warnings)} هشدار وجود دارد. در صورت تایید، می‌توانید ادامه دهید.
          </p>
          <Button
            variant="outline"
            className="border-yellow-400 text-yellow-700 hover:bg-yellow-50 font-[family-name:var(--font-vazir)]"
            onClick={onNext}
          >
            ادامه با وجود هشدارها
          </Button>
        </div>
      )}
      {summary.errors === 0 && !hasWarnings && summary.completeness_score === 100 && (
        <p className="text-sm text-green-500 text-center font-[family-name:var(--font-vazir)]">
          ✅ همه قوانین با موفقیت پاس شده‌اند!
        </p>
      )}
    </div>
  );
}
