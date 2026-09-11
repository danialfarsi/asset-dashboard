import api from './api';

export interface ProtectionProfile {
  id: number;
  screening_template: number;
  screening_template_name: string;
  archetype: string;
  archetype_display: string;
  status: 'draft' | 'in_progress' | 'completed' | 'approved';
  status_display: string;
  step1_result: any;
  step2_result: any;
  step3_result: any;
  step4_result: any;
  step5_result: any;
  protection_score: number;
  legal_score: number;
  technical_score: number;
  created_at: string;
  updated_at: string;
}

export interface ProtectionStep1 {
  id: number;
  protection_profile: number;
  analysis_result: {
    archetype: string;
    archetype_name: string;
    legal_strength: string;
    technical_strength: string;
    step3_active: boolean;
    step4_active: boolean;
  };
  available_tools: {
    legal: Array<{id: string; name: string; priority?: number}>;
    technical: Array<{id: string; name: string; priority?: number}>;
  };
  recommended_tools: Array<{id: string; name: string}>;
}

export interface ProtectionStep2 {
  id: number;
  protection_profile: number;
  decision_tree: any;
  selected_strategy: any;
  legal_strategy: string;
  technical_strategy: string;
}

export interface ProtectionStep3 {
  id: number;
  protection_profile: number;
  selected_legal_tools: Array<{id: string; name: string}>;
  legal_status: string;
  registration_number: string;
  registration_date: string | null;
  expiry_date: string | null;
  issuing_authority: string;
  legal_document: string | null;
  notes: string;
}

export interface ProtectionStep4 {
  id: number;
  protection_profile: number;
  selected_technical_tools: Array<{id: string; name: string}>;
  security_level: 'low' | 'medium' | 'high' | 'critical';
  encryption_enabled: boolean;
  access_control_enabled: boolean;
  backup_enabled: boolean;
  monitoring_enabled: boolean;
  security_document: string | null;
  notes: string;
}

export interface ProtectionStep5 {
  id: number;
  protection_profile: number;
  protection_map: any;
  is_completed: boolean;
  is_approved: boolean;
  approved_by: number | null;
  approved_at: string | null;
  final_report: string | null;
  notes: string;
}

export interface FullProtectionData {
  profile: ProtectionProfile;
  step1: ProtectionStep1 | null;
  step2: ProtectionStep2 | null;
  step3: ProtectionStep3 | null;
  step4: ProtectionStep4 | null;
  step5: ProtectionStep5 | null;
}

export const protectionApi = {
  list: () => api.get<{results: ProtectionProfile[]; count: number}>('/intangible/protection/'),
  get: (id: number) => api.get<ProtectionProfile>(`/intangible/protection/${id}/`),
  getFull: async (id: number): Promise<FullProtectionData> => {
    const response = await api.get<FullProtectionData>(`/intangible/protection/${id}/full/`);
    console.log('📡 API getFull raw response:', response);
    // 🔥 برگردوندن خود data
    return response.data;
  },
  step1: (id: number, data: {analyzed_at?: string}) => 
    api.post<ProtectionStep1>(`/intangible/protection/${id}/step1/`, data),
  step2: (id: number, data: any) => 
    api.post<ProtectionStep2>(`/intangible/protection/${id}/step2/`, data),
  step3: (id: number, data: any) => 
    api.post<ProtectionStep3>(`/intangible/protection/${id}/step3/`, data),
  step4: (id: number, data: any) => 
    api.post<ProtectionStep4>(`/intangible/protection/${id}/step4/`, data),
  step5: (id: number, data: any) => 
    api.post<ProtectionStep5>(`/intangible/protection/${id}/step5/`, data),
};
