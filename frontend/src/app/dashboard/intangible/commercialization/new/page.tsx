'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Search, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { casesApi } from '@/lib/engine06-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ScreenedAsset {
  id: number;
  asset_name: string;
  asset_uid: string;
  asset_type_name: string | null;
  result: string;
  organization_name: string | null;
  has_commercialization_case?: boolean;
}

export default function NewCasePage() {
  const router = useRouter();
  const [assets, setAssets] = useState<ScreenedAsset[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      // فقط دارایی‌های confirmed
      const { data } = await api.get('/intangible/screened-assets/', {
        params: {
          result: 'confirmed',
          has_valuation: 'true',
        },
      });
      const results = data.results || data || [];
      // فیلتر دارایی‌هایی که پرونده ندارن (اگه API این رو نداشت، نمایش همه)
      setAssets(results);
    } catch (error) {
      console.error(error);
      toast.error('خطا در بارگذاری دارایی‌ها');
    } finally {
      setLoading(false);
    }
  };

  const filtered = assets.filter((a) => {
    if (!search) return true;
    return (
      a.asset_name.toLowerCase().includes(search.toLowerCase()) ||
      (a.asset_uid || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleSubmit = async () => {
    if (!selected) {
      toast.error('لطفاً یک دارایی انتخاب کنید');
      return;
    }
    try {
      setSubmitting(true);
      const newCase = await casesApi.create({ asset: selected });
      toast.success('پرونده با موفقیت ایجاد شد');
      router.push(`/dashboard/intangible/commercialization/${newCase.id}/readiness`);
    } catch (error: any) {
      console.error(error);
      const detail = error?.response?.data?.asset || error?.response?.data?.detail || 'خطا در ایجاد پرونده';
      toast.error(detail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen" style={{ fontFamily: 'Vazirmatn, Tahoma, sans-serif' }}>
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg bg-white shadow-sm"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">ایجاد پرونده تجاری‌سازی جدید</h1>
          <p className="text-sm text-gray-500 mt-1">
            فقط دارایی‌های «قطعی» قابل انتخاب هستند
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>انتخاب دارایی</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="جستجوی نام یا کد دارایی..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">در حال بارگذاری...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>هیچ دارایی قطعی‌ای یافت نشد</p>
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto space-y-2">
              {filtered.map((a) => (
                <div
                  key={a.id}
                  onClick={() => setSelected(a.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selected === a.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{a.asset_name}</div>
                      <div className="text-xs text-gray-500 mt-1 flex gap-3">
                        {a.asset_uid && <span>کد: {a.asset_uid}</span>}
                        {a.asset_type_name && <span>{a.asset_type_name}</span>}
                        {a.organization_name && <span>{a.organization_name}</span>}
                      </div>
                    </div>
                    {selected === a.id && (
                      <Check className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => router.back()}>
              انصراف
            </Button>
            <Button onClick={handleSubmit} disabled={!selected || submitting}>
              {submitting ? 'در حال ایجاد...' : 'ایجاد پرونده و شروع گام ۱'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
