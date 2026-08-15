'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import { fetchAllValuations } from '@/lib/api-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';
import { PageTransition } from '@/components/ui/page-transition';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import AssetRadarChart from '@/components/charts/RadarChart';
import { AssetEvidence } from '@/components/asset/AssetEvidence';
import { ValuationHistory } from '@/components/asset/ValuationHistory';
import { RadarChartSkeleton } from '@/components/charts/RadarChartSkeleton';
import { ValuationHistorySkeleton } from '@/components/asset/ValuationHistorySkeleton';
import { SimpleGraphVisualization } from '@/components/graph/SimpleGraphVisualization';

import * as XLSX from 'xlsx';
import {
  ArrowLeft,
  User,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Trash2,
  TrendingUp,
  Upload,
  File,
  Download,
  X,
  FolderOpen,
  Award,
  DollarSign,
  Shield,
  FileText,
  FileCheck,
  Printer
} from 'lucide-react';

// تبدیل اعداد به فارسی
const toPersianNumber = (num: number | string): string => {
  if (num === undefined || num === null) return '۰';
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  const str = String(num);
  return str.replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};

const formatCurrency = (value: number) => {
  if (!value) return '۰';
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  const formatted = Math.round(value).toLocaleString();
  return formatted.replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};

// محاسبه تک توکن
const calculateTokenValue = (valueInRial: number): number => {
  if (!valueInRial) return 0;
  const TOKEN_VALUE_IN_RIAL = 1000000;
  return Math.round(valueInRial / TOKEN_VALUE_IN_RIAL);
};

interface AssetDetail {
  id: number;
  asset_name: string;
  asset_uid: string;
  category: string;
  result: string;
  description: string;
  notes: string;
  version: string;
  discovery_date: string;
  created_at: string;
  updated_at: string;
  created_by_name: string;
  organization_name: string;
  department_name: string;
  created_by: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
  };
  asset_type?: {
    id: number;
    code: string;
    name: string;
  };
  valuation_method?: string;
}

interface AssetFile {
  id: number;
  asset: number;
  file_type: string;
  file_type_label: string;
  title: string;
  file: string;
  description: string;
  uploaded_by_name: string;
  uploaded_at: string;
}

interface ValuationData {
  id: number;
  final_score: number;
  strategic_score: number;
  technical_score: number;
  operational_score: number;
  market_score: number;
  risk_score: number;
  status: string;
  answered_questions: number;
  total_questions: number;
}

interface ValuationFromAPI {
  id: number;
  asset: number;
  status: string;
  final_score: number;
  answers?: any[];
}

interface ValuationFinancialData {
  final_value: number;
  token_value?: number;
  confidence_level: number;
  qc_score: number;
  method_id: string;
  step4_status: string;
  calculation_details?: any;
  effective_date?: string;
}

interface QCData {
  id: number;
  completeness_score: number;
  total_rules: number;
  passed: number;
  warnings: number;
  errors: number;
  decision: string;
}

interface SensitivityData {
  id: number;
  base_value: number;
  min_value: number;
  max_value: number;
  confidence_level: number;
  critical_drivers: any[];
}

const FILE_TYPES = [
  { value: 'interview', label: '📄 مصاحبه' },
  { value: 'document', label: '📄 سند' },
  { value: 'process', label: '📄 فرآیند' },
  { value: 'database', label: '📄 پایگاه داده' },
  { value: 'rd_project', label: '📄 پروژه R&D' },
];

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [files, setFiles] = useState<AssetFile[]>([]);
  const [valuation, setValuation] = useState<ValuationData | null>(null);
  const [financialData, setFinancialData] = useState<ValuationFinancialData | null>(null);
  const [qcData, setQCData] = useState<QCData | null>(null);
  const [sensitivityData, setSensitivityData] = useState<SensitivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  const [valuationCaseId, setValuationCaseId] = useState<number | null>(null);
  const [reportsGenerated, setReportsGenerated] = useState({
    executive_summary: false,
    full_report: false,
    value_certificate: false,
  });

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    file_type: 'interview',
    title: '',
    description: '',
    file: null as File | null,
  });

  const assetId = params.id as string;
  const isOrgUser = user?.role === 'org_user';

  const canDelete = () => {
    if (!asset || !user) return false;
    if (user.role === 'super_admin') return true;
    if (user.role === 'org_admin') {
      return asset.organization_name === user.organization_name;
    }
    if (user.role === 'org_user') {
      return asset.created_by?.id === user.id;
    }
    return false;
  };

  useEffect(() => {
    if (assetId) {
      fetchData();
    }
  }, [assetId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsDataReady(false);
      
      console.log(`📥 دریافت داده‌های دارایی ID: ${assetId}`);
      
      const assetIdNum = parseInt(assetId);
      
      const assetRes = await api.get(`/intangible/screened-assets/${assetId}/`);
      const assetData = assetRes.data;
      setAsset(assetData);
      console.log('✅ Asset Data:', assetData);
      
      try {
        setLoadingFiles(true);
        const filesRes = await api.get(`/intangible/asset-files/?asset=${assetId}`);
        const filesData = filesRes.data.results || filesRes.data || [];
        setFiles(filesData);
        console.log(`✅ ${filesData.length} فایل از دیتابیس دریافت شد`);
      } catch (error) {
        console.error('Error fetching files:', error);
        setFiles([]);
      } finally {
        setLoadingFiles(false);
      }
      
      const casesRes = await api.get(`/intangible/valuation-cases/?asset=${assetId}`);
      const cases = casesRes.data.results || casesRes.data || [];
      const valuationCase = cases.length > 0 ? cases[0] : null;
      
      if (valuationCase) {
        setValuationCaseId(valuationCase.id);
        console.log('✅ ValuationCase ID:', valuationCase.id);
        
        try {
          const step4Res = await api.get(`/intangible/valuation-step4/?valuation_case=${valuationCase.id}`);
          const step4Items = step4Res.data.results || step4Res.data || [];
          if (step4Items.length > 0) {
            const step4 = step4Items[0];
            setFinancialData({
              final_value: step4.final_value || 0,
              token_value: step4.token_value || calculateTokenValue(step4.final_value || 0),
              confidence_level: step4.confidence_level || 0,
              qc_score: step4.qc_score || 0,
              method_id: step4.method_id || assetData.valuation_method || 'M-01',
              step4_status: step4.step4_status || 'DRAFT',
              calculation_details: step4.calculation_details || {},
              effective_date: step4.updated_at || step4.created_at || valuationCase.updated_at || assetData.created_at,
            });
            console.log('✅ STEP 4 Data:', step4);
          }
        } catch (e) {
          console.error('Error fetching STEP 4:', e);
        }
        
        try {
          const qcRes = await api.get(`/intangible/valuation-qc/?valuation_case=${valuationCase.id}`);
          const qcItems = qcRes.data.results || qcRes.data || [];
          if (qcItems.length > 0) {
            const qc = qcItems[0];
            setQCData({
              id: qc.id,
              completeness_score: qc.completeness_score || 0,
              total_rules: qc.total_rules || 0,
              passed: qc.passed || 0,
              warnings: qc.warnings || 0,
              errors: qc.errors || 0,
              decision: qc.decision || 'PENDING',
            });
            console.log('✅ QC Data:', qc);
          }
        } catch (e) {
          console.error('Error fetching QC:', e);
        }
        
        try {
          const sensRes = await api.get(`/intangible/sensitivity/?valuation_case=${valuationCase.id}`);
          const sensItems = sensRes.data.results || sensRes.data || [];
          if (sensItems.length > 0) {
            const sens = sensItems[0];
            setSensitivityData({
              id: sens.id,
              base_value: sens.base_value || 0,
              min_value: sens.min_value || 0,
              max_value: sens.max_value || 0,
              confidence_level: sens.confidence_level || 0,
              critical_drivers: sens.critical_drivers || [],
            });
            console.log('✅ Sensitivity Data:', sens);
          }
        } catch (e) {
          console.error('Error fetching Sensitivity:', e);
        }
      }
      
      try {
        const allValuations = await fetchAllValuations();
        const valuations = allValuations as ValuationFromAPI[];
        const assetValuations = valuations.filter((v: ValuationFromAPI) => v.asset === assetIdNum);
        
        if (assetValuations.length > 0) {
          const completed = assetValuations.find((v: ValuationFromAPI) => v.status === 'completed');
          const targetValuation = completed || assetValuations[assetValuations.length - 1];
          
          if (targetValuation) {
            const { data: summary } = await api.get(`/intangible/asset-valuations/${targetValuation.id}/summary/`);
            setValuation({
              id: targetValuation.id,
              final_score: summary.final_score || 0,
              strategic_score: summary.strategic_score || 0,
              technical_score: summary.technical_score || 0,
              operational_score: summary.operational_score || 0,
              market_score: summary.market_score || 0,
              risk_score: summary.risk_score || 0,
              status: targetValuation.status,
              answered_questions: summary.answered_questions || 0,
              total_questions: summary.total_questions || 23,
            });
            console.log('✅ Valuation Summary:', summary);
          }
        }
      } catch (e) {
        console.error('Error fetching valuation summary:', e);
      }
      
      setIsDataReady(true);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.response?.data?.detail || 'خطا در دریافت اطلاعات');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // تولید گزارش Excel
  // ============================================
  const generateExcelReport = (type: 'executive_summary' | 'full_report' | 'value_certificate') => {
    if (!financialData || !asset) {
      alert('داده‌های ارزش‌گذاری موجود نیست');
      return;
    }

    try {
      const tokenValue = financialData.token_value || calculateTokenValue(financialData.final_value);
      const fileName = `${type}_${asset.asset_uid}_${new Date().toISOString().split('T')[0]}`;
      
      const rows: any[][] = [
        ['META Platform - Valuation Engine'],
        [''],
        ['گزارش ارزش‌گذاری'],
        [''],
        ['شناسه دارایی:', asset.asset_uid],
        ['نام دارایی:', asset.asset_name],
        ['روش:', financialData.method_id],
        ['سازمان:', asset.organization_name || 'نامشخص'],
        ['تاریخ:', new Date().toLocaleDateString('fa-IR')],
        [''],
        ['خلاصه ارزش‌گذاری'],
        ['ارزش نهایی (ریال):', formatCurrency(financialData.final_value)],
        ['ارزش بر حسب تک توکن:', formatCurrency(tokenValue)],
        ['سطح اطمینان:', toPersianNumber(Math.round(financialData.confidence_level * 100)) + '%'],
        ['امتیاز کیفیت:', toPersianNumber(financialData.qc_score)],
        [''],
        ['شماره گواهی:', `VAL-${String(valuationCaseId).padStart(5, '0')}`],
        ['تاریخ اجرا:', new Date().toLocaleDateString('fa-IR')],
        ['تاریخ بازنگری بعدی:', new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString('fa-IR')],
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [{ wch: 30 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Valuation_Report');
      XLSX.writeFile(wb, `${fileName}.xlsx`);

      setReportsGenerated((prev) => ({ ...prev, [type]: true }));
      console.log(`✅ ${type} report generated successfully`);
    } catch (error) {
      console.error('Error generating Excel report:', error);
      alert('خطا در تولید گزارش. لطفاً دوباره تلاش کنید.');
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file) {
      alert('لطفاً یک فایل انتخاب کنید');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('asset', assetId);
    formData.append('file_type', uploadForm.file_type);
    formData.append('title', uploadForm.title || uploadForm.file.name);
    formData.append('file', uploadForm.file);
    if (uploadForm.description) {
      formData.append('description', uploadForm.description);
    }

    try {
      await api.post('/intangible/asset-files/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const { data } = await api.get(`/intangible/asset-files/?asset=${assetId}`);
      setFiles(data.results || data || []);
      
      setShowUploadForm(false);
      setUploadForm({ file_type: 'interview', title: '', description: '', file: null });
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('خطا در آپلود فایل');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!confirm('آیا از حذف این فایل مطمئن هستید؟')) return;
    try {
      await api.delete(`/intangible/asset-files/${fileId}/`);
      const { data } = await api.get(`/intangible/asset-files/?asset=${assetId}`);
      setFiles(data.results || data || []);
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('خطا در حذف فایل');
    }
  };

  const handleDeleteClick = () => {
    if (!canDelete()) {
      alert('شما اجازه حذف این دارایی را ندارید');
      return;
    }
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/intangible/screened-assets/${assetId}/`);
      router.push('/dashboard/intangible/assets');
    } catch (error: any) {
      console.error('Error deleting asset:', error);
      alert(error.response?.data?.detail || 'خطا در حذف دارایی');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const getResultBadge = (result: string) => {
    const config = {
      confirmed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'تأیید شده' },
      conditional: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'مشروط' },
      rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'رد شده' },
    };
    const c = config[result as keyof typeof config] || config.confirmed;
    const Icon = c.icon;
    return (
      <span className={`${c.bg} ${c.color} px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 font-[family-name:var(--font-vazir)]`}>
        <Icon className="w-4 h-4" />
        {c.label}
      </span>
    );
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      strategic_economic: 'استراتژیک - اقتصادی',
      strategic_social: 'استراتژیک - اجتماعی',
      strategic_knowledge: 'استراتژیک - دانشی',
      strategic_cultural: 'استراتژیک - فرهنگی',
      strategic_environmental: 'استراتژیک - زیست‌محیطی',
      operational_economic: 'عملیاتی - اقتصادی',
      operational_social: 'عملیاتی - اجتماعی',
      operational_knowledge: 'عملیاتی - دانشی',
      operational_cultural: 'عملیاتی - فرهنگی',
      operational_environmental: 'عملیاتی - زیست‌محیطی',
      support_economic: 'پشتیبان - اقتصادی',
      support_social: 'پشتیبان - اجتماعی',
      support_knowledge: 'پشتیبان - دانشی',
      support_cultural: 'پشتیبان - فرهنگی',
      support_environmental: 'پشتیبان - زیست‌محیطی',
    };
    return labels[category] || category;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch { return dateString; }
  };

  const getFileIcon = (fileType: string) => {
    const icons: Record<string, string> = {
      interview: '🎙️',
      document: '📄',
      process: '⚙️',
      database: '🗄️',
      rd_project: '🔬',
    };
    return icons[fileType] || '📎';
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      'M-01': 'RfR',
      'M-02': 'MEEM',
      'M-03': 'DCF',
      'M-04': 'WWM',
      'M-05': 'RCM',
      'M-06': 'RPCM',
      'M-07': 'TWC',
      'M-08': 'CTM',
      'M-09': 'MMM',
    };
    return labels[method] || method;
  };

  const canDeleteResult = canDelete();
  const isValuationCompleted = valuation?.status === 'completed';
  const hasFinancialData = financialData && financialData.final_value > 0;

  if (loading) {
    return (
      <div className="p-6">
        <SkeletonLoader variant="detail" />
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-500 text-lg mb-4">⚠️ {error || 'دارایی یافت نشد'}</div>
        <button onClick={() => router.back()} className="text-primary hover:underline">بازگشت</button>
      </div>
    );
  }

  return (
    <PageTransition className="p-6 space-y-6 max-w-6xl mx-auto font-[family-name:var(--font-vazir)]">
      {/* هدر */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-dark-green">{asset.asset_name}</h1>
            <p className="text-sm text-gray-500">{asset.asset_uid}</p>
            {asset.asset_type && (
              <p className="text-xs text-gray-400 mt-1">نوع: {asset.asset_type.name}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {getResultBadge(asset.result)}
          <Link href={`/dashboard/intangible/valuation/${assetId}`}>
            <Button className="bg-dark-green hover:bg-dark-green/90 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              {isValuationCompleted ? 'مشاهده ارزیابی' : 'ارزیابی کیفی دارایی'}
            </Button>
          </Link>
        </div>
      </div>

      {/* اطلاعات پایه */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">سازمان</p>
              <p className="text-sm font-medium">{asset.organization_name || 'نامشخص'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <User className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">ایجاد شده توسط</p>
              <p className="text-sm font-medium">{asset.created_by_name || 'نامشخص'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">تاریخ ایجاد</p>
              <p className="text-sm font-medium">{formatDate(asset.created_at)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">وضعیت ارزیابی</p>
              <p className="text-sm font-medium">
                {isValuationCompleted ? '✅ تکمیل شده' : '⏳ در انتظار'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================ */}
      {/* 🔥 بخش ارزش‌گذاری مالی (STEP 4) */}
      {/* ============================================ */}
      {hasFinancialData && (
        <Card className="border-2 border-dark-green/20 shadow-lg overflow-hidden">
          <div className="bg-dark-green px-5 py-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-white" />
              <h3 className="text-sm font-bold text-white">ارزش‌گذاری مالی</h3>
              <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                {financialData.method_id} - {getMethodLabel(financialData.method_id)}
              </span>
            </div>
          </div>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-xs text-gray-400">ارزش نهایی</p>
                <p className="text-2xl font-bold text-dark-green">
                  {formatCurrency(financialData.final_value)}
                </p>
                <p className="text-[10px] text-gray-400">ریال</p>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-xs text-gray-400">تک توکن</p>
                <p className="text-2xl font-bold text-amber-700">
                  {formatCurrency(financialData.token_value || calculateTokenValue(financialData.final_value))}
                </p>
                <p className="text-[10px] text-gray-400">تک توکن</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-xs text-gray-400">سطح اطمینان</p>
                <p className="text-2xl font-bold text-blue-700">
                  {toPersianNumber(Math.round(financialData.confidence_level * 100))}%
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                <p className="text-xs text-gray-400">امتیاز QC</p>
                <p className="text-2xl font-bold text-purple-700">
                  {toPersianNumber(financialData.qc_score)}
                </p>
              </div>
            </div>

            {sensitivityData && sensitivityData.min_value > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs text-gray-400 mb-2">محدوده ارزش (بر اساس تحلیل حساسیت)</p>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400">کمترین</p>
                    <p className="text-sm font-bold text-red-600">
                      {formatCurrency(sensitivityData.min_value)}
                    </p>
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="relative h-2 bg-gray-200 rounded-full">
                      <div 
                        className="absolute h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"
                        style={{ 
                          width: `${Math.min(100, ((sensitivityData.max_value - sensitivityData.min_value) / sensitivityData.base_value) * 100)}%`,
                          left: '10%'
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-gray-400">بیشترین</p>
                    <p className="text-sm font-bold text-green-600">
                      {formatCurrency(sensitivityData.max_value)}
                    </p>
                  </div>
                </div>
                <div className="text-center mt-1">
                  <span className="text-xs text-gray-400">
                    سطح اطمینان: {toPersianNumber(Math.round(sensitivityData.confidence_level * 100))}%
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ============================================ */}
      {/* 🔥 تولید گزارش - وسط چین */}
      {/* ============================================ */}
      {hasFinancialData && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-dark-green mb-3 text-center font-[family-name:var(--font-vazir)]">
              <FileText className="w-4 h-4 inline ml-1" />
              تولید گزارش
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button
                variant={reportsGenerated.executive_summary ? 'default' : 'outline'}
                className={`w-full justify-center font-[family-name:var(--font-vazir)] ${
                  reportsGenerated.executive_summary
                    ? 'bg-dark-green hover:bg-dark-green/90 text-white'
                    : ''
                }`}
                onClick={() => generateExcelReport('executive_summary')}
              >
                {reportsGenerated.executive_summary ? (
                  <CheckCircle className="w-4 h-4 ml-2" />
                ) : (
                  <FileText className="w-4 h-4 ml-2" />
                )}
                گزارش اجرایی
              </Button>
              <Button
                variant={reportsGenerated.full_report ? 'default' : 'outline'}
                className={`w-full justify-center font-[family-name:var(--font-vazir)] ${
                  reportsGenerated.full_report ? 'bg-dark-green hover:bg-dark-green/90 text-white' : ''
                }`}
                onClick={() => generateExcelReport('full_report')}
              >
                {reportsGenerated.full_report ? (
                  <CheckCircle className="w-4 h-4 ml-2" />
                ) : (
                  <FileText className="w-4 h-4 ml-2" />
                )}
                گزارش کامل ارزش‌گذاری
              </Button>
              <Button
                variant={reportsGenerated.value_certificate ? 'default' : 'outline'}
                className={`w-full justify-center font-[family-name:var(--font-vazir)] ${
                  reportsGenerated.value_certificate
                    ? 'bg-dark-green hover:bg-dark-green/90 text-white'
                    : ''
                }`}
                onClick={() => generateExcelReport('value_certificate')}
              >
                {reportsGenerated.value_certificate ? (
                  <CheckCircle className="w-4 h-4 ml-2" />
                ) : (
                  <FileCheck className="w-4 h-4 ml-2" />
                )}
                گواهی ارزش
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============================================ */}
      {/* 🔥 کنترل کیفیت (QC) */}
      {/* ============================================ */}
      {qcData && qcData.total_rules > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-dark-green mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              کنترل کیفیت (QC)
              <span className="text-xs bg-dark-green/10 text-dark-green px-2 py-0.5 rounded-full">
                {toPersianNumber(qcData.completeness_score)}%
              </span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="text-center p-2 bg-gray-50 rounded-lg border">
                <p className="text-[10px] text-gray-400">مجموع قوانین</p>
                <p className="text-lg font-bold text-dark-green">
                  {toPersianNumber(qcData.total_rules)}
                </p>
              </div>
              <div className="text-center p-2 bg-green-50 rounded-lg border border-green-200">
                <p className="text-[10px] text-gray-400">قبول</p>
                <p className="text-lg font-bold text-green-600">
                  {toPersianNumber(qcData.passed)}
                </p>
              </div>
              <div className="text-center p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-[10px] text-gray-400">هشدار</p>
                <p className="text-lg font-bold text-yellow-600">
                  {toPersianNumber(qcData.warnings)}
                </p>
              </div>
              <div className="text-center p-2 bg-red-50 rounded-lg border border-red-200">
                <p className="text-[10px] text-gray-400">خطا</p>
                <p className="text-lg font-bold text-red-600">
                  {toPersianNumber(qcData.errors)}
                </p>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-[10px] text-gray-400">تصمیم</p>
                <p className="text-sm font-bold text-blue-700">
                  {qcData.decision === 'APPROVE' ? '✅ تأیید' : 
                   qcData.decision === 'CONDITIONAL' ? '⚠️ مشروط' : 
                   qcData.decision === 'RETURN' ? '❌ بازگشت' : '⏳ در انتظار'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============================================ */}
      {/* 🔥 تحلیل حساسیت - متغیرهای کلیدی */}
      {/* ============================================ */}
      {sensitivityData && sensitivityData.critical_drivers && sensitivityData.critical_drivers.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-dark-green mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              متغیرهای کلیدی (تحلیل حساسیت)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {sensitivityData.critical_drivers.map((driver: any, index: number) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{driver.driver_name || driver.name}</p>
                    <span className="text-xs bg-dark-green/10 text-dark-green px-2 py-0.5 rounded-full">
                      {driver.impact_percent ? toPersianNumber(Math.round(driver.impact_percent)) + '%' : ''}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                    <span>{toPersianNumber(driver.low_range || driver.low)}</span>
                    <span className="text-dark-green font-medium">{toPersianNumber(driver.base_value || driver.base)}</span>
                    <span>{toPersianNumber(driver.high_range || driver.high)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* توضیحات */}
      {asset.description && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{asset.description}</p>
          </CardContent>
        </Card>
      )}

      {/* ============================================ */}
      {/* 🔥 نمودار رادار */}
      {/* ============================================ */}
      {isValuationCompleted && valuation ? (
        <AssetRadarChart
          data={{
            strategic: valuation.strategic_score || 0,
            technical: valuation.technical_score || 0,
            operational: valuation.operational_score || 0,
            market: valuation.market_score || 0,
            risk: valuation.risk_score || 0,
          }}
          assetName={asset.asset_name}
          maxValue={5}
          height={450}
        />
      ) : isValuationCompleted && !valuation ? (
        <RadarChartSkeleton />
      ) : null}

      {!isValuationCompleted && (
        <Card className="border-dashed border-2 border-gray-300 bg-gray-50">
          <CardContent className="p-8 text-center">
            <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">این دارایی هنوز ارزیابی نشده است</p>
            <Link href={`/dashboard/intangible/valuation/${assetId}`}>
              <Button className="mt-4 bg-dark-green hover:bg-dark-green/90">
                شروع ارزیابی
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* ============================================ */}
      {/* 🔥 شواهد ارزیابی - AssetEvidence */}
      {/* ============================================ */}
      {isValuationCompleted && valuation && (
        <AssetEvidence assetId={parseInt(assetId)} valuationId={valuation.id} />
      )}

      {/* ============================================ */}
      {/* 🔥 فایل‌های پیوست */}
      {/* ============================================ */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            فایل‌های پیوست
            {loadingFiles && <span className="text-sm text-gray-400">(در حال بارگذاری...)</span>}
            {!loadingFiles && files.length > 0 && (
              <span className="text-sm text-gray-400">({toPersianNumber(files.length)} فایل)</span>
            )}
            {!loadingFiles && files.length === 0 && (
              <span className="text-sm text-gray-400">(بدون فایل)</span>
            )}
          </CardTitle>
          {isOrgUser && (
            <Button size="sm" onClick={() => setShowUploadForm(!showUploadForm)}>
              <Upload className="w-4 h-4 ml-1" />
              آپلود فایل
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {showUploadForm && isOrgUser && (
            <form onSubmit={handleFileUpload} className="mb-6 p-4 border rounded-lg bg-gray-50 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">نوع فایل</label>
                  <select
                    value={uploadForm.file_type}
                    onChange={(e) => setUploadForm({ ...uploadForm, file_type: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    {FILE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">عنوان</label>
                  <input
                    type="text"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                    placeholder="عنوان فایل"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">توضیحات</label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  placeholder="توضیحات فایل"
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">انتخاب فایل</label>
                <input
                  type="file"
                  onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                  className="w-full"
                />
                {uploadForm.file && (
                  <p className="text-sm text-gray-500 mt-1">📎 {uploadForm.file.name}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={uploading}>
                  {uploading ? <LoadingSpinner size="sm" /> : 'آپلود'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowUploadForm(false)}>
                  لغو
                </Button>
              </div>
            </form>
          )}

          {loadingFiles ? (
            <div className="text-center py-4 text-gray-500">در حال بارگذاری فایل‌ها...</div>
          ) : files.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <File className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>هیچ فایلی برای این دارایی آپلود نشده است</p>
              {isOrgUser && (
                <p className="text-sm mt-2">برای آپلود فایل، روی دکمه "آپلود فایل" کلیک کنید</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getFileIcon(file.file_type)}</span>
                    <div>
                      <p className="font-medium">{file.title}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{file.file_type_label}</span>
                        <span>•</span>
                        <span>{formatDate(file.uploaded_at)}</span>
                        <span>•</span>
                        <span>آپلود توسط: {file.uploaded_by_name}</span>
                      </div>
                      {file.description && (
                        <p className="text-sm text-gray-600 mt-1">{file.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={file.file} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </a>
                    {isOrgUser && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteFile(file.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ============================================ */}
      {/* 🔥 تاریخچه ارزیابی */}
      {/* ============================================ */}
      {valuation ? (
        <ValuationHistory 
          assetId={parseInt(assetId)} 
          assetName={asset.asset_name}
        />
      ) : (
        <ValuationHistorySkeleton />
      )}
        <SimpleGraphVisualization 
  assetId={parseInt(assetId)} 
  assetName={asset?.asset_name || 'دارایی'}
  height={500}
/>
      {/* ============================================ */}
      {/* 🔥 زمان‌بندی با تاریخ ارزش‌گذاری */}
      {/* ============================================ */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-500 flex items-center gap-2 font-[family-name:var(--font-vazir)]">
            <Calendar className="w-4 h-4" /> زمان‌بندی
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm border-b pb-2 font-[family-name:var(--font-vazir)]">
            <span className="text-gray-500">تاریخ ایجاد</span>
            <span>{formatDate(asset.created_at)}</span>
          </div>
          {asset.updated_at && (
            <div className="flex justify-between text-sm border-b pb-2 font-[family-name:var(--font-vazir)]">
              <span className="text-gray-500">آخرین بروزرسانی</span>
              <span>{formatDate(asset.updated_at)}</span>
            </div>
          )}
          {asset.discovery_date && (
            <div className="flex justify-between text-sm border-b pb-2 font-[family-name:var(--font-vazir)]">
              <span className="text-gray-500">تاریخ کشف</span>
              <span>{formatDate(asset.discovery_date)}</span>
            </div>
          )}
          {/* 🔥 تاریخ ارزش‌گذاری */}
          <div className="flex justify-between text-sm border-b pb-2 font-[family-name:var(--font-vazir)]">
            <span className="text-gray-500"> تاریخ ارزش‌گذاری</span>
            <span>
              {financialData?.effective_date ? formatDate(financialData.effective_date) : '—'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* دکمه‌های پایین */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="flex gap-2">
          {canDeleteResult && (
            <Button
              variant="destructive"
              onClick={handleDeleteClick}
              disabled={deleting}
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? <LoadingSpinner size="sm" /> : 'حذف دارایی'}
            </Button>
          )}
        </div>
        <Button variant="outline" onClick={() => router.back()}>بازگشت</Button>
      </div>

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="حذف دارایی"
        message="آیا از حذف این دارایی مطمئن هستید؟"
        itemName={asset?.asset_name}
        loading={deleting}
      />
    </PageTransition>
  );
}
