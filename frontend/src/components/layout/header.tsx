'use client';

import { useAuthStore } from '@/store/auth-store';
import { NotificationCenter } from '@/components/ui/notification-center';
import { User, LogOut, Settings, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function Header() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const getFullName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.email?.split('@')[0] || 'کاربر';
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* سمت راست - لوگو */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-dark-green" />
            <span className="text-lg font-bold text-dark-green">متا پلتفرم</span>
          </div>
        </div>

        {/* سمت چپ - Notification + User */}
        <div className="flex items-center gap-4">
          {/* Notification Center */}
          <NotificationCenter />

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-dark-green/10 flex items-center justify-center text-dark-green font-bold text-sm">
                {getFullName().charAt(0)}
              </div>
              <span className="text-sm text-gray-700 hidden md:block">
                {getFullName()}
              </span>
            </button>

            {isUserMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                  <div className="p-4 border-b border-gray-100">
                    <p className="font-medium text-gray-900">{getFullName()}</p>
                    <p className="text-xs text-gray-400">{user?.email}</p>
                    <p className="text-xs text-dark-green mt-1">{user?.role_display || user?.role}</p>
                  </div>
                  <div className="p-2">
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      تنظیمات
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors text-sm text-red-600 w-full"
                    >
                      <LogOut className="w-4 h-4" />
                      خروج
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
