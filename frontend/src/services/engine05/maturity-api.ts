/**
 * 🎯 Maturity API Service
 * سنجش بلوغ IAMS
 */
import api from '@/lib/api';

const BASE = '/intangible/maturity';

export const maturityApi = {
  // ═══════════════════════════════════════════════════════
  // Components
  // ═══════════════════════════════════════════════════════
  getComponents: () =>
    api.get(`${BASE}/components/`),

  // ═══════════════════════════════════════════════════════
  // Questions
  // ═══════════════════════════════════════════════════════
  getQuestions: (params?: { type?: 'measure' | 'anchor' }) =>
    api.get(`${BASE}/questions/`, { params }),

  // ═══════════════════════════════════════════════════════
  // Profiles
  // ═══════════════════════════════════════════════════════
  getProfiles: () =>
    api.get(`${BASE}/profiles/`),

  // ═══════════════════════════════════════════════════════
  // Assessments
  // ═══════════════════════════════════════════════════════
  getAssessments: (params?: any) =>
    api.get(`${BASE}/assessments/`, { params }),

  getAssessment: (id: number) =>
    api.get(`${BASE}/assessments/${id}/`),

  createAssessment: (data: { weight_profile?: number }) =>
    api.post(`${BASE}/assessments/`, data),

  deleteAssessment: (id: number) =>
    api.delete(`${BASE}/assessments/${id}/`),

  submitResponses: (id: number, responses: any[]) =>
    api.post(`${BASE}/assessments/${id}/submit-responses/`, { responses }),

  calculate: (id: number, data?: { has_external_auditor?: boolean }) =>
    api.post(`${BASE}/assessments/${id}/calculate/`, data || {}),

  getResults: (id: number) =>
    api.get(`${BASE}/assessments/${id}/results/`),

  getStats: () =>
    api.get(`${BASE}/assessments/stats/`),
};
