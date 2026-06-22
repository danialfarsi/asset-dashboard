'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Factory, Server, Layers, Loader2 } from 'lucide-react';

interface OrganizationType {
  id: number;
  name: string;
  display_name: string;
}

const orgIcons = {
  manufacturing: Factory,
  service: Building2,
  rto: Server,
  holding: Layers,
};

export default function ScreeningPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const [orgTypes, setOrgTypes] = useState<OrganizationType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. دریافت انواع سازمان از بک‌اند
        const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];
        const response = await fetch('http://localhost:8000/api/intangible/organization-types/', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (response.ok) {
          const data = await response.json();
          const types = data.results || [];
          setOrgTypes(types);
          
          // 2. اگر کاربر دارای organization_type است، مستقیم به صفحه جدید برو
          if (user?.organization_type && user.organization_type !== 'all') {
            const matchedType = types.find((t: any) => t.name === user.organization_type);
            if (matchedType) {
              router.push(`/dashboard/intangible/screening/new?type=${matchedType.name}`);
              return;
            }
          }
          
          // 3. اگر کاربر super_admin است و organization_type='all'، همه انواع را نشان بده
          if (user?.role === 'super_admin' && user?.organization_type === 'all') {
            // نمایش همه انواع برای انتخاب
            setLoading(false);
            return;
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchData();
    }
  }, [user, router]);

  const handleSelect = (orgType: OrganizationType) => {
    router.push(`/dashboard/intangible/screening/new?type=${orgType.name}`);
  };

  // اگر کاربر organization_type دارد و در حال ریدایرکت است
  if (user?.organization_type && user.organization_type !== 'all') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="mr-3">در حال انتقال به فرم غربالگری...</span>
      </div>
    );
  }

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="mr-3">در حال بارگذاری...</span>
      </div>
    );
  }

  // فقط super_admin با organization_type='all' این صفحه را می‌بیند
  return (
    <div dir="rtl" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">هویت‌سنجی دارایی‌های نامشهود</h1>
        <p className="text-sm text-gray-500 mt-1">لطفاً نوع سازمان خود را انتخاب کنید</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {orgTypes.map((org) => {
          const Icon = orgIcons[org.name as keyof typeof orgIcons] || Building2;
          return (
            <Card 
              key={org.id} 
              className="cursor-pointer hover:shadow-lg transition-all hover:border-blue-400"
              onClick={() => handleSelect(org)}
            >
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="p-3 bg-blue-50 rounded-full">
                    <Icon className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <CardTitle className="text-lg">{org.display_name}</CardTitle>
                <CardDescription>انتخاب برای {org.display_name}</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button variant="outline" className="w-full">انتخاب</Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
