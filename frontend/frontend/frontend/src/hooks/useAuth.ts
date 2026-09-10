'use client';

import { useEffect, useState } from 'react';
import { getUser, getToken, canManage, isSuperAdmin, isOrgAdmin, isOrgUser } from '@/lib/auth';
import type { User } from '@/lib/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setUser(getUser());
    setToken(getToken());
    setLoading(false);
  }, []);

  return {
    user,
    token,
    loading,
    canManage: canManage(),
    isSuperAdmin: isSuperAdmin(),
    isOrgAdmin: isOrgAdmin(),
    isOrgUser: isOrgUser(),
    isAdmin: canManage(),
  };
}
