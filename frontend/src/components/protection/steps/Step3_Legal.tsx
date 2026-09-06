
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { faIR } from 'date-fns/locale';
import { CalendarIcon, Info, Upload, FileText, CheckCircle2, Scale, Globe, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProtectionStep3 } from '@/hooks/useProtection';

interface Step3LegalProps {
  id: number;
  data: any;
  archetype: string;
  config: { step3: string };
  onComplete: () => void;
}

const STEP3_LABELS: Record<string, { label: string; description: string; intensity: string; tint: string; text: string }> = {
  'PA-1': { label: 'قوی - ثبت رسمی', description: 'ابزارهای حقوقی قوی برای ثبت رسمی', intensity: 'قوی', tint: 'bg-emerald-50', text: 'text-emerald-700' },
  'PA-2': { label: 'قوی - قراردادی', description: 'ابزارهای حقوقی مبتنی بر قرارداد', intensity: 'قوی', tint: 'bg-emerald-50', text: 'text-emerald-700' },
  'PA-3': { label: 'متوسط - محرمانگی', description: 'ابزارهای حقوقی برای حفظ محرمانگی', intensity: 'متوسط', tint: 'bg-amber-50', text: 'text-amber-700' },
  'PA-4': { label: 'کپی‌رایت', description: 'ابزارهای حقوقی مبتنی بر کپی‌رایت', intensity: 'کپی‌رایت', tint: 'bg-indigo-50', text: 'text-indigo-700' },
  'PA-5': { label: 'محدود', description: 'ابزارهای حقوقی محدود - فقط مصوبه داخلی', intensity: 'محدود', tint: 'bg-slate-100', text: 'text-slate-600' },
};

const FALLBACK_LEGAL_TOOLS: Record<string, Array<{id: string; name: string; description: string}>> = {
  'PA-1': [
    { id: 'L1', name: 'ثبت پتنت', description: 'ثبت درخواست اختراع موقت' },
    { id: 'L2', name: 'ثبت علامت تجاری', description: 'ثبت هویت برند' },
    { id: 'L3', name: 'ثبت طرح صنعتی', description: 'ثبت طرح صنعتی برای حفاظت از طراحی' },
    { id: 'L4', name: 'ثبت گواهی‌نامه', description: 'ثبت رسمی گواهی‌نامه' },
  ],
  'PA-2': [
    { id: 'L5', name: 'قرارداد انحصاری', description: 'قرارداد انحصاری با تأمین‌کنندگان' },
    { id: 'L6', name: 'توافق‌نامه محرمانگی (NDA)', description: 'توافق‌نامه محرمانگی برای اطلاعات حساس' },
    { id: 'L7', name: 'تفاهم‌نامه (MoU)', description: 'تفاهم‌نامه همکاری با شرکای استراتژیک' },
    { id: 'L8', name: 'قرارداد همکاری', description: 'قرارداد همکاری رسمی با نهادهای خارجی' },
  ],
  'PA-3': [
    { id: 'L9', name: 'توافق‌نامه محرمانگی (NDA)', description: 'محافظت از اطلاعات محرمانه با NDA قوی' },
    { id: 'L10', name: 'قرارداد عدم افشا', description: 'قرارداد عدم افشا برای کارکنان و پیمانکاران' },
    { id: 'L11', name: 'ثبت اسرار تجاری', description: 'ثبت اسرار تجاری در مراجع ذی‌صلاح' },
  ],
  'PA-4': [
    { id: 'L12', name: 'کپی‌رایت', description: 'کپی‌رایت آثار دیجیتال و محتوای اصلی' },
    { id: 'L13', name: 'لایسنس نرم‌افزاری', description: 'لایسنس نرم‌افزاری برای محصولات اختصاصی' },
  ],
  'PA-5': [
    { id: 'L14', name: 'مصوبه داخلی', description: 'مصوبه داخلی برای رویه‌ها و فرآیندها' },
    { id: 'L15', name: 'ثبت آیین‌نامه', description: 'ثبت آیین‌نامه و دستورالعمل‌های سازمانی' },
  ],
};

const PROTECTION_TYPES = [
  { id: 'formal_registration', label: 'ثبت رسمی', description: 'ثبت در مراجع رسمی (پتنت، برند)' },
  { id: 'contractual', label: 'قراردادی', description: 'از طریق قرارداد و توافقات' },
  { id: 'confidentiality', label: 'محرمانگی', description: 'از طریق NDA و اسرار تجاری' },
];

const JURISDICTIONS = [
  { id: 'iran', label: 'ایران' },
  { id: 'international', label: 'بین‌المللی (PCT)' },
  { id: 'us', label: 'آمریکا' },
  { id: 'eu', label: 'اتحادیه اروپا' },
  { id: 'other', label: 'سایر' },
];

const REGISTRATION_CLASSES = [
  { id: 'class1', label: 'کلاس ۱ - مواد شیمیایی' },
  { id: 'class2', label: 'کلاس ۲ - رنگ‌ها' },
  { id: 'class3', label: 'کلاس ۳ - آرایشی' },
  { id: 'class4', label: 'کلاس ۴ - روغن‌ها' },
  { id: 'class5', label: 'کلاس ۵ - دارویی' },
  { id: 'class9', label: 'کلاس ۹ - نرم‌افزار و الکترونیک' },
  { id: 'class16', label: 'کلاس ۱۶ - کاغذ و چاپ' },
  { id: 'class35', label: 'کلاس ۳۵ - تبلیغات و مدیریت' },
  { id: 'class41', label: 'کلاس ۴۱ - آموزش و سرگرمی' },
  { id: 'class42', label: 'کلاس ۴۲ - خدمات علمی و فنی' },
];

export default function Step3_Legal({ id, data, archetype, config, onComplete }: Step3LegalProps) {
  const step3Mutation = useProtectionStep3();
  const label = STEP3_LABELS[archetype] || STEP3_LABELS['PA-5'];

  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [tools, setTools] = useState<Array<{id: string; name: string; description: string}>>([]);
  const [protectionType, setProtectionType] = useState('formal_registration');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [registrationDate, setRegistrationDate] = useState<Date | null>(null);
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [issuingAuthority, setIssuingAuthority] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [registrationClasses, setRegistrationClasses] = useState<string[]>([]);
  const [estimatedCost, setEstimatedCost] = useState('');
  const [legalStatus, setLegalStatus] = useState('pending');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const legalTools = data?.available_tools?.legal || [];
    if (legalTools.length > 0) {
      setTools(legalTools);
    } else {
      const fallbackTools = FALLBACK_LEGAL_TOOLS[archetype] || FALLBACK_LEGAL_TOOLS['PA-5'];
      setTools(fallbackTools);
    }
  }, [data, archetype]);

  useEffect(() => {
    if (data) {
      setSelectedTools(data.selected_legal_tools?.map((t: any) => t.id) || []);
      setProtectionType(data.protection_type || 'formal_registration');
      setRegistrationNumber(data.registration_number || '');
      setRegistrationDate(data.registration_date ? new Date(data.registration_date) : null);
      setExpiryDate(data.expiry_date ? new Date(data.expiry_date) : null);
      setIssuingAuthority(data.issuing_authority || '');
      setJurisdiction(data.jurisdiction || '');
      setRegistrationClasses(data.registration_classes || []);
      setEstimatedCost(data.estimated_cost || '');
      setLegalStatus(data.legal_status || 'pending');
      setNotes(data.notes || '');
    }
  }, [data]);

  if (config.step3 === 'minimal') {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-14 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
          <Info className="h-6 w-6 text-slate-400" />
        </div>
        <div className="max-w-sm space-y-1">
          <p className="text-base font-semibold text-slate-800">حفاظت حقوقی برای این آرکی‌تایپ محدود است</p>
          <p className="text-sm text-slate-500">
            برای دارایی‌های رویه‌ای/فرهنگی، فقط می‌توانید از مصوبه داخلی یا ثبت آیین‌نامه استفاده کنید.
          </p>
        </div>
        <Button onClick={onComplete} variant="outline" className="border-slate-200">
          رد شدن از این گام
        </Button>
      </div>
    );
  }

  const handleSubmit = () => {
    step3Mutation.mutate(
      {
        id,
        data: {
          selected_legal_tools: tools.filter(t => selectedTools.includes(t.id)),
          protection_type: protectionType,
          registration_number: registrationNumber,
          registration_date: registrationDate ? registrationDate.toISOString().split('T')[0] : null,
          expiry_date: expiryDate ? expiryDate.toISOString().split('T')[0] : null,
          issuing_authority: issuingAuthority,
          jurisdiction: jurisdiction,
          registration_classes: registrationClasses,
          estimated_cost: estimatedCost,
          legal_status: legalStatus,
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
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-slate-900">گام ۳ · حفاظت حقوقی (IP)</h3>
          <Badge className={cn('border-0 font-medium hover:bg-inherit', label.tint, label.text)}>
            {label.label}
          </Badge>
        </div>
        <p className="text-sm text-slate-500">{label.description}</p>
      </div>

      {/* نوع حفاظت حقوقی */}
      <Card className="rounded-xl border-slate-200 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-800">نوع حفاظت حقوقی</CardTitle>
          <CardDescription className="text-xs text-slate-400">مکانیزم اصلی حفاظت حقوقی را انتخاب کنید</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={protectionType} onValueChange={setProtectionType}>
            <SelectTrigger className="border-slate-200">
              <SelectValue placeholder="نوع حفاظت را انتخاب کنید" />
            </SelectTrigger>
            <SelectContent>
              {PROTECTION_TYPES.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  <div>
                    <p>{type.label}</p>
                    <p className="text-xs text-slate-400">{type.description}</p>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* ابزارهای حقوقی */}
      <Card className="rounded-xl border-slate-200 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-800">ابزارهای حقوقی قابل اعمال</CardTitle>
          <CardDescription className="text-xs text-slate-400">ابزارهای مناسب برای این آرکی‌تایپ را انتخاب کنید</CardDescription>
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
                    <p className="text-xs text-slate-400">{tool.description || 'قابل اعمال برای این دارایی'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* اطلاعات ثبت */}
      <Card className="rounded-xl border-slate-200 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-800">اطلاعات ثبت</CardTitle>
          <CardDescription className="text-xs text-slate-400">مدارک و اطلاعات ثبت حقوقی</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">شماره ثبت</Label>
              <Input
                placeholder="شماره ثبت را وارد کنید"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                className="border-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">مرجع صادرکننده</Label>
              <Input
                placeholder="مرجع صادرکننده را وارد کنید"
                value={issuingAuthority}
                onChange={(e) => setIssuingAuthority(e.target.value)}
                className="border-slate-200"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">تاریخ ثبت</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start border-slate-200 text-right font-normal',
                      !registrationDate && 'text-slate-400'
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {registrationDate ? format(registrationDate, 'yyyy/MM/dd', { locale: faIR }) : <span>انتخاب تاریخ</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={registrationDate || undefined} onSelect={setRegistrationDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-500">تاریخ انقضا</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start border-slate-200 text-right font-normal',
                      !expiryDate && 'text-slate-400'
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {expiryDate ? format(expiryDate, 'yyyy/MM/dd', { locale: faIR }) : <span>انتخاب تاریخ</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={expiryDate || undefined} onSelect={setExpiryDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* حوزه قضایی */}
      <Card className="rounded-xl border-slate-200 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-800">حوزه قضایی</CardTitle>
          <CardDescription className="text-xs text-slate-400">کشور یا منطقه ثبت حقوقی</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={jurisdiction} onValueChange={setJurisdiction}>
            <SelectTrigger className="border-slate-200">
              <SelectValue placeholder="حوزه قضایی را انتخاب کنید" />
            </SelectTrigger>
            <SelectContent>
              {JURISDICTIONS.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  <div className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-slate-400" />
                    {item.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* کلاس‌های ثبت - فقط برای PA-1 */}
      {(archetype === 'PA-1') && (
        <Card className="rounded-xl border-slate-200 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-800">کلاس‌های ثبت</CardTitle>
            <CardDescription className="text-xs text-slate-400">کلاس‌های بین‌المللی ثبت (اختیاری)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {REGISTRATION_CLASSES.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <Checkbox
                    id={item.id}
                    checked={registrationClasses.includes(item.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setRegistrationClasses([...registrationClasses, item.id]);
                      } else {
                        setRegistrationClasses(registrationClasses.filter(id => id !== item.id));
                      }
                    }}
                  />
                  <Label htmlFor={item.id} className="text-xs cursor-pointer">
                    {item.label}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* هزینه تخمینی */}
      <Card className="rounded-xl border-slate-200 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-800">هزینه تخمینی</CardTitle>
          <CardDescription className="text-xs text-slate-400">برآورد هزینه‌های ثبت و حفاظت حقوقی</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <DollarSign className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="مبلغ به ریال"
              value={estimatedCost}
              onChange={(e) => setEstimatedCost(e.target.value)}
              className="border-slate-200 pr-10"
              type="number"
            />
          </div>
        </CardContent>
      </Card>

      {/* وضعیت حقوقی */}
      <Card className="rounded-xl border-slate-200 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-800">وضعیت حقوقی</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={legalStatus} onValueChange={setLegalStatus}>
            <SelectTrigger className="border-slate-200">
              <SelectValue placeholder="وضعیت را انتخاب کنید" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">در انتظار</SelectItem>
              <SelectItem value="in_review">در حال بررسی</SelectItem>
              <SelectItem value="registered">ثبت شده</SelectItem>
              <SelectItem value="rejected">رد شده</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* آپلود سند */}
      <Card className="rounded-xl border-slate-200 shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-800">اسناد پیوست</CardTitle>
          <CardDescription className="text-xs text-slate-400">آپلود مدارک حقوقی مرتبط</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center transition-colors hover:border-emerald-300 hover:bg-emerald-50/30 cursor-pointer"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white ring-1 ring-slate-200">
              <Upload className="h-4 w-4 text-slate-500" />
            </div>
            <p className="text-sm font-medium text-slate-700">برای انتخاب فایل کلیک کنید</p>
            <input
              id="file-upload"
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
          placeholder="یادداشت‌های مربوط به حفاظت حقوقی..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="border-slate-200"
        />
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!hasSelectedTools || step3Mutation.isPending}
          className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {step3Mutation.isPending ? (
            'در حال ذخیره...'
          ) : hasSelectedTools ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              ویرایش
            </>
          ) : (
            <>
              <Scale className="h-4 w-4" />
              ذخیره حفاظت حقوقی
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
