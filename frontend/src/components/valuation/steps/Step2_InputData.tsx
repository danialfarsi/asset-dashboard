'use client';

import { useState, useEffect, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ChevronLeft, ChevronRight, Building2, Calendar, User, FileText,
  Upload, Download, X, Eye, PieChart, TrendingUp, Target, Shield,
  BarChart3, Activity, Award, AlertCircle, CheckCircle, Clock,
  Layers, FolderOpen, DollarSign, Percent, Calendar as CalendarIcon,
  Link as LinkIcon, Tag, FileCheck, AlertTriangle, Save, Loader2
} from 'lucide-react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip
} from 'recharts';
import api from '@/lib/api';
import { fetchAllValuations } from '@/lib/api-utils';

interface Step2Props {
  formData: {
    assetId: string;
    name: string;
    description: string;
    developmentStage: string;
    initialRelease: string;
    usefulLife: string;
    jurisdiction: string;
    associatedCosts: string;
    stakeholders: string;
  };
  onInputChange: (field: string, value: string) => void;
  onNext: () => void;
  onPrev: () => void;
  selectedAsset?: any;
  valuationData?: any;
  assetId?: number;
  onFormDataUpdate?: (data: any) => void;
  valuationMethod?: string;
  valuationCaseId?: number;
}

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
  file_url?: string;
  file_type_label?: string;
  valuation_id?: number;
  valuation_score?: number;
  file?: File;
  required?: boolean;
}

// ============================================
// گزینه‌ها
// ============================================
const CATEGORY_OPTIONS = [
  { value: 'strategic', label: 'استراتژیک' },
  { value: 'operational', label: 'عملیاتی' },
  { value: 'support', label: 'پشتیبان' },
];

const LIFECYCLE_OPTIONS = [
  { value: 'birth', label: 'تولد' },
  { value: 'growth', label: 'رشد' },
  { value: 'maturity', label: 'بلوغ' },
  { value: 'decline', label: 'افول' },
  { value: 're_innovation', label: 'نوآوری مجدد' },
];

const CURRENCY_OPTIONS = [
  { value: 'IRR', label: 'ریال' },
  { value: 'USD', label: 'دلار' },
  { value: 'EUR', label: 'یورو' },
];

const INFLATION_BASIS_OPTIONS = [
  { value: 'cost', label: 'هزینه' },
  { value: 'market', label: 'بازار' },
];

const SOURCE_RELIABILITY_OPTIONS = [
  { value: 'very_high', label: 'بسیار بالا' },
  { value: 'high', label: 'بالا' },
  { value: 'medium', label: 'متوسط' },
  { value: 'low', label: 'پایین' },
  { value: 'very_low', label: 'بسیار پایین' },
];

const OVERLAP_RISK_OPTIONS = [
  { value: 'low', label: 'کم' },
  { value: 'medium', label: 'متوسط' },
  { value: 'high', label: 'زیاد' },
];

const OVERLAP_TYPE_OPTIONS = [
  { value: 'revenue', label: 'درآمد' },
  { value: 'cost', label: 'هزینه' },
  { value: 'knowledge', label: 'دانش' },
  { value: 'market', label: 'بازار' },
];

const REVIEW_STATUS_OPTIONS = [
  { value: 'open', label: 'باز' },
  { value: 'pending', label: 'در انتظار' },
  { value: 'cleared', label: 'برطرف شده' },
];

const ASSUMPTION_TAG_OPTIONS = [
  { value: 'general', label: 'عمومی' },
  { value: 'asset_specific', label: 'مخصوص دارایی' },
];

const EVIDENCE_TAG_OPTIONS = [
  { value: 'asset_description', label: 'شرح دارایی' },
  { value: 'ownership', label: 'مالکیت' },
  { value: 'financial', label: 'مالی' },
  { value: 'expert', label: 'نظر خبره' },
  { value: 'benchmark', label: 'معیار خارجی' },
];

const DIMENSION_ICONS = {
  strategic: { icon: Target, color: '#015345', bg: 'bg-dark-green/5', text: 'text-dark-green', label: 'استراتژیک' },
  technical: { icon: Shield, color: '#015345', bg: 'bg-dark-green/5', text: 'text-dark-green', label: 'فنی و بلوغ' },
  operational: { icon: Activity, color: '#015345', bg: 'bg-dark-green/5', text: 'text-dark-green', label: 'عملیاتی' },
  market: { icon: TrendingUp, color: '#015345', bg: 'bg-dark-green/5', text: 'text-dark-green', label: 'بازار' },
  risk: { icon: AlertCircle, color: '#015345', bg: 'bg-dark-green/5', text: 'text-dark-green', label: 'ریسک' },
};

const FILE_TYPE_ICONS = {
  interview: { icon: User, label: 'مصاحبه', color: 'text-dark-green', bg: 'bg-dark-green/5' },
  document: { icon: FileText, label: 'سند', color: 'text-dark-green', bg: 'bg-dark-green/5' },
  process: { icon: Layers, label: 'فرآیند', color: 'text-dark-green', bg: 'bg-dark-green/5' },
  database: { icon: FolderOpen, label: 'پایگاه داده', color: 'text-dark-green', bg: 'bg-dark-green/5' },
};

export function Step2_InputData({ 
  formData, 
  onInputChange, 
  onNext, 
  onPrev,
  selectedAsset,
  valuationData,
  assetId,
  onFormDataUpdate,
  valuationMethod,
  valuationCaseId
}: Step2Props) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [assumptions, setAssumptions] = useState<{ text: string; tag: string; critical: boolean }[]>([]);
  const [newAssumption, setNewAssumption] = useState({ text: '', tag: 'general', critical: false });
  const [evidenceTags, setEvidenceTags] = useState<Record<string, string>>({});
  const [linkedAssets, setLinkedAssets] = useState<number[]>([]);
  const [availableAssets, setAvailableAssets] = useState<any[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [validationRules, setValidationRules] = useState<any>(null);
  const [savingToDb, setSavingToDb] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [valuationForm, setValuationForm] = useState({
    category: 'operational',
    business_unit: '',
    lifecycle_stage: 'growth',
    quality_override_reason: '',
    currency: 'IRR',
    inflation_basis: 'cost',
    tax_rate: 25,
    discount_rate: 18,
    forecast_horizon: 5,
    terminal_growth_rate: 5,
    current_revenue: 500000000000,
    useful_life: 5,
    source_reliability: 'high',
    overlap_risk_level: 'medium',
    overlap_type: 'revenue',
    review_status: 'pending',
    expert_note: '',
  });

  // ============================================
  // بارگذاری داده‌ها از دیتابیس و localStorage
  // ============================================
  useEffect(() => {
    if (assetId) {
      fetchEvidenceFiles();
      fetchAvailableAssets();
      fetchValidationRules();
      loadFromLocalStorage();
      loadFromDatabase();
    }
  }, [assetId, valuationCaseId]);

  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem(`valuation_form_${assetId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setValuationForm(prev => ({ ...prev, ...parsed }));
        if (parsed.assumptions) setAssumptions(parsed.assumptions);
        if (parsed.linkedAssets) setLinkedAssets(parsed.linkedAssets);
        if (parsed.evidenceTags) setEvidenceTags(parsed.evidenceTags);
        console.log('📥 بارگذاری از localStorage:', parsed);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  };

  const loadFromDatabase = async () => {
    if (!valuationCaseId) return;
    
    try {
      const { data } = await api.get(`/intangible/valuation-cases/${valuationCaseId}/`);
      
      // بروزرسانی فرم با داده‌های دیتابیس
      setValuationForm(prev => ({
        ...prev,
        category: data.category || prev.category,
        business_unit: data.business_unit || prev.business_unit,
        lifecycle_stage: data.lifecycle_stage || prev.lifecycle_stage,
        quality_override_reason: data.quality_override_reason || '',
        currency: data.currency || prev.currency,
        inflation_basis: data.inflation_basis || prev.inflation_basis,
        tax_rate: data.tax_rate || prev.tax_rate,
        discount_rate: data.discount_rate || prev.discount_rate,
        forecast_horizon: data.forecast_horizon || prev.forecast_horizon,
        terminal_growth_rate: data.terminal_growth_rate || prev.terminal_growth_rate,
        current_revenue: data.current_revenue || prev.current_revenue,
        useful_life: data.useful_life || prev.useful_life,
        source_reliability: data.source_reliability || prev.source_reliability,
        overlap_risk_level: data.overlap_risk_level || prev.overlap_risk_level,
        overlap_type: data.overlap_type || prev.overlap_type,
        review_status: data.review_status || prev.review_status,
        expert_note: data.expert_note || '',
      }));
      
      // بارگذاری فرضیات از دیتابیس
      if (data.assumptions) {
        setAssumptions(data.assumptions.map((a: any) => ({
          text: a.assumption_text,
          tag: a.assumption_tag,
          critical: a.assumption_critical,
        })));
      }
      
      // بارگذاری وابستگی‌ها از دیتابیس
      if (data.linked_assets) {
        setLinkedAssets(data.linked_assets);
      }
      
      console.log('📥 بارگذاری از دیتابیس:', data);
    } catch (error) {
      console.error('Error loading from database:', error);
    }
  };

// ============================================
// 🔥 ذخیره‌سازی در دیتابیس
// ============================================
const saveToDatabase = useCallback(async (data: any) => {
  if (!valuationCaseId) {
    console.warn('⚠️ valuationCaseId موجود نیست');
    return;
  }
  
  try {
    setSavingToDb(true);
    setSaveError(null);
    
    console.log('📤 شروع ذخیره‌سازی در دیتابیس...');
    console.log('📤 داده‌های ارسالی:', data);
    
    // 🔥 تبدیل هوشمند درصد به اعشار
    const taxRate = Number(data.tax_rate);
    const discountRate = Number(data.discount_rate);
    const terminalGrowth = Number(data.terminal_growth_rate);
    
    const payload = {
      category: data.category || 'operational',
      business_unit: data.business_unit || 'واحد مرکزی',
      lifecycle_stage: data.lifecycle_stage || 'growth',
      quality_override_reason: data.quality_override_reason || '',
      currency: data.currency || 'IRR',
      inflation_basis: data.inflation_basis || 'cost',
      
      // 🔥 اگر مقدار > 1 باشه یعنی درصد هست و باید تقسیم بشه
      tax_rate: taxRate > 1 ? taxRate / 100 : taxRate,
      discount_rate: discountRate > 1 ? discountRate / 100 : discountRate,
      forecast_horizon: Number(data.forecast_horizon) || 5,
      terminal_growth_rate: terminalGrowth > 1 ? terminalGrowth / 100 : terminalGrowth,
      current_revenue: Number(data.current_revenue) || 500000000000,
      useful_life: Number(data.useful_life) || 5,
      source_reliability: data.source_reliability || 'high',
      overlap_risk_level: data.overlap_risk_level || 'medium',
      overlap_type: data.overlap_type || 'revenue',
      review_status: data.review_status || 'pending',
      expert_note: data.expert_note || '',
    };
    
    console.log('📤 ۱. ذخیره فیلدهای اصلی:', payload);
    await api.patch(`/intangible/valuation-cases/${valuationCaseId}/`, payload);
    
    // 🔥 ۲. ذخیره فرضیات (Assumptions)
    if (data.assumptions && data.assumptions.length > 0) {
      console.log('📤 ۲. ذخیره فرضیات:', data.assumptions);
      const assumptionsPayload = {
        assumptions: data.assumptions.map((a: any) => ({
          assumption_text: a.text,
          assumption_tag: a.tag,
          assumption_critical: a.critical,
        }))
      };
      
      await api.post(
        `/intangible/valuation-cases/${valuationCaseId}/sync_assumptions/`,
        assumptionsPayload
      );
      console.log('✅ فرضیات ذخیره شدند');
    }
    
    // 🔥 ۳. ذخیره وابستگی‌ها (Linked Assets)
    if (data.linkedAssets && data.linkedAssets.length > 0) {
      console.log('📤 ۳. ذخیره وابستگی‌ها:', data.linkedAssets);
      await api.patch(
        `/intangible/valuation-cases/${valuationCaseId}/update_linked_assets/`,
        { linked_assets: data.linkedAssets }
      );
      console.log('✅ وابستگی‌ها ذخیره شدند');
    }
    
    // 🔥 ۴. ذخیره تگ‌های شواهد (Evidence Tags)
    if (data.evidenceTags && Object.keys(data.evidenceTags).length > 0) {
      console.log('📤 ۴. ذخیره تگ‌های شواهد:', data.evidenceTags);
      await api.post(
        `/intangible/valuation-cases/${valuationCaseId}/sync_evidence_tags/`,
        { evidence_tags: data.evidenceTags }
      );
      console.log('✅ تگ‌های شواهد ذخیره شدند');
    }
    
    setLastSaved(new Date().toLocaleTimeString('fa-IR'));
    console.log('✅ همه داده‌ها در دیتابیس ذخیره شدند');
    
  } catch (error: any) {
    console.error('❌ خطا در ذخیره دیتابیس:', error);
    console.error('❌ جزئیات خطا:', error?.response?.data);
    setSaveError(error?.response?.data?.message || 'خطا در ذخیره دیتابیس');
  } finally {
    setSavingToDb(false);
  }
}, [valuationCaseId]);
  // ============================================
  // ذخیره در localStorage
  // ============================================
  const saveToLocalStorage = useCallback((data: any) => {
    try {
      localStorage.setItem(`valuation_form_${assetId}`, JSON.stringify(data));
      if (onFormDataUpdate) {
        onFormDataUpdate(data);
      }
      console.log('💾 ذخیره در localStorage');
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [assetId, onFormDataUpdate]);

  // ============================================
  // 🔥 ذخیره همزمان در دیتابیس + localStorage
  // ============================================
  const saveFormData = useCallback(() => {
    const data = {
      ...valuationForm,
      assumptions,
      linkedAssets,
      evidenceTags,
    };
    
    // همیشه در localStorage ذخیره کن
    saveToLocalStorage(data);
    
    // در دیتابیس ذخیره کن
    saveToDatabase(data);
    
  }, [valuationForm, assumptions, linkedAssets, evidenceTags, saveToLocalStorage, saveToDatabase]);

  // ============================================
  // Auto-save با debounce
  // ============================================
  useEffect(() => {
    const timer = setTimeout(() => {
      saveFormData();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [valuationForm, assumptions, linkedAssets, evidenceTags, saveFormData]);

  const fetchValidationRules = async () => {
    try {
      const { data } = await api.get('/intangible/valuation-cases/validation_rules/');
      setValidationRules(data);
    } catch (error) {
      console.error('Error fetching validation rules:', error);
    }
  };

  const fetchAvailableAssets = async () => {
    try {
      setLoadingAssets(true);
      const { data } = await api.get('/intangible/screened-assets/');
      const items = data.results || data || [];
      setAvailableAssets(items.filter((a: any) => a.id !== assetId));
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoadingAssets(false);
    }
  };

  const fetchEvidenceFiles = async () => {
    try {
      setLoadingFiles(true);
      const allValuations = await fetchAllValuations();
      const assetValuations = allValuations.filter((v: any) => v.asset === assetId && v.status === 'completed');
      
      if (assetValuations.length === 0) {
        setUploadedFiles([]);
        return;
      }

      const allFiles: UploadedFile[] = [];
      for (const v of assetValuations) {
        try {
          const { data: valData } = await api.get(`/intangible/asset-valuations/${v.id}/`);
          const answers = valData.answers || [];
          answers.forEach((answer: any) => {
            const types = [
              { key: 'interview', label: 'مصاحبه', url: answer.evidence_interview },
              { key: 'document', label: 'سند', url: answer.evidence_document },
              { key: 'process', label: 'فرآیند', url: answer.evidence_process },
              { key: 'database', label: 'پایگاه داده', url: answer.evidence_database },
            ];
            types.forEach(({ key, label, url }) => {
              if (url) {
                allFiles.push({
                  id: `evidence-${answer.id}-${key}`,
                  name: url.split('/').pop() || 'فایل',
                  size: '—',
                  type: key,
                  uploadedAt: new Date(answer.updated_at).toLocaleDateString('fa-IR'),
                  file_url: url,
                  file_type_label: label,
                  valuation_id: v.id,
                  valuation_score: v.final_score || 0,
                });
              }
            });
          });
        } catch (e) {
          console.error(`Error fetching valuation ${v.id}:`, e);
        }
      }
      setUploadedFiles(allFiles);
    } catch (error) {
      console.error('Error fetching evidence files:', error);
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleValuationChange = (field: string, value: any) => {
    setValuationForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAddAssumption = () => {
    if (!newAssumption.text.trim()) return;
    setAssumptions(prev => [...prev, { ...newAssumption }]);
    setNewAssumption({ text: '', tag: 'general', critical: false });
  };

  const handleRemoveAssumption = (index: number) => {
    setAssumptions(prev => prev.filter((_, i) => i !== index));
  };

  const handleToggleLinkedAsset = (assetId: number) => {
    setLinkedAssets(prev => {
      const newList = prev.includes(assetId) 
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId];
      return newList;
    });
  };

  const handleFileUpload = async (files: FileList | null, type: string) => {
    if (!files || !assetId) return;
    setIsUploading(true);
    try {
      const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
        id: `new-${Date.now()}-${Math.random()}`,
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: type,
        uploadedAt: new Date().toLocaleDateString('fa-IR'),
        file: file,
      }));
      setUploadedFiles(prev => [...newFiles, ...prev]);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('خطا در آپلود فایل');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files, 'document');
    }
  };

  const getDimensionAverage = (score: number, dimension: string) => {
    const counts = {
      strategic: 6,
      technical: 4,
      operational: 4,
      market: 5,
      risk: 4,
    };
    const count = counts[dimension as keyof typeof counts] || 4;
    return count > 0 ? score / count : 0;
  };

  const radarData = valuationData ? [
    { dimension: 'استراتژیک', value: getDimensionAverage(valuationData.strategic_score || 0, 'strategic'), fullMark: 5 },
    { dimension: 'فنی و بلوغ', value: getDimensionAverage(valuationData.technical_score || 0, 'technical'), fullMark: 5 },
    { dimension: 'عملیاتی', value: getDimensionAverage(valuationData.operational_score || 0, 'operational'), fullMark: 5 },
    { dimension: 'بازار', value: getDimensionAverage(valuationData.market_score || 0, 'market'), fullMark: 5 },
    { dimension: 'ریسک', value: getDimensionAverage(valuationData.risk_score || 0, 'risk'), fullMark: 5 },
  ] : [];

  const overallScore = valuationData?.weighted_score || 
    (radarData.length > 0 ? radarData.reduce((acc, item) => acc + item.value, 0) / radarData.length : 0);

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-emerald-600';
    if (score >= 3) return 'text-amber-600';
    if (score >= 2) return 'text-orange-500';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 4) return 'bg-emerald-50 border-emerald-200';
    if (score >= 3) return 'bg-amber-50 border-amber-200';
    if (score >= 2) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const getStatusLabel = (score: number) => {
    if (score >= 4) return '🌟🌟 عالی';
    if (score >= 3) return '👍 خوب';
    if (score >= 2) return '📊 متوسط';
    return '⚠️ ضعیف';
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      'M-01': 'Relief from Royalty',
      'M-02': 'Discounted Cash Flow',
      'M-03': 'Replacement Cost Method',
      'M-04': 'Weighted Weighted Method',
      'M-05': 'Multi-Period Excess Earnings',
      'M-06': 'Replacement Cost Method (Adjusted)',
      'M-07': 'Total Weighted Cost',
      'M-08': 'Cost to Market',
      'M-09': 'Market Multiple Method',
    };
    return labels[method] || method;
  };

  const handleNext = () => {
    saveFormData();
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* هدر با وضعیت ذخیره */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="w-7 h-7 rounded-full bg-dark-green text-white flex items-center justify-center text-xs font-bold">۲</span>
          <span>مرحله ۲ از ۷</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {savingToDb ? (
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
      
      <h2 className="text-xl font-bold text-dark-green">داده پایه</h2>

      {valuationMethod && (
        <div className="bg-dark-green/5 p-4 rounded-lg border border-dark-green/20">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-dark-green" />
            <span className="text-sm font-medium text-dark-green">روش ارزش‌گذاری انتخاب شده:</span>
            <span className="text-sm font-bold text-dark-green">{valuationMethod}</span>
            <span className="text-sm text-gray-500">- {getMethodLabel(valuationMethod)}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ======================================== */}
        {/* بلاک ۱: اطلاعات پایه (A) */}
        {/* ======================================== */}
        <Card className="border-2 border-gray-200 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-dark-green to-dark-green/80 px-5 py-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-white/80" />
              <h3 className="text-sm font-bold text-white">پروفایل اطلاعات پایه محصول</h3>
            </div>
          </div>
          <CardContent className="p-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50/80 p-3 rounded-lg border border-gray-100">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">شناسه مورد</p>
                <p className="text-base font-bold text-dark-green">{formData.assetId || '—'}</p>
              </div>
              <div className="bg-gray-50/80 p-3 rounded-lg border border-gray-100">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">صنعت</p>
                <p className="text-base font-medium text-gray-700">فناوری / نرم‌افزار</p>
              </div>
              <div className="bg-gray-50/80 p-3 rounded-lg border border-gray-100">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">تاریخ ارزش‌گذاری</p>
                <p className="text-base font-medium text-gray-700">{new Date().toLocaleDateString('fa-IR')}</p>
              </div>
              <div className="bg-gray-50/80 p-3 rounded-lg border border-gray-100">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">وضعیت</p>
                <span className="inline-flex items-center gap-1 text-sm bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  در حال انجام
                </span>
              </div>
              <div className="bg-gray-50/80 p-3 rounded-lg border border-gray-100 col-span-2">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">نام دارایی</p>
                <p className="text-base font-medium text-gray-700">{formData.name || 'نامشخص'}</p>
              </div>
              <div className="bg-gray-50/80 p-3 rounded-lg border border-gray-100 col-span-2">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">مالک</p>
                <p className="text-base font-medium text-gray-700">{selectedAsset?.created_by_name || 'نامشخص'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ======================================== */}
        {/* بلاک ۲: امتیازات کیفی (B) */}
        {/* ======================================== */}
        <Card className="border-2 border-gray-200 shadow-lg overflow-hidden">
          <div className="bg-dark-green px-5 py-3">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-white" />
              <h3 className="text-sm font-bold text-white">امتیازات کیفی</h3>
            </div>
          </div>
          <CardContent className="p-5">
            {radarData.length > 0 ? (
              <div className="space-y-4">
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke="#E5E7EB" strokeWidth={0.5} />
                      <PolarAngleAxis 
                        dataKey="dimension" 
                        tick={{ fill: '#4B5563', fontSize: 9, fontWeight: 500 }}
                      />
                      <PolarRadiusAxis 
                        angle={90} 
                        domain={[0, 5]} 
                        tick={{ fill: '#9CA3AF', fontSize: 8 }}
                        axisLine={false}
                      />
                      <Radar
                        name="امتیاز"
                        dataKey="value"
                        stroke="#015345"
                        strokeWidth={2}
                        fill="#015345"
                        fillOpacity={0.15}
                        animationDuration={1000}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-3 rounded-xl shadow-xl border text-xs">
                                <p className="font-bold text-dark-green">{payload[0].payload.dimension}</p>
                                <p className="text-lg font-bold text-dark-green">
                                  {payload[0].value?.toFixed(2)}
                                </p>
                                <p className="text-gray-400">از ۵</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-5 gap-1.5">
                  {Object.entries(DIMENSION_ICONS).map(([key, config]) => {
                    const data = radarData.find(d => d.dimension === config.label);
                    const value = data?.value || 0;
                    const Icon = config.icon;
                    
                    return (
                      <div key={key} className={`p-2 rounded-xl text-center ${config.bg} border border-gray-100`}>
                        <Icon className={`w-4 h-4 mx-auto mb-0.5 ${config.text}`} />
                        <p className="text-[8px] text-gray-500 truncate">{config.label}</p>
                        <p className={`text-sm font-bold ${getScoreColor(value)}`}>
                          {value.toFixed(1)}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-dark-green" />
                    <div>
                      <p className="text-[10px] text-gray-400">امتیاز کلی</p>
                      <p className="text-base font-bold text-dark-green">{overallScore.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getScoreBg(overallScore)}`}>
                    {getStatusLabel(overallScore)}
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <Label className="text-sm font-medium">دلیل بازنویسی امتیاز (اختیاری)</Label>
                  <textarea
                    value={valuationForm.quality_override_reason}
                    onChange={(e) => handleValuationChange('quality_override_reason', e.target.value)}
                    placeholder="در صورت عدم تطابق امتیاز موتور، دلیل را وارد کنید..."
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dark-green min-h-[60px]"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <PieChart className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">هنوز ارزیابی انجام نشده است</p>
                <p className="text-xs mt-1">پس از تکمیل ارزیابی، نمودار نمایش داده می‌شود</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ======================================== */}
        {/* بلاک ۳: ورودی‌های پایه (C) */}
        {/* ======================================== */}
        <Card className="border-2 border-gray-200 shadow-lg lg:col-span-2 overflow-hidden">
          <div className="bg-dark-green px-5 py-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-white" />
              <h3 className="text-sm font-bold text-white">ورودی‌های پایه</h3>
            </div>
          </div>
          <CardContent className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-medium flex items-center gap-1">
                  ارز <span className="text-red-500">*</span>
                </Label>
                <select
                  value={valuationForm.currency}
                  onChange={(e) => handleValuationChange('currency', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dark-green"
                >
                  {CURRENCY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">مبنای تورم</Label>
                <select
                  value={valuationForm.inflation_basis}
                  onChange={(e) => handleValuationChange('inflation_basis', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dark-green"
                >
                  {INFLATION_BASIS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium flex items-center gap-1">
                  نرخ مالیات <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={valuationForm.tax_rate}
                    onChange={(e) => handleValuationChange('tax_rate', parseFloat(e.target.value))}
                    className="w-full text-sm focus:ring-2 focus:ring-dark-green"
                    min={0}
                    max={50}
                  />
                  <span className="text-sm text-gray-400">%</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium flex items-center gap-1">
                  نرخ تنزیل <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={valuationForm.discount_rate}
                    onChange={(e) => handleValuationChange('discount_rate', parseFloat(e.target.value))}
                    className="w-full text-sm focus:ring-2 focus:ring-dark-green"
                    min={10}
                    max={35}
                  />
                  <span className="text-sm text-gray-400">%</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium flex items-center gap-1">
                  افق پیش‌بینی <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={valuationForm.forecast_horizon}
                    onChange={(e) => handleValuationChange('forecast_horizon', parseInt(e.target.value))}
                    className="w-full text-sm focus:ring-2 focus:ring-dark-green"
                    min={3}
                    max={10}
                  />
                  <span className="text-sm text-gray-400">سال</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium flex items-center gap-1">
                  نرخ رشد نهایی <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={valuationForm.terminal_growth_rate}
                    onChange={(e) => handleValuationChange('terminal_growth_rate', parseFloat(e.target.value))}
                    className="w-full text-sm focus:ring-2 focus:ring-dark-green"
                  />
                  <span className="text-sm text-gray-400">%</span>
                </div>
                <p className="text-[10px] text-gray-400">شرط: کمتر از نرخ تنزیل</p>
              </div>

              <div className="space-y-1 col-span-2">
                <Label className="text-xs font-medium flex items-center gap-1">
                  درآمد جاری <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="text"
                  value={valuationForm.current_revenue.toLocaleString()}
                  onChange={(e) => {
                    const val = e.target.value.replace(/,/g, '');
                    const num = parseInt(val) || 0;
                    handleValuationChange('current_revenue', num);
                  }}
                  className="w-full text-sm focus:ring-2 focus:ring-dark-green font-mono"
                />
                <p className="text-[10px] text-gray-400">ریال - حداقل: ۰</p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">عمر مفید (سال)</Label>
                <Input
                  type="number"
                  value={valuationForm.useful_life}
                  onChange={(e) => handleValuationChange('useful_life', parseInt(e.target.value))}
                  className="w-full text-sm focus:ring-2 focus:ring-dark-green"
                  min={1}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium flex items-center gap-1">
                  قابلیت اطمینان منبع <span className="text-red-500">*</span>
                </Label>
                <select
                  value={valuationForm.source_reliability}
                  onChange={(e) => handleValuationChange('source_reliability', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dark-green"
                >
                  {SOURCE_RELIABILITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-400">حداقل مجاز: متوسط</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ======================================== */}
        {/* بلاک ۴: شواهد و پیوست‌ها (D) */}
        {/* ======================================== */}
        <Card className="border-2 border-gray-200 shadow-lg lg:col-span-2 overflow-hidden">
          <div className="bg-dark-green px-5 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-white" />
                <h3 className="text-sm font-bold text-white">شواهد و پیوست‌ها</h3>
              </div>
              {uploadedFiles.length > 0 && (
                <span className="text-xs bg-white/20 text-white px-2.5 py-0.5 rounded-full">
                  {uploadedFiles.length} فایل
                </span>
              )}
            </div>
          </div>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs font-medium text-red-700 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  اسناد اجباری
                </p>
                <ul className="text-xs text-red-600 mt-1 space-y-0.5">
                  <li>✓ شرح دارایی (Asset Description)</li>
                  <li>✓ سند مالکیت (Ownership)</li>
                  <li>✓ سند مالی (Financial Source)</li>
                </ul>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs font-medium text-amber-700 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  شرطی
                </p>
                <p className="text-xs text-amber-600">
                  برای روش‌های درآمدی (M-01 تا M-04): 
                  <span className="font-medium"> سند معیار خارجی</span> الزامی است
                </p>
              </div>
            </div>

            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                dragActive ? 'border-dark-green bg-dark-green/5' : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-dark-green/10 flex items-center justify-center mb-2">
                  <Upload className="w-5 h-5 text-dark-green/60" />
                </div>
                <p className="text-sm text-gray-500">فایل‌ها را اینجا بکشید و رها کنید</p>
                <p className="text-xs text-gray-400 mt-0.5">یا</p>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  id="file-upload"
                  onChange={(e) => handleFileUpload(e.target.files, 'document')}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 border-dark-green/30 text-dark-green hover:bg-dark-green/5"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? 'در حال آپلود...' : 'انتخاب فایل'}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                تگ‌های شواهد <span className="text-red-500">*</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {EVIDENCE_TAG_OPTIONS.map((tag) => (
                  <button
                    key={tag.value}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1 ${
                      evidenceTags[tag.value] === tag.value
                        ? 'bg-dark-green text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    onClick={() => {
                      setEvidenceTags(prev => ({
                        ...prev,
                        [tag.value]: prev[tag.value] === tag.value ? '' : tag.value
                      }));
                    }}
                  >
                    <Tag className="w-3 h-3" />
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>

            {loadingFiles ? (
              <div className="text-center py-4 text-gray-400 text-sm">در حال بارگذاری شواهد...</div>
            ) : uploadedFiles.length > 0 ? (
              <div className="space-y-2 mt-4">
                {uploadedFiles.map((file) => {
                  const fileType = FILE_TYPE_ICONS[file.type as keyof typeof FILE_TYPE_ICONS] || FILE_TYPE_ICONS.document;
                  const FileIcon = fileType.icon;
                  const isNew = file.id.startsWith('new-');
                  
                  return (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-lg ${fileType.bg} flex-shrink-0`}>
                          <FileIcon className={`w-4 h-4 ${fileType.color}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              {file.file_type_label || 'فایل'}
                            </span>
                            <span>•</span>
                            <span>{file.uploadedAt}</span>
                            {isNew && (
                              <span className="text-dark-green font-medium">جدید</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {file.file_url && (
                          <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
                              <Eye className="w-4 h-4 text-gray-400 hover:text-dark-green" />
                            </Button>
                          </a>
                        )}
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-red-50" onClick={() => removeFile(file.id)}>
                          <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-gray-400">هیچ شواهدی برای این دارایی ثبت نشده است</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ======================================== */}
        {/* بلاک ۵: وابستگی‌ها (E) */}
        {/* ======================================== */}
        <Card className="border-2 border-gray-200 shadow-lg lg:col-span-2 overflow-hidden">
          <div className="bg-dark-green px-5 py-3">
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-white" />
              <h3 className="text-sm font-bold text-white">وابستگی‌ها</h3>
            </div>
          </div>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 col-span-1">
                <Label className="text-sm font-medium flex items-center gap-1">
                  دارایی‌های مرتبط <span className="text-red-500">*</span>
                </Label>
                <div className="border rounded-lg p-2 max-h-32 overflow-y-auto space-y-1">
                  {loadingAssets ? (
                    <p className="text-xs text-gray-400">در حال بارگذاری...</p>
                  ) : availableAssets.length === 0 ? (
                    <p className="text-xs text-gray-400">هیچ دارایی دیگری موجود نیست</p>
                  ) : (
                    availableAssets.slice(0, 10).map((asset) => (
                      <label key={asset.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={linkedAssets.includes(asset.id)}
                          onChange={() => handleToggleLinkedAsset(asset.id)}
                          className="rounded border-gray-300 text-dark-green focus:ring-dark-green"
                        />
                        <span className="truncate">{asset.asset_name}</span>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-[10px] text-gray-400">{linkedAssets.length} دارایی انتخاب شده</p>
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium flex items-center gap-1">
                  سطح ریسک همپوشانی <span className="text-red-500">*</span>
                </Label>
                <select
                  value={valuationForm.overlap_risk_level}
                  onChange={(e) => handleValuationChange('overlap_risk_level', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dark-green"
                >
                  {OVERLAP_RISK_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium flex items-center gap-1">
                  نوع همپوشانی <span className="text-red-500">*</span>
                </Label>
                <select
                  value={valuationForm.overlap_type}
                  onChange={(e) => handleValuationChange('overlap_type', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dark-green"
                >
                  {OVERLAP_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
              <div className="space-y-1">
                <Label className="text-sm font-medium flex items-center gap-1">
                  وضعیت بررسی <span className="text-red-500">*</span>
                </Label>
                <select
                  value={valuationForm.review_status}
                  onChange={(e) => handleValuationChange('review_status', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dark-green"
                >
                  {REVIEW_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium">یادداشت کارشناس</Label>
                <textarea
                  value={valuationForm.expert_note}
                  onChange={(e) => handleValuationChange('expert_note', e.target.value)}
                  placeholder="یادداشت‌های کارشناسی..."
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dark-green min-h-[60px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ======================================== */}
        {/* بلاک ۶: فرضیات (F) */}
        {/* ======================================== */}
        <Card className="border-2 border-gray-200 shadow-lg lg:col-span-2 overflow-hidden">
          <div className="bg-dark-green px-5 py-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-white" />
              <h3 className="text-sm font-bold text-white">فرضیات</h3>
              <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                حداقل ۱ فرضیه
              </span>
            </div>
          </div>
          <CardContent className="p-5 space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-sm font-medium flex items-center gap-1">
                  متن فرضیه <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={newAssumption.text}
                  onChange={(e) => setNewAssumption(prev => ({ ...prev, text: e.target.value }))}
                  placeholder="فرضیه جدید را وارد کنید..."
                  className="focus:ring-2 focus:ring-dark-green"
                />
              </div>
              <div className="w-40">
                <Label className="text-sm font-medium">برچسب</Label>
                <select
                  value={newAssumption.tag}
                  onChange={(e) => setNewAssumption(prev => ({ ...prev, tag: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-dark-green"
                >
                  {ASSUMPTION_TAG_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newAssumption.critical}
                    onChange={(e) => setNewAssumption(prev => ({ ...prev, critical: e.target.checked }))}
                    className="rounded border-gray-300 text-dark-green focus:ring-dark-green"
                  />
                  حیاتی
                </label>
              </div>
              <Button
                onClick={handleAddAssumption}
                disabled={!newAssumption.text.trim()}
                className="bg-dark-green hover:bg-dark-green/90"
              >
                افزودن فرضیه
              </Button>
            </div>

            {assumptions.length === 0 ? (
              <div className="text-center py-4 text-gray-400 border-2 border-dashed rounded-lg">
                <p className="text-sm">هنوز فرضیه‌ای ثبت نشده است</p>
                <p className="text-xs">حداقل یک فرضیه باید ثبت شود</p>
              </div>
            ) : (
              <div className="space-y-2">
                {assumptions.map((ass, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-dark-green/5 rounded-lg border border-dark-green/10">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        ass.tag === 'general' 
                          ? 'bg-gray-200 text-gray-600'
                          : 'bg-dark-green/20 text-dark-green'
                      }`}>
                        {ASSUMPTION_TAG_OPTIONS.find(o => o.value === ass.tag)?.label || ass.tag}
                      </span>
                      <span className="text-sm truncate">{ass.text}</span>
                      {ass.critical && (
                        <span className="text-xs text-dark-green font-medium">⭐ حیاتی</span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAssumption(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ======================================== */}
      {/* دکمه‌های ناوبری */}
      {/* ======================================== */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onPrev} className="flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" />
          قبلی
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => saveFormData()}
            disabled={savingToDb}
            className="flex items-center gap-1"
          >
            <Save className="w-4 h-4" />
            {savingToDb ? 'در حال ذخیره...' : 'ذخیره'}
          </Button>
          <Button className="bg-dark-green hover:bg-dark-green/90 flex items-center gap-1" onClick={handleNext}>
            ادامه
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}