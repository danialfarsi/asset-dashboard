export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: 'super_admin' | 'org_admin' | 'org_user';
  organization_id: number | null;
  organization_name: string | null;
  department_id: number | null;
  department_name: string | null;
  is_active: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user?: User;
  tokens?: {
    access: string;
    refresh: string;
  };
}
