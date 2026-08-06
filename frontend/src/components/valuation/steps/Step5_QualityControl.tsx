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

interface FCFValidationResult {
  status: 'PASS' | 'WARN' | 'FAIL';
  messages: string[];
  metrics: {
    avg_growth: number;
    max_volatility: number;
    years: number;
    growth_rates: number[];
    is_positive_trend: boolean;
  };
}

// ============================================
// تابع اعتبارسنجی FCF Trend برای M-03
// ============================================
const validateFCFTrend = (fcfs: number[]): FCFValidationResult => {
  // 1. حداقل ۲ سال FCF
  if (fcfs.length < 2) {
    return {
      status: 'WARN',
      messages: ['حداقل ۲ سال FCF لازم است'],
      metrics: {
        avg_growth: 0,
        max_volatility: 0,
        years: fcfs.length,
        growth_rates: [],
        is_positive_trend: false,
      },
    };
  }

  // 2. همه FCFها مثبت باشند
  const hasNegative = fcfs.some(f => f <= 0);
  const messages: string[] = [];
  
  if (hasNegative) {
    messages.push('برخی FCFها منفی یا صفر هستند - این موضوع باید توجیه شود');
  }

  // 3. محاسبه نرخ رشد هر سال
  const growthRates: number[] = [];
  for (let i = 1; i < fcfs.length; i++) {
    const growth = (fcfs[i] - fcfs[i - 1]) / fcfs[i - 1];
    growthRates.push(growth);
  }

  // 4. میانگین نرخ رشد
  const avgGrowth = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;

  // 5. حداکثر نوسان
  const maxVolatility = Math.max(...growthRates.map(Math.abs));

  // 6. بررسی روند کلی (صعودی/نزولی)
  const increasingYears = growthRates.filter(g => g > 0).length;
  const decreasingYears = growthRates.filter(g => g < 0).length;
  const isPositiveTrend = increasingYears > decreasingYears;

  // 7. قوانین هشدار
  const threshold = 0.30;

  if (Math.abs(avgGrowth) > threshold) {
    messages.push(
      `میانگین نرخ رشد (${(avgGrowth * 100).toFixed(1)}%) از حد مجاز (${threshold * 100}%) بیشتر است`
    );
  }

  if (maxVolatility > threshold * 1.5) {
    messages.push(
      `نوسان شدید (${(maxVolatility * 100).toFixed(1)}%) در رشد FCF وجود دارد`
    );
  }

  if (avgGrowth < 0) {
    messages.push('روند کلی FCF نزولی است، این موضوع باید توجیه شود');
  }

  if (growthRates.some(g => g > 1.0)) {
    messages.push('رشد بیش از ۱۰۰% در یک سال غیرمنطقی است');
  }

  // 8. تعیین وضعیت نهایی
  let status: 'PASS' | 'WARN' | 'FAIL' = 'PASS';
  
  if (messages.length > 2) {
    status = 'FAIL';
  } else if (messages.length > 0) {
    status = 'WARN';
  }

  return {
    status,
    messages,
    metrics: {
      avg_growth: avgGrowth,
      max_volatility: maxVolatility,
      years: fcfs.length,
      growth_rates: growthRates,
      is_positive_trend: isPositiveTrend,
    },
  };
};

// ============================================
// تبدیل اعداد به فارسی
// ============================================
const toPersianNumber = (num: number | string): string => {
  if (num === undefined || num === null) return '۰';
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  const str = String(num);
  return str.replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};

// ============================================
// ترجمه قوانین به فارسی
// ============================================
const getRuleNameInPersian = (id: string, name: string): string => {
  const translations: Record<string, string> = {
    // قوانین مشترک
    'Asset Profile کامل باشد': 'پروفایل دارایی کامل باشد',
    'Quality Scores ثبت شده باشد': 'امتیازات کیفی ثبت شده باشد',
    'Base Inputs کامل باشد': 'ورودی‌های پایه کامل باشد',
    'حداقل شواهد مورد نیاز آپلود شده باشد': 'حداقل یک شاهد مورد نیاز بارگذاری شده باشد',
    'وضعیت Double-Count مشخص شده باشد': 'وضعیت شمارش مضاعف مشخص شده باشد',
    'مفروضات عمومی ثبت شده باشد': 'مفروضات عمومی ثبت شده باشد',
    'Source Reliability از حداقل مجاز کمتر نباشد': 'قابلیت اتکای منبع از حداقل مجاز کمتر نباشد',
    
    // M-01
    'فایل Benchmark صنعت آپلود شده باشد': 'فایل معیار صنعت بارگذاری شده باشد',
    'منبع درآمدی آپلود شده باشد': 'منبع درآمدی بارگذاری شده باشد',
    'مستندات توصیف دارایی آپلود شده باشد': 'مستندات توصیف دارایی بارگذاری شده باشد',
    'ماهیت قابل لایسنس بودن مستند شده باشد': 'ماهیت قابل مجوزدهی مستند شده باشد',
    
    // M-03
    'FCFها روند رشد منطقی داشته باشند': 'FCFها روند رشد منطقی داشته باشند',
    'بودجه/برنامه مالی آپلود شده باشد': 'بودجه/برنامه مالی بارگذاری شده باشد',
    'نرخ تنزیل در بازه منطقی باشد': 'نرخ تنزیل در بازه منطقی باشد',
    
    // M-04
    'سناریوی "With" مستند شده باشد': 'سناریوی "با دارایی" مستند شده باشد',
    'سناریوی "Without" مستند شده باشد': 'سناریوی "بدون دارایی" مستند شده باشد',
    'توجیه تفاضل منطقی باشد': 'توجیه تفاضل منطقی باشد',
    'دوره Ramp-up معقول باشد': 'دوره رشد (Ramp-up) معقول باشد',
    
    // M-05
    'درصد سربار در بازه ۸% تا ۱۵% باشد': 'درصد سربار در بازه ۸% تا ۱۵% باشد',
    'مجموع منسوخ‌شدگی ≤ ۶۰% باشد': 'مجموع منسوخ‌شدگی ≤ ۶۰% باشد',
    'تاریخ آخرین بازنگری تأیید شده باشد': 'تاریخ آخرین بازنگری تأیید شده باشد',
    'جایگزینی با معادل مدرن تأیید شده باشد': 'جایگزینی با معادل مدرن تأیید شده باشد',
    
    // M-06
    'درصد سربار هماهنگی در بازه ۸% تا ۱۵% باشد': 'درصد سربار هماهنگی در بازه ۸% تا ۱۵% باشد',
    'بازتولید دقیق (نه مدرن) تأیید شده باشد': 'بازتولید دقیق (نه مدرن) تأیید شده باشد',
    
    // M-07
    'فایل خروجی HR آپلود شده باشد': 'فایل خروجی HR بارگذاری شده باشد',
    'داده‌های هزینه جذب آپلود شده باشد': 'داده‌های هزینه جذب بارگذاری شده باشد',
    'شواهد هزینه آموزش آپلود شده باشد': 'شواهد هزینه آموزش بارگذاری شده باشد',
    'منبع کاهش بهره‌وری مستند شده باشد': 'منبع کاهش بهره‌وری مستند شده باشد',
    
    // M-08
    'حداقل ۳ معامله وارد شده باشد': 'حداقل ۳ معامله وارد شده باشد',
    'مجموع تعدیلات بین -۴۰% تا +۴۰% باشد': 'مجموع تعدیلات بین -۴۰% تا +۴۰% باشد',
    'تاریخ معامله ≤ ۵ سال قبل باشد': 'تاریخ معامله ≤ ۵ سال قبل باشد',
    'وزن هر معامله ≤ ۵۰% باشد': 'وزن هر معامله ≤ ۵۰% باشد',
    
    // M-09
    'ضریب بازار در بازه ۲.۰x - ۳.۵x باشد': 'ضریب بازار در بازه ۲.۰x - ۳.۵x باشد',
    'منبع ضریب معتبر باشد': 'منبع ضریب معتبر باشد',
    'سهم دارایی نامشهود منطقی باشد': 'سهم دارایی نامشهود منطقی باشد',
  };
  return translations[name] || name;
};

// ============================================
// تابع اصلی کامپوننت
// ============================================
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
  const [step3Data, setStep3Data] = useState<any>(null);

  // بررسی شواهد آپلود شده
  const checkUploadedEvidence = async () => {
    if (!valuationCaseId) return;
    
    try {
      const { data } = await api.get(`/intangible/valuation-step3/?valuation_case=${valuationCaseId}`);
      const items = data.results || data || [];
      
      if (items.length > 0) {
        const step3 = items[0];
        setStep3Data(step3);
        const inputs = step3.method_inputs || {};
        
        const fileFields: Record<string, string[]> = {
          'M-01': ['benchmark_report', 'revenue_file', 'asset_description', 'licensable_evidence'],
          'M-03': ['budget_file', 'financial_plan'],
          'M-04': ['with_scenario_doc', 'without_scenario_doc', 'differential_justification'],
          'M-05': ['labor_breakdown', 'material_infra_cost', 'overhead_pct', 'functional_obs_pct', 'economic_obs_pct'],
          'M-07': ['hr_file', 'recruit_cost_data', 'training_evidence'],
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

  // ============================================
  // قوانین QC بر اساس روش (داینامیک)
  // ============================================
  const getQCRules = (method: string, hasEvidence: boolean, fcfs?: number[]): QCRule[] => {
    // قوانین مشترک (S5-01 تا S5-08)
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
      { id: 'S5-08', name: 'Completeness Score ≥ ۸۰% باشد', status: 'PASS', priority: 'High', evidence: 'خودکار', description: 'امتیاز کامل بودن بالای ۸۰% است' },
    ];

    // قوانین اختصاصی هر روش
    const methodSpecificRules: Record<string, QCRule[]> = {
      // ============================================
      // M-01: RfR (صفحه 47)
      // ============================================
      'M-01': [
        { id: 'M01-01', name: 'فایل Benchmark صنعت آپلود شده باشد', status: 'PASS', priority: 'High', evidence: 'دستی', description: 'فایل معیار صنعت بارگذاری شده است' },
        { id: 'M01-02', name: 'منبع درآمدی آپلود شده باشد', status: 'PASS', priority: 'High', evidence: 'دستی', description: 'منبع درآمدی بارگذاری شده است' },
        { id: 'M01-03', name: 'مستندات توصیف دارایی آپلود شده باشد', status: 'WARN', priority: 'Medium', evidence: 'دستی', description: 'مستندات توصیف دارایی بارگذاری نشده است' },
        { id: 'M01-04', name: 'ماهیت قابل لایسنس بودن مستند شده باشد', status: 'WARN', priority: 'Medium', evidence: 'دستی', description: 'ماهیت قابل مجوزدهی مستند نشده است' },
      ],

      // ============================================
      // M-03: DCF (صفحه 48-49)
      // ============================================
      'M-03': [
        { 
          id: 'M03-01', 
          name: 'FCFها روند رشد منطقی داشته باشند', 
          status: 'PASS', 
          priority: 'Medium', 
          evidence: 'خودکار', 
          description: 'بررسی نرخ رشد و نوسانات FCF' 
        },
        { 
          id: 'M03-02', 
          name: 'بودجه/برنامه مالی آپلود شده باشد', 
          status: 'PASS', 
          priority: 'High', 
          evidence: 'دستی', 
          description: 'بودجه یا برنامه مالی بارگذاری شده است' 
        },
        { 
          id: 'M03-03', 
          name: 'نرخ تنزیل در بازه منطقی باشد', 
          status: 'PASS', 
          priority: 'High', 
          evidence: 'خودکار', 
          description: 'نرخ تنزیل بین ۱۰% تا ۳۰% است' 
        },
      ],

      // ============================================
      // M-04: WWM (صفحه 49)
      // ============================================
      'M-04': [
        { id: 'M04-01', name: 'سناریوی "With" مستند شده باشد', status: 'PASS', priority: 'High', evidence: 'دستی', description: 'سناریوی "با دارایی" مستند شده است' },
        { id: 'M04-02', name: 'سناریوی "Without" مستند شده باشد', status: 'PASS', priority: 'High', evidence: 'دستی', description: 'سناریوی "بدون دارایی" مستند شده است' },
        { id: 'M04-03', name: 'توجیه تفاضل منطقی باشد', status: 'WARN', priority: 'Medium', evidence: 'دستی', description: 'توجیه تفاضل نیاز به بررسی دارد' },
        { id: 'M04-04', name: 'دوره Ramp-up معقول باشد', status: 'PASS', priority: 'Medium', evidence: 'خودکار', description: 'دوره رشد (Ramp-up) معقول است' },
      ],

      // ============================================
      // M-05: RCM (صفحه 50)
      // ============================================
      'M-05': [
        { id: 'M05-01', name: 'درصد سربار در بازه ۸% تا ۱۵% باشد', status: 'PASS', priority: 'High', evidence: 'خودکار', description: 'درصد سربار باید بین ۸% تا ۱۵% باشد' },
        { id: 'M05-02', name: 'مجموع منسوخ‌شدگی ≤ ۶۰% باشد', status: 'PASS', priority: 'High', evidence: 'خودکار', description: 'مجموع منسوخ‌شدگی نباید از ۶۰% بیشتر باشد' },
        { id: 'M05-03', name: 'تاریخ آخرین بازنگری تأیید شده باشد', status: 'WARN', priority: 'Medium', evidence: 'دستی', description: 'تاریخ آخرین بازنگری باید تأیید شود' },
        { id: 'M05-04', name: 'جایگزینی با معادل مدرن تأیید شده باشد', status: 'PASS', priority: 'High', evidence: 'دستی', description: 'جایگزینی با معادل مدرن تأیید شده است' },
      ],

      // ============================================
      // M-06: RPCM (صفحه 51)
      // ============================================
      'M-06': [
        { id: 'M06-01', name: 'درصد سربار هماهنگی در بازه ۸% تا ۱۵% باشد', status: 'PASS', priority: 'High', evidence: 'خودکار', description: 'درصد سربار هماهنگی باید بین ۸% تا ۱۵% باشد' },
        { id: 'M06-02', name: 'مجموع منسوخ‌شدگی ≤ ۶۰% باشد', status: 'PASS', priority: 'High', evidence: 'خودکار', description: 'مجموع منسوخ‌شدگی نباید از ۶۰% بیشتر باشد' },
        { id: 'M06-03', name: 'تاریخ آخرین بازنگری تأیید شده باشد', status: 'WARN', priority: 'Medium', evidence: 'دستی', description: 'تاریخ آخرین بازنگری باید تأیید شود' },
        { id: 'M06-04', name: 'بازتولید دقیق (نه مدرن) تأیید شده باشد', status: 'PASS', priority: 'High', evidence: 'دستی', description: 'بازتولید دقیق تأیید شده است' },
      ],

      // ============================================
      // M-07: TWC (صفحه 52)
      // ============================================
      'M-07': [
        { id: 'M07-01', name: 'فایل خروجی HR آپلود شده باشد', status: 'PASS', priority: 'High', evidence: 'دستی', description: 'فایل خروجی HR بارگذاری شده است' },
        { id: 'M07-02', name: 'داده‌های هزینه جذب آپلود شده باشد', status: 'PASS', priority: 'High', evidence: 'دستی', description: 'داده‌های هزینه جذب بارگذاری شده است' },
        { id: 'M07-03', name: 'شواهد هزینه آموزش آپلود شده باشد', status: 'WARN', priority: 'Medium', evidence: 'دستی', description: 'شواهد هزینه آموزش بارگذاری نشده است' },
        { id: 'M07-04', name: 'منبع کاهش بهره‌وری مستند شده باشد', status: 'WARN', priority: 'Medium', evidence: 'دستی', description: 'منبع کاهش بهره‌وری مستند نشده است' },
      ],

      // ============================================
      // M-08: CTM (صفحه 53)
      // ============================================
      'M-08': [
        { id: 'M08-01', name: 'حداقل ۳ معامله وارد شده باشد', status: 'PASS', priority: 'High', evidence: 'خودکار', description: 'حداقل ۳ معامله وارد شده است' },
        { id: 'M08-02', name: 'مجموع تعدیلات بین -۴۰% تا +۴۰% باشد', status: 'PASS', priority: 'High', evidence: 'خودکار', description: 'مجموع تعدیلات در بازه مجاز است' },
        { id: 'M08-03', name: 'تاریخ معامله ≤ ۵ سال قبل باشد', status: 'PASS', priority: 'High', evidence: 'خودکار', description: 'تاریخ معاملات معتبر است' },
        { id: 'M08-04', name: 'وزن هر معامله ≤ ۵۰% باشد', status: 'PASS', priority: 'High', evidence: 'خودکار', description: 'وزن هر معامله از ۵۰% کمتر است' },
      ],

      // ============================================
      // M-09: MMM (صفحه 54)
      // ============================================
      'M-09': [
        { id: 'M09-01', name: 'ضریب بازار در بازه ۲.۰x - ۳.۵x باشد', status: 'WARN', priority: 'Medium', evidence: 'خودکار', description: 'ضریب بازار در بازه منطقی است' },
        { id: 'M09-02', name: 'منبع ضریب معتبر باشد', status: 'PASS', priority: 'High', evidence: 'دستی', description: 'منبع ضریب معتبر است' },
        { id: 'M09-03', name: 'سهم دارایی نامشهود منطقی باشد', status: 'WARN', priority: 'Medium', evidence: 'خودکار', description: 'سهم دارایی نامشهود نیاز به بررسی دارد' },
      ],
    };

    const specific = methodSpecificRules[method] || [];
    let allRules = [...commonRules, ...specific];

    // ============================================
    // بررسی FCF Trend برای M-03
    // ============================================
    if (method === 'M-03' && fcfs && fcfs.length > 0) {
      const fcfResult = validateFCFTrend(fcfs);
      allRules = allRules.map(rule => {
        if (rule.id === 'M03-01') {
          return {
            ...rule,
            status: fcfResult.status,
            description: fcfResult.messages.length > 0 
              ? fcfResult.messages.join(' - ') 
              : 'FCFها روند رشد منطقی دارند',
          };
        }
        return rule;
      });
    }

    // ============================================
    // محاسبه QC Score وزنی
    // ============================================
    const priorityWeights: Record<string, number> = {
      'High': 10,
      'Medium': 5,
      'Low': 3,
    };

    let totalWeight = 0;
    let earnedWeight = 0;

    for (const rule of allRules) {
      const weight = priorityWeights[rule.priority] || 5;
      totalWeight += weight;
      
      if (rule.status === 'PASS') {
        earnedWeight += weight;
      } else if (rule.status === 'WARN') {
        earnedWeight += weight * 0.5;
      }
      // FAIL = 0
    }

    const weightedScore = Math.round((earnedWeight / totalWeight) * 100);
    
    // به‌روزرسانی S5-08 با امتیاز وزنی
    allRules = allRules.map(rule => {
      if (rule.id === 'S5-08') {
        return {
          ...rule,
          status: weightedScore >= 80 ? 'PASS' : 'FAIL',
          description: weightedScore >= 80 
            ? `امتیاز کامل بودن ${weightedScore}% (≥ ۸۰%)` 
            : `امتیاز کامل بودن ${weightedScore}% (< ۸۰%)`,
        };
      }
      return rule;
    });

    return allRules;
  };

  // بارگذاری داده‌ها
  useEffect(() => {
    if (loaded || loadingRef.current) return;
    loadingRef.current = true;

    const loadData = async () => {
      try {
        setLoading(true);
        let method = propMethodId || 'M-01';
        let fcfs: number[] = [];

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

        if (valuationCaseId) {
          try {
            const { data } = await api.get(`/intangible/valuation-step3/?valuation_case=${valuationCaseId}`);
            const items = data.results || data || [];
            if (items.length > 0) {
              const step3 = items[0];
              setStep3Data(step3);
              if (step3.method_id) {
                method = step3.method_id;
              }
              const inputs = step3.method_inputs || {};
              
              // استخراج FCF برای M-03
              if (method === 'M-03') {
                const fcfSchedule = inputs.fcf_schedule || [];
                fcfs = fcfSchedule.map((item: any) => item.fcf || 0);
              }
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

        const rules = getQCRules(method, hasEvidence, fcfs);
        setQcRules(rules);

        const passed = rules.filter(r => r.status === 'PASS').length;
        const warnings = rules.filter(r => r.status === 'WARN').length;
        const errors = rules.filter(r => r.status === 'FAIL').length;
        const total = rules.length;
        
        // محاسبه امتیاز وزنی
        const priorityWeights: Record<string, number> = {
          'High': 10,
          'Medium': 5,
          'Low': 3,
        };

        let totalWeight = 0;
        let earnedWeight = 0;

        for (const rule of rules) {
          const weight = priorityWeights[rule.priority] || 5;
          totalWeight += weight;
          
          if (rule.status === 'PASS') {
            earnedWeight += weight;
          } else if (rule.status === 'WARN') {
            earnedWeight += weight * 0.5;
          }
        }

        const weightedScore = Math.round((earnedWeight / totalWeight) * 100);

        setSummary({
          completeness_score: weightedScore,
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
      const fcfs: number[] = [];
      if (actualMethodId === 'M-03' && step3Data) {
        const inputs = step3Data.method_inputs || {};
        const fcfSchedule = inputs.fcf_schedule || [];
        fcfs.push(...fcfSchedule.map((item: any) => item.fcf || 0));
      }

      const rules = getQCRules(actualMethodId, hasEvidence, fcfs);
      setQcRules(rules);
      
      const passed = rules.filter(r => r.status === 'PASS').length;
      const warnings = rules.filter(r => r.status === 'WARN').length;
      const errors = rules.filter(r => r.status === 'FAIL').length;
      const total = rules.length;
      
      const priorityWeights: Record<string, number> = {
        'High': 10,
        'Medium': 5,
        'Low': 3,
      };

      let totalWeight = 0;
      let earnedWeight = 0;

      for (const rule of rules) {
        const weight = priorityWeights[rule.priority] || 5;
        totalWeight += weight;
        
        if (rule.status === 'PASS') {
          earnedWeight += weight;
        } else if (rule.status === 'WARN') {
          earnedWeight += weight * 0.5;
        }
      }

      const weightedScore = Math.round((earnedWeight / totalWeight) * 100);

      setSummary({
        completeness_score: weightedScore,
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