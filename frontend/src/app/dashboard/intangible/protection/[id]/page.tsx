'use client';

import { useParams } from 'next/navigation';
import { ProtectionStepper } from '@/components/protection/ProtectionStepper';
import { useProtectionFull } from '@/hooks/useProtection';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Loader2 } from 'lucide-react';

export default function ProtectionPage() {
  const params = useParams();
  const id = parseInt(params.id as string);
  const { data, isLoading, error } = useProtectionFull(id);

  console.log('🔍 Page render:', { id, isLoading, hasData: !!data, data });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="mr-2">بارگذاری...</span>
      </div>
    );
  }

  if (error) {
    console.error('❌ Error:', error);
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

  // 🔥 بررسی دقیق داده
  if (!data) {
    console.warn('⚠️ data is null or undefined');
    return (
      <div className="flex justify-center items-center h-64">
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-yellow-300" />
            <p className="text-lg text-gray-500">داده‌ای وجود ندارد</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 🔥 بررسی اینکه data.profile وجود داره
  if (!data.profile) {
    console.warn('⚠️ data.profile is null or undefined', data);
    return (
      <div className="flex justify-center items-center h-64">
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-yellow-300" />
            <p className="text-lg text-gray-500">پروفایل حفاظتی یافت نشد</p>
            <p className="text-sm text-gray-400 mt-2">
              data keys: {Object.keys(data).join(', ')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('✅ Rendering ProtectionStepper with data:', data);

  return (
    <div className="container mx-auto py-8">
      <ProtectionStepper id={id} data={data} isLoading={false} />
    </div>
  );
}
