'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { UserRole } from '@/types/auth';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
  fallback?: ReactNode;
}

export function RoleGuard({
  children,
  allowedRoles,
  redirectTo = '/viam/dashboard',
  fallback,
}: RoleGuardProps) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بررسی دسترسی...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAuthenticated) {
    return null;
  }

  const hasAccess = allowedRoles.includes(user.role as UserRole);

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    router.push(redirectTo);
    return null;
  }

  return <>{children}</>;
}
