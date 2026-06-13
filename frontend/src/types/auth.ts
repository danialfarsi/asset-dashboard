export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
}

export type UserRole =
  | "super_admin"
  | "system_admin"
  | "asset_manager"
  | "asset_analyst"
  | "legal_ip_manager"
  | "business_development"
  | "executive"
  | "contributor";

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
  // backend may return tokens nested or flat
  tokens?: AuthTokens;
  access?: string;
  refresh?: string;
}
