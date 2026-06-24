'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import { SkeletonLoader } from '@/components/ui/skeleton-loader';
import { PageTransition } from '@/components/ui/page-transition';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  ArrowLeft,
  Package,
  User,
  Building2,
  Building,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Trash2,
  Upload,
  File,
  Download,
  X,
  FolderOpen
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
  const [loading, setLoading] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
      fetchAssetDetail();
      fetchAssetFiles();
    }
  }, [assetId]);

  const fetchAssetDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get(`/intangible/screened-assets/${assetId}/`);
      setAsset(data);
    } catch (error: any) {
      console.error('Error fetching asset:', error);
      setError(error.response?.data?.detail || 'خطا در دریافت اطلاعات دارایی');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssetFiles = async () => {
    try {
      setLoadingFiles(true);
      const { data } = await api.get(`/intangible/asset-files/?asset_id=${assetId}`);
      const filesData = data.results || data || [];
      setFiles(filesData);
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoadingFiles(false);
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
      await fetchAssetFiles();
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
      await fetchAssetFiles();
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
    <PageTransition className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{asset.asset_name}</h1>
            <p className="text-sm text-gray-500">{asset.asset_uid}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getResultBadge(asset.result)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
              <FileText className="w-4 h-4" /> اطلاعات پایه
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div><p className="text-xs text-gray-400">نام دارایی</p><p className="font-medium">{asset.asset_name}</p></div>
            <div><p className="text-xs text-gray-400">کد شناسایی</p><p className="font-mono text-sm">{asset.asset_uid}</p></div>
            <div><p className="text-xs text-gray-400">دسته‌بندی</p><span className="px-2 py-1 bg-gray-100 rounded-full text-sm">{getCategoryLabel(asset.category)}</span></div>
            <div><p className="text-xs text-gray-400">نسخه</p><p>{asset.version || '1.0.0'}</p></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
              <User className="w-4 h-4" /> اطلاعات سازمانی
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div><p className="text-xs text-gray-400">سازمان</p><div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-gray-400" /><span>{asset.organization_name || 'نامشخص'}</span></div></div>
            <div><p className="text-xs text-gray-400">واحد</p><div className="flex items-center gap-2"><Building className="w-4 h-4 text-gray-400" /><span>{asset.department_name || 'نامشخص'}</span></div></div>
            <div><p className="text-xs text-gray-400">ایجاد کننده</p><div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-400" /><span>{asset.created_by_name || 'نامشخص'}</span></div></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-500 flex items-center gap-2">
            <FileText className="w-4 h-4" /> توضیحات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 whitespace-pre-wrap">{asset.description || 'توضیحی ثبت نشده است'}</p>
        </CardContent>
      </Card>

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

      <div className="flex justify-between items-center pt-4 border-t">
        <div>
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
