'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Home, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const assetId = searchParams.get('asset_id');
  const [assetData, setAssetData] = useState<any>(null);

  useEffect(() => {
    if (assetId) {
      // می‌تونید اطلاعات دارایی رو از API بگیرید
      fetch(`http://localhost:8000/api/intangible/external/discovery/?asset_id=${assetId}`, {
        headers: {
          'X-API-Key': 'cd5d16ad-01cf-4031-a8d9-65d3ddb050a4',
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setAssetData(data.asset);
          }
        })
        .catch(console.error);
    }
  }, [assetId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <Card className="p-8 shadow-xl">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-green-800 mb-2">
              🎉 دارایی با موفقیت ثبت شد!
            </h1>
            
            <p className="text-gray-600 mb-6">
              دارایی شما با موفقیت در سیستم ثبت شد. تیم ما به زودی بررسی خواهد کرد.
            </p>

            {assetData && (
              <div className="w-full bg-gray-50 rounded-lg p-4 mb-6 text-right">
                <p className="text-sm text-gray-500">شناسه دارایی:</p>
                <p className="font-mono text-sm text-gray-700">{assetData.asset_uid || assetId}</p>
              </div>
            )}

            <div className="flex gap-4">
              <Link href="/discovery-wizard">
                <Button variant="outline" className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  ثبت دارایی جدید
                </Button>
              </Link>
              <Link href="/">
                <Button className="gap-2 bg-green-600 hover:bg-green-700">
                  <Home className="w-4 h-4" />
                  بازگشت به خانه
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <p className="mt-6 text-xs text-gray-400">
          🔒 اطلاعات شما با امنیت کامل ذخیره شده است
        </p>
      </div>
    </div>
  );
}
