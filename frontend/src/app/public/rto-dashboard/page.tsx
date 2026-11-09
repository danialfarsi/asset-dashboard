"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Plus, Loader2, LogOut, CheckCircle, Clock, FileText, TrendingUp } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface Asset {
  asset_id: number;
  asset_name: string;
  asset_type: string | null;
  created_at: string;
  final_score: number;
  has_valuation: boolean;
}

export default function RTODashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("rto_student_token");
    if (!t) {
      router.push("/public/rto-signup");
      return;
    }
    setToken(t);
    fetchAssets(t);
  }, []);

  const fetchAssets = async (t: string) => {
    try {
      const { data } = await axios.get(`${API_BASE}/intangible/public/rto-dashboard/`, {
        headers: { "X-Student-Token": t },
      });
      setAssets(data.assets || []);
      setStudent(data.student);
    } catch (err: any) {
      console.error(err);
      if (err?.response?.status === 401) {
        localStorage.removeItem("rto_student_token");
        router.push("/public/rto-signup");
      } else {
        toast.error("خطا در بارگذاری");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("rto_student_token");
    localStorage.removeItem("rto_student_info");
    router.push("/public/rto-signup");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 py-10 px-4"
      style={{ fontFamily: "Vazirmatn, Tahoma, sans-serif" }}
      dir="rtl"
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-emerald-900">
                {student?.name} {student?.family}
              </h1>
              <p className="text-sm text-gray-500">شماره دانشجویی: {student?.student_id}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            <LogOut className="w-4 h-4" />
            خروج
          </button>
        </div>

        <div className="mb-6">
          <button
            onClick={() => router.push("/public/rto-screening")}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 shadow-md"
          >
            <Plus className="w-5 h-5" />
            افزودن دارایی جدید
          </button>
        </div>

        <h2 className="text-lg font-bold text-gray-800 mb-4">
          دارایی‌های من ({assets.length})
        </h2>

        {assets.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-700 mb-2">هنوز دارایی ندارید</h3>
            <p className="text-sm text-gray-500 mb-6">
              اولین دارایی خود را اضافه کنید و ارزیابی را شروع کنید
            </p>
            <button
              onClick={() => router.push("/public/rto-screening")}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              افزودن اولین دارایی
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {assets.map((asset) => (
              <div
                key={asset.asset_id}
                className="bg-white rounded-xl shadow-sm p-5 flex items-center justify-between hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900">{asset.asset_name}</h3>
                    {asset.has_valuation ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        ارزیابی شده
                      </span>
                    ) : (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        در انتظار ارزیابی
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {asset.asset_type} • {new Date(asset.created_at).toLocaleDateString("fa-IR")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {asset.has_valuation && (
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${
                        asset.final_score >= 70 ? "text-green-600" :
                        asset.final_score >= 50 ? "text-amber-600" : "text-red-600"
                      }`}>
                        {asset.final_score.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-400">امتیاز</div>
                    </div>
                  )}
                  <button
                    onClick={() => router.push(`/public/rto-valuation/${asset.asset_id}?token=${token}`)}
                    className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 text-sm font-medium"
                  >
                    {asset.has_valuation ? "مشاهده" : "شروع ارزیابی"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
