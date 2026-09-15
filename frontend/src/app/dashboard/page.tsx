'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import VIAMDashboard from '@/components/dashboard/VIAMDashboard';
import MotorsDashboard from '@/components/dashboard/MotorsDashboard';

export default function DashboardPage() {
  const { user, fetchMe, isLoading } = useAuthStore();
  const router = useRouter();

  // بارگذاری user اگه خالیه
  useEffect(() => {
    if (!user && !isLoading) {
      fetchMe();
    }
  }, [user, isLoading, fetchMe]);

  // Loading
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

  // 🎯 بر اساس نقش، داشبورد مناسب
  if (user.role === 'org_admin' || user.role === 'super_admin') {
    return <VIAMDashboard />;
  }

  // org_user یا بقیه → داشبورد موتورها
  return <MotorsDashboard />;
}
