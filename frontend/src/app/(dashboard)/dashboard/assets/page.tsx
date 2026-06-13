// src/app/(dashboard)/dashboard/assets/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { assetApi } from '@/lib/asset-api'
import { Asset, AssetStatus } from '@/types/asset'
import { useAuthStore } from '@/store/auth-store'

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchAssets()
  }, [])

  async function fetchAssets() {
    try {
      setLoading(true)
      const data = await assetApi.getAll()
      setAssets(data.results)
    } catch (err) {
      setError('خطا در دریافت دارایی‌ها')
    } finally {
      setLoading(false)
    }
  }

  const statusLabel: Record<AssetStatus, string> = {
    active: 'فعال',
    inactive: 'غیرفعال',
    maintenance: 'در تعمیر',
    disposed: 'اسقاط',
  }

  const statusColor: Record<AssetStatus, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    maintenance: 'bg-yellow-100 text-yellow-800',
    disposed: 'bg-red-100 text-red-800',
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  )

  if (error) return (
    <div className="p-6 text-red-600 text-center">{error}</div>
  )

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">دارایی‌ها</h1>
          <p className="text-sm text-gray-500 mt-1">{assets.length} دارایی ثبت شده</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/assets/new')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          + افزودن دارایی
        </button>
      </div>

      {/* Table */}
      {assets.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          هیچ دارایی‌ای ثبت نشده است.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-right">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500">نام</th>
                <th className="px-4 py-3 font-medium text-gray-500">کد دارایی</th>
                <th className="px-4 py-3 font-medium text-gray-500">دسته‌بندی</th>
                <th className="px-4 py-3 font-medium text-gray-500">وضعیت</th>
                <th className="px-4 py-3 font-medium text-gray-500">مکان</th>
                <th className="px-4 py-3 font-medium text-gray-500">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-900">{asset.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono">{asset.asset_code}</td>
                  <td className="px-4 py-3 text-gray-600">{asset.category?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[asset.status]}`}>
                      {statusLabel[asset.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{asset.location?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/dashboard/assets/${asset.id}`)}
                        className="text-blue-600 hover:underline text-xs"
                      >
                        مشاهده
                      </button>
                      <button
                        onClick={() => router.push(`/dashboard/assets/${asset.id}/edit`)}
                        className="text-gray-600 hover:underline text-xs"
                      >
                        ویرایش
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
