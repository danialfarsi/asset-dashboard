'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, XCircle, Eye, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface IdentityAssessment {
  id: number;
  asset_name: string;
  asset_type: string;
  status: 'verified' | 'pending' | 'rejected';
  total_score: number;
  created_at: string;
}

export default function VerifiedAssetsPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<IdentityAssessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];
        const response = await fetch('http://localhost:8000/api/intangible/identity-assessments/', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setAssets(data.results || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 font-medium"><CheckCircle className="w-3.5 h-3.5" /> تأیید شده</span>;
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 font-medium"><Clock className="w-3.5 h-3.5" /> در انتظار</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-700 px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 font-medium"><XCircle className="w-3.5 h-3.5" /> رد شده</span>;
      default:
        return null;
    }
  };

  const getStatusTooltip = (status: string, score: number) => {
    switch (status) {
      case 'verified':
        return {
          title: '✅ تأیید شده',
          description: 'این دارایی همه ویژگی‌های یک دارایی نامشهود را دارد و در سیستم ثبت شده است.',
          score: `امتیاز: ${score.toFixed(1)}%`,
          recommendation: 'توصیه: ثبت در شناسنامه دارایی‌های نامشهود و شروع فرآیندهای حفاظت و تجاری‌سازی',
          color: 'border-green-200 bg-green-50'
        };
      case 'pending':
        return {
          title: '🟡 در انتظار بررسی',
          description: 'این دارایی در مرز تشخیص است و نیاز به بررسی کارشناسی تکمیلی دارد.',
          score: `امتیاز: ${score.toFixed(1)}%`,
          recommendation: 'توصیه: ارجاع به تیم خبرگان برای بررسی عمیق‌تر',
          color: 'border-yellow-200 bg-yellow-50'
        };
      case 'rejected':
        return {
          title: '❌ رد شده',
          description: 'این دارایی ویژگی‌های کافی برای نامشهود بودن را ندارد.',
          score: `امتیاز: ${score.toFixed(1)}%`,
          recommendation: 'توصیه: ثبت به عنوان یک منبع یا داده معمولی (نه دارایی نامشهود)',
          color: 'border-red-200 bg-red-50'
        };
      default:
        return null;
    }
  };

  const handleViewForm = (id: number) => {
    router.push(`/dashboard/intangible/identity-form/view/${id}`);
  };

  if (loading) {
    return <div className="text-center py-10">در حال بارگذاری...</div>;
  }

  return (
    <div dir="rtl" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">دارایی‌های هویت‌سنجی شده</h1>
        <p className="text-sm text-gray-500 mt-1">لیست دارایی‌هایی که فرآیند هویت‌سنجی را طی کرده‌اند</p>
      </div>

      {/* راهنمای وضعیت‌ها */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-800">راهنمای وضعیت‌های هویت‌سنجی</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-2 bg-white p-3 rounded-lg shadow-sm border border-green-200">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-green-700">✅ تأیید شده</p>
                <p className="text-gray-600 text-xs">دارایی نامشهود قطعی</p>
                <p className="text-gray-500 text-xs mt-1">امتیاز ۸۰% تا ۱۰۰%</p>
              </div>
            </div>
            <div className="flex items-start gap-2 bg-white p-3 rounded-lg shadow-sm border border-yellow-200">
              <Clock className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-yellow-700">🟡 در انتظار</p>
                <p className="text-gray-600 text-xs">نیاز به بررسی تکمیلی</p>
                <p className="text-gray-500 text-xs mt-1">امتیاز ۶۰% تا ۷۹%</p>
              </div>
            </div>
            <div className="flex items-start gap-2 bg-white p-3 rounded-lg shadow-sm border border-red-200">
              <XCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-red-700">❌ رد شده</p>
                <p className="text-gray-600 text-xs">دارایی نامشهود نیست</p>
                <p className="text-gray-500 text-xs mt-1">امتیاز ۰% تا ۵۹%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* آمار */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-green-600">{assets.filter(a => a.status === 'verified').length}</p>
            <p className="text-xs text-gray-500">تأیید شده</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-yellow-600">{assets.filter(a => a.status === 'pending').length}</p>
            <p className="text-xs text-gray-500">در انتظار بررسی</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-blue-600">{assets.length}</p>
            <p className="text-xs text-gray-500">کل دارایی‌ها</p>
          </CardContent>
        </Card>
      </div>

      {/* لیست */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-right">نام دارایی</th>
              <th className="px-4 py-3 text-right">نوع</th>
              <th className="px-4 py-3 text-right">امتیاز</th>
              <th className="px-4 py-3 text-right">وضعیت</th>
              <th className="px-4 py-3 text-right">تاریخ</th>
              <th className="px-4 py-3 text-center">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {assets.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  هیچ دارایی هویت‌سنجی شده‌ای وجود ندارد.
                  <br />
                  <Button 
                    variant="link" 
                    className="text-blue-600"
                    onClick={() => router.push('/dashboard/intangible/identity-form/new')}
                  >
                    ثبت هویت‌سنجی جدید
                  </Button>
                </td>
              </tr>
            ) : (
              <TooltipProvider>
                {assets.map((asset) => {
                  const tooltipData = getStatusTooltip(asset.status, asset.total_score);
                  return (
                    <tr key={asset.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleViewForm(asset.id)}>
                      <td className="px-4 py-3 font-medium">{asset.asset_name}</td>
                      <td className="px-4 py-3 text-gray-600">{asset.asset_type || '-'}</td>
                      <td className="px-4 py-3 font-bold">{asset.total_score?.toFixed(1)}%</td>
                      <td className="px-4 py-3">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">
                              {getStatusBadge(asset.status)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className={`max-w-xs p-4 rounded-xl shadow-lg border ${tooltipData?.color}`}>
                            <div className="space-y-2">
                              <p className="font-bold text-sm">{tooltipData?.title}</p>
                              <p className="text-xs text-gray-600">{tooltipData?.description}</p>
                              <p className="text-xs font-medium text-gray-700">{tooltipData?.score}</p>
                              <p className="text-xs text-blue-600 border-t pt-2 mt-2">{tooltipData?.recommendation}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{new Date(asset.created_at).toLocaleDateString('fa-IR')}</td>
                      <td className="px-4 py-3 text-center">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-600 hover:text-blue-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewForm(asset.id);
                          }}
                        >
                          <Eye className="w-4 h-4 ml-1" />
                          مشاهده
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </TooltipProvider>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
