'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth-store';

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div dir="rtl" className="space-y-8">
      <div className="flex flex-col items-center justify-center text-center border-b pb-8">
        <img 
          src="/logo.png"
          alt="لوگو"
          width={96}
          height={96}
          className="mb-4 rounded-xl shadow-sm"
        />
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          مدیریت دارایی‌ها
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          خوش آمدید، {user?.first_name || user?.email?.split('@')[0] || 'کاربر'} عزیز
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              کل دارایی‌ها
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">۰</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              دارایی‌های فعال
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">۰</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              در انتظار بررسی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">۰</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              ارزش کل
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">۰ ریال</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
