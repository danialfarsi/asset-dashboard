'use client';

import { useState, useEffect, useRef } from 'react';
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
  'M-01': 'RfR - Relief from Royalty',
  'M-02': 'MEEM - Multi-Period Excess Earnings',
  'M-03': 'DCF - Discounted Cash Flow',
  'M-04': 'WWM - With-and-Without Method',
  'M-05': 'RCM - Replacement Cost Method',
  'M-06': 'RPCM - Reproduction Cost Method',
  'M-07': 'TWC - Trained Workforce Cost',
  'M-08': 'CTM - Comparable Transactions Method',
  'M-09': 'MMM - Market Multiple Method',
};

const METHOD_FIELDS: Record<string, string[]> = {
  'M-04': ['with_asset_fcf', 'without_asset_fcf', 'ramp_up_period', 'revenue_attribution', 'revenue_growth_rate', 'expert_signoffs'],
  'M-05': ['labor_breakdown', 'material_infra_cost', 'overhead_pct', 'developer_profit_pct', 'functional_obs_pct', 'economic_obs_pct'],
  'M-06': ['labor_breakdown', 'direct_reproduction_cost', 'coordination_overhead', 'relevance_obsolescence', 'age_factor', 'last_review_date'],
  'M-01': [],
  'M-02': [],
  'M-03': [],
  'M-07': [],
  'M-08': [],
  'M-09': [],
};

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
  const [validating, setValidating] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [step3Id, setStep3Id] = useState<number | null>(null);
  const [methodId, setMethodId] = useState<string>(propMethodId || 'M-03');
  const [assetDetails, setAssetDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [step2Data, setStep2Data] = useState<any>(null);
  
  // 🔥 refها برای tracking تغییرات
  const prevMethodIdRef = useRef<string>(propMethodId || 'M-03');
  const prevAssetIdRef = useRef<number | undefined>(assetId);
  const prevValuationCaseIdRef = useRef<number | undefined>(valuationCaseId);

  // ============================================
  // 🔥 وقتی assetId یا valuationCaseId تغییر میکنه، فرم رو ریست کن
  // ============================================
  useEffect(() => {
    const assetChanged = assetId !== prevAssetIdRef.current;
    const caseChanged = valuationCaseId !== prevValuationCaseIdRef.current;
    
    if (assetChanged || caseChanged) {
      console.log(`🔄 دارایی یا مورد ارزش‌گذاری تغییر کرد`);
      console.log(`   assetId: ${prevAssetIdRef.current} → ${assetId}`);
      console.log(`   valuationCaseId: ${prevValuationCaseIdRef.current} → ${valuationCaseId}`);
      
      // 🔥 کلید localStorage مربوط به دارایی قبلی رو پاک کن
      if (prevAssetIdRef.current) {
        const oldKey = `valuation_form_${prevAssetIdRef.current}`;
        localStorage.removeItem(oldKey);
        console.log(`🗑️ localStorage key حذف شد: ${oldKey}`);
      }
      
      // ریست کردن formData
      setFormData({});
      setStep3Id(null);
      setValidationResult(null);
      setStep2Data(null);
      
      // 🔥 اگه دارایی جدید هست، از localStorage جدید نخون
      // فقط از دیتابیس بخون (اگه ValuationCase وجود داشته باشه)
      
      prevAssetIdRef.current = assetId;
      prevValuationCaseIdRef.current = valuationCaseId;
    }
  }, [assetId, valuationCaseId]);

  // ============================================
  // بارگذاری اولیه
  // ============================================
  useEffect(() => {
    if (assetId) {
      // 🔥 اول از دیتابیس بخون، بعد اگه نبود از localStorage
      loadFromDatabase();
      loadStep2Data();
      fetchAssetMethod();
    } else {
      setLoading(false);
      if (propMethodId) {
        setMethodId(propMethodId);
      }
    }
  }, [assetId, propMethodId]);

  // ============================================
  // 🔥 بارگذاری از دیتابیس (اولویت اول)
  // ============================================
  const loadFromDatabase = async (): Promise<void> => {
    if (!valuationCaseId) {
      console.log('ℹ️ valuationCaseId وجود ندارد، از localStorage استفاده میشود');
      return;
    }
    
    try {
      const { data } = await api.get(`/intangible/valuation-cases/${valuationCaseId}/`);
      if (data) {
        console.log('📥 داده‌های STEP 2 از دیتابیس:', data);
        setStep2Data({
          tax_rate: data.tax_rate * 100 || 25,
          discount_rate: data.discount_rate * 100 || 18,
          forecast_horizon: data.forecast_horizon || 5,
          terminal_growth_rate: data.terminal_growth_rate * 100 || 5,
          current_revenue: data.current_revenue || 500000000000,
          useful_life: data.useful_life || 5,
          currency: data.currency || 'IRR',
          source_reliability: data.source_reliability || 'high',
          category: data.category || 'operational',
          business_unit: data.business_unit || '',
          lifecycle_stage: data.lifecycle_stage || 'growth',
        });
      }
    } catch (error) {
      console.log('⚠️ خطا در بارگذاری از دیتابیس:', error);
    }
  };

  const loadStep2Data = (): void => {
    if (!assetId) return;
    
    // 🔥 اگه step2Data از دیتابیس اومده، از localStorage استفاده نکن
    if (step2Data) {
      console.log('✅ داده‌های STEP 2 از دیتابیس موجود است، از localStorage صرف‌نظر شد');
      return;
    }
    
    try {
      const saved = localStorage.getItem(`valuation_form_${assetId}`);
      if (saved) {
        const data = JSON.parse(saved);
        setStep2Data(data);
        console.log('📥 داده‌های STEP 2 از localStorage:', data);
        
        setFormData((prev: any) => ({
          ...prev,
          tax_rate: Number(data.tax_rate) || 25,
          discount_rate: Number(data.discount_rate) || 18,
          forecast_horizon: Number(data.forecast_horizon) || 5,
          terminal_growth_rate: Number(data.terminal_growth_rate) || 5,
          current_revenue: Number(data.current_revenue) || 500000000000,
          useful_life: Number(data.useful_life) || 5,
          currency: data.currency || 'IRR',
          source_reliability: data.source_reliability || 'high',
          category: data.category || 'operational',
          business_unit: data.business_unit || '',
          lifecycle_stage: data.lifecycle_stage || 'growth',
        }));
      } else {
        console.log('⚠️ داده‌های STEP 2 در localStorage یافت نشد');
      }
    } catch (error) {
      console.error('❌ Error loading step2 data:', error);
    }
  };

  const fetchAssetMethod = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📥 دریافت اطلاعات دارایی برای assetId:', assetId);
      
      const { data: assetData } = await api.get(`/intangible/screened-assets/${assetId}/`);
      setAssetDetails(assetData);
      
      console.log('📥 داده دارایی کامل:', assetData);
      console.log('📥 valuation_method از دیتابیس:', assetData.valuation_method);
      
      let detectedMethod = assetData.valuation_method;
      
      if (detectedMethod) {
        console.log(`✅ روش از دیتابیس: ${detectedMethod}`);
      } else if (propMethodId) {
        detectedMethod = propMethodId;
        console.log(`⚠️ روش از prop: ${detectedMethod}`);
      } else {
        detectedMethod = 'M-03';
        console.log(`⚠️ روش پیش‌فرض: ${detectedMethod}`);
      }
      
      console.log('✅ روش نهایی:', detectedMethod);
      setMethodId(detectedMethod);
      prevMethodIdRef.current = detectedMethod;
      
      if (valuationCaseId) {
        try {
          const { data } = await api.get(`/intangible/valuation-step3/?valuation_case=${valuationCaseId}`);
          const items = data.results || data || [];
          
          if (items.length > 0) {
            const step3 = items[0];
            setStep3Id(step3.id);
            
            const allowedFields = METHOD_FIELDS[detectedMethod] || [];
            const savedInputs = step3.method_inputs || {};
            const filteredInputs: any = {};
            
            if (savedInputs.tax_rate) filteredInputs.tax_rate = savedInputs.tax_rate;
            if (savedInputs.discount_rate) filteredInputs.discount_rate = savedInputs.discount_rate;
            if (savedInputs.forecast_horizon) filteredInputs.forecast_horizon = savedInputs.forecast_horizon;
            if (savedInputs.terminal_growth_rate) filteredInputs.terminal_growth_rate = savedInputs.terminal_growth_rate;
            if (savedInputs.current_revenue) filteredInputs.current_revenue = savedInputs.current_revenue;
            if (savedInputs.useful_life) filteredInputs.useful_life = savedInputs.useful_life;
            if (savedInputs.currency) filteredInputs.currency = savedInputs.currency;
            if (savedInputs.source_reliability) filteredInputs.source_reliability = savedInputs.source_reliability;
            if (savedInputs.category) filteredInputs.category = savedInputs.category;
            if (savedInputs.business_unit) filteredInputs.business_unit = savedInputs.business_unit;
            if (savedInputs.lifecycle_stage) filteredInputs.lifecycle_stage = savedInputs.lifecycle_stage;
            
            allowedFields.forEach(field => {
              if (savedInputs[field] !== undefined) {
                filteredInputs[field] = savedInputs[field];
              }
            });
            
            setFormData((prev: any) => ({ ...prev, ...filteredInputs }));
          }
        } catch (e) {
          console.error('Error loading step3 data:', e);
        }
      }
      
    } catch (error: any) {
      console.error('❌ Error fetching asset:', error);
      
      if (propMethodId) {
        setMethodId(propMethodId);
        setError(null);
      } else {
        setError(error.message || 'خطا در دریافت اطلاعات');
        setMethodId('M-03');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (): Promise<void> => {
    try {
      setSaving(true);
      
      const payload = {
        valuation_case: valuationCaseId,
        method_id: methodId,
        method_inputs: formData,
      };
      
      let response;
      if (step3Id) {
        response = await api.put(`/intangible/valuation-step3/${step3Id}/`, payload);
      } else {
        response = await api.post('/intangible/valuation-step3/', payload);
        setStep3Id(response.data.id);
      }
      
      if (onSave) onSave(response.data);
      
    } catch (error) {
      console.error('Error saving step3:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleValidate = async (): Promise<void> => {
    if (!step3Id) {
      await handleSave();
    }
    
    try {
      setValidating(true);
      const response = await api.post(`/intangible/valuation-step3/${step3Id}/validate_step/`);
      setValidationResult(response.data);
    } catch (error) {
      console.error('Error validating step3:', error);
    } finally {
      setValidating(false);
    }
  };

  const handleFormChange = (data: any): void => {
    const allowedFields = METHOD_FIELDS[methodId] || [];
    
    const filteredData: any = {};
    Object.keys(data).forEach(key => {
      if (allowedFields.includes(key) || 
          ['tax_rate', 'discount_rate', 'forecast_horizon', 'terminal_growth_rate', 
           'current_revenue', 'useful_life', 'currency', 'source_reliability', 
           'category', 'business_unit', 'lifecycle_stage'].includes(key)) {
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