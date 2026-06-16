'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuthStore } from '@/store/auth-store';

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'ادمین کل سیستم';
      case 'org_admin': return 'ادمین مجموعه';
      case 'org_user': return 'کاربر مجموعه';
      default: return 'کاربر';
    }
  };

  // نمایش نام کاربر
  const displayName = user?.first_name || user?.email?.split('@')[0] || 'کاربر';

  return (
    <header className="flex items-center justify-between px-6 h-14 border-b bg-background">
      <SidebarTrigger />

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium leading-none">
            {displayName}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {user ? getRoleLabel(user.role) : 'کاربر'}
          </p>
        </div>

        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
          <LogOut className="w-4 h-4" />
          خروج
        </Button>
      </div>
    </header>
  );
}
