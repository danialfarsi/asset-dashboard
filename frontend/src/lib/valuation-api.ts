import api from './api';

// ============ انواع داده‌ها ============
export interface AssetType {
  id: number;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
}

export interface ValuationDimension {
  id: number;
  name: string;
  display_name: string;
  weight: number;
  order: number;
}

export interface ValuationScoreGuide {
  id: number;
  score: number;
  condition: string;
  evidence_required: string;
}

export interface ValuationQuestion {
  id: number;
  asset_type: number;
  dimension: number;
  dimension_name: string;
  code: string;
  question_text: string;
  description: string;
  hint: string;
  order: number;
  score_guides: ValuationScoreGuide[];
}

export interface ValuationAnswer {
  id: number;
  question: number;
  question_code: string;
  question_text: string;
  score: number | null;
  evidence: string;
  notes: string;
  updated_at: string;
}

export interface AssetValuation {
  id: number;
  asset: number;
  asset_name: string;
  asset_type: number;
  evaluated_by: number;
  evaluator_name: string;
  evaluated_at: string;
  updated_at: string;
  status: 'draft' | 'in_progress' | 'completed' | 'verified';
  final_score: number;
  strategic_score: number;
  technical_score: number;
  operational_score: number;
  market_score: number;
  risk_score: number;
  answers: ValuationAnswer[];
}

export interface ValuationSummary {
  id: number;
  asset: string;
  asset_uid: string;
  status: string;
  final_score: number;
  strategic_score: number;
  technical_score: number;
  operational_score: number;
  market_score: number;
  risk_score: number;
  dimensions: Record<string, { total: number; answered: number; average: number; scores: number[] }>;
  total_questions: number;
  answered_questions: number;
}

// ============ API functions ============

// دریافت انواع دارایی
export async function getAssetTypes(): Promise<AssetType[]> {
  const { data } = await api.get('/intangible/asset-types/');
  return data.results || data || [];
}

// دریافت سوالات یک نوع دارایی
export async function getValuationQuestions(assetTypeId: number): Promise<ValuationQuestion[]> {
  const { data } = await api.get(`/intangible/valuation-questions/?asset_type=${assetTypeId}`);
  return data.results || data || [];
}

// شروع ارزیابی جدید
export async function createValuation(assetId: number, assetTypeId: number): Promise<AssetValuation> {
  const { data } = await api.post('/intangible/asset-valuations/', {
    asset: assetId,
    asset_type: assetTypeId,
    status: 'draft'
  });
  return data;
}

// دریافت ارزیابی موجود
export async function getValuation(valuationId: number): Promise<AssetValuation> {
  const { data } = await api.get(`/intangible/asset-valuations/${valuationId}/`);
  return data;
}

// ثبت پاسخ یک سوال
export async function submitAnswer(
  valuationId: number,
  questionId: number,
  score: number,
  evidence: string = '',
  notes: string = ''
): Promise<any> {
  const { data } = await api.post(`/intangible/asset-valuations/${valuationId}/submit_answer/`, {
    question_id: questionId,
    score,
    evidence,
    notes,
  });
  return data;
}

// دریافت خلاصه ارزیابی
export async function getValuationSummary(valuationId: number): Promise<ValuationSummary> {
  const { data } = await api.get(`/intangible/asset-valuations/${valuationId}/summary/`);
  return data;
}

// تکمیل ارزیابی
export async function completeValuation(valuationId: number): Promise<any> {
  const { data } = await api.post(`/intangible/asset-valuations/${valuationId}/complete/`);
  return data;
}
