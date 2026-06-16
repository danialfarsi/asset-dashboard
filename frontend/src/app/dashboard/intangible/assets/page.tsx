'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Package, TrendingUp, Shield, Lightbulb } from 'lucide-react';

interface AssetItem {
  name: string;
  description: string;
  source: string;
  priority: 'high' | 'medium' | 'low';
}

interface DiscoveryForm {
  id: number;
  company: string;
  project_name: string;
  strategic_assets: AssetItem[];
  operational_assets: AssetItem[];
  support_assets: AssetItem[];
  created_at: string;
}

export default function AssetsPage() {
  const [forms, setForms] = useState<DiscoveryForm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];
        const response = await fetch('http://localhost:8000/api/intangible/discovery-forms/', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        setForms(data.results || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, []);

  if (loading) {
    return <div className="text-center py-10">در حال بارگذاری...</div>;
  }

  // جمع‌آوری همه دارایی‌ها از همه فرم‌ها
  const allStrategicAssets = forms.flatMap(form => 
    (form.strategic_assets || []).map(asset => ({ ...asset, company: form.company, project: form.project_name, type: 'استراتژیک' }))
  );
  const allOperationalAssets = forms.flatMap(form => 
    (form.operational_assets || []).map(asset => ({ ...asset, company: form.company, project: form.project_name, type: 'عملیاتی' }))
  );
  const allSupportAssets = forms.flatMap(form => 
    (form.support_assets || []).map(asset => ({ ...asset, company: form.company, project: form.project_name, type: 'پشتیبان' }))
  );

  const priorityColors: Record<string, string> = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-700',
  };

  const priorityLabels: Record<string, string> = {
    high: 'بالا',
    medium: 'متوسط',
    low: 'پایین',
  };

  const AssetList = ({ assets, title, icon: Icon }: { assets: any[]; title: string; icon: any }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold">{title} ({assets.length})</h3>
      </div>
      {assets.length === 0 ? (
        <p className="text-gray-500">هیچ دارایی‌ای یافت نشد</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assets.map((asset, idx) => (
            <Card key={idx} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">{asset.name}</CardTitle>
                  <span className={`text-xs px-2 py-1 rounded-full ${priorityColors[asset.priority]}`}>
                    اولویت: {priorityLabels[asset.priority]}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><span className="font-medium">توضیحات:</span> {asset.description || '—'}</p>
                <p><span className="font-medium">منبع کشف:</span> {asset.source || '—'}</p>
                <p><span className="font-medium">شرکت:</span> {asset.company || '—'}</p>
                <p><span className="font-medium">پروژه:</span> {asset.project || '—'}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div dir="rtl" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">دارایی‌های کشف شده</h1>
        <p className="text-sm text-gray-500 mt-1">لیست تمام دارایی‌های نامشهود کشف شده از فرم‌ها</p>
      </div>

      {/* کارت‌های آمار */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg"><TrendingUp className="w-5 h-5 text-blue-600" /></div>
              <div><p className="text-2xl font-bold">{allStrategicAssets.length}</p><p className="text-xs text-gray-500">دارایی استراتژیک</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg"><Package className="w-5 h-5 text-green-600" /></div>
              <div><p className="text-2xl font-bold">{allOperationalAssets.length}</p><p className="text-xs text-gray-500">دارایی عملیاتی</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg"><Shield className="w-5 h-5 text-purple-600" /></div>
              <div><p className="text-2xl font-bold">{allSupportAssets.length}</p><p className="text-xs text-gray-500">دارایی پشتیبان</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* لیست دارایی‌ها */}
      <div className="space-y-8">
        <AssetList assets={allStrategicAssets} title="دارایی‌های استراتژیک" icon={TrendingUp} />
        <AssetList assets={allOperationalAssets} title="دارایی‌های عملیاتی" icon={Package} />
        <AssetList assets={allSupportAssets} title="دارایی‌های پشتیبان" icon={Shield} />
      </div>
    </div>
  );
}
