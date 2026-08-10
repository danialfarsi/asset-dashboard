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
  is_uploaded?: boolean;
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
  benchmark: { icon: TrendingUp, label: 'معیار خارجی', color: 'text-blue-600', bg: 'bg-blue-50' },
  financial: { icon: DollarSign, label: 'مالی', color: 'text-green-600', bg: 'bg-green-50' },
  asset_description: { icon: FileText, label: 'شرح دارایی', color: 'text-purple-600', bg: 'bg-purple-50' },
  ownership: { icon: Shield, label: 'مالکیت', color: 'text-amber-600', bg: 'bg-amber-50' },
  expert: { icon: User, label: 'نظر خبره', color: 'text-indigo-600', bg: 'bg-indigo-50' },
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
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ total: number; done: number } | null>(null);

  const [valuationForm, setValuationForm] = useState({
    category: 'operational',
    business_unit: '',
    lifecycle_stage: 'growth',
    quality_override_reason: '',
    currency: 'IRR',
    inflation_basis: 'cost',
    tax_rate: 25,
    discount_rate: 18,
    forecast_horizon: 4,
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
  // Toast notification (جایگزین alert)
  // ============================================
  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToastMessage({ type, message });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ============================================
  // وقتی assetId تغییر می‌کند
  // ============================================
  const resetState = useCallback(() => {
    console.log(`🔄 ریست کردن state برای assetId: ${assetId}`);
    setUploadedFiles([]);
    setAssumptions([]);
    setLinkedAssets([]);
    setEvidenceTags({});
    setLastSaved(null);
    setSaveError(null);
  }, []);

  // ============================================
  // بارگذاری داده‌ها
  // ============================================
  useEffect(() => {
    if (assetId) {
      resetState();
      fetchEvidenceFiles();
      fetchAvailableAssets();
      fetchValidationRules();
      loadFromLocalStorage();
      loadFromDatabase();
    }
  }, [assetId, valuationCaseId]);

  const loadFromLocalStorage = () => {
    if (!assetId) return;
    
    try {
      const saved = localStorage.getItem(`valuation_form_${assetId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setValuationForm(prev => ({ ...prev, ...parsed }));
        if (parsed.assumptions) setAssumptions(parsed.assumptions);
        if (parsed.linkedAssets) setLinkedAssets(parsed.linkedAssets);
        if (parsed.evidenceTags) setEvidenceTags(parsed.evidenceTags);
        if (parsed.uploadedFiles) {
          const validFiles = parsed.uploadedFiles.filter((f: any) => f.file_url);
          if (validFiles.length > 0) {
            setUploadedFiles(validFiles);
          }
        }
        console.log(`📥 بارگذاری از localStorage برای assetId ${assetId}:`, parsed);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  };

  const loadFromDatabase = async () => {
    if (!valuationCaseId) return;
    
    try {
      const { data } = await api.get(`/intangible/valuation-cases/${valuationCaseId}/`);
      
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
      
      if (data.assumptions) {
        setAssumptions(data.assumptions.map((a: any) => ({
          text: a.assumption_text,
          tag: a.assumption_tag,
          critical: a.assumption_critical,
        })));
      }
      
      if (data.linked_assets) {
        setLinkedAssets(data.linked_assets);
      }
      
      console.log('📥 بارگذاری از دیتابیس:', data);
    } catch (error) {
      console.error('Error loading from database:', error);
    }
  };

  // ============================================
  // ذخیره‌سازی در دیتابیس
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
        tax_rate: taxRate > 1 ? taxRate / 100 : taxRate,
        discount_rate: discountRate > 1 ? discountRate / 100 : discountRate,
        forecast_horizon: Number(data.forecast_horizon) || 4,
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
      
      if (data.assumptions && data.assumptions.length > 0) {
        console.log('📤 ۲. ذخیره فرضیات:', data.assumptions);
        await api.post(
          `/intangible/valuation-cases/${valuationCaseId}/sync_assumptions/`,
          {
            assumptions: data.assumptions.map((a: any) => ({
              assumption_text: a.text,
              assumption_tag: a.tag,
              assumption_critical: a.critical,
            }))
          }
        );
        console.log('✅ فرضیات ذخیره شدند');
      }
      
      if (data.linkedAssets && data.linkedAssets.length > 0) {
        console.log('📤 ۳. ذخیره وابستگی‌ها:', data.linkedAssets);
        await api.patch(
          `/intangible/valuation-cases/${valuationCaseId}/update_linked_assets/`,
          { linked_assets: data.linkedAssets }
        );
        console.log('✅ وابستگی‌ها ذخیره شدند');
      }
      
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
    if (!assetId) return;
    
    try {
      localStorage.setItem(`valuation_form_${assetId}`, JSON.stringify(data));
      if (onFormDataUpdate) {
        onFormDataUpdate(data);
      }
      console.log(`💾 ذخیره در localStorage برای assetId ${assetId}`);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [assetId, onFormDataUpdate]);

  // ============================================
  // ذخیره همزمان در دیتابیس + localStorage
  // ============================================
  const saveFormData = useCallback(() => {
    const currentUploadedFiles = uploadedFiles.filter(f => {
      const idStr = String(f.id);
      if (idStr.startsWith('new-') || idStr.startsWith('local-')) {
        return true;
      }
      return true;
    });
    
    const data = {
      ...valuationForm,
      assumptions,
      linkedAssets,
      evidenceTags,
      uploadedFiles: currentUploadedFiles.map(f => ({ 
        id: f.id, 
        name: f.name, 
        type: f.type, 
        file_url: f.file_url 
      })),
    };
    
    saveToLocalStorage(data);
    saveToDatabase(data);
    
  }, [valuationForm, assumptions, linkedAssets, evidenceTags, uploadedFiles, saveToLocalStorage, saveToDatabase]);

  // ============================================
  // Auto-save با debounce
  // ============================================
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(valuationForm).length > 0 || assumptions.length > 0) {
        saveFormData();
      }
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

  // ============================================
  // دریافت فایل‌های شواهد از دیتابیس
  // ============================================
  const fetchEvidenceFiles = async () => {
    if (!assetId) {
      console.warn('⚠️ assetId وجود ندارد');
      setUploadedFiles([]);
      return;
    }
    
    try {
      setLoadingFiles(true);
      console.log(`📥 بارگذاری فایل‌های شواهد برای assetId: ${assetId}`);
      
      const { data } = await api.get(`/intangible/asset-files/?asset=${assetId}`);
      const items = data.results || data || [];
      
      const files: UploadedFile[] = items.map((file: any) => {
        // 🔥 تگ را از description بخوان
        let tag = file.description || '';
        let tagLabel = tag;
        
        // اگر تگ در EVIDENCE_TAG_OPTIONS وجود دارد، برچسب آن را بگیر
        const foundTag = EVIDENCE_TAG_OPTIONS.find(t => t.value === tag);
        if (foundTag) {
          tagLabel = foundTag.label;
        } else if (tag) {
          // اگر تگ معتبر نبود، از file_type استفاده کن
          tag = file.file_type || 'document';
          const foundType = EVIDENCE_TAG_OPTIONS.find(t => t.value === tag);
          tagLabel = foundType?.label || tag;
        } else {
          tag = file.file_type || 'document';
          const foundType = EVIDENCE_TAG_OPTIONS.find(t => t.value === tag);
          tagLabel = foundType?.label || tag;
        }
        
        return {
          id: String(file.id),
          name: file.title || file.file?.split('/').pop() || 'فایل',
          size: '—',
          type: tag,
          uploadedAt: new Date(file.uploaded_at).toLocaleDateString('fa-IR'),
          file_url: file.file,
          file_type_label: tagLabel,
          is_uploaded: true,
        };
      });
      
      setUploadedFiles(files);
      console.log(`✅ ${files.length} فایل از دیتابیس برای assetId ${assetId} بارگذاری شد`);
      files.forEach(f => {
        console.log(`   📄 ${f.name} → تگ: ${f.type} (${f.file_type_label})`);
      });
      
      if (files.length > 0) {
        const data = {
          ...valuationForm,
          assumptions,
          linkedAssets,
          evidenceTags,
          uploadedFiles: files.map(f => ({ id: f.id, name: f.name, type: f.type, file_url: f.file_url })),
        };
        saveToLocalStorage(data);
      }
      
    } catch (error: any) {
      console.error(`❌ Error fetching evidence files for assetId ${assetId}:`, error);
      
      if (error.response?.status === 404) {
        console.log(`ℹ️ هیچ فایلی برای assetId ${assetId} وجود ندارد`);
        setUploadedFiles([]);
      }
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

  // ============================================
  // آپلود فایل به دیتابیس - با استفاده از description برای تگ
  // ============================================
  const handleFileUpload = async (files: FileList | null, type: string) => {
    if (!files || !assetId) {
      showToast('error', 'شناسه دارایی موجود نیست');
      return;
    }
    
    // تگ‌های انتخاب شده را بگیر
    const selectedTags = Object.keys(evidenceTags).filter(key => evidenceTags[key] === key);
    console.log('📌 تگ‌های انتخاب شده:', selectedTags);
    
    if (selectedTags.length === 0) {
      showToast('error', 'لطفاً ابتدا یک تگ انتخاب کنید');
      return;
    }
    
    const tag = selectedTags[0];
    const tagLabel = EVIDENCE_TAG_OPTIONS.find(t => t.value === tag)?.label || tag;
    
    setIsUploading(true);
    setUploadProgress({ total: files.length, done: 0 });
    
    try {
      const uploadedFilesList: UploadedFile[] = [];
      const errors: string[] = [];
      
      for (const [index, file] of Array.from(files).entries()) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          
          // 🔥 از 'document' به عنوان file_type استفاده کن
          // و تگ را در description ذخیره کن
          formData.append('file_type', 'document');
          formData.append('title', file.name);
          formData.append('asset', String(assetId));
          formData.append('description', tag);
          
          console.log(`📤 آپلود فایل ${file.name} با تگ: ${tag}`);
          
          const response = await api.post(
            `/intangible/asset-files/`,
            formData,
            { 
              headers: { 'Content-Type': 'multipart/form-data' },
              timeout: 30000,
            }
          );
          
          const fileData = response.data;
          console.log(`✅ فایل ${file.name} با موفقیت آپلود شد:`, fileData);
          
          uploadedFilesList.push({
            id: String(fileData.id || `new-${Date.now()}-${Math.random()}`),
            name: file.name,
            size: (file.size / 1024).toFixed(1) + ' KB',
            type: tag,
            uploadedAt: new Date().toLocaleDateString('fa-IR'),
            file_url: fileData.file,
            file_type_label: tagLabel,
            is_uploaded: true,
          });
          
          setUploadProgress(prev => prev ? { ...prev, done: index + 1 } : null);
          
        } catch (error: any) {
          console.error(`❌ خطا در آپلود فایل ${file.name}:`, error);
          const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
          errors.push(`${file.name}: ${errorMsg}`);
        }
      }
      
      setUploadedFiles(prev => {
        const existingIds = new Set(prev.map(f => String(f.id)));
        const newFiles = uploadedFilesList.filter(f => !existingIds.has(String(f.id)));
        return [...newFiles, ...prev];
      });
      
      // بعد از آپلود موفق، تگ را از لیست بردار
      setEvidenceTags(prev => {
        const newTags = { ...prev };
        delete newTags[tag];
        return newTags;
      });
      
      const data = {
        ...valuationForm,
        assumptions,
        linkedAssets,
        evidenceTags,
      };
      saveToLocalStorage(data);
      
      const successCount = uploadedFilesList.filter(f => f.is_uploaded).length;
      if (successCount > 0) {
        showToast('success', `${successCount} فایل با تگ "${tagLabel}" آپلود شد`);
      }
      if (errors.length > 0) {
        showToast('error', `${errors.length} فایل با خطا مواجه شد`);
      }
      
      if (uploadedFilesList.some(f => f.is_uploaded)) {
        saveToDatabase(data);
      }
      
    } catch (error) {
      console.error('Error uploading files:', error);
      showToast('error', 'خطا در آپلود فایل');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => String(f.id) !== String(id)));
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
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
          toastMessage.type === 'success' ? 'bg-green-500 text-white' :
          toastMessage.type === 'error' ? 'bg-red-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {toastMessage.type === 'error' && <AlertCircle className="w-5 h-5" />}
            {toastMessage.type === 'info' && <Info className="w-5 h-5" />}
            <span className="text-sm">{toastMessage.message}</span>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploadProgress && (
        <div className="fixed bottom-4 right-4 z-50 p-4 bg-white rounded-lg shadow-lg border border-gray-200 max-w-md">
          <p className="text-sm font-medium">در حال آپلود...</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className="bg-dark-green h-2 rounded-full transition-all duration-300"
              style={{ width: `${(uploadProgress.done / uploadProgress.total) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">{uploadProgress.done} از {uploadProgress.total}</p>
        </div>
      )}

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
        {/* بلاک ۴: شواهد و پیوست‌ها (D) - با تگ‌ها */}
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
                  {uploadedFiles.filter(f => f.is_uploaded !== false).length} فایل
                </span>
              )}
            </div>
          </div>
          <CardContent className="p-5 space-y-4">
            {/* راهنمای تگ‌ها */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-xs font-medium text-blue-700 mb-1">📌 نحوه استفاده از تگ‌ها:</p>
              <p className="text-xs text-blue-600">
                ۱. روی تگ مورد نظر کلیک کنید تا انتخاب شود
                <br />
                ۲. فایل را آپلود کنید تا با همان تگ در دیتابیس ثبت شود
                <br />
                ۳. تگ در دیتابیس ثبت می‌شود و QC آن را تشخیص می‌دهد
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                تگ‌های شواهد <span className="text-red-500">*</span>
                <span className="text-xs text-gray-400 font-normal">
                  (انتخاب شده: {Object.keys(evidenceTags).filter(key => evidenceTags[key] === key).length})
                </span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {EVIDENCE_TAG_OPTIONS.map((tag) => {
                  const isSelected = evidenceTags[tag.value] === tag.value;
                  return (
                    <button
                      key={tag.value}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1 ${
                        isSelected
                          ? 'bg-dark-green text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      onClick={() => {
                        setEvidenceTags(prev => {
                          if (prev[tag.value] === tag.value) {
                            const newTags = { ...prev };
                            delete newTags[tag.value];
                            return newTags;
                          }
                          return { [tag.value]: tag.value };
                        });
                      }}
                    >
                      <Tag className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
                      {tag.label}
                      {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-400">* هر بار فقط یک تگ قابل انتخاب است</p>
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
                {Object.keys(evidenceTags).filter(key => evidenceTags[key] === key).length === 0 && (
                  <p className="text-xs text-red-500 mt-2">⚠️ لطفاً ابتدا یک تگ انتخاب کنید</p>
                )}
                {Object.keys(evidenceTags).filter(key => evidenceTags[key] === key).length > 0 && (
                  <p className="text-xs text-green-500 mt-2">
                    ✅ تگ "{EVIDENCE_TAG_OPTIONS.find(t => t.value === Object.keys(evidenceTags).find(key => evidenceTags[key] === key))?.label}" انتخاب شده است
                  </p>
                )}
              </div>
            </div>

            {loadingFiles ? (
              <div className="text-center py-4 text-gray-400 text-sm">در حال بارگذاری شواهد...</div>
            ) : (
              <div className="mt-4">
                <div className="max-h-64 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  {uploadedFiles.length > 0 ? (
                    uploadedFiles.map((file) => {
                      // 🔥 تگ را از file.type بخوان
                      const tag = file.type || 'document';
                      const tagLabel = EVIDENCE_TAG_OPTIONS.find(t => t.value === tag)?.label || tag;
                      
                      const fileType = FILE_TYPE_ICONS[tag as keyof typeof FILE_TYPE_ICONS] || FILE_TYPE_ICONS.document;
                      const FileIcon = fileType.icon;
                      const isUploaded = file.is_uploaded !== false;
                      
                      return (
                        <div key={String(file.id)} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all group">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`p-2 rounded-lg ${fileType.bg} flex-shrink-0`}>
                              <FileIcon className={`w-4 h-4 ${fileType.color}`} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <span className="flex items-center gap-1">
                                  {isUploaded ? (
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                  ) : (
                                    <AlertCircle className="w-3 h-3 text-red-500" />
                                  )}
                                  {tagLabel || 'فایل'}
                                </span>
                                <span>•</span>
                                <span>{file.uploadedAt}</span>
                                {isUploaded ? (
                                  <span className="text-green-500 text-[10px]">✅ آپلود شده</span>
                                ) : (
                                  <span className="text-red-500 text-[10px]">⚠️ آپلود نشده</span>
                                )}
                                {tag && EVIDENCE_TAG_OPTIONS.find(t => t.value === tag) && (
                                  <span className="text-xs bg-dark-green/10 text-dark-green px-1.5 py-0.5 rounded-full">
                                    {EVIDENCE_TAG_OPTIONS.find(t => t.value === tag)?.label}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            {file.file_url && isUploaded && (
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
                    })
                  ) : (
                    <div className="text-center py-6">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm text-gray-400">هیچ شواهدی برای این دارایی ثبت نشده است</p>
                      <p className="text-xs text-gray-400 mt-1">برای آپلود فایل، ابتدا یک تگ انتخاب کنید</p>
                    </div>
                  )}
                </div>
                {uploadedFiles.length > 5 && (
                  <div className="text-center text-xs text-gray-400 mt-2">
                    {uploadedFiles.length} فایل • برای مشاهده همه اسکرول کنید
                  </div>
                )}
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
