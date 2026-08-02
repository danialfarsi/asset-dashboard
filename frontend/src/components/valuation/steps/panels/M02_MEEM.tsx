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

interface ContributoryAsset {
  id: number;
  asset_type: string;
  asset_value: number;
  return_rate: number;
}

interface ExpertSignoff {
  id: number;
  expert_name: string;
  signature_date: string;
  notes: string;
}

interface M02_MEEMProps {
  formData: any;
  onChange: (data: any) => void;
  assetId?: number;
  valuationCaseId?: number;
  step2Data?: any;
}

export function M02_MEEM({ formData, onChange, assetId, valuationCaseId, step2Data }: M02_MEEMProps) {
  const [files, setFiles] = useState<Record<string, File>>({});
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [prevValuationCaseId, setPrevValuationCaseId] = useState<number | undefined>(undefined);
  const [showDetails, setShowDetails] = useState(false);

  // ============================================
  // انواع دارایی‌های مشارکت‌کننده
  // ============================================
  const ASSET_TYPES = [
    { value: 'working_capital', label: 'سرمایه در گردش (Working Capital)' },
    { value: 'fixed_assets', label: 'دارایی‌های ثابت (Fixed Assets)' },
    { value: 'workforce', label: 'نیروی کار (Workforce)' },
    { value: 'brand', label: 'برند (Brand)' },
    { value: 'technology', label: 'فناوری (Technology)' },
    { value: 'customer_base', label: 'پایگاه مشتریان (Customer Base)' },
    { value: 'distribution_network', label: 'شبکه توزیع (Distribution Network)' },
    { value: 'intellectual_property', label: 'مالکیت فکری (Intellectual Property)' },
  ];

  // ============================================
  // تشخیص تغییر دارایی
  // ============================================
  useEffect(() => {
    if (valuationCaseId && valuationCaseId !== prevValuationCaseId) {
      const hasExistingData = formData.ebit_attributable !== undefined || formData.contributory_assets;
      
      if (!hasExistingData) {
        setInitialized(false);
        onChange({
          ebit_attributable: 20000000000,
          contributory_assets: [
            { id: 1, asset_type: 'working_capital', asset_value: 70000000000, return_rate: 9 },
            { id: 2, asset_type: 'fixed_assets', asset_value: 50000000000, return_rate: 12 },
          ],
          customer_attrition_rate: 10,
          expert_signoffs: [],
        });
      }
      
      setPrevValuationCaseId(valuationCaseId);
    }
  }, [valuationCaseId, formData.ebit_attributable]);

  // ============================================
  // مقداردهی اولیه با داده‌های STEP 2
  // ============================================
  useEffect(() => {
    if (step2Data && !initialized) {
      const updates: any = {};
      
      if (formData.forecast_horizon === undefined && step2Data.forecast_horizon) {
        updates.forecast_horizon = step2Data.forecast_horizon;
      }
      if (formData.tax_rate === undefined && step2Data.tax_rate) {
        updates.tax_rate = step2Data.tax_rate;
      }
      if (formData.discount_rate === undefined && step2Data.discount_rate) {
        updates.discount_rate = step2Data.discount_rate;
      }
      if (formData.terminal_growth_rate === undefined && step2Data.terminal_growth_rate) {
        updates.terminal_growth_rate = step2Data.terminal_growth_rate;
      }
      if (formData.current_revenue === undefined && step2Data.current_revenue) {
        updates.current_revenue = step2Data.current_revenue;
      }
      if (formData.quality_multiplier === undefined && step2Data.quality_multiplier) {
        updates.quality_multiplier = step2Data.quality_multiplier;
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
        const m02Data: any = {};
        
        const fields = [
          'ebit_attributable', 'contributory_assets', 'customer_attrition_rate',
          'expert_signoffs', 'forecast_horizon', 'tax_rate', 'discount_rate',
          'terminal_growth_rate', 'current_revenue', 'quality_multiplier'
        ];
        
        fields.forEach(field => {
          if (inputs[field] !== undefined) {
            m02Data[field] = inputs[field];
          }
        });
        
        if (Object.keys(m02Data).length > 0) {
          onChange(m02Data);
        }
      }
    } catch (error) {
      console.error('Error loading M02 data:', error);
    }
  };

  const handleChange = (field: string, value: any) => {
    onChange({ [field]: value });
  };

  const contributoryAssets: ContributoryAsset[] = formData.contributory_assets || [];
  const expertSignoffs: ExpertSignoff[] = formData.expert_signoffs || [];

  // ============================================
  // توابع جدول دارایی‌های مشارکت‌کننده
  // ============================================
  const addContributoryAsset = () => {
    const newAsset: ContributoryAsset = {
      id: Date.now(),
      asset_type: 'working_capital',
      asset_value: 0,
      return_rate: 9,
    };
    handleChange('contributory_assets', [...contributoryAssets, newAsset]);
  };

  const updateContributoryAsset = (id: number, field: string, value: any) => {
    const newAssets = contributoryAssets.map(asset =>
      asset.id === id ? { ...asset, [field]: value } : asset
    );
    handleChange('contributory_assets', newAssets);
  };

  const removeContributoryAsset = (id: number) => {
    if (contributoryAssets.length <= 1) {
      alert('حداقل یک دارایی مشارکت‌کننده باید وجود داشته باشد');
      return;
    }
    handleChange('contributory_assets', contributoryAssets.filter(asset => asset.id !== id));
  };

  // ============================================
  // محاسبات
  // ============================================
  const calculateTotalReturn = () => {
    return contributoryAssets.reduce((sum, asset) => {
      return sum + (asset.asset_value * (asset.return_rate / 100));
    }, 0);
  };

  const calculateExcessEarnings = () => {
    const ebit = formData.ebit_attributable || 0;
    const totalReturn = calculateTotalReturn();
    return ebit - totalReturn;
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
  // ذخیره در دیتابیس
  // ============================================
  const saveToDatabase = async () => {
    if (!valuationCaseId) return;

    try {
      setSaving(true);
      setSaveError(null);

      const payload = {
        valuation_case: valuationCaseId,
        method_id: 'M-02',
        method_inputs: {
          ebit_attributable: formData.ebit_attributable || 20000000000,
          contributory_assets: contributoryAssets,
          customer_attrition_rate: formData.customer_attrition_rate || 10,
          expert_signoffs: expertSignoffs,
          forecast_horizon: formData.forecast_horizon || step2Data?.forecast_horizon || 5,
          tax_rate: formData.tax_rate || step2Data?.tax_rate || 25,
          discount_rate: formData.discount_rate || step2Data?.discount_rate || 18,
          terminal_growth_rate: formData.terminal_growth_rate || step2Data?.terminal_growth_rate || 5,
          current_revenue: formData.current_revenue || step2Data?.current_revenue || 20000000000,
          quality_multiplier: formData.quality_multiplier || 0.92,
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
      console.error('❌ خطا در ذخیره M02:', error);
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
  }, [formData, contributoryAssets, expertSignoffs]);

  // ============================================
  // نمایش داده‌های STEP 2
  // ============================================
  const displayStep2Data = () => {
    const data = step2Data || formData;
    if (!data) return null;
    
    return (
      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-xs">
        <p className="font-medium text-blue-700 mb-1 font-[family-name:var(--font-vazir)]">📥 داده‌های ورودی از STEP 2:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1 font-[family-name:var(--font-vazir)]">
          <div><span className="text-gray-500">افق پیش‌بینی:</span> <span className="font-bold">{data.forecast_horizon || 5} سال</span></div>
          <div><span className="text-gray-500">نرخ مالیات:</span> <span className="font-bold">{data.tax_rate || 25}%</span></div>
          <div><span className="text-gray-500">نرخ تنزیل:</span> <span className="font-bold">{data.discount_rate || 18}%</span></div>
          <div><span className="text-gray-500">درآمد جاری:</span> <span className="font-bold">{data.current_revenue?.toLocaleString()}</span></div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 font-[family-name:var(--font-vazir)]">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 flex-1">
          <p className="text-sm text-purple-700 flex items-center gap-2">
            <span className="font-bold">📊 M-02: روش سود مازاد چند دوره‌ای (MEEM)</span>
            <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">روش درآمد</span>
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
          پارامترهای اختصاصی M-02
      ============================================ */}
      <div className="border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          🎯 پارامترهای اختصاصی روش M-02
          <Badge className="text-xs bg-red-100 text-red-700">ورودی کاربر</Badge>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* EBIT منتسب به دارایی */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              EBIT منتسب به دارایی <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              value={formData.ebit_attributable || ''}
              onChange={(e) => handleChange('ebit_attributable', parseFloat(e.target.value) || 0)}
              placeholder="۲۰,۰۰۰,۰۰۰,۰۰۰"
              className="focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-[10px] text-gray-400">سود عملیاتی قبل از بهره و مالیات منتسب به این دارایی</p>
          </div>

          {/* نرخ ریزش مشتری */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              نرخ ریزش مشتری <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.1"
                value={formData.customer_attrition_rate || ''}
                onChange={(e) => handleChange('customer_attrition_rate', parseFloat(e.target.value) || 0)}
                placeholder="۱۰"
                className="flex-1 focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-400">%</span>
            </div>
            <p className="text-[10px] text-gray-400">نرخ سالانه از دست دادن مشتریان/پایگاه داده</p>
          </div>
        </div>

        {/* ============================================
            جدول دارایی‌های مشارکت‌کننده
        ============================================ */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium flex items-center gap-1">
              دارایی‌های مشارکت‌کننده <span className="text-red-500">*</span>
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={addContributoryAsset}
              className="flex items-center gap-1 text-purple-600 border-purple-300 hover:bg-purple-50"
            >
              <Plus className="w-4 h-4" />
              افزودن دارایی
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-purple-50">
                  <th className="border p-2 text-right">نوع دارایی</th>
                  <th className="border p-2 text-right">ارزش دارایی (IRR)</th>
                  <th className="border p-2 text-right">نرخ بازده (%)</th>
                  <th className="border p-2 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {contributoryAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="border p-1">
                      <Select
                        value={asset.asset_type}
                        onValueChange={(value) => updateContributoryAsset(asset.id, 'asset_type', value)}
                      >
                        <SelectTrigger className="h-8 text-sm border-0 focus:ring-1 bg-white">
                          <SelectValue placeholder="انتخاب نوع" />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-50">
                          {ASSET_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="border p-1">
                      <Input
                        type="number"
                        value={asset.asset_value || ''}
                        onChange={(e) => updateContributoryAsset(asset.id, 'asset_value', parseFloat(e.target.value) || 0)}
                        className="h-8 text-sm border-0 focus:ring-1"
                        placeholder="۰"
                      />
                    </td>
                    <td className="border p-1">
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          step="0.1"
                          value={asset.return_rate || ''}
                          onChange={(e) => updateContributoryAsset(asset.id, 'return_rate', parseFloat(e.target.value) || 0)}
                          className="h-8 text-sm border-0 focus:ring-1"
                          placeholder="۹"
                        />
                        <span className="text-xs text-gray-400">%</span>
                      </div>
                    </td>
                    <td className="border p-1 text-center">
                      <button
                        onClick={() => removeContributoryAsset(asset.id)}
                        className="text-red-500 hover:text-red-700"
                        disabled={contributoryAssets.length <= 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">* حداقل ۱ دارایی مشارکت‌کننده الزامی است</p>
        </div>

        {/* ============================================
            خلاصه محاسبه
        ============================================ */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm font-medium mb-3 font-[family-name:var(--font-vazir)]">📊 خلاصه محاسبه</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2 bg-white rounded-lg border">
              <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">EBIT منتسب</p>
              <p className="text-sm font-bold text-purple-600 font-[family-name:var(--font-vazir)]">
                {formData.ebit_attributable?.toLocaleString() || '۰'}
              </p>
            </div>
            <div className="p-2 bg-white rounded-lg border">
              <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">بازده دارایی‌ها</p>
              <p className="text-sm font-bold text-amber-600 font-[family-name:var(--font-vazir)]">
                {calculateTotalReturn().toLocaleString()}
              </p>
            </div>
            <div className="p-2 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">سود مازاد (Excess Earnings)</p>
              <p className="text-lg font-bold text-purple-700 font-[family-name:var(--font-vazir)]">
                {calculateExcessEarnings().toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================
          آپلود فایل‌ها
      ============================================ */}
      <div className="border rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">📎 شواهد و مدارک</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              فایل EBIT Source <span className="text-red-500">*</span>
            </Label>
            <div className="p-3 border-2 border-dashed rounded-lg hover:border-purple-400 transition-colors">
              {files.ebit_source ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-500" />
                    <span className="text-sm truncate">{files.ebit_source.name}</span>
                  </div>
                  <button onClick={() => removeFile('ebit_source')} className="text-red-500 hover:text-red-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    id="ebit_source"
                    className="hidden"
                    onChange={(e) => handleFileUpload('ebit_source', e.target.files?.[0] || null)}
                  />
                  <label
                    htmlFor="ebit_source"
                    className="flex items-center gap-2 text-sm text-purple-600 cursor-pointer hover:text-purple-800"
                  >
                    <Upload className="w-4 h-4" />
                    آپلود فایل EBIT
                  </label>
                </div>
              )}
            </div>
            <p className="text-[10px] text-gray-400">فایل حاوی محاسبات EBIT (صورت مالی، بودجه)</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              فایل CAC Breakdown <span className="text-red-500">*</span>
            </Label>
            <div className="p-3 border-2 border-dashed rounded-lg hover:border-purple-400 transition-colors">
              {files.cac_breakdown ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-500" />
                    <span className="text-sm truncate">{files.cac_breakdown.name}</span>
                  </div>
                  <button onClick={() => removeFile('cac_breakdown')} className="text-red-500 hover:text-red-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    id="cac_breakdown"
                    className="hidden"
                    onChange={(e) => handleFileUpload('cac_breakdown', e.target.files?.[0] || null)}
                  />
                  <label
                    htmlFor="cac_breakdown"
                    className="flex items-center gap-2 text-sm text-purple-600 cursor-pointer hover:text-purple-800"
                  >
                    <Upload className="w-4 h-4" />
                    آپلود فایل CAC
                  </label>
                </div>
              )}
            </div>
            <p className="text-[10px] text-gray-400">تفکیک هزینه‌های جذب مشتری (CAC)</p>
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
