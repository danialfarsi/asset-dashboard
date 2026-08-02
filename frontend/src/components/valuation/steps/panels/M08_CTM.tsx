'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Trash2, 
  Upload, 
  X, 
  FileText, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Calculator,
  AlertTriangle
} from 'lucide-react';
import api from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import moment from 'jalali-moment';

interface ComparableDeal {
  id: number;
  deal_id: string;
  deal_date: string;
  transaction_price: number;
  asset_description: string;
  deal_weight_percent: number;
  size_adjustment: number;
  time_adjustment: number;
  geographic_adjustment: number;
  other_adjustments: number;
  total_adjustment: number;
  adjusted_price: number;
}

interface ExpertSignoff {
  id: number;
  expert_name: string;
  signature_date: string;
  notes: string;
}

interface M08_CTMProps {
  formData: any;
  onChange: (data: any) => void;
  assetId?: number;
  valuationCaseId?: number;
  step2Data?: any;
}

export function M08_CTM({ formData, onChange, assetId, valuationCaseId, step2Data }: M08_CTMProps) {
  const [files, setFiles] = useState<Record<string, File>>({});
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [prevValuationCaseId, setPrevValuationCaseId] = useState<number | undefined>(undefined);
  const [showDetails, setShowDetails] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [dealDates, setDealDates] = useState<Record<number, string>>({});

  // ============================================
  // تبدیل تاریخ شمسی <-> میلادی
  // ============================================
  const toGregorian = (persianDate: string): string => {
    if (!persianDate) return '';
    try {
      const parts = persianDate.split('/');
      if (parts.length !== 3) return persianDate;
      const m = moment(`${parts[0]}/${parts[1]}/${parts[2]}`, 'jYYYY/jMM/jDD');
      return m.format('YYYY-MM-DD');
    } catch {
      return persianDate;
    }
  };

  const toPersian = (gregorianDate: string): string => {
    if (!gregorianDate) return '';
    try {
      const m = moment(gregorianDate, 'YYYY-MM-DD');
      return m.format('jYYYY/jMM/jDD');
    } catch {
      return gregorianDate;
    }
  };

  const toPersianDisplay = (date: string): string => {
    if (!date) return '-';
    const persian = toPersian(date);
    if (persian && persian !== date) {
      const parts = persian.split('/');
      return `${parts[0]}/${parts[1]}/${parts[2]}`;
    }
    return date;
  };

  // ============================================
  // تبدیل اعداد به فارسی (فقط برای نمایش)
  // ============================================
  const toPersianNumber = (num: number | string): string => {
    if (num === undefined || num === null) return '۰';
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    return String(num).replace(/\d/g, (d) => persianDigits[parseInt(d)]);
  };

  const toPersianNumberWithComma = (num: number): string => {
    if (!num && num !== 0) return '۰';
    const formatted = num.toLocaleString();
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    return formatted.replace(/\d/g, (d) => persianDigits[parseInt(d)]);
  };

  // ============================================
  // انواع صنعت
  // ============================================
  const INDUSTRY_CLASSIFICATIONS = [
    { value: 'software', label: 'نرم‌افزار (Software)' },
    { value: 'steel', label: 'فولاد (Steel)' },
    { value: 'technology', label: 'فناوری (Technology)' },
    { value: 'esg', label: 'ESG' },
    { value: 'manufacturing', label: 'تولید (Manufacturing)' },
    { value: 'services', label: 'خدمات (Services)' },
    { value: 'retail', label: 'خرده‌فروشی (Retail)' },
    { value: 'energy', label: 'انرژی (Energy)' },
  ];

  const MARKET_COMPARABILITY = [
    { value: 'High', label: 'بالا (High)' },
    { value: 'Medium', label: 'متوسط (Medium)' },
    { value: 'Low', label: 'پایین (Low)' },
  ];

  // ============================================
  // تشخیص تغییر دارایی
  // ============================================
  useEffect(() => {
    if (valuationCaseId && valuationCaseId !== prevValuationCaseId) {
      const hasExistingData = formData.comparable_deals && formData.comparable_deals.length > 0;
      
      if (!hasExistingData) {
        setInitialized(false);
        onChange({
          comparable_deals: [
            {
              id: Date.now(),
              deal_id: 'Deal-001',
              deal_date: '',
              transaction_price: 0,
              asset_description: '',
              deal_weight_percent: 33,
              size_adjustment: 0,
              time_adjustment: 0,
              geographic_adjustment: 0,
              other_adjustments: 0,
              total_adjustment: 0,
              adjusted_price: 0,
            },
            {
              id: Date.now() + 1,
              deal_id: 'Deal-002',
              deal_date: '',
              transaction_price: 0,
              asset_description: '',
              deal_weight_percent: 33,
              size_adjustment: 0,
              time_adjustment: 0,
              geographic_adjustment: 0,
              other_adjustments: 0,
              total_adjustment: 0,
              adjusted_price: 0,
            },
            {
              id: Date.now() + 2,
              deal_id: 'Deal-003',
              deal_date: '',
              transaction_price: 0,
              asset_description: '',
              deal_weight_percent: 34,
              size_adjustment: 0,
              time_adjustment: 0,
              geographic_adjustment: 0,
              other_adjustments: 0,
              total_adjustment: 0,
              adjusted_price: 0,
            },
          ],
          market_comparability_context: 'Medium',
          industry_classification: 'software',
          expert_signoffs: [],
        });
      }
      
      setPrevValuationCaseId(valuationCaseId);
    }
  }, [valuationCaseId, formData.comparable_deals]);

  // ============================================
  // مقداردهی اولیه با داده‌های STEP 2
  // ============================================
  useEffect(() => {
    if (step2Data && !initialized) {
      const updates: any = {};
      
      if (formData.discount_rate === undefined && step2Data.discount_rate) {
        updates.discount_rate = step2Data.discount_rate;
      }
      if (formData.tax_rate === undefined && step2Data.tax_rate) {
        updates.tax_rate = step2Data.tax_rate;
      }
      if (formData.quality_multiplier === undefined && step2Data.quality_multiplier) {
        updates.quality_multiplier = step2Data.quality_multiplier;
      }
      if (formData.source_reliability === undefined && step2Data.source_reliability) {
        updates.source_reliability = step2Data.source_reliability;
      }
      
      if (Object.keys(updates).length > 0) {
        onChange(updates);
      }
      setInitialized(true);
    }
  }, [step2Data, initialized]);

  // ============================================
  // بارگذاری داده‌های ذخیره‌شده
  // ============================================
  useEffect(() => {
    if (valuationCaseId && initialized) {
      loadFromDatabase();
    }
  }, [valuationCaseId, initialized]);

  const loadFromDatabase = async () => {
    try {
      const { data } = await api.get(`/intangible/valuation-step3/?valuation_case=${valuationCaseId}`);
      const items = data.results || data || [];
      
      if (items.length > 0 && items[0].method_inputs) {
        const inputs = items[0].method_inputs;
        const m08Data: any = {};
        
        const fields = [
          'comparable_deals', 'market_comparability_context', 'industry_classification',
          'expert_signoffs', 'discount_rate', 'tax_rate', 'quality_multiplier', 'source_reliability'
        ];
        
        fields.forEach(field => {
          if (inputs[field] !== undefined) {
            m08Data[field] = inputs[field];
          }
        });
        
        if (Object.keys(m08Data).length > 0) {
          onChange(m08Data);
        }
      }
    } catch (error) {
      console.error('Error loading M08 data:', error);
    }
  };

  const handleChange = (field: string, value: any) => {
    onChange({ [field]: value });
  };

  const comparableDeals: ComparableDeal[] = formData.comparable_deals || [];
  const expertSignoffs: ExpertSignoff[] = formData.expert_signoffs || [];

  // ============================================
  // محاسبه تعدیلات
  // ============================================
  const calculateAdjustments = (deal: ComparableDeal) => {
    const total = (deal.size_adjustment || 0) + 
                  (deal.time_adjustment || 0) + 
                  (deal.geographic_adjustment || 0) + 
                  (deal.other_adjustments || 0);
    return Math.round(total * 100) / 100;
  };

  const calculateAdjustedPrice = (deal: ComparableDeal) => {
    const totalAdjustment = calculateAdjustments(deal);
    return Math.round(deal.transaction_price * (1 + totalAdjustment / 100));
  };

  // ============================================
  // توابع جدول معاملات
  // ============================================
  const addDeal = () => {
    const newDeal: ComparableDeal = {
      id: Date.now(),
      deal_id: `Deal-${String(comparableDeals.length + 1).padStart(3, '0')}`,
      deal_date: '',
      transaction_price: 0,
      asset_description: '',
      deal_weight_percent: Math.round(100 / (comparableDeals.length + 1)),
      size_adjustment: 0,
      time_adjustment: 0,
      geographic_adjustment: 0,
      other_adjustments: 0,
      total_adjustment: 0,
      adjusted_price: 0,
    };
    
    const newDeals = [...comparableDeals, newDeal];
    const equalWeight = Math.round(100 / newDeals.length);
    newDeals.forEach(d => d.deal_weight_percent = equalWeight);
    const sum = newDeals.reduce((s, d) => s + d.deal_weight_percent, 0);
    newDeals[newDeals.length - 1].deal_weight_percent += (100 - sum);
    
    handleChange('comparable_deals', newDeals);
  };

  const updateDeal = (id: number, field: string, value: any) => {
    const newDeals = comparableDeals.map(deal => {
      if (deal.id === id) {
        const updated = { ...deal, [field]: value };
        if (['size_adjustment', 'time_adjustment', 'geographic_adjustment', 'other_adjustments'].includes(field)) {
          updated.total_adjustment = calculateAdjustments(updated);
          updated.adjusted_price = calculateAdjustedPrice(updated);
        }
        if (field === 'transaction_price') {
          updated.adjusted_price = calculateAdjustedPrice(updated);
        }
        return updated;
      }
      return deal;
    });
    handleChange('comparable_deals', newDeals);
  };

  const removeDeal = (id: number) => {
    if (comparableDeals.length <= 3) {
      alert('حداقل ۳ معامله باید وجود داشته باشد');
      return;
    }
    const newDeals = comparableDeals.filter(deal => deal.id !== id);
    const equalWeight = Math.round(100 / newDeals.length);
    newDeals.forEach(d => d.deal_weight_percent = equalWeight);
    const sum = newDeals.reduce((s, d) => s + d.deal_weight_percent, 0);
    newDeals[newDeals.length - 1].deal_weight_percent += (100 - sum);
    
    handleChange('comparable_deals', newDeals);
  };

  // ============================================
  // اعتبارسنجی
  // ============================================
  const validateDeals = () => {
    const errors: string[] = [];
    
    if (comparableDeals.length < 3) {
      errors.push('CTM-01: حداقل ۳ معامله وارد شده باشد');
    }
    
    const totalWeight = comparableDeals.reduce((sum, d) => sum + (d.deal_weight_percent || 0), 0);
    if (Math.abs(totalWeight - 100) > 0.5) {
      errors.push(`CTM-02: مجموع وزن معاملات باید ۱۰۰٪ باشد (فعلاً ${toPersianNumber(totalWeight)}%)`);
    }
    
    comparableDeals.forEach(d => {
      if ((d.deal_weight_percent || 0) > 50) {
        errors.push(`CTM-03: وزن معامله ${d.deal_id} بیش از ۵۰٪ است (${toPersianNumber(d.deal_weight_percent)}%)`);
      }
    });
    
    comparableDeals.forEach(d => {
      const totalAdj = calculateAdjustments(d);
      if (Math.abs(totalAdj) > 40) {
        errors.push(`CTM-04: مجموع تعدیلات معامله ${d.deal_id} بیش از ۴۰٪± است (${toPersianNumber(totalAdj)}%)`);
      }
    });
    
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    comparableDeals.forEach(d => {
      if (d.deal_date) {
        const dealDate = new Date(d.deal_date);
        if (dealDate < fiveYearsAgo) {
          errors.push(`CTM-05: تاریخ معامله ${d.deal_id} بیش از ۵ سال قبل است`);
        }
      }
    });
    
    comparableDeals.forEach(d => {
      if ((d.transaction_price || 0) <= 0) {
        errors.push(`CTM-06: قیمت معامله ${d.deal_id} باید بزرگتر از ۰ باشد`);
      }
    });
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  // ============================================
  // محاسبات آماری
  // ============================================
  const getStats = () => {
    const prices = comparableDeals.map(d => d.transaction_price).filter(p => p > 0);
    const adjustedPrices = comparableDeals.map(d => d.adjusted_price).filter(p => p > 0);
    
    if (prices.length === 0) {
      return { min: 0, max: 0, avg: 0, count: 0, totalWeight: 0 };
    }
    
    const totalWeight = comparableDeals.reduce((sum, d) => sum + (d.deal_weight_percent || 0), 0);
    
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: Math.round(prices.reduce((s, p) => s + p, 0) / prices.length),
      count: prices.length,
      totalWeight: totalWeight,
    };
  };

  const stats = getStats();

  // ============================================
  // توابع تأیید خبرگان
  // ============================================
  const addExpertSignoff = () => {
    const newSignoff: ExpertSignoff = {
      id: Date.now(),
      expert_name: '',
      signature_date: '',
      notes: '',
    };
    handleChange('expert_signoffs', [...expertSignoffs, newSignoff]);
  };

  const updateExpertSignoff = (id: number, field: string, value: string) => {
    const newSignoffs = expertSignoffs.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    );
    handleChange('expert_signoffs', newSignoffs);
  };

  const removeExpertSignoff = (id: number) => {
    handleChange('expert_signoffs', expertSignoffs.filter(s => s.id !== id));
  };

  // ============================================
  // آپلود فایل
  // ============================================
  const handleFileUpload = (field: string, file: File | null) => {
    if (file) {
      setFiles(prev => ({ ...prev, [field]: file }));
      handleChange(field, file.name);
    }
  };

  const removeFile = (field: string) => {
    setFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[field];
      return newFiles;
    });
    handleChange(field, null);
  };

  // ============================================
  // ذخیره در دیتابیس
  // ============================================
  const saveToDatabase = async () => {
    if (!valuationCaseId) return;

    try {
      setSaving(true);
      setSaveError(null);

      const payload = {
        valuation_case: valuationCaseId,
        method_id: 'M-08',
        method_inputs: {
          comparable_deals: comparableDeals.map(d => ({
            ...d,
            deal_date: toGregorian(d.deal_date) || d.deal_date,
          })),
          market_comparability_context: formData.market_comparability_context || 'Medium',
          industry_classification: formData.industry_classification || 'software',
          expert_signoffs: expertSignoffs,
          discount_rate: formData.discount_rate || step2Data?.discount_rate || 18,
          tax_rate: formData.tax_rate || step2Data?.tax_rate || 25,
          quality_multiplier: formData.quality_multiplier || 0.83,
          source_reliability: formData.source_reliability || step2Data?.source_reliability || 'high',
        },
      };

      const { data: existing } = await api.get(`/intangible/valuation-step3/?valuation_case=${valuationCaseId}`);
      const items = existing.results || existing || [];
      
      if (items.length > 0) {
        const step3Id = items[0].id;
        await api.put(`/intangible/valuation-step3/${step3Id}/`, payload);
      } else {
        await api.post('/intangible/valuation-step3/', payload);
      }

      setLastSaved(new Date().toLocaleTimeString('fa-IR'));
    } catch (error: any) {
      console.error('❌ خطا در ذخیره M08:', error);
      setSaveError(error?.response?.data?.message || 'خطا در ذخیره');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      validateDeals();
      saveToDatabase();
    }, 1500);
    return () => clearTimeout(timer);
  }, [formData, comparableDeals, expertSignoffs]);

  // ============================================
  // نمایش داده‌های STEP 2 (فارسی)
  // ============================================
  const displayStep2Data = () => {
    const data = step2Data || formData;
    if (!data) return null;
    
    const reliabilityLabels: Record<string, string> = {
      'very_high': 'بسیار بالا',
      'high': 'بالا',
      'medium': 'متوسط',
      'low': 'پایین',
      'very_low': 'بسیار پایین',
    };
    
    return (
      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-xs font-[family-name:var(--font-vazir)]">
        <p className="font-medium text-blue-700 mb-1">📥 داده‌های ورودی از STEP ۲:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
          <div><span className="text-gray-500">نرخ تنزیل:</span> <span className="font-bold">{toPersianNumber(data.discount_rate || 18)}%</span></div>
          <div><span className="text-gray-500">نرخ مالیات:</span> <span className="font-bold">{toPersianNumber(data.tax_rate || 25)}%</span></div>
          <div><span className="text-gray-500">ضریب کیفیت:</span> <span className="font-bold">{toPersianNumber(data.quality_multiplier || 0.83)}</span></div>
          <div><span className="text-gray-500">اتکای منبع:</span> <span className="font-bold">{reliabilityLabels[data.source_reliability] || data.source_reliability}</span></div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 font-[family-name:var(--font-vazir)]">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 flex-1">
          <p className="text-sm text-indigo-700 flex items-center gap-2">
            <span className="font-bold">📊 M-۰۸: روش معاملات مشابه (CTM)</span>
            <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full">روش بازار</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs mr-4">
          {saving ? (
            <span className="text-amber-500 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              در حال ذخیره...
            </span>
          ) : saveError ? (
            <span className="text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {saveError}
            </span>
          ) : lastSaved ? (
            <span className="text-green-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              ذخیره شد {lastSaved}
            </span>
          ) : null}
        </div>
      </div>

      {/* نمایش داده‌های STEP 2 */}
      {displayStep2Data()}

      {/* ============================================
          پارامترهای اختصاصی M-08
      ============================================ */}
      <div className="border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          🎯 پارامترهای اختصاصی روش M-۰۸
          <Badge className="text-xs bg-red-100 text-red-700">ورودی کاربر</Badge>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* زمینه قابلیت قیاس بازار */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              زمینه قابلیت قیاس بازار <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.market_comparability_context || 'Medium'}
              onValueChange={(value) => handleChange('market_comparability_context', value)}
            >
              <SelectTrigger className="focus:ring-2 focus:ring-indigo-500 font-[family-name:var(--font-vazir)]">
                <SelectValue placeholder="انتخاب سطح قیاس" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50 font-[family-name:var(--font-vazir)]">
                {MARKET_COMPARABILITY.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* طبقه‌بندی صنعت */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              طبقه‌بندی صنعت <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.industry_classification || 'software'}
              onValueChange={(value) => handleChange('industry_classification', value)}
            >
              <SelectTrigger className="focus:ring-2 focus:ring-indigo-500 font-[family-name:var(--font-vazir)]">
                <SelectValue placeholder="انتخاب صنعت" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50 font-[family-name:var(--font-vazir)]">
                {INDUSTRY_CLASSIFICATIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ============================================
            جدول معاملات مشابه (با تقویم شمسی)
        ============================================ */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                معاملات مشابه <span className="text-red-500">*</span>
                <Badge variant="outline" className="text-xs">
                  {toPersianNumber(comparableDeals.length)} معامله
                </Badge>
              </Label>
              {validationErrors.length > 0 && (
                <Badge variant="destructive" className="text-xs flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {toPersianNumber(validationErrors.length)} خطا
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={addDeal}
              className="flex items-center gap-1 text-indigo-600 border-indigo-300 hover:bg-indigo-50 font-[family-name:var(--font-vazir)]"
            >
              <Plus className="w-4 h-4" />
              افزودن معامله
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs font-[family-name:var(--font-vazir)]">
              <thead>
                <tr className="bg-indigo-50">
                  <th className="border p-1 text-center">شناسه</th>
                  <th className="border p-1 text-right">تاریخ (شمسی)</th>
                  <th className="border p-1 text-right">قیمت (IRR)</th>
                  <th className="border p-1 text-right">شرح دارایی</th>
                  <th className="border p-1 text-center">وزن (%)</th>
                  <th className="border p-1 text-center">تعدیل اندازه</th>
                  <th className="border p-1 text-center">تعدیل زمان</th>
                  <th className="border p-1 text-center">تعدیل جغرافیایی</th>
                  <th className="border p-1 text-center">سایر</th>
                  <th className="border p-1 text-center">جمع تعدیل</th>
                  <th className="border p-1 text-right">قیمت تعدیل‌شده</th>
                  <th className="border p-1 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {comparableDeals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-gray-50">
                    <td className="border p-1">
                      <Input
                        value={deal.deal_id || ''}
                        onChange={(e) => updateDeal(deal.id, 'deal_id', e.target.value)}
                        className="h-7 text-xs border-0 focus:ring-1 font-[family-name:var(--font-vazir)]"
                        placeholder="Deal-۰۰۱"
                      />
                    </td>
                    <td className="border p-1">
                      <Input
                        type="text"
                        placeholder="۱۴۰۳/۰۶/۱۵"
                        value={deal.deal_date ? toPersianDisplay(deal.deal_date) : ''}
                        onChange={(e) => {
                          const persianDate = e.target.value;
                          const gregorian = toGregorian(persianDate);
                          updateDeal(deal.id, 'deal_date', gregorian);
                        }}
                        className="h-7 text-xs border-0 focus:ring-1 font-[family-name:var(--font-vazir)]"
                      />
                    </td>
                    <td className="border p-1">
                      <Input
                        type="number"
                        value={deal.transaction_price || ''}
                        onChange={(e) => updateDeal(deal.id, 'transaction_price', parseFloat(e.target.value) || 0)}
                        className="h-7 text-xs border-0 focus:ring-1 text-left font-[family-name:var(--font-vazir)]"
                        placeholder="۰"
                      />
                    </td>
                    <td className="border p-1">
                      <Input
                        value={deal.asset_description || ''}
                        onChange={(e) => updateDeal(deal.id, 'asset_description', e.target.value)}
                        className="h-7 text-xs border-0 focus:ring-1 font-[family-name:var(--font-vazir)]"
                        placeholder="توضیح دارایی"
                      />
                    </td>
                    <td className="border p-1">
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          step="0.1"
                          value={deal.deal_weight_percent || ''}
                          onChange={(e) => updateDeal(deal.id, 'deal_weight_percent', parseFloat(e.target.value) || 0)}
                          className="h-7 text-xs border-0 focus:ring-1 text-center font-[family-name:var(--font-vazir)]"
                          placeholder="۳۳"
                        />
                        <span className="text-xs text-gray-400">%</span>
                      </div>
                    </td>
                    <td className="border p-1">
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          step="0.1"
                          value={deal.size_adjustment || ''}
                          onChange={(e) => updateDeal(deal.id, 'size_adjustment', parseFloat(e.target.value) || 0)}
                          className="h-7 text-xs border-0 focus:ring-1 text-center font-[family-name:var(--font-vazir)]"
                          placeholder="۰"
                        />
                        <span className="text-xs text-gray-400">%</span>
                      </div>
                    </td>
                    <td className="border p-1">
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          step="0.1"
                          value={deal.time_adjustment || ''}
                          onChange={(e) => updateDeal(deal.id, 'time_adjustment', parseFloat(e.target.value) || 0)}
                          className="h-7 text-xs border-0 focus:ring-1 text-center font-[family-name:var(--font-vazir)]"
                          placeholder="۰"
                        />
                        <span className="text-xs text-gray-400">%</span>
                      </div>
                    </td>
                    <td className="border p-1">
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          step="0.1"
                          value={deal.geographic_adjustment || ''}
                          onChange={(e) => updateDeal(deal.id, 'geographic_adjustment', parseFloat(e.target.value) || 0)}
                          className="h-7 text-xs border-0 focus:ring-1 text-center font-[family-name:var(--font-vazir)]"
                          placeholder="۰"
                        />
                        <span className="text-xs text-gray-400">%</span>
                      </div>
                    </td>
                    <td className="border p-1">
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          step="0.1"
                          value={deal.other_adjustments || ''}
                          onChange={(e) => updateDeal(deal.id, 'other_adjustments', parseFloat(e.target.value) || 0)}
                          className="h-7 text-xs border-0 focus:ring-1 text-center font-[family-name:var(--font-vazir)]"
                          placeholder="۰"
                        />
                        <span className="text-xs text-gray-400">%</span>
                      </div>
                    </td>
                    <td className="border p-1 text-center font-bold text-indigo-600">
                      {toPersianNumber(calculateAdjustments(deal).toFixed(1))}%
                    </td>
                    <td className="border p-1 text-right font-bold text-green-600">
                      {toPersianNumberWithComma(calculateAdjustedPrice(deal))}
                    </td>
                    <td className="border p-1 text-center">
                      <button
                        onClick={() => removeDeal(deal.id)}
                        className="text-red-500 hover:text-red-700"
                        disabled={comparableDeals.length <= 3}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 font-[family-name:var(--font-vazir)]">* حداقل ۳ معامده الزامی است</p>
          <p className="text-[10px] text-gray-400 mt-1 font-[family-name:var(--font-vazir)]">📅 تاریخ را به فرمت شمسی وارد کنید (مثال: ۱۴۰۳/۰۶/۱۵)</p>
        </div>

        {/* ============================================
            خلاصه آمار (فارسی)
        ============================================ */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm font-medium mb-3 font-[family-name:var(--font-vazir)]">📊 خلاصه آمار</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center">
            <div className="p-2 bg-white rounded-lg border">
              <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">تعداد معاملات</p>
              <p className="text-lg font-bold text-indigo-600 font-[family-name:var(--font-vazir)]">
                {toPersianNumber(stats.count)}
              </p>
            </div>
            <div className="p-2 bg-white rounded-lg border">
              <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">کمترین قیمت</p>
              <p className="text-sm font-bold text-dark-green font-[family-name:var(--font-vazir)]">
                {toPersianNumberWithComma(stats.min)}
              </p>
            </div>
            <div className="p-2 bg-white rounded-lg border">
              <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">بیشترین قیمت</p>
              <p className="text-sm font-bold text-dark-green font-[family-name:var(--font-vazir)]">
                {toPersianNumberWithComma(stats.max)}
              </p>
            </div>
            <div className="p-2 bg-white rounded-lg border">
              <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">میانگین قیمت</p>
              <p className="text-sm font-bold text-blue-600 font-[family-name:var(--font-vazir)]">
                {toPersianNumberWithComma(stats.avg)}
              </p>
            </div>
            <div className="p-2 bg-white rounded-lg border">
              <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">مجموع وزن</p>
              <p className={`text-lg font-bold ${Math.abs(stats.totalWeight - 100) < 0.5 ? 'text-green-600' : 'text-red-600'} font-[family-name:var(--font-vazir)]`}>
                {toPersianNumber(stats.totalWeight)}%
              </p>
            </div>
          </div>
          {validationErrors.length > 0 && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-600 font-medium font-[family-name:var(--font-vazir)]">⚠️ خطاهای اعتبارسنجی:</p>
              <ul className="text-xs text-red-500 list-disc pr-4 mt-1 font-[family-name:var(--font-vazir)]">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* ============================================
          آپلود فایل‌ها
      ============================================ */}
      <div className="border rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 font-[family-name:var(--font-vazir)]">📎 شواهد و مدارک</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1 font-[family-name:var(--font-vazir)]">
              فایل Market Context <span className="text-red-500">*</span>
            </Label>
            <div className="p-3 border-2 border-dashed rounded-lg hover:border-indigo-400 transition-colors">
              {files.market_context ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm truncate font-[family-name:var(--font-vazir)]">{files.market_context.name}</span>
                  </div>
                  <button onClick={() => removeFile('market_context')} className="text-red-500 hover:text-red-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    id="market_context"
                    className="hidden"
                    onChange={(e) => handleFileUpload('market_context', e.target.files?.[0] || null)}
                  />
                  <label
                    htmlFor="market_context"
                    className="flex items-center gap-2 text-sm text-indigo-600 cursor-pointer hover:text-indigo-800 font-[family-name:var(--font-vazir)]"
                  >
                    <Upload className="w-4 h-4" />
                    آپلود فایل Market Context
                  </label>
                </div>
              )}
            </div>
            <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">مستندات تحلیل بازار و قابلیت قیاس</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1 font-[family-name:var(--font-vazir)]">
              فایل External Reference <span className="text-red-500">*</span>
            </Label>
            <div className="p-3 border-2 border-dashed rounded-lg hover:border-indigo-400 transition-colors">
              {files.external_reference ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm truncate font-[family-name:var(--font-vazir)]">{files.external_reference.name}</span>
                  </div>
                  <button onClick={() => removeFile('external_reference')} className="text-red-500 hover:text-red-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    id="external_reference"
                    className="hidden"
                    onChange={(e) => handleFileUpload('external_reference', e.target.files?.[0] || null)}
                  />
                  <label
                    htmlFor="external_reference"
                    className="flex items-center gap-2 text-sm text-indigo-600 cursor-pointer hover:text-indigo-800 font-[family-name:var(--font-vazir)]"
                  >
                    <Upload className="w-4 h-4" />
                    آپلود فایل External Reference
                  </label>
                </div>
              )}
            </div>
            <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">منبع خارجی معاملات (دیتابیس بازار)</p>
          </div>
        </div>
      </div>

      {/* ============================================
          تأیید خبرگان
      ============================================ */}
      <div className="space-y-3 pt-4 border-t">
        <Label className="text-sm font-medium font-[family-name:var(--font-vazir)]">👤 تأیید خبرگان (اختیاری)</Label>
        {expertSignoffs.length === 0 ? (
          <div className="text-center py-4 text-gray-400 border-2 border-dashed rounded-lg">
            <p className="text-sm font-[family-name:var(--font-vazir)]">هیچ خبره‌ای ثبت نشده است</p>
            <p className="text-xs font-[family-name:var(--font-vazir)]">برای افزودن خبره روی دکمه کلیک کنید</p>
          </div>
        ) : (
          <div className="space-y-2">
            {expertSignoffs.map((signoff) => (
              <div key={signoff.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <Input
                    value={signoff.expert_name}
                    onChange={(e) => updateExpertSignoff(signoff.id, 'expert_name', e.target.value)}
                    placeholder="نام خبره"
                    className="h-8 text-sm font-[family-name:var(--font-vazir)]"
                  />
                  <Input
                    type="date"
                    value={signoff.signature_date}
                    onChange={(e) => updateExpertSignoff(signoff.id, 'signature_date', e.target.value)}
                    className="h-8 text-sm font-[family-name:var(--font-vazir)]"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeExpertSignoff(signoff.id)}
                  className="text-red-500 hover:text-red-700 font-[family-name:var(--font-vazir)]"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={addExpertSignoff}
          className="flex items-center gap-1 font-[family-name:var(--font-vazir)]"
        >
          <Plus className="w-4 h-4" />
          افزودن خبره
        </Button>
      </div>

    </div>
  );
}
