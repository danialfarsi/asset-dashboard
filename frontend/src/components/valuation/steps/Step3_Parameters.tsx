'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Save, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';

import { M01_RfR } from './panels/M01_RfR';
import { M02_MEEM } from './panels/M02_MEEM';
import { M03_DCF } from './panels/M03_DCF';
import { M04_WWM } from './panels/M04_WWM';
import { M05_RCM } from './panels/M05_RCM';
import { M06_RPCM } from './panels/M06_RPCM';
import { M07_TWC } from './panels/M07_TWC';
import { M08_CTM } from './panels/M08_CTM';
import { M09_MMM } from './panels/M09_MMM';

interface Step3Props {
  onNext: () => void;
  onPrev: () => void;
  valuationCaseId?: number;
  assetId?: number;
  methodId?: string;
  onSave?: (data: any) => void;
}

const METHOD_PANELS: Record<string, any> = {
  'M-01': M01_RfR,
  'M-02': M02_MEEM,
  'M-03': M03_DCF,
  'M-04': M04_WWM,
  'M-05': M05_RCM,
  'M-06': M06_RPCM,
  'M-07': M07_TWC,
  'M-08': M08_CTM,
  'M-09': M09_MMM,
};

const METHOD_LABELS: Record<string, string> = {
  'M-01': 'RfR - Relief from Royalty (روش حق‌الامتیاز)',
  'M-02': 'MEEM - Multi-Period Excess Earnings (سود مازاد چند دوره‌ای)',
  'M-03': 'DCF - Discounted Cash Flow (جریان نقدی تنزیل‌شده)',
  'M-04': 'WWM - With-and-Without Method (روش با و بدون)',
  'M-05': 'RCM - Replacement Cost Method (هزینه جایگزینی)',
  'M-06': 'RPCM - Reproduction Cost Method (هزینه بازتولید)',
  'M-07': 'TWC - Trained Workforce Cost (هزینه نیروی کار آموزش‌دیده)',
  'M-08': 'CTM - Comparable Transactions Method (معاملات مشابه)',
  'M-09': 'MMM - Market Multiple Method (چندگان بازار)',
};

const METHOD_FIELDS: Record<string, string[]> = {
  'M-01': [
    'royalty_rate', 'industry_benchmark', 'revenue_attribution',
    'revenue_growth_rate', 'attribution_basis', 'expert_signoffs',
    'quality_multiplier',
  ],
  'M-02': [
    'ebit_attributable', 'contributory_assets', 'customer_attrition_rate',
    'expert_signoffs', 'quality_multiplier',
  ],
  'M-03': [
    'fcf_schedule', 'intangible_share_percent', 'expert_signoffs',
    'quality_multiplier',
  ],
  'M-04': [
    'with_asset_fcf', 'without_asset_fcf', 'ramp_up_period', 
    'revenue_attribution', 'revenue_growth_rate', 'expert_signoffs'
  ],
  'M-05': [
    'labor_breakdown', 'material_infra_cost', 'overhead_pct', 
    'developer_profit_pct', 'functional_obs_pct', 'economic_obs_pct'
  ],
  'M-06': [
    'labor_breakdown', 'direct_reproduction_cost', 'coordination_overhead', 
    'relevance_obsolescence', 'age_factor', 'last_review_date'
  ],
  'M-07': [
    'team_members', 'ramp_up_duration', 'productivity_loss', 
    'turnover_rate', 'expert_signoffs', 'quality_multiplier',
  ],
  'M-08': [
    'comparable_deals', 'market_comparability_context', 'industry_classification',
    'expert_signoffs', 'quality_multiplier', 'source_reliability',
  ],
  'M-09': [
    'base_metric', 'base_metric_value', 'market_multiple', 'multiple_source',
    'control_premium_percent', 'marketability_discount_percent', 
    'intangible_share_percent', 'industry_classification', 
    'market_comparability_context', 'expert_signoffs', 'quality_multiplier',
    'source_reliability',
  ],
};

const COMMON_FIELDS = [
  'tax_rate', 'discount_rate', 'forecast_horizon', 
  'terminal_growth_rate', 'current_revenue', 'useful_life', 
  'currency', 'source_reliability', 'category', 
  'business_unit', 'lifecycle_stage'
];

interface Evidence {
  id: number;
  file: string;
  file_name: string;
  evidence_type: string;
  method_id: string;
  uploaded_at: string;
}

export function Step3_Parameters({ 
  onNext, 
  onPrev, 
  valuationCaseId,
  assetId,
  methodId: propMethodId,
  onSave
}: Step3Props) {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [validating, setValidating] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [step3Id, setStep3Id] = useState<number | null>(null);
  const [methodId, setMethodId] = useState<string>(propMethodId || 'M-03');
  const [assetDetails, setAssetDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [step2Data, setStep2Data] = useState<any>(null);
  
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [loadingEvidences, setLoadingEvidences] = useState<boolean>(false);
  const [uploadingEvidence, setUploadingEvidence] = useState<boolean>(false);
  
  const prevMethodIdRef = useRef<string>(propMethodId || 'M-03');
  const prevAssetIdRef = useRef<number | undefined>(assetId);
  const prevValuationCaseIdRef = useRef<number | undefined>(valuationCaseId);

  // ============================================
  // تابع بارگذاری شواهد
  // ============================================
  const loadEvidences = useCallback(async (id: number) => {
    if (!id) {
      console.log('ℹ️ step3Id وجود ندارد برای بارگذاری شواهد');
      return;
    }
    
    try {
      setLoadingEvidences(true);
      console.log('📥 بارگذاری شواهد برای step3Id:', id);
      
      const { data } = await api.get(`/intangible/valuation-step3/${id}/evidences/`);
      const items = data.results || data || [];
      setEvidences(items);
      console.log(`✅ ${items.length} شاهد بارگذاری شد`);
      
      items.forEach((item: any) => {
        console.log(`   📄 ${item.file_name} (${item.evidence_type})`);
      });
      
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('ℹ️ endpoint evidences موجود نیست (404)');
      } else {
        console.error('❌ Error loading evidences:', error);
      }
    } finally {
      setLoadingEvidences(false);
    }
  }, []);

  // ============================================
  // تابع بارگذاری STEP 3
  // ============================================
  const loadStep3FromDatabase = useCallback(async (caseId: number, method: string) => {
    try {
      console.log(`📥 بارگذاری STEP 3 برای valuationCaseId: ${caseId}, method: ${method}`);
      
      const { data } = await api.get(`/intangible/valuation-step3/?valuation_case=${caseId}`);
      const items = data.results || data || [];
      const filteredItems = items.filter((item: any) => item.valuation_case === caseId);
      
      if (filteredItems.length > 0) {
        const step3 = filteredItems[0];
        const id = step3.id;
        setStep3Id(id);
        
        const allowedFields = METHOD_FIELDS[method] || [];
        const savedInputs = step3.method_inputs || {};
        const filteredInputs: any = {};
        
        COMMON_FIELDS.forEach(field => {
          if (savedInputs[field] !== undefined) {
            filteredInputs[field] = savedInputs[field];
          }
        });
        
        allowedFields.forEach(field => {
          if (savedInputs[field] !== undefined) {
            filteredInputs[field] = savedInputs[field];
          }
        });
        
        setFormData((prev: any) => ({ ...prev, ...filteredInputs }));
        console.log('📥 STEP 3 بارگذاری شد با ID:', id);
        
        await loadEvidences(id);
        return id;
      } else {
        console.log('ℹ️ STEP 3 برای این valuationCase وجود ندارد');
        setStep3Id(null);
        return null;
      }
    } catch (error) {
      console.error('Error loading step3:', error);
      return null;
    }
  }, [loadEvidences]);

  // ============================================
  // تابع اصلی بارگذاری
  // ============================================
  const loadAllData = useCallback(async () => {
    if (!assetId || !valuationCaseId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 بارگذاری کامل داده‌ها برای assetId:', assetId, 'valuationCaseId:', valuationCaseId);
      
      const { data: assetData } = await api.get(`/intangible/screened-assets/${assetId}/`);
      setAssetDetails(assetData);
      
      let detectedMethod = assetData.valuation_method || propMethodId || 'M-03';
      setMethodId(detectedMethod);
      
      const { data: caseData } = await api.get(`/intangible/valuation-cases/${valuationCaseId}/`);
      if (caseData) {
        setStep2Data({
          tax_rate: caseData.tax_rate * 100 || 25,
          discount_rate: caseData.discount_rate * 100 || 18,
          forecast_horizon: caseData.forecast_horizon || 5,
          terminal_growth_rate: caseData.terminal_growth_rate * 100 || 5,
          current_revenue: caseData.current_revenue || 500000000000,
          useful_life: caseData.useful_life || 5,
          currency: caseData.currency || 'IRR',
          source_reliability: caseData.source_reliability || 'high',
          category: caseData.category || 'operational',
          business_unit: caseData.business_unit || '',
          lifecycle_stage: caseData.lifecycle_stage || 'growth',
        });
      }
      
      await loadStep3FromDatabase(valuationCaseId, detectedMethod);
      
    } catch (error: any) {
      console.error('❌ Error loading data:', error);
      setError(error.message || 'خطا در بارگذاری');
    } finally {
      setLoading(false);
    }
  }, [assetId, valuationCaseId, propMethodId, loadStep3FromDatabase]);

  // ============================================
  // useEffect اصلی
  // ============================================
  useEffect(() => {
    console.log('🔄 useEffect - assetId:', assetId, 'valuationCaseId:', valuationCaseId);
    
    setStep3Id(null);
    setEvidences([]);
    setFormData({});
    setValidationResult(null);
    
    if (assetId && valuationCaseId) {
      loadAllData();
    } else {
      setLoading(false);
      if (propMethodId) {
        setMethodId(propMethodId);
      }
    }
  }, [assetId, valuationCaseId, loadAllData]);

  // ============================================
  // بارگذاری مجدد شواهد
  // ============================================
  useEffect(() => {
    if (step3Id) {
      console.log('🔄 بارگذاری مجدد شواهد برای step3Id:', step3Id);
      loadEvidences(step3Id);
    }
  }, []);

  // ============================================
  // 🔥 آپلود شاهد - اصلاح شده
  // ============================================
  const handleUploadEvidence = async (file: File, evidenceType: string): Promise<void> => {
    let currentStep3Id = step3Id;
    
    // اگر step3Id وجود نداشت، یک STEP 3 جدید با داده‌های موجود ایجاد کن
    if (!currentStep3Id) {
      try {
        // 🔥 داده‌های موجود رو جمع کن
        const allowedFields = METHOD_FIELDS[methodId] || [];
        const filteredInputs: any = {};
        
        COMMON_FIELDS.forEach(field => {
          if (formData[field] !== undefined && formData[field] !== null) {
            filteredInputs[field] = formData[field];
          }
        });
        
        allowedFields.forEach(field => {
          if (formData[field] !== undefined && formData[field] !== null) {
            filteredInputs[field] = formData[field];
          }
        });
        
        // اگر داده‌ای وجود نداشت، یک شیء خالی با فیلدهای پیش‌فرض بساز
        if (Object.keys(filteredInputs).length === 0) {
          // فیلدهای پیش‌فرض برای هر روش
          const defaultInputs: Record<string, any> = {
            'M-01': { royalty_rate: 4, industry_benchmark: 'software', revenue_attribution: 80, revenue_growth_rate: 8 },
            'M-02': { ebit_attributable: 20000000000, customer_attrition_rate: 10 },
            'M-03': { intangible_share_percent: 70 },
            'M-04': { ramp_up_period: 12, revenue_attribution: 80, revenue_growth_rate: 8 },
            'M-05': { overhead_pct: 20, developer_profit_pct: 15 },
            'M-06': { coordination_overhead: 20 },
            'M-07': { ramp_up_duration: 6, productivity_loss: 30, turnover_rate: 8 },
            'M-08': { market_comparability_context: 'High' },
            'M-09': { market_multiple: 2.5, intangible_share_percent: 40 },
          };
          
          Object.assign(filteredInputs, defaultInputs[methodId] || {});
        }
        
        const payload = {
          valuation_case: valuationCaseId,
          method_id: methodId,
          method_inputs: filteredInputs,
        };
        
        console.log('📤 ایجاد STEP 3 جدید با داده:', payload);
        const response = await api.post('/intangible/valuation-step3/', payload);
        currentStep3Id = response.data.id;
        setStep3Id(currentStep3Id);
        console.log('✅ STEP 3 جدید ایجاد شد با ID:', currentStep3Id);
        
      } catch (error: any) {
        console.error('❌ Error creating step3:', error);
        console.error('❌ Response:', error.response?.data);
        throw new Error('خطا در ایجاد STEP 3: ' + (error.response?.data?.message || ''));
      }
    }
    
    // حالا فایل رو آپلود کن
    try {
      setUploadingEvidence(true);
      console.log('📤 آپلود شاهد:', { file: file.name, evidenceType, step3Id: currentStep3Id });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('evidence_type', evidenceType);
      formData.append('method_id', methodId);
      
      const response = await api.post(
        `/intangible/valuation-step3/${currentStep3Id}/upload_evidence/`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      
      const newEvidence = response.data;
      setEvidences(prev => [...prev, newEvidence]);
      console.log('✅ فایل آپلود شد:', newEvidence);
      
    } catch (error: any) {
      console.error('❌ Error uploading evidence:', error);
      throw new Error(error.response?.data?.error || 'خطا در آپلود فایل');
    } finally {
      setUploadingEvidence(false);
    }
  };

  // ============================================
  // حذف شاهد
  // ============================================
  const handleDeleteEvidence = async (evidenceId: number): Promise<void> => {
    try {
      console.log('🗑️ حذف شاهد:', evidenceId);
      
      try {
        await api.delete(`/intangible/valuation-step3/evidence/${evidenceId}/`);
        console.log('✅ شاهد از سرور حذف شد');
      } catch (serverError: any) {
        if (serverError.response?.status === 404) {
          console.log('ℹ️ endpoint حذف وجود ندارد، فقط از state حذف می‌شود');
        } else {
          throw serverError;
        }
      }
      
      setEvidences(prev => prev.filter(e => e.id !== evidenceId));
      console.log('✅ شاهد از state حذف شد');
      
    } catch (error: any) {
      console.error('❌ Error deleting evidence:', error);
    }
  };

  // ============================================
  // ذخیره داده‌ها
  // ============================================
  const handleSave = async (): Promise<void> => {
    if (!valuationCaseId) {
      setSaveError('شناسه مورد ارزش‌گذاری موجود نیست');
      return;
    }

    try {
      setSaving(true);
      setSaveError(null);

      const allowedFields = METHOD_FIELDS[methodId] || [];
      const filteredInputs: any = {};
      
      COMMON_FIELDS.forEach(field => {
        if (formData[field] !== undefined && formData[field] !== null) {
          filteredInputs[field] = formData[field];
        }
      });
      
      allowedFields.forEach(field => {
        if (formData[field] !== undefined && formData[field] !== null) {
          filteredInputs[field] = formData[field];
        }
      });

      const payload = {
        valuation_case: valuationCaseId,
        method_id: methodId,
        method_inputs: filteredInputs,
      };

      let response;
      let currentStep3Id = step3Id;
      
      if (!currentStep3Id) {
        const { data: existing } = await api.get(`/intangible/valuation-step3/?valuation_case=${valuationCaseId}`);
        const items = existing.results || existing || [];
        const filteredItems = items.filter((item: any) => item.valuation_case === valuationCaseId);
        
        if (filteredItems.length > 0) {
          currentStep3Id = filteredItems[0].id;
          setStep3Id(currentStep3Id);
        }
      }
      
      if (currentStep3Id) {
        response = await api.patch(`/intangible/valuation-step3/${currentStep3Id}/`, payload);
        console.log('✅ STEP 3 به‌روزرسانی شد (PATCH)');
      } else {
        response = await api.post('/intangible/valuation-step3/', payload);
        setStep3Id(response.data.id);
        console.log('✅ STEP 3 جدید ایجاد شد (POST)');
      }

      if (onSave) onSave(response.data);
      setLastSaved(new Date().toLocaleTimeString('fa-IR'));

    } catch (error: any) {
      console.error('❌ Error saving step3:', error);
      setSaveError(error.response?.data?.message || 'خطا در ذخیره');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleValidate = async (): Promise<void> => {
    let currentStep3Id = step3Id;
    
    if (!currentStep3Id) {
      await handleSave();
      currentStep3Id = step3Id;
    }
    
    if (!currentStep3Id) {
      setSaveError('ابتدا داده‌ها را ذخیره کنید');
      return;
    }

    try {
      setValidating(true);
      const response = await api.post(`/intangible/valuation-step3/${currentStep3Id}/validate_step/`);
      setValidationResult(response.data);
      console.log('✅ اعتبارسنجی:', response.data);
    } catch (error) {
      console.error('❌ Error validating step3:', error);
    } finally {
      setValidating(false);
    }
  };

  const handleFormChange = (data: any): void => {
    const allowedFields = METHOD_FIELDS[methodId] || [];
    
    const filteredData: any = {};
    Object.keys(data).forEach(key => {
      if (allowedFields.includes(key) || COMMON_FIELDS.includes(key)) {
        filteredData[key] = data[key];
      }
    });
    
    setFormData((prev: any) => ({ ...prev, ...filteredData }));
  };

  const PanelComponent = METHOD_PANELS[methodId];

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-500">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          تلاش مجدد
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-dark-green" />
        <span className="text-gray-500">در حال بارگذاری روش ارزش‌گذاری...</span>
      </div>
    );
  }

  if (!PanelComponent) {
    return (
      <div className="text-center py-12 text-gray-400">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        <p className="text-lg">پنل روش {methodId} یافت نشد</p>
        <p className="text-sm">لطفاً با پشتیبانی تماس بگیرید</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="w-7 h-7 rounded-full bg-dark-green text-white flex items-center justify-center text-xs font-bold">۳</span>
        <span>مرحله ۳ از ۷</span>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dark-green">پارامترهای اختصاصی</h2>
          <p className="text-sm text-gray-500">
            روش: <span className="font-medium text-dark-green">{methodId} - {METHOD_LABELS[methodId] || methodId}</span>
          </p>
          {assetDetails && (
            <p className="text-xs text-gray-400 mt-1">
              دارایی: {assetDetails.asset_name} ({assetDetails.asset_uid})
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {validationResult && (
            <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
              validationResult.is_valid 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {validationResult.is_valid ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
              {validationResult.errors || 0} خطا
            </div>
          )}
          {evidences.length > 0 && (
            <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              {evidences.length} شاهد
            </div>
          )}
          {lastSaved && !saveError && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              {lastSaved}
            </span>
          )}
          {saveError && (
            <span className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              خطا
            </span>
          )}
          {loadingEvidences && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              بارگذاری شواهد...
            </span>
          )}
        </div>
      </div>

      {step2Data && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-blue-700 mb-2">📥 داده‌های ورودی از STEP 2:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="bg-white p-2 rounded border border-blue-100">
              <span className="text-gray-400">نرخ مالیات:</span>
              <span className="font-bold text-dark-green mr-1">{step2Data.tax_rate}%</span>
            </div>
            <div className="bg-white p-2 rounded border border-blue-100">
              <span className="text-gray-400">نرخ تنزیل:</span>
              <span className="font-bold text-dark-green mr-1">{step2Data.discount_rate}%</span>
            </div>
            <div className="bg-white p-2 rounded border border-blue-100">
              <span className="text-gray-400">افق پیش‌بینی:</span>
              <span className="font-bold text-dark-green mr-1">{step2Data.forecast_horizon} سال</span>
            </div>
            <div className="bg-white p-2 rounded border border-blue-100">
              <span className="text-gray-400">درآمد جاری:</span>
              <span className="font-bold text-dark-green mr-1">{step2Data.current_revenue?.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <PanelComponent
            formData={formData}
            onChange={handleFormChange}
            assetId={assetId}
            valuationCaseId={valuationCaseId}
            step2Data={step2Data}
            onUploadEvidence={handleUploadEvidence}
            evidences={evidences}
            onDeleteEvidence={handleDeleteEvidence}
            uploadingEvidence={uploadingEvidence}
          />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onPrev} className="flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" />
          قبلی
        </Button>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1"
          >
            <Save className="w-4 h-4" />
            {saving ? 'در حال ذخیره...' : 'ذخیره'}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleValidate}
            disabled={validating || !step3Id}
            className="flex items-center gap-1 border-amber-400 text-amber-600 hover:bg-amber-50"
          >
            {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            اعتبارسنجی
          </Button>
          
          <Button
            className="bg-dark-green hover:bg-dark-green/90 flex items-center gap-1"
            onClick={onNext}
          >
            ادامه
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
