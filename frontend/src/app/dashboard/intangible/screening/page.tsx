'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Factory, Server, Layers } from 'lucide-react';

interface OrganizationType {
  id: number;
  name: string;
  display_name: string;
}

const orgIcons = {
  manufacturing: Factory,
  service: Building2,
  rd: Server,
  holding: Layers,
};

export default function ScreeningPage() {
  const router = useRouter();
  const [orgTypes, setOrgTypes] = useState<OrganizationType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrgTypes = async () => {
      try {
        const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];
        const response = await fetch('http://localhost:8000/api/intangible/organization-types/', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setOrgTypes(data.results || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrgTypes();
  }, []);

  const handleSelect = (orgType: OrganizationType) => {
    router.push(`/dashboard/intangible/screening/new?type=${orgType.name}`);
  };

  if (loading) {
    return <div className="text-center py-10">در حال بارگذاری...</div>;
  }

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
