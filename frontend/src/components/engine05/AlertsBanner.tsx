/**
 * 🎯 AlertsBanner
 * نمایش هشدارهای خودکار پروژه‌ها (SYS_ALERT)
 */
'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { useAlerts } from '@/hooks/useAlerts';

export function AlertsBanner() {
  const { data, loading, reload } = useAlerts(60000);
  const [expanded, setExpanded] = useState(false);

  if (loading || !data) {
    return null;
  }

  if (data.total_alerts === 0) {
    return null;
  }

  const hasCritical = data.critical_count > 0;

  return (
    <Card className={`border-2 ${
      hasCritical
        ? 'bg-red-50 border-red-300'
        : 'bg-amber-50 border-amber-300'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            {hasCritical ? (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`font-bold text-sm ${
                  hasCritical ? 'text-red-800' : 'text-amber-800'
                }`}>
                  {hasCritical ? '🚨 هشدارهای بحرانی' : '⚠️ هشدارها'}
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                  hasCritical
                    ? 'bg-red-200 text-red-800'
                    : 'bg-amber-200 text-amber-800'
                }`}>
                  {data.total_alerts}
                </span>
                {hasCritical && (
                  <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded font-bold">
                    {data.critical_count} بحرانی
                  </span>
                )}
              </div>
              <p className={`text-xs ${
                hasCritical ? 'text-red-700' : 'text-amber-700'
              }`}>
                {data.projects_with_alerts} پروژه دارای هشدار از {data.total_projects} پروژه
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={reload}
              className={`p-1.5 rounded hover:bg-white/50 transition ${
                hasCritical ? 'text-red-700' : 'text-amber-700'
              }`}
              title="بروزرسانی"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded hover:bg-white/50 transition ${
                hasCritical ? 'text-red-700' : 'text-amber-700'
              }`}
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  بستن
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  جزئیات
                </>
              )}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-current/20 space-y-3">
            {data.by_project.map((p) => (
              <div key={p.project_id} className="bg-white/70 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold ${
                    p.has_critical ? 'text-red-800' : 'text-amber-800'
                  }`}>
                    #{p.project_id} {p.project_title}
                  </span>
                  <div className="flex gap-1">
                    {p.critical_count > 0 && (
                      <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded font-bold">
                        {p.critical_count} بحرانی
                      </span>
                    )}
                    <span className="text-[9px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">
                      {p.count} کل
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  {p.alerts.map((a, i) => {
                    const Icon = a.severity === 'high' ? AlertCircle :
                                 a.severity === 'medium' ? AlertTriangle : Info;
                    const color = a.severity === 'high' ? 'text-red-600' :
                                  a.severity === 'medium' ? 'text-amber-600' : 'text-blue-600';
                    return (
                      <div key={i} className="flex items-start gap-2 text-[11px]">
                        <Icon className={`w-3 h-3 ${color} shrink-0 mt-0.5`} />
                        <span className="text-gray-700">{a.message}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
