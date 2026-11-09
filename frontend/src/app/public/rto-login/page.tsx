"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Loader2, Mail, Hash, ArrowRight } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function RTOLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    student_email: "",
    student_id: "",
  });

  const update = (key: string, value: string) => {
    setForm((p) => ({ ...p, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.student_email.trim() || !form.student_email.includes("@")) {
      toast.error("ایمیل معتبر وارد کنید");
      return;
    }
    if (!form.student_id.trim()) {
      toast.error("شماره دانشجویی الزامی است");
      return;
    }

    try {
      setLoading(true);
      const { data } = await axios.post(`${API_BASE}/intangible/public/rto-login/`, form);
      
      localStorage.setItem("rto_student_token", data.access_token);
      localStorage.setItem("rto_student_info", JSON.stringify(data.student));
      
      toast.success("ورود موفق! در حال انتقال...");
      setTimeout(() => router.push("/public/rto-dashboard"), 1000);
    } catch (err: any) {
      const errData = err?.response?.data;
      const firstError = typeof errData === "object" ? Object.values(errData)[0] : "خطا در ورود";
      toast.error(String(firstError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 py-10 px-4 flex items-center justify-center"
      style={{ fontFamily: "Vazirmatn, Tahoma, sans-serif" }}
      dir="rtl"
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-2xl mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-emerald-900">ورود دانشجو</h1>
          <p className="text-gray-600 mt-2 text-sm">
            با ایمیل و شماره دانشجویی خود وارد شوید
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Mail className="w-3 h-3" />
              ایمیل <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              dir="ltr"
              value={form.student_email}
              onChange={(e) => update("student_email", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              placeholder="ali@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Hash className="w-3 h-3" />
              شماره دانشجویی <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.student_id}
              onChange={(e) => update("student_id", e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              placeholder="401234567"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> در حال ورود...</>
            ) : (
              <>ورود به داشبورد <ArrowRight className="w-4 h-4 rotate-180" /></>
            )}
          </button>

          <p className="text-center text-xs text-gray-500 mt-4">
            قبلاً ثبت‌نام نکرده‌اید؟{" "}
            <a href="/public/rto-signup" className="text-emerald-600 hover:underline">
              ثبت‌نام کنید
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
