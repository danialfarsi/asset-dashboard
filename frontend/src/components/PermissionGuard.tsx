'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions';

interface PermissionGuardProps {
  children: ReactNode;
  permissions?: Array<keyof typeof PERMISSIONS>;
  fallback?: ReactNode;
  redirectTo?: string;
  requireAll?: boolean;
}

export function PermissionGuard({
  children,
  permissions = [],
  fallback,
  redirectTo = '/viam/dashboard',
  requireAll = true,
}: PermissionGuardProps) {
  const router = useRouter();
  const { user, loading, can, isAdmin } = usePermissions();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بررسی دسترسی...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (permissions.length === 0) {
    return <>{children}</>;
  }

  let hasAccess = false;
  
  if (requireAll) {
    hasAccess = permissions.every((p) => can(p));
  } else {
    hasAccess = permissions.some((p) => can(p));
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    router.push(redirectTo);
    return null;
  }

  return <>{children}</>;
}
