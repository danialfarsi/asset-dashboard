'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Trash2, 
  Upload, 
  X, 
  FileText, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Users,
  GraduationCap,
  Briefcase,
  DollarSign,
  TrendingUp,
  UserPlus,
  CalendarClock
} from 'lucide-react';
import api from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface TeamMember {
  id: number;
  role: string;
  headcount: number;
  recruit_cost: number;
  train_cost: number;
  avg_salary: number;
}

interface ExpertSignoff {
  id: number;
  expert_name: string;
  signature_date: string;
  notes: string;
}

interface M07_TWCProps {
  formData: any;
  onChange: (data: any) => void;
  assetId?: number;
  valuationCaseId?: number;
  step2Data?: any;
}

export function M07_TWC({ formData, onChange, assetId, valuationCaseId, step2Data }: M07_TWCProps) {
  const [files, setFiles] = useState<Record<string, File>>({});
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [prevValuationCaseId, setPrevValuationCaseId] = useState<number | undefined>(undefined);
  const [showDetails, setShowDetails] = useState(false);

  // ============================================
  // نقش‌های پیشنهادی
  // ============================================
  const ROLES = [
    { value: 'senior_developer', label: 'توسعه‌دهنده ارشد (Senior Developer)' },
    { value: 'developer', label: 'توسعه‌دهنده (Developer)' },
    { value: 'project_manager', label: 'مدیر پروژه (Project Manager)' },
    { value: 'qa_engineer', label: 'مهندس کیفیت (QA Engineer)' },
    { value: 'devops', label: 'متخصص DevOps' },
    { value: 'data_scientist', label: 'دانشمند داده (Data Scientist)' },
    { value: 'ui_ux_designer', label: 'طراح UI/UX' },
    { value: 'business_analyst', label: 'تحلیل‌گر کسب‌وکار (Business Analyst)' },
    { value: 'product_owner', label: 'محصول‌دار (Product Owner)' },
    { value: 'scrum_master', label: 'اسکرام مستر (Scrum Master)' },
    { value: 'technical_lead', label: 'رهبر فنی (Technical Lead)' },
    { value: 'architect', label: 'معمار سیستم (Architect)' },
  ];

  // ============================================
  // تبدیل اعداد به فارسی (برای نمایش)
  // ============================================
  const toPersianDigit = (num: any): string => {
    if (num === undefined || num === null || isNaN(num)) return '۰';
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    return String(num).replace(/\d/g, (d) => persianDigits[parseInt(d)]);
  };

  const formatNumber = (num: any): string => {
    if (num === undefined || num === null || isNaN(num)) return '۰';
    const parts = Math.round(num).toString().split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    return integerPart.replace(/\d/g, (d) => persianDigits[parseInt(d)]);
  };

  // ============================================
  // تشخیص تغییر دارایی
  // ============================================
  useEffect(() => {
    if (valuationCaseId && valuationCaseId !== prevValuationCaseId) {
      const hasExistingData = formData.team_members && formData.team_members.length > 0;
      
      if (!hasExistingData) {
        setInitialized(false);
        onChange({
          team_members: [
            { id: 1, role: 'senior_developer', headcount: 2, recruit_cost: 20000000, train_cost: 10000000, avg_salary: 80000000 },
            { id: 2, role: 'developer', headcount: 5, recruit_cost: 15000000, train_cost: 8000000, avg_salary: 60000000 },
            { id: 3, role: 'project_manager', headcount: 1, recruit_cost: 25000000, train_cost: 12000000, avg_salary: 100000000 },
          ],
          ramp_up_duration: 6,
          productivity_loss: 30,
          turnover_rate: 8,
          expert_signoffs: [],
        });
      }
      
      setPrevValuationCaseId(valuationCaseId);
    }
  }, [valuationCaseId, formData.team_members]);

  // ============================================
  // مقداردهی اولیه با داده‌های STEP 2 (فقط فیلدهای مشترک)
  // ============================================
  useEffect(() => {
    if (step2Data && !initialized) {
      const updates: any = {};
      
      if (formData.discount_rate === undefined && step2Data.discount_rate) {
        updates.discount_rate = step2Data.discount_rate;
      }
      if (formData.tax_rate === undefined && step2Data.tax_rate) {
        updates.tax_rate = step2Data.tax_rate;
      }
      if (formData.quality_multiplier === undefined && step2Data.quality_multiplier) {
        updates.quality_multiplier = step2Data.quality_multiplier;
      }
      
      if (Object.keys(updates).length > 0) {
        onChange(updates);
      }
      setInitialized(true);
    }
  }, [step2Data, initialized]);

  // ============================================
  // بارگذاری داده‌های ذخیره‌شده
  // ============================================
  useEffect(() => {
    if (valuationCaseId && initialized) {
      loadFromDatabase();
    }
  }, [valuationCaseId, initialized]);

  const loadFromDatabase = async () => {
    try {
      const { data } = await api.get(`/intangible/valuation-step3/?valuation_case=${valuationCaseId}`);
      const items = data.results || data || [];
      
      if (items.length > 0 && items[0].method_inputs) {
        const inputs = items[0].method_inputs;
        const m07Data: any = {};
        
        const fields = [
          'team_members', 'ramp_up_duration', 'productivity_loss', 'turnover_rate',
          'expert_signoffs', 'discount_rate', 'tax_rate', 'quality_multiplier'
        ];
        
        fields.forEach(field => {
          if (inputs[field] !== undefined) {
            m07Data[field] = inputs[field];
          }
        });
        
        if (Object.keys(m07Data).length > 0) {
          onChange(m07Data);
        }
      }
    } catch (error) {
      console.error('Error loading M07 data:', error);
    }
  };

  const handleChange = (field: string, value: any) => {
    onChange({ [field]: value });
  };

  const teamMembers: TeamMember[] = formData.team_members || [];
  const expertSignoffs: ExpertSignoff[] = formData.expert_signoffs || [];

  // ============================================
  // توابع جدول تیم
  // ============================================
  const addTeamMember = () => {
    const newMember: TeamMember = {
      id: Date.now(),
      role: 'developer',
      headcount: 1,
      recruit_cost: 15000000,
      train_cost: 8000000,
      avg_salary: 60000000,
    };
    handleChange('team_members', [...teamMembers, newMember]);
  };

  const updateTeamMember = (id: number, field: string, value: any) => {
    const newMembers = teamMembers.map(member =>
      member.id === id ? { ...member, [field]: value } : member
    );
    handleChange('team_members', newMembers);
  };

  const removeTeamMember = (id: number) => {
    if (teamMembers.length <= 1) {
      alert('حداقل یک نقش باید وجود داشته باشد');
      return;
    }
    handleChange('team_members', teamMembers.filter(member => member.id !== id));
  };

  // ============================================
  // محاسبات
  // ============================================
  const calculateTotalHeadcount = () => {
    return teamMembers.reduce((sum, member) => sum + (member.headcount || 0), 0);
  };

  const calculateTotalRecruitCost = () => {
    return teamMembers.reduce((sum, member) => sum + (member.headcount * member.recruit_cost), 0);
  };

  const calculateTotalTrainCost = () => {
    return teamMembers.reduce((sum, member) => sum + (member.headcount * member.train_cost), 0);
  };

  const calculateTotalSalary = () => {
    return teamMembers.reduce((sum, member) => sum + (member.headcount * member.avg_salary), 0);
  };

  const calculateTotalCost = () => {
    return calculateTotalRecruitCost() + calculateTotalTrainCost() + calculateTotalSalary();
  };

  // ============================================
  // توابع تأیید خبرگان
  // ============================================
  const addExpertSignoff = () => {
    const newSignoff: ExpertSignoff = {
      id: Date.now(),
      expert_name: '',
      signature_date: '',
      notes: '',
    };
    handleChange('expert_signoffs', [...expertSignoffs, newSignoff]);
  };

  const updateExpertSignoff = (id: number, field: string, value: string) => {
    const newSignoffs = expertSignoffs.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    );
    handleChange('expert_signoffs', newSignoffs);
  };

  const removeExpertSignoff = (id: number) => {
    handleChange('expert_signoffs', expertSignoffs.filter(s => s.id !== id));
  };

  // ============================================
  // آپلود فایل
  // ============================================
  const handleFileUpload = (field: string, file: File | null) => {
    if (file) {
      setFiles(prev => ({ ...prev, [field]: file }));
      handleChange(field, file.name);
    }
  };

  const removeFile = (field: string) => {
    setFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[field];
      return newFiles;
    });
    handleChange(field, null);
  };

  // ============================================
  // ذخیره در دیتابیس
  // ============================================
  const saveToDatabase = async () => {
    if (!valuationCaseId) return;

    try {
      setSaving(true);
      setSaveError(null);

      const payload = {
        valuation_case: valuationCaseId,
        method_id: 'M-07',
        method_inputs: {
          team_members: teamMembers,
          ramp_up_duration: formData.ramp_up_duration || 6,
          productivity_loss: formData.productivity_loss || 30,
          turnover_rate: formData.turnover_rate || 8,
          expert_signoffs: expertSignoffs,
          discount_rate: formData.discount_rate || step2Data?.discount_rate || 18,
          tax_rate: formData.tax_rate || step2Data?.tax_rate || 25,
          quality_multiplier: formData.quality_multiplier || 0.92,
        },
      };

      const { data: existing } = await api.get(`/intangible/valuation-step3/?valuation_case=${valuationCaseId}`);
      const items = existing.results || existing || [];
      
      if (items.length > 0) {
        const step3Id = items[0].id;
        await api.put(`/intangible/valuation-step3/${step3Id}/`, payload);
      } else {
        await api.post('/intangible/valuation-step3/', payload);
      }

      setLastSaved(new Date().toLocaleTimeString('fa-IR'));
    } catch (error: any) {
      console.error('❌ خطا در ذخیره M07:', error);
      setSaveError(error?.response?.data?.message || 'خطا در ذخیره');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      saveToDatabase();
    }, 1500);
    return () => clearTimeout(timer);
  }, [formData, teamMembers, expertSignoffs]);

  return (
    <div className="space-y-6 font-[family-name:var(--font-vazir)]">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 flex-1">
          <p className="text-sm text-orange-700 flex items-center gap-2">
            <span className="font-bold">📊 M-07: هزینه نیروی کار آموزش‌دیده (TWC)</span>
            <span className="text-xs bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full">روش هزینه</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs mr-4">
          {saving ? (
            <span className="text-amber-500 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              در حال ذخیره...
            </span>
          ) : saveError ? (
            <span className="text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {saveError}
            </span>
          ) : lastSaved ? (
            <span className="text-green-600 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              ذخیره شد {lastSaved}
            </span>
          ) : null}
        </div>
      </div>

      {/* ============================================
          پارامترهای اختصاصی M-07
      ============================================ */}
      <div className="border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          🎯 پارامترهای اختصاصی روش M-07
          <Badge className="text-xs bg-red-100 text-red-700">ورودی کاربر</Badge>
        </h3>

        {/* ============================================
            جدول ترکیب تیم (اعداد فارسی در نمایش)
        ============================================ */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium flex items-center gap-1">
              <Users className="w-4 h-4" />
              ترکیب تیم <span className="text-red-500">*</span>
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={addTeamMember}
              className="flex items-center gap-1 text-orange-600 border-orange-300 hover:bg-orange-50"
            >
              <Plus className="w-4 h-4" />
              افزودن نقش
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-orange-50">
                  <th className="border p-2 text-right font-[family-name:var(--font-vazir)]">نقش</th>
                  <th className="border p-2 text-center font-[family-name:var(--font-vazir)]">تعداد</th>
                  <th className="border p-2 text-right font-[family-name:var(--font-vazir)]">هزینه جذب (IRR)</th>
                  <th className="border p-2 text-right font-[family-name:var(--font-vazir)]">هزینه آموزش (IRR)</th>
                  <th className="border p-2 text-right font-[family-name:var(--font-vazir)]">حقوق متوسط (IRR)</th>
                  <th className="border p-2 text-center font-[family-name:var(--font-vazir)]">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="border p-1">
                      <Select
                        value={member.role}
                        onValueChange={(value) => updateTeamMember(member.id, 'role', value)}
                      >
                        <SelectTrigger className="h-8 text-sm border-0 focus:ring-1 bg-white">
                          <SelectValue placeholder="انتخاب نقش" />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-50">
                          {ROLES.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="border p-1">
                      <Input
                        type="number"
                        value={member.headcount || ''}
                        onChange={(e) => updateTeamMember(member.id, 'headcount', parseInt(e.target.value) || 0)}
                        className="h-8 text-sm border-0 focus:ring-1 text-center font-[family-name:var(--font-vazir)]"
                        placeholder="۰"
                        min="1"
                      />
                    </td>
                    <td className="border p-1">
                      <Input
                        type="number"
                        value={member.recruit_cost || ''}
                        onChange={(e) => updateTeamMember(member.id, 'recruit_cost', parseFloat(e.target.value) || 0)}
                        className="h-8 text-sm border-0 focus:ring-1 font-[family-name:var(--font-vazir)]"
                        placeholder="۲۰,۰۰۰,۰۰۰"
                      />
                    </td>
                    <td className="border p-1">
                      <Input
                        type="number"
                        value={member.train_cost || ''}
                        onChange={(e) => updateTeamMember(member.id, 'train_cost', parseFloat(e.target.value) || 0)}
                        className="h-8 text-sm border-0 focus:ring-1 font-[family-name:var(--font-vazir)]"
                        placeholder="۱۰,۰۰۰,۰۰۰"
                      />
                    </td>
                    <td className="border p-1">
                      <Input
                        type="number"
                        value={member.avg_salary || ''}
                        onChange={(e) => updateTeamMember(member.id, 'avg_salary', parseFloat(e.target.value) || 0)}
                        className="h-8 text-sm border-0 focus:ring-1 font-[family-name:var(--font-vazir)]"
                        placeholder="۸۰,۰۰۰,۰۰۰"
                      />
                    </td>
                    <td className="border p-1 text-center">
                      <button
                        onClick={() => removeTeamMember(member.id)}
                        className="text-red-500 hover:text-red-700 font-[family-name:var(--font-vazir)]"
                        disabled={teamMembers.length <= 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 font-[family-name:var(--font-vazir)]">* حداقل ۱ نقش الزامی است</p>
        </div>

        {/* ============================================
            پارامترهای اضافی (اعداد فارسی در نمایش)
        ============================================ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1 font-[family-name:var(--font-vazir)]">
              <CalendarClock className="w-4 h-4" />
              دوره شتاب‌دهی <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={formData.ramp_up_duration || ''}
                onChange={(e) => handleChange('ramp_up_duration', parseInt(e.target.value) || 0)}
                placeholder="۶"
                className="flex-1 focus:ring-2 focus:ring-orange-500 font-[family-name:var(--font-vazir)]"
              />
              <span className="text-sm text-gray-400 font-[family-name:var(--font-vazir)]">ماه</span>
            </div>
            <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">مدت زمان لازم برای رسیدن به بهره‌وری کامل</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1 font-[family-name:var(--font-vazir)]">
              <TrendingUp className="w-4 h-4" />
              کاهش بهره‌وری <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.1"
                value={formData.productivity_loss || ''}
                onChange={(e) => handleChange('productivity_loss', parseFloat(e.target.value) || 0)}
                placeholder="۳۰"
                className="flex-1 focus:ring-2 focus:ring-orange-500 font-[family-name:var(--font-vazir)]"
              />
              <span className="text-sm text-gray-400 font-[family-name:var(--font-vazir)]">%</span>
            </div>
            <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">درصد بهره‌وری از دست‌رفته در دوره شتاب‌دهی</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1 font-[family-name:var(--font-vazir)]">
              <UserPlus className="w-4 h-4" />
              نرخ جابجایی (اختیاری)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.1"
                value={formData.turnover_rate || ''}
                onChange={(e) => handleChange('turnover_rate', parseFloat(e.target.value) || 0)}
                placeholder="۸"
                className="flex-1 focus:ring-2 focus:ring-orange-500 font-[family-name:var(--font-vazir)]"
              />
              <span className="text-sm text-gray-400 font-[family-name:var(--font-vazir)]">%</span>
            </div>
            <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">نرخ سالانه خروج نیروی کار</p>
          </div>
        </div>
      </div>

      {/* ============================================
          خلاصه محاسبه (اعداد فارسی)
      ============================================ */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm font-medium mb-3 font-[family-name:var(--font-vazir)]">📊 خلاصه تیم</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div className="p-2 bg-white rounded-lg border">
            <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">تعداد کل</p>
            <p className="text-lg font-bold text-dark-green font-[family-name:var(--font-vazir)]">
              {toPersianDigit(calculateTotalHeadcount())} نفر
            </p>
          </div>
          <div className="p-2 bg-white rounded-lg border">
            <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">هزینه جذب</p>
            <p className="text-sm font-bold text-orange-600 font-[family-name:var(--font-vazir)]">
              {formatNumber(calculateTotalRecruitCost())}
            </p>
          </div>
          <div className="p-2 bg-white rounded-lg border">
            <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">هزینه آموزش</p>
            <p className="text-sm font-bold text-blue-600 font-[family-name:var(--font-vazir)]">
              {formatNumber(calculateTotalTrainCost())}
            </p>
          </div>
          <div className="p-2 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-xs text-gray-400 font-[family-name:var(--font-vazir)]">هزینه کل تیم</p>
            <p className="text-lg font-bold text-orange-700 font-[family-name:var(--font-vazir)]">
              {formatNumber(calculateTotalCost())}
            </p>
          </div>
        </div>
      </div>

      {/* ============================================
          آپلود فایل‌ها
      ============================================ */}
      <div className="border rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 font-[family-name:var(--font-vazir)]">📎 شواهد و مدارک</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1 font-[family-name:var(--font-vazir)]">
              فایل HR Data <span className="text-red-500">*</span>
            </Label>
            <div className="p-3 border-2 border-dashed rounded-lg hover:border-orange-400 transition-colors">
              {files.hr_data ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-500" />
                    <span className="text-sm truncate font-[family-name:var(--font-vazir)]">{files.hr_data.name}</span>
                  </div>
                  <button onClick={() => removeFile('hr_data')} className="text-red-500 hover:text-red-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    id="hr_data"
                    className="hidden"
                    onChange={(e) => handleFileUpload('hr_data', e.target.files?.[0] || null)}
                  />
                  <label
                    htmlFor="hr_data"
                    className="flex items-center gap-2 text-sm text-orange-600 cursor-pointer hover:text-orange-800 font-[family-name:var(--font-vazir)]"
                  >
                    <Upload className="w-4 h-4" />
                    آپلود فایل HR
                  </label>
                </div>
              )}
            </div>
            <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">خروجی سیستم HR حاوی اطلاعات تیم</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1 font-[family-name:var(--font-vazir)]">
              فایل Training Plan <span className="text-red-500">*</span>
            </Label>
            <div className="p-3 border-2 border-dashed rounded-lg hover:border-orange-400 transition-colors">
              {files.training_plan ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-500" />
                    <span className="text-sm truncate font-[family-name:var(--font-vazir)]">{files.training_plan.name}</span>
                  </div>
                  <button onClick={() => removeFile('training_plan')} className="text-red-500 hover:text-red-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    id="training_plan"
                    className="hidden"
                    onChange={(e) => handleFileUpload('training_plan', e.target.files?.[0] || null)}
                  />
                  <label
                    htmlFor="training_plan"
                    className="flex items-center gap-2 text-sm text-orange-600 cursor-pointer hover:text-orange-800 font-[family-name:var(--font-vazir)]"
                  >
                    <Upload className="w-4 h-4" />
                    آپلود برنامه آموزشی
                  </label>
                </div>
              )}
            </div>
            <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">برنامه و هزینه‌های آموزشی</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1 font-[family-name:var(--font-vazir)]">
              فایل Recruitment Cost <span className="text-red-500">*</span>
            </Label>
            <div className="p-3 border-2 border-dashed rounded-lg hover:border-orange-400 transition-colors">
              {files.recruitment_cost ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-500" />
                    <span className="text-sm truncate font-[family-name:var(--font-vazir)]">{files.recruitment_cost.name}</span>
                  </div>
                  <button onClick={() => removeFile('recruitment_cost')} className="text-red-500 hover:text-red-700">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    id="recruitment_cost"
                    className="hidden"
                    onChange={(e) => handleFileUpload('recruitment_cost', e.target.files?.[0] || null)}
                  />
                  <label
                    htmlFor="recruitment_cost"
                    className="flex items-center gap-2 text-sm text-orange-600 cursor-pointer hover:text-orange-800 font-[family-name:var(--font-vazir)]"
                  >
                    <Upload className="w-4 h-4" />
                    آپلود مستندات جذب
                  </label>
                </div>
              )}
            </div>
            <p className="text-[10px] text-gray-400 font-[family-name:var(--font-vazir)]">مستندات هزینه‌های جذب نیرو</p>
          </div>
        </div>
      </div>

      {/* ============================================
          تأیید خبرگان
      ============================================ */}
      <div className="space-y-3 pt-4 border-t">
        <Label className="text-sm font-medium font-[family-name:var(--font-vazir)]">👤 تأیید خبرگان (اختیاری)</Label>
        {expertSignoffs.length === 0 ? (
          <div className="text-center py-4 text-gray-400 border-2 border-dashed rounded-lg">
            <p className="text-sm font-[family-name:var(--font-vazir)]">هیچ خبره‌ای ثبت نشده است</p>
            <p className="text-xs font-[family-name:var(--font-vazir)]">برای افزودن خبره روی دکمه کلیک کنید</p>
          </div>
        ) : (
          <div className="space-y-2">
            {expertSignoffs.map((signoff) => (
              <div key={signoff.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <Input
                    value={signoff.expert_name}
                    onChange={(e) => updateExpertSignoff(signoff.id, 'expert_name', e.target.value)}
                    placeholder="نام خبره"
                    className="h-8 text-sm font-[family-name:var(--font-vazir)]"
                  />
                  <Input
                    type="date"
                    value={signoff.signature_date}
                    onChange={(e) => updateExpertSignoff(signoff.id, 'signature_date', e.target.value)}
                    className="h-8 text-sm font-[family-name:var(--font-vazir)]"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeExpertSignoff(signoff.id)}
                  className="text-red-500 hover:text-red-700 font-[family-name:var(--font-vazir)]"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={addExpertSignoff}
          className="flex items-center gap-1 font-[family-name:var(--font-vazir)]"
        >
          <Plus className="w-4 h-4" />
          افزودن خبره
        </Button>
      </div>

    </div>
  );
}
