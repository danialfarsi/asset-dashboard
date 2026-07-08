'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import { fetchAllValuations } from '@/lib/api-utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/ui/page-transition';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';
import { ValuationStepper } from '@/components/valuation/ValuationStepper';
import { Step1_SelectAsset } from '@/components/valuation/steps/Step1_SelectAsset';
import { Step2_InputData } from '@/components/valuation/steps/Step2_InputData';
import { Step3_Parameters } from '@/components/valuation/steps/Step3_Parameters';
import { Step4_Calculation } from '@/components/valuation/steps/Step4_Calculation';
import { Step5_QualityControl } from '@/components/valuation/steps/Step5_QualityControl';
import { Step6_Sensitivity } from '@/components/valuation/steps/Step6_Sensitivity';
import { Step7_Report } from '@/components/valuation/steps/Step7_Report';
import { ArrowLeft, Save } from 'lucide-react';

interface Asset {
  id: number;
  asset_name: string;
  asset_uid: string;
  asset_type?: { id: number; code: string; name: string };
  description: string;
  created_at: string;
  created_by_name?: string;
}

interface ValuationMethod {
  id: string;
  name: string;
  description: string;
  recommended: boolean;
}

interface ValuationData {
  id: number;
  final_score: number;
  weighted_score: number;
  strategic_score: number;
  technical_score: number;
  operational_score: number;
  market_score: number;
  risk_score: number;
  status: string;
  answered_questions: number;
  total_questions: number;
}

const STEPS = [
  { id: 1, label: 'انتخاب دارایی\nو روش' },
  { id: 2, label: 'داده پایه' },
  { id: 3, label: 'پارامترهای\nاختصاصی' },
  { id: 4, label: 'موتور\nمحاسبه' },
  { id: 5, label: 'کنترل کیفیت\n(QC)' },
  { id: 6, label: 'حساسیت/\nسناریو' },
  { id: 7, label: 'گزارش و تایید\nنهایی' },
];

const VALUATION_METHODS: ValuationMethod[] = [
  { id: 'M-01', name: 'روش بازار (Market Approach)', description: 'مقایسه با معاملات مشابه', recommended: false },
  { id: 'M-02', name: 'روش درآمد (Income Approach)', description: 'تنزیل جریان نقدی', recommended: false },
  { id: 'M-03', name: 'روش هزینه جایگزینی (Replacement Cost)', description: 'هزینه بازسازی دارایی معادل', recommended: true },
  { id: 'M-04', name: 'روش هزینه بازتولید (Reproduction Cost)', description: 'هزینه بازتولید دقیق دارایی', recommended: false },
  { id: 'M-05', name: 'روش چندگانه (Multi-Period Excess Earnings)', description: 'سود مازاد چنددوره‌ای', recommended: false },
];

export default function ValuationPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string>('M-03');
  const [isMethodConfirmed, setIsMethodConfirmed] = useState(false);
  const [valuationData, setValuationData] = useState<ValuationData | null>(null);
  const [valuationCaseId, setValuationCaseId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    assetId: '',
    name: '',
    description: '',
    developmentStage: '',
    initialRelease: '',
    usefulLife: '',
    jurisdiction: '',
    associatedCosts: '',
    stakeholders: '',
  });

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const allValuations = await fetchAllValuations('completed');
      
      const assetPromises = allValuations.map(async (val: any) => {
        try {
          const { data } = await api.get(`/intangible/screened-assets/${val.asset}/`);
          return {
            id: data.id,
            asset_name: data.asset_name,
            asset_uid: data.asset_uid,
            asset_type: data.asset_type,
            description: data.description || '',
            created_at: data.created_at,
            created_by_name: data.created_by_name || 'نامشخص',
            valuation_method: data.valuation_method,
          };
        } catch {
          return null;
        }
      });
      
      const results = await Promise.all(assetPromises);
      const validAssets = results.filter((a): a is Asset => a !== null);
      setAssets(validAssets);
      
      if (validAssets.length > 0) {
        setSelectedAsset(validAssets[0]);
        setFormData(prev => ({
          ...prev,
          assetId: validAssets[0].asset_uid,
          name: validAssets[0].asset_name,
          description: validAssets[0].description || '',
        }));
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssetSelect = async (assetId: string) => {
    const asset = assets.find(a => a.asset_uid === assetId);
    if (asset) {
      setSelectedAsset(asset);
      setFormData(prev => ({
        ...prev,
        assetId: asset.asset_uid,
        name: asset.asset_name,
        description: asset.description || '',
      }));
      
      try {
        const allValuations = await fetchAllValuations('completed');
        const assetValuations = allValuations.filter((v: any) => v.asset === asset.id);
        if (assetValuations.length > 0) {
          const latest = assetValuations.sort((a: any, b: any) => 
            new Date(b.evaluated_at).getTime() - new Date(a.evaluated_at).getTime()
          )[0];
          
          const { data: summary } = await api.get(`/intangible/asset-valuations/${latest.id}/summary/`);
          setValuationData({
            id: latest.id,
            final_score: summary.final_score || 0,
            weighted_score: summary.weighted_score || summary.final_score || 0,
            strategic_score: summary.strategic_score || 0,
            technical_score: summary.technical_score || 0,
            operational_score: summary.operational_score || 0,
            market_score: summary.market_score || 0,
            risk_score: summary.risk_score || 0,
            status: latest.status,
            answered_questions: summary.answered_questions || 0,
            total_questions: summary.total_questions || 23,
          });
        } else {
          setValuationData(null);
        }
      } catch (error) {
        console.error('Error fetching valuation data:', error);
        setValuationData(null);
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= STEPS.length) {
      setCurrentStep(step);
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepComplete = (step: number): boolean => {
    if (step === 1) return !!selectedAsset;
    if (step === 2) {
      return !!formData.name && !!formData.description && !!formData.developmentStage;
    }
    if (step === 3) return isMethodConfirmed;
    return true;
  };

  if (loading) {
    return (
      <div className="p-6">
        <SkeletonLoader variant="list" count={6} />
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1_SelectAsset
            assets={assets}
            selectedAsset={selectedAsset}
            selectedMethod={selectedMethod}
            onAssetSelect={handleAssetSelect}
            onMethodSelect={setSelectedMethod}
            onNext={nextStep}
            methods={VALUATION_METHODS}
          />
        );
      case 2:
        return (
          <Step2_InputData
            formData={formData}
            onInputChange={handleInputChange}
            onNext={nextStep}
            onPrev={prevStep}
            selectedAsset={selectedAsset}
            valuationData={valuationData}
            assetId={selectedAsset?.id}
          />
        );
      case 3:
        return (
          <Step3_Parameters
            assetId={selectedAsset?.id}  // 🔥 اضافه شد
            valuationCaseId={valuationCaseId}  // 🔥 اضافه شد
            onNext={nextStep}
            onPrev={prevStep}
            onSave={(data) => console.log('Saved:', data)}
          />
        );
      case 4:
        return (
          <Step4_Calculation
            onNext={nextStep}
            onPrev={prevStep}
            formData={formData}
            selectedMethod={selectedMethod}
            methods={VALUATION_METHODS}
          />
        );
      case 5:
        return (
          <Step5_QualityControl
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 6:
        return (
          <Step6_Sensitivity
            onNext={nextStep}
            onPrev={prevStep}
          />
        );
      case 7:
        return (
          <Step7_Report
            onPrev={prevStep}
            selectedMethod={selectedMethod}
            methods={VALUATION_METHODS}
            formData={formData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <PageTransition className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* هدر */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-dark-green">ارزش‌گذاری دارایی</h1>
            <p className="text-sm text-gray-500">ارزش‌گذاری مالی دارایی‌های نامشهود</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Save className="w-4 h-4" />
            ذخیره پیش‌نویس
          </Button>
        </div>
      </div>

      {/* استپر */}
      <ValuationStepper
        steps={STEPS}
        currentStep={currentStep}
        onStepClick={goToStep}
        isStepComplete={isStepComplete}
      />

      {/* محتوای مرحله */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          {renderStep()}
        </CardContent>
      </Card>
    </PageTransition>
  );
}
