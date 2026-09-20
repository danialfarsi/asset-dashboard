
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CheckCircle, AlertCircle, XCircle, Loader2, ShieldCheck, RefreshCw, ClipboardCheck, CircleCheckBig, TriangleAlert, CircleX, Save, MessageSquareText, Sparkles, FileCheck2, Gauge, ArrowUpLeft, Info, Activity } from 'lucide-react';
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

// 🆕 interface برای نتیجه اعتبارسنجی Backend
interface BackendValidationResult {
  decision: 'APPROVE' | 'CONDITIONAL' | 'RETURN';
  can_proceed: boolean;
  completeness_score: number;
  passed_count: number;
  issues_count: number;
  warnings_count: number;
  passed: Array<{ field: string; label: string; message: string }>;
  issues: Array<{ field: string; label: string; message: string; hint: string; severity: string }>;
  warnings: Array<{ field: string; label: string; message: string; hint: string; severity: string }>;
}

const toPersianNumber = (num: number | string): string => {
  if (num === undefined || num === null) return '۰';
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  const str = String(num);
  return str.replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};

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
    'درصد سربار در بازه ۸% تا ۱۵% باشد': 'درصد سربار در بازه ۸% تا ۱۵% باشد',
    'مجموع استهلاک ≤ ۶۰% باشد': 'مجموع استهلاک ≤ ۶۰% باشد',
    'تاریخ آخرین بازنگری تأیید شده باشد': 'تاریخ آخرین بازنگری تأیید شده باشد',
    'جایگزینی با معادل مدرن تأیید شده باشد': 'جایگزینی با معادل مدرن تأیید شده باشد',
    'درصد سربار هماهنگی در بازه ۸% تا ۱۵% باشد': 'درصد سربار هماهنگی در بازه ۸% تا ۱۵% باشد',
    'بازتولید دقیق (نه مدرن) تأیید شده باشد': 'بازتولید دقیق (نه مدرن) تأیید شده باشد',
    'فایل خروجی HR آپلود شده باشد': 'فایل خروجی HR بارگذاری شده باشد',
    'داده‌های هزینه جذب آپلود شده باشد': 'داده‌های هزینه جذب بارگذاری شده باشد',
    'شواهد هزینه آموزش آپلود شده باشد': 'شواهد هزینه آموزش بارگذاری شده باشد',
    'منبع کاهش بهره‌وری مستند شده باشد': 'منبع کاهش بهره‌وری مستند شده باشد',
    'حداقل ۳ معامله وارد شده باشد': 'حداقل ۳ معامله وارد شده باشد',
    'مجموع تعدیلات بین -۴۰% تا +۴۰% باشد': 'مجموع تعدیلات بین -۴۰% تا +۴۰% باشد',
    'تاریخ معامله ≤ ۵ سال قبل باشد': 'تاریخ معامله ≤ ۵ سال قبل باشد',
    'وزن هر معامله ≤ ۵۰% باشد': 'وزن هر معامله ≤ ۵۰% باشد',
    'ضریب بازار در بازه ۲.۰x - ۳.۵x باشد': 'ضریب بازار در بازه ۲.۰x - ۳.۵x باشد',
    'منبع ضریب معتبر باشد': 'منبع ضریب معتبر باشد',
    'سهم دارایی نامشهود منطقی باشد': 'سهم دارایی نامشهود منطقی باشد',
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
  
  const [step2Data, setStep2Data] = useState<any>(null);
  const [step3Data, setStep3Data] = useState<any>(null);
  const [step3Evidences, setStep3Evidences] = useState<any[]>([]);
  const [step2Evidences, setStep2Evidences] = useState<any[]>([]);
  const [step3Inputs, setStep3Inputs] = useState<any>({});

  // 🆕 state برای نتیجه اعتبارسنجی Backend
  const [backendValidation, setBackendValidation] = useState<BackendValidationResult | null>(null);
  const [backendValidating, setBackendValidating] = useState(false);

  // ============================================
  // 🔥 قوانین QC - با داده‌های واقعی از STEP 2 و STEP 3
  // ============================================
  const getQCRules = (
    method: string,
    step2Data: any,
    step3Inputs: any,
    assetDetails: any,
    step2Evidences: any[],
    step3Evidences: any[]
  ): QCRule[] => {
    const inputs = step3Inputs || {};
    
    // 📍 بررسی داده‌های STEP 2
    const hasAssetProfile = assetDetails && assetDetails.asset_name && assetDetails.asset_uid;
    const hasQualityScores = step2Data && step2Data.final_score !== undefined;
    const hasBaseInputs = step2Data && step2Data.tax_rate && step2Data.discount_rate;
    const hasSourceReliability = step2Data && step2Data.source_reliability && step2Data.source_reliability !== 'low';
    const hasDoubleCount = step2Data && step2Data.overlap_risk_level;
    const hasAssumptions = step2Data && step2Data.assumptions && step2Data.assumptions.length > 0;
    
    // 📍 بررسی فایل‌های STEP 3
    const hasWithScenarioFile = step3Evidences.some((e: any) => 
      e.evidence_type === 'm04_with_scenario' || 
      e.evidence_type === 'with_scenario'
    );
    
    const hasWithoutScenarioFile = step3Evidences.some((e: any) => 
      e.evidence_type === 'm04_without_scenario' || 
      e.evidence_type === 'without_scenario'
    );
    
    const hasAnyFile = step2Evidences.length > 0 || step3Evidences.length > 0;
    const totalFiles = step2Evidences.length + step3Evidences.length;

    console.log('🔍 تشخیص داده‌ها برای QC:');
    console.log('  STEP 2 فایل‌ها:', step2Evidences.length);
    console.log('  STEP 3 فایل‌ها:', step3Evidences.length);
    console.log('  hasWithScenarioFile:', hasWithScenarioFile);
    console.log('  hasWithoutScenarioFile:', hasWithoutScenarioFile);

    // قوانین عمومی (از STEP 2)
    const commonRules: QCRule[] = [
      { 
        id: 'S5-01', 
        name: 'Asset Profile کامل باشد', 
        status: hasAssetProfile ? 'PASS' : 'FAIL',
        priority: 'High', 
        evidence: hasAssetProfile ? '✅ موجود' : 'خودکار', 
        description: hasAssetProfile ? 'اطلاعات پایه دارایی تکمیل شده است' : 'اطلاعات پایه دارایی کامل نیست' 
      },
      { 
        id: 'S5-02', 
        name: 'Quality Scores ثبت شده باشد', 
        status: hasQualityScores ? 'PASS' : 'WARN',
        priority: 'High', 
        evidence: hasQualityScores ? '✅ ثبت شده' : 'خودکار', 
        description: hasQualityScores ? 'امتیازات کیفی وارد شده است' : 'امتیازات کیفی وارد نشده است' 
      },
      { 
        id: 'S5-03', 
        name: 'Base Inputs کامل باشد', 
        status: hasBaseInputs ? 'PASS' : 'FAIL',
        priority: 'High', 
        evidence: hasBaseInputs ? '✅ تکمیل' : 'خودکار', 
        description: hasBaseInputs ? 'ورودی‌های پایه تکمیل شده است' : 'ورودی‌های پایه تکمیل نشده است' 
      },
      { 
        id: 'S5-04', 
        name: 'حداقل شواهد مورد نیاز آپلود شده باشد', 
        status: hasAnyFile ? 'PASS' : 'WARN',
        priority: 'High', 
        evidence: hasAnyFile ? `✅ ${totalFiles} فایل` : 'دستی', 
        description: hasAnyFile ? `${totalFiles} شاهد آپلود شده است` : 'یک شاهد مورد نیاز بارگذاری نشده است' 
      },
      { 
        id: 'S5-05', 
        name: 'وضعیت Double-Count مشخص شده باشد', 
        status: hasDoubleCount ? 'PASS' : 'WARN',
        priority: 'High', 
        evidence: hasDoubleCount ? '✅ مشخص شده' : 'خودکار', 
        description: hasDoubleCount ? 'وضعیت شمارش مضاعف مشخص شده است' : 'وضعیت شمارش مضاعف مشخص نشده است' 
      },
      { 
        id: 'S5-06', 
        name: 'مفروضات عمومی ثبت شده باشد', 
        status: hasAssumptions ? 'PASS' : 'WARN',
        priority: 'Medium', 
        evidence: hasAssumptions ? '✅ ثبت شده' : 'دستی', 
        description: hasAssumptions ? 'مفروضات عمومی ثبت شده است' : 'برخی مفروضات ثبت نشده است' 
      },
      { 
        id: 'S5-07', 
        name: 'Source Reliability از حداقل مجاز کمتر نباشد', 
        status: hasSourceReliability ? 'PASS' : 'WARN',
        priority: 'Medium', 
        evidence: hasSourceReliability ? '✅ قابل قبول' : 'خودکار', 
        description: hasSourceReliability ? 'قابلیت اتکای منبع قابل قبول است' : 'قابلیت اتکای منبع پایین است' 
      },
      { 
        id: 'S5-08', 
        name: 'Completeness Score ≥ ۸۰% باشد', 
        status: 'PENDING',
        priority: 'High', 
        evidence: 'خودکار', 
        description: 'امتیاز کامل بودن محاسبه خواهد شد' 
      },
    ];

    // 🔥 قوانین اختصاصی M-04
    const methodSpecificRules: Record<string, QCRule[]> = {
      'M-04': [
        { 
          id: 'M04-01', 
          name: 'سناریوی "با دارایی" مستند شده باشد', 
          status: hasWithScenarioFile ? 'PASS' : 'FAIL', 
          priority: 'High', 
          evidence: hasWithScenarioFile ? '✅ آپلود شده' : 'دستی', 
          description: hasWithScenarioFile ? 'سناریوی "با دارایی" مستند شده است' : 'سناریوی "با دارایی" مستند نشده است' 
        },
        { 
          id: 'M04-02', 
          name: 'سناریوی "بدون دارایی" مستند شده باشد', 
          status: hasWithoutScenarioFile ? 'PASS' : 'FAIL', 
          priority: 'High', 
          evidence: hasWithoutScenarioFile ? '✅ آپلود شده' : 'دستی', 
          description: hasWithoutScenarioFile ? 'سناریوی "بدون دارایی" مستند شده است' : 'سناریوی "بدون دارایی" مستند نشده است' 
        },
        { 
          id: 'M04-03', 
          name: 'توجیه تفاضل منطقی باشد', 
          status: inputs.differential_justification ? 'PASS' : 'WARN', 
          priority: 'Medium', 
          evidence: inputs.differential_justification ? '✅ ثبت شده' : 'دستی', 
          description: inputs.differential_justification ? 'توجیه تفاضل ثبت شده است' : 'توجیه تفاضل ثبت نشده است' 
        },
        { 
          id: 'M04-04', 
          name: 'دوره رشد (Ramp-up) معقول باشد', 
          status: inputs.ramp_up_period && inputs.ramp_up_period > 0 ? 'PASS' : 'WARN', 
          priority: 'Medium', 
          evidence: 'خودکار', 
          description: inputs.ramp_up_period && inputs.ramp_up_period > 0 ? 'دوره رشد (Ramp-up) معقول است' : 'دوره رشد (Ramp-up) نامشخص است' 
        },
      ],
      'M-01': [
        { id: 'M01-01', name: 'نرخ حق‌الامتیاز وارد شده باشد', status: inputs.royalty_rate ? 'PASS' : 'FAIL', priority: 'High', evidence: inputs.royalty_rate ? `✅ ${inputs.royalty_rate}%` : 'خودکار', description: inputs.royalty_rate ? `نرخ حق‌الامتیاز ${inputs.royalty_rate}% وارد شده است` : 'نرخ حق‌الامتیاز وارد نشده است' },
      ],
    };

    const specific = methodSpecificRules[method] || [];
    let allRules = [...commonRules, ...specific];

    // محاسبه امتیاز وزنی
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
    }

    const weightedScore = Math.round((earnedWeight / totalWeight) * 100);
    
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

  // ============================================
  // 🆕 اجرای اعتبارسنجی Backend (endpoint جدید)
  // ============================================
  const runBackendValidation = async () => {
    if (!valuationCaseId) return;
    
    setBackendValidating(true);
    try {
      const { data } = await api.post('/intangible/valuation-qc/validate/', {
        valuation_case: valuationCaseId,
      });
      setBackendValidation(data);
      console.log('✅ Backend validation:', data);
    } catch (e) {
      console.error('❌ Backend validation error:', e);
    } finally {
      setBackendValidating(false);
    }
  };

  // ============================================
  // بارگذاری داده‌ها از دیتابیس
  // ============================================
  useEffect(() => {
    if (loaded || loadingRef.current) return;
    loadingRef.current = true;

    const loadData = async () => {
      try {
        setLoading(true);
        
        let method = propMethodId || 'M-01';
        let step2DataRaw = null;
        let step3InputsRaw = {};
        let assetData = null;
        let step2EvidenceList: any[] = [];
        let step3EvidenceList: any[] = [];

        console.log('🔍 بارگذاری QC با:')
        console.log('  propMethodId:', propMethodId)
        console.log('  valuationCaseId:', valuationCaseId)
        console.log('  assetId:', assetId)

        // ۱. دریافت اطلاعات دارایی
        if (assetId) {
          try {
            const { data } = await api.get(`/intangible/screened-assets/${assetId}/`);
            assetData = data;
            setAssetDetails(data);
            if (data.valuation_method) {
              method = data.valuation_method;
            }
            console.log('✅ اطلاعات دارایی:', assetData);
          } catch (e) {
            console.error('Error fetching asset:', e);
          }
        }

        // ۲. دریافت STEP 2 (ValuationCase)
        if (valuationCaseId) {
          try {
            const { data } = await api.get(`/intangible/valuation-cases/${valuationCaseId}/`);
            step2DataRaw = data;
            setStep2Data(data);
            console.log('✅ STEP 2 داده‌ها:', step2DataRaw);
          } catch (e) {
            console.error('Error fetching step2:', e);
          }
        }

        // ۳. دریافت STEP 3 (پارامترهای اختصاصی روش)
        let step3Id = null;
        if (valuationCaseId) {
          try {
            const { data } = await api.get(`/intangible/valuation-step3/?valuation_case=${valuationCaseId}`);
            const items = data.results || data || [];
            const filteredItems = items.filter((item: any) => item.valuation_case === valuationCaseId);
            
            if (filteredItems.length > 0) {
              const step3 = filteredItems[0];
              step3Id = step3.id;
              setStep3Data(step3);
              if (step3.method_id) {
                method = step3.method_id;
                console.log(`✅ روش از STEP 3: ${method}`);
              }
              step3InputsRaw = step3.method_inputs || {};
              setStep3Inputs(step3InputsRaw);
              console.log('✅ STEP 3 داده‌ها (method_inputs):', step3InputsRaw);
            } else {
              console.log(`ℹ️ هیچ STEP 3 برای valuation_case ${valuationCaseId} یافت نشد`);
            }
          } catch (e) {
            console.error('Error fetching step3:', e);
          }
        }

        // ۴. دریافت شواهد STEP 2 (فایل‌های AssetFile)
        if (assetId) {
          try {
            const { data } = await api.get(`/intangible/asset-files/?asset=${assetId}`);
            const items = data.results || data || [];
            step2EvidenceList = items;
            setStep2Evidences(items);
            console.log(`✅ ${items.length} شاهد STEP 2 از دیتابیس بارگذاری شد`);
          } catch (e) {
            console.error('Error fetching step2 evidences:', e);
          }
        }

        // ۵. 🔥 دریافت شواهد STEP 3 (فایل‌های ValuationStep3Evidence)
        if (step3Id) {
          try {
            const { data } = await api.get(`/intangible/valuation-step3/${step3Id}/evidences/`);
            const items = data.results || data || [];
            step3EvidenceList = items;
            setStep3Evidences(items);
            console.log(`✅ ${items.length} شاهد STEP 3 از دیتابیس بارگذاری شد`);
            items.forEach((f: any) => {
              console.log(`   📄 STEP3 - ${f.file_name} (${f.evidence_type})`);
            });
          } catch (e) {
            console.error('Error fetching step3 evidences:', e);
          }
        }

        if (!method) {
          method = propMethodId || 'M-01';
        }

        setActualMethodId(method);
        console.log('✅ روش نهایی برای QC:', method);

        // 🔥 ساخت قوانین با داده‌های واقعی از هر دو منبع
        const rules = getQCRules(
          method, 
          step2DataRaw, 
          step3InputsRaw, 
          assetData, 
          step2EvidenceList,
          step3EvidenceList
        );
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

        setLoaded(true);

        // 🆕 اجرای خودکار اعتبارسنجی Backend
        if (valuationCaseId) {
          try {
            const { data: bvData } = await api.post('/intangible/valuation-qc/validate/', {
              valuation_case: valuationCaseId,
            });
            setBackendValidation(bvData);
            console.log('✅ Backend validation result:', bvData);
          } catch (e) {
            console.error('❌ Backend validation error:', e);
          }
        }
      } catch (error) {
        console.error('Error loading QC data:', error);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    };

    loadData();
  }, [assetId, valuationCaseId, propMethodId]);

  // اجرای مجدد QC Checks
  const runQCChecks = async () => {
    setIsRunning(true);
    
    if (valuationCaseId && assetId) {
      try {
        let step2DataRaw = null;
        let step3InputsRaw = {};
        let assetData = null;
        let step2EvidenceList: any[] = [];
        let step3EvidenceList: any[] = [];
        let step3Id = null;

        // دریافت اطلاعات دارایی
        try {
          const { data } = await api.get(`/intangible/screened-assets/${assetId}/`);
          assetData = data;
          setAssetDetails(data);
        } catch (e) {
          console.error('Error fetching asset:', e);
        }

        // دریافت STEP 2
        try {
          const { data } = await api.get(`/intangible/valuation-cases/${valuationCaseId}/`);
          step2DataRaw = data;
          setStep2Data(data);
        } catch (e) {
          console.error('Error fetching step2:', e);
        }

        // دریافت STEP 3
        try {
          const { data } = await api.get(`/intangible/valuation-step3/?valuation_case=${valuationCaseId}`);
          const items = data.results || data || [];
          const filteredItems = items.filter((item: any) => item.valuation_case === valuationCaseId);
          
          if (filteredItems.length > 0) {
            const step3 = filteredItems[0];
            step3Id = step3.id;
            setStep3Data(step3);
            if (step3.method_id) {
              setActualMethodId(step3.method_id);
            }
            step3InputsRaw = step3.method_inputs || {};
            setStep3Inputs(step3InputsRaw);
          }
        } catch (e) {
          console.error('Error fetching step3:', e);
        }

        // دریافت شواهد STEP 2
        try {
          const { data } = await api.get(`/intangible/asset-files/?asset=${assetId}`);
          const items = data.results || data || [];
          step2EvidenceList = items;
          setStep2Evidences(items);
        } catch (e) {
          console.error('Error fetching step2 evidences:', e);
        }

        // 🔥 دریافت شواهد STEP 3
        if (step3Id) {
          try {
            const { data } = await api.get(`/intangible/valuation-step3/${step3Id}/evidences/`);
            const items = data.results || data || [];
            step3EvidenceList = items;
            setStep3Evidences(items);
            console.log(`✅ ${items.length} شاهد STEP 3 بارگذاری شد`);
          } catch (e) {
            console.error('Error fetching step3 evidences:', e);
          }
        }

        const method = actualMethodId || propMethodId || 'M-01';
        const rules = getQCRules(
          method, 
          step2DataRaw, 
          step3InputsRaw, 
          assetData, 
          step2EvidenceList,
          step3EvidenceList
        );
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

        // 🆕 اجرای مجدد اعتبارسنجی Backend
        try {
          const { data: bvData } = await api.post('/intangible/valuation-qc/validate/', {
            valuation_case: valuationCaseId,
          });
          setBackendValidation(bvData);
          console.log('✅ Backend validation (re-run):', bvData);
        } catch (e) {
          console.error('❌ Backend validation error:', e);
        }
      } catch (error) {
        console.error('Error running QC checks:', error);
      }
    }
    
    setIsRunning(false);
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
    // 🆕 چک نهایی از Backend
    if (backendValidation && !backendValidation.can_proceed) {
      alert(`❌ ثبت پرونده امکان‌پذیر نیست.\n\n${backendValidation.issues_count} مورد ناقص:\n${backendValidation.issues.map(i => `• ${i.label}: ${i.message}`).join('\n')}`);
      return;
    }
    if (summary.errors > 0) {
      alert('خطاهای QC باید قبل از ادامه رفع شوند');
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

  // 🆕 تصمیم نهایی از Backend (اگه موجود باشه) وگرنه از فرانت
  const canProceed = backendValidation 
    ? backendValidation.can_proceed 
    : summary.errors === 0;
  const hasWarnings = summary.warnings > 0;

  const scoreTone = summary.completeness_score >= 80
    ? { ring: '#059669', soft: 'bg-emerald-50', text: 'text-emerald-700', label: 'مطلوب' }
    : summary.completeness_score >= 60
      ? { ring: '#d97706', soft: 'bg-amber-50', text: 'text-amber-700', label: 'نیازمند بررسی' }
      : { ring: '#dc2626', soft: 'bg-red-50', text: 'text-red-700', label: 'نیازمند اصلاح' };

  const scoreDegrees = Math.min(Math.max(summary.completeness_score, 0), 100) * 3.6;

  return (
    <div
      dir="rtl"
      className="relative space-y-6 overflow-hidden rounded-[28px] bg-[#f7f9f8] p-3 font-[family-name:var(--font-vazir)] sm:p-5 lg:p-7"
    >
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 overflow-hidden">
        <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-emerald-200/20 blur-3xl" />
        <div className="absolute left-0 top-4 h-64 w-64 rounded-full bg-teal-100/30 blur-3xl" />
      </div>

      {/* Top command panel */}
      <section className="relative overflow-hidden rounded-[26px] border border-emerald-900/10 bg-white/95 shadow-[0_18px_55px_-35px_rgba(6,78,59,0.45)] backdrop-blur-xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-emerald-700 via-emerald-500 to-teal-400" />
        <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between lg:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-950 text-white shadow-lg shadow-emerald-950/15">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">مرحله ۵ از ۷</span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-500">روش {actualMethodId}</span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">کنترل کیفیت و اعتبارسنجی پرونده</h2>
              <p className="mt-1.5 max-w-2xl text-sm leading-7 text-slate-500">
                کنترل یکپارچگی داده‌ها، شواهد و الزامات روش ارزش‌گذاری
                {assetDetails?.asset_name && <span className="font-bold text-slate-700"> · {assetDetails.asset_name}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-stretch sm:self-auto">
            <div className="hidden min-w-[112px] rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-2.5 text-center sm:block">
              <p className="text-[10px] font-bold text-slate-400">امتیاز فعلی</p>
              <p className="mt-0.5 text-xl font-black text-emerald-800">{toPersianNumber(summary.completeness_score)}<span className="text-xs text-slate-400"> / ۱۰۰</span></p>
            </div>
            <Button
              onClick={runQCChecks}
              disabled={isRunning}
              className="h-12 flex-1 rounded-2xl bg-emerald-800 px-5 font-bold text-white shadow-lg shadow-emerald-900/10 transition-all hover:-translate-y-0.5 hover:bg-emerald-900 hover:shadow-xl sm:flex-none"
            >
              {isRunning ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <RefreshCw className="ml-2 h-4 w-4" />}
              {isRunning ? 'در حال بررسی...' : 'اجرای مجدد QC'}
            </Button>
          </div>
        </div>
      </section>

      {/* Score + KPI */}
      <section className="relative grid gap-4 xl:grid-cols-[1.25fr_2fr]">
        <Card className="overflow-hidden rounded-[26px] border-0 bg-gradient-to-br from-[#063d32] via-[#075b49] to-[#087f5b] text-white shadow-[0_20px_50px_-28px_rgba(6,78,59,0.75)]">
          <CardContent className="relative p-6">
            <div className="absolute -left-10 -top-14 h-40 w-40 rounded-full border border-white/10" />
            <div className="absolute -left-2 -top-4 h-24 w-24 rounded-full border border-white/10" />
            <div className="relative flex items-center justify-between gap-5">
              <div>
                <div className="mb-3 flex items-center gap-2 text-emerald-100">
                  <Gauge className="h-4 w-4" />
                  <span className="text-xs font-bold">امتیاز کنترل کیفیت</span>
                </div>
                <p className="text-4xl font-black sm:text-5xl">{toPersianNumber(summary.completeness_score)}<span className="mr-1 text-lg font-semibold text-white/45">از ۱۰۰</span></p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold backdrop-blur">{toPersianNumber(summary.total_rules)} قانون بررسی‌شده</span>
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold backdrop-blur">وضعیت: {scoreTone.label}</span>
                </div>
              </div>
              <div
                className="relative grid h-28 w-28 shrink-0 place-items-center rounded-full p-[8px] shadow-2xl"
                style={{ background: `conic-gradient(#ffffff ${scoreDegrees}deg, rgba(255,255,255,.15) ${scoreDegrees}deg)` }}
              >
                <div className="grid h-full w-full place-items-center rounded-full bg-[#075746] shadow-inner">
                  <div className="text-center"><span className="text-3xl font-black">{toPersianNumber(summary.completeness_score)}</span><span className="text-sm text-white/60">٪</span><p className="mt-0.5 text-[9px] font-bold text-emerald-100/70">QUALITY</p></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'کل قوانین', value: summary.total_rules, icon: ClipboardCheck, cls: 'text-slate-700 bg-slate-100', dot: 'bg-slate-400' },
            { label: 'تأیید شده', value: summary.passed, icon: CircleCheckBig, cls: 'text-emerald-700 bg-emerald-50', dot: 'bg-emerald-500' },
            { label: 'هشدار', value: summary.warnings, icon: TriangleAlert, cls: 'text-amber-700 bg-amber-50', dot: 'bg-amber-500' },
            { label: 'خطا', value: summary.errors, icon: CircleX, cls: 'text-red-700 bg-red-50', dot: 'bg-red-500' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label} className="group rounded-[22px] border border-slate-200/70 bg-white shadow-[0_12px_30px_-24px_rgba(15,23,42,.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <CardContent className="p-4 sm:p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <div className={`grid h-10 w-10 place-items-center rounded-xl ${item.cls}`}><Icon className="h-5 w-5" /></div>
                    <span className={`h-2 w-2 rounded-full ${item.dot}`} />
                  </div>
                  <p className="text-2xl font-black text-slate-900">{toPersianNumber(item.value)}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-400">{item.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Backend validation */}
      {backendValidation && (
        <Card className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_16px_45px_-32px_rgba(15,23,42,.35)]">
          <CardContent className="p-0">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between lg:p-6">
              <div className="flex items-center gap-3">
                <div className={`grid h-11 w-11 place-items-center rounded-2xl ${backendValidation.decision === 'APPROVE' ? 'bg-emerald-50 text-emerald-700' : backendValidation.decision === 'CONDITIONAL' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                  <FileCheck2 className="h-5 w-5" />
                </div>
                <div><h3 className="font-black text-slate-900">اعتبارسنجی کامل پرونده</h3><p className="mt-1 text-xs text-slate-400">نتیجه کنترل سمت سرور و وضعیت آمادگی پرونده</p></div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${backendValidation.decision === 'APPROVE' ? 'bg-emerald-50 text-emerald-700' : backendValidation.decision === 'CONDITIONAL' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
                  {backendValidation.decision === 'APPROVE' ? 'تأیید نهایی' : backendValidation.decision === 'CONDITIONAL' ? 'تأیید مشروط' : 'نیازمند تکمیل'}
                </span>
                <span className="text-2xl font-black text-slate-900">{toPersianNumber(backendValidation.completeness_score)}٪</span>
              </div>
            </div>

            <div className="px-5 pt-5 lg:px-6">
              <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-l from-emerald-700 to-emerald-400 transition-all duration-700" style={{ width: `${Math.min(backendValidation.completeness_score, 100)}%` }} /></div>
            </div>

            <div className="grid gap-4 p-5 lg:grid-cols-3 lg:p-6">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
                <div className="mb-3 flex items-center justify-between"><span className="flex items-center gap-2 text-sm font-black text-emerald-800"><CircleCheckBig className="h-4 w-4" /> موارد تأیید شده</span><span className="rounded-lg bg-white px-2 py-1 text-xs font-black text-emerald-700 shadow-sm">{toPersianNumber(backendValidation.passed?.length || 0)}</span></div>
                <div className="max-h-56 space-y-2 overflow-y-auto pl-1">
                  {backendValidation.passed?.length ? backendValidation.passed.map((p, i) => <div key={i} className="rounded-xl bg-white/80 p-3 text-xs shadow-sm ring-1 ring-emerald-100/60"><p className="font-bold text-slate-700">{p.label}</p><p className="mt-1 leading-5 text-slate-400">{p.message}</p></div>) : <p className="py-6 text-center text-xs text-slate-400">موردی ثبت نشده است</p>}
                </div>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
                <div className="mb-3 flex items-center justify-between"><span className="flex items-center gap-2 text-sm font-black text-amber-800"><TriangleAlert className="h-4 w-4" /> هشدارها</span><span className="rounded-lg bg-white px-2 py-1 text-xs font-black text-amber-700 shadow-sm">{toPersianNumber(backendValidation.warnings?.length || 0)}</span></div>
                <div className="max-h-56 space-y-2 overflow-y-auto pl-1">
                  {backendValidation.warnings?.length ? backendValidation.warnings.map((w, i) => <div key={i} className="rounded-xl bg-white/80 p-3 text-xs shadow-sm ring-1 ring-amber-100/60"><p className="font-bold text-slate-700">{w.label}</p><p className="mt-1 leading-5 text-slate-400">{w.message}</p></div>) : <p className="py-6 text-center text-xs text-slate-400">هشداری وجود ندارد</p>}
                </div>
              </div>

              <div className="rounded-2xl border border-red-100 bg-red-50/40 p-4">
                <div className="mb-3 flex items-center justify-between"><span className="flex items-center gap-2 text-sm font-black text-red-800"><CircleX className="h-4 w-4" /> موارد ناقص</span><span className="rounded-lg bg-white px-2 py-1 text-xs font-black text-red-700 shadow-sm">{toPersianNumber(backendValidation.issues?.length || 0)}</span></div>
                <div className="max-h-56 space-y-2 overflow-y-auto pl-1">
                  {backendValidation.issues?.length ? backendValidation.issues.map((issue, i) => <div key={i} className="rounded-xl bg-white/80 p-3 text-xs shadow-sm ring-1 ring-red-100/60"><p className="font-bold text-slate-700">{issue.label}</p><p className="mt-1 leading-5 text-slate-500">{issue.message}</p>{issue.hint && <p className="mt-2 flex gap-1.5 rounded-lg bg-slate-50 p-2 leading-5 text-slate-500"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />{issue.hint}</p>}</div>) : <p className="py-6 text-center text-xs text-slate-400">مورد ناقصی وجود ندارد</p>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rules */}
      <Card className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_16px_45px_-32px_rgba(15,23,42,.35)]">
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between lg:px-6">
            <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><ClipboardCheck className="h-5 w-5" /></div><div><h3 className="font-black text-slate-900">قوانین کنترل کیفیت</h3><p className="mt-0.5 text-xs text-slate-400">جزئیات وضعیت هر قانون و شواهد مرتبط</p></div></div>
            <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-500">{toPersianNumber(summary.total_rules)} قانون</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead><tr className="bg-slate-50/80 text-[11px] font-bold text-slate-400"><th className="px-5 py-3.5 text-right">شناسه</th><th className="px-5 py-3.5 text-right">قانون</th><th className="px-5 py-3.5 text-center">وضعیت</th><th className="px-5 py-3.5 text-center">اولویت</th><th className="px-5 py-3.5 text-center">شاهد</th><th className="px-5 py-3.5 text-right">توضیح</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {qcRules.map((rule) => (
                  <tr key={rule.id} className="group transition-colors hover:bg-slate-50/70">
                    <td className="px-5 py-4"><span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-[11px] font-bold text-slate-500">{rule.id}</span></td>
                    <td className="px-5 py-4 font-bold text-slate-700">{getRuleNameInPersian(rule.id, rule.name)}</td>
                    <td className="px-5 py-4 text-center">{getStatusBadge(rule.status)}</td>
                    <td className="px-5 py-4 text-center">{getPriorityBadge(rule.priority)}</td>
                    <td className="px-5 py-4 text-center text-xs font-semibold text-slate-500">{rule.evidence}</td>
                    <td className="max-w-[300px] px-5 py-4 text-xs leading-6 text-slate-400">{rule.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Decision + reviewer */}
      <div className="grid gap-4 lg:grid-cols-[1.05fr_1.4fr]">
        <Card className="rounded-[26px] border border-slate-200/80 bg-white shadow-[0_16px_45px_-32px_rgba(15,23,42,.35)]">
          <CardContent className="p-5 lg:p-6">
            <div className="mb-5 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-700"><Activity className="h-5 w-5" /></div><div><h3 className="font-black text-slate-900">تصمیم QC</h3><p className="mt-0.5 text-xs text-slate-400">نتیجه بررسی را انتخاب کنید</p></div></div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {[
                { value: 'APPROVE' as const, label: 'تأیید', desc: 'قابل ادامه', icon: CheckCircle, active: 'border-emerald-500 bg-emerald-50 text-emerald-800', iconCls: 'bg-emerald-100 text-emerald-700' },
                { value: 'CONDITIONAL' as const, label: 'مشروط', desc: 'با ملاحظات', icon: AlertCircle, active: 'border-amber-500 bg-amber-50 text-amber-800', iconCls: 'bg-amber-100 text-amber-700' },
                { value: 'RETURN' as const, label: 'بازگشت', desc: 'نیاز به اصلاح', icon: XCircle, active: 'border-red-500 bg-red-50 text-red-800', iconCls: 'bg-red-100 text-red-700' },
              ].map((item) => { const Icon = item.icon; const selected = decision === item.value; return <button key={item.value} type="button" onClick={() => setDecision(item.value)} className={`rounded-2xl border p-3.5 text-right transition-all hover:-translate-y-0.5 ${selected ? `${item.active} shadow-sm` : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}><div className="flex items-center gap-3"><div className={`grid h-9 w-9 place-items-center rounded-xl ${item.iconCls}`}><Icon className="h-4 w-4" /></div><div><p className="text-sm font-black">{item.label}</p><p className="mt-0.5 text-[10px] opacity-60">{item.desc}</p></div></div></button>; })}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[26px] border border-slate-200/80 bg-white shadow-[0_16px_45px_-32px_rgba(15,23,42,.35)]">
          <CardContent className="p-5 lg:p-6">
            <div className="mb-4 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><MessageSquareText className="h-5 w-5" /></div><div><h3 className="font-black text-slate-900">یادداشت بازبین</h3><p className="mt-0.5 text-xs text-slate-400">ملاحظات، شروط یا توضیحات تکمیلی</p></div></div>
            <Textarea value={reviewerComment} onChange={(e) => setReviewerComment(e.target.value)} placeholder="نظرات خود را درباره هشدارها، خطاها و شرایط پرونده وارد کنید..." className="min-h-[128px] resize-none rounded-2xl border-slate-200 bg-slate-50/60 p-4 leading-7 text-slate-700 outline-none transition-all placeholder:text-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10" />
          </CardContent>
        </Card>
      </div>

      {/* Contextual message */}
      {!canProceed && backendValidation?.issues_count > 0 && <div className="flex items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"><CircleX className="h-4 w-4" />{toPersianNumber(backendValidation.issues_count)} مورد ناقص باید قبل از ادامه تکمیل شود</div>}
      {summary.errors === 0 && hasWarnings && canProceed && <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 sm:flex-row"><p className="flex items-center gap-2 text-sm font-semibold text-amber-700"><TriangleAlert className="h-4 w-4" />{toPersianNumber(summary.warnings)} هشدار وجود دارد؛ امکان ادامه با تأیید شما وجود دارد.</p><Button variant="outline" className="rounded-xl border-amber-200 bg-white text-amber-700 hover:bg-amber-100" onClick={onNext}>ادامه با هشدارها</Button></div>}
      {summary.errors === 0 && !hasWarnings && summary.completeness_score === 100 && canProceed && <div className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"><Sparkles className="h-4 w-4" />همه قوانین با موفقیت تأیید شده‌اند.</div>}

      {/* Sticky-like action footer */}
      <div className="relative flex flex-col-reverse gap-3 rounded-[22px] border border-slate-200/80 bg-white/95 p-3 shadow-[0_18px_50px_-35px_rgba(15,23,42,.45)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" onClick={onPrev} className="h-11 rounded-xl px-4 font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800"><ChevronLeft className="ml-1 h-4 w-4" />مرحله قبل</Button>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={handleSave} disabled={saving} className="h-11 rounded-xl border-slate-200 px-5 font-bold text-slate-600 hover:bg-slate-50">{saving ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />}{saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}</Button>
          <Button onClick={handleProceedWithWarnings} disabled={!canProceed} className="h-11 rounded-xl bg-emerald-800 px-6 font-bold text-white shadow-lg shadow-emerald-900/10 hover:bg-emerald-900 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none">ادامه به مرحله ۶<ArrowUpLeft className="mr-2 h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}