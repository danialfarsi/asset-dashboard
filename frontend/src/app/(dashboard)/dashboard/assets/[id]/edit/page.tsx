// src/app/dashboard/assets/[id]/edit/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { getAsset, updateAsset, getCategories, getLocations } from "@/lib/asset-api"
import { Asset, AssetStatus, AssetCategory, AssetLocation } from "@/types/asset"
import { ArrowRight, Save } from "lucide-react"
import {  AssetWritePayload } from '@/types/asset'

const STATUS_OPTIONS: { value: AssetStatus; label: string }[] = [
  { value: "active",      label: "فعال" },
  { value: "inactive",    label: "غیرفعال" },
  { value: "maintenance", label: "در انتظار تعمیر" },
  { value: "disposed",    label: "خارج از سرویس" },
]

interface FormData {
  name: string
  asset_code: string
  status: AssetStatus
  category_id: string
  location_id: string
  purchase_date: string
  purchase_price: string
  current_value: string
}

export default function AssetEditPage() {
  const router = useRouter()
  const params = useParams()
  const id = Number(params.id)

  const [form, setForm] = useState<FormData>({
    name: "",
    asset_code: "",
    status: "active",
    category_id: "",
    location_id: "",
    purchase_date: "",
    purchase_price: "",
    current_value: "",
  })

  const [categories, setCategories] = useState<AssetCategory[]>([])
  const [locations, setLocations] = useState<AssetLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getAsset(id), getCategories(), getLocations()])
      .then(([asset, cats, locs]) => {
        setCategories(cats)
        setLocations(locs)
        setForm({
          name: asset.name,
          asset_code: asset.asset_code,
          status: asset.status,
          category_id: asset.category?.id?.toString() ?? "",
          location_id: asset.location?.id?.toString() ?? "",
          purchase_date: asset.purchase_date?.slice(0, 10) ?? "",
          purchase_price: asset.purchase_price?.toString() ?? "",
          current_value: asset.current_value?.toString() ?? "",
        })
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const set = (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      await updateAsset(id, {
        name: form.name,
        asset_code: form.asset_code,
        status: form.status,
        category_id: form.category_id ? Number(form.category_id) : undefined,
        location_id: form.location_id ? Number(form.location_id) : undefined,
        purchase_date: form.purchase_date || undefined,
        purchase_price: form.purchase_price ? Number(form.purchase_price) : undefined,
        current_value: form.current_value ? Number(form.current_value) : undefined,
      })

      router.push(`/dashboard/assets/${id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "خطا در ذخیره‌سازی")
      setSaving(false)
    }
  }

  if (loading)
    return (
      <div dir="rtl" className="flex items-center justify-center h-64 text-gray-400 text-sm">
        در حال بارگذاری...
      </div>
    )

  return (
    <div dir="rtl" className="max-w-2xl mx-auto">

      {/* هدر */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ArrowRight size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">ویرایش دارایی</h1>
          <p className="text-xs text-gray-400 mt-0.5">#{form.asset_code}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* اطلاعات عمومی */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">اطلاعات عمومی</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                نام دارایی <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.name}
                onChange={set("name")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                کد دارایی <span className="text-red-500">*</span>
              </label>
              <input
                required
                value={form.asset_code}
                onChange={set("asset_code")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                وضعیت <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={form.status}
                onChange={set("status")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">دسته‌بندی</label>
              <select
                value={form.category_id}
                onChange={set("category_id")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">انتخاب کنید</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">مکان</label>
              <select
                value={form.location_id}
                onChange={set("location_id")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">انتخاب کنید</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* اطلاعات مالی */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">اطلاعات مالی</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">تاریخ خرید</label>
              <input
                type="date"
                value={form.purchase_date}
                onChange={set("purchase_date")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">قیمت خرید (ریال)</label>
              <input
                type="number"
                min="0"
                value={form.purchase_price}
                onChange={set("purchase_price")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ارزش فعلی (ریال)</label>
              <input
                type="number"
                min="0"
                value={form.current_value}
                onChange={set("current_value")}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

          </div>
        </div>

        {/* دکمه‌ها */}
        <div className="flex gap-3 pb-8">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors"
          >
            <Save size={15} />
            {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2.5 px-4 rounded-lg text-sm transition-colors"
          >
            انصراف
          </button>
        </div>

      </form>
    </div>
  )
}
