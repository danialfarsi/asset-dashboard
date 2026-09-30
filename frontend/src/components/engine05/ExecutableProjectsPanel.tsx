'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle, XCircle, Building2, TrendingUp,
  AlertCircle, RefreshCw, Clock, DollarSign
} from 'lucide-react';
import api from '@/lib/api';
import { toJalali } from '@/lib/date-utils';

interface Project {
  id: number;
  title: string;
  project_type: string;
  priority_score: number;
  rank: number;
  approved_budget: number;
  estimated_budget: number;
  project_budget: number;
  department_name: string | null;
  organization_name: string | null;
  gantt: { start_date: string | null; end_date: string | null } | null;
  is_executable: boolean;
  budget_ok: boolean;
  time_ok: boolean;
  reasons: string[];
}

interface Summary {
  total_budget: number;
  total_allocated: number;
  remaining: number;
  start_date: string;
  end_date: string;
  department_name: string;
  projects_count: number;
  executable_count: number;
  over_budget: boolean;
}

export function ExecutableProjectsPanel() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(
        '/intangible/engine/asset-development/projects/executable/'
      );
      const d = res.data;
      setProjects(d.projects || []);
      setSummary(d.summary);
      setMessage(d.message || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const formatMoney = (v: number) => {
    if (v >= 1e9) return `${(v / 1e9).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} میلیارد`;
    if (v >= 1e6) return `${(v / 1e6).toLocaleString('fa-IR', { maximumFractionDigits: 1 })} میلیون`;
    return v.toLocaleString('fa-IR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#04241D]"></div>
      </div>
    );
  }

  if (message) {
    return (
      <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-xl p-8 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <p className="text-amber-800 text-sm font-medium">{message}</p>
        <p className="text-amber-600 text-xs mt-2">
          برای مشاهده پروژه‌های قابل اجرا، با مدیر سازمان خود تماس بگیرید.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* خلاصه بودجه واحد */}
      {summary && (
        <div className="bg-gradient-to-l from-[#04241D] to-[#0B3D30] rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-yellow-400" />
            <h3 className="font-bold text-lg">واحد {summary.department_name}</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-white/60 text-[10px] mb-1">بودجه کل</p>
              <p className="text-base font-bold">{formatMoney(summary.total_budget)}</p>
              <p className="text-white/40 text-[9px]">ریال</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-white/60 text-[10px] mb-1">تخصیص‌یافته</p>
              <p className="text-base font-bold text-yellow-400">{formatMoney(summary.total_allocated)}</p>
              <p className="text-white/40 text-[9px]">ریال</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-white/60 text-[10px] mb-1">باقی‌مانده</p>
              <p className={`text-base font-bold ${summary.remaining >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatMoney(summary.remaining)}
              </p>
              <p className="text-white/40 text-[9px]">ریال</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-white/60 text-[10px] mb-1">قابل اجرا</p>
              <p className="text-base font-bold">
                {summary.executable_count} / {summary.projects_count}
              </p>
              <p className="text-white/40 text-[9px]">پروژه</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 text-xs text-white/70">
            <Clock className="w-3 h-3" />
            <span>
              بازه بودجه: {toJalali(summary.start_date)} تا {toJalali(summary.end_date)}
            </span>
          </div>

          {summary.over_budget && (
            <div className="mt-3 bg-red-500/20 border border-red-400/40 rounded-lg p-2 text-xs text-red-100 flex items-start gap-2">
              <span>🚨</span>
              <span>
                <b>هشدار:</b> جمع بودجه پروژه‌ها از بودجه واحد بیشتر شده است.
                با رئیس کمیته هماهنگ کنید.
              </span>
            </div>
          )}
        </div>
      )}

      {/* 🆕 چارت Donut دسته‌بندی دارایی‌ها */}
      {summary?.by_asset_type && summary.by_asset_type.length > 0 && (
        <DonutChart 
          data={summary.by_category || []}
          totalProjects={summary.projects_count}
        />
      )}

      {/* هدر لیست */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800">
          لیست پروژه‌ها ({projects.length})
        </h3>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="w-3 h-3 ml-1" /> بروزرسانی
        </Button>
      </div>

      {/* لیست پروژه‌ها */}
      {projects.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
          <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            هیچ پروژه‌ای برای واحد شما ثبت نشده
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <Card
              key={p.id}
              className={`border transition hover:shadow-md ${
                p.is_executable
                  ? 'border-green-200 bg-green-50/20'
                  : 'border-red-200 bg-red-50/20'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-[250px]">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        p.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                        p.rank === 2 ? 'bg-gray-100 text-gray-700' :
                        p.rank === 3 ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-50 text-blue-700'
                      }`}>
                        #{p.rank || '-'}
                      </div>
                      <span className="font-bold text-gray-800">{p.title}</span>
                      {p.is_executable ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-green-100 text-green-700 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> قابل اجرا
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-red-100 text-red-700 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> غیرقابل اجرا
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-600 flex-wrap">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        بودجه: {formatMoney(p.project_budget || p.approved_budget || p.estimated_budget)} ریال
                      </span>
                      {p.gantt && p.gantt.start_date && (
                        <>
                          <span>|</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {toJalali(p.gantt.start_date)} تا {toJalali(p.gantt.end_date)}
                          </span>
                        </>
                      )}
                    </div>

                    {!p.is_executable && p.reasons.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {p.reasons.map((r, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-red-100 text-red-700">
                            ⚠️ {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="text-center px-3">
                    <p className="text-[10px] text-gray-500 mb-1">امتیاز</p>
                    <p className={`text-xl font-bold ${
                      p.priority_score >= 4 ? 'text-green-600' :
                      p.priority_score >= 3 ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {p.priority_score?.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 🍩 DonutChart — چارت دونات دسته‌بندی دارایی‌ها
// ═══════════════════════════════════════════════════════════

function DonutChart({ data, totalProjects }: { data: any[]; totalProjects: number }) {
  const [hovered, setHovered] = useState<number | null>(null);

  // پالت رنگ سازمانی
  const COLORS = [
    '#0B3D30',  // برند تیره
    '#94D3B6',  // سبز روشن
    '#B8860B',  // طلایی تیره
    '#6BA368',  // سبز متوسط
    '#8B6F47',  // قهوه‌ای
    '#4A7C59',  // سبز جنگلی
  ];

  // ابعاد SVG
  const SIZE = 220;
  const STROKE = 32;
  const RADIUS = (SIZE - STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const CENTER = SIZE / 2;

  // محاسبه مجموع
  const total = data.reduce((sum, d) => sum + d.count, 0) || 1;

  // محاسبه arc برای هر بخش
  let cumulativeOffset = 0;
  const segments = data.map((item, i) => {
    const percentage = (item.count / total) * 100;
    const length = (item.count / total) * CIRCUMFERENCE;
    const offset = cumulativeOffset;
    cumulativeOffset += length;

    return {
      ...item,
      percentage,
      length,
      offset,
      color: COLORS[i % COLORS.length],
    };
  });

  const totalPct = 100;

  return (
    <Card className="border overflow-hidden">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            📊 دسته‌بندی دارایی‌ها
          </h3>
          <span className="text-[10px] text-gray-500 bg-gray-50 px-2 py-1 rounded">
            {data.length} نوع | {totalProjects} پروژه
          </span>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6" dir="rtl">
          {/* Donut */}
          <div className="relative flex-shrink-0" style={{ width: SIZE, height: SIZE }}>
            <svg 
              viewBox={`0 0 ${SIZE} ${SIZE}`} 
              className="w-full h-full -rotate-90"
              style={{ transform: 'rotate(-90deg)' }}
            >
              {/* حلقه پس‌زمینه */}
              <circle
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill="none"
                stroke="#f3f4f6"
                strokeWidth={STROKE}
              />

              {/* بخش‌ها */}
              {segments.map((seg, i) => {
                const isHovered = hovered === i;
                return (
                  <circle
                    key={i}
                    cx={CENTER}
                    cy={CENTER}
                    r={RADIUS}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={isHovered ? STROKE + 6 : STROKE}
                    strokeDasharray={`${seg.length} ${CIRCUMFERENCE - seg.length}`}
                    strokeDashoffset={-seg.offset}
                    strokeLinecap="butt"
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      filter: isHovered ? 'brightness(1.1)' : 'none',
                    }}
                  />
                );
              })}
            </svg>

            {/* مرکز — متن */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {hovered !== null ? (
                <div className="text-center">
                  <p 
                    className="text-2xl font-bold"
                    style={{ color: segments[hovered].color }}
                  >
                    {segments[hovered].percentage.toFixed(0)}٪
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5 max-w-[80px] truncate">
                    {segments[hovered].category_label || segments[hovered].asset_type_name}
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#04241D]">
                    {totalProjects.toLocaleString('fa-IR')}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    پروژه
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 min-w-0 w-full md:w-auto">
            <div className="space-y-2">
              {segments.map((seg, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between gap-3 p-2 rounded-lg transition ${
                    hovered === i ? 'bg-gray-50' : ''
                  }`}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className="w-3 h-3 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: seg.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-700 truncate">
                        {seg.category_label || seg.asset_type_name}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono">
                        {seg.category_label && '' }
                      </p>
                    </div>
                  </div>
                  <div className="text-left flex-shrink-0">
                    <p 
                      className="text-sm font-bold"
                      style={{ color: seg.color }}
                    >
                      {seg.percentage.toFixed(0)}٪
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {seg.count.toLocaleString('fa-IR')} پروژه
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
