'use client';

import { useState, useEffect } from 'react';
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

export function Step3_Parameters({ 
  onNext, 
  onPrev, 
  valuationCaseId,
  assetId,
  methodId: propMethodId,
  onSave
}: Step3Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [step3Id, setStep3Id] = useState<number | null>(null);
  const [methodId, setMethodId] = useState<string>(propMethodId || 'M-03');
  const [assetDetails, setAssetDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (assetId) {
      fetchAssetMethod();
    } else {
      setLoading(false);
      if (propMethodId) {
        setMethodId(propMethodId);
      }
    }
  }, [assetId, propMethodId]);

  const fetchAssetMethod = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📥 دریافت اطلاعات دارایی برای assetId:', assetId);
      
      // دریافت اطلاعات دارایی
      const { data: assetData } = await api.get(`/intangible/screened-assets/${assetId}/`);
      setAssetDetails(assetData);
      
      console.log('📥 داده دارایی کامل:', assetData);
      console.log('📥 valuation_method از دیتابیس:', assetData.valuation_method);
      
      // 🔥 اولویت شماره ۱: استفاده از valuation_method از دیتابیس
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
      
      // بارگذاری داده‌های STEP 3
      if (valuationCaseId) {
        try {
          const { data } = await api.get(`/intangible/valuation-step3/?valuation_case=${valuationCaseId}`);
          const items = data.results || data || [];
          
          if (items.length > 0) {
            const step3 = items[0];
            setStep3Id(step3.id);
            setFormData(step3.method_inputs || {});
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

  const handleSave = async () => {
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

  const handleValidate = async () => {
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

  const handleFormChange = (data: any) => {
    setFormData(prev => ({ ...prev, ...data }));
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

      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <PanelComponent
            formData={formData}
            onChange={handleFormChange}
            assetId={assetId}
            valuationCaseId={valuationCaseId}
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
