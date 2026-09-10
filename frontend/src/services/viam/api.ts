import axios from 'axios';
import {
  EstablishmentRequest,
  IAMCharter,
  IAMCommittee,
  RACIMatrix,
  StrategicPlan,
  AwarenessCampaign,
  VIAMStats,
  VIAMStep
} from '@/types/viam';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// VIAM API Service
export const viamApi = {
  // ==================== Establishment Requests ====================
  getEstablishmentRequests: (params?: any) =>
    api.get<{ count: number; results: EstablishmentRequest[] }>('/intangible/viam/establishment-requests/', { params }),
  
  getEstablishmentRequest: (id: number) =>
    api.get<EstablishmentRequest>(`/intangible/viam/establishment-requests/${id}/`),
  
  createEstablishmentRequest: (data: Partial<EstablishmentRequest>) =>
    api.post<EstablishmentRequest>('/intangible/viam/establishment-requests/', data),
  
  submitEstablishmentRequest: (id: number) =>
    api.post(`/intangible/viam/establishment-requests/${id}/submit/`),
  
  approveEstablishmentRequest: (id: number) =>
    api.post(`/intangible/viam/establishment-requests/${id}/approve/`),
  
  getEstablishmentRequestSteps: (id: number) =>
    api.get<{ steps: VIAMStep[] }>(`/intangible/viam/establishment-requests/${id}/steps/`),
  
  advanceStep: (id: number, data?: any) =>
    api.post(`/intangible/viam/establishment-requests/${id}/advance_step/`, data || {}),
  
  completeEstablishment: (id: number) =>
    api.post(`/intangible/viam/establishment-requests/${id}/complete/`),
  
  // ===== ارسال به super_admin =====
  submitToAdmin: (id: number) =>
    api.post(`/intangible/viam/establishment-requests/${id}/submit_to_admin/`),

  // ===== تایید توسط super_admin =====
  adminApprove: (id: number) =>
    api.post(`/intangible/viam/establishment-requests/${id}/admin_approve/`),

  // ===== رد توسط super_admin =====
  adminReject: (id: number) =>
    api.post(`/intangible/viam/establishment-requests/${id}/admin_reject/`),

  // ==================== Charters ====================
  getCharters: (params?: any) =>
    api.get<{ count: number; results: IAMCharter[] }>('/intangible/viam/charters/', { params }),
  
  getCharter: (id: number) =>
    api.get<IAMCharter>(`/intangible/viam/charters/${id}/`),
  
  createCharter: (data: Partial<IAMCharter>) =>
    api.post<IAMCharter>('/intangible/viam/charters/', data),
  
  approveCharter: (id: number) =>
    api.post(`/intangible/viam/charters/${id}/approve/`),
  
  activateCharter: (id: number) =>
    api.post(`/intangible/viam/charters/${id}/activate/`),

  // ==================== Representatives ====================
  getRepresentatives: (params?: any) =>
    api.get<{ count: number; results: any[] }>('/intangible/viam/representatives/', { params }),
  
  createRepresentative: (data: any) =>
    api.post('/intangible/viam/representatives/', data),

  // ==================== RACI ====================
  getRACI: (params?: any) =>
    api.get<{ count: number; results: RACIMatrix[] }>('/intangible/viam/ownership/raci/', { params }),
  
  createRACI: (data: any) =>
    api.post('/intangible/viam/ownership/raci/', data),

  // ==================== Operational Models ====================
  getOperationalModels: (params?: any) =>
    api.get<{ count: number; results: any[] }>('/intangible/viam/operational-models/', { params }),
  
  createOperationalModel: (data: any) =>
    api.post('/intangible/viam/operational-models/', data),

  // ==================== Pilots ====================
  getPilots: (params?: any) =>
    api.get<{ count: number; results: any[] }>('/intangible/viam/pilots/', { params }),
  
  createPilot: (data: any) =>
    api.post('/intangible/viam/pilots/', data),
  
  startPilot: (id: number) =>
    api.post(`/intangible/viam/pilots/${id}/start/`),
  
  completePilot: (id: number) =>
    api.post(`/intangible/viam/pilots/${id}/complete/`),

  // ==================== Strategic Plans ====================
  getStrategicPlans: (params?: any) =>
    api.get<{ count: number; results: StrategicPlan[] }>('/intangible/strategic/plans/', { params }),
  
  getStrategicPlan: (id: number) =>
    api.get<StrategicPlan>(`/intangible/strategic/plans/${id}/`),
  
  createStrategicPlan: (data: Partial<StrategicPlan>) =>
    api.post<StrategicPlan>('/intangible/strategic/plans/', data),

  // ==================== Campaigns ====================
  getCampaigns: (params?: any) =>
    api.get<{ count: number; results: AwarenessCampaign[] }>('/intangible/viam/awareness/campaigns/', { params }),
  
  getCampaign: (id: number) =>
    api.get<AwarenessCampaign>(`/intangible/viam/awareness/campaigns/${id}/`),
  
  createCampaign: (data: Partial<AwarenessCampaign>) =>
    api.post<AwarenessCampaign>('/intangible/viam/awareness/campaigns/', data),
  
  activateCampaign: (id: number) =>
    api.post(`/intangible/viam/awareness/campaigns/${id}/activate/`),
  
  completeCampaign: (id: number) =>
    api.post(`/intangible/viam/awareness/campaigns/${id}/complete/`),

  // ==================== Committees ====================
  getCommittees: (params?: any) =>
    api.get<{ count: number; results: IAMCommittee[] }>('/intangible/viam/committee/committees/', { params }),
  
  getCommittee: (id: number) =>
    api.get<IAMCommittee>(`/intangible/viam/committee/committees/${id}/`),
  
  createCommittee: (data: Partial<IAMCommittee>) =>
    api.post<IAMCommittee>('/intangible/viam/committee/committees/', data),
  
  addCommitteeMember: (id: number, userId: number) =>
    api.post(`/intangible/viam/committee/committees/${id}/add_member/`, { user_id: userId }),
  
  removeCommitteeMember: (id: number, userId: number) =>
    api.post(`/intangible/viam/committee/committees/${id}/remove_member/`, { user_id: userId }),

  // ==================== Meetings ====================
  getMeetings: (params?: any) =>
    api.get<{ count: number; results: any[] }>('/intangible/viam/committee/meetings/', { params }),
  
  createMeeting: (data: any) =>
    api.post('/intangible/viam/committee/meetings/', data),
  
  startMeeting: (id: number) =>
    api.post(`/intangible/viam/committee/meetings/${id}/start/`),
  
  completeMeeting: (id: number) =>
    api.post(`/intangible/viam/committee/meetings/${id}/complete/`),

  // ==================== KPIs ====================
  getKPIs: (params?: any) =>
    api.get<{ count: number; results: any[] }>('/intangible/viam/performance/kpis/', { params }),
  
  createKPI: (data: any) =>
    api.post('/intangible/viam/performance/kpis/', data),
  
  updateKPIValue: (id: number, value: number) =>
    api.post(`/intangible/viam/performance/kpis/${id}/update_value/`, { value }),

  // ==================== Dashboard Stats ====================
  getDashboardStats: async (): Promise<VIAMStats> => {
    try {
      const [requests, committees, charters, plans, campaigns] = await Promise.all([
        viamApi.getEstablishmentRequests(),
        viamApi.getCommittees(),
        viamApi.getCharters(),
        viamApi.getStrategicPlans(),
        viamApi.getCampaigns(),
      ]);
      
      return {
        total_requests: requests.data.count || 0,
        active_committees: committees.data.results?.filter(c => c.status === 'active').length || 0,
        total_charters: charters.data.count || 0,
        total_strategic_plans: plans.data.count || 0,
        total_campaigns: campaigns.data.count || 0,
        current_step: 1,
        progress_percentage: 0,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        total_requests: 0,
        active_committees: 0,
        total_charters: 0,
        total_strategic_plans: 0,
        total_campaigns: 0,
        current_step: 1,
        progress_percentage: 0,
      };
    }
  },
};

export default api;
