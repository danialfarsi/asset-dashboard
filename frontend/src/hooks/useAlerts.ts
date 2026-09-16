/**
 * 🎯 useAlerts
 * Hook برای گرفتن هشدارهای پروژه‌ها با auto-refresh
 */
import { useEffect, useState } from 'react';
import { engine05Api } from '@/services/engine05/api';

export interface Alert {
  type: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  value: any;
  threshold: any;
}

export interface ProjectAlerts {
  project_id: number;
  project_title: string;
  count: number;
  critical_count: number;
  has_critical: boolean;
  alerts: Alert[];
}

export interface AlertsData {
  total_projects: number;
  projects_with_alerts: number;
  total_alerts: number;
  critical_count: number;
  by_project: ProjectAlerts[];
}

export function useAlerts(refreshInterval: number = 60000) {
  const [data, setData] = useState<AlertsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setError(null);
      const res = await engine05Api.getAllAlerts();
      setData(res.data);
    } catch (err: any) {
      setError(err?.message || 'خطا در دریافت هشدارها');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    if (refreshInterval > 0) {
      const interval = setInterval(load, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  // نگاشت project_id → alerts
  const alertsByProject: Record<number, ProjectAlerts> = {};
  if (data) {
    for (const p of data.by_project) {
      alertsByProject[p.project_id] = p;
    }
  }

  return { data, loading, error, reload: load, alertsByProject };
}
