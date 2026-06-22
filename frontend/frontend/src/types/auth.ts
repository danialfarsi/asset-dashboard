export type UserRole = "super_admin" | "org_admin" | "org_user";

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  organization_id?: number;
  organization_name?: string;
  department_id?: number;
  department_name?: string;
  is_active: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  user: User;
  tokens?: AuthTokens;
  access?: string;
  refresh?: string;
}
