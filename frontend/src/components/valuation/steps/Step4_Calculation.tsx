'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import api from '@/lib/api';

import { M04_WWM_Engine } from '../engines/M04_WWM_Engine';
import { M05_RCM_Engine } from '../engines/M05_RCM_Engine';
import { M06_RPCM_Engine } from '../engines/M06_RPCM_Engine';

interface Step4Props {
  onNext: () => void;
  onPrev: () => void;
  valuationCaseId?: number;
  methodId?: string;
  assetId?: number;
}

type CalculationStatus = 'idle' | 'calculating' | 'calculated' | 'outdated';

export function Step4_Calculation({ 
  onNext, 
  onPrev, 
  valuationCaseId: propValuationCaseId,
  methodId: propMethodId = 'M-06',
  assetId
}: Step4Props) {
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [step4Data, setStep4Data] = useState<any>(null);
  const [step4Id, setStep4Id] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [valuationCaseId, setValuationCaseId] = useState<number | null>(null);
  const [actualMethodId, setActualMethodId] = useState<string | null>(null);
  const [status, setStatus] = useState<CalculationStatus>('idle');
  const [step3UpdatedAt, setStep3UpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    if (assetId) {
      fetchValuationCase();
    } else if (propValuationCaseId) {
      setValuationCaseId(propValuationCaseId);
    }
  }, [assetId, propValuationCaseId]);

  useEffect(() => {
    if (valuationCaseId) {
      loadStep4Data();
    } else {
      setLoading(false);
    }
  }, [valuationCaseId]);

  // ============================================
  // 🔥 چک کردن STEP 3 برای تشخیص تغییرات
  // ============================================
  const checkStep3Version = async () => {
    try {
      console.log('🔍 چک کردن STEP 3 برای تغییرات...');
      
      const { data } = await api.get(`/intangible/valuation-step3/?valuation_case=${valuationCaseId}`);
      const items = data.results || data || [];
      
      if (items.length > 0) {
        const step3 = items[0];
        const currentUpdatedAt = step3.updated_at || step3.id;
        
        console.log('📊 STEP 3 updated_at:', currentUpdatedAt);
        console.log('📊 STEP 4 updated_at:', step4Data?.updated_at || step4Data?.id);
        console.log('📊 step3UpdatedAt state:', step3UpdatedAt);
        
        // اگه STEP 4 وجود داره و محاسبه شده
        if (step4Data && step4Data.step4_status === 'CALCULATED') {
          const step4Version = step4Data.updated_at || step4Data.id;
          
          // اگه STEP 3 جدیدتر از STEP 4 هست و با state هماهنگ نیست
          if (currentUpdatedAt !== step4Version && currentUpdatedAt !== step3UpdatedAt) {
            console.log('⚠️ STEP 3 تغییر کرده! وضعیت: outdated');
            setStatus('outdated');
          } else {
            console.log('✅ STEP 3 و STEP 4 هماهنگ هستن');
            setStatus('calculated');
          }
        }
        
        setStep3UpdatedAt(currentUpdatedAt);
      }
    } catch (error) {
      console.error('Error checking step3 version:', error);
    }
  };

  // ============================================
  // 🔥 وقتی STEP 4 بارگذاری میشه، STEP 3 رو چک کن
  // ============================================
  useEffect(() => {
    if (valuationCaseId && step4Data) {
      checkStep3Version();
    }
  }, [valuationCaseId, step4Data]);

  const fetchValuationCase = async () => {
    try {
      console.log('📥 دریافت ValuationCase برای assetId:', assetId);
      
      const { data } = await api.get(`/intangible/valuation-cases/?asset=${assetId}`);
      const items = data.results || data || [];
      
      if (items.length > 0) {
        const caseItem = items[0];
        setValuationCaseId(caseItem.id);
        console.log('✅ ValuationCase پیدا شد:', caseItem.id);
      } else {
        console.log('ℹ️ ValuationCase وجود ندارد، ایجاد می‌کنیم...');
        const response = await api.post('/intangible/valuation-cases/', {
          asset: assetId,
          category: 'operational',
          business_unit: 'واحد مرکزی',
          status: 'draft',
        });
        setValuationCaseId(response.data.id);
        console.log('✅ ValuationCase جدید ایجاد شد:', response.data.id);
      }
    } catch (error) {
      console.error('❌ Error fetching valuation case:', error);
      setError('خطا در دریافت مورد ارزش‌گذاری');
      setLoading(false);
    }
  };

  const loadStep4Data = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`📥 بارگذاری STEP 4 برای valuationCaseId: ${valuationCaseId}`);
      
      const { data } = await api.get(`/intangible/valuation-step4/?valuation_case=${valuationCaseId}`);
      const items = data.results || data || [];
      
      console.log('📥 پاسخ API (STEP 4):', items);
      
      if (items.length > 0) {
        const step4 = items[0];
        setStep4Id(step4.id);
        setStep4Data(step4);
        setActualMethodId(step4.method_id);
        
        if (step4.step4_status === 'CALCULATED') {
          setStatus('calculated');
          // چک کن outdated هست یا نه
          await checkStep3Version();
        } else {
          setStatus('idle');
        }
        
        console.log('✅ STEP 4 پیدا شد - status:', step4.step4_status);
      } else {
        console.log('ℹ️ STEP 4 وجود ندارد');
        setStatus('idle');
        setStep4Data(null);
      }
    } catch (error: any) {
      console.error('❌ Error loading step4:', error);
      setError(error.message || 'خطا در بارگذاری داده‌ها');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // 🔥 تابع محاسبه
  // ============================================
  const handleCalculate = async () => {
    if (!valuationCaseId) {
      setError('شناسه مورد ارزش‌گذاری یافت نشد');
      return;
    }
    
    try {
      setCalculating(true);
      setStatus('calculating');
      setError(null);
      
      // STEP 4 قدیمی رو حذف کن
      if (step4Id) {
        console.log(`🗑️ حذف STEP 4 قدیمی با ID: ${step4Id}`);
        try {
          await api.delete(`/intangible/valuation-step4/${step4Id}/`);
        } catch (e) {
          console.log('⚠️ STEP 4 قدیمی وجود ندارد');
        }
      }
      
      // STEP 4 جدید بساز
      console.log('📥 ایجاد STEP 4 جدید...');
      const createRes = await api.post('/intangible/valuation-step4/', {
        valuation_case: valuationCaseId,
        method_id: finalMethodId || propMethodId || 'M-03',
      });
      const newStep4Id = createRes.data.id;
      setStep4Id(newStep4Id);
      console.log('✅ STEP 4 جدید ایجاد شد با ID:', newStep4Id);
      
      // محاسبه رو اجرا کن
      console.log(`📥 اجرای محاسبه برای STEP 4 ID: ${newStep4Id}`);
      const response = await api.post(`/intangible/valuation-step4/${newStep4Id}/calculate/`);
      setStep4Data(response.data);
      setActualMethodId(response.data.method_id);
      
      // 🔥 مهم: بعد از محاسبه، step3UpdatedAt رو با مقدار جدید به‌روز کن
      const step3Check = await api.get(`/intangible/valuation-step3/?valuation_case=${valuationCaseId}`);
      const step3Items = step3Check.data.results || step3Check.data || [];
      if (step3Items.length > 0) {
        const step3 = step3Items[0];
        setStep3UpdatedAt(step3.updated_at || step3.id);
        console.log('✅ step3UpdatedAt به‌روز شد:', step3UpdatedAt);
      }
      
      setStatus('calculated');
      console.log('✅ محاسبه انجام شد');
      
    } catch (error: any) {
      console.error('❌ Error calculating:', error);
      setError(error.response?.data?.error || 'خطا در محاسبه');
      setStatus('idle');
    } finally {
      setCalculating(false);
    }
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      'M-04': 'WWM - روش با و بدون',
      'M-05': 'RCM - روش هزینه جایگزینی',
      'M-06': 'RPCM - روش هزینه بازتولید',
    };
    return labels[method] || method;
  };

  const finalMethodId = actualMethodId || propMethodId || 'M-03';

  const renderEngine = () => {
    const commonProps = {
      data: step4Data?.calculation_details,
      finalValue: step4Data?.final_value,
      confidenceLevel: step4Data?.confidence_level,
      qcScore: step4Data?.qc_score,
      onCalculate: handleCalculate,
      calculating,
      error,
    };

    switch (finalMethodId) {
      case 'M-04':
        return <M04_WWM_Engine {...commonProps} />;
      case 'M-05':
        return <M05_RCM_Engine {...commonProps} />;
      case 'M-06':
        return <M06_RPCM_Engine {...commonProps} />;
      default:
        return (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg">روش {finalMethodId} پشتیبانی نمی‌شود</p>
          </div>
        );
    }
  };

  // ============================================
  // 🔥 رندر بر اساس status
  // ============================================
  const renderContent = () => {
    if (status === 'idle') {
      return (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-bold text-dark-green mb-2">شروع ارزش‌گذاری</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            برای محاسبه ارزش دارایی، دکمه زیر را بزنید.
          </p>
          <Button
            onClick={handleCalculate}
            disabled={calculating}
            className="mt-6 bg-dark-green hover:bg-dark-green/90 text-white px-8 py-3 text-lg"
          >
            {calculating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin ml-2" />
                در حال محاسبه...
              </>
            ) : (
              'شروع ارزش‌گذاری 🚀'
            )}
          </Button>
          {error && (
            <p className="mt-4 text-sm text-red-500">{error}</p>
          )}
        </div>
      );
    }

    if (status === 'calculating') {
      return (
        <div className="text-center py-16">
          <Loader2 className="w-12 h-12 animate-spin text-dark-green mx-auto" />
          <p className="text-gray-500 mt-4">در حال محاسبه ارزش دارایی...</p>
        </div>
      );
    }

    if (status === 'outdated') {
      return (
        <div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">داده‌های STEP 3 تغییر کرده است!</p>
              <p className="text-sm text-amber-700">
                برای مشاهده محاسبه با داده‌های جدید، دکمه "بروزرسانی محاسبه" را بزنید.
              </p>
            </div>
          </div>
          
          {renderEngine()}
          
          <div className="flex justify-center mt-4">
            <Button
              onClick={handleCalculate}
              disabled={calculating}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {calculating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  در حال بروزرسانی...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 ml-2" />
                  بروزرسانی محاسبه
                </>
              )}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <>
        {renderEngine()}
      </>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-dark-green" />
        <span className="text-gray-500">در حال بارگذاری...</span>
      </div>
    );
  }

  if (!valuationCaseId) {
    return (
      <div className="text-center py-12 text-amber-600">
        <p className="text-lg font-medium">مورد ارزش‌گذاری یافت نشد</p>
        <Button 
          className="mt-4 bg-dark-green hover:bg-dark-green/90"
          onClick={() => window.location.reload()}
        >
          تلاش مجدد
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span className="w-7 h-7 rounded-full bg-dark-green text-white flex items-center justify-center text-xs font-bold">۴</span>
        <span>مرحله ۴ از ۷</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-dark-green">موتور محاسبه</h2>
          <p className="text-sm text-gray-500">
            روش: <span className="font-medium text-dark-green">{finalMethodId} - {getMethodLabel(finalMethodId)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {status === 'calculated' && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
              ✅ محاسبه شده
            </span>
          )}
          {status === 'outdated' && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 flex items-center gap-1">
              ⚠️ نیاز به بروزرسانی
            </span>
          )}
        </div>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          {renderContent()}
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onPrev} className="flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" />
          قبلی
        </Button>
        <Button
          className="bg-dark-green hover:bg-dark-green/90 flex items-center gap-1"
          onClick={onNext}
          disabled={status !== 'calculated'}
        >
          ادامه
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}