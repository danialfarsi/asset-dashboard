/**
 * 🔄 Redirect: /viam/performance → /dashboard/intangible/maturity
 * 
 * وقتی کاربر روی «عملکرد، ممیزی و بلوغ» در sidebar کلیک می‌کند،
 * مستقیم به سیستم سنجش بلوغ IAMS می‌رود.
 */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PerformanceRedirect() {
  const router = useRouter();

  useEffect(() => {
    // ریدایرکت به سیستم بلوغ
    router.replace('/dashboard/intangible/maturity');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen rtl">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#04241D] mx-auto"></div>
        <p className="mt-4 text-sm text-gray-500" style={{ fontFamily: 'Vazirmatn, Tahoma, sans-serif' }}>
          در حال انتقال به سیستم سنجش بلوغ...
        </p>
      </div>
    </div>
  );
}
