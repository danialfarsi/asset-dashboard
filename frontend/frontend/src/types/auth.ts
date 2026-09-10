export type UserRole = 'super_admin' | 'org_admin' | 'org_user';

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  organization_id: number | null;
  organization_name?: string;
  department_id?: number | null;
  department_name?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access: string;
  refresh?: string;
  user: User;
  tokens?: {
    access: string;
    refresh: string;
  };
}
