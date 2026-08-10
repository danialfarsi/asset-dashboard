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

interface M01_RfRProps {
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

export function M01_RfR({ 
  formData, 
  onChange, 
  assetId, 
  valuationCaseId, 
  step2Data,
  onUploadEvidence,
  evidences = [],
  onDeleteEvidence,
  uploadingEvidence = false
}: M01_RfRProps) {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [prevValuationCaseId, setPrevValuationCaseId] = useState<number | undefined>(undefined);
  const [showBenchmarkDetails, setShowBenchmarkDetails] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ✅ صنایع مرجع برای نرخ حق‌الامتیاز
  const INDUSTRY_BENCHMARKS = [
    { value: 'software', label: 'نرم‌افزار (Software)' },
    { value: 'fmcg', label: 'کالاهای مصرفی سریع (FMCG)' },
    { value: 'pharma', label: 'داروسازی (Pharma)' },
    { value: 'automotive', label: 'خودروسازی (Automotive)' },
    { value: 'telecom', label: 'ارتباطات (Telecom)' },
    { value: 'retail', label: 'خرده‌فروشی (Retail)' },
    { value: 'industrial', label: 'صنعتی (Industrial)' },
    { value: 'media', label: 'رسانه (Media)' },
  ];

  const ROYALTY_RATE_SUGGESTIONS: Record<string, number[]> = {
    software: [2, 3, 4, 5, 6, 7],
    fmcg: [3, 4, 5, 6, 8],
    pharma: [4, 5, 6, 8, 10],
    automotive: [2, 3, 4, 5],
    telecom: [3, 4, 5, 6],
    retail: [2, 3, 4, 5],
    industrial: [2, 3, 4],
    media: [3, 4, 5, 6, 7],
  };

  // ============================================
  // تشخیص تغییر مورد ارزش‌گذاری
  // ============================================
  useEffect(() => {
    if (valuationCaseId && valuationCaseId !== prevValuationCaseId) {
      const hasExistingData = formData.royalty_rate !== undefined || formData.industry_benchmark;
      
      if (!hasExistingData) {
        setInitialized(false);
        onChange({
          royalty_rate: 4.0,
          industry_benchmark: 'software',
          revenue_attribution: 80,
          revenue_growth_rate: 8,
          attribution_basis: '',
          expert_signoffs: [],
        });
      }
      
      setPrevValuationCaseId(valuationCaseId);
    }
  }, [valuationCaseId, formData.royalty_rate]);

  // ============================================
  // مقداردهی اولیه با STEP 2
  // ============================================
  useEffect(() => {
    if (step2Data && !initialized) {
      const updates: any = {};
      if (formData.royalty_rate === undefined) updates.royalty_rate = 4.0;
      if (!formData.industry_benchmark) updates.industry_benchmark = 'software';
      if (formData.revenue_attribution === undefined) updates.revenue_attribution = 80;
      if (formData.revenue_growth_rate === undefined) updates.revenue_growth_rate = 8;
      
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
      
      // 🔥 فیلتر بر اساس valuation_case
      const filteredItems = items.filter((item: any) => item.valuation_case === valuationCaseId);
      
      if (filteredItems.length > 0 && filteredItems[0].method_inputs) {
        const inputs = filteredItems[0].method_inputs;
        const m01Data: any = {};
        
        const fields = [
          'royalty_rate', 'industry_benchmark', 'revenue_attribution',
          'revenue_growth_rate', 'attribution_basis', 'expert_signoffs'
        ];
        
        fields.forEach(field => {
          if (inputs[field] !== undefined) {
            m01Data[field] = inputs[field];
          }
        });
        
        if (Object.keys(m01Data).length > 0) {
          onChange(m01Data);
        }
      }
    } catch (error) {
      console.error('Error loading M01 data:', error);
    }
  };

  const handleChange = (field: string, value: any) => {
    onChange({ [field]: value });
  };

  const expertSignoffs: ExpertSignoff[] = formData.expert_signoffs || [];

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
    const m01Evidences = evidences.filter((e: Evidence) => 
      e.evidence_type?.startsWith('m01_')
    );

    if (m01Evidences.length === 0) {
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
        {m01Evidences.map((evidence: Evidence) => {
          const typeLabels: Record<string, string> = {
            'm01_benchmark': 'فایل Benchmark صنعت',
            'm01_revenue': 'منبع درآمدی',
            'm01_asset_description': 'مستندات توصیف دارایی',
            'm01_licensable': 'مستندات قابل لایسنس بودن',
          };
          const typeLabel = typeLabels[evidence.evidence_type] || evidence.evidence_type;
          
          return (
            <div key={evidence.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-4 h-4 text-dark-green flex-shrink-0" />
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
                    className="text-xs text-dark-green hover:underline"
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
  // 🔥 رندر دکمه‌های آپلود
  // ============================================
  const renderUploadButtons = () => {
    const uploadTypes = [
      { type: 'm01_benchmark', label: 'فایل Benchmark صنعت', required: true },
      { type: 'm01_revenue', label: 'منبع درآمدی', required: true },
      { type: 'm01_asset_description', label: 'مستندات توصیف دارایی', required: false },
      { type: 'm01_licensable', label: 'مستندات قابل لایسنس بودن', required: false },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {uploadTypes.map((item) => (
          <div key={item.type} className="p-3 border-2 border-dashed rounded-lg hover:border-blue-400 transition-colors">
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
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
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
        method_id: 'M-01',
        method_inputs: {
          royalty_rate: formData.royalty_rate || 4.0,
          industry_benchmark: formData.industry_benchmark || 'software',
          revenue_attribution: formData.revenue_attribution || 80,
          revenue_growth_rate: formData.revenue_growth_rate || 8,
          attribution_basis: formData.attribution_basis || '',
          expert_signoffs: expertSignoffs,
        },
      };

      const { data: existing } = await api.get(`/intangible/valuation-step3/?valuation_case=${valuationCaseId}`);
      const items = existing.results || existing || [];
      
      // 🔥 فیلتر بر اساس valuation_case
      const filteredItems = items.filter((item: any) => item.valuation_case === valuationCaseId);
      
      if (filteredItems.length > 0) {
        const step3Id = filteredItems[0].id;
        await api.patch(`/intangible/valuation-step3/${step3Id}/`, payload);
        console.log('✅ M01 به‌روزرسانی شد (PATCH)');
      } else {
        await api.post('/intangible/valuation-step3/', payload);
        console.log('✅ M01 جدید ایجاد شد (POST)');
      }

      setLastSaved(new Date().toLocaleTimeString('fa-IR'));
    } catch (error: any) {
      console.error('❌ خطا در ذخیره M01:', error);
      setSaveError(error?.response?.data?.message || 'خطا در ذخیره');
    } finally {
      setSaving(false);
    }
  };

  // Auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      saveToDatabase();
    }, 1500);
    return () => clearTimeout(timer);
  }, [formData, expertSignoffs]);

  return (
    <div className="space-y-6 font-[family-name:var(--font-vazir)]">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 flex-1">
          <p className="text-sm text-blue-700 flex items-center gap-2">
            <span className="font-bold">📊 M-01: روش حق‌الامتیاز (Relief-from-Royalty)</span>
            <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">روش هزینه</span>
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
      <div className="border rounded-lg p-4 border-blue-200 bg-blue-50/30">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-blue-700 flex items-center gap-2">
            📎 شواهد و مدارک
            <span className="text-xs text-gray-500 font-normal">
              ({evidences.filter((e: Evidence) => e.evidence_type?.startsWith('m01_')).length} فایل)
            </span>
          </h3>
          <span className="text-xs text-red-500">* فیلدهای اجباری</span>
        </div>

        {/* دکمه‌های آپلود */}
        {renderUploadButtons()}

        {/* لیست شواهد آپلود شده */}
        <div className="mt-4">
          {renderEvidences()}
        </div>
      </div>

      {/* ========================================== */}
      {/* پارامترهای اختصاصی M-01 */}
      {/* ========================================== */}
      <div className="border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          🎯 پارامترهای اختصاصی روش M-01
          <Badge className="text-xs bg-red-100 text-red-700">ورودی کاربر</Badge>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* نرخ حق‌الامتیاز مبنا */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              نرخ حق‌الامتیاز مبنا <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.1"
                value={formData.royalty_rate || ''}
                onChange={(e) => handleChange('royalty_rate', parseFloat(e.target.value) || 0)}
                placeholder="مثلاً ۴"
                className="flex-1 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-400">%</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {ROYALTY_RATE_SUGGESTIONS[formData.industry_benchmark || 'software']?.map((rate) => (
                <button
                  key={rate}
                  onClick={() => handleChange('royalty_rate', rate)}
                  className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                    formData.royalty_rate === rate 
                      ? 'bg-blue-500 text-white border-blue-500' 
                      : 'bg-gray-100 hover:bg-gray-200 border-gray-200'
                  }`}
                >
                  {rate}%
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400">نرخ مبتنی بر بازار/قراردادهای مشابه</p>
          </div>

          {/* صنعت مرجع */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              صنعت مرجع <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.industry_benchmark || 'software'}
              onValueChange={(value) => handleChange('industry_benchmark', value)}
            >
              <SelectTrigger className="w-full focus:ring-2 focus:ring-blue-500">
                <SelectValue placeholder="انتخاب صنعت" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRY_BENCHMARKS.map((industry) => (
                  <SelectItem key={industry.value} value={industry.value}>
                    {industry.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-gray-400">انتخاب صنعت برای تطبیق نرخ حق‌الامتیاز</p>
          </div>

          {/* درصد تخصیص درآمد */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              درصد تخصیص درآمد به دارایی <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="1"
                value={formData.revenue_attribution || ''}
                onChange={(e) => handleChange('revenue_attribution', parseFloat(e.target.value) || 0)}
                placeholder="مثلاً ۸۰"
                className="flex-1 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-400">%</span>
            </div>
            <p className="text-[10px] text-gray-400">سهم درآمدی که به این دارایی خاص تعلق می‌گیرد</p>
          </div>

          {/* نرخ رشد درآمد */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              نرخ رشد درآمد <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.1"
                value={formData.revenue_growth_rate || ''}
                onChange={(e) => handleChange('revenue_growth_rate', parseFloat(e.target.value) || 0)}
                placeholder="مثلاً ۸"
                className="flex-1 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-400">%</span>
            </div>
            <p className="text-[10px] text-gray-400">نرخ رشد سالانه درآمد</p>
          </div>

          {/* توجیه مبنای تخصیص */}
          <div className="space-y-2 md:col-span-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              توجیه مبنای تخصیص <span className="text-xs text-gray-400">(توصیه می‌شود)</span>
            </Label>
            <textarea
              value={formData.attribution_basis || ''}
              onChange={(e) => handleChange('attribution_basis', e.target.value)}
              placeholder="توضیح دهید چرا این درصد تخصیص انتخاب شده است..."
              className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 min-h-[60px] resize-y"
            />
          </div>
        </div>
      </div>

      {/* جدول خلاصه ورودی‌ها */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <button
          onClick={() => setShowBenchmarkDetails(!showBenchmarkDetails)}
          className="flex items-center justify-between w-full text-sm font-semibold text-gray-700"
        >
          <span>📋 خلاصه ورودی‌ها</span>
          {showBenchmarkDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {showBenchmarkDetails && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-right border">پارامتر</th>
                  <th className="p-2 text-right border">مقدار</th>
                  <th className="p-2 text-right border">منبع</th>
                  <th className="p-2 text-center border">وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'نرخ حق‌الامتیاز', value: `${formData.royalty_rate || 0}%`, source: 'ورودی کاربر', status: '✅' },
                  { label: 'درصد تخصیص درآمد', value: `${formData.revenue_attribution || 0}%`, source: 'ورودی کاربر', status: '✅' },
                  { label: 'نرخ رشد درآمد', value: `${formData.revenue_growth_rate || 0}%`, source: 'ورودی کاربر', status: '✅' },
                  { label: 'صنعت مرجع', value: INDUSTRY_BENCHMARKS.find(i => i.value === formData.industry_benchmark)?.label || '-', source: 'ورودی کاربر', status: '✅' },
                ].map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="p-2 border">{row.label}</td>
                    <td className="p-2 border font-medium">{row.value}</td>
                    <td className="p-2 border text-gray-500 text-xs">{row.source}</td>
                    <td className="p-2 border text-center">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              تمامی فیلدهای اجباری تکمیل شده است ✓
            </div>
          </div>
        )}
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
