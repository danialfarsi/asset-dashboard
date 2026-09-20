'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Activity, RefreshCw, Plus, TrendingUp, TrendingDown, AlertCircle,
  Clock, CheckCircle, XCircle, Pause, RotateCcw, Target,
} from 'lucide-react';
import { engine05Api } from '@/services/engine05/api';
import { AlertsBanner } from './AlertsBanner';
import { useAlerts } from '@/hooks/useAlerts';

interface Project {
  id: number;
  title: string;
  project_type: string;
  project_type_display: string;
  approval_status: string;
}

interface ProgressReport {
  id: number;
  project: number;
  report_number: number;
  report_date: string;
  physical_progress_pct: number;
  budget_consumed_pct: number;
  spi: number;
  cpi: number;
  active_risks: any[];
  gate_decision: string;
  gate_decision_display: string;
  gate_notes: string;
  notes: string;
  created_at: string;
}

const GATE_OPTIONS = [
  { value: 'go', label: 'ادامه به فاز بعد', icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-200' },
  { value: 'recycle', label: 'اصلاح فاز فعلی', icon: RotateCcw, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { value: 'hold', label: 'تعلیق موقت', icon: Pause, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { value: 'kill', label: 'توقف و ابطال', icon: XCircle, color: 'text-red-600 bg-red-50 border-red-200' },
  { value: 'na', label: 'بدون تصمیم', icon: Clock, color: 'text-gray-500 bg-gray-50 border-gray-200' },
];

export function ExecutionPanel() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [reports, setReports] = useState<ProgressReport[]>([]);
  const [showForm, setShowForm] = useState(false);
  const { alertsByProject } = useAlerts(60000);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState({
    physical_progress_pct: 0,
    budget_consumed_pct: 0,
    spi: 1.0,
    cpi: 1.0,
    gate_decision: 'na',
    gate_notes: '',
    notes: '',
  });
  const [autoPreview, setAutoPreview] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // محاسبه auto decision (هم‌راستا با Backend)
  const computeAutoDecision = (spi: number, cpi: number, progress: number) => {
    const alerts: string[] = [];

    // KILL
    if (spi < 0.70 || cpi < 0.65) {
      const reasons = [];
      if (spi < 0.70) reasons.push(`SPI=${spi.toFixed(2)}`);
      if (cpi < 0.65) reasons.push(`CPI=${cpi.toFixed(2)}`);
      if (spi < 0.70) alerts.push(`SPI بحرانی: ${spi.toFixed(2)}`);
      if (cpi < 0.65) alerts.push(`CPI بحرانی: ${cpi.toFixed(2)}`);
      return {
        decision: 'kill',
        reason: '🚨 توقف فوری: ' + reasons.join(' و '),
        confidence: 0.95,
        alerts,
      };
    }

    // RECYCLE
    if (spi < 0.85 || cpi < 0.80) {
      const reasons = [];
      if (spi < 0.85) {
        reasons.push(`SPI=${spi.toFixed(2)}`);
        alerts.push(`SPI پایین: ${spi.toFixed(2)}`);
      }
      if (cpi < 0.80) {
        reasons.push(`CPI=${cpi.toFixed(2)}`);
        alerts.push(`CPI پایین: ${cpi.toFixed(2)}`);
      }
      return {
        decision: 'recycle',
        reason: '⚠️ بازنگری لازم: ' + reasons.join(' و '),
        confidence: 0.85,
        alerts,
      };
    }

    // GO
    if (spi >= 0.95 && cpi >= 0.90) {
      if (progress < 5) {
        return {
          decision: 'hold',
          reason: '⏸ پیشرفت خیلی کم',
          confidence: 0.70,
          alerts: ['پیشرفت فیزیکی کمتر از ۵٪'],
        };
      }
      return {
        decision: 'go',
        reason: `✅ عملکرد مطلوب (SPI=${spi.toFixed(2)}, CPI=${cpi.toFixed(2)})`,
        confidence: 0.95,
        alerts: [],
      };
    }

    // HOLD
    return {
      decision: 'hold',
      reason: `⏸ نگه‌داری (SPI=${spi.toFixed(2)}, CPI=${cpi.toFixed(2)})`,
      confidence: 0.60,
      alerts: [],
    };
  };

  // به‌روزرسانی auto preview
  const updateAutoPreview = (spi: number, cpi: number, progress: number) => {
    const result = computeAutoDecision(spi, cpi, progress);
    setAutoPreview(result);
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

  const loadReports = async (project: Project) => {
    setActiveProject(project);
    try {
      const res = await engine05Api.getProgressReports({ project: project.id });
      setReports(res.data.results || []);
    } catch (err) {
      console.error('Reports error:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;
    setSaving(true);
    try {
      await engine05Api.createProgressReport({
        ...form,
        project: activeProject.id,
      });
      showToast('گزارش پیشرفت ثبت شد');
      setShowForm(false);
      setForm({
        physical_progress_pct: 0,
        budget_consumed_pct: 0,
        spi: 1.0,
        cpi: 1.0,
        gate_decision: 'na',
        gate_notes: '',
        notes: '',
      });
      loadReports(activeProject);
    } catch (err: any) {
      showToast(err.response?.data?.error || 'خطا', 'error');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => { loadProjects(); }, []);

  const getGateIcon = (decision: string) => {
    const opt = GATE_OPTIONS.find(o => o.value === decision);
    if (!opt) return Clock;
    return opt.icon;
  };

  const getGateColor = (decision: string) => {
    const opt = GATE_OPTIONS.find(o => o.value === decision);
    if (!opt) return 'text-gray-500 bg-gray-50 border-gray-200';
    return opt.color;
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

      {/* 🎯 نوار هشدارها */}
      <AlertsBanner />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* لیست پروژه‌ها */}
        <div className="lg:col-span-1">
          <h4 className="text-xs font-bold text-gray-500 mb-2">پروژه‌های در حال اجرا:</h4>
          <div className="space-y-2">
            {projects.length === 0 ? (
              <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                <Activity className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500">پروژه‌ای در حال اجرا نیست</p>
              </div>
            ) : (
              projects.map((p) => {
                const alerts = alertsByProject[p.id];
                const hasCritical = alerts?.has_critical;
                const alertCount = alerts?.count || 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => loadReports(p)}
                    className={`w-full text-right p-3 rounded-lg border-2 transition ${
                      activeProject?.id === p.id ? 'border-[#04241D] bg-[#04241D]/5' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="font-medium text-sm text-gray-800 truncate flex-1">{p.title}</div>
                      {alertCount > 0 && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold whitespace-nowrap shrink-0 ${
                          hasCritical
                            ? 'bg-red-600 text-white'
                            : 'bg-amber-500 text-white'
                        }`}>
                          {hasCritical ? '🚨' : '⚠️'} {alertCount}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-500">{p.project_type_display}</div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* جزئیات */}
        <div className="lg:col-span-2">
          {!activeProject ? (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-12 text-center h-full flex flex-col items-center justify-center">
              <Activity className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">یک پروژه انتخاب کنید</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h3 className="text-sm font-bold text-gray-800">{activeProject.title}</h3>
                <Button size="sm" className="bg-[#04241D]" onClick={() => setShowForm(!showForm)}>
                  <Plus className="w-4 h-4 ml-1" /> گزارش جدید
                </Button>
              </div>

              {/* فرم گزارش جدید */}
              {showForm && (
                <Card className="border-2 border-[#04241D]/20">
                  <CardContent className="p-5">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            پیشرفت فیزیکی (%)
                          </label>
                          <input type="number" min="0" max="100"
                            value={form.physical_progress_pct}
                            onChange={(e) => setForm({ ...form, physical_progress_pct: Number(e.target.value) })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#04241D] outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            مصرف بودجه (%)
                          </label>
                          <input type="number" min="0" max="100"
                            value={form.budget_consumed_pct}
                            onChange={(e) => setForm({ ...form, budget_consumed_pct: Number(e.target.value) })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#04241D] outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            SPI (شاخص زمان)
                          </label>
                          <input type="number" step="0.01" min="0.1" max="3"
                            value={form.spi}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              if (v >= 0.1 && v <= 3) {
                                setForm({ ...form, spi: v });
                                updateAutoPreview(v, form.cpi, form.physical_progress_pct);
                              }
                            }}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#04241D] outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            CPI (شاخص هزینه)
                          </label>
                          <input type="number" step="0.01" min="0.1" max="3"
                            value={form.cpi}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              if (v >= 0.1 && v <= 3) {
                                setForm({ ...form, cpi: v });
                                updateAutoPreview(form.spi, v, form.physical_progress_pct);
                              }
                            }}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#04241D] outline-none" />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-medium text-gray-700">
                            تصمیم گیت (Stage-Gate)
                          </label>
                          {autoPreview && (
                            <button
                              type="button"
                              onClick={() => {
                                setForm({ ...form, gate_decision: autoPreview.decision });
                                showToast('تصمیم خودکار اعمال شد');
                              }}
                              className="text-[10px] bg-[#04241D] text-white px-2 py-1 rounded hover:opacity-90"
                            >
                              ⚡ اعمال خودکار
                            </button>
                          )}
                        </div>

                        {/* Auto Preview */}
                        {autoPreview && (
                          <div className={`mb-3 border-2 rounded-lg p-3 ${
                            autoPreview.decision === 'go' ? 'bg-green-50 border-green-300' :
                            autoPreview.decision === 'kill' ? 'bg-red-50 border-red-300' :
                            autoPreview.decision === 'recycle' ? 'bg-amber-50 border-amber-300' :
                            'bg-gray-50 border-gray-300'
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold">
                                🤖 پیشنهاد خودکار:
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                                autoPreview.decision === 'go' ? 'bg-green-200 text-green-800' :
                                autoPreview.decision === 'kill' ? 'bg-red-200 text-red-800' :
                                autoPreview.decision === 'recycle' ? 'bg-amber-200 text-amber-800' :
                                'bg-gray-200 text-gray-800'
                              }`}>
                                {autoPreview.decision.toUpperCase()}
                              </span>
                              <span className="text-[10px] text-gray-500">
                                (اطمینان: {(autoPreview.confidence * 100).toFixed(0)}%)
                              </span>
                            </div>
                            <p className="text-xs text-gray-700">{autoPreview.reason}</p>
                            {autoPreview.alerts && autoPreview.alerts.length > 0 && (
                              <div className="mt-2 space-y-0.5">
                                {autoPreview.alerts.map((a: string, i: number) => (
                                  <div key={i} className="text-[10px] text-amber-700">
                                    ⚠️ {a}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          {GATE_OPTIONS.map((opt) => {
                            const Icon = opt.icon;
                            const isActive = form.gate_decision === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setForm({ ...form, gate_decision: opt.value })}
                                className={`p-2 rounded-lg border-2 text-xs flex flex-col items-center gap-1 transition ${
                                  isActive ? opt.color : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                                <span>{opt.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {form.gate_decision !== 'na' && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            یادداشت تصمیم گیت
                          </label>
                          <textarea value={form.gate_notes}
                            onChange={(e) => setForm({ ...form, gate_notes: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#04241D] outline-none" />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          توضیحات
                        </label>
                        <textarea value={form.notes}
                          onChange={(e) => setForm({ ...form, notes: e.target.value })}
                          rows={2}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#04241D] outline-none" />
                      </div>

                      <div className="flex gap-2">
                        <Button type="button" variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
                          انصراف
                        </Button>
                        <Button type="submit" disabled={saving} className="flex-1 bg-[#04241D]">
                          {saving ? 'در حال ثبت...' : 'ثبت گزارش'}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* لیست گزارش‌ها */}
              {reports.length === 0 && !showForm ? (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                  <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">گزارشی ثبت نشده</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map((report) => {
                    const GateIcon = getGateIcon(report.gate_decision);
                    const gateColor = getGateColor(report.gate_decision);
                    return (
                      <Card key={report.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">
                                گزارش #{report.report_number}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(report.report_date).toLocaleDateString('fa-IR')}
                              </span>
                            </div>
                            {report.gate_decision !== 'na' && (
                              <span className={`text-[10px] px-2 py-1 rounded border flex items-center gap-1 ${gateColor}`}>
                                <GateIcon className="w-3 h-3" />
                                {report.gate_decision_display}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-4 gap-3 mb-3">
                            <MiniStat label="پیشرفت فیزیکی" value={`${report.physical_progress_pct}%`} color="blue" />
                            <MiniStat label="مصرف بودجه" value={`${report.budget_consumed_pct}%`} color="amber" />
                            <MiniStat
                              label="SPI"
                              value={report.spi.toFixed(2)}
                              color={report.spi >= 0.85 ? 'green' : 'red'}
                            />
                            <MiniStat
                              label="CPI"
                              value={report.cpi.toFixed(2)}
                              color={report.cpi >= 0.80 ? 'green' : 'red'}
                            />
                          </div>

                          {report.gate_notes && (
                            <div className="bg-amber-50 border border-amber-200 rounded p-2 text-xs text-amber-800 mb-2">
                              <span className="font-medium">یادداشت تصمیم: </span>
                              {report.gate_notes}
                            </div>
                          )}

                          {report.notes && (
                            <p className="text-xs text-gray-600">{report.notes}</p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: any) {
  const colors: any = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
  };
  return (
    <div className={`border rounded-lg p-2 text-center ${colors[color]}`}>
      <p className="text-[10px] opacity-70 mb-0.5">{label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}
