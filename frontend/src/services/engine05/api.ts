/**
 * 🎯 Engine 05 API Service
 * موتور ۵: توسعه و نوآوری
 */

import api from '@/lib/api';

const BASE = '/intangible/engine/asset-development';

export const engine05Api = {
  // ═══════════════════════════════════════════════════════
  // گام ۱: تحلیل شکاف
  // ═══════════════════════════════════════════════════════
  
  // Opportunities
  getOpportunities: (params?: any) =>
    api.get(`${BASE}/opportunities/`, { params }),
  
  getOpportunity: (id: number) =>
    api.get(`${BASE}/opportunities/${id}/`),
  
  createProjectFromOpportunity: (oppId: number, data?: { business_type?: string }) =>
    api.post(`${BASE}/opportunities/${oppId}/create-project/`, data || {}),
  
  createOpportunity: (data: any) =>
    api.post(`${BASE}/opportunities/`, data),
  
  updateOpportunity: (id: number, data: any) =>
    api.put(`${BASE}/opportunities/${id}/`, data),
  
  deleteOpportunity: (id: number) =>
    api.delete(`${BASE}/opportunities/${id}/`),
  
  getCriticalOpportunities: () =>
    api.get(`${BASE}/opportunities/critical/`),
  
  getOpportunitiesStats: () =>
    api.get(`${BASE}/opportunities/stats/`),
  
  // 🆕 بازگرداندن فرصت از backlog
  restoreOpportunity: (id: number) =>
    api.post(`${BASE}/opportunities/${id}/restore/`),
  
  bulkRestoreOpportunities: (ids: number[]) =>
    api.post(`${BASE}/opportunities/bulk-restore/`, { ids }),

  analyzeAll: (data: { business_type?: string } = {}) =>
    api.post(`${BASE}/opportunities/analyze-all/`, data),
  
  recalculateGap: (id: number, weights?: any) =>
    api.post(`${BASE}/opportunities/${id}/recalculate_gap/`, { weights }),
  
  // Ideas
  getIdeas: (params?: any) =>
    api.get(`${BASE}/ideas/`, { params }),
  
  getIdea: (id: number) =>
    api.get(`${BASE}/ideas/${id}/`),
  
  createIdea: (data: any) =>
    api.post(`${BASE}/ideas/`, data),
  
  updateIdea: (id: number, data: any) =>
    api.put(`${BASE}/ideas/${id}/`, data),
  
  deleteIdea: (id: number) =>
    api.delete(`${BASE}/ideas/${id}/`),
  
  getIdeasStats: () =>
    api.get(`${BASE}/ideas/stats/`),
  
  // ═══════════════════════════════════════════════════════
  // گام ۲: اولویت‌بندی و انتخاب پروژه
  // ═══════════════════════════════════════════════════════
  
  getProjects: (params?: any) =>
    api.get(`${BASE}/projects/`, { params }),

  // آمار تجمیعی تکمیل (دارایی‌ها + گزارش‌های اختتام)
  getProjectsStatsCompletion: () =>
    api.get(`${BASE}/projects/stats-completion/`),

  // پیشنهاد methodology از CSV
  suggestMethodology: (projectId: number) =>
    api.get(`${BASE}/projects/${projectId}/suggest-methodology/`),

  // هشدارهای همه پروژه‌ها
  getAllAlerts: (params?: { approval_status?: string }) =>
    api.get(`${BASE}/projects/alerts/`, { params }),

  // هشدارهای یه پروژه
  getProjectAlerts: (projectId: number) =>
    api.get(`${BASE}/projects/${projectId}/alerts/`),
  
  getProject: (id: number) =>
    api.get(`${BASE}/projects/${id}/`),
  
  createProject: (data: any) =>
    api.post(`${BASE}/projects/`, data),
  
  updateProject: (id: number, data: any) =>
    api.put(`${BASE}/projects/${id}/`, data),
  
  deleteProject: (id: number) =>
    api.delete(`${BASE}/projects/${id}/`),
  
  getProjectsStats: () =>
    api.get(`${BASE}/projects/stats/`),
  
  approveProject: (id: number, data?: any) =>
    api.post(`${BASE}/projects/${id}/approve/`, data || {}),
  
  rejectProject: (id: number, data?: any) =>
    api.post(`${BASE}/projects/${id}/reject/`, data || {}),
  
  recalculateRanks: () =>
    api.post(`${BASE}/projects/recalculate_ranks/`),

  // ساخت پروژه از فرصت‌ها و ایده‌ها (تبدیل گام ۱ به گام ۲)
  createFromOpportunities: (data?: { business_type?: string }) =>
    api.post(`${BASE}/projects/create-from-opportunities/`, data || {}),
  
  // ═══════════════════════════════════════════════════════
  // گام ۳: طراحی و برنامه‌ریزی
  // ═══════════════════════════════════════════════════════
  
  // Charters
  getCharters: (params?: any) =>
    api.get(`${BASE}/charters/`, { params }),
  
  getCharter: (id: number) =>
    api.get(`${BASE}/charters/${id}/`),
  
  createCharter: (data: any) =>
    api.post(`${BASE}/charters/`, data),
  
  updateCharter: (id: number, data: any) =>
    api.put(`${BASE}/charters/${id}/`, data),
  
  // Gantt
  getGanttSchedules: (params?: any) =>
    api.get(`${BASE}/gantt/`, { params }),
  
  getGanttSchedule: (id: number) =>
    api.get(`${BASE}/gantt/${id}/`),
  
  createGanttSchedule: (data: any) =>
    api.post(`${BASE}/gantt/`, data),
  
  updateGanttSchedule: (id: number, data: any) =>
    api.put(`${BASE}/gantt/${id}/`, data),
  
  // Budgets
  getBudgets: (params?: any) =>
    api.get(`${BASE}/budgets/`, { params }),
  
  getBudget: (id: number) =>
    api.get(`${BASE}/budgets/${id}/`),
  
  createBudget: (data: any) =>
    api.post(`${BASE}/budgets/`, data),
  
  updateBudget: (id: number, data: any) =>
    api.put(`${BASE}/budgets/${id}/`, data),

  // KPIهای پیشنهادی (بر اساس asset_type_id یا project_id)
  suggestedKpis: (params: { asset_type_id?: number; project_id?: number; output_type?: string }) =>
    api.get(`${BASE}/projects/suggested-kpis/`, { params }),
  
  // ═══════════════════════════════════════════════════════
  // گام ۴: اجرا، پایش و Stage-Gate
  // ═══════════════════════════════════════════════════════
  
  getProgressReports: (params?: any) =>
    api.get(`${BASE}/progress/`, { params }),

  // Stage-Gate — محاسبه مجدد تصمیم
  recalculateGate: (reportId: number) =>
    api.post(`${BASE}/progress/${reportId}/recalculate_gate/`),

  // هشدارهای SPI/CPI
  getProgressAlerts: (reportId: number) =>
    api.get(`${BASE}/progress/${reportId}/alerts/`),
  
  getProgressReport: (id: number) =>
    api.get(`${BASE}/progress/${id}/`),
  
  createProgressReport: (data: any) =>
    api.post(`${BASE}/progress/`, data),
  
  updateProgressReport: (id: number, data: any) =>
    api.put(`${BASE}/progress/${id}/`, data),
  
  // ═══════════════════════════════════════════════════════
  // گام ۵: تکمیل، انتقال و یکپارچه‌سازی
  // ═══════════════════════════════════════════════════════
  
  // Developed/New Assets
  getDevelopedAssets: (params?: any) =>
    api.get(`${BASE}/developed-assets/`, { params }),
  
  getDevelopedAsset: (id: number) =>
    api.get(`${BASE}/developed-assets/${id}/`),
  
  createDevelopedAsset: (data: any) =>
    api.post(`${BASE}/developed-assets/`, data),
  
  registerInEngine1: (id: number) =>
    api.post(`${BASE}/developed-assets/${id}/register_in_engine_1/`),
  
  protectInEngine3: (id: number) =>
    api.post(`${BASE}/developed-assets/${id}/protect_in_engine_3/`),
  
  valueInEngine2: (id: number) =>
    api.post(`${BASE}/developed-assets/${id}/value_in_engine_2/`),
  
  // Closure Reports
  getClosureReports: (params?: any) =>
    api.get(`${BASE}/closures/`, { params }),
  
  getClosureReport: (id: number) =>
    api.get(`${BASE}/closures/${id}/`),
  
  createClosureReport: (data: any) =>
    api.post(`${BASE}/closures/`, data),
  
  updateClosureReport: (id: number, data: any) =>
    api.put(`${BASE}/closures/${id}/`, data),
  
  signClosureReport: (id: number) =>
    api.post(`${BASE}/closures/${id}/sign/`),
};

export default engine05Api;
