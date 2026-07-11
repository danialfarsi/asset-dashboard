'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface LaborRow {
  id: number;
  role: string;
  person_months: number;
  monthly_rate: number;
  overhead_pct: number;
}

interface M05_RCMProps {
  formData: any;
  onChange: (data: any) => void;
  assetId?: number;
  valuationCaseId?: number;
  step2Data?: any;
}

export function M05_RCM({ formData, onChange, assetId, valuationCaseId, step2Data }: M05_RCMProps) {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [prevValuationCaseId, setPrevValuationCaseId] = useState<number | undefined>(undefined);

  // ============================================
  // 🔥 تشخیص تغییر دارایی (ارزش‌گذاری جدید)
  // ============================================
  useEffect(() => {
    if (valuationCaseId && valuationCaseId !== prevValuationCaseId) {
      console.log(`🔄 تغییر از ${prevValuationCaseId} به ${valuationCaseId}`);
      
      const hasExistingData = formData.labor_breakdown && formData.labor_breakdown.length > 0;
      
      if (!hasExistingData) {
        console.log('🔄 ریست کردن فرم برای دارایی جدید');
        setInitialized(false);
      }
      
      setPrevValuationCaseId(valuationCaseId);
    }
  }, [valuationCaseId, formData.labor_breakdown]);

  // ============================================
  // مقداردهی اولیه با داده‌های STEP 2
  // ============================================
  useEffect(() => {
    if (step2Data && !initialized) {
      console.log('📥 دریافت داده‌های STEP 2 برای M05:', step2Data);
      
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
  // بارگذاری از دیتابیس
  // ============================================
  useEffect(() => {
    if (valuationCaseId && initialized) {
      loadFromDatabase();
    }
  }, [valuationCaseId, initialized]);

  const loadFromDatabase = async () => {
    try {
      console.log(`📥 بارگذاری داده‌های M05 برای valuationCaseId: ${valuationCaseId}`);
      
      const { data } = await api.get(`/intangible/valuation-step3/?valuation_case=${valuationCaseId}`);
      const items = data.results || data || [];
      
      if (items.length > 0 && items[0].method_inputs) {
        const inputs = items[0].method_inputs;
        
        const m05Data: any = {};
        if (inputs.labor_breakdown) m05Data.labor_breakdown = inputs.labor_breakdown;
        if (inputs.material_infra_cost !== undefined) m05Data.material_infra_cost = inputs.material_infra_cost;
        if (inputs.overhead_pct !== undefined) m05Data.overhead_pct = inputs.overhead_pct;
        if (inputs.developer_profit_pct !== undefined) m05Data.developer_profit_pct = inputs.developer_profit_pct;
        if (inputs.economic_obs_pct !== undefined) m05Data.economic_obs_pct = inputs.economic_obs_pct;
        if (inputs.functional_obs_pct !== undefined) m05Data.functional_obs_pct = inputs.functional_obs_pct;
        
        if (Object.keys(m05Data).length > 0) {
          onChange(m05Data);
          console.log('📥 داده‌های M05 از دیتابیس بارگذاری شد:', m05Data);
        }
      } else {
        console.log('ℹ️ هیچ داده‌ای برای این valuationCaseId در دیتابیس وجود ندارد');
      }
    } catch (error) {
      console.error('Error loading M05 data:', error);
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
      person_months: 0,
      monthly_rate: 0,
      overhead_pct: 20,
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
  // محاسبات
  // ============================================
  const calculateTotalCost = () => {
    let total = 0;
    laborRows.forEach(row => {
      const laborCost = row.person_months * row.monthly_rate;
      const withOverhead = laborCost * (1 + (row.overhead_pct || 0) / 100);
      total += withOverhead;
    });
    total += formData.material_infra_cost || 0;
    return total;
  };

  const calculateFinalValue = () => {
    const total = calculateTotalCost();
    const overhead = (formData.overhead_pct || 20) / 100;
    const profit = (formData.developer_profit_pct || 15) / 100;
    const functionalObs = (formData.functional_obs_pct || 0) / 100;
    const economicObs = (formData.economic_obs_pct || 0) / 100;
    
    const withOverhead = total * (1 + overhead);
    const withProfit = withOverhead * (1 + profit);
    return withProfit * (1 - functionalObs) * (1 - economicObs);
  };

  // ============================================
  // ذخیره در دیتابیس
  // ============================================
  const saveToDatabase = async () => {
    if (!valuationCaseId) {
      console.warn('⚠️ valuationCaseId موجود نیست');
      return;
    }

    try {
      setSaving(true);
      setSaveError(null);

      const methodInputs = {
        tax_rate: formData.tax_rate || step2Data?.tax_rate || 25,
        discount_rate: formData.discount_rate || step2Data?.discount_rate || 18,
        forecast_horizon: formData.forecast_horizon || step2Data?.forecast_horizon || 5,
        terminal_growth_rate: formData.terminal_growth_rate || step2Data?.terminal_growth_rate || 5,
        current_revenue: formData.current_revenue || step2Data?.current_revenue || 500000000000,
        useful_life: formData.useful_life || step2Data?.useful_life || 5,
        currency: formData.currency || step2Data?.currency || 'IRR',
        source_reliability: formData.source_reliability || step2Data?.source_reliability || 'high',
        category: formData.category || step2Data?.category || 'operational',
        business_unit: formData.business_unit || step2Data?.business_unit || 'واحد مرکزی',
        lifecycle_stage: formData.lifecycle_stage || step2Data?.lifecycle_stage || 'growth',
        
        labor_breakdown: laborRows,
        material_infra_cost: formData.material_infra_cost || 0,
        overhead_pct: formData.overhead_pct || 20,
        developer_profit_pct: formData.developer_profit_pct || 15,
        functional_obs_pct: formData.functional_obs_pct || 0,
        economic_obs_pct: formData.economic_obs_pct || 0,
      };

      const payload = {
        valuation_case: valuationCaseId,
        method_id: 'M-05',
        method_inputs: methodInputs,
      };

      console.log('📤 ذخیره M05 در دیتابیس:', payload);
      
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
      console.log('✅ M05 در دیتابیس ذخیره شد:', response.data);
    } catch (error: any) {
      console.error('❌ خطا در ذخیره M05:', error);
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

  // ============================================
  // تبدیل اعداد به فارسی
  // ============================================
  const toPersianNumber = (num: number) => {
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    return num.toString().replace(/\d/g, (d) => persianDigits[parseInt(d)]);
  };

  const formatPersianNumber = (num: number) => {
    if (!num && num !== 0) return '۰';
    const parts = Math.round(num).toString().split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    return integerPart.replace(/\d/g, (d) => persianDigits[parseInt(d)]);
  };

  // ============================================
  // نمایش داده‌های STEP 2
  // ============================================
  const displayStep2Data = () => {
    const data = formData.tax_rate ? formData : step2Data;
    if (!data) return null;
    
    return (
      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-xs font-[family-name:var(--font-vazir)]">
        <p className="font-medium text-blue-700 mb-1">📥 داده‌های ورودی از STEP 2:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
          <div><span className="text-gray-500">نرخ مالیات:</span> <span className="font-bold">{toPersianNumber(data.tax_rate)}%</span></div>
          <div><span className="text-gray-500">نرخ تنزیل:</span> <span className="font-bold">{toPersianNumber(data.discount_rate)}%</span></div>
          <div><span className="text-gray-500">افق پیش‌بینی:</span> <span className="font-bold">{toPersianNumber(data.forecast_horizon)} سال</span></div>
          <div><span className="text-gray-500">درآمد جاری:</span> <span className="font-bold">{formatPersianNumber(data.current_revenue)}</span></div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 font-[family-name:var(--font-vazir)]">
      {/* هدر */}
      <div className="flex items-center justify-between">
        <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 flex-1">
          <p className="text-sm text-emerald-700">
            🔹 روش هزینه جایگزینی (RCM) - ارزش‌گذاری بر اساس هزینه بازسازی دارایی معادل.
            <span className="inline-block mr-2 px-2 py-0.5 bg-emerald-200 text-emerald-800 rounded-full text-xs font-medium">
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

      {displayStep2Data()}

      {/* جدول نیروی کار */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-1">
          جدول نیروی کار <span className="text-red-500">*</span>
        </Label>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border p-2 text-right">نقش</th>
                <th className="border p-2 text-right">نفر-ماه</th>
                <th className="border p-2 text-right">نرخ ماهانه (IRR)</th>
                <th className="border p-2 text-right">سربار (%)</th>
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
                      className="h-8 text-sm border-0 focus:ring-1 font-[family-name:var(--font-vazir)]"
                      placeholder="نقش"
                    />
                  </td>
                  <td className="border p-1">
                    <Input
                      type="number"
                      value={row.person_months || ''}
                      onChange={(e) => updateLaborRow(row.id, 'person_months', parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm border-0 focus:ring-1 font-[family-name:var(--font-vazir)]"
                      placeholder="۰"
                    />
                  </td>
                  <td className="border p-1">
                    <Input
                      type="number"
                      value={row.monthly_rate || ''}
                      onChange={(e) => updateLaborRow(row.id, 'monthly_rate', parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm border-0 focus:ring-1 font-[family-name:var(--font-vazir)]"
                      placeholder="۰"
                    />
                  </td>
                  <td className="border p-1">
                    <Input
                      type="number"
                      value={row.overhead_pct || ''}
                      onChange={(e) => updateLaborRow(row.id, 'overhead_pct', parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm border-0 focus:ring-1 font-[family-name:var(--font-vazir)]"
                      placeholder="۲۰"
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
        <Button variant="outline" size="sm" onClick={addLaborRow} className="flex items-center gap-1 font-[family-name:var(--font-vazir)]">
          <Plus className="w-4 h-4" />
          افزودن ردیف
        </Button>
        <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">* حداقل ۱ ردیف الزامی</p>
      </div>

      {/* پارامترها */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-sm font-medium">هزینه مواد/زیرساخت</Label>
          <Input
            type="number"
            value={formData.material_infra_cost || ''}
            onChange={(e) => handleChange('material_infra_cost', parseFloat(e.target.value) || 0)}
            placeholder="مثلاً ۱۵۰,۰۰۰,۰۰۰"
            className="focus:ring-2 focus:ring-emerald-500 font-[family-name:var(--font-vazir)]"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium flex items-center gap-1">
            سربار <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              step="0.5"
              value={formData.overhead_pct || ''}
              onChange={(e) => handleChange('overhead_pct', parseFloat(e.target.value) || 0)}
              className="focus:ring-2 focus:ring-emerald-500 font-[family-name:var(--font-vazir)]"
              placeholder="۲۰"
            />
            <span className="text-sm text-gray-400 font-[family-name:var(--font-vazir)]">٪</span>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium flex items-center gap-1">
            سود توسعه‌دهنده <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              step="0.5"
              value={formData.developer_profit_pct || ''}
              onChange={(e) => handleChange('developer_profit_pct', parseFloat(e.target.value) || 0)}
              className="focus:ring-2 focus:ring-emerald-500 font-[family-name:var(--font-vazir)]"
              placeholder="۱۵"
            />
            <span className="text-sm text-gray-400 font-[family-name:var(--font-vazir)]">٪</span>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium">منسوخی کارکردی</Label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              step="0.5"
              value={formData.functional_obs_pct || ''}
              disabled
              className="bg-gray-50 focus:ring-2 focus:ring-emerald-500 font-[family-name:var(--font-vazir)]"
              placeholder="۰"
            />
            <span className="text-sm text-gray-400 font-[family-name:var(--font-vazir)]">٪</span>
            <span className="text-xs text-emerald-600 font-[family-name:var(--font-vazir)]">🤖 خودکار</span>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-sm font-medium flex items-center gap-1">
            منسوخی اقتصادی <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              step="0.5"
              value={formData.economic_obs_pct || ''}
              onChange={(e) => handleChange('economic_obs_pct', parseFloat(e.target.value) || 0)}
              className="focus:ring-2 focus:ring-emerald-500 font-[family-name:var(--font-vazir)]"
              placeholder="۰"
            />
            <span className="text-sm text-gray-400 font-[family-name:var(--font-vazir)]">٪</span>
          </div>
        </div>
      </div>

      {/* خلاصه */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm font-medium mb-3 font-[family-name:var(--font-vazir)]">📊 خلاصه محاسبه</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div className="p-2 bg-white rounded-lg border">
            <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">هزینه مستقیم</p>
            <p className="text-sm font-bold text-dark-green font-[family-name:var(--font-vazir)]">{formatPersianNumber(Math.round(calculateTotalCost()))}</p>
          </div>
          <div className="p-2 bg-white rounded-lg border">
            <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">با سربار</p>
            <p className="text-sm font-bold text-dark-green font-[family-name:var(--font-vazir)]">
              {formatPersianNumber(Math.round(calculateTotalCost() * (1 + (formData.overhead_pct || 20) / 100)))}
            </p>
          </div>
          <div className="p-2 bg-white rounded-lg border">
            <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">با سود</p>
            <p className="text-sm font-bold text-dark-green font-[family-name:var(--font-vazir)]">
              {formatPersianNumber(Math.round(calculateTotalCost() * (1 + (formData.overhead_pct || 20) / 100) * (1 + (formData.developer_profit_pct || 15) / 100)))}
            </p>
          </div>
          <div className="p-2 bg-dark-green/5 rounded-lg border border-dark-green/20">
            <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">ارزش نهایی</p>
            <p className="text-lg font-bold text-dark-green font-[family-name:var(--font-vazir)]">{formatPersianNumber(Math.round(calculateFinalValue()))}</p>
          </div>
        </div>
      </div>
    </div>
  );
}