'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import SuperAdminDashboard from '@/components/dashboard/SuperAdminDashboard';
import VIAMDashboard from '@/components/dashboard/VIAMDashboard';
import MotorsDashboard from '@/components/dashboard/MotorsDashboard';

export default function DashboardPage() {
  const { user, fetchMe, isLoading } = useAuthStore();

  useEffect(() => {
    if (!user && !isLoading) {
      fetchMe();
    }
  }, [user, isLoading, fetchMe]);

  if (!user || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  // 🎯 بر اساس نقش
  if (user.role === 'super_admin') {
    return <SuperAdminDashboard />;
  }

  if (user.role === 'org_admin') {
    return <VIAMDashboard />;
  }

  return <MotorsDashboard />;
}
