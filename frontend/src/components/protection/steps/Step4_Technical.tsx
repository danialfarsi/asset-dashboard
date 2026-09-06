'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { CalendarIcon, Info, Upload, FileText, CheckCircle2, Shield, User, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProtectionStep4 } from '@/hooks/useProtection';

interface Step4TechnicalProps {
  id: number;
  data: any;
  archetype: string;
  config: { step4: string };
  onComplete: () => void;
}

// 🔥 تبدیل عدد به فارسی
const toPersianNumber = (num: number): string => {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return num.toString().replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};

// ابزارهای فنی بر اساس آرکی‌تایپ (طبق PDF)
const TECHNICAL_TOOLS_BY_ARCHETYPE: Record<string, Array<{id: string; name: string; description: string}>> = {
  'PA-1': [
    { id: 'T1', name: 'مدیریت دسترسی', description: 'مدیریت دسترسی مبتنی بر نقش (RBAC)' },
    { id: 'T2', name: 'رمزنگاری اسناد', description: 'رمزنگاری پیشرفته AES-256 برای اسناد' },
    { id: 'T3', name: 'پشتیبان‌گیری منظم', description: 'پشتیبان‌گیری منظم از داده‌های حیاتی' },
  ],
  'PA-2': [
    { id: 'T4', name: 'کنترل دسترسی پایه', description: 'کنترل دسترسی پایه برای کاربران' },
    { id: 'T5', name: 'ثبت قرارداد در سامانه', description: 'ثبت قراردادها در سامانه مدیریت قرارداد' },
  ],
  'PA-3': [
    { id: 'T6', name: 'رمزنگاری پیشرفته', description: 'رمزنگاری سطح بالا با کلیدهای ۲۰۴۸ بیتی' },
    { id: 'T7', name: 'کنترل دسترسی سخت‌گیرانه', description: 'کنترل دسترسی با تأیید دو مرحله‌ای' },
    { id: 'T8', name: 'مانیتورینگ مداوم', description: 'مانیتورینگ ۲۴/۷ با هشدارهای لحظه‌ای' },
    { id: 'T9', name: 'سیستم DLP', description: 'سیستم جلوگیری از نشت داده (DLP)' },
  ],
  'PA-4': [
    { id: 'T10', name: 'رمزنگاری داده‌ها', description: 'رمزنگاری داده‌ها در حالت ذخیره و انتقال' },
    { id: 'T11', name: 'کنترل دسترسی RBAC', description: 'کنترل دسترسی مبتنی بر نقش (RBAC) پیشرفته' },
    { id: 'T12', name: 'پشتیبان‌گیری خودکار', description: 'پشتیبان‌گیری خودکار در فواصل منظم' },
    { id: 'T13', name: 'امنیت سایبری', description: 'امنیت سایبری پیشرفته با فایروال و IDS' },
    { id: 'T14', name: 'مانیتورینگ دسترسی', description: 'مانیتورینگ مداوم دسترسی و گزارش‌دهی' },
  ],
  'PA-5': [
    { id: 'T15', name: 'مدیریت دسترسی', description: 'مدیریت دسترسی به اسناد رویه‌ای' },
    { id: 'T16', name: 'سیستم مدیریت نسخه', description: 'سیستم مدیریت نسخه برای مستندات' },
    { id: 'T17', name: 'مانیتورینگ اجرا', description: 'مانیتورینگ اجرای رویه‌ها و فرآیندها' },
  ],
};

// شدت گام‌ها (طبق PDF)
const STEP4_LABELS: Record<string, { label: string; description: string; intensity: string; tint: string; text: string }> = {
  'PA-1': { label: 'متوسط', description: 'کنترل‌های امنیتی متوسط', intensity: 'متوسط', tint: 'bg-amber-50', text: 'text-amber-700' },
  'PA-2': { label: 'فرعی', description: 'کنترل‌های امنیتی حداقل', intensity: 'فرعی', tint: 'bg-slate-100', text: 'text-slate-600' },
  'PA-3': { label: 'قوی', description: 'کنترل‌های امنیتی پیشرفته', intensity: 'قوی', tint: 'bg-emerald-50', text: 'text-emerald-700' },
  'PA-4': { label: 'قوی', description: 'کنترل‌های امنیتی پیشرفته برای داده', intensity: 'قوی', tint: 'bg-emerald-50', text: 'text-emerald-700' },
  'PA-5': { label: 'دسترسی', description: 'کنترل دسترسی و مدیریت نسخه', intensity: 'دسترسی', tint: 'bg-blue-50', text: 'text-blue-700' },
};

// وضعیت‌های اجرا
const EXECUTION_STATUSES = [
  { id: 'not_started', label: 'شروع نشده' },
  { id: 'in_progress', label: 'در حال اجرا' },
  { id: 'completed', label: 'تکمیل شده' },
  { id: 'delayed', label: 'به تعویق افتاده' },
];

// مسئولین اجرا (نمونه)
const EXECUTORS = [
  { id: 'it_security', label: 'امنیت IT' },
  { id: 'data_team', label: 'تیم داده' },
  { id: 'legal_team', label: 'تیم حقوقی' },
  { id: 'compliance', label: 'انطباق' },
  { id: 'external', label: 'مشاور خارجی' },
];

export default function Step4_Technical({ id, data, archetype, config, onComplete }: Step4TechnicalProps) {
  const step4Mutation = useProtectionStep4();
  const tools = TECHNICAL_TOOLS_BY_ARCHETYPE[archetype] || TECHNICAL_TOOLS_BY_ARCHETYPE['PA-5'];
  const label = STEP4_LABELS[archetype] || STEP4_LABELS['PA-5'];

  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [securityLevel, setSecurityLevel] = useState('medium');
  const [encryption, setEncryption] = useState(false);
  const [accessControl, setAccessControl] = useState(false);
  const [backup, setBackup] = useState(false);
  const [monitoring, setMonitoring] = useState(false);
  const [executionDate, setExecutionDate] = useState<Date | null>(null);
  const [executor, setExecutor] = useState('');
  const [executionStatus, setExecutionStatus] = useState('not_started');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // بارگذاری داده‌های قبلی
  useEffect(() => {
    if (data) {
      setSelectedTools(data.selected_technical_tools?.map((t: any) => t.id) || []);
      setSecurityLevel(data.security_level || 'medium');
      setEncryption(data.encryption_enabled || false);
      setAccessControl(data.access_control_enabled || false);
      setBackup(data.backup_enabled || false);
      setMonitoring(data.monitoring_enabled || false);
      setExecutionDate(data.execution_date ? new Date(data.execution_date) : null);
      setExecutor(data.executor || '');
      setExecutionStatus(data.execution_status || 'not_started');
      setNotes(data.notes || '');
    }
  }, [data]);

  // اگر گام ۴ حداقل است (PA-2)
  if (config.step4 === 'minimal') {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-14 text-center font-vazir">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
          <Info className="h-6 w-6 text-slate-400" />
        </div>
        <div className="max-w-sm space-y-1">
          <p className="text-base font-semibold text-slate-800">امنیت فنی برای این آرکی‌تایپ حداقل است</p>
          <p className="text-sm text-slate-500">
            برای دارایی‌های قراردادی، فقط کنترل دسترسی پایه و ثبت قرارداد در سامانه توصیه می‌شود.
          </p>
        </div>
        <Button onClick={onComplete} variant="outline" className="border-slate-200">
          رد شدن از این گام
        </Button>
      </div>
    );
  }

  const handleSubmit = () => {
    step4Mutation.mutate(
      {
        id,
        data: {
          selected_technical_tools: tools.filter(t => selectedTools.includes(t.id)),
          security_level: securityLevel,
          encryption_enabled: encryption,
          access_control_enabled: accessControl,
          backup_enabled: backup,
          monitoring_enabled: monitoring,
          execution_date: executionDate ? executionDate.toISOString().split('T')[0] : null,
          executor: executor,
          execution_status: executionStatus,
          notes: notes,
        },
      },
      {
        onSuccess: () => onComplete(),
      }
    );
  };

  const hasSelectedTools = selectedTools.length > 0;

  return (
    <div className="space-y-5 font-vazir">
      <div>
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-slate-900">گام ۴ · امنیت فنی</h3>
          <Badge className={cn('border-0 font-medium hover:bg-inherit', label.tint, label.text)}>
            {label.label}
          </Badge>
        </div>
        <p className="text-sm text-slate-500">{label.description}</p>
      </div>

      {/* ابزارهای فنی */}
      <Card className="rounded-xl border-slate-200 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-800">ابزارهای فنی قابل اعمال</CardTitle>
          <CardDescription className="text-xs text-slate-400">ابزارهای امنیتی مناسب برای این آرکی‌تایپ را انتخاب کنید</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tools.map((tool) => {
              const checked = selectedTools.includes(tool.id);
              return (
                <div
                  key={tool.id}
                  className={`flex items-start gap-3 rounded-lg border p-2.5 transition-colors ${
                    checked ? 'border-indigo-200 bg-indigo-50/40' : 'border-transparent hover:bg-slate-50'
                  }`}
                >
                  <Checkbox
                    id={tool.id}
                    checked={checked}
                    onCheckedChange={(checkedVal) => {
                      if (checkedVal) {
                        setSelectedTools([...selectedTools, tool.id]);
                      } else {
                        setSelectedTools(selectedTools.filter(id => id !== tool.id));
                      }
                    }}
                    className="mt-1"
                  />
                  <div>
                    <Label htmlFor={tool.id} className="cursor-pointer text-sm font-medium text-slate-800">
                      {tool.name}
                    </Label>
                    <p className="text-xs text-slate-400">{tool.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* تنظیمات امنیتی */}
      <Card className="rounded-xl border-slate-200 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-800">تنظیمات امنیتی</CardTitle>
          <CardDescription className="text-xs text-slate-400">پیکربندی کنترل‌های امنیتی</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">سطح امنیت</Label>
              <Select value={securityLevel} onValueChange={setSecurityLevel}>
                <SelectTrigger className="border-slate-200 bg-white/80 backdrop-blur-sm">
                  <SelectValue placeholder="سطح امنیت را انتخاب کنید" />
                </SelectTrigger>
                <SelectContent className="bg-white/90 backdrop-blur-md border-slate-200/50 shadow-lg">
                  <SelectItem value="low">پایین</SelectItem>
                  <SelectItem value="medium">متوسط</SelectItem>
                  <SelectItem value="high">بالا</SelectItem>
                  <SelectItem value="critical">بحرانی</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="encryption"
                  checked={encryption}
                  onCheckedChange={(checked) => setEncryption(checked as boolean)}
                />
                <Label htmlFor="encryption" className="text-sm">رمزنگاری فعال</Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="accessControl"
                  checked={accessControl}
                  onCheckedChange={(checked) => setAccessControl(checked as boolean)}
                />
                <Label htmlFor="accessControl" className="text-sm">کنترل دسترسی فعال</Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="backup"
                  checked={backup}
                  onCheckedChange={(checked) => setBackup(checked as boolean)}
                />
                <Label htmlFor="backup" className="text-sm">پشتیبان‌گیری خودکار</Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="monitoring"
                  checked={monitoring}
                  onCheckedChange={(checked) => setMonitoring(checked as boolean)}
                />
                <Label htmlFor="monitoring" className="text-sm">مانیتورینگ فعال</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* برنامه اجرا */}
      <Card className="rounded-xl border-slate-200 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-800">برنامه اجرا</CardTitle>
          <CardDescription className="text-xs text-slate-400">زمان‌بندی و مسئول اجرای امنیت فنی</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">تاریخ اجرا</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start border-slate-200 text-right font-normal bg-white/80 backdrop-blur-sm',
                      !executionDate && 'text-slate-400'
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {executionDate ? format(executionDate, 'yyyy/MM/dd', { locale: faIR }) : <span>انتخاب تاریخ</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white/90 backdrop-blur-md border-slate-200/50 shadow-lg">
                  <Calendar mode="single" selected={executionDate || undefined} onSelect={setExecutionDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">مسئول اجرا</Label>
              <Select value={executor} onValueChange={setExecutor}>
                <SelectTrigger className="border-slate-200 bg-white/80 backdrop-blur-sm">
                  <SelectValue placeholder="انتخاب مسئول" />
                </SelectTrigger>
                <SelectContent className="bg-white/90 backdrop-blur-md border-slate-200/50 shadow-lg">
                  {EXECUTORS.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        {item.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">وضعیت اجرا</Label>
              <Select value={executionStatus} onValueChange={setExecutionStatus}>
                <SelectTrigger className="border-slate-200 bg-white/80 backdrop-blur-sm">
                  <SelectValue placeholder="انتخاب وضعیت" />
                </SelectTrigger>
                <SelectContent className="bg-white/90 backdrop-blur-md border-slate-200/50 shadow-lg">
                  {EXECUTION_STATUSES.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {item.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* آپلود سند امنیتی */}
      <Card className="rounded-xl border-slate-200 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-800">اسناد امنیتی</CardTitle>
          <CardDescription className="text-xs text-slate-400">آپلود مدارک امنیتی مرتبط</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center transition-colors hover:border-emerald-300 hover:bg-emerald-50/30 cursor-pointer"
            onClick={() => document.getElementById('security-file-upload')?.click()}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white ring-1 ring-slate-200">
              <Upload className="h-4 w-4 text-slate-500" />
            </div>
            <p className="text-sm font-medium text-slate-700">برای انتخاب فایل کلیک کنید</p>
            <input
              id="security-file-upload"
              type="file"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
            />
            {selectedFile && (
              <div className="mt-1 flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs text-slate-600 ring-1 ring-slate-200">
                <FileText className="h-3.5 w-3.5 text-emerald-600" />
                <span>{selectedFile.name}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* یادداشت‌ها */}
      <div className="space-y-1.5">
        <Label className="text-xs text-slate-500">یادداشت‌ها</Label>
        <Textarea
          placeholder="یادداشت‌های مربوط به امنیت فنی..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="border-slate-200"
        />
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!hasSelectedTools || step4Mutation.isPending}
          className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {step4Mutation.isPending ? (
            'در حال ذخیره...'
          ) : hasSelectedTools ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              ویرایش
            </>
          ) : (
            <>
              <Shield className="h-4 w-4" />
              ذخیره امنیت فنی
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
