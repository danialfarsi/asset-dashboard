'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';

export default function VIAMLayout({ children }: { children: React.ReactNode }) {
  const { user, fetchMe, isLoading } = useAuthStore();

  useEffect(() => {
    if (!user && !isLoading) {
      console.log('📥 Fetching user info (VIAM layout)...');
      fetchMe();
    }
  }, [user, isLoading, fetchMe]);

  return <>{children}</>;
}
