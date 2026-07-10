'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Upload, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface LaborRow {
  id: number;
  role: string;
  person_days: number;
  daily_rate: number;
}

interface M06_RPCMProps {
  formData: any;
  onChange: (data: any) => void;
  fieldsConfig?: any;
  assetId?: number;
  valuationCaseId?: number;
  step2Data?: any;
}

export function M06_RPCM({ formData, onChange, assetId, valuationCaseId, step2Data }: M06_RPCMProps) {
  const [files, setFiles] = useState<Record<string, File>>({});
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [prevValuationCaseId, setPrevValuationCaseId] = useState<number | undefined>(undefined);

  // ============================================
  // 🔥 تشخیص تغییر دارایی (ارزش‌گذاری جدید)
  // ============================================
  useEffect(() => {
    // اگه valuationCaseId تغییر کرده
    if (valuationCaseId && valuationCaseId !== prevValuationCaseId) {
      console.log(`🔄 تغییر از ${prevValuationCaseId} به ${valuationCaseId}`);
      
      // چک کن که آیا داده‌ای برای این دارایی جدید وجود داره
      const hasExistingData = formData.labor_breakdown && formData.labor_breakdown.length > 0;
      
      // اگه داده‌ای وجود نداشته باشه (ارزش‌گذاری جدید)
      if (!hasExistingData) {
        console.log('🔄 ریست کردن فرم برای دارایی جدید');
        setInitialized(false);
        // ریست کردن فایل‌ها
        setFiles({});
      }
      
      setPrevValuationCaseId(valuationCaseId);
    }
  }, [valuationCaseId, formData.labor_breakdown]);

  // ============================================
  // 🔥 مقداردهی اولیه با داده‌های STEP 2
  // ============================================
  useEffect(() => {
    if (step2Data && !initialized) {
      console.log('📥 دریافت داده‌های STEP 2 برای M06:', step2Data);
      
      if (!formData.tax_rate && step2Data.tax_rate) {
        onChange({
          tax_rate: step2Data.tax_rate,
          discount_rate: step2Data.discount_rate,
          forecast_horizon: step2Data.forecast_horizon,
          terminal_growth_rate: step2Data.terminal_growth_rate,
          current_revenue: step2Data.current_revenue,
          useful_life: step2Data.useful_life,
          currency: step2Data.currency,
          source_reliability: step2Data.source_reliability,
          category: step2Data.category,
          business_unit: step2Data.business_unit,
          lifecycle_stage: step2Data.lifecycle_stage,
        });
      }
      setInitialized(true);
    }
  }, [step2Data, initialized]);

  // ============================================
  // بارگذاری داده‌های ذخیره‌شده از دیتابیس
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
      
      if (items.length > 0 && items[0].method_inputs) {
        const inputs = items[0].method_inputs;
        
        const m06Data: any = {};
        if (inputs.labor_breakdown) m06Data.labor_breakdown = inputs.labor_breakdown;
        if (inputs.direct_reproduction_cost !== undefined) m06Data.direct_reproduction_cost = inputs.direct_reproduction_cost;
        if (inputs.coordination_overhead !== undefined) m06Data.coordination_overhead = inputs.coordination_overhead;
        if (inputs.relevance_obsolescence !== undefined) m06Data.relevance_obsolescence = inputs.relevance_obsolescence;
        if (inputs.age_factor !== undefined) m06Data.age_factor = inputs.age_factor;
        if (inputs.last_review_date) m06Data.last_review_date = inputs.last_review_date;
        
        if (Object.keys(m06Data).length > 0) {
          onChange(m06Data);
          console.log('📥 داده‌های M06 از دیتابیس بارگذاری شد:', m06Data);
        }
      } else {
        console.log('ℹ️ هیچ داده‌ای برای این valuationCaseId در دیتابیس وجود ندارد');
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
  // 🔥 محاسبات با مقدار پیش‌فرض (رفع NaN)
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
    const ageFactor = 1 - (Number(formData.age_factor) || 0) / 100;
    
    return totalDirect * overhead * obsolescence * ageFactor;
  };

  // ============================================
  // 🔥 ذخیره در دیتابیس (همراه با داده‌های STEP 2)
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

      // 🔥 ترکیب داده‌های STEP 2 و M06
      const methodInputs = {
        // ============================================
        // 🔥 داده‌های STEP 2 (اجباری برای STEP 4)
        // ============================================
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
        
        // ============================================
        // داده‌های M06
        // ============================================
        labor_breakdown: laborRows.map(row => ({
          id: row.id,
          role: row.role || '',
          person_days: Number(row.person_days) || 0,
          daily_rate: Number(row.daily_rate) || 0,
        })),
        direct_reproduction_cost: Number(formData.direct_reproduction_cost) || 0,
        coordination_overhead: Number(formData.coordination_overhead) || 20,
        relevance_obsolescence: Number(formData.relevance_obsolescence) || 0,
        age_factor: Number(formData.age_factor) || 0,
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
      
      let response;
      if (items.length > 0) {
        const step3Id = items[0].id;
        response = await api.put(`/intangible/valuation-step3/${step3Id}/`, payload);
      } else {
        response = await api.post('/intangible/valuation-step3/', payload);
      }

      setLastSaved(new Date().toLocaleTimeString('fa-IR'));
      console.log('✅ M06 در دیتابیس ذخیره شد:', response.data);
    } catch (error: any) {
      console.error('❌ خطا در ذخیره M06:', error);
      const errorMsg = error?.response?.data?.message || error?.response?.data?.error || 'خطا در ذخیره';
      setSaveError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  // Auto-save با debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      saveToDatabase();
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData, laborRows]);

  return (
    <div className="space-y-6">
      {/* هدر با وضعیت ذخیره */}
      <div className="flex items-center justify-between">
        <div className="bg-rose-50 p-4 rounded-lg border border-rose-200 flex-1">
          <p className="text-sm text-rose-700">
            🔹 روش هزینه بازتولید (RPCM) - ارزش‌گذاری بر اساس هزینه بازتولید دقیق دارایی.
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

      {/* ⚠️ نمایش خطا با جزئیات */}
      {saveError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
          ❌ {saveError}
        </div>
      )}

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
            placeholder="مثلاً 500,000,000"
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

        <div className="space-y-1">
          <Label className="text-sm font-medium">ضریب سن</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.age_factor || ''}
            onChange={(e) => handleChange('age_factor', Number(e.target.value) || 0)}
            placeholder="۰.۹۰"
            className="focus:ring-2 focus:ring-rose-500"
          />
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

      {/* 4. Files */}
      <div className="space-y-3 pt-4 border-t">
        <p className="text-sm font-medium">📎 شواهد و مدارک</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 border-2 border-dashed rounded-lg hover:border-rose-400 transition-colors">
            <Label className="text-sm">گزارش بازتولید</Label>
            {files.reproduction_report ? (
              <div className="flex items-center justify-between mt-2 p-2 bg-rose-50 rounded">
                <span className="text-sm truncate">{files.reproduction_report.name}</span>
                <button onClick={() => removeFile('reproduction_report')} className="text-red-500 hover:text-red-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="mt-2">
                <input
                  type="file"
                  id="reproduction_report"
                  className="hidden"
                  onChange={(e) => handleFileUpload('reproduction_report', e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="reproduction_report"
                  className="flex items-center gap-2 text-sm text-rose-600 cursor-pointer hover:text-rose-800"
                >
                  <Upload className="w-4 h-4" />
                  آپلود فایل
                </label>
              </div>
            )}
          </div>
          <div className="p-3 border-2 border-dashed rounded-lg hover:border-rose-400 transition-colors">
            <Label className="text-sm">مدارک پشتیبان</Label>
            {files.supporting_docs ? (
              <div className="flex items-center justify-between mt-2 p-2 bg-rose-50 rounded">
                <span className="text-sm truncate">{files.supporting_docs.name}</span>
                <button onClick={() => removeFile('supporting_docs')} className="text-red-500 hover:text-red-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="mt-2">
                <input
                  type="file"
                  id="supporting_docs"
                  className="hidden"
                  onChange={(e) => handleFileUpload('supporting_docs', e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="supporting_docs"
                  className="flex items-center gap-2 text-sm text-rose-600 cursor-pointer hover:text-rose-800"
                >
                  <Upload className="w-4 h-4" />
                  آپلود فایل
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm font-medium mb-3">📊 خلاصه محاسبه</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div className="p-2 bg-white rounded-lg border">
            <p className="text-xs text-gray-400">هزینه نیروی کار</p>
            <p className="text-sm font-bold text-rose-600">{Math.round(calculateTotalLaborCost()).toLocaleString()}</p>
          </div>
          <div className="p-2 bg-white rounded-lg border">
            <p className="text-xs text-gray-400">هزینه مستقیم</p>
            <p className="text-sm font-bold text-rose-600">
              {(Number(formData.direct_reproduction_cost) || 0).toLocaleString()}
            </p>
          </div>
          <div className="p-2 bg-white rounded-lg border">
            <p className="text-xs text-gray-400">مجموع مستقیم</p>
            <p className="text-sm font-bold text-rose-600">
              {(calculateTotalLaborCost() + (Number(formData.direct_reproduction_cost) || 0)).toLocaleString()}
            </p>
          </div>
          <div className="p-2 bg-rose-50 rounded-lg border border-rose-200">
            <p className="text-xs text-gray-400">ارزش نهایی</p>
            <p className="text-lg font-bold text-rose-700">{Math.round(calculateFinalValue()).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}