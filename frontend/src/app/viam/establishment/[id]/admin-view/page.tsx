'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { viamApi } from '@/services/viam/api';
import { useAuthStore } from '@/store/auth-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Building2, 
  FileText, 
  Users, 
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  User,
  Calendar,
  ListChecks,
  Target,
  Shield,
  Settings,
  Rocket
} from 'lucide-react';

const STEP_NAMES: { [key: number]: string } = {
  1: 'ثبت درخواست تأسیس',
  2: 'تعیین حامی اجرایی',
  3: 'انتخاب مدل حکمرانی',
  4: 'تعیین محل استقرار سازمانی',
  5: 'تدوین منشور',
  6: 'تشکیل کمیته',
  7: 'تعیین مدیر IAM',
  8: 'تعیین نمایندگان واحدها',
  9: 'تعریف RACI اولیه',
  10: 'تصویب مدل عملیاتی',
  11: 'پیکربندی در پلتفرم',
  12: 'آغاز پایلوت',
};

const STEP_ICONS: { [key: number]: any } = {
  1: FileText,
  2: User,
  3: Target,
  4: Building2,
  5: FileText,
  6: Users,
  7: User,
  8: Users,
  9: ListChecks,
  10: Settings,
  11: Settings,
  12: Rocket,
};

export default function AdminViewRequest() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<any>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    if (!isSuperAdmin) {
      router.push('/viam/dashboard');
      return;
    }
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const requestRes = await viamApi.getEstablishmentRequest(parseInt(id));
        setRequest(requestRes.data);

        try {
          const stepsRes = await viamApi.getEstablishmentRequestSteps(parseInt(id));
          setSteps(stepsRes.data.steps || []);
        } catch (stepsErr) {
          console.warn('Steps API error:', stepsErr);
        }
      } catch (err: any) {
        console.error('Error:', err);
        setError(err.response?.data?.detail || err.message || 'خطا در دریافت اطلاعات');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, isSuperAdmin]);

  const getStatusBadge = (status: string) => {
    const map: { [key: string]: string } = {
      'draft': 'bg-gray-100 text-gray-800',
      'submitted': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'active': 'bg-blue-100 text-blue-800',
    };
    const labels: { [key: string]: string } = {
      'draft': 'پیش‌نویس',
      'submitted': 'ارسال شده برای تایید',
      'approved': 'تایید شده',
      'rejected': 'رد شده',
      'active': 'فعال',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${map[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
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
    } catch {
      return dateString;
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">⛔ دسترسی غیرمجاز</h1>
          <p className="text-gray-600 mt-2">شما به این صفحه دسترسی ندارید.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="container mx-auto p-6 rtl">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-bold">❌ خطا</p>
          <p>{error || 'درخواست یافت نشد'}</p>
        </div>
        <Link href="/admin/viam-approvals">
          <button className="mt-4 text-blue-600 hover:text-blue-800">← بازگشت به صفحه تایید</button>
        </Link>
      </div>
    );
  }

  const currentStep = request.current_step || 1;

  return (
    <div className="container mx-auto p-6 rtl max-w-5xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">{request.title}</h1>
            {getStatusBadge(request.status)}
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
            <span>#{request.id}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(request.created_at)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {request.created_by_name || 'کاربر'}
            </span>
          </div>
        </div>
        <Link href="/admin/viam-approvals">
          <button className="text-gray-600 hover:text-gray-800">← بازگشت</button>
        </Link>
      </div>

      {/* Admin Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-700 flex items-center gap-2">
          <Eye className="w-4 h-4" />
          <strong>نمایش ادمین:</strong> شما در حال مشاهده تمام اطلاعات درخواست هستید. این صفحه فقط برای مشاهده است.
        </p>
      </div>

      {/* Description & Justification */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">توضیحات</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-800">{request.description || 'توضیحی وارد نشده است'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">دلایل توجیهی</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-800">{request.justification || 'دلیل توجیهی وارد نشده است'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-5 h-5" />
            پیشرفت کلی
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">گام {currentStep} از ۱۲</span>
              <span className="text-sm font-medium text-blue-600">
                {Math.round(((currentStep - 1) / 12) * 100)}% تکمیل شده
              </span>
            </div>
            <div className="w-48 bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${Math.round(((currentStep - 1) / 12) * 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All Steps with Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ListChecks className="w-5 h-5" />
            جزئیات گام‌های ۱۲ گانه
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(steps.length > 0 ? steps : Array.from({ length: 12 }, (_, i) => i + 1)).map((step) => {
              const num = typeof step === 'number' ? step : step.number;
              const title = typeof step === 'number' ? STEP_NAMES[num] : step.title;
              const isDone = num < currentStep;
              const isCurrent = num === currentStep;
              const Icon = STEP_ICONS[num] || FileText;
              
              return (
                <div 
                  key={num} 
                  className={`flex items-start gap-4 p-4 rounded-lg border-2 transition ${
                    isDone ? 'border-green-200 bg-green-50/50' :
                    isCurrent ? 'border-blue-500 bg-blue-50/50' :
                    'border-gray-200 bg-gray-50/50 opacity-60'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isDone ? 'bg-green-500 text-white' :
                    isCurrent ? 'bg-blue-500 text-white' :
                    'bg-gray-300 text-gray-600'
                  }`}>
                    {isDone ? <CheckCircle className="w-5 h-5" /> : <span className="text-sm font-bold">{num}</span>}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isDone ? 'text-green-600' : isCurrent ? 'text-blue-600' : 'text-gray-400'}`} />
                      <h3 className={`font-medium ${
                        isDone ? 'text-green-700' :
                        isCurrent ? 'text-blue-700' :
                        'text-gray-500'
                      }`}>
                        {title || STEP_NAMES[num] || `گام ${num}`}
                      </h3>
                      {isDone && <span className="text-xs text-green-600">✓ تکمیل شده</span>}
                      {isCurrent && <span className="text-xs text-blue-600">در حال انجام</span>}
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      {isDone ? (
                        <p className="text-green-600">✅ این گام تکمیل شده است.</p>
                      ) : isCurrent ? (
                        <p className="text-blue-600">⏳ این گام در حال انجام است.</p>
                      ) : (
                        <p className="text-gray-400">⏳ در انتظار تکمیل گام‌های قبلی</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons - فقط برای super_admin در وضعیت submitted */}
      {request.status === 'submitted' && (
        <div className="mt-6 flex gap-4">
          <button
            onClick={async () => {
              if (confirm('آیا مطمئن هستید که می‌خواهید این درخواست را تایید کنید؟')) {
                try {
                  await viamApi.adminApprove(parseInt(id));
                  alert('✅ درخواست با موفقیت تایید شد!');
                  router.push('/admin/viam-approvals');
                } catch (err) {
                  alert('❌ خطا در تایید درخواست');
                }
              }
            }}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition"
          >
            ✅ تایید درخواست
          </button>
          <button
            onClick={async () => {
              if (confirm('آیا مطمئن هستید که می‌خواهید این درخواست را رد کنید؟')) {
                try {
                  await viamApi.adminReject(parseInt(id));
                  alert('✅ درخواست با موفقیت رد شد!');
                  router.push('/admin/viam-approvals');
                } catch (err) {
                  alert('❌ خطا در رد درخواست');
                }
              }
            }}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition"
          >
            ❌ رد درخواست
          </button>
        </div>
      )}

      {request.status === 'approved' && (
        <div className="mt-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-center">
          ✅ این درخواست قبلاً تایید شده است.
        </div>
      )}

      {request.status === 'rejected' && (
        <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
          ❌ این درخواست قبلاً رد شده است.
        </div>
      )}
    </div>
  );
}
