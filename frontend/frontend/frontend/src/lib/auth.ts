'use client';

import Cookies from 'js-cookie';

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

// ===== گرفتن کاربر =====
export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

// ===== گرفتن توکن =====
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return Cookies.get('access_token') || null;
}

// ===== بررسی نقش =====
export function hasRole(allowedRoles: UserRole[]): boolean {
  const user = getUser();
  if (!user) return false;
  return allowedRoles.includes(user.role);
}

// ===== مدیریت =====
export function canManage(): boolean {
  return hasRole(['super_admin', 'org_admin']);
}

// ===== ادمین کل =====
export function isSuperAdmin(): boolean {
  return hasRole(['super_admin']);
}

// ===== مدیر شرکت =====
export function isOrgAdmin(): boolean {
  return hasRole(['org_admin']);
}

// ===== مدیر واحد =====
export function isOrgUser(): boolean {
  return hasRole(['org_user']);
}

// ===== نقش فارسی =====
export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    'super_admin': 'ادمین کل',
    'org_admin': 'مدیر شرکت',
    'org_user': 'مدیر واحد',
  };
  return labels[role] || role;
}
