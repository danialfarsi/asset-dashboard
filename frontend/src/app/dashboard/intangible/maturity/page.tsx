/**
 * 🎯 صفحه اصلی سنجش بلوغ IAMS
 * مسیر: /dashboard/intangible/maturity
 */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Award, TrendingUp, Target, Plus, RefreshCw, Trash2,
  BarChart3, Eye, ArrowRight, AlertCircle, CheckCircle,
  Activity, Layers, Loader2, Shield,
} from 'lucide-react';
import { maturityApi } from '@/services/engine05/maturity-api';
import { toast } from 'sonner';

interface Assessment {
  id: number;
  organization_name: string;
  weight_profile_name: string;
  score_total: number;
  index: number;
  maturity_level: number;
  maturity_level_display: string;
  status: string;
  status_display: string;
  responses_count: number;
  created_at: string;
}

const LEVEL_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  2: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  3: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  4: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  5: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
};

export default function MaturityPage() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const toFa = (num: any): string => {
    if (num === null || num === undefined) return '—';
    return String(num).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
  };

  const loadAssessments = async () => {
    setLoading(true);
    try {
      const res = await maturityApi.getAssessments();
      setAssessments(res.data.results || []);
    } catch (err) {
      console.error(err);
      toast.error('خطا در بارگذاری');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssessments();
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await maturityApi.createAssessment({ weight_profile: 1 });
      toast.success('ارزیابی جدید ساخته شد');
      router.push(`/dashboard/intangible/maturity/${res.data.id}`);
    } catch (err: any) {
      console.error(err);
      toast.error('خطا در ساخت ارزیابی');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('حذف این ارزیابی؟')) return;
    try {
      await maturityApi.deleteAssessment(id);
      toast.success('حذف شد');
      loadAssessments();
    } catch (err) {
      toast.error('خطا در حذف');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6 rtl" style={{ fontFamily: 'Vazirmatn, Tahoma, sans-serif' }}>
      {/* Header */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#04241D] transition"
      >
        <ArrowRight className="h-4 w-4" />
        بازگشت به داشبورد
      </Link>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#04241D] to-[#0B4A3C] p-6 text-white shadow-xl">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#D9B65D]/10 blur-3xl" />
        
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                <Award className="h-6 w-6 text-[#F2D27E]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">سنجش بلوغ IAMS</h1>
                <p className="text-sm text-white/70">
                  سنجش بلوغ نظام مدیریت دارایی‌های نامشهود
                </p>
              </div>
            </div>
            <p className="text-xs text-white/60 mt-3">
              ۵۰ پرسش | ۴ بخش | ۱۶ مؤلفه | ۵ سطح بلوغ
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={loadAssessments}
              variant="outline"
              size="sm"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              <RefreshCw className={`w-4 h-4 ml-1 ${loading ? 'animate-spin' : ''}`} />
              بروزرسانی
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="bg-[#D9B65D] text-[#04241D] hover:bg-[#F2D27E] font-bold"
            >
              <Plus className="w-4 h-4 ml-1" />
              ارزیابی جدید
            </Button>
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-[#04241D] animate-spin" />
        </div>
      ) : assessments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-800 mb-2">هنوز ارزیابی‌ای انجام نشده</h3>
            <p className="text-sm text-gray-500 mb-6">
              برای شروع سنجش بلوغ، روی دکمه «ارزیابی جدید» کلیک کنید
            </p>
            <Button
              onClick={handleCreate}
              disabled={creating}
              className="bg-[#04241D] hover:bg-[#0B4A3C]"
            >
              <Plus className="w-4 h-4 ml-1" />
              شروع ارزیابی
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assessments.map((a) => {
            const levelColor = LEVEL_COLORS[a.maturity_level] || LEVEL_COLORS[1];
            const progress = Math.round((a.responses_count / 48) * 100);
            
            return (
              <Card key={a.id} className="hover:shadow-lg transition border-2 border-transparent hover:border-[#04241D]/10">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${levelColor.bg} border ${levelColor.border}`}>
                      <span className={`text-xl font-bold ${levelColor.text}`}>
                        {toFa(a.maturity_level)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="text-gray-300 hover:text-red-500 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="font-bold text-sm text-gray-800 mb-1">
                    {a.organization_name || 'بدون سازمان'}
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">
                    {a.weight_profile_name}
                  </p>

                  {/* Progress */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-gray-500">
                        {a.responses_count} از ۴۸ پرسش
                      </span>
                      <span className="text-[10px] font-bold text-gray-700">
                        {toFa(progress)}٪
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-l from-[#04241D] to-[#0B4A3C] transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Score */}
                  {a.status === 'calculated' && (
                    <div className={`p-3 rounded-lg ${levelColor.bg} mb-3`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-600">Index</span>
                        <span className={`text-lg font-bold ${levelColor.text}`}>
                          {toFa(a.index.toFixed(1))}
                        </span>
                      </div>
                      <p className={`text-[10px] ${levelColor.text} mt-1`}>
                        {a.maturity_level_display}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/intangible/maturity/${a.id}`}
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full text-xs">
                        <Eye className="w-3 h-3 ml-1" />
                        {a.status === 'calculated' ? 'مشاهده' : 'ادامه'}
                      </Button>
                    </Link>
                    {a.status === 'calculated' && (
                      <Link href={`/dashboard/intangible/maturity/${a.id}/results`}>
                        <Button size="sm" className="bg-[#04241D] text-xs">
                          <BarChart3 className="w-3 h-3 ml-1" />
                          نتایج
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
