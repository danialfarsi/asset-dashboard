'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageTransition } from '@/components/ui/page-transition';
import { DiscoveryWizard } from '@/components/discovery/DiscoveryWizard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, AlertCircle, XCircle, Info, ArrowRight } from 'lucide-react';
import api from '@/lib/api';

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
  };
}

function DiscoveryWizardContent() {
  const searchParams = useSearchParams();
  const assetId = searchParams.get('assetId') ? Number(searchParams.get('assetId')) : undefined;
  
  const [result, setResult] = useState<SuggestionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

  const handleComplete = async (assetName: string, answers: Record<string, boolean>, organizationType: string) => {
    setLoading(true);
    try {
      const response = await api.post('/intangible/suggest-template/', {
        asset_name: assetName,
        organization_type: organizationType,
        answers: answers
      });
      setResult(response.data);
      if (response.data.best_template) {
        setSelectedTemplateId(response.data.best_template.id);
      }
    } catch (error) {
      console.error('Error getting suggestion:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterWithTemplate = async () => {
    if (!selectedTemplateId) return;
    // اینجا منطق ثبت دارایی با قالب انتخاب شده
    console.log('ثبت دارایی با قالب:', selectedTemplateId);
  };

  return (
    <PageTransition className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dark-green">موتور شناسایی دارایی نامشهود</h1>
          <p className="text-sm text-gray-500 mt-1">
            ارزیابی دارایی بر اساس ۴ شرط اصلی (غیرفیزیکی بودن، شناسایی‌پذیری، کنترل منافع، ارزش‌آفرینی)
          </p>
        </div>
      </div>

      <DiscoveryWizard 
        assetId={assetId} 
        onComplete={handleComplete}
        showSuggestions={!!result}
        loading={loading}
      />

      {/* نمایش پیشنهادات */}
      {result && !loading && (
        <div className="mt-8 space-y-6">
          {/* بهترین قالب */}
          <Card className="p-6 border-2 border-green-200 bg-green-50">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <h3 className="text-lg font-bold text-green-800">بهترین تطابق</h3>
                </div>
                <p className="text-2xl font-bold text-green-900 mt-2">
                  {result.best_template.name}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-green-700">
                  <span className="bg-green-200 px-3 py-1 rounded-full">
                    تطابق: {result.best_template.match_percentage}%
                  </span>
                  <span className="bg-green-200 px-3 py-1 rounded-full">
                    روش: {result.best_template.valuation_method || 'نامشخص'}
                  </span>
                  <span className="bg-green-200 px-3 py-1 rounded-full">
                    امتیاز: {result.best_template.total_score}/{result.best_template.max_score}
                  </span>
                </div>
              </div>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={handleRegisterWithTemplate}
              >
                ثبت با این قالب
                <ArrowRight className="w-4 h-4 mr-2" />
              </Button>
            </div>
          </Card>

          {/* خطاها و پیشنهادات */}
          {result.errors.length > 0 && (
            <Card className="p-6 border-2 border-yellow-200 bg-yellow-50">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-bold text-yellow-800">
                    {result.summary.message}
                  </h4>
                  <ul className="mt-3 space-y-2">
                    {result.errors.map((errorGroup) => (
                      errorGroup.errors.map((err) => (
                        <li key={err.key} className="flex items-start gap-2 text-sm">
                          {err.is_critical ? (
                            <XCircle className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
                          ) : (
                            <Info className="w-4 h-4 text-yellow-600 mt-1 flex-shrink-0" />
                          )}
                          <span className="text-yellow-800">
                            {err.description}
                            {err.is_critical && (
                              <span className="text-red-500 mr-2">(ضروری)</span>
                            )}
                            {err.expected === 1 && !err.user_value && (
                              <span className="text-red-500 mr-2">- باید "بله" باشد</span>
                            )}
                            {err.expected === 0 && err.user_value && (
                              <span className="text-red-500 mr-2">- باید "خیر" باشد</span>
                            )}
                          </span>
                        </li>
                      ))
                    ))}
                  </ul>
                  {result.summary.alternative_message && (
                    <p className="mt-3 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                      💡 {result.summary.alternative_message}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* قالب جایگزین */}
          {result.alternative && (
            <Card className="p-6 border-2 border-blue-200 bg-blue-50">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Info className="w-6 h-6 text-blue-600" />
                    <h4 className="font-bold text-blue-800">گزینه جایگزین</h4>
                  </div>
                  <p className="text-lg font-semibold text-blue-900 mt-2">
                    {result.alternative.name}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-blue-700">
                    <span className="bg-blue-200 px-3 py-1 rounded-full">
                      تطابق: {result.alternative.match_percentage}%
                    </span>
                    <span className="bg-blue-200 px-3 py-1 rounded-full">
                      روش: {result.alternative.valuation_method || 'نامشخص'}
                    </span>
                  </div>
                </div>
                <Button 
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  onClick={() => setSelectedTemplateId(result.alternative!.id)}
                >
                  انتخاب این قالب
                </Button>
              </div>
            </Card>
          )}

          {/* دکمه‌های پایین */}
          <div className="flex gap-4 pt-4 border-t">
            <Button 
              className="bg-primary hover:bg-primary-dark"
              onClick={handleRegisterWithTemplate}
              disabled={!selectedTemplateId}
            >
              ثبت نهایی دارایی
            </Button>
            <Button 
              variant="outline"
              onClick={() => setResult(null)}
            >
              بازگشت و ویرایش
            </Button>
          </div>
        </div>
      )}
    </PageTransition>
  );
}

export default function DiscoveryWizardPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-gray-500">در حال بارگذاری...</div>}>
      <DiscoveryWizardContent />
    </Suspense>
  );
}