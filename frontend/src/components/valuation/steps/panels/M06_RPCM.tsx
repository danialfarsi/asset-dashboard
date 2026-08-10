'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Upload, X, Loader2, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface LaborRow {
  id: number;
  role: string;
  person_days: number;
  daily_rate: number;
}

interface Evidence {
  id: number;
  file: string;
  file_name: string;
  evidence_type: string;
  method_id: string;
  uploaded_at: string;
}

interface M06_RPCMProps {
  formData: any;
  onChange: (data: any) => void;
  fieldsConfig?: any;
  assetId?: number;
  valuationCaseId?: number;
  step2Data?: any;
  onUploadEvidence?: (file: File, type: string) => Promise<void>;
  evidences?: Evidence[];
  onDeleteEvidence?: (id: number) => Promise<void>;
  uploadingEvidence?: boolean;
}

export function M06_RPCM({ 
  formData, 
  onChange, 
  assetId, 
  valuationCaseId, 
  step2Data,
  onUploadEvidence,
  evidences = [],
  onDeleteEvidence,
  uploadingEvidence = false
}: M06_RPCMProps) {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [prevValuationCaseId, setPrevValuationCaseId] = useState<number | undefined>(undefined);
  const [uploading, setUploading] = useState(false);

  // تبدیل اعداد به فارسی
  const toPersianNumber = (num: number) => {
    if (num === undefined || num === null) return '۰';
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    return num.toString().replace(/\d/g, (d) => persianDigits[parseInt(d)]);
  };

  const formatNumber = (num: number) => {
    if (!num && num !== 0) return '۰';
    const parts = Math.round(num).toString().split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    return integerPart.replace(/\d/g, (d) => persianDigits[parseInt(d)]);
  };

  // ============================================
  // تشخیص تغییر دارایی
  // ============================================
  useEffect(() => {
    if (valuationCaseId && valuationCaseId !== prevValuationCaseId) {
      console.log(`🔄 تغییر از ${prevValuationCaseId} به ${valuationCaseId}`);
      
      const hasExistingData = formData.labor_breakdown && formData.labor_breakdown.length > 0;
      
      if (!hasExistingData) {
        console.log('🔄 ریست کردن فرم برای دارایی جدید');
        setInitialized(false);
        // 🔥 مقدار پیش‌فرض age_factor رو 0.2 قرار بده (۲۰٪)
        onChange({
          age_factor: 0.2,
          coordination_overhead: 20,
          relevance_obsolescence: 0,
          direct_reproduction_cost: 0,
        });
      }
      
      setPrevValuationCaseId(valuationCaseId);
    }
  }, [valuationCaseId, formData.labor_breakdown]);

  // ============================================
  // مقداردهی اولیه با STEP 2
  // ============================================
  useEffect(() => {
    if (step2Data && !initialized) {
      console.log('📥 دریافت داده‌های STEP 2 برای M06:', step2Data);
      
      const updates: any = {};
      ['tax_rate', 'discount_rate', 'forecast_horizon', 'terminal_growth_rate', 
       'current_revenue', 'useful_life', 'currency', 'source_reliability',
       'category', 'business_unit', 'lifecycle_stage'].forEach(field => {
        if (formData[field] === undefined && step2Data[field] !== undefined) {
          updates[field] = step2Data[field];
        }
      });
      
      // 🔥 اگر age_factor تنظیم نشده، مقدار 0.2 بگذار
      if (formData.age_factor === undefined) {
        updates.age_factor = 0.2;
      }
      
      if (Object.keys(updates).length > 0) {
        onChange(updates);
      }
      setInitialized(true);
    }
  }, [step2Data, initialized]);

  // ============================================
  // بارگذاری از دیتابیس
  // ============================================
  useEffect(() => {
    if (valuationCaseId && initialized) {
      loadFromDatabase();
    }
  }, [valuationCaseId, initialized]);

  const loadFromDatabase = async () => {
    try {
      console.log(`📥 بارگذاری داده‌های M06 برای valuationCaseId: ${valuationCaseId}`);
      
      const { data } = await api.get(`/intangible/valuation-step3/?valuation_case=${valuationCaseId}`);
      const items = data.results || data || [];
      
      const filteredItems = items.filter((item: any) => item.valuation_case === valuationCaseId);
      
      if (filteredItems.length > 0 && filteredItems[0].method_inputs) {
        const inputs = filteredItems[0].method_inputs;
        
        const m06Data: any = {};
        if (inputs.labor_breakdown) m06Data.labor_breakdown = inputs.labor_breakdown;
        if (inputs.direct_reproduction_cost !== undefined) m06Data.direct_reproduction_cost = inputs.direct_reproduction_cost;
        if (inputs.coordination_overhead !== undefined) m06Data.coordination_overhead = inputs.coordination_overhead;
        if (inputs.relevance_obsolescence !== undefined) m06Data.relevance_obsolescence = inputs.relevance_obsolescence;
        if (inputs.age_factor !== undefined) m06Data.age_factor = inputs.age_factor;
        if (inputs.last_review_date) m06Data.last_review_date = inputs.last_review_date;
        
        // 🔥 اگر age_factor خیلی بزرگه، اصلاحش کن
        if (m06Data.age_factor > 1) {
          m06Data.age_factor = m06Data.age_factor / 100;
          console.log('⚠️ age_factor از درصد به اعشار تبدیل شد:', m06Data.age_factor);
        }
        
        if (Object.keys(m06Data).length > 0) {
          onChange(m06Data);
          console.log('📥 داده‌های M06 از دیتابیس بارگذاری شد:', m06Data);
        }
      }
    } catch (error) {
      console.error('Error loading M06 data:', error);
    }
  };

  // ============================================
  // داده‌های فرم
  // ============================================
  const laborRows: LaborRow[] = formData.labor_breakdown || [];

  const handleChange = (field: string, value: any) => {
    onChange({ [field]: value });
  };

  const updateLaborRow = (id: number, field: string, value: any) => {
    const newRows = laborRows.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    );
    handleChange('labor_breakdown', newRows);
  };

  const addLaborRow = () => {
    const newRow: LaborRow = {
      id: Date.now(),
      role: '',
      person_days: 0,
      daily_rate: 0,
    };
    handleChange('labor_breakdown', [...laborRows, newRow]);
  };

  const removeLaborRow = (id: number) => {
    if (laborRows.length <= 1) {
      alert('حداقل یک ردیف باید وجود داشته باشد');
      return;
    }
    handleChange('labor_breakdown', laborRows.filter(row => row.id !== id));
  };

  // ============================================
  // آپلود فایل
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
  // رندر شواهد
  // ============================================
  const renderEvidences = () => {
    const m06Evidences = evidences.filter((e: Evidence) => 
      e.evidence_type?.startsWith('m06_')
    );

    if (m06Evidences.length === 0) {
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
        {m06Evidences.map((evidence: Evidence) => {
          const typeLabels: Record<string, string> = {
            'm06_reproduction_report': 'گزارش بازتولید',
            'm06_supporting_docs': 'مدارک پشتیبان',
            'm06_cost_estimation': 'برآورد هزینه',
          };
          const typeLabel = typeLabels[evidence.evidence_type] || evidence.evidence_type;
          
          return (
            <div key={evidence.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-4 h-4 text-rose-600 flex-shrink-0" />
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
                    className="text-xs text-rose-600 hover:underline"
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
  // دکمه‌های آپلود
  // ============================================
  const renderUploadButtons = () => {
    const uploadTypes = [
      { type: 'm06_reproduction_report', label: 'گزارش بازتولید', required: true },
      { type: 'm06_supporting_docs', label: 'مدارک پشتیبان', required: false },
      { type: 'm06_cost_estimation', label: 'برآورد هزینه', required: false },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {uploadTypes.map((item) => (
          <div key={item.type} className="p-3 border-2 border-dashed rounded-lg hover:border-rose-400 transition-colors">
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
                className="border-rose-300 text-rose-700 hover:bg-rose-50"
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
  // محاسبات
  // ============================================
  const calculateTotalLaborCost = () => {
    return laborRows.reduce((acc, row) => {
      const days = Number(row.person_days) || 0;
      const rate = Number(row.daily_rate) || 0;
      return acc + (days * rate);
    }, 0);
  };

  const calculateFinalValue = () => {
    const directCost = Number(formData.direct_reproduction_cost) || 0;
    const laborCost = calculateTotalLaborCost();
    const totalDirect = directCost + laborCost;
    const overhead = 1 + (Number(formData.coordination_overhead) || 20) / 100;
    const obsolescence = 1 - (Number(formData.relevance_obsolescence) || 0) / 100;
    // 🔥 اصلاح: age_factor باید بین 0 و 1 باشد
    let ageFactor = Number(formData.age_factor) || 0;
    // اگر age_factor بزرگتر از 1 بود، به اعشار تبدیل کن
    if (ageFactor > 1) {
      ageFactor = ageFactor / 100;
    }
    // محدود کردن به بازه 0 تا 1
    ageFactor = Math.max(0, Math.min(1, ageFactor));
    const ageReduction = 1 - ageFactor;
    
    return totalDirect * overhead * obsolescence * ageReduction;
  };

  // ============================================
  // ذخیره در دیتابیس
  // ============================================
  const saveToDatabase = async () => {
    if (!valuationCaseId) {
      console.warn('⚠️ valuationCaseId موجود نیست');
      setSaveError('شناسه مورد ارزش‌گذاری یافت نشد');
      return;
    }

    try {
      setSaving(true);
      setSaveError(null);

      // 🔥 اصلاح age_factor قبل از ذخیره
      let ageFactor = Number(formData.age_factor) || 0;
      if (ageFactor > 1) {
        ageFactor = ageFactor / 100;
      }
      ageFactor = Math.max(0, Math.min(1, ageFactor));

      const methodInputs = {
        tax_rate: Number(formData.tax_rate) || Number(step2Data?.tax_rate) || 25,
        discount_rate: Number(formData.discount_rate) || Number(step2Data?.discount_rate) || 18,
        forecast_horizon: Number(formData.forecast_horizon) || Number(step2Data?.forecast_horizon) || 5,
        terminal_growth_rate: Number(formData.terminal_growth_rate) || Number(step2Data?.terminal_growth_rate) || 5,
        current_revenue: Number(formData.current_revenue) || Number(step2Data?.current_revenue) || 500000000000,
        useful_life: Number(formData.useful_life) || Number(step2Data?.useful_life) || 5,
        currency: formData.currency || step2Data?.currency || 'IRR',
        source_reliability: formData.source_reliability || step2Data?.source_reliability || 'high',
        category: formData.category || step2Data?.category || 'operational',
        business_unit: formData.business_unit || step2Data?.business_unit || 'واحد مرکزی',
        lifecycle_stage: formData.lifecycle_stage || step2Data?.lifecycle_stage || 'growth',
        
        labor_breakdown: laborRows.map(row => ({
          id: row.id,
          role: row.role || '',
          person_days: Number(row.person_days) || 0,
          daily_rate: Number(row.daily_rate) || 0,
        })),
        direct_reproduction_cost: Number(formData.direct_reproduction_cost) || 0,
        coordination_overhead: Number(formData.coordination_overhead) || 20,
        relevance_obsolescence: Number(formData.relevance_obsolescence) || 0,
        age_factor: ageFactor,
        last_review_date: formData.last_review_date || '',
      };

      const payload = {
        valuation_case: valuationCaseId,
        method_id: 'M-06',
        method_inputs: methodInputs,
      };

      console.log('📤 ذخیره M06 در دیتابیس:', payload);
      
      const { data: existing } = await api.get(`/intangible/valuation-step3/?valuation_case=${valuationCaseId}`);
      const items = existing.results || existing || [];
      const filteredItems = items.filter((item: any) => item.valuation_case === valuationCaseId);
      
      let response;
      if (filteredItems.length > 0) {
        const step3Id = filteredItems[0].id;
        response = await api.patch(`/intangible/valuation-step3/${step3Id}/`, payload);
        console.log('✅ M06 به‌روزرسانی شد (PATCH)');
      } else {
        response = await api.post('/intangible/valuation-step3/', payload);
        console.log('✅ M06 جدید ایجاد شد (POST)');
      }

      setLastSaved(new Date().toLocaleTimeString('fa-IR'));
    } catch (error: any) {
      console.error('❌ خطا در ذخیره M06:', error);
      setSaveError(error?.response?.data?.message || 'خطا در ذخیره');
    } finally {
      setSaving(false);
    }
  };

  // Auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      saveToDatabase();
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData, laborRows]);

  return (
    <div className="space-y-6 font-[family-name:var(--font-vazir)]">
      {/* هدر */}
      <div className="flex items-center justify-between">
        <div className="bg-rose-50 p-4 rounded-lg border border-rose-200 flex-1">
          <p className="text-sm text-rose-700">
            🔹 روش هزینه بازتولید (RPCM)
            <span className="inline-block mr-2 px-2 py-0.5 bg-rose-200 text-rose-800 rounded-full text-xs font-medium">
              M-06 | Reproduction Cost
            </span>
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

      {/* شواهد */}
      <div className="border rounded-lg p-4 border-rose-200 bg-rose-50/30">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-rose-700 flex items-center gap-2">
            📎 شواهد و مدارک
            <span className="text-xs text-gray-500 font-normal">
              ({evidences.filter((e: Evidence) => e.evidence_type?.startsWith('m06_')).length} فایل)
            </span>
          </h3>
          <span className="text-xs text-red-500">* فیلدهای اجباری</span>
        </div>
        {renderUploadButtons()}
        <div className="mt-4">{renderEvidences()}</div>
      </div>

      {/* 1. Labor Breakdown Table */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-1">
          جدول نیروی کار <span className="text-red-500">*</span>
        </Label>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border p-2 text-right">نقش</th>
                <th className="border p-2 text-right">نفر-روز</th>
                <th className="border p-2 text-right">نرخ روزانه (IRR)</th>
                <th className="border p-2 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {laborRows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="border p-1">
                    <Input
                      value={row.role}
                      onChange={(e) => updateLaborRow(row.id, 'role', e.target.value)}
                      className="h-8 text-sm border-0 focus:ring-1"
                      placeholder="نقش"
                    />
                  </td>
                  <td className="border p-1">
                    <Input
                      type="number"
                      value={row.person_days || ''}
                      onChange={(e) => updateLaborRow(row.id, 'person_days', Number(e.target.value) || 0)}
                      className="h-8 text-sm border-0 focus:ring-1"
                      placeholder="۰"
                    />
                  </td>
                  <td className="border p-1">
                    <Input
                      type="number"
                      value={row.daily_rate || ''}
                      onChange={(e) => updateLaborRow(row.id, 'daily_rate', Number(e.target.value) || 0)}
                      className="h-8 text-sm border-0 focus:ring-1"
                      placeholder="۰"
                    />
                  </td>
                  <td className="border p-1 text-center">
                    <button
                      onClick={() => removeLaborRow(row.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button variant="outline" size="sm" onClick={addLaborRow} className="flex items-center gap-1">
          <Plus className="w-4 h-4" />
          افزودن ردیف
        </Button>
        <p className="text-xs text-gray-400">* حداقل ۱ ردیف الزامی</p>
      </div>

      {/* 2. پارامترها */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-sm font-medium flex items-center gap-1">
            هزینه مستقیم بازتولید <span className="text-red-500">*</span>
          </Label>
          <Input
            type="number"
            value={formData.direct_reproduction_cost || ''}
            onChange={(e) => handleChange('direct_reproduction_cost', Number(e.target.value) || 0)}
            placeholder="مثلاً ۵۰۰,۰۰۰,۰۰۰"
            className="focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-sm font-medium">سربار هماهنگی</Label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              step="0.5"
              value={formData.coordination_overhead || ''}
              onChange={(e) => handleChange('coordination_overhead', Number(e.target.value) || 0)}
              placeholder="۲۰"
              className="focus:ring-2 focus:ring-rose-500"
            />
            <span className="text-sm text-gray-400">%</span>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-sm font-medium">منسوخی مرتبط</Label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              step="0.5"
              value={formData.relevance_obsolescence || ''}
              disabled
              className="bg-gray-50 focus:ring-2 focus:ring-rose-500"
              placeholder="۰"
            />
            <span className="text-sm text-gray-400">%</span>
            <span className="text-xs text-rose-600">🤖 خودکار</span>
          </div>
        </div>

        {/* 🔥 اصلاح: اضافه کردن اعتبارسنجی برای age_factor */}
        <div className="space-y-1">
          <Label className="text-sm font-medium flex items-center gap-1">
            ضریب سن <span className="text-red-500">*</span>
            <span className="text-xs text-gray-400">(۰ تا ۱)</span>
          </Label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={formData.age_factor || ''}
              onChange={(e) => {
                let val = parseFloat(e.target.value) || 0;
                // اگر مقدار از ۱ بیشتر بود، به اعشار تبدیل کن
                if (val > 1) {
                  val = val / 100;
                }
                // محدود کردن به بازه ۰ تا ۱
                val = Math.max(0, Math.min(1, val));
                handleChange('age_factor', val);
              }}
              placeholder="۰.۲ (معادل ۲۰٪)"
              className="focus:ring-2 focus:ring-rose-500"
            />
          </div>
          <p className="text-[10px] text-gray-400">
            مقدار ۰.۲ = ۲۰٪ کاهش ارزش به دلیل کهنگی
            {formData.age_factor > 1 && (
              <span className="text-red-500 block">⚠️ مقدار باید بین ۰ تا ۱ باشد</span>
            )}
          </p>
        </div>
      </div>

      {/* 3. Last Review Date */}
      <div className="space-y-1">
        <Label className="text-sm font-medium">تاریخ آخرین بازنگری</Label>
        <Input
          type="date"
          value={formData.last_review_date || ''}
          onChange={(e) => handleChange('last_review_date', e.target.value)}
          className="focus:ring-2 focus:ring-rose-500"
        />
      </div>

      {/* Summary Card */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm font-medium mb-3">📊 خلاصه محاسبه</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div className="p-2 bg-white rounded-lg border">
            <p className="text-xs text-gray-400">هزینه نیروی کار</p>
            <p className="text-sm font-bold text-rose-600">
              {formatNumber(Math.round(calculateTotalLaborCost()))}
            </p>
          </div>
          <div className="p-2 bg-white rounded-lg border">
            <p className="text-xs text-gray-400">هزینه مستقیم</p>
            <p className="text-sm font-bold text-rose-600">
              {formatNumber(Number(formData.direct_reproduction_cost) || 0)}
            </p>
          </div>
          <div className="p-2 bg-white rounded-lg border">
            <p className="text-xs text-gray-400">ضریب سن</p>
            <p className="text-sm font-bold text-rose-600">
              {formatNumber((Number(formData.age_factor) || 0) * 100)}%
            </p>
          </div>
          <div className="p-2 bg-rose-50 rounded-lg border border-rose-200">
            <p className="text-xs text-gray-400">ارزش نهایی</p>
            <p className="text-lg font-bold text-rose-700">
              {formatNumber(Math.round(calculateFinalValue()))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
