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
} from 'lucide-react';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';

interface FCFRow {
  id: number;
  year: number;
  fcf: number;
  capex: number;
  delta_wc: number;
}

interface ExpertSignoff {
  id: number;
  expert_name: string;
  signature_date: string;
  notes: string;
}

interface M03_DCFProps {
  formData: any;
  onChange: (data: any) => void;
  assetId?: number;
  valuationCaseId?: number;
  step2Data?: any;
}

export function M03_DCF({ formData, onChange, assetId, valuationCaseId, step2Data }: M03_DCFProps) {
  const [files, setFiles] = useState<Record<string, File>>({});
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [prevValuationCaseId, setPrevValuationCaseId] = useState<number | undefined>(undefined);

  // ============================================
  // تشخیص تغییر دارایی
  // ============================================
  useEffect(() => {
    if (valuationCaseId && valuationCaseId !== prevValuationCaseId) {
      const hasExistingData = formData.fcf_schedule !== undefined || formData.intangible_share_percent !== undefined;
      
      if (!hasExistingData) {
        setInitialized(false);
        onChange({
          fcf_schedule: [
            { id: 1, year: 1, fcf: 80000000, capex: 15000000, delta_wc: 5000000 },
            { id: 2, year: 2, fcf: 90000000, capex: 16000000, delta_wc: 6000000 },
            { id: 3, year: 3, fcf: 100000000, capex: 17000000, delta_wc: 7000000 },
            { id: 4, year: 4, fcf: 110000000, capex: 18000000, delta_wc: 8000000 },
            { id: 5, year: 5, fcf: 120000000, capex: 19000000, delta_wc: 9000000 },
          ],
          intangible_share_percent: 70,
          expert_signoffs: [],
        });
      }
      
      setPrevValuationCaseId(valuationCaseId);
    }
  }, [valuationCaseId, formData.fcf_schedule]);

  // ============================================
  // مقداردهی اولیه با داده‌های STEP 2
  // ============================================
  useEffect(() => {
    if (step2Data && !initialized) {
      const updates: any = {};
      
      // 🔥 از step2Data استفاده کن
      if (formData.forecast_horizon === undefined) {
        updates.forecast_horizon = step2Data.forecast_horizon || 5;
      }
      if (formData.tax_rate === undefined) {
        updates.tax_rate = step2Data.tax_rate || 25;
      }
      if (formData.discount_rate === undefined) {
        updates.discount_rate = step2Data.discount_rate || 18;
      }
      if (formData.terminal_growth_rate === undefined) {
        updates.terminal_growth_rate = step2Data.terminal_growth_rate || 5;
      }
      if (formData.quality_multiplier === undefined) {
        updates.quality_multiplier = step2Data.quality_multiplier || 0.85;
      }
      if (formData.current_revenue === undefined) {
        updates.current_revenue = step2Data.current_revenue || 0;
      }
      
      if (Object.keys(updates).length > 0) {
        onChange(updates);
        console.log('📥 داده‌های STEP 2 به فرم اضافه شد:', updates);
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
        const m03Data: any = {};
        
        const fields = [
          'fcf_schedule', 'intangible_share_percent', 'expert_signoffs',
          'forecast_horizon', 'tax_rate', 'discount_rate',
          'terminal_growth_rate', 'quality_multiplier', 'current_revenue'
        ];
        
        fields.forEach(field => {
          if (inputs[field] !== undefined) {
            m03Data[field] = inputs[field];
          }
        });
        
        if (Object.keys(m03Data).length > 0) {
          onChange(m03Data);
        }
      }
    } catch (error) {
      console.error('Error loading M03 data:', error);
    }
  };

  const handleChange = (field: string, value: any) => {
    onChange({ [field]: value });
  };

  const fcfSchedule: FCFRow[] = formData.fcf_schedule || [];
  const expertSignoffs: ExpertSignoff[] = formData.expert_signoffs || [];

  // ============================================
  // توابع جدول FCF
  // ============================================
  const addFCFRow = () => {
    const maxYear = fcfSchedule.reduce((max, row) => Math.max(max, row.year), 0);
    const newRow: FCFRow = {
      id: Date.now(),
      year: maxYear + 1,
      fcf: 0,
      capex: 0,
      delta_wc: 0,
    };
    handleChange('fcf_schedule', [...fcfSchedule, newRow]);
  };

  const updateFCFRow = (id: number, field: string, value: any) => {
    const newSchedule = fcfSchedule.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    );
    handleChange('fcf_schedule', newSchedule);
  };

  const removeFCFRow = (id: number) => {
    if (fcfSchedule.length <= 2) {
      alert('حداقل ۲ ردیف باید وجود داشته باشد');
      return;
    }
    handleChange('fcf_schedule', fcfSchedule.filter(row => row.id !== id));
  };

  // ============================================
  // محاسبات
  // ============================================
  const calculateTotalFCF = () => {
    return fcfSchedule.reduce((sum, row) => sum + (row.fcf || 0), 0);
  };

  const calculateAverageGrowth = () => {
    if (fcfSchedule.length < 2) return 0;
    const first = fcfSchedule[0]?.fcf || 0;
    const last = fcfSchedule[fcfSchedule.length - 1]?.fcf || 0;
    if (first === 0) return 0;
    return ((last / first) ** (1 / (fcfSchedule.length - 1)) - 1) * 100;
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
  // ذخیره در دیتابیس - PUT به جای POST
  // ============================================
  const saveToDatabase = async () => {
    if (!valuationCaseId) return;

    try {
      setSaving(true);
      setSaveError(null);

      const fcfScheduleForApi = fcfSchedule.map(row => ({
        year: row.year,
        fcf: row.fcf || 0,
        capex: row.capex || 0,
        delta_wc: row.delta_wc || 0,
      }));

      const payload = {
        valuation_case: valuationCaseId,
        method_id: 'M-03',
        method_inputs: {
          fcf_schedule: fcfScheduleForApi,
          intangible_share_percent: formData.intangible_share_percent || 70,
          expert_signoffs: expertSignoffs.map(s => ({
            expert_name: s.expert_name,
            signature_date: s.signature_date,
            notes: s.notes,
          })),
          // 🔥 از step2Data استفاده کن (همون مقداری که در STEP 2 هست)
          forecast_horizon: formData.forecast_horizon || step2Data?.forecast_horizon || 5,
          tax_rate: formData.tax_rate || step2Data?.tax_rate || 25,
          discount_rate: formData.discount_rate || step2Data?.discount_rate || 18,
          terminal_growth_rate: formData.terminal_growth_rate || step2Data?.terminal_growth_rate || 5,
          quality_multiplier: formData.quality_multiplier || step2Data?.quality_multiplier || 0.85,
          current_revenue: formData.current_revenue || step2Data?.current_revenue || 0,
        },
      };

      console.log('📤 ذخیره M03:', payload);

      // 🔥 اول چک کن STEP 3 وجود داره یا نه
      const { data: existing } = await api.get(`/intangible/valuation-step3/?valuation_case=${valuationCaseId}`);
      const items = existing.results || existing || [];
      
      if (items.length > 0) {
        // اگر وجود داره → PUT
        const step3Id = items[0].id;
        await api.put(`/intangible/valuation-step3/${step3Id}/`, payload);
        console.log('✅ STEP 3 به‌روزرسانی شد (PUT)');
      } else {
        // اگر وجود نداره → POST
        await api.post('/intangible/valuation-step3/', payload);
        console.log('✅ STEP 3 جدید ایجاد شد (POST)');
      }

      setLastSaved(new Date().toLocaleTimeString('fa-IR'));
    } catch (error: any) {
      console.error('❌ خطا در ذخیره M03:', error);
      console.error('❌ پاسخ خطا:', error.response?.data);
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
  }, [formData, fcfSchedule, expertSignoffs]);

  // ============================================
  // نمایش داده‌های STEP 2 (فقط برای نمایش، نه در پنل)
  // ============================================
  const step2Display = step2Data || formData;

  return (
    <div className="space-y-6 font-[family-name:var(--font-vazir)]">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex-1">
          <p className="text-sm text-blue-700 flex items-center gap-2">
            <span className="font-bold">📊 M-03: روش جریان نقدی تنزیل‌شده (DCF)</span>
            <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">روش درآمد</span>
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

      {/* ============================================
          داده‌های STEP 2 (نمایش به‌روز)
      ============================================ */}
      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-xs">
        <p className="font-medium text-blue-700 mb-1 font-[family-name:var(--font-vazir)]">📥 داده‌های ورودی از STEP 2:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1 font-[family-name:var(--font-vazir)]">
          <div><span className="text-gray-500">افق پیش‌بینی:</span> <span className="font-bold">{step2Display.forecast_horizon || 5} سال</span></div>
          <div><span className="text-gray-500">نرخ مالیات:</span> <span className="font-bold">{step2Display.tax_rate || 25}%</span></div>
          <div><span className="text-gray-500">نرخ تنزیل:</span> <span className="font-bold">{step2Display.discount_rate || 18}%</span></div>
          <div><span className="text-gray-500">ضریب کیفیت:</span> <span className="font-bold">{step2Display.quality_multiplier || 0.85}</span></div>
        </div>
      </div>

      {/* ============================================
          پارامترهای اختصاصی M-03
      ============================================ */}
      <div className="border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          🎯 پارامترهای اختصاصی روش M-03
          <Badge className="text-xs bg-red-100 text-red-700">ورودی کاربر</Badge>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                placeholder="۷۰"
                className="flex-1 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-400">%</span>
            </div>
            <p className="text-[10px] text-gray-400">درصدی از ارزش کل شرکت که به این دارایی نامشهود تعلق می‌گیرد</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              افق پیش‌بینی <span className="text-blue-500 text-xs">(از STEP 2)</span>
            </Label>
            <div className="p-2 bg-gray-100 rounded-lg text-sm font-bold text-dark-green">
              {step2Display.forecast_horizon || 5} سال
            </div>
          </div>
        </div>

        {/* جدول FCF */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium flex items-center gap-1">
              جریان نقدی آزاد سالانه (FCFs) <span className="text-red-500">*</span>
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={addFCFRow}
              className="flex items-center gap-1 text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              <Plus className="w-4 h-4" />
              افزودن سال
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-blue-50">
                  <th className="border p-2 text-center">سال</th>
                  <th className="border p-2 text-right">FCF</th>
                  <th className="border p-2 text-right">CapEx</th>
                  <th className="border p-2 text-right">Δ WC</th>
                  <th className="border p-2 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {fcfSchedule.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="border p-1 text-center font-medium">{row.year}</td>
                    <td className="border p-1">
                      <Input
                        type="number"
                        value={row.fcf || ''}
                        onChange={(e) => updateFCFRow(row.id, 'fcf', parseFloat(e.target.value) || 0)}
                        className="h-8 text-sm border-0 focus:ring-1"
                        placeholder="۰"
                      />
                    </td>
                    <td className="border p-1">
                      <Input
                        type="number"
                        value={row.capex || ''}
                        onChange={(e) => updateFCFRow(row.id, 'capex', parseFloat(e.target.value) || 0)}
                        className="h-8 text-sm border-0 focus:ring-1"
                        placeholder="۰"
                      />
                    </td>
                    <td className="border p-1">
                      <Input
                        type="number"
                        value={row.delta_wc || ''}
                        onChange={(e) => updateFCFRow(row.id, 'delta_wc', parseFloat(e.target.value) || 0)}
                        className="h-8 text-sm border-0 focus:ring-1"
                        placeholder="۰"
                      />
                    </td>
                    <td className="border p-1 text-center">
                      <button
                        onClick={() => removeFCFRow(row.id)}
                        className="text-red-500 hover:text-red-700"
                        disabled={fcfSchedule.length <= 2}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">* حداقل ۲ ردیف الزامی است</p>
        </div>

        {/* خلاصه */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm font-medium mb-3 font-[family-name:var(--font-vazir)]">📊 خلاصه محاسبه</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2 bg-white rounded-lg border">
              <p className="text-xs text-gray-400">جمع FCF</p>
              <p className="text-sm font-bold text-blue-600">
                {calculateTotalFCF().toLocaleString()}
              </p>
            </div>
            <div className="p-2 bg-white rounded-lg border">
              <p className="text-xs text-gray-400">نرخ رشد CAGR</p>
              <p className="text-sm font-bold text-green-600">
                {calculateAverageGrowth().toFixed(1)}%
              </p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-gray-400">سهم دارایی نامشهود</p>
              <p className="text-lg font-bold text-blue-700">
                {formData.intangible_share_percent || 70}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* آپلود فایل‌ها */}
      <div className="border rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">📎 شواهد و مدارک</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              فایل Budget/Plan <span className="text-red-500">*</span>
            </Label>
            <div className="p-3 border-2 border-dashed rounded-lg hover:border-blue-400 transition-colors">
              {files.budget_plan ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span className="text-sm truncate">{files.budget_plan.name}</span>
                  </div>
                  <button onClick={() => removeFile('budget_plan')} className="text-red-500 hover:text-red-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    id="budget_plan"
                    className="hidden"
                    onChange={(e) => handleFileUpload('budget_plan', e.target.files?.[0] || null)}
                  />
                  <label
                    htmlFor="budget_plan"
                    className="flex items-center gap-2 text-sm text-blue-600 cursor-pointer hover:text-blue-800"
                  >
                    <Upload className="w-4 h-4" />
                    آپلود فایل Budget
                  </label>
                </div>
              )}
            </div>
            <p className="text-[10px] text-gray-400">فایل بودجه یا برنامه مالی</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              فایل FCF Calculation <span className="text-red-500">*</span>
            </Label>
            <div className="p-3 border-2 border-dashed rounded-lg hover:border-blue-400 transition-colors">
              {files.fcf_calculation ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span className="text-sm truncate">{files.fcf_calculation.name}</span>
                  </div>
                  <button onClick={() => removeFile('fcf_calculation')} className="text-red-500 hover:text-red-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    id="fcf_calculation"
                    className="hidden"
                    onChange={(e) => handleFileUpload('fcf_calculation', e.target.files?.[0] || null)}
                  />
                  <label
                    htmlFor="fcf_calculation"
                    className="flex items-center gap-2 text-sm text-blue-600 cursor-pointer hover:text-blue-800"
                  >
                    <Upload className="w-4 h-4" />
                    آپلود فایل FCF
                  </label>
                </div>
              )}
            </div>
            <p className="text-[10px] text-gray-400">محاسبات دقیق جریان نقدی آزاد</p>
          </div>
        </div>
      </div>

      {/* تأیید خبرگان */}
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
