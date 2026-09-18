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

interface Evidence {
  id: number;
  file: string;
  file_name: string;
  evidence_type: string;
  method_id: string;
  uploaded_at: string;
}

interface M02_MEEMProps {
  formData: any;
  onChange: (data: any) => void;
  assetId?: number;
  valuationCaseId?: number;
  step2Data?: any;
  // 🔥 Props جدید برای شواهد
  onUploadEvidence?: (file: File, type: string) => Promise<void>;
  evidences?: Evidence[];
  onDeleteEvidence?: (id: number) => Promise<void>;
  uploadingEvidence?: boolean;
}

export function M02_MEEM({ 
  formData, 
  onChange, 
  assetId, 
  valuationCaseId, 
  step2Data,
  onUploadEvidence,
  evidences = [],
  onDeleteEvidence,
  uploadingEvidence = false
}: M02_MEEMProps) {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [prevValuationCaseId, setPrevValuationCaseId] = useState<number | undefined>(undefined);
  const [showDetails, setShowDetails] = useState(false);
  const [uploading, setUploading] = useState(false);

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
  // مقداردهی اولیه با STEP 2
  // ============================================
  useEffect(() => {
    if (step2Data && !initialized) {
      const updates: any = {};
      
      ['forecast_horizon', 'tax_rate', 'discount_rate', 'terminal_growth_rate', 
       'current_revenue', 'quality_multiplier'].forEach(field => {
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
  // بارگذاری از دیتابیس
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
  // توابع جدول دارایی‌ها
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
  // توابع خبرگان
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
    const m02Evidences = evidences.filter((e: Evidence) => 
      e.evidence_type?.startsWith('m02_')
    );

    if (m02Evidences.length === 0) {
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
        {m02Evidences.map((evidence: Evidence) => {
          const typeLabels: Record<string, string> = {
            'm02_ebit_source': 'فایل EBIT Source',
            'm02_cac_breakdown': 'فایل CAC Breakdown',
            'm02_asset_description': 'مستندات توصیف دارایی',
          };
          const typeLabel = typeLabels[evidence.evidence_type] || evidence.evidence_type;
          
          return (
            <div key={evidence.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-4 h-4 text-purple-600 flex-shrink-0" />
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
                    className="text-xs text-purple-600 hover:underline"
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
      { type: 'm02_ebit_source', label: 'فایل EBIT Source', required: true },
      { type: 'm02_cac_breakdown', label: 'فایل CAC Breakdown', required: true },
      { type: 'm02_asset_description', label: 'مستندات توصیف دارایی', required: false },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {uploadTypes.map((item) => (
          <div key={item.type} className="p-3 border-2 border-dashed rounded-lg hover:border-purple-400 transition-colors">
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
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
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
      const filteredItems = items.filter((item: any) => item.valuation_case === valuationCaseId);
      
      if (filteredItems.length > 0) {
        const step3Id = filteredItems[0].id;
        await api.patch(`/intangible/valuation-step3/${step3Id}/`, payload);
        console.log('✅ M02 به‌روزرسانی شد (PATCH)');
      } else {
        await api.post('/intangible/valuation-step3/', payload);
        console.log('✅ M02 جدید ایجاد شد (POST)');
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

      {/* ========================================== */}
      {/* 🔥 شواهد و مدارک - در بالای صفحه */}
      {/* ========================================== */}
      <div className="border rounded-lg p-4 border-purple-200 bg-purple-50/30">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-purple-700 flex items-center gap-2">
            📎 شواهد و مدارک
            <span className="text-xs text-gray-500 font-normal">
              ({evidences.filter((e: Evidence) => e.evidence_type?.startsWith('m02_')).length} فایل)
            </span>
          </h3>
          <span className="text-xs text-red-500">* فیلدهای اجباری</span>
        </div>

        {renderUploadButtons()}
        <div className="mt-4">{renderEvidences()}</div>
      </div>

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
