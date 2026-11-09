'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Filter, Plus, Edit, Trash2, Users, AlertTriangle,
  CheckCircle, XCircle, Building2, Globe, Star, X, Save,
  Ban, ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const toFa = (num: any): string => {
  if (num === null || num === undefined) return '—';
  return String(num).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
};

interface Partner {
  id: number;
  name: string;
  name_en: string;
  partner_type: string;
  partner_type_display: string;
  country: string;
  industry: string;
  financial_capacity_score: number;
  track_record_score: number;
  strategic_alignment_score: number;
  market_access_score: number;
  reputation_score: number;
  weighted_score: number;
  has_conflict_of_interest: boolean;
  has_contract_breach_history: boolean;
  is_sanctioned: boolean;
  is_blacklisted: boolean;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const PARTNER_TYPES = [
  { value: 'licensee', label: 'مجوزگیرنده' },
  { value: 'jv', label: 'شریک JV' },
  { value: 'acquirer', label: 'خریدار کامل' },
  { value: 'franchisee', label: 'فرنچایزگیرنده' },
  { value: 'service_consumer', label: 'مصرف‌کننده خدمات' },
];

const EMPTY_FORM: Partial<Partner> = {
  name: '',
  name_en: '',
  partner_type: 'licensee',
  country: '',
  industry: '',
  financial_capacity_score: 50,
  track_record_score: 50,
  strategic_alignment_score: 50,
  market_access_score: 50,
  reputation_score: 50,
  has_conflict_of_interest: false,
  has_contract_breach_history: false,
  is_sanctioned: false,
  contact_person: '',
  contact_email: '',
  contact_phone: '',
  notes: '',
  is_active: true,
};

export default function PartnersPage() {
  const router = useRouter();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [form, setForm] = useState<Partial<Partner>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/intangible/engine/commercialization/partners/');
      setPartners(data.results || data || []);
    } catch (error) {
      console.error(error);
      toast.error('خطا در بارگذاری شرکا');
    } finally {
      setLoading(false);
    }
  };

  const openForm = (partner?: Partner) => {
    if (partner) {
      setEditing(partner);
      setForm({ ...partner });
    } else {
      setEditing(null);
      setForm({ ...EMPTY_FORM });
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm({ ...EMPTY_FORM });
  };

  const handleSave = async () => {
    if (!form.name?.trim()) {
      toast.error('نام شریک الزامی است');
      return;
    }
    try {
      setSaving(true);
      if (editing) {
        await api.put(`/intangible/engine/commercialization/partners/${editing.id}/`, form);
        toast.success('شریک به‌روزرسانی شد');
      } else {
        await api.post('/intangible/engine/commercialization/partners/', form);
        toast.success('شریک جدید اضافه شد');
      }
      closeForm();
      fetchPartners();
    } catch (error: any) {
      console.error(error);
      const detail = error?.response?.data?.detail || error?.response?.data?.name?.[0] || 'خطا در ذخیره';
      toast.error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (partner: Partner) => {
    if (!confirm(`حذف شریک «${partner.name}»؟`)) return;
    try {
      await api.delete(`/intangible/engine/commercialization/partners/${partner.id}/`);
      toast.success('شریک حذف شد');
      fetchPartners();
    } catch {
      toast.error('خطا در حذف');
    }
  };

  const filtered = partners.filter((p) => {
    if (search) {
      const s = search.toLowerCase();
      if (
        !p.name.toLowerCase().includes(s) &&
        !(p.name_en || '').toLowerCase().includes(s) &&
        !(p.industry || '').toLowerCase().includes(s)
      ) return false;
    }
    if (typeFilter && p.partner_type !== typeFilter) return false;
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
          <h1 className="text-2xl font-bold">پایگاه شرکای تجاری</h1>
          <p className="text-sm text-gray-500 mt-1">
            {toFa(partners.length)} شریک در پایگاه
          </p>
        </div>
        <Button onClick={() => openForm()} className="gap-2">
          <Plus className="w-4 h-4" />
          شریک جدید
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="جستجوی نام، صنعت..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-10 pl-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg"
        >
          <option value="">همه انواع</option>
          {PARTNER_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>هیچ شریکی یافت نشد</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <Card
              key={p.id}
              className={`relative overflow-hidden hover:shadow-md transition-all ${
                p.is_blacklisted ? 'border-red-300 bg-red-50/30' : ''
              }`}
            >
              {/* رنگ بالای کارت */}
              <div className={`h-1 ${
                p.is_blacklisted ? 'bg-red-500' :
                p.weighted_score >= 80 ? 'bg-green-500' :
                p.weighted_score >= 60 ? 'bg-amber-500' : 'bg-gray-400'
              }`}></div>

              <CardContent className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm">{p.name}</h3>
                      {p.is_blacklisted && (
                        <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
                          🚫 لیست سیاه
                        </span>
                      )}
                    </div>
                    {p.name_en && (
                      <div className="text-xs text-gray-500 mt-0.5">{p.name_en}</div>
                    )}
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      p.weighted_score >= 80 ? 'text-green-600' :
                      p.weighted_score >= 60 ? 'text-amber-600' : 'text-gray-500'
                    }`}>
                      {toFa(p.weighted_score.toFixed(0))}
                    </div>
                    <div className="text-[10px] text-gray-500">امتیاز</div>
                  </div>
                </div>

                {/* Type & Country */}
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                    {p.partner_type_display || p.partner_type}
                  </span>
                  {p.country && (
                    <span className="flex items-center gap-1 text-gray-600">
                      <Globe className="w-3 h-3" />
                      {p.country}
                    </span>
                  )}
                </div>

                {/* Industry */}
                {p.industry && (
                  <div className="text-xs text-gray-500">
                    <Building2 className="w-3 h-3 inline mr-1" />
                    {p.industry}
                  </div>
                )}

                {/* Scores */}
                <div className="grid grid-cols-5 gap-1 text-center text-[10px]">
                  <div>
                    <div className="text-gray-500">مالی</div>
                    <div className="font-bold">{toFa(p.financial_capacity_score)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">سابقه</div>
                    <div className="font-bold">{toFa(p.track_record_score)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">هم‌راستا</div>
                    <div className="font-bold">{toFa(p.strategic_alignment_score)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">بازار</div>
                    <div className="font-bold">{toFa(p.market_access_score)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">اعتبار</div>
                    <div className="font-bold">{toFa(p.reputation_score)}</div>
                  </div>
                </div>

                {/* Blacklist Flags */}
                {p.is_blacklisted && (
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    {p.has_conflict_of_interest && (
                      <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded">تعارض منافع</span>
                    )}
                    {p.has_contract_breach_history && (
                      <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded">نقض قرارداد</span>
                    )}
                    {p.is_sanctioned && (
                      <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded">تحریم</span>
                    )}
                  </div>
                )}

                {/* Contact */}
                {(p.contact_person || p.contact_email) && (
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    {p.contact_person && <div>👤 {p.contact_person}</div>}
                    {p.contact_email && <div className="truncate">📧 {p.contact_email}</div>}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openForm(p)}
                    className="flex-1 text-xs gap-1"
                  >
                    <Edit className="w-3 h-3" />
                    ویرایش
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(p)}
                    className="text-red-600 hover:bg-red-50 text-xs"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold">
                {editing ? 'ویرایش شریک' : 'شریک جدید'}
              </h2>
              <button onClick={closeForm} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* اطلاعات پایه */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    نام فارسی *
                  </label>
                  <input
                    type="text"
                    value={form.name || ''}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    نام انگلیسی
                  </label>
                  <input
                    type="text"
                    value={form.name_en || ''}
                    onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    نوع شریک
                  </label>
                  <select
                    value={form.partner_type || 'licensee'}
                    onChange={(e) => setForm({ ...form, partner_type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    {PARTNER_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    کشور
                  </label>
                  <input
                    type="text"
                    value={form.country || ''}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-gray-700 block mb-1">
                    صنعت
                  </label>
                  <input
                    type="text"
                    value={form.industry || ''}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* امتیازها */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-bold mb-3">امتیازدهی (۰-۱۰۰)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { key: 'financial_capacity_score', label: 'توان مالی' },
                    { key: 'track_record_score', label: 'سابقه' },
                    { key: 'strategic_alignment_score', label: 'هم‌راستایی راهبردی' },
                    { key: 'market_access_score', label: 'دسترسی به بازار' },
                    { key: 'reputation_score', label: 'اعتبار' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="text-xs font-medium text-gray-700 block mb-1 flex items-center justify-between">
                        <span>{label}</span>
                        <span className="text-blue-600 font-bold">{toFa(form[key as keyof Partner] as number || 0)}</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={(form[key as keyof Partner] as number) || 0}
                        onChange={(e) => setForm({ ...form, [key]: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* پرچم‌های منع */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-1">
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  پرچم‌های منع
                </h3>
                <div className="space-y-2">
                  {[
                    { key: 'has_conflict_of_interest', label: 'تعارض منافع' },
                    { key: 'has_contract_breach_history', label: 'سابقه نقض قرارداد' },
                    { key: 'is_sanctioned', label: 'تحریم‌شده' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(form[key as keyof Partner] as boolean) || false}
                        onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                        className="w-4 h-4"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* تماس */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-bold mb-3">اطلاعات تماس</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">شخص تماس</label>
                    <input
                      type="text"
                      value={form.contact_person || ''}
                      onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">ایمیل</label>
                    <input
                      type="email"
                      value={form.contact_email || ''}
                      onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      dir="ltr"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-gray-700 block mb-1">تلفن</label>
                    <input
                      type="text"
                      value={form.contact_phone || ''}
                      onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              {/* یادداشت */}
              <div className="border-t pt-4">
                <label className="text-xs font-medium text-gray-700 block mb-1">یادداشت</label>
                <textarea
                  value={form.notes || ''}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                  rows={3}
                />
              </div>
            </div>

            <div className="p-4 border-t flex gap-2 justify-end sticky bottom-0 bg-white">
              <Button variant="outline" onClick={closeForm}>انصراف</Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                <Save className="w-4 h-4" />
                {saving ? 'در حال ذخیره...' : (editing ? 'به‌روزرسانی' : 'ایجاد')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
