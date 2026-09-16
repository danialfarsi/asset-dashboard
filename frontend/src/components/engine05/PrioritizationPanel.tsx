'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart3, RefreshCw, CheckCircle, XCircle, TrendingUp,
  DollarSign, Award, ChevronDown, ChevronLeft, Hash,
} from 'lucide-react';
import { engine05Api } from '@/services/engine05/api';

interface Project {
  id: number;
  title: string;
  project_type: string;
  project_type_display: string;
  priority_score: number;
  rank: number;
  c1_strategic: number;
  c2_roi: number;
  c3_feasibility: number;
  c4_goal_alignment: number;
  c5_urgency: number;
  estimated_budget: string;
  approved_budget: string;
  approval_status: string;
  approval_status_display: string;
  organization_name: string;
  created_at: string;
  committee_comment: string;
}

export function PrioritizationPanel() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveComment, setApproveComment] = useState('');
  const [approveBudget, setApproveBudget] = useState<number>(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [projRes, statsRes] = await Promise.all([
        engine05Api.getProjects(),
        engine05Api.getProjectsStats(),
      ]);
      setProjects(projRes.data.results || []);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleApprove = async () => {
    if (!selectedProject) return;
    setActionLoading(true);
    try {
      await engine05Api.approveProject(selectedProject.id, {
        approved_budget: approveBudget || parseFloat(selectedProject.estimated_budget),
        comment: approveComment,
      });
      showToast(`پروژه «${selectedProject.title}» تأیید شد`);
      setShowApproveModal(false);
      setSelectedProject(null);
      setApproveComment('');
      setApproveBudget(0);
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'خطا در تأیید', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (project: Project) => {
    if (!confirm(`آیا از رد پروژه «${project.title}» مطمئن هستید؟`)) return;
    try {
      await engine05Api.rejectProject(project.id, { comment: 'رد شده توسط کمیته' });
      showToast('پروژه رد شد', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.response?.data?.error || 'خطا در رد', 'error');
    }
  };

  const handleRecalculateRanks = async () => {
    try {
      await engine05Api.recalculateRanks();
      showToast('رتبه‌بندی مجدد انجام شد');
      loadData();
    } catch (err: any) {
      showToast('خطا در رتبه‌بندی', 'error');
    }
  };

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

      {/* آمار */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox icon={<BarChart3 className="w-5 h-5" />} title="کل پروژه‌ها" value={stats?.total || 0} color="blue" />
        <StatBox icon={<CheckCircle className="w-5 h-5" />} title="تأیید شده" value={stats?.by_status?.approved || 0} color="green" />
        <StatBox icon={<XCircle className="w-5 h-5" />} title="رد شده" value={stats?.by_status?.rejected || 0} color="red" />
        <StatBox icon={<DollarSign className="w-5 h-5" />} title="بودجه تخمینی" value={formatMoney(String(stats?.total_estimated_budget || 0)) + ' ریال'} color="gold" />
      </div>

      {/* دکمه‌های عملیات */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-sm font-bold text-gray-800">لیست پروژه‌ها ({projects.length})</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRecalculateRanks}>
            <TrendingUp className="w-4 h-4 ml-1" /> رتبه‌بندی مجدد
          </Button>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-4 h-4 ml-1" /> بروزرسانی
          </Button>
        </div>
      </div>

      {/* جدول پروژه‌ها */}
      {projects.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">هیچ پروژه‌ای ثبت نشده</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <Card key={project.id} className={`border hover:shadow-md transition ${
              project.approval_status === 'approved' ? 'border-green-200 bg-green-50/30' :
              project.approval_status === 'rejected' ? 'border-red-200 bg-red-50/30 opacity-60' :
              'border-gray-200'
            }`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  {/* اطلاعات اصلی */}
                  <div className="flex-1 min-w-[250px]">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {/* رتبه */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        project.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                        project.rank === 2 ? 'bg-gray-100 text-gray-700' :
                        project.rank === 3 ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-50 text-blue-700'
                      }`}>
                        #{project.rank || '-'}
                      </div>
                      <span className="font-bold text-gray-800">{project.title}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded ${
                        project.project_type === 'DEV' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {project.project_type_display}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded ${
                        project.approval_status === 'approved' ? 'bg-green-100 text-green-700' :
                        project.approval_status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {project.approval_status_display}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                      <span>💰 بودجه: {formatMoney(project.estimated_budget)} ریال</span>
                      <span>|</span>
                      <span>🏢 {project.organization_name}</span>
                    </div>
                  </div>

                  {/* امتیاز */}
                  <div className="text-center px-4">
                    <p className="text-[10px] text-gray-500 mb-1">امتیاز اولویت</p>
                    <p className={`text-2xl font-bold ${
                      project.priority_score >= 4 ? 'text-green-600' :
                      project.priority_score >= 3 ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {project.priority_score?.toFixed(2)}
                    </p>
                  </div>

                  {/* دکمه‌ها */}
                  <div className="flex items-center gap-2">
                    {project.approval_status === 'pending' && (
                      <>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            setSelectedProject(project);
                            setApproveBudget(parseFloat(project.estimated_budget));
                            setShowApproveModal(true);
                          }}>
                          <CheckCircle className="w-3 h-3 ml-1" /> تأیید
                        </Button>
                        <Button size="sm" variant="destructive"
                          onClick={() => handleReject(project)}>
                          <XCircle className="w-3 h-3 ml-1" /> رد
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* معیارهای MCDM */}
                <div className="grid grid-cols-5 gap-2 mt-4 pt-3 border-t">
                  <MCDMCriteria label="C1 استراتژیک" value={project.c1_strategic} color="blue" />
                  <MCDMCriteria label="C2 ROI" value={project.c2_roi} color="green" />
                  <MCDMCriteria label="C3 امکان‌پذیری" value={project.c3_feasibility} color="purple" />
                  <MCDMCriteria label="C4 هم‌راستایی" value={project.c4_goal_alignment} color="amber" />
                  <MCDMCriteria label="C5 فوریت" value={project.c5_urgency} color="red" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal تأیید */}
      {showApproveModal && selectedProject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowApproveModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()} dir="rtl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              تأیید پروژه
            </h3>
            <p className="text-sm text-gray-600 mb-4">{selectedProject.title}</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  بودجه مصوب (ریال)
                </label>
                <input
                  type="number"
                  value={approveBudget}
                  onChange={(e) => setApproveBudget(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#04241D] outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  تخمینی: {formatMoney(selectedProject.estimated_budget)} ریال
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  نظر کمیته (اختیاری)
                </label>
                <textarea
                  value={approveComment}
                  onChange={(e) => setApproveComment(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#04241D] outline-none"
                  placeholder="نظر یا توضیحات..."
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setShowApproveModal(false)}>
                انصراف
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleApprove}
                disabled={actionLoading}
              >
                {actionLoading ? 'در حال تأیید...' : 'تأیید نهایی'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ icon, title, value, color }: any) {
  const colors: any = {
    blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-700',
    green: 'from-green-50 to-green-100 border-green-200 text-green-700',
    red: 'from-red-50 to-red-100 border-red-200 text-red-700',
    gold: 'from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-700',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-4`}>
      <div className="opacity-70 mb-1">{icon}</div>
      <p className="text-[10px] text-gray-600 mb-1">{title}</p>
      <p className="text-base font-bold">{value}</p>
    </div>
  );
}

function MCDMCriteria({ label, value, color }: any) {
  const colors: any = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  };
  const percent = (value / 5) * 100;
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] text-gray-500">{label}</span>
        <span className="text-[10px] font-bold text-gray-700">{value?.toFixed(1)}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div className={`${colors[color]} h-1.5 rounded-full transition-all`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
