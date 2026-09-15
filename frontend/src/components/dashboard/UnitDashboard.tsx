'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import {
  Building2, Package, DollarSign, CheckCircle, Clock, Users,
  TrendingUp, BarChart3, Award, GitBranch, Settings, Rocket, Target,
  ArrowRight, FileText, Shield, Layers, Activity, ChevronLeft,
} from 'lucide-react';

interface UnitStats {
  organization: { id: number; name: string; code: string; status: string };
  department: { id: number; name: string; code: string; status: string };
  stats: any;
  recent_assets: any[];
  members: any[];
  viam_summary: any;
}

const RACI_COLORS: any = {
  R: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', label: 'مسئول اجرا' },
  A: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', label: 'پاسخگوی نهایی' },
  C: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', label: 'مشورت‌شونده' },
  I: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300', label: 'مطلع‌شونده' },
};

export default function UnitDashboard() {
  const [data, setData] = useState<UnitStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/intangible/dashboard/unit-stats/');
        setData(res.data);
      } catch (err) {
        console.error('Load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatMoney = (value: number) => {
    if (!value || value === 0) return '۰';
    if (value >= 1e9) return `${(value / 1e9).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} میلیارد`;
    if (value >= 1e6) return `${(value / 1e6).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} میلیون`;
    if (value >= 1e3) return `${(value / 1e3).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} هزار`;
    return value.toLocaleString('fa-IR');
  };

  const getCategoryLabel = (cat: string) => {
    const labels: any = {
      strategic_economic: 'استراتژیک-اقتصادی',
      strategic_social: 'استراتژیک-اجتماعی',
      strategic_knowledge: 'استراتژیک-دانشی',
      strategic_cultural: 'استراتژیک-فرهنگی',
      strategic_environmental: 'استراتژیک-زیست‌محیطی',
      operational_economic: 'عملیاتی-اقتصادی',
      operational_social: 'عملیاتی-اجتماعی',
      operational_knowledge: 'عملیاتی-دانشی',
      operational_cultural: 'عملیاتی-فرهنگی',
      operational_environmental: 'عملیاتی-زیست‌محیطی',
      support_economic: 'پشتیبان-اقتصادی',
      support_social: 'پشتیبان-اجتماعی',
      support_knowledge: 'پشتیبان-دانشی',
      support_cultural: 'پشتیبان-فرهنگی',
      support_environmental: 'پشتیبان-زیست‌محیطی',
    };
    return labels[cat] || cat;
  };

  const getActivityLabel = (code: string) => {
    const labels: any = {
      t1a: 'برنامه‌ریزی راهبردی',
      t1b: 'نقشه‌برداری دارایی‌ها',
      t2a: 'کشف اولیه',
      t2b: 'شناسنامه‌سازی',
      t3a: 'ارزیابی کیفی-غربالگری',
      t3b: 'ارزش‌گذاری اقتصادی',
      t4a: 'حفاظت حقوقی',
      t4b: 'امنیت فنی',
      t5a: 'توسعه دارایی',
      t5b: 'نوآوری',
      t6a: 'یکپارچه‌سازی سیستمی',
      t6b: 'هم‌افزایی',
      t7a: 'بهره‌برداری داخلی',
      t7b: 'تجاری‌سازی',
      t8a: 'پایش و KPI',
      t8b: 'به‌روزرسانی شناسنامه',
      t9a: 'بهینه‌سازی سبد',
      t9b: 'ارتقای رژیم حفاظت',
      t10a: 'گزارش‌دهی راهبردی',
      t10b: 'تصمیم‌گیری راهبردی',
    };
    return labels[code] || code.toUpperCase();
  };

  const getRoleLabel = (code: string) => {
    const labels: any = {
      sc: 'کمیته راهبری',
      iam: 'مدیر IAM',
      aud: 'ممیز',
      own: 'مالک دارایی',
      cus: 'متولی',
      rnd: 'R&D',
      qm: 'تضمین کیفیت',
      pro: 'مهندسی فرآیند',
      leg: 'حقوقی',
      fin: 'مالی',
      ict: 'IT/CISO',
      hrk: 'منابع انسانی',
      scm: 'زنجیره تأمین',
      plt: 'پلتفرم متا',
    };
    return labels[code] || code.toUpperCase();
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

  if (!data) {
    return <div className="text-center py-12 text-gray-500">اطلاعاتی یافت نشد</div>;
  }

  const { organization, department, stats, recent_assets, members, viam_summary } = data;

  return (
    <div className="container mx-auto p-6 rtl max-w-7xl">
      {/* ═════════ دکمه بازگشت ═════════ */}
      <div className="mb-4">
        <Link href="/dashboard">
          <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#04241D] transition group">
            <ArrowRight className="w-4 h-4 group-hover:-translate-x-1 transition" />
            <span>بازگشت به داشبورد</span>
          </button>
        </Link>
      </div>

      {/* ═════════ Header ═════════ */}
      <div className="bg-gradient-to-l from-[#04241D] to-[#0B3D30] rounded-2xl shadow-xl p-6 mb-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/60 text-xs mb-1">واحد مجازی مدیریت دارایی‌های نامشهود</p>
            <h1 className="text-2xl font-bold mb-2">{department.name}</h1>
            <div className="flex items-center gap-3 text-sm flex-wrap">
              <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded">
                <Building2 size={12} />
                {organization.name}
              </span>
              <span className="font-mono text-xs bg-white/10 px-2.5 py-1 rounded">{department.code}</span>
              <span className="flex items-center gap-1 bg-green-500/20 text-green-200 px-2.5 py-1 rounded">
                <CheckCircle size={12} />
                {department.status === 'active' ? 'فعال' : 'در انتظار'}
              </span>
            </div>
          </div>
          <div className="text-4xl">🏢</div>
        </div>
      </div>

      {/* ═════════ کارت‌های اصلی ═════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<DollarSign className="w-5 h-5" />} title="ارزش پورتفولیو" value={formatMoney(stats.total_value) + ' ریال'} color="gold" />
        <StatCard icon={<Package className="w-5 h-5" />} title="دارایی‌ها" value={stats.total_assets.toLocaleString('fa-IR')} color="blue" />
        <StatCard icon={<CheckCircle className="w-5 h-5" />} title="ثبت‌شده" value={stats.registered_assets.toLocaleString('fa-IR')} color="green" />
        <StatCard icon={<Users className="w-5 h-5" />} title="اعضا" value={stats.members_count.toLocaleString('fa-IR')} color="purple" />
      </div>

      {/* ═════════ آمار تفصیلی ═════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <ProgressCard icon={<TrendingUp className="w-5 h-5 text-blue-600" />} iconBg="bg-blue-100" title="DCF" value={formatMoney(stats.dcf_value)} percent={stats.total_value > 0 ? (stats.dcf_value / stats.total_value) * 100 : 0} color="bg-blue-500" />
        <ProgressCard icon={<BarChart3 className="w-5 h-5 text-purple-600" />} iconBg="bg-purple-100" title="NAV" value={formatMoney(stats.nav_value)} percent={stats.total_value > 0 ? (stats.nav_value / stats.total_value) * 100 : 0} color="bg-purple-500" />
        <ProgressCard icon={<Clock className="w-5 h-5 text-gray-600" />} iconBg="bg-gray-100" title="در حال بررسی" value={formatMoney(stats.unknown_value)} percent={stats.total_value > 0 ? (stats.unknown_value / stats.total_value) * 100 : 0} color="bg-gray-400" />
      </div>

      {/* ═════════ خلاصه VIAM-01 (جزئیات) ═════════ */}
      {viam_summary && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
          <div className="bg-gradient-to-l from-blue-50 to-purple-50 border-b border-gray-200 p-5">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              خلاصه نظام IAM سازمان
            </h2>
            <p className="text-xs text-gray-500 mt-1">اطلاعات تفصیلی از فرآیند استقرار و پیکربندی نظام</p>
          </div>

          <div className="p-5 space-y-4">
            {/* اطلاعات پایه */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {viam_summary.iam_manager && (
                <InfoCard icon={<Award className="w-4 h-4" />} title="مدیر واحد IAM" color="blue">
                  <p className="font-medium text-gray-800 text-sm">{viam_summary.iam_manager.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{viam_summary.iam_manager.email}</p>
                </InfoCard>
              )}

              {viam_summary.charter && (
                <InfoCard icon={<FileText className="w-4 h-4" />} title="منشور IAM" color="purple">
                  <p className="font-medium text-gray-800 text-sm">{viam_summary.charter.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-mono">
                      v{viam_summary.charter.version}
                    </span>
                    <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                      {viam_summary.charter.status === 'active' ? '✅ فعال' : viam_summary.charter.status}
                    </span>
                  </div>
                </InfoCard>
              )}

              {viam_summary.committee && (
                <InfoCard icon={<Users className="w-4 h-4" />} title="کمیته IAM" color="teal">
                  <p className="font-medium text-gray-800 text-sm">{viam_summary.committee.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">کمیته فعال</p>
                </InfoCard>
              )}
            </div>

            {/* منشور — جزئیات */}
            {viam_summary.charter?.vision && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-indigo-800">چشم‌انداز و رسالت</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-xs text-gray-500">چشم‌انداز: </span>
                    <span className="text-gray-800">{viam_summary.charter.vision}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">رسالت: </span>
                    <span className="text-gray-800">{viam_summary.charter.mission}</span>
                  </div>
                </div>
              </div>
            )}

            {/* RACI Matrix — Visual */}
            {viam_summary.raci && viam_summary.raci.sample_activities?.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-bold text-green-800">ماتریس RACI سازمانی</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-gray-600">
                      <strong className="text-green-700">{viam_summary.raci.total_activities}</strong> فعالیت
                    </span>
                    <span className="text-gray-600">
                      <strong className="text-green-700">{viam_summary.raci.total_roles}</strong> نقش
                    </span>
                    <span className="text-gray-600">
                      <strong className="text-green-700">{viam_summary.raci.assignments_count}</strong> تخصیص
                    </span>
                  </div>
                </div>

                {/* جدول ماتریس */}
                <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-right py-2 px-3 font-medium text-gray-600 min-w-[180px] sticky right-0 bg-gray-50 z-10">
                          فعالیت
                        </th>
                        {viam_summary.raci.sample_activities[0] && Object.keys(viam_summary.raci.sample_activities[0].roles).map((roleCode: string) => {
                          const user = viam_summary.raci.role_users?.[roleCode];
                          return (
                            <th key={roleCode} className="text-center py-2 px-2 font-medium text-gray-600 min-w-[90px]" title={getRoleLabel(roleCode)}>
                              <div className="text-[9px] font-bold text-gray-500 mb-0.5">{roleCode.toUpperCase()}</div>
                              <div className="text-[10px] text-gray-800 font-normal truncate">
                                {user?.name || '—'}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {viam_summary.raci.sample_activities.map((activity: any) => {
                        const roles = activity.roles || {};
                        const roleKeys = Object.keys(viam_summary.raci.sample_activities[0].roles);
                        return (
                          <tr key={activity.code} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-2 px-3 text-right sticky right-0 bg-white z-10">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-400 font-mono">
                                  {activity.code.toUpperCase()}
                                </span>
                                <span className="text-gray-800 text-xs">
                                  {getActivityLabel(activity.code)}
                                </span>
                              </div>
                            </td>
                            {roleKeys.map((roleCode: string) => {
                              const val = roles[roleCode] || '';
                              const c = RACI_COLORS[val] || {};
                              return (
                                <td key={roleCode} className="text-center py-2 px-1">
                                  {val ? (
                                    <span
                                      className={`inline-flex items-center justify-center w-6 h-6 rounded-md font-bold text-[10px] border ${c.bg || ''} ${c.text || ''} ${c.border || ''}`}
                                      title={`${c.label || ''}`}
                                    >
                                      {val}
                                    </span>
                                  ) : (
                                    <span className="text-gray-300">—</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-2 mt-3 text-[10px]">
                  {Object.entries(RACI_COLORS).map(([key, val]: any) => (
                    <div key={key} className="flex items-center gap-1">
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded font-bold border ${val.bg} ${val.text} ${val.border}`}>
                        {key}
                      </span>
                      <span className="text-gray-500">{val.label}</span>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] text-gray-400 mt-2">
                  ℹ️ نمایش ۵ فعالیت اول از {viam_summary.raci.total_activities} فعالیت
                </p>
              </div>
            )}

            {/* مدل عملیاتی */}
            {viam_summary.operational_model && (
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="w-4 h-4 text-teal-600" />
                  <span className="text-sm font-bold text-teal-800">مدل عملیاتی</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded p-3 text-center">
                    <Activity className="w-4 h-4 text-teal-600 mx-auto mb-1" />
                    <p className="text-xl font-bold text-teal-700">{viam_summary.operational_model.processes_count}</p>
                    <p className="text-[10px] text-gray-500">فرآیند</p>
                  </div>
                  <div className="bg-white rounded p-3 text-center">
                    <Layers className="w-4 h-4 text-teal-600 mx-auto mb-1" />
                    <p className="text-xl font-bold text-teal-700">{viam_summary.operational_model.workflows_count}</p>
                    <p className="text-[10px] text-gray-500">گردش‌کار</p>
                  </div>
                  <div className="bg-white rounded p-3 text-center">
                    <BarChart3 className="w-4 h-4 text-teal-600 mx-auto mb-1" />
                    <p className="text-xl font-bold text-teal-700">{viam_summary.operational_model.kpis_count}</p>
                    <p className="text-[10px] text-gray-500">KPI</p>
                  </div>
                </div>
                {viam_summary.operational_model.sample_processes?.length > 0 && (
                  <div className="mt-3 bg-white rounded p-2">
                    <p className="text-[10px] text-gray-500 mb-1">نمونه فرآیندها:</p>
                    <div className="flex flex-wrap gap-1">
                      {viam_summary.operational_model.sample_processes.map((p: string, i: number) => (
                        <span key={i} className="text-[10px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* پیکربندی + پایلوت */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {viam_summary.tenant && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Rocket className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-bold text-yellow-800">پیکربندی پلتفرم</span>
                  </div>
                  <p className="font-medium text-gray-800 text-sm">{viam_summary.tenant.name}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-[10px] bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">
                      {viam_summary.tenant.modules_count} ماژول فعال
                    </span>
                    {viam_summary.tenant.is_active && (
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded">
                        ✅ پنل فعال
                      </span>
                    )}
                  </div>
                </div>
              )}

              {viam_summary.pilot && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-bold text-orange-800">پایلوت فعال</span>
                  </div>
                  <p className="font-medium text-gray-800 text-sm">{viam_summary.pilot.name}</p>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div>
                      <span className="text-gray-500">دارایی هدف: </span>
                      <strong className="text-orange-700">{viam_summary.pilot.target_assets}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500">واحدها: </span>
                      <strong className="text-orange-700">{viam_summary.pilot.departments_count}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500">شروع: </span>
                      <strong className="text-orange-700">
                        {viam_summary.pilot.start_date ? new Date(viam_summary.pilot.start_date).toLocaleDateString('fa-IR') : '—'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-gray-500">پایان: </span>
                      <strong className="text-orange-700">
                        {viam_summary.pilot.end_date ? new Date(viam_summary.pilot.end_date).toLocaleDateString('fa-IR') : '—'}
                      </strong>
                    </div>
                  </div>
                  {viam_summary.pilot.scope && (
                    <p className="text-[10px] text-gray-600 mt-2 bg-white/60 rounded p-1.5">
                      {viam_summary.pilot.scope}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═════════ دارایی‌های اخیر ═════════ */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-600" />
            دارایی‌های اخیر واحد
          </h2>
          <Link href="/dashboard/intangible/assets">
            <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
              مشاهده همه
              <ChevronLeft className="w-3 h-3" />
            </button>
          </Link>
        </div>
        {recent_assets.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">هیچ دارایی‌ای ثبت نشده</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recent_assets.map((asset: any) => (
              <div key={asset.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-800 text-sm">{asset.asset_name}</span>
                    {asset.valuation_type && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        asset.valuation_type === 'DCF' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>{asset.valuation_type}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="font-mono">{asset.asset_uid}</span>
                    <span>{getCategoryLabel(asset.category)}</span>
                  </div>
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-800 text-sm">{formatMoney(asset.final_value)}</p>
                  <p className="text-[10px] text-gray-400">ریال</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Read-only Notice */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
        <p className="text-xs text-blue-700">ℹ️ این داشبورد فقط خواندنی است. برای ویرایش با مدیر سازمان تماس بگیرید.</p>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, color }: any) {
  const colors: any = {
    gold: 'from-yellow-50 to-yellow-100 border-yellow-200',
    blue: 'from-blue-50 to-blue-100 border-blue-200',
    green: 'from-green-50 to-green-100 border-green-200',
    purple: 'from-purple-50 to-purple-100 border-purple-200',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-5`}>
      <div className="opacity-70 mb-2">{icon}</div>
      <p className="text-xs text-gray-600 mb-1">{title}</p>
      <p className="text-lg font-bold text-gray-800">{value}</p>
    </div>
  );
}

function ProgressCard({ icon, iconBg, title, value, percent, color }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>{icon}</div>
        <div>
          <p className="text-xs text-gray-500">{title}</p>
          <p className="text-lg font-bold text-gray-800">{value}</p>
        </div>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function InfoCard({ icon, title, color, children }: any) {
  const colors: any = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
    teal: 'bg-teal-50 border-teal-200 text-teal-600',
    green: 'bg-green-50 border-green-200 text-green-600',
  };
  return (
    <div className={`border rounded-lg p-3 ${colors[color].split(' ').slice(0, 2).join(' ')}`}>
      <div className={`flex items-center gap-2 mb-1.5 ${colors[color].split(' ')[2]}`}>
        {icon}
        <span className="text-[11px] font-bold">{title}</span>
      </div>
      {children}
    </div>
  );
}
