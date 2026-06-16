'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowRight, FileCheck, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ViewIdentityFormPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];
        const response = await fetch(`http://localhost:8000/api/intangible/identity-assessments/${id}/`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setFormData(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const questions = [
    { id: 'q1', text: 'این دارایی فاقد حضور فیزیکی و قابل لمس است' },
    { id: 'q2', text: 'این دارایی به طور مستقیم یا غیرمستقیم به افزایش درآمد یا کاهش هزینه کمک می‌کند' },
    { id: 'q3', text: 'این دارایی مزیت رقابتی قابل توجهی برای سازمان ایجاد کرده است' },
    { id: 'q4', text: 'این دارایی نقش کلیدی در بهبود کیفیت یا بهره‌وری سازمان دارد' },
    { id: 'q5', text: 'این دارایی در سیستم‌های رسمی سازمان ثبت نشده و به‌سختی قابل تشخیص است' },
    { id: 'q6', text: 'ارزش این دارایی را نمی‌توان به‌سادگی با روش‌های حسابداری سنتی محاسبه کرد' },
    { id: 'q7', text: 'قیمت بازار مشخصی برای این دارایی وجود ندارد' },
    { id: 'q8', text: 'ارزش این دارایی به صنعت، استراتژی و شرایط سازمان وابسته است' },
    { id: 'q9', text: 'این دارایی به‌سختی توسط رقبا قابل کپی‌برداری یا تقلید است' },
    { id: 'q10', text: 'این دارایی می‌تواند مزیت رقابتی بلندمدت برای سازمان ایجاد کند' },
    { id: 'q11', text: 'خروج افراد کلیدی یا افشای اطلاعات، این دارایی را با ریسک جدی مواجه می‌کند' },
    { id: 'q12', text: 'این دارایی در معرض فراموشی یا از بین رفتن بدون مستندسازی است' },
    { id: 'q13', text: 'بخش قابل‌توجهی از این دارایی در ذهن و تجربه افراد کلیدی سازمان نهفته است' },
    { id: 'q14', text: 'انتقال این دارایی به دیگران نیازمند آموزش و زمان قابل‌توجهی است' },
    { id: 'q15', text: 'این دارایی با استفاده و بهره‌برداری بیشتر، ارزشمندتر می‌شود' },
    { id: 'q16', text: 'این دارایی قابلیت بهبود، ارتقاء و بازآفرینی با گذشت زمان را دارد' },
    { id: 'q17', text: 'این دارایی نیازمند ثبت مالکیت فکری یا محرمانه‌سازی است' },
    { id: 'q18', text: 'بدون حفاظت سازمانی، این دارایی به‌راحتی از بین می‌رود یا تکثیر می‌شود' },
    { id: 'q19', text: 'این دارایی قابلیت تبدیل به منبع درآمد مستقیم (تجاری‌سازی) را دارد' },
    { id: 'q20', text: 'این دارایی در تصمیم‌گیری‌های کلان و چشم‌انداز سازمان نقش اساسی دارد' },
  ];

  if (loading) {
    return <div className="text-center py-10">در حال بارگذاری...</div>;
  }

  if (!formData) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">داده‌ای برای نمایش وجود ندارد</p>
        <Button onClick={() => router.back()} className="mt-4">بازگشت</Button>
      </div>
    );
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'verified': return { label: 'تأیید شده', color: 'text-green-600' };
      case 'pending': return { label: 'در انتظار', color: 'text-yellow-600' };
      case 'rejected': return { label: 'رد شده', color: 'text-red-600' };
      default: return { label: status, color: 'text-gray-600' };
    }
  };

  const statusInfo = getStatusLabel(formData.status);

  return (
    <div dir="rtl" className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 rounded-lg hover:bg-gray-100">
            <ArrowRight className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">مشاهده فرم هویت‌سنجی</h1>
            <p className="text-xs text-gray-500">IA-F-00-01 - شناسه: #{formData.id}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4 ml-1" /> چاپ
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>اطلاعات دارایی</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div><span className="font-medium">نام دارایی:</span> {formData.asset_name}</div>
          <div><span className="font-medium">نوع دارایی:</span> {formData.asset_type || '-'}</div>
          <div className="col-span-2"><span className="font-medium">توضیحات:</span> {formData.description || '-'}</div>
          <div><span className="font-medium">وضعیت:</span> <span className={`font-bold ${statusInfo.color}`}>{statusInfo.label}</span></div>
          <div><span className="font-medium">امتیاز نهایی:</span> <span className="font-bold">{formData.total_score?.toFixed(1)}%</span></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>پاسخ‌های پرسشنامه</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {questions.map((q, index) => (
            <div key={q.id} className="flex items-center gap-4 border-b pb-2">
              <span className="text-xs text-gray-400 w-8">{index + 1}.</span>
              <span className="flex-1 text-sm">{q.text}</span>
              <span className="font-bold text-lg w-8 text-center">{formData[q.id] || 0}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={() => router.back()}>بازگشت</Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="w-4 h-4 ml-1" /> چاپ
        </Button>
      </div>
    </div>
  );
}
