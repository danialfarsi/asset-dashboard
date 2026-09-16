'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle, RefreshCw, Plus, Award, FileText, Link as LinkIcon,
  Shield, DollarSign, ArrowRight, XCircle, Clock,
} from 'lucide-react';
import { engine05Api } from '@/services/engine05/api';

interface Project {
  id: number;
  title: string;
  project_type: string;
  project_type_display: string;
}

interface DevelopedAsset {
  id: number;
  project: number;
  is_new: boolean;
  source_asset: number | null;
  new_asset: number | null;
  version: string;
  tech_docs_url: string;
  registered_in_engine_1: boolean;
  protected_in_engine_3: boolean;
  valued_in_engine_2: boolean;
  created_at: string;
}

interface ClosureReport {
  id: number;
  project: number;
  final_kpi_score: number;
  realized_roi: number;
  lessons_learned: string;
  signoff_status: string;
  signoff_status_display: string;
  variance_summary: any;
  created_at: string;
}

export function CompletionPanel() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [assets, setAssets] = useState<DevelopedAsset[]>([]);
  const [closures, setClosures] = useState<ClosureReport[]>([]);
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [showClosureForm, setShowClosureForm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [saving, setSaving] = useState(false);

  const [assetForm, setAssetForm] = useState({
    is_new: true,
    version: '1.0.0',
    tech_docs_url: '',
    source_code_or_design: '',
  });

  const [closureForm, setClosureForm] = useState({
    final_kpi_score: 0,
    realized_roi: 0,
    lessons_learned: '',
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await engine05Api.getProjects();
      setProjects(res.data.results || []);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDetails = async (project: Project) => {
    setActiveProject(project);
    try {
      const [assetsRes, closuresRes] = await Promise.all([
        engine05Api.getDevelopedAssets({ project: project.id }),
        engine05Api.getClosureReports({ project: project.id }),
      ]);
      setAssets(assetsRes.data.results || []);
      setClosures(closuresRes.data.results || []);
    } catch (err) {
      console.error('Details error:', err);
    }
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;
    setSaving(true);
    try {
      await engine05Api.createDevelopedAsset({
        ...assetForm,
        project: activeProject.id,
      });
      showToast('دارایی توسعه‌یافته ثبت شد');
      setShowAssetForm(false);
      setAssetForm({ is_new: true, version: '1.0.0', tech_docs_url: '', source_code_or_design: '' });
      loadDetails(activeProject);
    } catch (err: any) {
      showToast('خطا در ثبت', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRegisterEngine = async (assetId: number, engine: string) => {
    try {
      if (engine === '1') await engine05Api.registerInEngine1(assetId);
      if (engine === '3') await engine05Api.protectInEngine3(assetId);
      if (engine === '2') await engine05Api.valueInEngine2(assetId);
      showToast(`ثبت در موتور ${engine} انجام شد`);
      if (activeProject) loadDetails(activeProject);
    } catch (err) {
      showToast('خطا', 'error');
    }
  };

  const handleCreateClosure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;
    setSaving(true);
    try {
      await engine05Api.createClosureReport({
        ...closureForm,
        project: activeProject.id,
      });
      showToast('گزارش اختتام ثبت شد');
      setShowClosureForm(false);
      setClosureForm({ final_kpi_score: 0, realized_roi: 0, lessons_learned: '' });
      loadDetails(activeProject);
    } catch (err: any) {
      showToast('خطا', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSign = async (closureId: number) => {
    try {
      await engine05Api.signClosureReport(closureId);
      showToast('گزارش امضا شد');
      if (activeProject) loadDetails(activeProject);
    } catch (err) {
      showToast('خطا', 'error');
    }
  };

  useEffect(() => { loadProjects(); }, []);

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* لیست پروژه‌ها */}
        <div className="lg:col-span-1">
          <h4 className="text-xs font-bold text-gray-500 mb-2">پروژه‌ها:</h4>
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => loadDetails(p)}
                className={`w-full text-right p-3 rounded-lg border-2 transition ${
                  activeProject?.id === p.id ? 'border-[#04241D] bg-[#04241D]/5' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-sm text-gray-800 truncate mb-1">{p.title}</div>
                <div className="text-[10px] text-gray-500">{p.project_type_display}</div>
              </button>
            ))}
          </div>
        </div>

        {/* جزئیات */}
        <div className="lg:col-span-2">
          {!activeProject ? (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-12 text-center h-full flex flex-col items-center justify-center">
              <CheckCircle className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 text-sm">یک پروژه انتخاب کنید</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-800">{activeProject.title}</h3>

              {/* دارایی‌های توسعه‌یافته */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                      <Award className="w-4 h-4 text-green-600" />
                      دارایی‌های توسعه‌یافته / جدید ({assets.length})
                    </h4>
                    <Button size="sm" variant="outline" onClick={() => setShowAssetForm(!showAssetForm)}>
                      <Plus className="w-3 h-3 ml-1" /> جدید
                    </Button>
                  </div>

                  {showAssetForm && (
                    <form onSubmit={handleCreateAsset} className="bg-gray-50 rounded-lg p-3 mb-3 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            نوع
                          </label>
                          <select
                            value={assetForm.is_new ? 'new' : 'developed'}
                            onChange={(e) => setAssetForm({ ...assetForm, is_new: e.target.value === 'new' })}
                            className="w-full px-3 py-2 border rounded-lg text-sm"
                          >
                            <option value="new">دارایی جدید</option>
                            <option value="developed">توسعه‌یافته</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            نسخه
                          </label>
                          <input value={assetForm.version}
                            onChange={(e) => setAssetForm({ ...assetForm, version: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg text-sm font-mono" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          لینک مستندات فنی
                        </label>
                        <input type="url" value={assetForm.tech_docs_url}
                          onChange={(e) => setAssetForm({ ...assetForm, tech_docs_url: e.target.value })}
                          placeholder="https://..."
                          className="w-full px-3 py-2 border rounded-lg text-sm" />
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" className="flex-1 text-xs" onClick={() => setShowAssetForm(false)}>انصراف</Button>
                        <Button type="submit" disabled={saving} className="flex-1 bg-[#04241D] text-xs">
                          {saving ? '...' : 'ثبت'}
                        </Button>
                      </div>
                    </form>
                  )}

                  {assets.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-3">هنوز دارایی‌ای ثبت نشده</p>
                  ) : (
                    <div className="space-y-2">
                      {assets.map((asset) => (
                        <div key={asset.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] px-2 py-0.5 rounded ${
                                asset.is_new ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {asset.is_new ? 'جدید' : 'توسعه‌یافته'}
                              </span>
                              <span className="font-mono text-xs text-gray-500">v{asset.version}</span>
                            </div>
                            {asset.tech_docs_url && (
                              <a href={asset.tech_docs_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-xs flex items-center gap-1">
                                <LinkIcon className="w-3 h-3" /> مستندات
                              </a>
                            )}
                          </div>

                          {/* ثبت در موتورها */}
                          <div className="grid grid-cols-3 gap-2">
                            <EngineStatus
                              engine="۱ (کشف)"
                              status={asset.registered_in_engine_1}
                              onRegister={() => handleRegisterEngine(asset.id, '1')}
                              icon={FileText}
                            />
                            <EngineStatus
                              engine="۳ (حفاظت)"
                              status={asset.protected_in_engine_3}
                              onRegister={() => handleRegisterEngine(asset.id, '3')}
                              icon={Shield}
                            />
                            <EngineStatus
                              engine="۲ (ارزش‌گذاری)"
                              status={asset.valued_in_engine_2}
                              onRegister={() => handleRegisterEngine(asset.id, '2')}
                              icon={DollarSign}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* گزارش اختتام */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-600" />
                      گزارش اختتام ({closures.length})
                    </h4>
                    {closures.length === 0 && (
                      <Button size="sm" variant="outline" onClick={() => setShowClosureForm(!showClosureForm)}>
                        <Plus className="w-3 h-3 ml-1" /> جدید
                      </Button>
                    )}
                  </div>

                  {showClosureForm && (
                    <form onSubmit={handleCreateClosure} className="bg-gray-50 rounded-lg p-3 mb-3 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">امتیاز نهایی KPI</label>
                          <input type="number" step="0.1"
                            value={closureForm.final_kpi_score}
                            onChange={(e) => setClosureForm({ ...closureForm, final_kpi_score: Number(e.target.value) })}
                            className="w-full px-3 py-2 border rounded-lg text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">ROI محقق‌شده (%)</label>
                          <input type="number" step="0.1"
                            value={closureForm.realized_roi}
                            onChange={(e) => setClosureForm({ ...closureForm, realized_roi: Number(e.target.value) })}
                            className="w-full px-3 py-2 border rounded-lg text-sm" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">درس‌آموخته‌ها</label>
                        <textarea value={closureForm.lessons_learned}
                          onChange={(e) => setClosureForm({ ...closureForm, lessons_learned: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border rounded-lg text-sm" />
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" className="flex-1 text-xs" onClick={() => setShowClosureForm(false)}>انصراف</Button>
                        <Button type="submit" disabled={saving} className="flex-1 bg-[#04241D] text-xs">
                          {saving ? '...' : 'ثبت'}
                        </Button>
                      </div>
                    </form>
                  )}

                  {closures.length === 0 && !showClosureForm ? (
                    <p className="text-xs text-gray-500 text-center py-3">گزارشی ثبت نشده</p>
                  ) : (
                    closures.map((closure) => (
                      <div key={closure.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="text-center">
                              <p className="text-[10px] text-gray-500">KPI</p>
                              <p className="text-lg font-bold text-blue-600">{closure.final_kpi_score}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] text-gray-500">ROI</p>
                              <p className="text-lg font-bold text-green-600">{closure.realized_roi}%</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {closure.signoff_status === 'signed' ? (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> امضا شده
                              </span>
                            ) : (
                              <Button size="sm" onClick={() => handleSign(closure.id)} className="bg-[#04241D] text-xs">
                                <CheckCircle className="w-3 h-3 ml-1" /> امضا
                              </Button>
                            )}
                          </div>
                        </div>
                        {closure.lessons_learned && (
                          <div className="bg-purple-50 border border-purple-200 rounded p-2 text-xs text-purple-800">
                            <span className="font-medium">درس‌آموخته‌ها: </span>
                            {closure.lessons_learned}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EngineStatus({ engine, status, onRegister, icon: Icon }: any) {
  return (
    <div className={`border rounded-lg p-2 text-center transition ${
      status ? 'border-green-200 bg-green-50' : 'border-gray-200'
    }`}>
      <div className="flex items-center justify-center gap-1 mb-1">
        <Icon className={`w-3 h-3 ${status ? 'text-green-600' : 'text-gray-400'}`} />
        <span className="text-[10px] text-gray-600">{engine}</span>
      </div>
      {status ? (
        <CheckCircle className="w-4 h-4 text-green-600 mx-auto" />
      ) : (
        <button onClick={onRegister} className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-1 mx-auto">
          ثبت <ArrowRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
