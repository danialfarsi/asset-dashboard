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
  valuation_method?: string;
}

interface ValuationMethod {
  id: string;
  name: string;
  description: string;
  recommended: boolean;
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
  { id: 'M-01', name: 'RfR - Relief from Royalty', description: 'روش رهایی از حق امتیاز', recommended: false },
  { id: 'M-02', name: 'MEEM - Multi-Period Excess Earnings', description: 'روش سود مازاد چنددوره‌ای', recommended: false },
  { id: 'M-03', name: 'DCF - Discounted Cash Flow', description: 'روش تنزیل جریان نقدی', recommended: true },
  { id: 'M-04', name: 'WWM - With-and-Without Method', description: 'روش با و بدون دارایی', recommended: false },
  { id: 'M-05', name: 'RCM - Replacement Cost Method', description: 'روش هزینه جایگزینی', recommended: false },
  { id: 'M-06', name: 'RPCM - Reproduction Cost Method', description: 'روش هزینه بازتولید', recommended: false },
  { id: 'M-07', name: 'TWC - Trained Workforce Cost', description: 'روش هزینه نیروی کار آموزش‌دیده', recommended: false },
  { id: 'M-08', name: 'CTM - Comparable Transactions Method', description: 'روش معاملات مشابه', recommended: false },
  { id: 'M-09', name: 'MMM - Market Multiple Method', description: 'روش ضریب بازار', recommended: false },
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
  const [valuationData, setValuationData] = useState<any>(null);
  const [valuationCaseId, setValuationCaseId] = useState<number | undefined>(undefined);
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
      const validAssets: Asset[] = results
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .map((item) => ({
          id: item.id,
          asset_name: item.asset_name,
          asset_uid: item.asset_uid,
          asset_type: item.asset_type,
          description: item.description,
          created_at: item.created_at,
          created_by_name: item.created_by_name,
          valuation_method: item.valuation_method,
        }));
      
      setAssets(validAssets);
      
      if (validAssets.length > 0) {
        const firstAsset = validAssets[0];
        setSelectedAsset(firstAsset);
        setFormData(prev => ({
          ...prev,
          assetId: firstAsset.asset_uid,
          name: firstAsset.asset_name,
          description: firstAsset.description || '',
        }));
        
        if (firstAsset.valuation_method) {
          setSelectedMethod(firstAsset.valuation_method);
          console.log('✅ روش دارایی (از دیتابیس):', firstAsset.valuation_method);
        }
        await createValuationCase(firstAsset.id);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const createValuationCase = async (assetId: number) => {
    try {
      const { data } = await api.get(`/intangible/valuation-cases/?asset=${assetId}`);
      const items = data.results || data || [];
      
      if (items.length > 0) {
        setValuationCaseId(items[0].id);
        console.log('✅ ValuationCase موجود:', items[0].id);
      } else {
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
      console.error('Error creating valuation case:', error);
    }
  };

  const handleAssetSelect = async (assetId: string) => {
    const asset = assets.find(a => a.asset_uid === assetId);
    if (asset) {
      console.log('🔍 دارایی انتخاب شد:', asset);
      console.log('🔍 روش دارایی (valuation_method):', asset.valuation_method);
      
      setSelectedAsset(asset);
      setFormData(prev => ({
        ...prev,
        assetId: asset.asset_uid,
        name: asset.asset_name,
        description: asset.description || '',
      }));
      
      if (asset.valuation_method) {
        setSelectedMethod(asset.valuation_method);
        console.log('✅ روش دارایی انتخاب شد:', asset.valuation_method);
      } else {
        console.log('⚠️ دارایی روش ندارد، استفاده از پیش‌فرض M-03');
        setSelectedMethod('M-03');
      }
      
      await createValuationCase(asset.id);
      
      try {
        const allValuations = await fetchAllValuations('completed');
        const assetValuations = allValuations.filter((v: any) => v.asset === asset.id);
        if (assetValuations.length > 0) {
          const latest = assetValuations.sort((a: any, b: any) => 
            new Date(b.evaluated_at).getTime() - new Date(a.evaluated_at).getTime()
          )[0];
          
          const { data: summary } = await api.get(`/intangible/asset-valuations/${latest.id}/summary/`);
          setValuationData(summary);
        } else {
          setValuationData(null);
        }
      } catch (error) {
        console.error('Error fetching valuation data:', error);
        setValuationData(null);
      }
    } else {
      console.error('❌ دارایی با این شناسه پیدا نشد:', assetId);
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
            valuationMethod={selectedMethod}
            valuationCaseId={valuationCaseId}  // 🔥 این خط رو اضافه کن
          />
        );
      case 3:
        return (
          <Step3_Parameters
            assetId={selectedAsset?.id}
            valuationCaseId={valuationCaseId}
            onNext={nextStep}
            onPrev={prevStep}
            methodId={selectedAsset?.valuation_method || selectedMethod || 'M-03'}
          />
        );
      case 4:
        return (
          <Step4_Calculation
            valuationCaseId={valuationCaseId}
            methodId={selectedAsset?.valuation_method || selectedMethod || 'M-03'}
            assetId={selectedAsset?.id}
            onNext={nextStep}
            onPrev={prevStep}
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

      <ValuationStepper
        steps={STEPS}
        currentStep={currentStep}
        onStepClick={goToStep}
        isStepComplete={isStepComplete}
      />

      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          {renderStep()}
        </CardContent>
      </Card>
    </PageTransition>
  );
}