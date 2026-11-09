/**
 * API Client موتور ۶ — تجاری‌سازی
 */

import api from './api';

const BASE = '/intangible/engine/commercialization';

// ============================================================
// Types
// ============================================================

export interface CommercializationCase {
  id: number;
  asset: number;
  asset_name: string;
  asset_uid: string;
  asset_type_name: string | null;
  organization: number | null;
  organization_name: string | null;
  status: string;
  status_display: string;
  current_step: number;
  started_at: string | null;
  closed_at: string | null;
  owner: number | null;
  owner_name: string | null;
  has_readiness: boolean;
  has_business_model: boolean;
  has_shortlist: boolean;
  has_contract: boolean;
  has_revenue: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssetFamily {
  id: number;
  code: string;
  name_fa: string;
  name_en: string;
  order: number;
}

export interface ReadinessDimension {
  id: number;
  code: string;
  name_fa: string;
  order: number;
}

export interface LikertScale {
  id: number;
  level: number;
  label_fa: string;
  meaning_fa: string;
  base_score: number;
}

export interface EvidenceFactor {
  id: number;
  code: string;
  label_fa: string;
  factor_required: string;
  factor_optional: string;
}

export interface ReadinessCriterion {
  id: number;
  code: string;
  section: 'core' | 'family' | 'business';
  dimension: number | null;
  dimension_code: string | null;
  family: number | null;
  family_code: string | null;
  business_type: number | null;
  business_type_code: string | null;
  text_fa: string;
  text_internal_fa: string;
  suggested_evidence: string;
  is_required_evidence: boolean;
  is_critical: boolean;
  order: number;
}

export interface CriterionResponse {
  id: number;
  assessment: number;
  criterion: number;
  criterion_code: string;
  criterion_text: string;
  criterion_section: string;
  criterion_is_critical: boolean;
  criterion_is_required_evidence: boolean;
  likert_level: number | null;
  evidence_level: string;
  evidence_description: string;
  is_blocker: boolean;
  is_irrelevant: boolean;
  irrelevant_reason: string;
  score_base: number;
  score_final: string;
  evidence_files?: CriterionEvidenceFile[];
}

export interface ReadinessAssessment {
  id: number;
  case: number;
  path: 'external' | 'internal';
  path_display: string;
  business_type: number | null;
  business_type_name: string | null;
  business_type_code: string | null;
  asset_family: number | null;
  asset_family_code: string | null;
  asset_family_name: string | null;
  dimension_scores: Record<string, number>;
  core_score: string;
  family_avg_score: string;
  business_avg_score: string;
  final_score: string;
  confidence_level: number;
  recommendation: 'go' | 'develop' | 'no_go' | 'pending';
  recommendation_display: string;
  sub_state_fa: string;
  routing_destination: string;
  recommendation_message: string;
  top_strengths: Array<{ code: string; name: string; score: number }>;
  top_weaknesses: Array<{ code: string; name: string; score: number }>;
  critical_issues: Array<{ code: string; text: string; level: number }>;
  is_blocked: boolean;
  is_overridden: boolean;
  override_reason: string;
  assessed_by: number | null;
  assessed_by_name: string | null;
  assessed_at: string;
  expires_at: string | null;
  responses_count: number;
  responses_answered: number;
  responses?: CriterionResponse[];
}


export interface CriterionEvidenceFile {
  id: number;
  response: number;
  criterion_code: string;
  file: string | null;
  file_url: string | null;
  file_size: number;
  mime_type: string;
  external_link: string;
  title: string;
  description: string;
  evidence_type: string;
  is_independently_verified: boolean;
  verified_by: string;
  verified_at: string | null;
  uploaded_by: number | null;
  uploaded_by_name: string | null;
  uploaded_at: string;
}

// ============================================================
// Case APIs
// ============================================================

export const casesApi = {
  list: async (params?: any) => {
    const { data } = await api.get(`${BASE}/cases/`, { params });
    return data;
  },
  get: async (id: number) => {
    const { data } = await api.get(`${BASE}/cases/${id}/`);
    return data as CommercializationCase;
  },
  create: async (payload: { asset: number; owner?: number }) => {
    const { data } = await api.post(`${BASE}/cases/`, payload);
    return data as CommercializationCase;
  },
  advance: async (id: number) => {
    const { data } = await api.post(`${BASE}/cases/${id}/advance/`);
    return data as CommercializationCase;
  },
  close: async (id: number, won: boolean, reason: string) => {
    const { data } = await api.post(`${BASE}/cases/${id}/close/`, { won, reason });
    return data as CommercializationCase;
  },
  timeline: async (id: number) => {
    const { data } = await api.get(`${BASE}/cases/${id}/timeline/`);
    return data;
  },
};

// ============================================================
// Config APIs
// ============================================================

export const configApi = {
  families: async () => {
    const { data } = await api.get(`${BASE}/readiness-v2/families/`);
    return data.results || data as AssetFamily[];
  },
  dimensions: async () => {
    const { data } = await api.get(`${BASE}/readiness-v2/dimensions/`);
    return data.results || data as ReadinessDimension[];
  },
  likertScale: async () => {
    const { data } = await api.get(`${BASE}/readiness-v2/likert-scale/`);
    return data.results || data as LikertScale[];
  },
  evidenceFactors: async () => {
    const { data } = await api.get(`${BASE}/readiness-v2/evidence-factors/`);
    return data.results || data as EvidenceFactor[];
  },
  criteria: async (section?: 'core' | 'family' | 'business') => {
    const params = section ? { section } : {};
    const { data } = await api.get(`${BASE}/readiness-v2/criteria/`, { params });
    return data.results || data as ReadinessCriterion[];
  },
};

// ============================================================
// Readiness APIs
// ============================================================

export const readinessApi = {
  initialize: async (caseId: number, businessTypeId?: number, path: 'external' | 'internal' = 'external') => {
    const { data } = await api.post(`${BASE}/readiness-v2/assessments/initialize/`, {
      case_id: caseId,
      business_type_id: businessTypeId,
      path,
    });
    return data as ReadinessAssessment;
  },
  get: async (id: number) => {
    const { data } = await api.get(`${BASE}/readiness-v2/assessments/${id}/`);
    return data as ReadinessAssessment;
  },
  getByCase: async (caseId: number) => {
    // ۱. اول id رو پیدا کن
    const { data: listData } = await api.get(`${BASE}/readiness-v2/assessments/`, {
      params: { case: caseId },
    });
    const results = listData.results || listData;
    if (results.length === 0) return null;

    // ۲. بعد با retrieve کامل (شامل responses) بگیر
    const assessmentId = results[0].id;
    const { data: fullData } = await api.get(
      `${BASE}/readiness-v2/assessments/${assessmentId}/`
    );
    return fullData as ReadinessAssessment;
  },
  bulkSubmit: async (assessmentId: number, responses: any[]) => {
    const { data } = await api.post(
      `${BASE}/readiness-v2/assessments/${assessmentId}/bulk-submit/`,
      { responses }
    );
    return data as ReadinessAssessment;
  },
  summary: async (assessmentId: number) => {
    const { data } = await api.get(
      `${BASE}/readiness-v2/assessments/${assessmentId}/summary/`
    );
    return data;
  },
  committeeDecision: async (assessmentId: number, payload: any) => {
    const { data } = await api.post(
      `${BASE}/readiness-v2/assessments/${assessmentId}/committee-decision/`,
      payload
    );
    return data;
  },
};

// ============================================================
// Evidence Upload APIs
// ============================================================

export const evidenceApi = {
  list: async (responseId: number) => {
    const { data } = await api.get(`${BASE}/readiness-v2/evidence/`, {
      params: { response: responseId },
    });
    return (data.results || data) as CriterionEvidenceFile[];
  },
  upload: async (responseId: number, file: File, title = '', evidenceType = 'document') => {
    const formData = new FormData();
    formData.append('response', String(responseId));
    formData.append('file', file);
    formData.append('title', title || file.name);
    formData.append('evidence_type', evidenceType);
    const { data } = await api.post(`${BASE}/readiness-v2/evidence/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data as CriterionEvidenceFile;
  },
  addLink: async (responseId: number, externalLink: string, title = '') => {
    const { data } = await api.post(`${BASE}/readiness-v2/evidence/`, {
      response: responseId,
      external_link: externalLink,
      title: title || externalLink,
      evidence_type: 'link',
    });
    return data as CriterionEvidenceFile;
  },
  delete: async (id: number) => {
    await api.delete(`${BASE}/readiness-v2/evidence/${id}/`);
  },
  verify: async (id: number) => {
    const { data } = await api.post(`${BASE}/readiness-v2/evidence/${id}/verify/`);
    return data as CriterionEvidenceFile;
  },
};

// ============================================================
// Business Model Types
// ============================================================

export interface ModelRanking {
  model: string;
  model_display: string;
  rank: number;
  score: number;
  attributes: {
    complexity: string;
    time_horizon_months: number;
    revenue_potential: string;
    risk: string;
  };
}

export interface RecommendationsResponse {
  case_id: number;
  asset_category: string;
  applicable_models: ModelRanking[];
  system_rank_1: string;
  system_rank_1_display: string;
  recommended_reason: string;
}

export interface CashFlowItem {
  year: number;
  amount: number;
}

export interface BusinessCaseScenario {
  cash_flows: CashFlowItem[];
  discount_rate?: number;
}

export interface BusinessCaseInput {
  case_id?: number;
  selected_model: string;
  pessimistic: BusinessCaseScenario;
  base: BusinessCaseScenario;
  optimistic: BusinessCaseScenario;
  justification?: string;
  system_rank_1_model?: string;
}

export interface ComputedScenario {
  npv: number;
  irr: number;
  payback_months: number;
}

export interface BusinessCaseResult {
  id: number;
  selected_model: string;
  selected_model_display: string;
  npv_base: number;
  irr_base: number;
  payback_months: number;
  system_rank_1: string;
  requires_justification: boolean;
  justification: string;
  computed: {
    pessimistic: ComputedScenario;
    base: ComputedScenario;
    optimistic: ComputedScenario;
  };
}

export interface BusinessModelSelection {
  id: number;
  case: number;
  selected_model: string;
  selected_model_display: string;
  business_case_data: any;
  npv_base: string;
  irr_base: string;
  payback_months: number;
  system_rank_1_model: string;
  requires_justification: boolean;
  justification: string;
  approved_by_committee: boolean;
  approved_at: string | null;
  created_at: string;
}

// ============================================================
// Business Model APIs
// ============================================================

export const businessModelApi = {
  getRecommendations: async (caseId: number) => {
    const { data } = await api.get(`${BASE}/business-models/recommendations/`, {
      params: { case: caseId },
    });
    return data as RecommendationsResponse;
  },
  selectModel: async (payload: BusinessCaseInput & { case_id: number }) => {
    const { data } = await api.post(`${BASE}/business-models/select/`, payload);
    return data as BusinessCaseResult;
  },
  get: async (id: number) => {
    const { data } = await api.get(`${BASE}/business-models/${id}/`);
    return data as BusinessModelSelection;
  },
  getByCase: async (caseId: number) => {
    const { data } = await api.get(`${BASE}/business-models/`, {
      params: { case: caseId },
    });
    const results = data.results || data;
    return results.length > 0 ? results[0] as BusinessModelSelection : null;
  },
  approve: async (id: number) => {
    const { data } = await api.post(`${BASE}/business-models/${id}/approve/`);
    return data;
  },
};

// ============================================================
// Partner APIs
// ============================================================

export const partnersApi = {
  list: async (params?: any) => {
    const { data } = await api.get(`${BASE}/partners/`, { params });
    return data;
  },
  get: async (id: number) => {
    const { data } = await api.get(`${BASE}/partners/${id}/`);
    return data;
  },
};
