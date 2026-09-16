'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText, RefreshCw, Plus, Target, DollarSign, Calendar,
  ChevronDown, ChevronLeft, Layers, Activity,
} from 'lucide-react';
import { engine05Api } from '@/services/engine05/api';

interface Project {
  id: number;
  title: string;
  project_type: string;
  project_type_display: string;
  priority_score: number;
  rank: number;
  approval_status: string;
  estimated_budget: string;
  approved_budget: string;
}

export function PlanningPanel() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'charter' | 'gantt' | 'budget'>('charter');
  const [charter, setCharter] = useState<any>(null);
  const [gantt, setGantt] = useState<any>(null);
  const [budget, setBudget] = useState<any>(null);
  const [subLoading, setSubLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await engine05Api.getProjects({ approval_status: 'approved' });
      setProjects(res.data.results || []);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectDetails = async (project: Project) => {
    setSubLoading(true);
    setActiveProject(project);
    try {
      const [charterRes, ganttRes, budgetRes] = await Promise.allSettled([
        engine05Api.getCharters({ project: project.id }),
        engine05Api.getGanttSchedules({ project: project.id }),
        engine05Api.getBudgets({ project: project.id }),
      ]);

      setCharter(charterRes.status === 'fulfilled' ? (charterRes.value.data.results?.[0] || null) : null);
      setGantt(ganttRes.status === 'fulfilled' ? (ganttRes.value.data.results?.[0] || null) : null);
      setBudget(budgetRes.status === 'fulfilled' ? (budgetRes.value.data.results?.[0] || null) : null);
    } catch (err) {
      console.error('Details error:', err);
    } finally {
      setSubLoading(false);
    }
  };

  useEffect(() => { loadProjects(); }, []);

  const formatMoney = (value: string) => {
    const num = parseFloat(value) || 0;
    if (num >= 1e9) return `${(num / 1e9).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} میلیارد`;
    if (num >= 1e6) return `${(num / 1e6).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} میلیون`;
    return num.toLocaleString('fa-IR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#04241D]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className={`px-6 py-3 rounded-xl shadow-lg border-2 flex items-center gap-3 ${
            toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <span>{toast.type === 'success' ? '✅' : '❌'}</span>
            <span className="font-medium text-sm">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800">
          پروژه‌های تأییدشده ({projects.length})
        </h3>
        <Button variant="outline" size="sm" onClick={loadProjects}>
          <RefreshCw className="w-4 h-4 ml-1" /> بروزرسانی
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">هیچ پروژه تأییدشده‌ای وجود ندارد</p>
          <p className="text-xs text-gray-400 mt-1">ابتدا در گام ۲ پروژه‌ها را تأیید کنید</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* لیست پروژه‌ها */}
          <div className="lg:col-span-1 space-y-2">
            <h4 className="text-xs font-bold text-gray-500 mb-2">انتخاب پروژه:</h4>
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => loadProjectDetails(project)}
                className={`w-full text-right p-3 rounded-lg border-2 transition ${
                  activeProject?.id === project.id
                    ? 'border-[#04241D] bg-[#04241D]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                    #{project.rank || '-'}
                  </span>
                  <span className="font-medium text-sm text-gray-800 truncate">{project.title}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-500">
                  <span>{project.project_type_display}</span>
                  <span>💰 {formatMoney(project.approved_budget || project.estimated_budget)}</span>
                </div>
              </button>
            ))}
          </div>

          {/* جزئیات پروژه */}
          <div className="lg:col-span-2">
            {!activeProject ? (
              <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-12 text-center h-full flex flex-col items-center justify-center">
                <FileText className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">برای مشاهده جزئیات، یک پروژه انتخاب کنید</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Sub tabs */}
                <div className="flex border-b border-gray-200">
                  {[
                    { key: 'charter', label: 'منشور پروژه', icon: FileText },
                    { key: 'gantt', label: 'زمان‌بندی گانت', icon: Calendar },
                    { key: 'budget', label: 'بودجه', icon: DollarSign },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeSubTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveSubTab(tab.key as any)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition ${
                          isActive
                            ? 'border-[#04241D] text-[#04241D]'
                            : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {subLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#04241D]"></div>
                  </div>
                ) : (
                  <>
                    {activeSubTab === 'charter' && <CharterTab project={activeProject} charter={charter} onReload={() => loadProjectDetails(activeProject)} />}
                    {activeSubTab === 'gantt' && <GanttTab project={activeProject} gantt={gantt} onReload={() => loadProjectDetails(activeProject)} />}
                    {activeSubTab === 'budget' && <BudgetTab project={activeProject} budget={budget} onReload={() => loadProjectDetails(activeProject)} />}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Charter Tab
// ═══════════════════════════════════════════════════════════

function CharterTab({ project, charter, onReload }: any) {
  const [form, setForm] = useState({
    scope: charter?.scope || '',
    business_case: charter?.business_case || '',
    methodology: charter?.methodology || 'linear',
    target_kpis: charter?.target_kpis || [],
    risks: charter?.risks || [],
  });
  const [saving, setSaving] = useState(false);
  const [newKPI, setNewKPI] = useState({ name: '', target: '', unit: '' });
  const [newRisk, setNewRisk] = useState({ risk: '', impact: '', mitigation: '' });

  useEffect(() => {
    if (charter) {
      setForm({
        scope: charter.scope || '',
        business_case: charter.business_case || '',
        methodology: charter.methodology || 'linear',
        target_kpis: charter.target_kpis || [],
        risks: charter.risks || [],
      });
    }
  }, [charter]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (charter && charter.id) {
        // آپدیت
        await engine05Api.updateCharter(charter.id, { ...form, project: project.id });
      } else {
        // چک کن قبلاً وجود داره یا نه
        const res = await engine05Api.getCharters({ project: project.id });
        const existing = res.data.results?.[0];
        
        if (existing) {
          await engine05Api.updateCharter(existing.id, { ...form, project: project.id });
        } else {
          await engine05Api.createCharter({ ...form, project: project.id });
        }
      }
      onReload();
    } catch (err) {
      console.error(err);
      alert('خطا در ذخیره');
    } finally {
      setSaving(false);
    }
  };

  const addKPI = () => {
    if (!newKPI.name) return;
    setForm({ ...form, target_kpis: [...form.target_kpis, newKPI] });
    setNewKPI({ name: '', target: '', unit: '' });
  };

  const addRisk = () => {
    if (!newRisk.risk) return;
    setForm({ ...form, risks: [...form.risks, newRisk] });
    setNewRisk({ risk: '', impact: '', mitigation: '' });
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">محدوده پروژه</label>
          <textarea
            value={form.scope}
            onChange={(e) => setForm({ ...form, scope: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#04241D] outline-none"
            placeholder="محدوده پروژه را تعریف کنید..."
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">توجیه کسب‌وکار</label>
          <textarea
            value={form.business_case}
            onChange={(e) => setForm({ ...form, business_case: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#04241D] outline-none"
            placeholder="توجیه اقتصادی و کسب‌وکار..."
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">متدولوژی</label>
          <select
            value={form.methodology}
            onChange={(e) => setForm({ ...form, methodology: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#04241D] outline-none"
          >
            <option value="linear">آبشاری / خطی</option>
            <option value="stage_gate">مرحله‌ای (Stage-Gate)</option>
          </select>
        </div>

        {/* KPIها */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">KPIهای هدف</label>
          <div className="space-y-2">
            {form.target_kpis.map((kpi: any, i: number) => (
              <div key={i} className="flex items-center gap-2 bg-gray-50 rounded p-2">
                <span className="flex-1 text-sm">{kpi.name}</span>
                <span className="text-xs text-gray-500">هدف: {kpi.target} {kpi.unit}</span>
                <button onClick={() => setForm({ ...form, target_kpis: form.target_kpis.filter((_: any, j: number) => j !== i) })}
                  className="text-red-500 text-xs">✕</button>
              </div>
            ))}
            <div className="grid grid-cols-3 gap-2">
              <input value={newKPI.name} onChange={(e) => setNewKPI({ ...newKPI, name: e.target.value })}
                placeholder="نام KPI" className="px-2 py-1.5 text-xs border rounded" />
              <input value={newKPI.target} onChange={(e) => setNewKPI({ ...newKPI, target: e.target.value })}
                placeholder="هدف" className="px-2 py-1.5 text-xs border rounded" />
              <div className="flex gap-1">
                <input value={newKPI.unit} onChange={(e) => setNewKPI({ ...newKPI, unit: e.target.value })}
                  placeholder="واحد" className="flex-1 px-2 py-1.5 text-xs border rounded" />
                <Button size="sm" variant="outline" onClick={addKPI} className="text-xs">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full bg-[#04241D]">
          {saving ? 'در حال ذخیره...' : charter ? 'بروزرسانی منشور' : 'ساخت منشور'}
        </Button>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
// Gantt Tab
// ═══════════════════════════════════════════════════════════

function GanttTab({ project, gantt, onReload }: any) {
  const [form, setForm] = useState({
    start_date: gantt?.start_date || '',
    end_date: gantt?.end_date || '',
    milestones: gantt?.milestones || [],
    wbs: gantt?.wbs || [],
  });
  const [saving, setSaving] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ name: '', due_date: '', gate: false });

  useEffect(() => {
    if (gantt) {
      setForm({
        start_date: gantt.start_date || '',
        end_date: gantt.end_date || '',
        milestones: gantt.milestones || [],
        wbs: gantt.wbs || [],
      });
    }
  }, [gantt]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (gantt) {
        await engine05Api.updateGanttSchedule(gantt.id, { ...form, project: project.id });
      } else {
        await engine05Api.createGanttSchedule({ ...form, project: project.id });
      }
      onReload();
    } catch (err) {
      console.error(err);
      alert('خطا');
    } finally {
      setSaving(false);
    }
  };

  const addMilestone = () => {
    if (!newMilestone.name) return;
    setForm({
      ...form,
      milestones: [...form.milestones, {
        id: Date.now(),
        name: newMilestone.name,
        due_date: newMilestone.due_date,
        gate_decision_required: newMilestone.gate,
        status: 'pending',
      }]
    });
    setNewMilestone({ name: '', due_date: '', gate: false });
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">تاریخ شروع</label>
            <input type="date" value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">تاریخ پایان</label>
            <input type="date" value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">Milestoneها</label>
          <div className="space-y-2">
            {form.milestones.map((ms: any, i: number) => (
              <div key={i} className="flex items-center gap-2 bg-gray-50 rounded p-2 text-xs">
                <span className="flex-1">{ms.name}</span>
                <span className="text-gray-500">{ms.due_date}</span>
                {ms.gate_decision_required && <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">گیت</span>}
                <button onClick={() => setForm({ ...form, milestones: form.milestones.filter((_: any, j: number) => j !== i) })}
                  className="text-red-500">✕</button>
              </div>
            ))}
            <div className="grid grid-cols-3 gap-2">
              <input value={newMilestone.name} onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
                placeholder="نام Milestone" className="col-span-1 px-2 py-1.5 text-xs border rounded" />
              <input type="date" value={newMilestone.due_date}
                onChange={(e) => setNewMilestone({ ...newMilestone, due_date: e.target.value })}
                className="px-2 py-1.5 text-xs border rounded" />
              <div className="flex gap-1">
                <label className="flex items-center gap-1 text-xs flex-1">
                  <input type="checkbox" checked={newMilestone.gate}
                    onChange={(e) => setNewMilestone({ ...newMilestone, gate: e.target.checked })} />
                  گیت؟
                </label>
                <Button size="sm" variant="outline" onClick={addMilestone} className="text-xs">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full bg-[#04241D]">
          {saving ? 'در حال ذخیره...' : gantt ? 'بروزرسانی گانت' : 'ساخت گانت'}
        </Button>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════
// Budget Tab
// ═══════════════════════════════════════════════════════════

function BudgetTab({ project, budget, onReload }: any) {
  const [form, setForm] = useState({
    capex: budget?.capex || 0,
    opex: budget?.opex || 0,
    contingency_reserve: budget?.contingency_reserve || 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (budget) {
      setForm({
        capex: parseFloat(budget.capex) || 0,
        opex: parseFloat(budget.opex) || 0,
        contingency_reserve: parseFloat(budget.contingency_reserve) || 0,
      });
    }
  }, [budget]);

  const total = form.capex + form.opex + form.contingency_reserve;

  const handleSave = async () => {
    setSaving(true);
    try {
      if (budget) {
        await engine05Api.updateBudget(budget.id, { ...form, project: project.id });
      } else {
        await engine05Api.createBudget({ ...form, project: project.id });
      }
      onReload();
    } catch (err) {
      console.error(err);
      alert('خطا');
    } finally {
      setSaving(false);
    }
  };

  const formatMoney = (v: number) => {
    if (v >= 1e9) return `${(v / 1e9).toLocaleString('fa-IR', { maximumFractionDigits: 2 })} میلیارد`;
    if (v >= 1e6) return `${(v / 1e6).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} میلیون`;
    return v.toLocaleString('fa-IR');
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              هزینه سرمایه‌ای (Capex) - ریال
            </label>
            <input type="number" value={form.capex}
              onChange={(e) => setForm({ ...form, capex: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#04241D] outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              هزینه عملیاتی (Opex) - ریال
            </label>
            <input type="number" value={form.opex}
              onChange={(e) => setForm({ ...form, opex: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#04241D] outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              ذخیره احتمالی - ریال
            </label>
            <input type="number" value={form.contingency_reserve}
              onChange={(e) => setForm({ ...form, contingency_reserve: Number(e.target.value) })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#04241D] outline-none" />
          </div>
        </div>

        <div className="bg-gradient-to-l from-[#04241D] to-[#0B3D30] rounded-lg p-4 text-white">
          <div className="flex justify-between items-center">
            <span className="text-sm">جمع کل بودجه:</span>
            <span className="text-xl font-bold">{formatMoney(total)} ریال</span>
          </div>
          {budget && (
            <div className="mt-3 pt-3 border-t border-white/20 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-white/60">مصرف‌شده:</span>
                <p className="font-bold">{formatMoney(parseFloat(budget.consumed_amount) || 0)}</p>
              </div>
              <div>
                <span className="text-white/60">باقی‌مانده:</span>
                <p className="font-bold">{formatMoney(parseFloat(budget.total_amount) - parseFloat(budget.consumed_amount))}</p>
              </div>
            </div>
          )}
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full bg-[#04241D]">
          {saving ? 'در حال ذخیره...' : budget ? 'بروزرسانی بودجه' : 'ثبت بودجه'}
        </Button>
      </CardContent>
    </Card>
  );
}
