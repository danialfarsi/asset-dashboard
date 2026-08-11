'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/ui/page-transition';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Download,
  Printer,
  Award,
  TrendingUp,
  Shield,
  Calendar,
  User,
  Building2,
  DollarSign,
  Percent,
  Database,
  FileCheck,
  Lock
} from 'lucide-react';

interface AssetDetail {
  id: number;
  asset_name: string;
  asset_uid: string;
  description: string;
  category: string;
  result: string;
  created_at: string;
  created_by_name: string;
  organization_name: string;
  department_name: string;
  valuation_case_id: number;
  valuation_method: string;
  final_value: number;
  confidence_level: number;
  qc_score: number;
  certificate_no: string;
  effective_date: string;
  next_revaluation_date: string;
  case_status: string;
  is_registered: boolean;
  method_specific_data: any;
  assumptions: any[];
  linked_assets: any[];
  evidence_tags: any;
}

export default function RegisteredAssetDetailPage() {
  const router = useRouter();
  const params = useParams();
  const assetId = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (assetId) {
      fetchAssetDetail();
    }
  }, [assetId]);

  const fetchAssetDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const assetIdNum = parseInt(assetId);
      if (isNaN(assetIdNum)) {
        setError('شناسه نامعتبر');
        setLoading(false);
        return;
      }

      // ۱. دریافت اطلاعات دارایی
      const { data: assetData } = await api.get(`/intangible/screened-assets/${assetIdNum}/`);
      
      // ۲. دریافت ValuationCase
      const { data: casesData } = await api.get(`/intangible/valuation-cases/?asset=${assetIdNum}`);
      const cases = casesData.results || casesData || [];
      const valuationCase = cases[0];
      if (!valuationCase) {
        setError('مورد ارزش‌گذاری یافت نشد');
        setLoading(false);
        return;
      }

      // ۳. دریافت STEP 3
      let methodSpecificData = {};
      try {
        const { data: step3Data } = await api.get(
          `/intangible/valuation-step3/?valuation_case=${valuationCase.id}`
        );
        const step3Items = step3Data.results || step3Data || [];
        if (step3Items.length > 0) {
          methodSpecificData = step3Items[0].method_inputs || {};
        }
      } catch (e) {
        console.error('Error fetching step3:', e);
      }

      // ۴. دریافت STEP 4
      let finalValue = 0;
      let confidenceLevel = 0;
      let qcScore = 0;
      try {
        const { data: step4Data } = await api.get(
          `/intangible/valuation-step4/?valuation_case=${valuationCase.id}`
        );
        const step4Items = step4Data.results || step4Data || [];
        if (step4Items.length > 0) {
          finalValue = step4Items[0].final_value || 0;
          confidenceLevel = step4Items[0].confidence_level || 0;
          qcScore = step4Items[0].qc_score || 0;
        }
      } catch (e) {
        console.error('Error fetching step4:', e);
      }

      // ۵. دریافت فرضیات
      let assumptions = [];
      try {
        const { data: assumptionsData } = await api.get(
          `/intangible/valuation-cases/${valuationCase.id}/assumptions/`
        );
        assumptions = assumptionsData.results || assumptionsData || [];
      } catch (e) {
        console.error('Error fetching assumptions:', e);
      }

      // ۶. دریافت وابستگی‌ها
      let linkedAssets = [];
      try {
        const { data: linkedData } = await api.get(
          `/intangible/valuation-cases/${valuationCase.id}/linked_assets/`
        );
        linkedAssets = linkedData.results || linkedData || [];
      } catch (e) {
        console.error('Error fetching linked assets:', e);
      }

      const isRegistered = valuationCase.case_status === 'REGISTERED' || 
                          valuationCase.certificate_no !== undefined;

      setAsset({
        id: assetData.id,
        asset_name: assetData.asset_name,
        asset_uid: assetData.asset_uid,
        description: assetData.description || '',
        category: assetData.category || 'unknown',
        result: assetData.result || 'confirmed',
        created_at: assetData.created_at,
        created_by_name: assetData.created_by_name || 'نامشخص',
        organization_name: assetData.organization_name || 'نامشخص',
        department_name: assetData.department_name || 'نامشخص',
        valuation_case_id: valuationCase.id,
        valuation_method: assetData.valuation_method || valuationCase.method_id || 'M-01',
        final_value: finalValue,
        confidence_level: confidenceLevel,
        qc_score: qcScore,
        certificate_no: valuationCase.certificate_no || `VAL-${String(valuationCase.id).padStart(5, '0')}`,
        effective_date: valuationCase.effective_date || valuationCase.updated_at || assetData.created_at,
        next_revaluation_date: valuationCase.next_revaluation_date || '',
        case_status: valuationCase.case_status || (isRegistered ? 'REGISTERED' : 'COMPLETED'),
        is_registered: isRegistered,
        method_specific_data: methodSpecificData,
        assumptions: assumptions,
        linked_assets: linkedAssets,
        evidence_tags: valuationCase.evidence_tags || {},
      });

    } catch (error) {
      console.error('Error fetching asset detail:', error);
      setError('خطا در بارگذاری اطلاعات دارایی');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch { return dateString; }
  };

  const formatCurrency = (value: number) => {
    if (!value) return '۰';
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    return Math.round(value).toLocaleString().replace(/\d/g, (d) => persianDigits[parseInt(d)]);
  };

  const formatPercent = (value: number) => {
    if (!value) return '۰%';
    return Math.round(value * 100) + '%';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'REGISTERED') {
      return <Badge className="bg-green-100 text-green-700 border-green-300 text-sm px-3 py-1">✅ ثبت شده</Badge>;
    }
    if (status === 'COMPLETED') {
      return <Badge className="bg-blue-100 text-blue-700 border-blue-300 text-sm px-3 py-1">📋 تکمیل شده</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 text-sm px-3 py-1">⏳ {status}</Badge>;
  };

  if (loading) {
    return (
      <div className="p-6">
        <SkeletonLoader variant="list" count={8} />
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-500">{error || 'دارایی یافت نشد'}</p>
        <Button className="mt-4" onClick={() => router.back()}>
          بازگشت
        </Button>
      </div>
    );
  }

  return (
    <PageTransition className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* هدر */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-dark-green">{asset.asset_name}</h1>
            <p className="text-sm text-gray-500">{asset.asset_uid}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(asset.case_status)}
        </div>
      </div>

      {/* کارت خلاصه */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-dark-green to-medium-green text-white">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm opacity-70">ارزش نهایی</p>
              <p className="text-3xl font-bold">{formatCurrency(asset.final_value)}</p>
              <p className="text-xs opacity-50">ریال</p>
            </div>
            <div className="text-center">
              <p className="text-sm opacity-70">سطح اطمینان</p>
              <p className="text-3xl font-bold">{formatPercent(asset.confidence_level)}</p>
              <p className="text-xs opacity-50">امتیاز QC: {asset.qc_score}</p>
            </div>
            <div className="text-center">
              <p className="text-sm opacity-70">روش ارزش‌گذاری</p>
              <p className="text-2xl font-bold">{asset.valuation_method}</p>
              <p className="text-xs opacity-50">شماره گواهی: {asset.certificate_no}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* اطلاعات دارایی */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-dark-green mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              اطلاعات پایه
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">شناسه:</span>
                <span className="font-mono">{asset.asset_uid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">دسته‌بندی:</span>
                <span>{asset.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">سازمان:</span>
                <span>{asset.organization_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">دپارتمان:</span>
                <span>{asset.department_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">تاریخ ایجاد:</span>
                <span>{formatDate(asset.created_at)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-dark-green mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              تاریخ‌های کلیدی
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">تاریخ اجرا:</span>
                <span>{formatDate(asset.effective_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">بازنگری بعدی:</span>
                <span>{formatDate(asset.next_revaluation_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">شماره گواهی:</span>
                <span className="font-mono">{asset.certificate_no}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">وضعیت:</span>
                <span>{asset.is_registered ? '✅ ثبت شده' : '📋 تکمیل شده'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* پارامترهای اختصاصی */}
      {Object.keys(asset.method_specific_data).length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-dark-green mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              پارامترهای اختصاصی روش {asset.valuation_method}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(asset.method_specific_data).map(([key, value]) => (
                <div key={key} className="p-2 bg-gray-50 rounded-lg border">
                  <p className="text-[10px] text-gray-400">{key}</p>
                  <p className="text-sm font-medium">{String(value)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* فرضیات */}
      {asset.assumptions.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-dark-green mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              فرضیات
            </h3>
            <div className="space-y-2">
              {asset.assumptions.map((assumption: any, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded-lg border text-sm">
                  {assumption.assumption_text || assumption.text}
                  {assumption.critical && (
                    <Badge className="mr-2 bg-red-100 text-red-700">⭐ حیاتی</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* دکمه‌ها */}
      <div className="flex flex-wrap justify-between gap-4 pt-4 border-t">
        <Button variant="outline" onClick={() => router.back()} className="flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          بازگشت
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-1" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />
            چاپ
          </Button>
          <Link href={`/dashboard/intangible/valuation/view/${asset.id}`}>
            <Button className="bg-dark-green hover:bg-dark-green/90 flex items-center gap-1">
              <Eye className="w-4 h-4" />
              مشاهده کامل ارزش‌گذاری
            </Button>
          </Link>
        </div>
      </div>
    </PageTransition>
  );
}
