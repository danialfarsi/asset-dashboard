'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';
import api from '@/lib/api';

export function InnovationGallery() {
  const router = useRouter();
  const { user } = useAuthStore();
  const organizationType = user?.organization_type || 'manufacturing';

  const [assetTypes, setAssetTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(
          `/intangible/asset-types/for-innovation/?organization_type=${organizationType}`
        );
        setAssetTypes(res.data.results || []);
      } catch (e) {
        console.error('Error loading innovation asset types:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [organizationType]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#04241D]"></div>
      </div>
    );
  }

  const filtered = search
    ? assetTypes.filter(a =>
        (a.name || '').includes(search) ||
        (a.code || '').toLowerCase().includes(search.toLowerCase())
      )
    : assetTypes;

  return (
    <div className="space-y-4">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-xs text-purple-800 flex items-start gap-2">
        <span className="text-base">💡</span>
        <span>
          این قالب‌های دارایی در مسیر غربالگری معمول شما نیستند، ولی پتانسیل نوآوری دارند.
          روی هر کدام کلیک کنید تا برای آن دارایی، نمونه یا ایده جدید ثبت کنید.
        </span>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-bold text-gray-800">
          قالب‌های قابل نوآوری ({filtered.length} از {assetTypes.length})
        </h3>
        <input
          type="text"
          placeholder="جستجو در قالب‌ها..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#04241D] outline-none w-48"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
          <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">قالبی یافت نشد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((at) => (
            <Card
              key={at.id}
              className="border hover:shadow-md hover:border-purple-400 cursor-pointer transition"
              onClick={() =>
                router.push(
                  `/dashboard/intangible/screening/new?type=${organizationType}&asset_type=${at.id}`
                )
              }
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-800 text-sm truncate">
                      {at.name}
                    </h4>
                    <p className="text-[10px] text-gray-500 mt-1 font-mono">
                      {at.code}
                    </p>
                  </div>
                  <span className="text-xl flex-shrink-0">💡</span>
                </div>
                <div className="mt-3 pt-2 border-t border-gray-100 text-[10px] text-purple-600 font-medium">
                  + ثبت ایده
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
