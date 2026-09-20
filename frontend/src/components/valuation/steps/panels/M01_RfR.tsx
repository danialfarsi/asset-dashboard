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
import { JalaliDatePicker } from '@/components/ui/jalali-date-picker';

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
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 py-8 text-center text-sm text-slate-400">
          <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p>هیچ شواهدی آپلود نشده است</p>
          <p className="mt-1 text-xs text-slate-400">برای آپلود فایل، از دکمه‌های زیر استفاده کنید</p>
        </div>
      );
    }

    return (
      <div className="max-h-52 space-y-2.5 overflow-y-auto pr-1">
        {m01Evidences.map((evidence: Evidence) => {
          const typeLabels: Record<string, string> = {
            'm01_benchmark': 'فایل Benchmark صنعت',
            'm01_revenue': 'منبع درآمدی',
            'm01_asset_description': 'مستندات توصیف دارایی',
            'm01_licensable': 'مستندات قابل لایسنس بودن',
          };
          const typeLabel = typeLabels[evidence.evidence_type] || evidence.evidence_type;
          
          return (
            <div key={evidence.id} className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm transition-all hover:border-dark-green/20 hover:shadow-md">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="h-4 w-4 flex-shrink-0 text-dark-green" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-700">{evidence.file_name}</p>
                  <p className="text-xs text-slate-400">{typeLabel}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {evidence.file && (
                  <a 
                    href={evidence.file} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="rounded-lg bg-dark-green/5 px-2 py-1 text-xs font-bold text-dark-green transition-colors hover:bg-dark-green/10"
                  >
                    مشاهده
                  </a>
                )}
                {onDeleteEvidence && (
                  <button
                    onClick={() => onDeleteEvidence(evidence.id)}
                    className="rounded-lg p-1 text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-700"
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
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {uploadTypes.map((item) => (
          <div key={item.type} className="group rounded-2xl border border-dashed border-slate-200 bg-white p-3.5 transition-all hover:border-dark-green/30 hover:bg-dark-green/[0.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-700">
                  {item.label}
                  {item.required && <span className="text-red-500 mr-1">*</span>}
                </p>
                <p className="text-xs text-slate-400">آپلود فایل</p>
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
                className="rounded-xl border-dark-green/20 bg-dark-green/[0.03] text-dark-green hover:bg-dark-green/10"
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
    <div dir="rtl" className="space-y-6 font-[family-name:var(--font-vazir)]">

      {/* HEADER */}
      <div className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.055)] sm:p-6">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-dark-green/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-40 w-40 rounded-full bg-emerald-100/60 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-dark-green text-white shadow-lg shadow-emerald-950/10">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-dark-green/10 px-2.5 py-1 text-[11px] font-black text-dark-green">M-01</span>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500">Relief-from-Royalty</span>
              </div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">روش حق‌الامتیاز</h2>
              <p className="mt-1 text-xs leading-6 text-slate-500 sm:text-sm">
                پارامترهای روش، مستندات پشتیبان و تأیید خبرگان را تکمیل کنید.
              </p>
            </div>
          </div>

          <div className="self-start sm:self-auto">
            {saving ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-700">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                در حال ذخیره...
              </span>
            ) : saveError ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-600">
                <AlertCircle className="h-3.5 w-3.5" />
                {saveError}
              </span>
            ) : lastSaved ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700">
                <CheckCircle className="h-3.5 w-3.5" />
                ذخیره شد {lastSaved}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-400">
                ذخیره خودکار فعال است
              </span>
            )}
          </div>
        </div>
      </div>

      {/* EVIDENCES */}
      <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.045)]">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-l from-dark-green/[0.055] via-white to-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-dark-green/10 text-dark-green">
                <Upload className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800">شواهد و مدارک</h3>
                <p className="mt-0.5 text-[11px] text-slate-400">مستندات پشتیبان محاسبات و مفروضات روش</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-500">
              {evidences.filter((e: Evidence) => e.evidence_type?.startsWith('m01_')).length} فایل
            </span>
            <span className="rounded-full bg-rose-50 px-3 py-1.5 text-[10px] font-bold text-rose-500">* اجباری</span>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          {renderUploadButtons()}
          <div className="border-t border-slate-100 pt-5">
            {renderEvidences()}
          </div>
        </div>
      </section>

      {/* PARAMETERS */}
      <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.045)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-800">پارامترهای اختصاصی روش M-01</h3>
              <Badge className="border-0 bg-rose-50 text-[10px] font-bold text-rose-600 hover:bg-rose-50">ورودی کاربر</Badge>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">مقادیر کلیدی مورد استفاده در مدل حق‌الامتیاز</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2 sm:p-6">
          {/* Royalty rate */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4">
            <Label className="mb-2.5 flex items-center gap-1 text-xs font-extrabold text-slate-600">
              نرخ حق‌الامتیاز مبنا <span className="text-rose-500">*</span>
            </Label>
            <div className="relative">
              <Input
                type="number"
                step="0.1"
                value={formData.royalty_rate || ''}
                onChange={(e) => handleChange('royalty_rate', parseFloat(e.target.value) || 0)}
                placeholder="مثلاً ۴"
                className="h-12 rounded-xl border-slate-200 bg-white pl-12 text-base font-black text-slate-800 shadow-none focus-visible:border-dark-green/30 focus-visible:ring-4 focus-visible:ring-dark-green/10"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">%</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {ROYALTY_RATE_SUGGESTIONS[formData.industry_benchmark || 'software']?.map((rate) => (
                <button
                  key={rate}
                  onClick={() => handleChange('royalty_rate', rate)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-bold transition-all ${
                    formData.royalty_rate === rate
                      ? 'border-dark-green bg-dark-green text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-dark-green/30 hover:text-dark-green'
                  }`}
                >
                  {rate}%
                </button>
              ))}
            </div>
            <p className="mt-2 text-[10px] leading-5 text-slate-400">نرخ مبتنی بر بازار و قراردادهای مشابه</p>
          </div>

          {/* Industry */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4">
            <Label className="mb-2.5 flex items-center gap-1 text-xs font-extrabold text-slate-600">
              صنعت مرجع <span className="text-rose-500">*</span>
            </Label>
            <Select
              value={formData.industry_benchmark || 'software'}
              onValueChange={(value) => handleChange('industry_benchmark', value)}
            >
              <SelectTrigger className="h-12 w-full rounded-xl border-slate-200 bg-white shadow-none focus:ring-4 focus:ring-dark-green/10">
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
            <p className="mt-3 text-[10px] leading-5 text-slate-400">انتخاب صنعت برای تطبیق نرخ حق‌الامتیاز</p>
          </div>

          {/* Revenue attribution */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4">
            <Label className="mb-2.5 flex items-center gap-1 text-xs font-extrabold text-slate-600">
              درصد تخصیص درآمد به دارایی <span className="text-rose-500">*</span>
            </Label>
            <div className="relative">
              <Input
                type="number"
                step="1"
                value={formData.revenue_attribution || ''}
                onChange={(e) => handleChange('revenue_attribution', parseFloat(e.target.value) || 0)}
                placeholder="مثلاً ۸۰"
                className="h-12 rounded-xl border-slate-200 bg-white pl-12 text-base font-black text-slate-800 shadow-none focus-visible:border-dark-green/30 focus-visible:ring-4 focus-visible:ring-dark-green/10"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">%</span>
            </div>
            <p className="mt-3 text-[10px] leading-5 text-slate-400">سهم درآمدی که به این دارایی خاص تعلق می‌گیرد</p>
          </div>

          {/* Growth rate */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4">
            <Label className="mb-2.5 flex items-center gap-1 text-xs font-extrabold text-slate-600">
              نرخ رشد درآمد <span className="text-rose-500">*</span>
            </Label>
            <div className="relative">
              <Input
                type="number"
                step="0.1"
                value={formData.revenue_growth_rate || ''}
                onChange={(e) => handleChange('revenue_growth_rate', parseFloat(e.target.value) || 0)}
                placeholder="مثلاً ۸"
                className="h-12 rounded-xl border-slate-200 bg-white pl-12 text-base font-black text-slate-800 shadow-none focus-visible:border-dark-green/30 focus-visible:ring-4 focus-visible:ring-dark-green/10"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">%</span>
            </div>
            <p className="mt-3 text-[10px] leading-5 text-slate-400">نرخ رشد سالانه درآمد</p>
          </div>

          {/* Attribution basis */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4 md:col-span-2">
            <Label className="mb-2.5 flex items-center gap-2 text-xs font-extrabold text-slate-600">
              توجیه مبنای تخصیص
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-400">توصیه می‌شود</span>
            </Label>
            <textarea
              value={formData.attribution_basis || ''}
              onChange={(e) => handleChange('attribution_basis', e.target.value)}
              placeholder="توضیح دهید چرا این درصد تخصیص انتخاب شده است..."
              className="min-h-[100px] w-full resize-y rounded-xl border border-slate-200 bg-white p-3.5 text-sm leading-7 text-slate-700 outline-none transition-all placeholder:text-slate-300 focus:border-dark-green/30 focus:ring-4 focus:ring-dark-green/10"
            />
          </div>
        </div>
      </section>

      {/* INPUT SUMMARY */}
      <section className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.04)]">
        <button
          onClick={() => setShowBenchmarkDetails(!showBenchmarkDetails)}
          className="flex w-full items-center justify-between px-5 py-4 text-right transition-colors hover:bg-slate-50/70 sm:px-6"
        >
          <div>
            <p className="text-sm font-black text-slate-700">خلاصه ورودی‌ها</p>
            <p className="mt-1 text-[10px] text-slate-400">مرور سریع پارامترهای ثبت‌شده و منبع آن‌ها</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            {showBenchmarkDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </button>

        {showBenchmarkDetails && (
          <div className="border-t border-slate-100 p-4 sm:p-5">
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-500">
                      <th className="p-3 text-right">پارامتر</th>
                      <th className="p-3 text-right">مقدار</th>
                      <th className="p-3 text-right">منبع</th>
                      <th className="p-3 text-center">وضعیت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { label: 'نرخ حق‌الامتیاز', value: `${formData.royalty_rate || 0}%`, source: 'ورودی کاربر', status: '✅' },
                      { label: 'درصد تخصیص درآمد', value: `${formData.revenue_attribution || 0}%`, source: 'ورودی کاربر', status: '✅' },
                      { label: 'نرخ رشد درآمد', value: `${formData.revenue_growth_rate || 0}%`, source: 'ورودی کاربر', status: '✅' },
                      { label: 'صنعت مرجع', value: INDUSTRY_BENCHMARKS.find(i => i.value === formData.industry_benchmark)?.label || '-', source: 'ورودی کاربر', status: '✅' },
                    ].map((row, index) => (
                      <tr key={index} className="bg-white transition-colors hover:bg-slate-50/60">
                        <td className="p-3 font-bold text-slate-700">{row.label}</td>
                        <td className="p-3 font-black text-dark-green">{row.value}</td>
                        <td className="p-3 text-xs text-slate-400">{row.source}</td>
                        <td className="p-3 text-center">{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-700">
              <CheckCircle className="h-3.5 w-3.5" />
              تمامی فیلدهای اجباری تکمیل شده است
            </div>
          </div>
        )}
      </section>

      {/* EXPERT SIGNOFFS */}
      <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.045)]">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h3 className="text-sm font-black text-slate-800">تأیید خبرگان</h3>
            <p className="mt-1 text-[11px] text-slate-400">ثبت نظر و تاریخ تأیید متخصصان مرتبط — اختیاری</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={addExpertSignoff}
            className="h-9 rounded-xl border-dark-green/20 bg-dark-green/[0.03] px-3 font-bold text-dark-green hover:bg-dark-green/10"
          >
            <Plus className="ml-1.5 h-4 w-4" />
            افزودن خبره
          </Button>
        </div>

        <div className="p-5 sm:p-6">
          {expertSignoffs.length === 0 ? (
            <div className="flex min-h-[150px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <Plus className="h-4 w-4" />
              </div>
              <p className="text-sm font-bold text-slate-600">هنوز خبره‌ای ثبت نشده است</p>
              <p className="mt-1 text-xs text-slate-400">در صورت نیاز می‌توانید تأیید یک یا چند خبره را اضافه کنید.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {expertSignoffs.map((signoff, index) => (
                <div key={signoff.id} className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-500">خبره {index + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExpertSignoff(signoff.id)}
                      className="h-8 w-8 rounded-lg p-0 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Input
                      value={signoff.expert_name}
                      onChange={(e) => updateExpertSignoff(signoff.id, 'expert_name', e.target.value)}
                      placeholder="نام خبره"
                      className="h-11 rounded-xl border-slate-200 bg-white shadow-none focus-visible:border-dark-green/30 focus-visible:ring-4 focus-visible:ring-dark-green/10"
                    />
                    <JalaliDatePicker
                      value={signoff.signature_date}
                      onChange={(date) => updateExpertSignoff(signoff.id, 'signature_date', date)}
                      className="h-11 rounded-xl text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
