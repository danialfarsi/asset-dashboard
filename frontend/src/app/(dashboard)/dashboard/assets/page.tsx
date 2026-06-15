// src/app/dashboard/assets/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Asset, AssetFilters } from '@/types/asset';
import { getAssets } from '@/lib/asset-api';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilSquareIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from '@heroicons/react/24/outline';

// ─── Status helpers ───────────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; className: string }> = {
  active: {
    label: 'فعال',
    className: 'bg-green-100 text-green-700',
  },
  inactive: {
    label: 'غیرفعال',
    className: 'bg-gray-100 text-gray-600',
  },
  maintenance: {
    label: 'در انتظار تعمیر',
    className: 'bg-orange-100 text-orange-700',
  },
  disposed: {
    label: 'خارج از سرویس',
    className: 'bg-red-100 text-red-600',
  },
  in_use: {
    label: 'در حال استفاده',
    className: 'bg-blue-100 text-blue-700',
  },
};

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? {
    label: status,
    className: 'bg-gray-100 text-gray-600',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 8;

export default function AssetsPage() {
  const router = useRouter();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.ceil(total / PAGE_SIZE);

const fetchAssets = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
    const filters: AssetFilters = {
      page,
      search: search || undefined,
    };
    const data = await getAssets(filters);
    setAssets(data.results);
    setTotal(data.count);
  } catch (err) {
    console.error('Asset fetch error:', err); // اضافه کن
    setError('خطا در دریافت دارایی‌ها');
  } finally {
    setLoading(false);
  }
}, [page, search]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Reset to page 1 on search change
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">دارایی‌ها</h1>
        <Link
          href="/dashboard/assets/new"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          افزودن دارایی
        </Link>
      </div>

      {/* Card */}
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100">
        {/* Toolbar */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-100">
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <FunnelIcon className="h-4 w-4" />
            فیلتر
          </button>
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlassIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="جستجو در دارایی‌ها..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pr-9 pl-3 text-sm text-gray-700 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {error ? (
            <div className="flex items-center justify-center py-16 text-sm text-red-500">
              {error}
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : assets.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-gray-400">
              دارایی‌ای یافت نشد
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs text-gray-500">
                  <th className="px-4 py-3 text-right font-medium">نام</th>
                  <th className="px-4 py-3 text-right font-medium">کد دارایی</th>
                  <th className="px-4 py-3 text-right font-medium">دسته‌بندی</th>
                  <th className="px-4 py-3 text-right font-medium">وضعیت</th>
                  <th className="px-4 py-3 text-right font-medium">مکان</th>
                  <th className="px-4 py-3 text-center font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {assets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {asset.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-600">
                      {asset.asset_code}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {asset.category?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={asset.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {asset.location?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() =>
                            router.push(`/dashboard/assets/${asset.id}/edit`)
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <PencilSquareIcon className="h-3.5 w-3.5" />
                          ویرایش
                        </button>
                        <button
                          onClick={() =>
                            router.push(`/dashboard/assets/${asset.id}`)
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <EyeIcon className="h-3.5 w-3.5" />
                          مشاهده
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <span className="text-xs text-gray-500">
              نمایش {from} تا {to} از {total} مورد
            </span>
            <div className="flex items-center gap-1">
              {/* First */}
              <PaginationBtn
                onClick={() => setPage(1)}
                disabled={page === 1}
                aria-label="صفحه اول"
              >
                <ChevronDoubleRightIcon className="h-4 w-4" />
              </PaginationBtn>
              {/* Prev */}
              <PaginationBtn
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                aria-label="صفحه قبل"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </PaginationBtn>

              {/* Page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
                )
                .reduce<(number | 'ellipsis')[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) {
                    acc.push('ellipsis');
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, i) =>
                  item === 'ellipsis' ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-gray-400">
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setPage(item)}
                      className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors ${
                        item === page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}

              {/* Next */}
              <PaginationBtn
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
                aria-label="صفحه بعد"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </PaginationBtn>
              {/* Last */}
              <PaginationBtn
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                aria-label="صفحه آخر"
              >
                <ChevronDoubleLeftIcon className="h-4 w-4" />
              </PaginationBtn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Pagination button helper ──────────────────────────────────────────────────

function PaginationBtn({
  children,
  onClick,
  disabled,
  'aria-label': ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  'aria-label': string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}
