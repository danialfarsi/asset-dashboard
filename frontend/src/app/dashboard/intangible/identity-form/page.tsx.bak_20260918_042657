'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Save, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function IdentityFormPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    asset_name: '',
    asset_type: '',
    description: '',
    // ۲۰ سوال پرسشنامه
    q1: 3, q2: 3, q3: 3, q4: 3, q5: 3,
    q6: 3, q7: 3, q8: 3, q9: 3, q10: 3,
    q11: 3, q12: 3, q13: 3, q14: 3, q15: 3,
    q16: 3, q17: 3, q18: 3, q19: 3, q20: 3,
  });

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleQuestionChange = (id: string, value: string) => {
    setFormData({ ...formData, [id]: parseInt(value) });
  };

  const calculateScore = () => {
    const total = questions.reduce((sum, q) => sum + (formData[q.id as keyof typeof formData] as number || 0), 0);
    return (total / 100) * 100;
  };

  const getResult = (score: number) => {
    if (score >= 80) return { label: 'دارایی نامشهود قطعی', color: 'text-green-600' };
    if (score >= 60) return { label: 'دارایی نامشهود محتمل', color: 'text-yellow-600' };
    if (score >= 40) return { label: 'در مرز (نیاز به بررسی بیشتر)', color: 'text-orange-600' };
    return { label: 'دارایی نامشهود نیست', color: 'text-red-600' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // ذخیره در بک‌اند
    setTimeout(() => {
      setLoading(false);
      router.push('/dashboard/intangible/verified');
    }, 1000);
  };

  const score = calculateScore();
  const result = getResult(score);

  return (
    <div dir="rtl" className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1 rounded-lg hover:bg-gray-100">
          <ArrowRight className="w-5 h-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">فرم هویت‌سنجی دارایی‌های نامشهود</h1>
          <p className="text-xs text-gray-500">IA-F-00-01</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* اطلاعات دارایی */}
        <Card>
          <CardHeader><CardTitle>اطلاعات دارایی</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>نام دارایی *</Label><Input name="asset_name" value={formData.asset_name} onChange={handleChange} required /></div>
            <div><Label>نوع دارایی</Label><Input name="asset_type" value={formData.asset_type} onChange={handleChange} placeholder="مثال: دانش فنی، برند، پتنت، ..." /></div>
            <div><Label>توضیحات</Label><Textarea name="description" rows={3} value={formData.description} onChange={handleChange} /></div>
          </CardContent>
        </Card>

        {/* پرسشنامه */}
        <Card>
          <CardHeader>
            <CardTitle>پرسشنامه تشخیص دارایی نامشهود</CardTitle>
            <p className="text-xs text-gray-500">به هر سوال از ۱ تا ۵ امتیاز دهید (۱ = کاملاً مخالف، ۵ = کاملاً موافق)</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions.map((q, index) => (
              <div key={q.id} className="flex items-center gap-4 border-b pb-3">
                <span className="text-xs text-gray-400 w-8">{index + 1}.</span>
                <span className="flex-1 text-sm">{q.text}</span>
                <select
                  value={formData[q.id as keyof typeof formData] as number}
                  onChange={(e) => handleQuestionChange(q.id, e.target.value)}
                  className="w-16 border rounded-lg px-2 py-1 text-sm"
                >
                  {[1, 2, 3, 4, 5].map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* نتیجه */}
        <Card className={result.color}>
          <CardHeader><CardTitle>نتیجه هویت‌سنجی</CardTitle></CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold">{score.toFixed(1)}%</div>
              <div className="text-lg font-medium mt-2">{result.label}</div>
            </div>
          </CardContent>
        </Card>

        {/* دکمه‌ها */}
        <div className="flex gap-3 sticky bottom-4 bg-white p-4 rounded-lg shadow-lg">
          <Button type="submit" disabled={loading} className="flex-1">
            <FileCheck className="w-4 h-4 ml-2" />
            {loading ? 'در حال ثبت...' : 'ثبت هویت‌سنجی'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>انصراف</Button>
        </div>
      </form>
    </div>
  );
}
