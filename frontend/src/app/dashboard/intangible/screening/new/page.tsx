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
  asset_type_id?: number;
  valuation_method?: string;
}

interface AssetEntry {
  id: string;
  name: string;
  valuationType: 'DCF' | 'NAV' | '';
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
      // 🎯 موازی به جای waterfall
      Promise.all([fetchOrgType(), fetchItems()]);
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
        [id]: [{ 
          id: `asset-${id}-${Date.now()}`, 
          name: '',
          valuationType: ''
        }]
      });
    }
    setSelectedItems(newSet);
  };

  const addAssetEntry = (templateId: number) => {
    setAssetEntries({
      ...assetEntries,
      [templateId]: [
        ...(assetEntries[templateId] || []),
        { 
          id: `asset-${templateId}-${Date.now()}`, 
          name: '',
          valuationType: ''
        }
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

  const updateValuationType = (templateId: number, entryId: string, value: 'DCF' | 'NAV') => {
    const entries = assetEntries[templateId] || [];
    setAssetEntries({
      ...assetEntries,
      [templateId]: entries.map(e => 
        e.id === entryId ? { ...e, valuationType: value } : e
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
      const missingNames: string[] = [];
      const missingTypes: string[] = [];
      
      for (const [templateId, entries] of Object.entries(assetEntries)) {
        const item = items.find(i => i.id === Number(templateId));
        
        for (const entry of entries) {
          if (!entry.name || entry.name.trim() === '') {
            missingNames.push(item?.item_name || 'بدون نام');
          }
          if (!entry.valuationType) {
            missingTypes.push(`${item?.item_name || 'بدون نام'} - ${entry.name || 'بدون نام'}`);
          }
        }
      }
      
      if (missingNames.length > 0) {
        alert(`لطفاً برای همه دارایی‌ها نام وارد کنید:\n${missingNames.join('\n')}`);
        setSubmitting(false);
        return;
      }
      
      if (missingTypes.length > 0) {
        alert(`لطفاً نوع ارزش‌گذاری (DCF یا NAV) را برای همه دارایی‌ها انتخاب کنید:\n${missingTypes.join('\n')}`);
        setSubmitting(false);
        return;
      }
      
      // 🎯 ساخت لیست assets
      const assetsToCreate: any[] = [];
      
      for (const [templateId, entries] of Object.entries(assetEntries)) {
        const item = items.find(i => i.id === Number(templateId));
        if (!item) continue;
        
        for (const entry of entries) {
          assetsToCreate.push({
            asset_name: entry.name,
            category: item.category,
            result: item.default_result,
            description: `غربالگری شده از مورد: ${item.item_name}`,
            template_id: Number(templateId),
            asset_type_id: (item as any).asset_type_id,
            valuation_method: (item as any).valuation_method,
            valuation_type: entry.valuationType,
          });
        }
      }
      
      console.log(`📤 ارسال ${assetsToCreate.length} دارایی به bulk-create...`);
      
      // 🎯 فقط یه API call
      const response = await api.post('/intangible/screening/bulk-create/', {
        assets: assetsToCreate,
      });
      
      const data = response.data;
      console.log(`✅ ${data.created_count} دارایی ساخته شد`);
      
      if (data.error_count > 0) {
        console.warn('خطاها:', data.errors);
        alert(`⚠️ ${data.created_count} دارایی ساخته شد، ولی ${data.error_count} خطا داشت.`);
      }
      
      router.push('/dashboard/intangible/screening/list');
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.error || 'خطا در ثبت دارایی‌ها');
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
  
  const incompleteCount = Object.values(assetEntries)
    .flat()
    .filter(e => !e.name || !e.valuationType).length;

  const OrgIcon = orgIcons[orgType as keyof typeof orgIcons] || Building2;

  return (
    <div dir="rtl" className="min-h-screen space-y-6 bg-gradient-to-b from-[#f7fbfa] via-white to-[#f8faf9] pb-36 font-[family-name:var(--font-vazir)]">

      {/* Page Hero */}
      <section className="relative overflow-hidden rounded-[30px] border border-slate-200/80 bg-white p-5 shadow-[0_14px_45px_rgba(15,23,42,0.055)] sm:p-7">
        <div className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full bg-emerald-100/60 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-blue-100/40 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <button
              onClick={() => router.back()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:text-dark-green"
            >
              <ArrowRight className="h-5 w-5" />
            </button>

            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-700">INTANGIBLE ASSET SCREENING</span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold text-slate-500">مرحله شناسایی دارایی</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">غربالگری دارایی‌های نامشهود</h1>
              <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-500 sm:text-sm">
                موارد موجود در سازمان را انتخاب کنید، دارایی‌های مرتبط را تعریف کنید و روش ارزش‌گذاری مناسب هر دارایی را مشخص نمایید.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[290px]">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
              <p className="text-[10px] font-bold text-slate-400">دارایی‌های انتخاب‌شده</p>
              <p className="mt-1 text-2xl font-black text-dark-green">{totalAssets}</p>
            </div>
            <div className={`rounded-2xl border p-4 ${incompleteCount > 0 ? 'border-amber-100 bg-amber-50/60' : 'border-emerald-100 bg-emerald-50/60'}`}>
              <p className="text-[10px] font-bold text-slate-400">نیازمند تکمیل</p>
              <p className={`mt-1 text-2xl font-black ${incompleteCount > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>{incompleteCount}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Organization Context */}
      <section className="relative overflow-hidden rounded-[26px] border border-emerald-100 bg-gradient-to-l from-emerald-50/80 via-white to-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.035)] sm:p-6">
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-dark-green text-white shadow-lg shadow-emerald-950/10">
            <OrgIcon className="h-6 w-6" />
          </div>

          <div>
            <p className="text-[10px] font-bold tracking-wide text-slate-400">نوع سازمان</p>
            <p className="mt-1 text-lg font-black text-dark-green">
              {orgDisplayName || orgTypeLabels[orgType] || orgType}
            </p>
          </div>

          {user?.organization_name && (
            <div className="sm:mr-auto">
              <div className="inline-flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-xs font-bold text-slate-600 shadow-sm">
                <Building2 className="h-4 w-4 text-emerald-700" />
                <span>{user.organization_name}</span>
                {user?.department_name && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    <span className="text-slate-400">{user.department_name}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Screening Content */}
      {items.length === 0 ? (
        <section className="rounded-[28px] border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
            <Layers className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-black text-slate-700">موردی برای غربالگری پیدا نشد</h3>
          <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-slate-400">
            برای این نوع سازمان قالب غربالگری تعریف نشده است. نوع سازمان دیگری را انتخاب کنید.
          </p>
        </section>
      ) : (
        <div className="space-y-5">
          {Object.entries(groupedItems).map(([category, categoryItems], categoryIndex) => {
            const selectedInCategory = categoryItems.filter(item => selectedItems.has(item.id)).length;

            return (
              <Card
                key={category}
                className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_10px_35px_rgba(15,23,42,0.045)]"
              >
                <CardHeader className="border-b border-slate-100 bg-gradient-to-l from-slate-50/80 to-white px-5 py-5 sm:px-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-dark-green/[0.07] text-sm font-black text-dark-green">
                        {String(categoryIndex + 1).padStart(2, '0')}
                      </div>
                      <div>
                        <CardTitle className="text-base font-black text-slate-800">
                          {getCategoryLabel(category)}
                        </CardTitle>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {categoryItems.length} معیار غربالگری در این گروه
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-500">
                        {selectedInCategory} انتخاب‌شده
                      </span>
                      {selectedInCategory > 0 && (
                        <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_5px_rgba(16,185,129,.10)]" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 p-4 sm:p-5">
                  {categoryItems.map((item) => {
                    const isSelected = selectedItems.has(item.id);
                    const entries = assetEntries[item.id] || [];

                    return (
                      <div
                        key={item.id}
                        className={`relative overflow-hidden rounded-[22px] border transition-all duration-200 ${
                          isSelected
                            ? 'border-emerald-200 bg-gradient-to-l from-emerald-50/70 via-white to-white shadow-[0_8px_24px_rgba(5,150,105,.07)]'
                            : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md'
                        }`}
                      >
                        {isSelected && <div className="absolute bottom-0 right-0 top-0 w-1 bg-emerald-500" />}

                        <div className="p-4 sm:p-5">
                          <div className="flex items-start gap-3 sm:gap-4">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelect(item.id)}
                              className="mt-1 h-5 w-5 rounded-md border-slate-300 data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600"
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`text-sm font-black ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                                  {item.item_name}
                                </span>
                                {getResultBadge(item.default_result)}
                              </div>

                              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] font-bold text-slate-400">
                                {['غیرفیزیکی', 'شناسایی‌پذیر', 'قابل کنترل', 'ارزش‌آفرین'].map(label => (
                                  <span key={label} className="inline-flex items-center gap-1">
                                    <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-50 text-[8px] text-emerald-600">✓</span>
                                    {label}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <span className={`hidden rounded-full px-2.5 py-1 text-[9px] font-black sm:inline-flex ${
                              isSelected ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {isSelected ? 'فعال' : 'انتخاب نشده'}
                            </span>
                          </div>

                          {isSelected && (
                            <div className="mr-0 mt-5 border-t border-emerald-100/80 pt-5 sm:mr-9">
                              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <p className="text-xs font-black text-slate-700">دارایی‌های مرتبط</p>
                                  <p className="mt-0.5 text-[10px] text-slate-400">نام دارایی و مدل ارزش‌گذاری آن را مشخص کنید.</p>
                                </div>
                                <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-bold text-slate-500 shadow-sm ring-1 ring-slate-200">
                                  {entries.length} دارایی
                                </span>
                              </div>

                              <div className="space-y-2.5">
                                {entries.map((entry, entryIndex) => (
                                  <div
                                    key={entry.id}
                                    className="grid grid-cols-1 gap-2.5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:grid-cols-[38px_minmax(220px,1fr)_280px_38px] lg:items-center"
                                  >
                                    <div className="hidden h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-[10px] font-black text-slate-500 lg:flex">
                                      {entryIndex + 1}
                                    </div>

                                    <div className="relative">
                                      <Input
                                        placeholder="نام دارایی را وارد کنید..."
                                        value={entry.name}
                                        onChange={(e) => updateAssetName(item.id, entry.id, e.target.value)}
                                        className={`h-11 rounded-xl bg-white px-3 text-sm font-medium shadow-none transition-colors focus-visible:ring-2 focus-visible:ring-emerald-100 ${
                                          !entry.name ? 'border-amber-200 focus-visible:border-amber-300' : 'border-slate-200 focus-visible:border-emerald-300'
                                        }`}
                                      />
                                    </div>

                                    <select
                                      value={entry.valuationType}
                                      onChange={(e) => updateValuationType(item.id, entry.id, e.target.value as 'DCF' | 'NAV')}
                                      className={`h-11 w-full rounded-xl border bg-white px-3 text-xs font-bold text-slate-600 outline-none transition-all focus:ring-2 focus:ring-emerald-100 ${
                                        !entry.valuationType
                                          ? 'border-amber-200 bg-amber-50/40'
                                          : 'border-slate-200 focus:border-emerald-300'
                                      }`}
                                    >
                                      <option value="" disabled>نوع ارزش‌گذاری را انتخاب کنید...</option>
                                      <option value="DCF">DCF — جریان نقدی تنزیل‌شده</option>
                                      <option value="NAV">NAV — ارزش خالص دارایی</option>
                                    </select>

                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeAssetEntry(item.id, entry.id)}
                                      className="h-10 w-10 rounded-xl p-0 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                      title="حذف دارایی"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>

                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addAssetEntry(item.id)}
                                className="mt-3 h-10 rounded-xl border-dashed border-emerald-200 bg-emerald-50/40 px-4 text-xs font-black text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50"
                              >
                                <Plus className="ml-1.5 h-4 w-4" />
                                افزودن دارایی دیگر
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/80 bg-white/90 px-4 py-3 shadow-[0_-12px_35px_rgba(15,23,42,.07)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {totalAssets === 0 ? (
              <>
                <p className="text-xs font-black text-slate-600">هنوز دارایی‌ای انتخاب نشده است</p>
                <p className="mt-0.5 text-[10px] text-slate-400">حداقل یک مورد را از فهرست بالا انتخاب کنید.</p>
              </>
            ) : incompleteCount > 0 ? (
              <>
                <p className="text-xs font-black text-amber-700">{incompleteCount} دارایی نیازمند تکمیل است</p>
                <p className="mt-0.5 text-[10px] text-slate-400">نام دارایی و نوع ارزش‌گذاری را برای همه موارد مشخص کنید.</p>
              </>
            ) : (
              <>
                <p className="flex items-center gap-2 text-xs font-black text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  اطلاعات آماده ثبت است
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">{totalAssets} دارایی تکمیل شده است.</p>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="h-11 rounded-xl border-slate-200 px-5 font-bold text-slate-600 hover:bg-slate-50"
            >
              انصراف
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={totalAssets === 0 || submitting || incompleteCount > 0}
              className="h-11 min-w-[180px] rounded-xl bg-dark-green px-6 font-black text-white shadow-lg shadow-emerald-950/10 hover:bg-dark-green/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="ml-2 h-4 w-4" />
              {submitting ? 'در حال ثبت...' : `ثبت ${totalAssets} دارایی`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
