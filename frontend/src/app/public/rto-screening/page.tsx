"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Search, Loader2, Shield, ArrowLeft, ArrowRight, User, Mail, Phone, Hash } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface Template {
  id: number;
  name: string;
  asset_type_code: string | null;
  asset_type_name: string | null;
  valuation_method: string | null;
}

export default function RTOScreeningPublicPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [search, setSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  // فرم
  const [form, setForm] = useState({
    asset_name: "",
    student_name: "",
    student_family: "",
    student_id: "",
    student_phone: "",
    student_email: "",
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_BASE}/intangible/public/rto-screening/`);
      setTemplates(data.templates || []);
    } catch (err) {
      console.error(err);
      toast.error("خطا در بارگذاری قالب‌ها");
    } finally {
      setLoading(false);
    }
  };

  const filtered = templates.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateStep2 = () => {
    if (!form.asset_name.trim()) { toast.error("نام دارایی الزامی است"); return false; }
    if (!form.student_name.trim()) { toast.error("نام الزامی است"); return false; }
    if (!form.student_family.trim()) { toast.error("نام خانوادگی الزامی است"); return false; }
    if (!form.student_id.trim()) { toast.error("شماره دانشجویی الزامی است"); return false; }
    if (!form.student_phone.trim()) { toast.error("شماره تماس الزامی است"); return false; }
    if (!form.student_email.trim() || !form.student_email.includes("@")) {
      toast.error("ایمیل معتبر وارد کنید");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    try {
      setSubmitting(true);
      const { data } = await axios.post(`${API_BASE}/intangible/public/rto-screening/`, {
        template_id: selectedTemplate,
        ...form,
      });
      toast.success("دارایی ثبت شد! در حال انتقال به صفحه ارزیابی...");
      setTimeout(() => {
        router.push(`/public/rto-valuation/${data.asset_id}`);
      }, 1500);
    } catch (err: any) {
      const errData = err?.response?.data;
      if (typeof errData === "object" && errData !== null) {
        const firstError = Object.values(errData)[0];
        toast.error(String(firstError));
      } else {
        toast.error("خطا در ثبت دارایی");
      }
    } finally {
      setSubmitting(false);
    }
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
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-2xl mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-emerald-900">
            ثبت دارایی سازمان پژوهش و فناوری
          </h1>
          <p className="text-gray-600 mt-2">
            گام {step} از ۲ — {step === 1 ? "انتخاب قالب" : "اطلاعات دانشجو"}
          </p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-6">
          <div className={`flex-1 h-2 rounded-full ${step >= 1 ? "bg-emerald-500" : "bg-gray-200"}`} />
          <div className={`flex-1 h-2 rounded-full ${step >= 2 ? "bg-emerald-500" : "bg-gray-200"}`} />
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                انتخاب قالب دارایی
              </label>
              <div className="relative mb-3">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="جستجو در قالب‌ها..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pr-10 pl-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="max-h-80 overflow-y-auto space-y-2 border border-gray-100 rounded-lg p-2">
                {filtered.length === 0 ? (
                  <p className="text-center text-gray-400 py-4">قالبی یافت نشد</p>
                ) : (
                  filtered.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedTemplate === t.id
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-gray-200 hover:border-emerald-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{t.name}</div>
                          {t.asset_type_name && (
                            <div className="text-xs text-gray-500 mt-1">{t.asset_type_name}</div>
                          )}
                        </div>
                        {selectedTemplate === t.id && (
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={() => {
                if (!selectedTemplate) {
                  toast.error("لطفاً یک قالب انتخاب کنید");
                  return;
                }
                setStep(2);
              }}
              disabled={!selectedTemplate}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              مرحله بعد
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                نام دارایی <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="مثال: برنامه نرم‌افزاری تحلیل داده"
                value={form.asset_name}
                onChange={(e) => updateForm("asset_name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                اطلاعات دانشجو
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    نام <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.student_name}
                    onChange={(e) => updateForm("student_name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    نام خانوادگی <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.student_family}
                    onChange={(e) => updateForm("student_family", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    شماره دانشجویی <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.student_id}
                    onChange={(e) => updateForm("student_id", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    شماره تماس <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={form.student_phone}
                    onChange={(e) => updateForm("student_phone", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    ایمیل <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    dir="ltr"
                    value={form.student_email}
                    onChange={(e) => updateForm("student_email", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                مرحله قبل
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ flex: 2 }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    در حال ثبت...
                  </>
                ) : (
                  "ثبت و رفتن به ارزیابی"
                )}
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-500 mt-6">
          پس از ثبت، به‌طور خودکار به صفحه ارزیابی دارایی منتقل می‌شوید
        </p>
      </div>
    </div>
  );
}
