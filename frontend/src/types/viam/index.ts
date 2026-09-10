// VIAM Types

export interface EstablishmentRequest {
  id: number;
  title: string;
  description: string;
  justification: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  created_by: number;
  created_by_name?: string;
  created_at: string;
}

export interface IAMCharter {
  id: number;
  title: string;
  version: string;
  status: 'draft' | 'approved' | 'active';
  vision: string;
  mission: string;
  values: string[];
  objectives: string[];
  scope: string;
  governance_structure: any;
  meeting_frequency: string;
  created_by: number;
  created_at: string;
}

export interface IAMCommittee {
  id: number;
  name: string;
  status: 'active' | 'inactive' | 'dissolved';
  chair: number;
  chair_name?: string;
  secretary: number;
  secretary_name?: string;
  members: number[];
  members_count?: number;
  meeting_frequency: string;
  meeting_days: string[];
  meeting_time: string;
  organization: number;
  created_at: string;
}

export interface RACIMatrix {
  id: number;
  activity: string;
  role: string;
  responsibility: 'R' | 'A' | 'C' | 'I';
  activity_display?: string;
  role_display?: string;
  resp_display?: string;
}

export interface StrategicPlan {
  id: number;
  title: string;
  status: 'draft' | 'approved' | 'active';
  vision: string;
  mission: string;
  strategic_goals: string[];
  start_date: string | null;
  end_date: string | null;
  created_by: number;
  created_at: string;
}

export interface AwarenessCampaign {
  id: number;
  title: string;
  campaign_type: 'executive' | 'middle' | 'general';
  status: 'draft' | 'planned' | 'active' | 'completed' | 'cancelled';
  description: string;
  key_messages: string[];
  target_audience: any;
  start_date: string | null;
  end_date: string | null;
  created_by: number;
  created_at: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: 'super_admin' | 'org_admin' | 'org_user';
  organization_id: number | null;
  organization_name?: string;
  department_id?: number;
  department_name?: string;
}

export interface VIAMStats {
  total_requests: number;
  active_committees: number;
  total_charters: number;
  total_strategic_plans: number;
  total_campaigns: number;
  current_step: number;
  progress_percentage: number;
}

export interface VIAMStep {
  number: number;
  title: string;
  is_completed: boolean;
  is_current: boolean;
  data: any;
}
