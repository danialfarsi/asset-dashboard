'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowRight, Save, Plus, X, Building2, Factory, Server, Layers } from 'lucide-react';

interface ScreeningItem {
  id: number;
  item_name: string;
  category: string;
  category_label: string;
  default_result: string;
  result_label: string;
}

interface AssetEntry {
  id: string;
  name: string;
}

interface OrganizationType {
  id: number;
  name: string;
  display_name: string;
}

const orgIcons = {
  manufacturing: Factory,
  service: Building2,
  rto: Server,
  holding: Layers,
};

const orgTypeLabels: Record<string, string> = {
  manufacturing: 'تولیدی',
  service: 'خدماتی',
  rto: 'پژوهش و فناوری (RTO)',
  holding: 'هلدینگ',
};

export default function NewScreeningPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const orgType = searchParams.get('type') || '';
  
  const [items, setItems] = useState<ScreeningItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [assetEntries, setAssetEntries] = useState<Record<number, AssetEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orgDisplayName, setOrgDisplayName] = useState('');

  useEffect(() => {
    if (orgType) {
      fetchOrgType();
      fetchItems();
    }
  }, [orgType]);

  const fetchOrgType = async () => {
    try {
      const { data } = await api.get('/intangible/organization-types/');
      const types = data.results || data || [];
      const found = types.find((t: any) => t.name === orgType);
      if (found) {
        setOrgDisplayName(found.display_name);
      } else {
        setOrgDisplayName(orgTypeLabels[orgType] || orgType);
      }
    } catch (error) {
      console.error('Error fetching org type:', error);
      setOrgDisplayName(orgTypeLabels[orgType] || orgType);
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/intangible/screening-templates/?organization_type=${orgType}`);
      const itemsData = data.results || data || [];
      setItems(itemsData);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(id)) {
      newSet.delete(id);
      const newEntries = { ...assetEntries };
      delete newEntries[id];
      setAssetEntries(newEntries);
    } else {
      newSet.add(id);
      setAssetEntries({
        ...assetEntries,
        [id]: [{ id: `asset-${id}-${Date.now()}`, name: '' }]
      });
    }
    setSelectedItems(newSet);
  };

  const addAssetEntry = (templateId: number) => {
    setAssetEntries({
      ...assetEntries,
      [templateId]: [
        ...(assetEntries[templateId] || []),
        { id: `asset-${templateId}-${Date.now()}`, name: '' }
      ]
    });
  };

  const removeAssetEntry = (templateId: number, entryId: string) => {
    const entries = assetEntries[templateId] || [];
    if (entries.length <= 1) {
      alert('حداقل یک دارایی باید وارد شود');
      return;
    }
    setAssetEntries({
      ...assetEntries,
      [templateId]: entries.filter(e => e.id !== entryId)
    });
  };

  const updateAssetName = (templateId: number, entryId: string, value: string) => {
    const entries = assetEntries[templateId] || [];
    setAssetEntries({
      ...assetEntries,
      [templateId]: entries.map(e => 
        e.id === entryId ? { ...e, name: value } : e
      )
    });
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'strategic_economic': 'استراتژیک - اقتصادی',
      'strategic_social': 'استراتژیک - اجتماعی',
      'strategic_knowledge': 'استراتژیک - دانشی',
      'strategic_cultural': 'استراتژیک - فرهنگی',
      'strategic_environmental': 'استراتژیک - زیست‌محیطی',
      'operational_economic': 'عملیاتی - اقتصادی',
      'operational_social': 'عملیاتی - اجتماعی',
      'operational_knowledge': 'عملیاتی - دانشی',
      'operational_cultural': 'عملیاتی - فرهنگی',
      'operational_environmental': 'عملیاتی - زیست‌محیطی',
      'support_economic': 'پشتیبان - اقتصادی',
      'support_social': 'پشتیبان - اجتماعی',
      'support_knowledge': 'پشتیبان - دانشی',
      'support_cultural': 'پشتیبان - فرهنگی',
      'support_environmental': 'پشتیبان - زیست‌محیطی',
    };
    return labels[category] || category;
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'confirmed':
        return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">دارایی قطعی</span>;
      case 'conditional':
        return <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs">مشروط</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">رد شده</span>;
      default:
        return null;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const missingNames = [];
      for (const [templateId, entries] of Object.entries(assetEntries)) {
        for (const entry of entries) {
          if (!entry.name || entry.name.trim() === '') {
            const item = items.find(i => i.id === Number(templateId));
            missingNames.push(item?.item_name);
            break;
          }
        }
      }
      
      if (missingNames.length > 0) {
        alert(`لطفاً برای همه دارایی‌ها نام وارد کنید:\n${missingNames.join('\n')}`);
        setSubmitting(false);
        return;
      }
      
      for (const [templateId, entries] of Object.entries(assetEntries)) {
        const item = items.find(i => i.id === Number(templateId));
        if (!item) continue;
        
        for (const entry of entries) {
          await api.post('/intangible/screened-assets/', {
            asset_name: entry.name,
            category: item.category,
            result: item.default_result,
            description: `غربالگری شده از مورد: ${item.item_name}`,
          });
        }
      }
      
      router.push('/dashboard/intangible/screening/list');
    } catch (error) {
      console.error(error);
      alert('خطا در ثبت دارایی‌ها');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className="mr-3">در حال بارگذاری...</span>
      </div>
    );
  }

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ScreeningItem[]>);

  const totalAssets = Object.values(assetEntries).reduce((sum, entries) => sum + entries.length, 0);

  // آیکون مناسب برای نوع سازمان
  const OrgIcon = orgIcons[orgType as keyof typeof orgIcons] || Building2;

  return (
    <div dir="rtl" className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1 rounded-lg hover:bg-gray-100">
            <ArrowRight className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">غربالگری دارایی‌های نامشهود</h1>
            <p className="text-xs text-gray-500">مواردی که سازمان شما دارد را تیک بزنید و نام دارایی را وارد کنید</p>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          <span className="font-bold text-blue-600">{totalAssets}</span> دارایی انتخاب شده
        </div>
      </div>

      {/* نمایش نوع سازمان */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <OrgIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">نوع سازمان شما</p>
              <p className="text-lg font-bold text-blue-700">
                {orgDisplayName || orgTypeLabels[orgType] || orgType}
              </p>
            </div>
            {user?.organization_name && (
              <div className="mr-auto text-sm text-gray-500 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                {user.organization_name}
                {user?.department_name && (
                  <span className="text-gray-400">• {user.department_name}</span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-gray-500">
            <p>هیچ موردی برای این نوع سازمان یافت نشد</p>
            <p className="text-sm mt-2">لطفاً نوع سازمان دیگری را انتخاب کنید</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedItems).map(([category, categoryItems]) => (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{getCategoryLabel(category)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {categoryItems.map((item) => {
                const isSelected = selectedItems.has(item.id);
                const entries = assetEntries[item.id] || [];
                
                return (
                  <div key={item.id} className="border rounded-lg p-3 hover:bg-gray-50">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(item.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.item_name}</span>
                          {getResultBadge(item.default_result)}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          <span className="ml-2">✓ غیرفیزیکی</span>
                          <span className="ml-2">✓ شناسایی‌پذیر</span>
                          <span className="ml-2">✓ قابل کنترل</span>
                          <span>✓ ارزش‌آفرین</span>
                        </div>
                      </div>
                    </div>
                    
                    {isSelected && (
                      <div className="mt-3 mr-8 space-y-2">
                        {entries.map((entry) => (
                          <div key={entry.id} className="flex items-center gap-2">
                            <Input
                              placeholder="نام دارایی را وارد کنید..."
                              value={entry.name}
                              onChange={(e) => updateAssetName(item.id, entry.id, e.target.value)}
                              className="text-sm flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAssetEntry(item.id, entry.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addAssetEntry(item.id)}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Plus className="w-4 h-4 ml-1" />
                          افزودن دارایی دیگر
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex gap-3">
          <Button 
            onClick={handleSubmit} 
            disabled={totalAssets === 0 || submitting}
            className="flex-1"
          >
            <Save className="w-4 h-4 ml-2" />
            {submitting ? 'در حال ثبت...' : `ثبت ${totalAssets} دارایی`}
          </Button>
          <Button variant="outline" onClick={() => router.back()}>انصراف</Button>
        </div>
      </div>
    </div>
  );
}
