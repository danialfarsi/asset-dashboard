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
    'مجموع منسوخ‌شدگی ≤ ۶۰% باشد': 'مجموع منسوخ‌شدگی ≤ ۶۰% باشد',
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
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">امتیاز QC</p>
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
              'اجرای QC'
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
          <span>پیشرفت QC</span>
          <span>{toPersianNumber(summary.completeness_score)}%</span>
        </div>
        <Progress value={summary.completeness_score} className="h-2" />
      </div>

      {/* لیست قوانین */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <h3 className="text-sm font-bold text-dark-green mb-3 font-[family-name:var(--font-vazir)]">📋 QC لیست قوانین </h3>
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
          <h3 className="text-sm font-bold text-dark-green mb-3 font-[family-name:var(--font-vazir)]">🎯  QCتصمیم  </h3>
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

      {summary.errors === 0 && hasWarnings && (
        <div className="flex flex-col items-center gap-2 mt-4">
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

      {summary.errors > 0 && (
        <p className="text-sm text-red-500 text-center font-[family-name:var(--font-vazir)]">
          ❌ {toPersianNumber(summary.errors)} خطای QC باید قبل از ادامه رفع شوند
        </p>
      )}
      {summary.errors === 0 && !hasWarnings && summary.completeness_score === 100 && (
        <p className="text-sm text-green-500 text-center font-[family-name:var(--font-vazir)]">
          ✅ همه قوانین با موفقیت پاس شده‌اند!
        </p>
      )}
    </div>
  );
}
