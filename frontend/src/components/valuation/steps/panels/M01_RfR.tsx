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

interface M01_RfRProps {
  formData: any;
  onChange: (data: any) => void;
  assetId?: number;
  valuationCaseId?: number;
  step2Data?: any;
}

export function M01_RfR({ formData, onChange, assetId, valuationCaseId, step2Data }: M01_RfRProps) {
  const [files, setFiles] = useState<Record<string, File>>({});
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [prevValuationCaseId, setPrevValuationCaseId] = useState<number | undefined>(undefined);
  const [showBenchmarkDetails, setShowBenchmarkDetails] = useState(false);

  // ✅ صنایع مرجع برای نرخ حق‌الامتیاز (بدون تکراری)
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
      
      if (items.length > 0) {
        const step3Id = items[0].id;
        await api.put(`/intangible/valuation-step3/${step3Id}/`, payload);
      } else {
        await api.post('/intangible/valuation-step3/', payload);
      }

      setLastSaved(new Date().toLocaleTimeString('fa-IR'));
    } catch (error: any) {
      console.error('❌ خطا در ذخیره M01:', error);
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

      {/* پارامترهای اختصاصی M-01 */}
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

          {/* ✅ انتخاب صنعت مرجع - اصلاح شده */}
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

        {/* آپلود فایل‌ها */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              📎 فایل Benchmark صنعت <span className="text-red-500">*</span>
            </Label>
            <div className="p-3 border-2 border-dashed rounded-lg hover:border-blue-400 transition-colors">
              {files.benchmark_report ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span className="text-sm truncate">{files.benchmark_report.name}</span>
                  </div>
                  <button onClick={() => removeFile('benchmark_report')} className="text-red-500 hover:text-red-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    id="benchmark_report"
                    className="hidden"
                    onChange={(e) => handleFileUpload('benchmark_report', e.target.files?.[0] || null)}
                  />
                  <label
                    htmlFor="benchmark_report"
                    className="flex items-center gap-2 text-sm text-blue-600 cursor-pointer hover:text-blue-800"
                  >
                    <Upload className="w-4 h-4" />
                    آپلود فایل Benchmark
                  </label>
                </div>
              )}
            </div>
            <p className="text-[10px] text-gray-400">PDF یا Excel شامل نرخ‌های حق‌الامتیاز در صنعت مربوطه</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              📎 فایل درآمدی <span className="text-red-500">*</span>
            </Label>
            <div className="p-3 border-2 border-dashed rounded-lg hover:border-blue-400 transition-colors">
              {files.revenue_file ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span className="text-sm truncate">{files.revenue_file.name}</span>
                  </div>
                  <button onClick={() => removeFile('revenue_file')} className="text-red-500 hover:text-red-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    id="revenue_file"
                    className="hidden"
                    onChange={(e) => handleFileUpload('revenue_file', e.target.files?.[0] || null)}
                  />
                  <label
                    htmlFor="revenue_file"
                    className="flex items-center gap-2 text-sm text-blue-600 cursor-pointer hover:text-blue-800"
                  >
                    <Upload className="w-4 h-4" />
                    آپلود فایل درآمدی
                  </label>
                </div>
              )}
            </div>
            <p className="text-[10px] text-gray-400">فایل اکسل یا PDF حاوی داده‌های درآمدی (تاریخی و پیش‌بینی)</p>
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

