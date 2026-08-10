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

interface ExpertSignoff {
  id: number;
  expert_name: string;
  signature_date: string;
  notes: string;
}

interface Evidence {
  id: number;
  file: string;
  file_name: string;
  evidence_type: string;
  method_id: string;
  uploaded_at: string;
}

interface M09_MMMProps {
  formData: any;
  onChange: (data: any) => void;
  assetId?: number;
  valuationCaseId?: number;
  step2Data?: any;
  onUploadEvidence?: (file: File, type: string) => Promise<void>;
  evidences?: Evidence[];
  onDeleteEvidence?: (id: number) => Promise<void>;
  uploadingEvidence?: boolean;
}

// ============================================
// تبدیل اعداد به فارسی
// ============================================
const toPersianNumber = (num: number | string): string => {
  if (num === undefined || num === null) return '۰';
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  const str = String(num);
  return str.replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};

const toPersianNumberWithComma = (num: number): string => {
  if (!num && num !== 0) return '۰';
  const formatted = num.toLocaleString();
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return formatted.replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};

export function M09_MMM({ 
  formData, 
  onChange, 
  assetId, 
  valuationCaseId, 
  step2Data,
  onUploadEvidence,
  evidences = [],
  onDeleteEvidence,
  uploadingEvidence = false
}: M09_MMMProps) {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [prevValuationCaseId, setPrevValuationCaseId] = useState<number | undefined>(undefined);
  const [showDetails, setShowDetails] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ============================================
  // گزینه‌های انتخاب
  // ============================================
  const BASE_METRICS = [
    { value: 'revenue', label: 'درآمد (Revenue)' },
    { value: 'ebitda', label: 'سود قبل از بهره، مالیات و استهلاک (EBITDA)' },
    { value: 'ebit', label: 'سود قبل از بهره و مالیات (EBIT)' },
    { value: 'book_value', label: 'ارزش دفتری (Book Value)' },
  ];

  const MULTIPLE_SOURCES = [
    { value: 'industry_report', label: 'گزارش صنعت ۱۴۰۴' },
    { value: 'ppa', label: 'تخصیص قیمت خرید (PPA)' },
    { value: 'database', label: 'پایگاه داده بازار' },
    { value: 'transaction', label: 'معاملات مشابه' },
  ];

  const INDUSTRY_CLASSIFICATIONS = [
    { value: 'technology', label: 'فناوری (Technology)' },
    { value: 'steel', label: 'فولاد (Steel)' },
    { value: 'esg', label: 'پایداری (ESG)' },
    { value: 'pharma', label: 'داروسازی (Pharma)' },
    { value: 'fmcg', label: 'کالاهای مصرفی (FMCG)' },
    { value: 'automotive', label: 'خودروسازی (Automotive)' },
    { value: 'telecom', label: 'ارتباطات (Telecom)' },
  ];

  const COMPARABILITY_CONTEXTS = [
    { value: 'high', label: 'شباهت بالا (High)' },
    { value: 'medium', label: 'شباهت متوسط (Medium)' },
    { value: 'low', label: 'شباهت پایین (Low)' },
  ];

  // ============================================
  // تشخیص تغییر دارایی
  // ============================================
  useEffect(() => {
    if (valuationCaseId && valuationCaseId !== prevValuationCaseId) {
      const hasExistingData = formData.base_metric !== undefined || formData.market_multiple;
      
      if (!hasExistingData) {
        setInitialized(false);
        onChange({
          base_metric: 'revenue',
          base_metric_value: 100000000000,
          market_multiple: 2.5,
          multiple_source: 'industry_report',
          control_premium_percent: 10,
          marketability_discount_percent: 20,
          intangible_share_percent: 40,
          industry_classification: 'technology',
          market_comparability_context: 'high',
          expert_signoffs: [],
        });
      }
      
      setPrevValuationCaseId(valuationCaseId);
    }
  }, [valuationCaseId, formData.base_metric]);

  // ============================================
  // مقداردهی اولیه با داده‌های مرحله ۲
  // ============================================
  useEffect(() => {
    if (step2Data && !initialized) {
      const updates: any = {};
      
      ['discount_rate', 'tax_rate', 'quality_multiplier', 'source_reliability'].forEach(field => {
        if (formData[field] === undefined && step2Data[field] !== undefined) {
          updates[field] = step2Data[field];
        }
      });
      
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
      
      const filteredItems = items.filter((item: any) => item.valuation_case === valuationCaseId);
      
      if (filteredItems.length > 0 && filteredItems[0].method_inputs) {
        const inputs = filteredItems[0].method_inputs;
        const m09Data: any = {};
        
        const fields = [
          'base_metric', 'base_metric_value', 'market_multiple', 'multiple_source',
          'control_premium_percent', 'marketability_discount_percent', 'intangible_share_percent',
          'industry_classification', 'market_comparability_context', 'expert_signoffs',
          'discount_rate', 'tax_rate', 'quality_multiplier', 'source_reliability'
        ];
        
        fields.forEach(field => {
          if (inputs[field] !== undefined) {
            m09Data[field] = inputs[field];
          }
        });
        
        if (Object.keys(m09Data).length > 0) {
          onChange(m09Data);
        }
      }
    } catch (error) {
      console.error('Error loading M09 data:', error);
    }
  };

  const handleChange = (field: string, value: any) => {
    onChange({ [field]: value });
  };

  const expertSignoffs: ExpertSignoff[] = formData.expert_signoffs || [];

  // ============================================
  // محاسبات پیش‌نمایش
  // ============================================
  const baseMetricValue = formData.base_metric_value || 0;
  const marketMultiple = formData.market_multiple || 0;
  const controlPremium = (formData.control_premium_percent || 0) / 100;
  const marketabilityDiscount = (formData.marketability_discount_percent || 0) / 100;
  const intangibleShare = (formData.intangible_share_percent || 0) / 100;

  const enterpriseValue = baseMetricValue * marketMultiple;
  const enterpriseValueAfterPremium = enterpriseValue * (1 + controlPremium);
  const enterpriseValueAfterDiscount = enterpriseValueAfterPremium * (1 - marketabilityDiscount);
  const intangibleValue = enterpriseValueAfterDiscount * intangibleShare;

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
  // 🔥 آپلود فایل - استفاده از props
  // ============================================
  const handleFileUpload = async (file: File, type: string) => {
    if (!onUploadEvidence) {
      console.warn('onUploadEvidence not provided');
      alert('سیستم آپلود فعال نیست');
      return;
    }

    setUploading(true);
    try {
      await onUploadEvidence(file, type);
      console.log(`✅ فایل ${type} آپلود شد`);
    } catch (error) {
      console.error('Upload error:', error);
      alert('خطا در آپلود فایل');
    } finally {
      setUploading(false);
    }
  };

  // ============================================
  // 🔥 رندر شواهد آپلود شده
  // ============================================
  const renderEvidences = () => {
    const m09Evidences = evidences.filter((e: Evidence) => 
      e.evidence_type?.startsWith('m09_')
    );

    if (m09Evidences.length === 0) {
      return (
        <div className="text-center py-6 text-gray-400 text-sm">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>هیچ شواهدی آپلود نشده است</p>
          <p className="text-xs mt-1">برای آپلود فایل، از دکمه‌های زیر استفاده کنید</p>
        </div>
      );
    }

    return (
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {m09Evidences.map((evidence: Evidence) => {
          const typeLabels: Record<string, string> = {
            'm09_external_multiples': 'فایل ضرایب بازار',
            'm09_industry_context': 'فایل تحلیل صنعت',
            'm09_ppa_note': 'یادداشت PPA',
          };
          const typeLabel = typeLabels[evidence.evidence_type] || evidence.evidence_type;
          
          return (
            <div key={evidence.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{evidence.file_name}</p>
                  <p className="text-xs text-gray-400">{typeLabel}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {evidence.file && (
                  <a 
                    href={evidence.file} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-amber-600 hover:underline"
                  >
                    مشاهده
                  </a>
                )}
                {onDeleteEvidence && (
                  <button
                    onClick={() => onDeleteEvidence(evidence.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ============================================
  // 🔥 دکمه‌های آپلود
  // ============================================
  const renderUploadButtons = () => {
    const uploadTypes = [
      { type: 'm09_external_multiples', label: 'فایل ضرایب بازار', required: true },
      { type: 'm09_industry_context', label: 'فایل تحلیل صنعت', required: true },
      { type: 'm09_ppa_note', label: 'یادداشت PPA', required: false },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {uploadTypes.map((item) => (
          <div key={item.type} className="p-3 border-2 border-dashed rounded-lg hover:border-amber-400 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {item.label}
                  {item.required && <span className="text-red-500 mr-1">*</span>}
                </p>
                <p className="text-xs text-gray-400">آپلود فایل</p>
              </div>
              <input
                type="file"
                id={`upload-${item.type}`}
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileUpload(e.target.files[0], item.type);
                  }
                  e.target.value = '';
                }}
              />
              <Button
                variant="outline"
                size="sm"
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
                onClick={() => document.getElementById(`upload-${item.type}`)?.click()}
                disabled={uploading || uploadingEvidence}
              >
                {uploading || uploadingEvidence ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-1 animate-spin" />
                    در حال آپلود...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 ml-1" />
                    آپلود
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ============================================
  // ذخیره در پایگاه داده
  // ============================================
  const saveToDatabase = async () => {
    if (!valuationCaseId) return;

    try {
      setSaving(true);
      setSaveError(null);

      const payload = {
        valuation_case: valuationCaseId,
        method_id: 'M-09',
        method_inputs: {
          base_metric: formData.base_metric || 'revenue',
          base_metric_value: formData.base_metric_value || 100000000000,
          market_multiple: formData.market_multiple || 2.5,
          multiple_source: formData.multiple_source || 'industry_report',
          control_premium_percent: formData.control_premium_percent || 10,
          marketability_discount_percent: formData.marketability_discount_percent || 20,
          intangible_share_percent: formData.intangible_share_percent || 40,
          industry_classification: formData.industry_classification || 'technology',
          market_comparability_context: formData.market_comparability_context || 'high',
          expert_signoffs: expertSignoffs,
          discount_rate: formData.discount_rate || step2Data?.discount_rate || 18,
          tax_rate: formData.tax_rate || step2Data?.tax_rate || 25,
          quality_multiplier: formData.quality_multiplier || step2Data?.quality_multiplier || 0.86,
          source_reliability: formData.source_reliability || step2Data?.source_reliability || 'high',
        },
      };

      const { data: existing } = await api.get(`/intangible/valuation-step3/?valuation_case=${valuationCaseId}`);
      const items = existing.results || existing || [];
      const filteredItems = items.filter((item: any) => item.valuation_case === valuationCaseId);
      
      if (filteredItems.length > 0) {
        const step3Id = filteredItems[0].id;
        await api.patch(`/intangible/valuation-step3/${step3Id}/`, payload);
        console.log('✅ M09 به‌روزرسانی شد (PATCH)');
      } else {
        await api.post('/intangible/valuation-step3/', payload);
        console.log('✅ M09 جدید ایجاد شد (POST)');
      }

      setLastSaved(new Date().toLocaleTimeString('fa-IR'));
    } catch (error: any) {
      console.error('❌ خطا در ذخیره:', error);
      setSaveError(error?.response?.data?.message || 'خطا در ذخیره');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      saveToDatabase();
    }, 1500);
    return () => clearTimeout(timer);
  }, [formData, expertSignoffs]);

  // ============================================
  // نمایش داده‌های مرحله ۲
  // ============================================
  const displayStep2Data = () => {
    const data = step2Data || formData;
    if (!data) return null;
    
    return (
      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-xs">
        <p className="font-medium text-blue-700 mb-1">📥 داده‌های ورودی از مرحله ۲:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
          <div><span className="text-gray-500">نرخ تنزیل:</span> <span className="font-bold">{toPersianNumber(data.discount_rate || 18)}%</span></div>
          <div><span className="text-gray-500">نرخ مالیات:</span> <span className="font-bold">{toPersianNumber(data.tax_rate || 25)}%</span></div>
          <div><span className="text-gray-500">ضریب کیفیت:</span> <span className="font-bold">{toPersianNumber(data.quality_multiplier || 0.86)}</span></div>
          <div><span className="text-gray-500">اتکای منبع:</span> <span className="font-bold">{data.source_reliability === 'high' ? 'بالا' : data.source_reliability === 'medium' ? 'متوسط' : 'پایین'}</span></div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">

      {/* هدر */}
      <div className="flex items-center justify-between">
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 flex-1">
          <p className="text-sm text-amber-700 flex items-center gap-2">
            <span className="font-bold">📊 روش ضریب بازار (MMM)</span>
            <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">روش بازار</span>
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

      {/* ========================================== */}
      {/* 🔥 شواهد و مدارک - در بالای صفحه */}
      {/* ========================================== */}
      <div className="border rounded-lg p-4 border-amber-200 bg-amber-50/30">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-amber-700 flex items-center gap-2">
            📎 شواهد و مدارک
            <span className="text-xs text-gray-500 font-normal">
              ({evidences.filter((e: Evidence) => e.evidence_type?.startsWith('m09_')).length} فایل)
            </span>
          </h3>
          <span className="text-xs text-red-500">* فیلدهای اجباری</span>
        </div>

        {renderUploadButtons()}
        <div className="mt-4">{renderEvidences()}</div>
      </div>

      {/* نمایش داده‌های مرحله ۲ */}
      {displayStep2Data()}

      {/* ============================================
          پارامترهای اختصاصی روش M-09
      ============================================ */}
      <div className="border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          🎯 پارامترهای اختصاصی روش
          <Badge className="text-xs bg-red-100 text-red-700">ورودی کاربر</Badge>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* شاخص پایه */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              شاخص پایه <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.base_metric || 'revenue'}
              onValueChange={(value) => handleChange('base_metric', value)}
            >
              <SelectTrigger className="w-full focus:ring-2 focus:ring-amber-500">
                <SelectValue placeholder="انتخاب شاخص پایه" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {BASE_METRICS.map((metric) => (
                  <SelectItem key={metric.value} value={metric.value}>
                    {metric.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* مقدار شاخص پایه */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              مقدار شاخص پایه <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              value={formData.base_metric_value || ''}
              onChange={(e) => handleChange('base_metric_value', parseFloat(e.target.value) || 0)}
              placeholder="۱۰۰,۰۰۰,۰۰۰,۰۰۰"
              className="focus:ring-2 focus:ring-amber-500"
            />
            <p className="text-[10px] text-gray-400">ریال</p>
          </div>

          {/* ضریب بازار */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              ضریب بازار <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.1"
                value={formData.market_multiple || ''}
                onChange={(e) => handleChange('market_multiple', parseFloat(e.target.value) || 0)}
                placeholder="۲.۵"
                className="flex-1 focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-sm text-gray-400">x</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {[2.0, 2.5, 3.0, 3.5].map((multiple) => (
                <button
                  key={multiple}
                  onClick={() => handleChange('market_multiple', multiple)}
                  className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                    formData.market_multiple === multiple 
                      ? 'bg-amber-500 text-white border-amber-500' 
                      : 'bg-gray-100 hover:bg-gray-200 border-gray-200'
                  }`}
                >
                  {toPersianNumber(multiple)}x
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400">بازه مجاز: ۲.۰x تا ۳.۵x</p>
          </div>

          {/* منبع ضریب */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              منبع ضریب <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.multiple_source || 'industry_report'}
              onValueChange={(value) => handleChange('multiple_source', value)}
            >
              <SelectTrigger className="w-full focus:ring-2 focus:ring-amber-500">
                <SelectValue placeholder="انتخاب منبع" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {MULTIPLE_SOURCES.map((source) => (
                  <SelectItem key={source.value} value={source.value}>
                    {source.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ============================================
            جدول تعدیلات
        ============================================ */}
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">🔧 تعدیلات</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* صرف کنترل */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                صرف کنترل <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.1"
                  value={formData.control_premium_percent || ''}
                  onChange={(e) => handleChange('control_premium_percent', parseFloat(e.target.value) || 0)}
                  placeholder="۱۰"
                  className="flex-1 focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-sm text-gray-400">%</span>
              </div>
              <p className="text-[10px] text-gray-400">بازه مجاز: ۰٪ تا ۳۰٪</p>
            </div>

            {/* تخفیف بازارپذیری */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                تخفیف بازارپذیری <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.1"
                  value={formData.marketability_discount_percent || ''}
                  onChange={(e) => handleChange('marketability_discount_percent', parseFloat(e.target.value) || 0)}
                  placeholder="۲۰"
                  className="flex-1 focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-sm text-gray-400">%</span>
              </div>
              <p className="text-[10px] text-gray-400">بازه مجاز: ۰٪ تا ۳۵٪</p>
            </div>

            {/* سهم دارایی نامشهود */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                سهم دارایی نامشهود <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.1"
                  value={formData.intangible_share_percent || ''}
                  onChange={(e) => handleChange('intangible_share_percent', parseFloat(e.target.value) || 0)}
                  placeholder="۴۰"
                  className="flex-1 focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-sm text-gray-400">%</span>
              </div>
              <p className="text-[10px] text-gray-400">بازه مجاز: ۰٪ تا ۱۰۰٪</p>
            </div>
          </div>
        </div>

        {/* ============================================
            سایر ورودی‌ها
        ============================================ */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* طبقه‌بندی صنعت */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                طبقه‌بندی صنعت <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.industry_classification || 'technology'}
                onValueChange={(value) => handleChange('industry_classification', value)}
              >
                <SelectTrigger className="w-full focus:ring-2 focus:ring-amber-500">
                  <SelectValue placeholder="انتخاب صنعت" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  {INDUSTRY_CLASSIFICATIONS.map((industry) => (
                    <SelectItem key={industry.value} value={industry.value}>
                      {industry.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* زمینه قابلیت قیاس بازار */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                زمینه قابلیت قیاس بازار <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.market_comparability_context || 'high'}
                onValueChange={(value) => handleChange('market_comparability_context', value)}
              >
                <SelectTrigger className="w-full focus:ring-2 focus:ring-amber-500">
                  <SelectValue placeholder="انتخاب سطح شباهت" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  {COMPARABILITY_CONTEXTS.map((context) => (
                    <SelectItem key={context.value} value={context.value}>
                      {context.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* ============================================
            خلاصه محاسبه پیش‌نمایش
        ============================================ */}
        <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-sm font-medium mb-3">📊 خلاصه محاسبه</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center">
            <div className="p-2 bg-white rounded-lg border">
              <p className="text-[10px] text-gray-400">ارزش شرکت (EV)</p>
              <p className="text-sm font-bold text-amber-700">
                {toPersianNumberWithComma(enterpriseValue)}
              </p>
            </div>
            <div className="p-2 bg-white rounded-lg border">
              <p className="text-[10px] text-gray-400">+ صرف کنترل</p>
              <p className="text-sm font-bold text-green-600">
                {toPersianNumberWithComma(enterpriseValueAfterPremium - enterpriseValue)}
              </p>
            </div>
            <div className="p-2 bg-white rounded-lg border">
              <p className="text-[10px] text-gray-400">- تخفیف بازارپذیری</p>
              <p className="text-sm font-bold text-red-600">
                {toPersianNumberWithComma(enterpriseValueAfterPremium - enterpriseValueAfterDiscount)}
              </p>
            </div>
            <div className="p-2 bg-white rounded-lg border">
              <p className="text-[10px] text-gray-400">× سهم دارایی</p>
              <p className="text-sm font-bold text-purple-600">
                {toPersianNumberWithComma(enterpriseValueAfterDiscount)}
              </p>
            </div>
            <div className="p-2 bg-amber-100 rounded-lg border border-amber-300">
              <p className="text-[10px] text-gray-500">ارزش نهایی (پیش‌نمایش)</p>
              <p className="text-lg font-bold text-amber-800">
                {toPersianNumberWithComma(intangibleValue)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================
          تأیید خبرگان
      ============================================ */}
      <div className="space-y-3 pt-4 border-t">
        <Label className="text-sm font-medium">👤 تأیید خبرگان (اختیاری)</Label>
        {expertSignoffs.length === 0 ? (
          <div className="text-center py-4 text-gray-400 border-2 border-dashed rounded-lg">
            <p className="text-sm">هیچ خبره‌ای ثبت نشده است</p>
            <p className="text-xs">برای افزودن خبره روی دکمه کلیک کنید</p>
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
                    className="h-8 text-sm"
                  />
                  <Input
                    type="date"
                    value={signoff.signature_date}
                    onChange={(e) => updateExpertSignoff(signoff.id, 'signature_date', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeExpertSignoff(signoff.id)}
                  className="text-red-500 hover:text-red-700"
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
          className="flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          افزودن خبره
        </Button>
      </div>

    </div>
  );
}
