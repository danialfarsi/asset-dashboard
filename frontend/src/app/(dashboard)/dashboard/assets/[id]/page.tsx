// src/app/dashboard/assets/[id]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { getAsset, deleteAsset } from "@/lib/asset-api"
import { Asset, AssetStatus } from "@/types/asset"
import Link from "next/link"
import {
  ArrowRight,
  Pencil,
  Trash2,
  Tag,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Hash,
} from "lucide-react"

const statusConfig: Record<AssetStatus, { label: string; className: string }> = {
  active:      { label: "فعال",             className: "bg-green-100 text-green-700" },
  inactive:    { label: "غیرفعال",          className: "bg-gray-100 text-gray-600"  },
  maintenance: { label: "در انتظار تعمیر", className: "bg-yellow-100 text-yellow-700" },
  disposed:    { label: "خارج از سرویس",   className: "bg-red-100 text-red-600"    },
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value?: string | number | null
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="mt-0.5 text-gray-400">
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-gray-800">
          {value ?? <span className="text-gray-400 font-normal">—</span>}
        </p>
      </div>
    </div>
  )
}

export default function AssetDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = Number(params.id)

  const [asset, setAsset] = useState<Asset | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    getAsset(id)
      .then(setAsset)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteAsset(id)
      router.push("/dashboard/assets")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "خطا در حذف دارایی")
      setDeleting(false)
      setShowConfirm(false)
    }
  }

  const formatPrice = (val?: number) =>
    val != null ? val.toLocaleString("fa-IR") + " ریال" : undefined

  const formatDate = (val?: string| undefined) => {
    if (!val) return undefined
    return new Date(val).toLocaleDateString("fa-IR")
  }

  if (loading)
    return (
      <div dir="rtl" className="flex items-center justify-center h-64 text-gray-400 text-sm">
        در حال بارگذاری...
      </div>
    )

  if (error)
    return (
      <div dir="rtl" className="max-w-xl mx-auto mt-10">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          <ArrowRight size={14} /> بازگشت
        </button>
      </div>
    )

  if (!asset) return null

  const status = statusConfig[asset.status]

  return (
    <div dir="rtl" className="max-w-2xl mx-auto">

      {/* هدر */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <ArrowRight size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{asset.name}</h1>
            <p className="text-xs text-gray-400 mt-0.5">#{asset.asset_code}</p>
          </div>
        </div>

        {/* badge وضعیت */}
        <span className={`text-xs font-medium px-3 py-1 rounded-full ${status.className}`}>
          {status.label}
        </span>
      </div>

      {/* کارت اطلاعات اصلی */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">اطلاعات عمومی</h2>
        <DetailRow icon={Hash}     label="کد دارایی"    value={asset.asset_code} />
        <DetailRow icon={Tag}      label="دسته‌بندی"    value={asset.category?.name} />
        <DetailRow icon={MapPin}   label="مکان"         value={asset.location?.name} />
      </div>

      {/* کارت اطلاعات مالی */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">اطلاعات مالی</h2>
        <DetailRow icon={Calendar}   label="تاریخ خرید"   value={formatDate(asset.purchase_date)} />
        <DetailRow icon={DollarSign} label="قیمت خرید"    value={formatPrice(asset.purchase_price)} />
        <DetailRow icon={DollarSign} label="ارزش فعلی"    value={formatPrice(asset.current_value)} />
      </div>

      {/* کارت زمان‌ها */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">تاریخچه</h2>
        <DetailRow icon={Clock} label="ایجاد شده"     value={formatDate(asset.created_at)} />
        <DetailRow icon={Clock} label="آخرین ویرایش"  value={formatDate(asset.updated_at)} />
      </div>

      {/* دکمه‌های عملیات */}
      <div className="flex gap-3">
        <Link
          href={`/dashboard/assets/${id}/edit`}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
        >
          <Pencil size={15} />
          ویرایش دارایی
        </Link>
        <button
          onClick={() => setShowConfirm(true)}
          className="flex items-center gap-2 border border-red-300 text-red-600 hover:bg-red-50 font-medium py-2 px-4 rounded-lg text-sm transition-colors"
        >
          <Trash2 size={15} />
          حذف
        </button>
      </div>

      {/* مودال تایید حذف */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4" dir="rtl">
            <h3 className="text-base font-bold text-gray-900 mb-2">حذف دارایی</h3>
            <p className="text-sm text-gray-600 mb-5">
              آیا از حذف <span className="font-semibold">«{asset.name}»</span> مطمئن هستید؟
              این عمل قابل بازگشت نیست.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2 rounded-lg text-sm transition-colors"
              >
                {deleting ? "در حال حذف..." : "بله، حذف شود"}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 rounded-lg text-sm transition-colors"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
