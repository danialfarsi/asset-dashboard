'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import {
  ArrowRight, Building2, Users, FileText, Target, Shield, GitBranch,
  Settings, Rocket, Award, CheckCircle, Clock, AlertCircle, ChevronDown,
  ChevronLeft, Package, BarChart3, Layers, Activity, User, Briefcase,
  DollarSign, TrendingUp, Calendar,
} from 'lucide-react';

export default function AdminViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [request, setRequest] = useState<any>(null);
  const [stepData, setStepData] = useState<any>({});
  const [viamData, setViamData] = useState<any>({});
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    steps12: true, raci: true, opModel: true, tenant: true, pilot: true, departments: true,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const reqRes = await api.get(`/intangible/viam/establishment-requests/${id}/`);
        setRequest(reqRes.data);

        try {
          const saved = localStorage.getItem(`viam_step_data_${id}`);
          if (saved) setStepData(JSON.parse(saved));
        } catch (e) { console.warn(e); }

        try {
          const [raciRes, opModelRes, tenantRes, pilotRes, deptsRes, committeeRes, charterRes] = await Promise.allSettled([
            api.get('/intangible/viam/ownership/raci-template/my/'),
            api.get('/intangible/viam/operational-model/my/'),
            api.get('/intangible/viam/tenant-config/my/'),
            api.get('/intangible/viam/pilot/my/'),
            api.get('/auth/departments/my/'),
            api.get('/intangible/viam/committee/committees/'),
            api.get('/intangible/viam/charters/'),
          ]);

          setViamData({
            raci: raciRes.status === 'fulfilled' ? raciRes.value.data.template : null,
            operationalModel: opModelRes.status === 'fulfilled' ? opModelRes.value.data.model : null,
            tenant: tenantRes.status === 'fulfilled' ? tenantRes.value.data.config : null,
            pilot: pilotRes.status === 'fulfilled' ? pilotRes.value.data.pilot : null,
            committees: committeeRes.status === 'fulfilled' ? (committeeRes.value.data.results || []) : [],
            charters: charterRes.status === 'fulfilled' ? (charterRes.value.data.results || []) : [],
          });

          if (deptsRes.status === 'fulfilled') {
            setDepartments(deptsRes.value.data.departments || []);
          }
        } catch (e) { console.warn(e); }
      } catch (err: any) {
        setError(err.response?.data?.detail || 'خطا در بارگذاری');
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="container mx-auto p-6 rtl">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-bold">❌ خطا</p>
          <p>{error || 'درخواست یافت نشد'}</p>
        </div>
        <Link href="/dashboard">
          <button className="mt-4 text-blue-600 hover:text-blue-800">← بازگشت</button>
        </Link>
      </div>
    );
  }

  const stepLabels: any = {
    1: 'ثبت درخواست تأسیس', 2: 'تعیین حامی اجرایی', 3: 'انتخاب مدل حکمرانی',
    4: 'تعیین محل استقرار سازمانی', 5: 'تدوین منشور', 6: 'تشکیل کمیته',
    7: 'تعیین مدیر IAM', 8: 'تعیین واحدها و دعوت مدیران', 9: 'تعریف RACI اولیه',
    10: 'تصویب مدل عملیاتی', 11: 'پیکربندی در پلتفرم', 12: 'آغاز پایلوت',
  };

  return (
    <div className="container mx-auto p-6 rtl max-w-6xl">
      <div className="mb-4">
        <Link href="/dashboard">
          <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#04241D] transition group">
            <ArrowRight className="w-4 h-4 group-hover:-translate-x-1 transition" />
            <span>بازگشت به داشبورد</span>
          </button>
        </Link>
      </div>

      <div className="bg-gradient-to-l from-[#04241D] to-[#0B3D30] rounded-2xl shadow-xl p-6 mb-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-white/60 text-xs mb-1">گزارش کامل درخواست تأسیس IAM</p>
            <h1 className="text-2xl font-bold mb-2">{request.title}</h1>
            <div className="flex items-center gap-3 text-sm flex-wrap">
              <span className="bg-white/10 px-2.5 py-1 rounded font-mono text-xs">#{request.id}</span>
              <span className={`px-2.5 py-1 rounded text-xs ${
                request.status === 'approved' ? 'bg-green-500/20 text-green-200' :
                request.status === 'submitted' ? 'bg-yellow-500/20 text-yellow-200' :
                request.status === 'rejected' ? 'bg-red-500/20 text-red-200' :
                'bg-white/10 text-white/80'
              }`}>
                {request.status === 'draft' ? 'پیش‌نویس' : request.status === 'submitted' ? 'ارسال شده' :
                 request.status === 'approved' ? 'تأیید شده' : request.status === 'rejected' ? 'رد شده' :
                 request.status === 'active' ? 'فعال' : request.status}
              </span>
              <span className="bg-white/10 px-2.5 py-1 rounded text-xs">گام {request.current_step}/12</span>
            </div>
          </div>
          <div className="text-4xl">📋</div>
        </div>
        {request.description && (
          <div className="mt-4 bg-white/5 rounded-lg p-3 text-sm">
            <span className="text-white/60 text-xs">شرح: </span>
            <span>{request.description}</span>
          </div>
        )}
        {request.justification && (
          <div className="mt-2 bg-white/5 rounded-lg p-3 text-sm">
            <span className="text-white/60 text-xs">دلایل توجیهی: </span>
            <span>{request.justification}</span>
          </div>
        )}
      </div>

      <SectionCard icon={<FileText className="w-5 h-5" />} title="۱۲ گام استقرار" count={`${Object.keys(stepData).length}/12`} isOpen={openSections.steps12} onToggle={() => toggleSection('steps12')} color="blue">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => {
            const data = stepData[num];
            const isCompleted = data?.completed || num < request.current_step;
            const isCurrent = num === request.current_step;
            return (
              <div key={num} className={`border-2 rounded-lg p-3 ${
                isCompleted ? 'border-green-200 bg-green-50/30' :
                isCurrent ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200 bg-gray-50/30 opacity-60'
              }`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    isCompleted ? 'bg-green-500 text-white' :
                    isCurrent ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    {isCompleted ? '✓' : num}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isCompleted ? 'text-green-800' : isCurrent ? 'text-blue-800' : 'text-gray-500'}`}>
                      گام {num}: {stepLabels[num]}
                    </p>
                  </div>
                </div>
                {data && (
                  <div className="mr-10 text-xs bg-white rounded p-2 border border-gray-100">
                    <StepDataDisplay stepNum={num} data={data} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>

      {viamData.raci && (
        <SectionCard icon={<GitBranch className="w-5 h-5" />} title="ماتریس RACI" count={`${Object.keys(viamData.raci.matrix || {}).length} فعالیت`} isOpen={openSections.raci} onToggle={() => toggleSection('raci')} color="green">
          <RACIDisplay raci={viamData.raci} />
        </SectionCard>
      )}

      {viamData.operationalModel && (
        <SectionCard icon={<Settings className="w-5 h-5" />} title="مدل عملیاتی" count={`${(viamData.operationalModel.processes || []).length} فرآیند`} isOpen={openSections.opModel} onToggle={() => toggleSection('opModel')} color="teal">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <StatBox label="فرآیندها" value={(viamData.operationalModel.processes || []).length} />
              <StatBox label="گردش‌کارها" value={(viamData.operationalModel.workflows || []).length} />
              <StatBox label="KPIها" value={(viamData.operationalModel.kpis || []).length} />
            </div>
            {(viamData.operationalModel.processes || []).length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-2">فرآیندها:</h4>
                <div className="space-y-2">
                  {viamData.operationalModel.processes.map((p: any, i: number) => (
                    <div key={i} className="bg-white border border-gray-200 rounded p-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">{p.code}</span>
                        <span className="font-medium text-gray-800">{p.name}</span>
                      </div>
                      {p.description && <p className="text-gray-500 mt-1">{p.description}</p>}
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
                        {p.engine && <span>⚙️ {p.engine}</span>}
                        {p.owner_role && <span>👤 {p.owner_role}</span>}
                        {p.output && <span>📤 {p.output}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(viamData.operationalModel.kpis || []).length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-2">KPIها:</h4>
                <div className="space-y-2">
                  {viamData.operationalModel.kpis.map((k: any, i: number) => (
                    <div key={i} className="bg-white border border-gray-200 rounded p-2 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-800">{k.name}</span>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500">
                          {k.unit && <span>واحد: {k.unit}</span>}
                          {k.period && <span>دوره: {k.period}</span>}
                          {k.owner_role && <span>مسئول: {k.owner_role}</span>}
                        </div>
                      </div>
                      {k.target !== undefined && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">هدف: {k.target}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {viamData.tenant && (
        <SectionCard icon={<Rocket className="w-5 h-5" />} title="پیکربندی پلتفرم" count={`${(viamData.tenant.enabled_modules || []).length} ماژول`} isOpen={openSections.tenant} onToggle={() => toggleSection('tenant')} color="yellow">
          <div className="space-y-3">
            <div className="bg-white border border-gray-200 rounded p-3 text-sm">
              <span className="text-gray-500 text-xs">نام Tenant: </span>
              <span className="font-medium">{viamData.tenant.tenant_name}</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-2">ماژول‌های فعال:</h4>
              <div className="flex flex-wrap gap-2">
                {(viamData.tenant.enabled_modules || []).map((m: string, i: number) => (
                  <span key={i} className="text-xs bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded">{m}</span>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {viamData.pilot && (
        <SectionCard icon={<Target className="w-5 h-5" />} title="پایلوت" count={viamData.pilot.status} isOpen={openSections.pilot} onToggle={() => toggleSection('pilot')} color="orange">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatBox label="نام پایلوت" value={viamData.pilot.name} />
            <StatBox label="دارایی هدف" value={viamData.pilot.asset_count_target} />
            <StatBox label="شروع" value={viamData.pilot.start_date ? new Date(viamData.pilot.start_date).toLocaleDateString('fa-IR') : '—'} />
            <StatBox label="پایان" value={viamData.pilot.end_date ? new Date(viamData.pilot.end_date).toLocaleDateString('fa-IR') : '—'} />
          </div>
        </SectionCard>
      )}

      {departments.length > 0 && (
        <SectionCard icon={<Building2 className="w-5 h-5" />} title="واحدهای سازمان" count={`${departments.length} واحد`} isOpen={openSections.departments} onToggle={() => toggleSection('departments')} color="purple">
          <div className="space-y-2">
            {departments.map((dept: any) => (
              <div key={dept.id} className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">{dept.name}</span>
                    <span className="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{dept.code}</span>
                  </div>
                  {dept.manager ? (
                    <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded">✅ {dept.manager.name}</span>
                  ) : (
                    <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded">⏳ منتظر مدیر</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function SectionCard({ icon, title, count, isOpen, onToggle, color, children }: any) {
  const colors: any = {
    blue: 'bg-blue-50', green: 'bg-green-50', teal: 'bg-teal-50',
    yellow: 'bg-yellow-50', orange: 'bg-orange-50', purple: 'bg-purple-50',
  };
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
      <button onClick={onToggle} className={`w-full flex items-center justify-between p-4 ${colors[color] || 'bg-gray-50'} hover:opacity-90 transition`}>
        <div className="flex items-center gap-2">{icon}<h2 className="text-base font-bold text-gray-800">{title}</h2></div>
        <div className="flex items-center gap-2">
          {count && <span className="text-xs bg-white px-2 py-0.5 rounded text-gray-600">{count}</span>}
          {isOpen ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronLeft className="w-4 h-4 text-gray-500" />}
        </div>
      </button>
      {isOpen && <div className="p-4">{children}</div>}
    </div>
  );
}

function StatBox({ label, value }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded p-3 text-center">
      <p className="text-[10px] text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-bold text-gray-800">{value}</p>
    </div>
  );
}

function StepDataDisplay({ stepNum, data }: any) {
  const formatValue = (v: any) => {
    if (Array.isArray(v)) return v.join('، ');
    if (typeof v === 'object' && v !== null) return JSON.stringify(v, null, 2);
    return String(v);
  };

  if (stepNum === 5) {
    return (
      <div className="space-y-1">
        {data.title && <Row label="عنوان" value={data.title} />}
        {data.version && <Row label="نسخه" value={data.version} />}
        {data.vision && <Row label="چشم‌انداز" value={data.vision} />}
        {data.mission && <Row label="رسالت" value={data.mission} />}
        {data.values && <Row label="ارزش‌ها" value={formatValue(data.values)} />}
        {data.objectives && <Row label="اهداف" value={formatValue(data.objectives)} />}
      </div>
    );
  }

  if (stepNum === 8) {
    return (
      <div>
        <Row label="تعداد واحدها" value={(data.departments || []).length} />
        {(data.departments || []).map((d: any, i: number) => (
          <div key={i} className="text-[11px] bg-gray-50 rounded p-1.5 mt-1">
            <span className="font-medium">{d.name}</span>
            <span className="font-mono text-[10px] mr-2">({d.code})</span>
          </div>
        ))}
      </div>
    );
  }

  if (stepNum === 9) {
    return (
      <div>
        <Row label="نوع کسب‌وکار" value={data.businessType} />
        <Row label="تعداد فعالیت‌ها" value={Object.keys(data.matrix || {}).length} />
      </div>
    );
  }

  if (stepNum === 10) {
    return (
      <div>
        <Row label="فرآیندها" value={(data.processes || []).length} />
        <Row label="گردش‌کارها" value={(data.workflows || []).length} />
        <Row label="KPIها" value={(data.kpis || []).length} />
      </div>
    );
  }

  if (stepNum === 11) {
    return (
      <div>
        {data.tenantName && <Row label="نام Tenant" value={data.tenantName} />}
        {data.modules && <Row label="ماژول‌ها" value={`${data.modules.length} ماژول`} />}
      </div>
    );
  }

  if (stepNum === 12) {
    return (
      <div>
        {data.scope && <Row label="محدوده" value={data.scope} />}
        {data.targetAssets && <Row label="دارایی هدف" value={data.targetAssets} />}
        {data.duration && <Row label="مدت (هفته)" value={data.duration} />}
        {data.startDate && <Row label="تاریخ شروع" value={data.startDate} />}
      </div>
    );
  }

  const allData: any = {};
  Object.keys(data).forEach((k) => {
    if (k !== 'completed' && data[k] !== null && data[k] !== undefined && data[k] !== '') {
      allData[k] = data[k];
    }
  });

  if (Object.keys(allData).length === 0) return <span className="text-gray-400">اطلاعاتی ثبت نشده</span>;

  return (
    <div className="space-y-1">
      {Object.entries(allData).map(([k, v]) => (
        <Row key={k} label={k} value={formatValue(v)} />
      ))}
    </div>
  );
}

function Row({ label, value }: any) {
  return (
    <div className="flex items-start gap-2 text-[11px]">
      <span className="text-gray-500 flex-shrink-0 min-w-[80px]">{label}:</span>
      <span className="text-gray-800 break-words">{value}</span>
    </div>
  );
}

function RACIDisplay({ raci }: any) {
  const matrix = raci.matrix || {};
  const roleUsers = raci.role_users || {};
  const activities = Object.keys(matrix).slice(0, 10);
  const RACI_COLORS: any = {
    R: 'bg-blue-100 text-blue-800 border-blue-300',
    A: 'bg-red-100 text-red-800 border-red-300',
    C: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    I: 'bg-gray-100 text-gray-700 border-gray-300',
  };
  const getRoleName = (code: string) => roleUsers[code]?.name || code.toUpperCase();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatBox label="نوع کسب‌وکار" value={raci.business_type === 'manufacturing' ? 'تولیدی' : raci.business_type} />
        <StatBox label="کل فعالیت‌ها" value={Object.keys(matrix).length} />
        <StatBox label="تخصیص نقش" value={Object.keys(roleUsers).length} />
      </div>
      {activities.length > 0 && (
        <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-right py-2 px-3 font-medium text-gray-600 min-w-[150px]">فعالیت</th>
                {Object.keys(matrix[activities[0]]).map((roleCode) => (
                  <th key={roleCode} className="text-center py-2 px-2 min-w-[80px]">
                    <div className="text-[9px] font-bold text-gray-500">{roleCode.toUpperCase()}</div>
                    <div className="text-[10px] font-normal text-gray-700 truncate">{getRoleName(roleCode)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activities.map((code) => (
                <tr key={code} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-3 text-xs">
                    <span className="font-mono text-[10px] text-gray-400">{code.toUpperCase()}</span>
                  </td>
                  {Object.keys(matrix[activities[0]]).map((roleCode) => {
                    const val = matrix[code]?.[roleCode];
                    return (
                      <td key={roleCode} className="text-center py-2 px-1">
                        {val ? (
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded font-bold text-[10px] border ${RACI_COLORS[val] || ''}`}>{val}</span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
