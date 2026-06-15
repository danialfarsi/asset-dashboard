// src/app/dashboard/assets/new/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { assetApi } from "@/lib/asset-api"
import { AssetStatus } from "@/types/asset"

interface Category { id: number; name: string }
interface Location { id: number; name: string }

const statusOptions: { value: AssetStatus; label: string }[] = [
  { value: "active", label: "فعال" },
  { value: "inactive", label: "غیرفعال" },
  { value: "maintenance", label: "در انتظار تعمیر" },
  { value: "disposed", label: "خارج از سرویس" },
]

export default function NewAssetPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [locations, setLocations] = useState<Location[]>([])

  const [form, setForm] = useState({
    name: "",
    asset_code: "",
    status: "active" as AssetStatus,
    category_id: "",
    location_id: "",
    purchase_date: "",
    purchase_price: "",
    current_value: "",
  })

useEffect(() => {
  assetApi.getCategories().then(setCategories).catch(() => {});
  assetApi.getLocations().then(setLocations).catch(() => {});
}, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);

  if (!form.name || !form.asset_code || !form.category_id) {
    setError("نام، کد دارایی و دسته‌بندی الزامی هستند.");
    return;
  }

  setLoading(true);
  try {
    await assetApi.createAsset({
      name: form.name,
      asset_code: form.asset_code,
      status: form.status,
      category_id: Number(form.category_id),
      location_id: form.location_id ? Number(form.location_id) : undefined,
      purchase_date: form.purchase_date || undefined,
      purchase_price: form.purchase_price ? Number(form.purchase_price) : undefined,
      current_value: form.current_value ? Number(form.current_value) : undefined,
    });
    router.push("/dashboard/assets");
  } catch (err: unknown) {
    setError(err instanceof Error ? err.message : "خطا در ثبت دارایی");
  } finally {
    setLoading(false);
  }
};

  return (
    <div dir="rtl" className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">افزودن دارایی</h1>
        <p className="text-sm text-gray-500 mt-1">اطلاعات دارایی جدید را وارد کنید</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* ردیف ۱: نام و کد */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              نام دارایی <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="مثال: لپ‌تاپ Dell"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              کد دارایی <span className="text-red-500">*</span>
            </label>
            <input
              name="asset_code"
              value={form.asset_code}
              onChange={handleChange}
              placeholder="مثال: IT-001"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* ردیف ۲: وضعیت و دسته‌بندی */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              وضعیت
            </label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              دسته‌بندی <span className="text-red-500">*</span>
            </label>
            <select
              name="category_id"
              value={form.category_id}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">انتخاب کنید</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ردیف ۳: مکان */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            مکان
          </label>
          <select
            name="location_id"
            value={form.location_id}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">بدون مکان</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        {/* ردیف ۴: اطلاعات مالی */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm font-medium text-gray-600 mb-3">اطلاعات مالی (اختیاری)</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ خرید</label>
              <input
                type="date"
                name="purchase_date"
                value={form.purchase_date}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">قیمت خرید (ریال)</label>
              <input
                type="number"
                name="purchase_price"
                value={form.purchase_price}
                onChange={handleChange}
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ارزش فعلی (ریال)</label>
              <input
                type="number"
                name="current_value"
                value={form.current_value}
                onChange={handleChange}
                placeholder="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* دکمه‌ها */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
          >
            {loading ? "در حال ثبت..." : "ثبت دارایی"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2 rounded-lg text-sm transition-colors"
          >
            انصراف
          </button>
        </div>

      </form>
    </div>
  )
}
