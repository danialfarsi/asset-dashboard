'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2, Copy, CheckCircle } from 'lucide-react';
import { DiscoveryStepper } from './DiscoveryStepper';
import { Step0_AssetInfo } from './steps/Step0_AssetInfo';
import { Step1_NonPhysical } from './steps/Step1_NonPhysical';
import { Step2_Identifiability } from './steps/Step2_Identifiability';
import { Step3_Controllability } from './steps/Step3_Controllability';
import { Step4_ValueCreation } from './steps/Step4_ValueCreation';
import { ResultPage } from './ResultPage';
import { DISCOVERY_STEPS, DiscoveryAnswers, DiscoveryResult } from '@/types/discovery.types';
import api from '@/lib/api';

interface DiscoveryWizardProps {
  assetId?: number;
  onComplete?: (result: DiscoveryResult) => void;
}

interface SuggestionResult {
  best_template: {
    id: number;
    name: string;
    organization_type: string;
    category: string;
    valuation_method: string;
    total_score: number;
    max_score: number;
    match_percentage: number;
    asset_type_id?: number;
  };
  errors: Array<{
    category: string;
    title: string;
    errors: Array<{
      key: string;
      description: string;
      expected: boolean;
      user_value: boolean;
      is_critical: boolean;
    }>;
  }>;
  summary: {
    type: string;
    message: string;
    suggestions: string[];
    alternative_message: string | null;
  };
  alternative?: {
    id: number;
    name: string;
    organization_type: string;
    category: string;
    valuation_method: string;
    match_percentage: number;
    asset_type_id?: number;
  };
}

export function DiscoveryWizard({ assetId, onComplete }: DiscoveryWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [assetData, setAssetData] = useState({
    asset_name: '',
    category: '',
    description: '',
    organization_type: 'manufacturing',
  });
  const [answers, setAnswers] = useState<DiscoveryAnswers>({
    n1: false, n2: false, n3: false, n4: false, n5: false, n6: false,
    i1: false, i2: false, i3: false, i4: false, i5: false, i6: false, i7: false,
    c1: false, c2: false, c3: false, c4: false, c5: false, c6: false, c7: false,
    v1: false, v2: false, v3: false, v4: false, v5: false, v6: false, v7: false, v8: false, v9: false,
  });
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [suggestion, setSuggestion] = useState<SuggestionResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isGettingSuggestion, setIsGettingSuggestion] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [selectedTemplateName, setSelectedTemplateName] = useState<string | null>(null);
  const [selectedAssetTypeId, setSelectedAssetTypeId] = useState<number | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isResultReady, setIsResultReady] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);  // ← اضافه شد

  useEffect(() => {
    if (assetId) {
      loadAssetData(assetId);
    }
  }, [assetId]);

  const loadAssetData = async (id: number) => {
    try {
      const { data } = await api.get(`/intangible/screened-assets/${id}/`);
      setAssetData({
        asset_name: data.asset_name || '',
        category: data.category || '',
        description: data.description || '',
        organization_type: data.organization_type || 'manufacturing',
      });
      setGeneratedCode(data.asset_uid);
    } catch (error) {
      console.error('Error loading asset:', error);
    }
  };

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
    }
  };

  const calculateResult = (): DiscoveryResult => {
    const nValues = [answers.n1, answers.n2, answers.n3, answers.n4, answers.n5, answers.n6];
    const nScore = nValues.filter(Boolean).length;
    const nStatus = nScore >= 2 ? 'PASS' : 'FAIL';

    const iStatus = (answers.i1 || answers.i2 || answers.i4) ? 'PASS' : 'FAIL';
    const iValues = [answers.i1, answers.i2, answers.i3, answers.i4, answers.i5, answers.i6, answers.i7];
    const iScore = iValues.filter(Boolean).length;

    const cStrong = [answers.c1, answers.c2, answers.c3, answers.c4, answers.c5];
    const cStatus = cStrong.some(Boolean) ? 'PASS' : (answers.c6 ? 'CONDITIONAL' : 'FAIL');
    const cValues = [answers.c1, answers.c2, answers.c3, answers.c4, answers.c5, answers.c6, answers.c7];
    const cScore = cValues.filter(Boolean).length;

    const vValues = [answers.v1, answers.v2, answers.v3, answers.v4, answers.v5, answers.v6, answers.v7, answers.v8, answers.v9];
    const vScore = vValues.filter(Boolean).length;
    const vStatus = vScore >= 1 ? 'PASS' : 'FAIL';

    let status: 'CONFIRMED' | 'CONDITIONAL' | 'REJECTED' = 'REJECTED';
    if (nStatus === 'PASS' && iStatus === 'PASS' && vStatus === 'PASS') {
      if (cStatus === 'PASS') {
        status = 'CONFIRMED';
      } else if (cStatus === 'CONDITIONAL') {
        status = 'CONDITIONAL';
      }
    }

    const nDetails = nValues.map((v, i) => v ? `N${i + 1}` : '').filter(Boolean);
    const iDetails = iValues.map((v, i) => v ? `I${i + 1}` : '').filter(Boolean);
    const cDetails = cValues.map((v, i) => v ? `C${i + 1}` : '').filter(Boolean);
    const vDetails = vValues.map((v, i) => v ? `V${i + 1}` : '').filter(Boolean);

    const recommendations: string[] = [];
    if (nStatus !== 'PASS') recommendations.push('دارایی ماهیت فیزیکی دارد یا غیرفیزیکی بودن آن اثبات نشده است');
    if (iStatus !== 'PASS') recommendations.push('دارایی فاقد معیار تفکیک‌پذیری یا پشتوانه قانونی است');
    if (cStatus === 'CONDITIONAL') recommendations.push('کنترل دارایی صرفاً موقعیتی است - نیاز به رسمی‌سازی قراردادی');
    if (cStatus === 'FAIL') recommendations.push('دارایی فاقد هرگونه مکانیزم کنترل است');
    if (vStatus !== 'PASS') recommendations.push('دارایی فاقد توجیه اقتصادی و ارزش‌آفرینی است');

    return {
      status,
      n_status: nStatus,
      i_status: iStatus,
      c_status: cStatus,
      v_status: vStatus,
      n_score: nScore,
      i_score: iScore,
      c_score: cScore,
      v_score: vScore,
      n_total: 6,
      i_total: 7,
      c_total: 7,
      v_total: 9,
      n_details: nDetails,
      i_details: iDetails,
      c_details: cDetails,
      v_details: vDetails,
      missing_requirements: recommendations,
      recommendations,
    };
  };

  const getSuggestion = async () => {
    setIsGettingSuggestion(true);
    try {
      const answersForApi: Record<string, boolean> = {};
      Object.entries(answers).forEach(([key, value]) => {
        answersForApi[key.toUpperCase()] = value;
      });

      const response = await api.post('/intangible/suggest-template/', {
        asset_name: assetData.asset_name,
        organization_type: assetData.organization_type,
        answers: answersForApi
      });
      
      setSuggestion(response.data);
      setShowSuggestion(true);
      if (response.data.best_template) {
        setSelectedTemplateId(response.data.best_template.id);
        setSelectedTemplateName(response.data.best_template.name);
        if (response.data.best_template.asset_type_id) {
          setSelectedAssetTypeId(response.data.best_template.asset_type_id);
        }
      }
    } catch (error) {
      console.error('Error getting suggestion:', error);
    } finally {
      setIsGettingSuggestion(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 5) {
      setIsCalculating(true);
      setTimeout(() => {
        const calculated = calculateResult();
        setResult(calculated);
        setIsResultReady(true);
        setIsCalculating(false);
        getSuggestion();
        if (onComplete) onComplete(calculated);
        setCurrentStep(6);
      }, 500);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
    }
  };

  const isStepComplete = (step: number): boolean => {
    return step < currentStep;
  };

  const isStepActive = (step: number): boolean => {
    return step === currentStep;
  };

  const handleFinalRegister = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const assetResponse = await api.post('/intangible/discovery-assets/', {
        asset_name: assetData.asset_name,
        category: assetData.category || 'strategic_economic',
        organization_type: assetData.organization_type,
        description: assetData.description || `کشف شده از موتور شناسایی: ${assetData.asset_name}`,
      });
      
      const assetId = assetResponse.data.id;
      const assetUid = assetResponse.data.asset_uid;
      setGeneratedCode(assetUid);
      
      const answersForApi: Record<string, boolean> = {};
      Object.entries(answers).forEach(([key, value]) => {
        answersForApi[key.toLowerCase()] = value;
      });
      
      await api.post('/intangible/discovery/', {
        asset: assetId,
        ...answersForApi
      });
      
      if (selectedTemplateId && suggestion) {
        let assetTypeId = selectedAssetTypeId;
        
        if (!assetTypeId) {
          try {
            const templateRes = await api.get(`/intangible/screening-templates/${selectedTemplateId}/`);
            if (templateRes.data?.asset_type?.id) {
              assetTypeId = templateRes.data.asset_type.id;
            }
          } catch (e) {
            console.warn('Could not fetch template:', e);
          }
        }
        
        if (!assetTypeId) {
          try {
            const searchRes = await api.get('/intangible/asset-types/', {
              params: { search: suggestion.best_template.name }
            });
            if (searchRes.data?.results?.length > 0) {
              assetTypeId = searchRes.data.results[0].id;
            }
          } catch (e) {
            console.warn('Could not search asset types:', e);
          }
        }
        
        const updateData: any = {
          result: result?.status === 'CONFIRMED' ? 'confirmed' : 'conditional',
          valuation_method: suggestion.best_template?.valuation_method || null,
        };
        
        if (assetTypeId) {
          updateData.asset_type = assetTypeId;
        }
        
        await api.patch(`/intangible/screened-assets/${assetId}/`, updateData);
      }
      
      setShowSuccess(true);
      setIsRegistered(true);  // ← اضافه شد
      
    } catch (error: any) {
      console.error('Error registering asset:', error);
      setError(error?.response?.data?.detail || 'خطا در ثبت دارایی');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEdit = () => {
    setShowSuggestion(false);
    setCurrentStep(5);
  };

  const handleSelectAlternative = () => {
    if (suggestion?.alternative) {
      setSelectedTemplateId(suggestion.alternative.id);
      setSelectedTemplateName(suggestion.alternative.name);
      if (suggestion.alternative.asset_type_id) {
        setSelectedAssetTypeId(suggestion.alternative.asset_type_id);
      }
    }
  };

  const renderStep = () => {
    if (currentStep === 6) {
      if (isResultReady && result) {
        return (
          <div className="space-y-6">
            <ResultPage 
              result={result} 
              answers={answers} 
              assetData={assetData} 
              generatedCode={generatedCode || undefined}
              suggestion={suggestion}
              onRegister={handleFinalRegister}
              onSelectAlternative={handleSelectAlternative}
              onBack={handleBackToEdit}
              loading={loading}
              error={error}
              selectedTemplateName={selectedTemplateName}
              isRegistered={isRegistered}  // ← اضافه شد
            />
          </div>
        );
      }
      
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-10 h-10 animate-spin text-dark-green" />
          <p className="mt-4 text-gray-500">در حال آماده‌سازی نتیجه...</p>
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <Step0_AssetInfo
            assetData={assetData}
            setAssetData={setAssetData}
            onNext={handleNext}
          />
        );
      case 2:
        return <Step1_NonPhysical answers={answers} setAnswers={setAnswers} />;
      case 3:
        return <Step2_Identifiability answers={answers} setAnswers={setAnswers} />;
      case 4:
        return <Step3_Controllability answers={answers} setAnswers={setAnswers} />;
      case 5:
        return <Step4_ValueCreation answers={answers} setAnswers={setAnswers} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-dark-green" />
        <span className="mr-3 text-gray-500">در حال ثبت دارایی...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {currentStep > 1 && assetData.asset_name && (
        <div className="bg-dark-green/5 p-4 rounded-lg border border-dark-green/20 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-dark-green/10 rounded-lg">
              <span className="text-lg">📦</span>
            </div>
            <div>
              <p className="text-sm font-medium text-dark-green">{assetData.asset_name}</p>
              <p className="text-xs text-gray-500">
                {assetData.category || 'بدون دسته‌بندی'}
                {assetData.description && ` • ${assetData.description.slice(0, 50)}${assetData.description.length > 50 ? '...' : ''}`}
              </p>
            </div>
          </div>
        </div>
      )}

      <DiscoveryStepper
        steps={DISCOVERY_STEPS}
        currentStep={currentStep}
        onStepClick={handleStepClick}
        isStepComplete={isStepComplete}
        isStepActive={isStepActive}
      />

      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          {isCalculating || isGettingSuggestion ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 animate-spin text-dark-green" />
              <p className="mt-4 text-gray-500">
                {isCalculating ? 'در حال محاسبه نتیجه...' : 'در حال پیدا کردن بهترین قالب...'}
              </p>
            </div>
          ) : (
            renderStep()
          )}
        </CardContent>
      </Card>

      {currentStep < 6 && currentStep > 1 && (
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrev}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            قبلی
          </Button>
          <Button
            className="bg-dark-green hover:bg-dark-green/90 flex items-center gap-1"
            onClick={handleNext}
          >
            {currentStep === 5 ? (
              'مشاهده نتیجه نهایی'
            ) : (
              <>
                ادامه
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}