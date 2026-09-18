'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Save, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface AssetRow {
  name: string;
  description: string;
  source: string;
  priority: 'high' | 'medium' | 'low';
}

export default function NewDiscoveryFormPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // ========== State ==========
  const [formData, setFormData] = useState({
    // اطلاعات کلی
    company: '',
    date: new Date().toISOString().split('T')[0],
    department: '',
    responsible_person: '',
    
    // پروژه کشف
    project_name: '',
    project_goal: '',
    search_scope: '',
    duration: '',
    allocated_resources: '',
    
    // روش‌های کشف
    discovery_methods: {
      documentation: false, reports: false, processes: false, contracts: false,
      instructions: false, projects: false, interviews: false, databases: false,
      knowledge: false, social: false,
    },
    
    // دارایی‌ها
    strategic_assets: [{ name: '', description: '', source: '', priority: 'medium' }] as AssetRow[],
    operational_assets: [{ name: '', description: '', source: '', priority: 'medium' }] as AssetRow[],
    support_assets: [{ name: '', description: '', source: '', priority: 'medium' }] as AssetRow[],
    
    // تحلیل اقتصادی
    economic_patents: '', economic_trademarks: '', economic_copyrights: '',
    economic_business_models: '', economic_customer_data: '', economic_market_data: '',
    
    // تحلیل اجتماعی
    social_csr: '', social_charity: '', social_stakeholders: '', social_business_networks: '',
    
    // تحلیل دانشی
    knowledge_technical: '', knowledge_experiences: '', knowledge_rd_results: '', knowledge_new_tech: '',
    
    // تحلیل فرهنگی
    cultural_values: '', cultural_innovation: '', cultural_brand: '', cultural_image: '',
    
    // تحلیل زیست‌محیطی
    environmental_green_tech: '', environmental_sustainable: '', environmental_carbon: '', environmental_resource: '',
    
    // چالش‌ها و محدودیت‌ها
    challenges: '', limitations: '',
    
    // اقدامات
    actions_immediate: '', actions_medium: '', actions_long: '',
    
    // امضاءها
    prepared_by: '', prepared_signature: '', prepared_date: '',
    reviewed_by: '', reviewed_signature: '', reviewed_date: '',
    approved_by: '', approved_signature: '', approved_date: '',
  });
  
  // ========== Helper Functions ==========
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleCheckboxChange = (key: string, checked: boolean) => {
    setFormData({
      ...formData,
      discovery_methods: { ...formData.discovery_methods, [key]: checked }
    });
  };
  
  const addAssetRow = (type: 'strategic' | 'operational' | 'support') => {
    const newRow = { name: '', description: '', source: '', priority: 'medium' };
    if (type === 'strategic') {
      setFormData({ ...formData, strategic_assets: [...formData.strategic_assets, newRow] });
    } else if (type === 'operational') {
      setFormData({ ...formData, operational_assets: [...formData.operational_assets, newRow] });
    } else {
      setFormData({ ...formData, support_assets: [...formData.support_assets, newRow] });
    }
  };
  
  const removeAssetRow = (type: 'strategic' | 'operational' | 'support', index: number) => {
    if (type === 'strategic') {
      const newRows = [...formData.strategic_assets];
      newRows.splice(index, 1);
      setFormData({ ...formData, strategic_assets: newRows });
    } else if (type === 'operational') {
      const newRows = [...formData.operational_assets];
      newRows.splice(index, 1);
      setFormData({ ...formData, operational_assets: newRows });
    } else {
      const newRows = [...formData.support_assets];
      newRows.splice(index, 1);
      setFormData({ ...formData, support_assets: newRows });
    }
  };
  
  const updateAssetRow = (type: 'strategic' | 'operational' | 'support', index: number, field: keyof AssetRow, value: string) => {
    if (type === 'strategic') {
      const newRows = [...formData.strategic_assets];
      newRows[index][field] = value as any;
      setFormData({ ...formData, strategic_assets: newRows });
    } else if (type === 'operational') {
      const newRows = [...formData.operational_assets];
      newRows[index][field] = value as any;
      setFormData({ ...formData, operational_assets: newRows });
    } else {
      const newRows = [...formData.support_assets];
      newRows[index][field] = value as any;
      setFormData({ ...formData, support_assets: newRows });
    }
  };
  
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];
      const response = await fetch('http://localhost:8000/api/intangible/discovery-forms/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        router.push('/dashboard/intangible/stage2');
      } else {
        const error = await response.json();
        alert('خطا: ' + JSON.stringify(error));
      }
    } catch (error) {
      console.error(error);
      alert('خطا در ثبت فرم');
    } finally {
      setLoading(false);
    }
  };
  
  // ========== Asset Section Component ==========
  const AssetSection = ({ title, type, rows }: { title: string; type: 'strategic' | 'operational' | 'support'; rows: AssetRow[] }) => (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rows.map((row, idx) => (
            <div key={idx} className="border rounded-lg p-4 relative">
              <Button type="button" variant="ghost" size="sm" className="absolute top-2 left-2" onClick={() => removeAssetRow(type, idx)}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
              <div className="grid grid-cols-2 gap-3 mt-6">
                <div>
                  <Label>نام دارایی</Label>
                  <Input value={row.name} onChange={(e) => updateAssetRow(type, idx, 'name', e.target.value)} />
                </div>
                <div>
                  <Label>منبع کشف</Label>
                  <Input value={row.source} onChange={(e) => updateAssetRow(type, idx, 'source', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label>توضیح مختصر</Label>
                  <Textarea rows={2} value={row.description} onChange={(e) => updateAssetRow(type, idx, 'description', e.target.value)} />
                </div>
                <div>
                  <Label>اولویت</Label>
                  <select className="w-full border rounded-lg px-3 py-2" value={row.priority} onChange={(e) => updateAssetRow(type, idx, 'priority', e.target.value as any)}>
                    <option value="high">بالا</option>
                    <option value="medium">متوسط</option>
                    <option value="low">پایین</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => addAssetRow(type)}>
            <Plus className="w-4 h-4 ml-1" /> افزودن دارایی
          </Button>
        </div>
      </CardContent>
    </Card>
  );
  
  // ========== Analysis Section ==========
  const AnalysisSection = ({ title, fields }: { title: string; fields: { key: string; label: string }[] }) => (
    <Card className="mt-4">
      <CardHeader><CardTitle className="text-lg">{title}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field) => (
          <div key={field.key}>
            <Label>{field.label}</Label>
            <Input name={field.key} value={(formData as any)[field.key] || ''} onChange={handleChange} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
  
  return (
    <div dir="rtl" className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1 rounded-lg hover:bg-gray-100">
          <ArrowRight className="w-5 h-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">فرم کشف دارایی‌های نامشهود</h1>
          <p className="text-xs text-gray-500">IA-F-02-01</p>
        </div>
      </div>
      
      <form onSubmit={onSubmit} className="space-y-6">
        {/* ========== اطلاعات کلی ========== */}
        <Card>
          <CardHeader><CardTitle>اطلاعات کلی</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Label>شرکت</Label><Input name="company" value={formData.company} onChange={handleChange} /></div>
            <div><Label>تاریخ</Label><Input type="date" name="date" value={formData.date} onChange={handleChange} /></div>
            <div><Label>واحد/بخش</Label><Input name="department" value={formData.department} onChange={handleChange} /></div>
            <div className="col-span-2"><Label>مسئول تکمیل</Label><Input name="responsible_person" value={formData.responsible_person} onChange={handleChange} /></div>
          </CardContent>
        </Card>
        
        {/* ========== پروژه کشف ========== */}
        <Card>
          <CardHeader><CardTitle>بخش ۱: اطلاعات پروژه کشف</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>نام پروژه کشف</Label><Input name="project_name" value={formData.project_name} onChange={handleChange} /></div>
            <div><Label>هدف کشف</Label><Textarea rows={2} name="project_goal" value={formData.project_goal} onChange={handleChange} /></div>
            <div><Label>محدوده جستجو</Label><Textarea rows={2} name="search_scope" value={formData.search_scope} onChange={handleChange} /></div>
            <div><Label>مدت زمان کشف</Label><Input name="duration" value={formData.duration} onChange={handleChange} /></div>
            <div><Label>منابع اختصاص یافته</Label><Textarea rows={2} name="allocated_resources" value={formData.allocated_resources} onChange={handleChange} /></div>
          </CardContent>
        </Card>
        
        {/* ========== روش‌های کشف ========== */}
        <Card>
          <CardHeader><CardTitle>بخش ۲: روش‌های کشف اعمال شده</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2"><Checkbox checked={formData.discovery_methods.documentation} onCheckedChange={(c) => handleCheckboxChange('documentation', !!c)} /><Label>بررسی مستندات سازمانی</Label></div>
              <div className="flex items-center gap-2"><Checkbox checked={formData.discovery_methods.reports} onCheckedChange={(c) => handleCheckboxChange('reports', !!c)} /><Label>گزارش‌های فنی و تحقیقاتی</Label></div>
              <div className="flex items-center gap-2"><Checkbox checked={formData.discovery_methods.processes} onCheckedChange={(c) => handleCheckboxChange('processes', !!c)} /><Label>تحلیل فرآیندهای کاری</Label></div>
              <div className="flex items-center gap-2"><Checkbox checked={formData.discovery_methods.contracts} onCheckedChange={(c) => handleCheckboxChange('contracts', !!c)} /><Label>مدارک قراردادها و لایسنس‌ها</Label></div>
              <div className="flex items-center gap-2"><Checkbox checked={formData.discovery_methods.instructions} onCheckedChange={(c) => handleCheckboxChange('instructions', !!c)} /><Label>دستورالعمل‌ها و فرآیندهای داخلی</Label></div>
              <div className="flex items-center gap-2"><Checkbox checked={formData.discovery_methods.projects} onCheckedChange={(c) => handleCheckboxChange('projects', !!c)} /><Label>سوابق پروژه‌های R&D</Label></div>
              <div className="flex items-center gap-2"><Checkbox checked={formData.discovery_methods.interviews} onCheckedChange={(c) => handleCheckboxChange('interviews', !!c)} /><Label>مصاحبه با کارشناسان</Label></div>
              <div className="flex items-center gap-2"><Checkbox checked={formData.discovery_methods.databases} onCheckedChange={(c) => handleCheckboxChange('databases', !!c)} /><Label>پایگاه‌های داده</Label></div>
              <div className="flex items-center gap-2"><Checkbox checked={formData.discovery_methods.knowledge} onCheckedChange={(c) => handleCheckboxChange('knowledge', !!c)} /><Label>مدیریت دانش</Label></div>
              <div className="flex items-center gap-2"><Checkbox checked={formData.discovery_methods.social} onCheckedChange={(c) => handleCheckboxChange('social', !!c)} /><Label>شبکه‌های اجتماعی سازمانی</Label></div>
            </div>
          </CardContent>
        </Card>
        
        {/* ========== دارایی‌ها ========== */}
        <AssetSection title="بخش ۳-۱: دارایی‌های استراتژیک" type="strategic" rows={formData.strategic_assets} />
        <AssetSection title="بخش ۳-۲: دارایی‌های عملیاتی" type="operational" rows={formData.operational_assets} />
        <AssetSection title="بخش ۳-۳: دارایی‌های پشتیبان" type="support" rows={formData.support_assets} />
        
        {/* ========== تحلیل‌ها ========== */}
        <AnalysisSection title="بخش ۴-۱: دارایی‌های اقتصادی" fields={[
          { key: 'economic_patents', label: 'پتنت‌ها و اختراعات' },
          { key: 'economic_trademarks', label: 'علائم تجاری' },
          { key: 'economic_copyrights', label: 'کپی‌رایت‌ها' },
          { key: 'economic_business_models', label: 'مدل‌های کسب‌وکار' },
          { key: 'economic_customer_data', label: 'اطلاعات مشتریان' },
          { key: 'economic_market_data', label: 'داده‌های بازار' },
        ]} />
        
        <AnalysisSection title="بخش ۴-۲: دارایی‌های اجتماعی" fields={[
          { key: 'social_csr', label: 'برنامه‌های CSR' },
          { key: 'social_charity', label: 'فعالیت‌های خیریه' },
          { key: 'social_stakeholders', label: 'روابط با ذینفعان' },
          { key: 'social_business_networks', label: 'شبکه‌های تجاری' },
        ]} />
        
        <AnalysisSection title="بخش ۴-۳: دارایی‌های دانشی" fields={[
          { key: 'knowledge_technical', label: 'دانش فنی' },
          { key: 'knowledge_experiences', label: 'تجربیات منحصربه‌فرد' },
          { key: 'knowledge_rd_results', label: 'نتایج پروژه‌های R&D' },
          { key: 'knowledge_new_tech', label: 'فناوری‌های جدید' },
        ]} />
        
        <AnalysisSection title="بخش ۴-۴: دارایی‌های فرهنگی" fields={[
          { key: 'cultural_values', label: 'ارزش‌های مشترک' },
          { key: 'cultural_innovation', label: 'فرهنگ نوآوری' },
          { key: 'cultural_brand', label: 'برند و شهرت' },
          { key: 'cultural_image', label: 'تصویر سازمانی' },
        ]} />
        
        <AnalysisSection title="بخش ۴-۵: دارایی‌های زیست‌محیطی" fields={[
          { key: 'environmental_green_tech', label: 'تکنولوژی‌های سبز' },
          { key: 'environmental_sustainable', label: 'فرآیندهای پایدار' },
          { key: 'environmental_carbon', label: 'استراتژی‌های کاهش کربن' },
          { key: 'environmental_resource', label: 'مدیریت پایدار منابع' },
        ]} />
        
        {/* ========== چالش‌ها ========== */}
        <Card>
          <CardHeader><CardTitle>بخش ۵: چالش‌ها و محدودیت‌ها</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>چالش‌های کشف</Label><Textarea rows={3} name="challenges" value={formData.challenges} onChange={handleChange} /></div>
            <div><Label>محدودیت‌های شناسایی شده</Label><Textarea rows={3} name="limitations" value={formData.limitations} onChange={handleChange} /></div>
          </CardContent>
        </Card>
        
        {/* ========== اقدامات ========== */}
        <Card>
          <CardHeader><CardTitle>بخش ۶: توصیه‌ها و اقدامات بعدی</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>اقدامات فوری</Label><Textarea rows={2} name="actions_immediate" value={formData.actions_immediate} onChange={handleChange} /></div>
            <div><Label>اقدامات میان‌مدت</Label><Textarea rows={2} name="actions_medium" value={formData.actions_medium} onChange={handleChange} /></div>
            <div><Label>اقدامات بلندمدت</Label><Textarea rows={2} name="actions_long" value={formData.actions_long} onChange={handleChange} /></div>
          </CardContent>
        </Card>
        
        {/* ========== امضاءها ========== */}
        <Card>
          <CardHeader><CardTitle>امضاء و تأیید</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div><Label>تهیه‌کننده</Label><Input name="prepared_by" value={formData.prepared_by} onChange={handleChange} /></div>
            <div><Label>امضاء</Label><Input name="prepared_signature" value={formData.prepared_signature} onChange={handleChange} /></div>
            <div><Label>تاریخ</Label><Input type="date" name="prepared_date" value={formData.prepared_date} onChange={handleChange} /></div>
            
            <div><Label>بررسی‌کننده</Label><Input name="reviewed_by" value={formData.reviewed_by} onChange={handleChange} /></div>
            <div><Label>امضاء</Label><Input name="reviewed_signature" value={formData.reviewed_signature} onChange={handleChange} /></div>
            <div><Label>تاریخ</Label><Input type="date" name="reviewed_date" value={formData.reviewed_date} onChange={handleChange} /></div>
            
            <div><Label>تأییدکننده</Label><Input name="approved_by" value={formData.approved_by} onChange={handleChange} /></div>
            <div><Label>امضاء</Label><Input name="approved_signature" value={formData.approved_signature} onChange={handleChange} /></div>
            <div><Label>تاریخ</Label><Input type="date" name="approved_date" value={formData.approved_date} onChange={handleChange} /></div>
          </CardContent>
        </Card>
        
        {/* ========== دکمه‌ها ========== */}
        <div className="flex gap-3 sticky bottom-4 bg-white p-4 rounded-lg shadow-lg">
          <Button type="submit" disabled={loading} className="flex-1">
            <Save className="w-4 h-4 ml-2" />
            {loading ? 'در حال ثبت...' : 'ثبت فرم'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>انصراف</Button>
        </div>
      </form>
    </div>
  );
}
