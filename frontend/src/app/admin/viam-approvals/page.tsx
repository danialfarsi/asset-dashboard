'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { viamApi } from '@/services/viam/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, Eye, Building2, FileText } from 'lucide-react';

interface VIAMRequest {
  id: number;
  title: string;
  description: string;
  justification: string;
  status: string;
  current_step: number;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  organization?: number;
  organization_name?: string;
}

export default function VIAMApprovalsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<VIAMRequest[]>([]);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    if (!isSuperAdmin) {
      router.push('/dashboard');
      return;
    }
    fetchData();
  }, [isSuperAdmin]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await viamApi.getEstablishmentRequests();
      const allRequests = response.data.results || [];
      
      const pending = allRequests.filter((r: any) => r.status === 'submitted');
      setRequests(pending);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      await viamApi.adminApprove(id);
      setRequests(prev => prev.filter(r => r.id !== id));
      alert('✅ درخواست با موفقیت تایید شد!');
    } catch (error) {
      console.error('Error approving request:', error);
      alert('❌ خطا در تایید درخواست');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این درخواست را رد کنید؟')) return;
    
    setActionLoading(id);
    try {
      await viamApi.adminReject(id);
      setRequests(prev => prev.filter(r => r.id !== id));
      alert('✅ درخواست با موفقیت رد شد!');
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('❌ خطا در رد درخواست');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      active: 'bg-blue-100 text-blue-800',
    };
    const labels: Record<string, string> = {
      draft: 'پیش‌نویس',
      submitted: 'در انتظار تایید',
      approved: 'تایید شده',
      rejected: 'رد شده',
      active: 'فعال',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100'}`}>
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

  return (
    <div className="container mx-auto p-6 rtl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">تایید درخواست‌های VIAM</h1>
          <p className="text-gray-600 text-sm mt-1">
            درخواست‌هایی که توسط مدیران شرکت ارسال شده‌اند
          </p>
        </div>
        <Link href="/viam/dashboard">
          <Button variant="outline">← بازگشت به داشبورد VIAM</Button>
        </Link>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700">همه درخواست‌ها تایید شده‌اند!</h2>
            <p className="text-gray-500 mt-2">هیچ درخواستی در انتظار تایید وجود ندارد.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req.id} className="border-r-4 border-yellow-500">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-semibold">{req.title}</h3>
                      {getStatusBadge(req.status)}
                      {req.status === 'submitted' && (
                        <span className="text-xs text-yellow-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          در انتظار تایید
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-600 space-y-1">
                      <p><span className="font-medium">شرح:</span> {req.description || 'بدون توضیحات'}</p>
                      <p><span className="font-medium">دلایل توجیهی:</span> {req.justification || 'بدون توجیه'}</p>
                    </div>
                    
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        گام {req.current_step || 1} از ۱۲
                      </span>
                      <span>•</span>
                      <span>تاریخ: {formatDate(req.created_at)}</span>
                      {req.organization_name && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {req.organization_name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mr-4">
                    <Link href={`/viam/establishment/${req.id}/admin-view`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 ml-1" />
                        مشاهده کامل
                      </Button>
                    </Link>
                    <Button 
                      variant="default" 
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleApprove(req.id)}
                      disabled={actionLoading === req.id}
                    >
                      <CheckCircle className="w-4 h-4 ml-1" />
                      تایید
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleReject(req.id)}
                      disabled={actionLoading === req.id}
                    >
                      <XCircle className="w-4 h-4 ml-1" />
                      رد
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
