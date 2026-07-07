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
import {
  ArrowLeft,
  User,
  Building2,
  Building,
  Calendar,
  FileText,
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
  Award
} from 'lucide-react';

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

interface ValuationItem {
  id: number;
  asset: number;
  status: string;
  final_score: number;
  answers: any[];
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
  const [loading, setLoading] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);

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
      
      // 🔥 دریافت همزمان همه داده‌ها با Promise.all
      const [assetRes, filesRes, valuationsRes] = await Promise.all([
        api.get(`/intangible/screened-assets/${assetId}/`),
        api.get(`/intangible/asset-files/?asset_id=${assetId}`),
        fetchAllValuations(),
      ]);
      
      // تنظیم اطلاعات دارایی
      const assetData = assetRes.data;
      setAsset(assetData);
      console.log('✅ Asset Data:', assetData);
      
      // تنظیم فایل‌ها
      const filesData = filesRes.data.results || filesRes.data || [];
      setFiles(filesData);
      console.log(`✅ ${filesData.length} فایل دریافت شد`);
      
      // پردازش ارزیابی‌ها
      const allValuations = valuationsRes as ValuationItem[];
      console.log(`📋 کل ارزیابی‌ها: ${allValuations.length}`);
      
      const assetValuations = allValuations.filter((v: ValuationItem) => v.asset === parseInt(assetId));
      console.log(`📋 ${assetValuations.length} ارزیابی برای این دارایی پیدا شد`);
      
      if (assetValuations.length > 0) {
        // اولویت ۱: پیدا کردن ارزیابی completed
        const completed = assetValuations.find((v: ValuationItem) => v.status === 'completed');
        // اولویت ۲: اگر نبود، آخرین ارزیابی
        const targetValuation = completed || assetValuations[assetValuations.length - 1];
        
        if (targetValuation) {
          console.log(`✅ انتخاب ارزیابی: ID ${targetValuation.id}, Status: ${targetValuation.status}`);
          
          const { data: summary } = await api.get(`/intangible/asset-valuations/${targetValuation.id}/summary/`);
          console.log('📊 خلاصه ارزیابی:', summary);
          
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
        }
      } else {
        console.log(`⚠️ هیچ ارزیابی برای دارایی ${assetId} پیدا نشد`);
      }
      
      setIsDataReady(true);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.response?.data?.detail || 'خطا در دریافت اطلاعات');
    } finally {
      setLoading(false);
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
      
      // 🔥 دوباره فایل‌ها رو بگیر
      const { data } = await api.get(`/intangible/asset-files/?asset_id=${assetId}`);
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
      
      // 🔥 دوباره فایل‌ها رو بگیر
      const { data } = await api.get(`/intangible/asset-files/?asset_id=${assetId}`);
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
      <span className={`${c.bg} ${c.color} px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2`}>
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

  const canDeleteResult = canDelete();
  const isValuationCompleted = valuation?.status === 'completed';

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
    <PageTransition className="p-6 space-y-6 max-w-6xl mx-auto">
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

      {/* توضیحات */}
      {asset.description && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{asset.description}</p>
          </CardContent>
        </Card>
      )}

      {/* نمودار رادار - با Skeleton */}
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

      {/* اگر ارزیابی نشده */}
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

      {/* شواهد ارزیابی */}
      {isValuationCompleted && valuation && (
        <AssetEvidence assetId={parseInt(assetId)} valuationId={valuation.id} />
      )}

      {/* فایل‌های پیوست */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            فایل‌های پیوست
            {loadingFiles && <span className="text-sm text-gray-400">(در حال بارگذاری...)</span>}
            {!loadingFiles && files.length > 0 && (
              <span className="text-sm text-gray-400">({files.length} فایل)</span>
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

      {/* تاریخچه ارزیابی - با Skeleton */}
      {valuation ? (
        <ValuationHistory 
          assetId={parseInt(assetId)} 
          assetName={asset.asset_name}
        />
      ) : (
        <ValuationHistorySkeleton />
      )}

      {/* زمان‌بندی */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> زمان‌بندی
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm border-b pb-2">
            <span className="text-gray-500">تاریخ ایجاد</span>
            <span>{formatDate(asset.created_at)}</span>
          </div>
          {asset.updated_at && (
            <div className="flex justify-between text-sm border-b pb-2">
              <span className="text-gray-500">آخرین بروزرسانی</span>
              <span>{formatDate(asset.updated_at)}</span>
            </div>
          )}
          {asset.discovery_date && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">تاریخ کشف</span>
              <span>{formatDate(asset.discovery_date)}</span>
            </div>
          )}
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
