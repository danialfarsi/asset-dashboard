'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Shield, Star, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '@/lib/api';

const toPersianNumber = (num: number): string => {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return num.toString().replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};

export default function ProtectedAssetsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['protected-assets', 'completed'],
    queryFn: async () => {
      // گرفتن همه پروفایل‌هایی که گام ۵ تکمیل شده (is_completed = true)
      const response = await api.get('/intangible/protection/');
      const allProfiles = response.data.results || [];
      
      // فیلتر کردن برای پروفایل‌هایی که گام ۵ تکمیل شده
      const completedProfiles = [];
      for (const profile of allProfiles) {
        try {
          const fullRes = await api.get(`/intangible/protection/${profile.id}/full/`);
          const fullData = fullRes.data;
          if (fullData.step5 && fullData.step5.is_completed === true) {
            completedProfiles.push({
              ...profile,
              step5: fullData.step5
            });
          }
        } catch (e) {
          console.error('Error fetching full profile:', e);
        }
      }
      
      return completedProfiles;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">بارگذاری...</div>
      </div>
    );
  }

  const assets = data || [];

  return (
    <div className="container mx-auto py-8 font-vazir">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/intangible/protection">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
            دارایی‌های حفاظت شده
          </h1>
          <p className="text-muted-foreground">
            دارایی‌هایی که فرآیند ۵ گام حفاظت را با موفقیت تکمیل کرده‌اند
          </p>
        </div>
      </div>

      {assets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium">هیچ دارایی حفاظت شده‌ای یافت نشد</h3>
            <p className="text-muted-foreground mt-2">
              هنوز هیچ دارایی فرآیند ۵ گام حفاظت را تکمیل نکرده است
            </p>
            <Link href="/dashboard/intangible/protection">
              <Button className="mt-4">مشاهده دارایی‌های قابل حفاظت</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((profile: any) => (
            <Card key={profile.id} className="border-2 border-emerald-200 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">{profile.screening_template_name}</CardTitle>
                  <Badge className="bg-emerald-500 text-white">
                    <CheckCircle className="w-3 h-3 ml-1" />
                    تکمیل شده
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">آرکی‌تایپ:</span>
                    <span>{profile.archetype_display}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">امتیاز حفاظت:</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      {toPersianNumber(Math.round(profile.protection_score || 0))}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-indigo-50 p-2 rounded-lg text-center">
                      <span className="text-xs text-gray-500">حقوقی</span>
                      <p className="font-bold text-indigo-600">{toPersianNumber(Math.round(profile.legal_score || 0))}</p>
                    </div>
                    <div className="bg-cyan-50 p-2 rounded-lg text-center">
                      <span className="text-xs text-gray-500">فنی</span>
                      <p className="font-bold text-cyan-600">{toPersianNumber(Math.round(profile.technical_score || 0))}</p>
                    </div>
                  </div>
                  {profile.step5 && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>تاریخ تکمیل:</span>
                      <span>{new Date(profile.step5.updated_at).toLocaleDateString('fa-IR')}</span>
                    </div>
                  )}
                  <Link href={`/dashboard/intangible/protection/${profile.screening_template}`}>
                    <Button variant="outline" className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                      مشاهده جزئیات حفاظت
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
