'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProtectionStepper } from '@/components/protection/ProtectionStepper';
import { useProtectionFull } from '@/hooks/useProtection';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function ProtectionPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);
  const [isCreating, setIsCreating] = useState(false);
  const [profileId, setProfileId] = useState<number | null>(null);
  
  const { data, isLoading, error, refetch } = useProtectionFull(id);

  useEffect(() => {
    const createProfile = async () => {
      if (isCreating) return;
      
      try {
        // اول چک کن پروفایل هست یا نه
        const checkResponse = await api.get(`/intangible/protection/${id}/full/`);
        if (checkResponse.data && checkResponse.data.profile) {
          setProfileId(id);
          return;
        }
      } catch (error: any) {
        // اگر 404 بود یا پروفایل نبود، ایجاد کن
        if (error.response?.status === 404 || !error.response?.data?.profile) {
          setIsCreating(true);
          try {
            const response = await api.post('/intangible/protection/create_for_asset/', {
              asset_id: id
            });
            
            if (response.data && response.data.profile_id) {
              setProfileId(response.data.profile_id);
              console.log('✅ پروفایل حفاظتی ایجاد شد! ID:', response.data.profile_id);
              // ریدایرکت به پروفایل جدید
              router.push(`/dashboard/intangible/protection/${response.data.profile_id}`);
            }
          } catch (createError) {
            console.error('❌ خطا در ایجاد پروفایل:', createError);
          } finally {
            setIsCreating(false);
          }
        }
      }
    };

    if (!isLoading && !data) {
      createProfile();
    }
  }, [id, data, isLoading]);

  if (isLoading || isCreating) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="mr-2">بارگذاری...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-red-300" />
            <p className="text-lg text-red-500">خطا در بارگذاری داده‌ها</p>
            <p className="text-sm text-gray-400 mt-2">
              {(error as any)?.message || 'خطای ناشناخته'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data || !data.profile) {
    return (
      <div className="flex justify-center items-center h-64">
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-yellow-300" />
            <p className="text-lg text-gray-500">در حال ایجاد پروفایل حفاظتی...</p>
            <Loader2 className="h-6 w-6 animate-spin mx-auto mt-4 text-gray-400" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <ProtectionStepper id={data.profile.id} data={data} isLoading={isLoading} />
    </div>
  );
}
