'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Upload, X, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

interface FCFRow {
  id: number;
  year: number;
  amount: number;
}

interface ExpertSignoff {
  id: number;
  expert_name: string;
  signature_date: string;
  notes: string;
}

interface M04_WWMProps {
  formData: any;
  onChange: (data: any) => void;
  assetId?: number;
  valuationCaseId?: number;
  step2Data?: any;
}

export function M04_WWM({ formData, onChange, assetId, valuationCaseId, step2Data }: M04_WWMProps) {
  const [files, setFiles] = useState<Record<string, File>>({});
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [prevValuationCaseId, setPrevValuationCaseId] = useState<number | undefined>(undefined);

  // تبدیل عدد به فارسی
  const toPersianNumber = (num: number) => {
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    return num.toString().replace(/\d/g, (d) => persianDigits[parseInt(d)]);
  };

  // ============================================
  // 🔥 تشخیص تغییر دارایی (ارزش‌گذاری جدید)
  // ============================================
  useEffect(() => {
    if (valuationCaseId && valuationCaseId !== prevValuationCaseId) {
      console.log(`🔄 تغییر از ${prevValuationCaseId} به ${valuationCaseId}`);
      
      const hasExistingData = formData.with_asset_fcf && formData.with_asset_fcf.length > 0;
      
      if (!hasExistingData) {
        console.log('🔄 ریست کردن فرم برای دارایی جدید');
        setInitialized(false);
        // ریست کردن فیلدهای اصلی
        onChange({
          with_asset_fcf: [{ id: 1, year: 1, amount: 0 }],
          without_asset_fcf: [{ id: 1, year: 1, amount: 0 }],
          ramp_up_period: 0,
          revenue_attribution: 0,
          revenue_growth_rate: 0,
          expert_signoffs: [],
        });
      }
      
      setPrevValuationCaseId(valuationCaseId);
    }
  }, [valuationCaseId, formData.with_asset_fcf]);

  // ============================================
  // مقداردهی اولیه با داده‌های STEP 2
  // ============================================
  useEffect(() => {
    if (step2Data && !initialized) {
      console.log('📥 دریافت داده‌های STEP 2 برای M04:', step2Data);
      
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

  // بارگذاری داده‌های ذخیره‌شده
  useEffect(() => {
    if (valuationCaseId && initialized) {
      loadFromDatabase();
    }
  }, [valuationCaseId, initialized]);

  const loadFromDatabase = async () => {
    try {
      console.log(`📥 بارگذاری داده‌های M04 برای valuationCaseId: ${valuationCaseId}`);
      
      const { data } = await api.get(`/intangible/valuation-step3/?valuation_case=${valuationCaseId}`);
      const items = data.results || data || [];
      
      if (items.length > 0 && items[0].method_inputs) {
        const inputs = items[0].method_inputs;
        const m04Data: any = {};
        
        if (inputs.with_asset_fcf) m04Data.with_asset_fcf = inputs.with_asset_fcf;
        if (inputs.without_asset_fcf) m04Data.without_asset_fcf = inputs.without_asset_fcf;
        if (inputs.ramp_up_period !== undefined) m04Data.ramp_up_period = inputs.ramp_up_period;
        if (inputs.revenue_attribution !== undefined) m04Data.revenue_attribution = inputs.revenue_attribution;
        if (inputs.revenue_growth_rate !== undefined) m04Data.revenue_growth_rate = inputs.revenue_growth_rate;
        if (inputs.expert_signoffs) m04Data.expert_signoffs = inputs.expert_signoffs;
        
        if (Object.keys(m04Data).length > 0) {
          onChange(m04Data);
          console.log('📥 داده‌های M04 از دیتابیس بارگذاری شد:', m04Data);
        }
      } else {
        console.log('ℹ️ هیچ داده‌ای برای این valuationCaseId در دیتابیس وجود ندارد');
      }
    } catch (error) {
      console.error('Error loading M04 data:', error);
    }
  };

  const withAssetRows: FCFRow[] = formData.with_asset_fcf || [
    { id: 1, year: 1, amount: 0 },
    { id: 2, year: 2, amount: 0 },
    { id: 3, year: 3, amount: 0 },
    { id: 4, year: 4, amount: 0 },
    { id: 5, year: 5, amount: 0 },
  ];

  const withoutAssetRows: FCFRow[] = formData.without_asset_fcf || [
    { id: 1, year: 1, amount: 0 },
    { id: 2, year: 2, amount: 0 },
    { id: 3, year: 3, amount: 0 },
    { id: 4, year: 4, amount: 0 },
    { id: 5, year: 5, amount: 0 },
  ];

  const expertSignoffs: ExpertSignoff[] = formData.expert_signoffs || [];

  const handleChange = (field: string, value: any) => {
    onChange({ [field]: value });
  };

  // ============================================
  // توابع جدول FCF
  // ============================================
  const updateFCFRow = (
    rows: FCFRow[],
    setter: (rows: FCFRow[]) => void,
    id: number,
    field: string,
    value: any
  ) => {
    const newRows = rows.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    );
    setter(newRows);
  };

  const addFCFRow = (rows: FCFRow[], setter: (rows: FCFRow[]) => void) => {
    const maxYear = rows.reduce((max, row) => Math.max(max, row.year), 0);
    const newRow: FCFRow = {
      id: Date.now(),
      year: maxYear + 1,
      amount: 0,
    };
    setter([...rows, newRow]);
  };

  const removeFCFRow = (rows: FCFRow[], setter: (rows: FCFRow[]) => void, id: number) => {
    if (rows.length <= 1) {
      alert('حداقل یک ردیف باید وجود داشته باشد');
      return;
    }
    setter(rows.filter(row => row.id !== id));
  };

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
  // محاسبات
  // ============================================
  const calculateTotalWith = () => {
    return withAssetRows.reduce((sum, row) => sum + (row.amount || 0), 0);
  };

  const calculateTotalWithout = () => {
    return withoutAssetRows.reduce((sum, row) => sum + (row.amount || 0), 0);
  };

  const calculateIncrementalValue = () => {
    return calculateTotalWith() - calculateTotalWithout();
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
  // 🔥 ذخیره در دیتابیس
  // ============================================
  const saveToDatabase = async () => {
    if (!valuationCaseId) {
      console.warn('⚠️ valuationCaseId موجود نیست');
      return;
    }

    try {
      setSaving(true);
      setSaveError(null);

      const payload = {
        valuation_case: valuationCaseId,
        method_id: 'M-04',
        method_inputs: {
          with_asset_fcf: withAssetRows,
          without_asset_fcf: withoutAssetRows,
          ramp_up_period: formData.ramp_up_period || 0,
          revenue_attribution: formData.revenue_attribution || 0,
          revenue_growth_rate: formData.revenue_growth_rate || 0,
          expert_signoffs: expertSignoffs,
          scenario_report: formData.scenario_report || null,
          expert_approval: formData.expert_approval || null,
        },
      };

      console.log('📤 ذخیره M04 در دیتابیس:', payload);
      
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
      console.log('✅ M04 در دیتابیس ذخیره شد:', response.data);
    } catch (error: any) {
      console.error('❌ خطا در ذخیره M04:', error);
      setSaveError(error?.response?.data?.message || 'خطا در ذخیره');
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
  }, [formData, withAssetRows, withoutAssetRows, expertSignoffs]);

  // ============================================
  // 🔥 نمایش داده‌های STEP 2 به فارسی
  // ============================================
  const displayStep2Data = () => {
    const data = formData.tax_rate ? formData : step2Data;
    if (!data) return null;
    
    return (
      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-xs">
        <p className="font-medium text-blue-700 mb-1 font-[family-name:var(--font-vazir)]">📥 داده‌های ورودی از STEP 2:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1 font-[family-name:var(--font-vazir)]">
          <div><span className="text-gray-500">نرخ مالیات:</span> <span className="font-bold">{data.tax_rate}%</span></div>
          <div><span className="text-gray-500">نرخ تنزیل:</span> <span className="font-bold">{data.discount_rate}%</span></div>
          <div><span className="text-gray-500">افق پیش‌بینی:</span> <span className="font-bold">{toPersianNumber(data.forecast_horizon)} سال</span></div>
          <div><span className="text-gray-500">درآمد جاری:</span> <span className="font-bold">{toPersianNumber(data.current_revenue?.toLocaleString())}</span></div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 font-[family-name:var(--font-vazir)]">
      {/* هدر با وضعیت ذخیره */}
      <div className="flex items-center justify-between">
        <div className="bg-teal-50 p-4 rounded-lg border border-teal-200 flex-1">
          <p className="text-sm text-teal-700">
            🔹 روش با و بدون دارایی (WWM) 
            <span className="inline-block mr-2 px-2 py-0.5 bg-teal-200 text-teal-800 rounded-full text-xs font-medium">
              
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

      {/* نمایش داده‌های STEP 2 به فارسی */}
      {displayStep2Data()}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ======================================== */}
        {/* ستون چپ: با دارایی */}
        {/* ======================================== */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-1">
            جدول FCF با دارایی <span className="text-red-500">*</span>
          </Label>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-teal-50">
                  <th className="border p-2 text-right">سال</th>
                  <th className="border p-2 text-right">مبلغ FCF (ریال)</th>
                  <th className="border p-2 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {withAssetRows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="border p-1">
                      <Input
                        type="number"
                        value={row.year || ''}
                        onChange={(e) => {
                          const newRows = withAssetRows.map(r =>
                            r.id === row.id ? { ...r, year: parseInt(e.target.value) || 0 } : r
                          );
                          handleChange('with_asset_fcf', newRows);
                        }}
                        className="h-8 text-sm border-0 focus:ring-1 font-[family-name:var(--font-vazir)]"
                        placeholder="سال"
                      />
                    </td>
                    <td className="border p-1">
                      <Input
                        type="number"
                        value={row.amount || ''}
                        onChange={(e) => {
                          const newRows = withAssetRows.map(r =>
                            r.id === row.id ? { ...r, amount: parseFloat(e.target.value) || 0 } : r
                          );
                          handleChange('with_asset_fcf', newRows);
                        }}
                        className="h-8 text-sm border-0 focus:ring-1 font-[family-name:var(--font-vazir)]"
                        placeholder="۰"
                      />
                    </td>
                    <td className="border p-1 text-center">
                      <button
                        onClick={() => {
                          if (withAssetRows.length <= 1) return;
                          const newRows = withAssetRows.filter(r => r.id !== row.id);
                          handleChange('with_asset_fcf', newRows);
                        }}
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const maxYear = withAssetRows.reduce((max, r) => Math.max(max, r.year), 0);
              const newRow: FCFRow = { id: Date.now(), year: maxYear + 1, amount: 0 };
              handleChange('with_asset_fcf', [...withAssetRows, newRow]);
            }}
            className="flex items-center gap-1 font-[family-name:var(--font-vazir)]"
          >
            <Plus className="w-4 h-4" />
            افزودن ردیف
          </Button>
          <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">* حداقل ۱ ردیف الزامی</p>
        </div>

        {/* ======================================== */}
        {/* ستون راست: بدون دارایی */}
        {/* ======================================== */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-1">
            جدول FCF بدون دارایی <span className="text-red-500">*</span>
          </Label>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-teal-50">
                  <th className="border p-2 text-right">سال</th>
                  <th className="border p-2 text-right">مبلغ FCF (ریال)</th>
                  <th className="border p-2 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {withoutAssetRows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="border p-1">
                      <Input
                        type="number"
                        value={row.year || ''}
                        onChange={(e) => {
                          const newRows = withoutAssetRows.map(r =>
                            r.id === row.id ? { ...r, year: parseInt(e.target.value) || 0 } : r
                          );
                          handleChange('without_asset_fcf', newRows);
                        }}
                        className="h-8 text-sm border-0 focus:ring-1 font-[family-name:var(--font-vazir)]"
                        placeholder="سال"
                      />
                    </td>
                    <td className="border p-1">
                      <Input
                        type="number"
                        value={row.amount || ''}
                        onChange={(e) => {
                          const newRows = withoutAssetRows.map(r =>
                            r.id === row.id ? { ...r, amount: parseFloat(e.target.value) || 0 } : r
                          );
                          handleChange('without_asset_fcf', newRows);
                        }}
                        className="h-8 text-sm border-0 focus:ring-1 font-[family-name:var(--font-vazir)]"
                        placeholder="۰"
                      />
                    </td>
                    <td className="border p-1 text-center">
                      <button
                        onClick={() => {
                          if (withoutAssetRows.length <= 1) return;
                          const newRows = withoutAssetRows.filter(r => r.id !== row.id);
                          handleChange('without_asset_fcf', newRows);
                        }}
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const maxYear = withoutAssetRows.reduce((max, r) => Math.max(max, r.year), 0);
              const newRow: FCFRow = { id: Date.now(), year: maxYear + 1, amount: 0 };
              handleChange('without_asset_fcf', [...withoutAssetRows, newRow]);
            }}
            className="flex items-center gap-1 font-[family-name:var(--font-vazir)]"
          >
            <Plus className="w-4 h-4" />
            افزودن ردیف
          </Button>
          <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">* حداقل ۱ ردیف الزامی</p>
        </div>
      </div>

      {/* ======================================== */}
      {/* پارامترهای اضافی */}
      {/* ======================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label className="text-sm font-medium flex items-center gap-1">
            دوره رشد (ماه) <span className="text-red-500">*</span>
          </Label>
          <Input
            type="number"
            value={formData.ramp_up_period || ''}
            onChange={(e) => handleChange('ramp_up_period', parseInt(e.target.value) || 0)}
            placeholder="مثلاً ۱۲"
            className="focus:ring-2 focus:ring-teal-500 font-[family-name:var(--font-vazir)]"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium flex items-center gap-1">
            سهم درآمد منتسب <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              step="0.1"
              value={formData.revenue_attribution || ''}
              onChange={(e) => handleChange('revenue_attribution', parseFloat(e.target.value) || 0)}
              placeholder="مثلاً ۸۰"
              className="focus:ring-2 focus:ring-teal-500 font-[family-name:var(--font-vazir)]"
            />
            <span className="text-sm text-gray-400 font-[family-name:var(--font-vazir)]">٪</span>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium flex items-center gap-1">
            نرخ رشد درآمد <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              step="0.1"
              value={formData.revenue_growth_rate || ''}
              onChange={(e) => handleChange('revenue_growth_rate', parseFloat(e.target.value) || 0)}
              placeholder="مثلاً ۸"
              className="focus:ring-2 focus:ring-teal-500 font-[family-name:var(--font-vazir)]"
            />
            <span className="text-sm text-gray-400 font-[family-name:var(--font-vazir)]">٪</span>
          </div>
        </div>
      </div>

      {/* ======================================== */}
      {/* خلاصه محاسبه */}
      {/* ======================================== */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm font-medium mb-3 font-[family-name:var(--font-vazir)]">📊 خلاصه محاسبه</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-2 bg-white rounded-lg border">
            <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">جمع FCF با دارایی</p>
            <p className="text-sm font-bold text-teal-600 font-[family-name:var(--font-vazir)]">
              {toPersianNumber(calculateTotalWith().toLocaleString())}
            </p>
          </div>
          <div className="p-2 bg-white rounded-lg border">
            <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">جمع FCF بدون دارایی</p>
            <p className="text-sm font-bold text-red-500 font-[family-name:var(--font-vazir)]">
              {toPersianNumber(calculateTotalWithout().toLocaleString())}
            </p>
          </div>
          <div className="p-2 bg-teal-50 rounded-lg border border-teal-200">
            <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">ارزش افزایشی</p>
            <p className="text-lg font-bold text-teal-700 font-[family-name:var(--font-vazir)]">
              {toPersianNumber(calculateIncrementalValue().toLocaleString())}
            </p>
          </div>
        </div>
      </div>

      {/* ======================================== */}
      {/* تأیید خبرگان */}
      {/* ======================================== */}
      <div className="space-y-3 pt-4 border-t">
        <Label className="text-sm font-medium font-[family-name:var(--font-vazir)]">تأیید خبرگان (اختیاری)</Label>
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

      {/* ======================================== */}
      {/* شواهد */}
      {/* ======================================== */}
      <div className="space-y-3 pt-4 border-t">
        <p className="text-sm font-medium font-[family-name:var(--font-vazir)]">📎 شواهد و مدارک</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 border-2 border-dashed rounded-lg hover:border-teal-400 transition-colors">
            <Label className="text-sm font-[family-name:var(--font-vazir)]">گزارش تحلیل سناریو</Label>
            {files.scenario_report ? (
              <div className="flex items-center justify-between mt-2 p-2 bg-teal-50 rounded">
                <span className="text-sm truncate font-[family-name:var(--font-vazir)]">{files.scenario_report.name}</span>
                <button onClick={() => removeFile('scenario_report')} className="text-red-500 hover:text-red-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="mt-2">
                <input
                  type="file"
                  id="scenario_report"
                  className="hidden"
                  onChange={(e) => handleFileUpload('scenario_report', e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="scenario_report"
                  className="flex items-center gap-2 text-sm text-teal-600 cursor-pointer hover:text-teal-800 font-[family-name:var(--font-vazir)]"
                >
                  <Upload className="w-4 h-4" />
                  آپلود فایل
                </label>
              </div>
            )}
          </div>
          <div className="p-3 border-2 border-dashed rounded-lg hover:border-teal-400 transition-colors">
            <Label className="text-sm font-[family-name:var(--font-vazir)]">تأییدیه خبرگان</Label>
            {files.expert_approval ? (
              <div className="flex items-center justify-between mt-2 p-2 bg-teal-50 rounded">
                <span className="text-sm truncate font-[family-name:var(--font-vazir)]">{files.expert_approval.name}</span>
                <button onClick={() => removeFile('expert_approval')} className="text-red-500 hover:text-red-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="mt-2">
                <input
                  type="file"
                  id="expert_approval"
                  className="hidden"
                  onChange={(e) => handleFileUpload('expert_approval', e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="expert_approval"
                  className="flex items-center gap-2 text-sm text-teal-600 cursor-pointer hover:text-teal-800 font-[family-name:var(--font-vazir)]"
                >
                  <Upload className="w-4 h-4" />
                  آپلود فایل
                </label>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}