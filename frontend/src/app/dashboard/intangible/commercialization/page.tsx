'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Plus, Search, Filter, Briefcase, TrendingUp, Clock, CheckCircle,
  AlertCircle, DollarSign, FileText, Users, ArrowLeft, Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { casesApi, CommercializationCase } from '@/lib/engine06-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const toFa = (num: any): string => {
  if (num === null || num === undefined) return '—';
  return String(num).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  step_1_readiness: 'bg-blue-100 text-blue-700',
  step_2_business_model: 'bg-purple-100 text-purple-700',
  step_3_partners: 'bg-amber-100 text-amber-700',
  step_4_contract: 'bg-orange-100 text-orange-700',
  step_5_revenue: 'bg-emerald-100 text-emerald-700',
  closed_won: 'bg-green-100 text-green-800',
  closed_lost: 'bg-red-100 text-red-800',
  on_hold: 'bg-gray-200 text-gray-700',
};

export default function CommercializationDashboardPage() {
  const router = useRouter();
  const [cases, setCases] = useState<CommercializationCase[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [casesRes, statsRes] = await Promise.all([
        casesApi.list(),
        api.get('/intangible/engine/commercialization/dashboard/'),
      ]);
      setCases(casesRes.results || casesRes);
      setStats(statsRes.data);
    } catch (error) {
      console.error(error);
      toast.error('خطا در بارگذاری داده‌ها');
    } finally {
      setLoading(false);
    }
  };

  const filtered = cases.filter((c) => {
    if (search && !c.asset_name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && c.status !== statusFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50/50 min-h-screen" style={{ fontFamily: 'Vazirmatn, Tahoma, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">تجاری‌سازی دارایی‌ها</h1>
          <p className="text-sm text-gray-500 mt-1">
            موتور ۶ — مدیریت ۵ گام تجاری‌سازی
          </p>
        </div>
        <Link href="/dashboard/intangible/commercialization/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            پرونده جدید
          </Button>
        </Link>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Briefcase className="w-4 h-4" />
                کل پرونده‌ها
              </div>
              <div className="text-2xl font-bold mt-2">{toFa(stats.total_cases)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <FileText className="w-4 h-4" />
                قراردادهای امضاشده
              </div>
              <div className="text-2xl font-bold mt-2">{toFa(stats.total_contracts_signed)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <DollarSign className="w-4 h-4" />
                درآمد وصول‌شده
              </div>
              <div className="text-2xl font-bold mt-2">
                {toFa(Number(stats.total_revenue_collected).toLocaleString())}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <AlertCircle className="w-4 h-4" />
                اختلافات
              </div>
              <div className="text-2xl font-bold mt-2 text-red-600">
                {toFa(stats.disputes_count)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="جستجوی دارایی..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg"
        >
          <option value="">همه وضعیت‌ها</option>
          <option value="step_1_readiness">گام ۱ — آمادگی</option>
          <option value="step_2_business_model">گام ۲ — مدل</option>
          <option value="step_3_partners">گام ۳ — شرکا</option>
          <option value="step_4_contract">گام ۴ — قرارداد</option>
          <option value="step_5_revenue">گام ۵ — درآمد</option>
          <option value="closed_won">موفق</option>
          <option value="closed_lost">ناموفق</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>هیچ پرونده‌ای یافت نشد</p>
            <Link href="/dashboard/intangible/commercialization/new">
              <Button className="mt-4 gap-2">
                <Plus className="w-4 h-4" />
                ایجاد اولین پرونده
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Link key={c.id} href={`/dashboard/intangible/commercialization/${c.id}`}>
              <Card className="hover:shadow-xl transition-all cursor-pointer h-full">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 line-clamp-2">{c.asset_name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{c.asset_type_name || '—'}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${STATUS_COLORS[c.status] || 'bg-gray-100'}`}>
                      {c.status_display}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {c.organization_name && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {c.organization_name}
                      </span>
                    )}
                  </div>

                  {/* Steps progress */}
                  <div className="flex items-center gap-1 pt-2">
                    {[1, 2, 3, 4, 5].map((step) => (
                      <div
                        key={step}
                        className={`flex-1 h-1.5 rounded-full ${
                          step <= c.current_step ? 'bg-blue-500' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>گام {toFa(c.current_step)} از ۵</span>
                    {c.owner_name && <span>{c.owner_name}</span>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
