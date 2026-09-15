'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface Step10OperationalModelProps {
  onComplete: (data: any) => void;
  initialData?: any;
}

interface Process {
  code: string;
  name: string;
  description: string;
  engine: string;
  owner_role: string;
  output: string;
}

interface Workflow {
  code: string;
  name: string;
  process_code: string;
  steps: string[];
  sla_days: number;
  owner_role: string;
}

interface KPI {
  code: string;
  name: string;
  unit: string;
  target: number;
  period: string;
  owner_role: string;
}

const ENGINES = [
  { code: 'strategy', name: 'لایه هوش راهبردی' },
  { code: 'engine1', name: 'موتور ۱ — کشف' },
  { code: 'engine2', name: 'موتور ۲ — ارزش‌گذاری' },
  { code: 'engine3', name: 'موتور ۳ — حفاظت' },
  { code: 'engine4', name: 'موتور ۴ — توسعه' },
  { code: 'engine5', name: 'موتور ۵ — تجاری‌سازی' },
  { code: 'engine6', name: 'موتور ۶ — پایش' },
  { code: 'engine7', name: 'موتور ۷ — هم‌افزایی' },
  { code: 'engine8', name: 'موتور ۸ — بهینه‌سازی' },
  { code: 'engine9', name: 'موتور ۹ — پیش‌بینی' },
];

const ROLES = [
  { code: 'sc', name: 'کمیته راهبری' },
  { code: 'iam', name: 'مدیر IAM' },
  { code: 'aud', name: 'ممیز' },
  { code: 'own', name: 'مالک دارایی' },
  { code: 'cus', name: 'متولی' },
  { code: 'leg', name: 'حقوقی' },
  { code: 'fin', name: 'مالی' },
  { code: 'ict', name: 'IT' },
  { code: 'hrk', name: 'HR' },
];

const DEFAULT_PROCESSES: Process[] = [
  { code: 'P1', name: 'برنامه‌ریزی راهبردی', description: 'تعریف هدف، دامنه، مالک و KPI', engine: 'strategy', owner_role: 'sc', output: 'برنامه دارایی' },
  { code: 'P2', name: 'کشف و شناسایی', description: 'ایجاد پرونده و جمع‌آوری شواهد', engine: 'engine1', owner_role: 'iam', output: 'شناسنامه اولیه' },
  { code: 'P3', name: 'ارزیابی و ارزش‌گذاری', description: 'ارجاع به ارزیاب و مالی', engine: 'engine2', owner_role: 'fin', output: 'گزارش ارزش و اولویت' },
  { code: 'P4', name: 'حفاظت و امنیت', description: 'ایجاد اقدام حقوقی و فنی', engine: 'engine3', owner_role: 'leg', output: 'نقشه حفاظت' },
  { code: 'P5', name: 'توسعه و نوآوری', description: 'تعریف پروژه توسعه', engine: 'engine4', owner_role: 'rnd', output: 'پروژه و خروجی جدید' },
  { code: 'P6', name: 'یکپارچه‌سازی و هم‌افزایی', description: 'ارجاع برای تحلیل رابطه', engine: 'engine7', owner_role: 'iam', output: 'نقشه هم‌افزایی' },
  { code: 'P7', name: 'بهره‌برداری و تجاری‌سازی', description: 'ارجاع به شریک، بازار یا قرارداد', engine: 'engine5', owner_role: 'bdm', output: 'مدل درآمد و قرارداد' },
  { code: 'P8', name: 'پایش و به‌روزرسانی', description: 'کنترل KPI، هشدار و اصلاح', engine: 'engine6', owner_role: 'iam', output: 'داشبورد و اقدام اصلاحی' },
  { code: 'P9', name: 'بهینه‌سازی و ارتقا', description: 'تصمیم نگهداشت، توسعه یا خروج', engine: 'engine8', owner_role: 'sc', output: 'پورتفولیو بهینه' },
  { code: 'P10', name: 'گزارش‌دهی و تصمیم', description: 'ارائه به کمیته و بازخورد', engine: 'strategy', owner_role: 'sc', output: 'مصوبه و برنامه جدید' },
];

const DEFAULT_WORKFLOWS: Workflow[] = [
  { code: 'W1', name: 'ثبت دارایی جدید', process_code: 'P2', steps: ['کشف', 'ثبت اولیه', 'تکمیل شواهد', 'تصویب'], sla_days: 7, owner_role: 'iam' },
  { code: 'W2', name: 'تکمیل شواهد', process_code: 'P2', steps: ['درخواست شواهد', 'بارگذاری', 'بازبینی', 'تأیید'], sla_days: 5, owner_role: 'cus' },
  { code: 'W3', name: 'غربالگری چهارشرطی', process_code: 'P2', steps: ['بررسی غیرفیزیکی', 'بررسی شناسایی', 'بررسی کنترل', 'بررسی ارزش‌آفرینی'], sla_days: 3, owner_role: 'iam' },
  { code: 'W4', name: 'ارزش‌گذاری اقتصادی', process_code: 'P3', steps: ['انتخاب روش', 'جمع‌آوری داده', 'محاسبه', 'QC', 'تصویب'], sla_days: 14, owner_role: 'fin' },
  { code: 'W5', name: 'حفاظت حقوقی', process_code: 'P4', steps: ['تحلیل حقوقی', 'ثبت حقوقی', 'NDA', 'پایش'], sla_days: 10, owner_role: 'leg' },
  { code: 'W6', name: 'تصویب پروژه توسعه', process_code: 'P5', steps: ['تعریف پروژه', 'تخصیص بودجه', 'اجرا', 'ارزیابی'], sla_days: 30, owner_role: 'rnd' },
  { code: 'W7', name: 'تجاری‌سازی', process_code: 'P7', steps: ['ارزیابی بازار', 'مذاکره', 'قرارداد', 'اجرا'], sla_days: 45, owner_role: 'bdm' },
  { code: 'W8', name: 'تصمیم کمیته', process_code: 'P10', steps: ['ارسال به کمیته', 'جلسه', 'تصمیم', 'پیگیری'], sla_days: 7, owner_role: 'sc' },
  { code: 'W9', name: 'به‌روزرسانی شناسنامه', process_code: 'P8', steps: ['بررسی تغییرات', 'آپدیت', 'تأیید'], sla_days: 3, owner_role: 'cus' },
];

const DEFAULT_KPIS: KPI[] = [
  { code: 'K1', name: 'تعداد دارایی‌های ثبت‌شده', unit: 'عدد', target: 100, period: 'ماهانه', owner_role: 'iam' },
  { code: 'K2', name: 'درصد دارایی‌های دارای مالک', unit: 'درصد', target: 90, period: 'ماهانه', owner_role: 'iam' },
  { code: 'K3', name: 'میانگین زمان ارزش‌گذاری', unit: 'روز', target: 14, period: 'فصلی', owner_role: 'fin' },
  { code: 'K4', name: 'نرخ تبدیل کاندیدا به دارایی', unit: 'درصد', target: 60, period: 'فصلی', owner_role: 'iam' },
  { code: 'K5', name: 'درصد بودجه مصوب‌شده', unit: 'درصد', target: 80, period: 'سالانه', owner_role: 'fin' },
  { code: 'K6', name: 'امتیاز تعهد رهبری', unit: 'امتیاز', target: 85, period: 'فصلی', owner_role: 'sc' },
];

export function Step10OperationalModel({ onComplete, initialData }: Step10OperationalModelProps) {
  const [processes, setProcesses] = useState<Process[]>(DEFAULT_PROCESSES);
  const [workflows, setWorkflows] = useState<Workflow[]>(DEFAULT_WORKFLOWS);
  const [kpis, setKpis] = useState<KPI[]>(DEFAULT_KPIS);
  const [activeTab, setActiveTab] = useState<'processes' | 'workflows' | 'kpis'>('processes');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🎯 بارگذاری از API
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/intangible/viam/operational-model/my/');
        const model = res.data.model;
        if (model) {
          if (model.processes?.length) setProcesses(model.processes);
          if (model.workflows?.length) setWorkflows(model.workflows);
          if (model.kpis?.length) setKpis(model.kpis);
          console.log('📥 Loaded from API');
        } else {
          console.log('📥 No model in API — using DEFAULT');
        }
      } catch (err) {
        console.error('Load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ─── فرآیندها ───
  const addProcess = () => {
    const code = `P${processes.length + 1}`;
    setProcesses([...processes, {
      code, name: '', description: '', engine: 'engine1', owner_role: 'iam', output: ''
    }]);
  };

  const updateProcess = (index: number, field: keyof Process, value: string) => {
    const updated = [...processes];
    updated[index] = { ...updated[index], [field]: value };
    setProcesses(updated);
  };

  const removeProcess = (index: number) => {
    setProcesses(processes.filter((_, i) => i !== index));
  };

  // ─── گردش‌کارها ───
  const addWorkflow = () => {
    const code = `W${workflows.length + 1}`;
    setWorkflows([...workflows, {
      code, name: '', process_code: 'P1', steps: [], sla_days: 7, owner_role: 'iam'
    }]);
  };

  const updateWorkflow = (index: number, field: keyof Workflow, value: any) => {
    const updated = [...workflows];
    updated[index] = { ...updated[index], [field]: value };
    setWorkflows(updated);
  };

  const removeWorkflow = (index: number) => {
    setWorkflows(workflows.filter((_, i) => i !== index));
  };

  // ─── KPIها ───
  const addKPI = () => {
    const code = `K${kpis.length + 1}`;
    setKpis([...kpis, {
      code, name: '', unit: 'عدد', target: 0, period: 'ماهانه', owner_role: 'iam'
    }]);
  };

  const updateKPI = (index: number, field: keyof KPI, value: any) => {
    const updated = [...kpis];
    updated[index] = { ...updated[index], [field]: value };
    setKpis(updated);
  };

  const removeKPI = (index: number) => {
    setKpis(kpis.filter((_, i) => i !== index));
  };

  // 🎯 ذخیره در DB
  const handleSubmit = async () => {
    const validProcesses = processes.filter(p => p.name.trim());
    const validWorkflows = workflows.filter(w => w.name.trim());
    const validKpis = kpis.filter(k => k.name.trim());

    if (validProcesses.length === 0) {
      alert('لطفاً حداقل یک فرآیند وارد کنید');
      return;
    }

    setSaving(true);
    try {
      console.log('📤 Saving to DB...', {
        processes: validProcesses.length,
        workflows: validWorkflows.length,
        kpis: validKpis.length,
      });

      const res = await api.post('/intangible/viam/operational-model/save/', {
        name: 'مدل عملیاتی IAM',
        processes: validProcesses,
        workflows: validWorkflows,
        kpis: validKpis,
        status: 'draft',
      });

      console.log('✅ Saved:', res.data);

      onComplete({
        processes: validProcesses,
        workflows: validWorkflows,
        kpis: validKpis,
        modelId: res.data.model.id,
        completed: true,
      });
    } catch (err: any) {
      console.error('❌ Save error:', err);
      alert(err.response?.data?.error || 'خطا در ذخیره مدل عملیاتی');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-6 text-gray-500">در حال بارگذاری...</div>;
  }

  return (
    <div className="space-y-4" dir="rtl">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          📌 <strong>گام ۱۰:</strong> مدل عملیاتی IAM را تعریف کنید.
          فرآیندها، گردش‌کارها و KPIهای کلیدی را مشخص کنید.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { key: 'processes', label: `فرآیندها (${processes.length})` },
          { key: 'workflows', label: `گردش‌کارها (${workflows.length})` },
          { key: 'kpis', label: `KPIها (${kpis.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.key
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* TAB 1: فرآیندها */}
      {/* ═══════════════════════════════════════════════ */}
      {activeTab === 'processes' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-700 text-sm">فرآیندهای اصلی</h3>
            <button
              onClick={() => setProcesses(DEFAULT_PROCESSES)}
              className="text-xs text-green-600 hover:text-green-800"
            >
              ⚡ بارگذاری ۱۰ فرآیند پیش‌فرض PDF
            </button>
          </div>

          {processes.map((process, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500">{process.code}</span>
                <button
                  onClick={() => removeProcess(index)}
                  className="text-red-500 hover:text-red-700 text-xs"
                >
                  ✕ حذف
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={process.name}
                  onChange={(e) => updateProcess(index, 'name', e.target.value)}
                  placeholder="نام فرآیند *"
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  value={process.description}
                  onChange={(e) => updateProcess(index, 'description', e.target.value)}
                  placeholder="توضیح کوتاه"
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                />
                <select
                  value={process.engine}
                  onChange={(e) => updateProcess(index, 'engine', e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                >
                  {ENGINES.map((e) => (
                    <option key={e.code} value={e.code}>{e.name}</option>
                  ))}
                </select>
                <select
                  value={process.owner_role}
                  onChange={(e) => updateProcess(index, 'owner_role', e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                >
                  {ROLES.map((r) => (
                    <option key={r.code} value={r.code}>{r.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={process.output}
                  onChange={(e) => updateProcess(index, 'output', e.target.value)}
                  placeholder="خروجی (مثلاً: برنامه دارایی)"
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg md:col-span-2"
                />
              </div>
            </div>
          ))}

          <button
            onClick={addProcess}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-500 hover:text-blue-500"
          >
            + افزودن فرآیند
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* TAB 2: گردش‌کارها */}
      {/* ═══════════════════════════════════════════════ */}
      {activeTab === 'workflows' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-700 text-sm">گردش‌کارها</h3>
            <button
              onClick={() => setWorkflows(DEFAULT_WORKFLOWS)}
              className="text-xs text-green-600 hover:text-green-800"
            >
              ⚡ بارگذاری ۹ گردش‌کار پیش‌فرض
            </button>
          </div>

          {workflows.map((workflow, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500">{workflow.code}</span>
                <button
                  onClick={() => removeWorkflow(index)}
                  className="text-red-500 hover:text-red-700 text-xs"
                >
                  ✕ حذف
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={workflow.name}
                  onChange={(e) => updateWorkflow(index, 'name', e.target.value)}
                  placeholder="نام گردش‌کار *"
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                />
                <select
                  value={workflow.process_code}
                  onChange={(e) => updateWorkflow(index, 'process_code', e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                >
                  {processes.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.code} — {p.name || 'بدون نام'}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={workflow.sla_days}
                  onChange={(e) => updateWorkflow(index, 'sla_days', Number(e.target.value))}
                  placeholder="SLA (روز)"
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                />
                <select
                  value={workflow.owner_role}
                  onChange={(e) => updateWorkflow(index, 'owner_role', e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                >
                  {ROLES.map((r) => (
                    <option key={r.code} value={r.code}>{r.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={workflow.steps.join(' → ')}
                  onChange={(e) => updateWorkflow(index, 'steps', e.target.value.split('→').map(s => s.trim()).filter(Boolean))}
                  placeholder="مراحل (با → جدا کن): کشف → ثبت → تصویب"
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg md:col-span-2"
                />
              </div>
            </div>
          ))}

          <button
            onClick={addWorkflow}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-500 hover:text-blue-500"
          >
            + افزودن گردش‌کار
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* TAB 3: KPIها */}
      {/* ═══════════════════════════════════════════════ */}
      {activeTab === 'kpis' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-700 text-sm">KPIهای کلیدی</h3>
            <button
              onClick={() => setKpis(DEFAULT_KPIS)}
              className="text-xs text-green-600 hover:text-green-800"
            >
              ⚡ بارگذاری ۶ KPI پیش‌فرض
            </button>
          </div>

          {kpis.map((kpi, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500">{kpi.code}</span>
                <button
                  onClick={() => removeKPI(index)}
                  className="text-red-500 hover:text-red-700 text-xs"
                >
                  ✕ حذف
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={kpi.name}
                  onChange={(e) => updateKPI(index, 'name', e.target.value)}
                  placeholder="نام KPI *"
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg md:col-span-2"
                />
                <input
                  type="text"
                  value={kpi.unit}
                  onChange={(e) => updateKPI(index, 'unit', e.target.value)}
                  placeholder="واحد (عدد/درصد/روز)"
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                />
                <input
                  type="number"
                  value={kpi.target}
                  onChange={(e) => updateKPI(index, 'target', Number(e.target.value))}
                  placeholder="هدف"
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                />
                <select
                  value={kpi.period}
                  onChange={(e) => updateKPI(index, 'period', e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                >
                  <option value="ماهانه">ماهانه</option>
                  <option value="فصلی">فصلی</option>
                  <option value="سالانه">سالانه</option>
                </select>
                <select
                  value={kpi.owner_role}
                  onChange={(e) => updateKPI(index, 'owner_role', e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                >
                  {ROLES.map((r) => (
                    <option key={r.code} value={r.code}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}

          <button
            onClick={addKPI}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-blue-500 hover:text-blue-500"
          >
            + افزودن KPI
          </button>
        </div>
      )}

      {/* Save */}
      <button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg transition"
      >
        {saving ? 'در حال ذخیره...' : '💾 ذخیره در پایگاه داده و ادامه'}
      </button>
    </div>
  );
}
