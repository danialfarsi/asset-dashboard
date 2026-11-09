"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Search, Loader2, Shield, ArrowRight, X } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface Template {
  id: number;
  name: string;
  asset_type_name: string | null;
}

export default function RTOScreeningPublicPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // استیت‌های مودال انتخاب قالب
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [assetName, setAssetName] = useState("");

  // استیت مودال راهنما
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("rto_student_token");
    if (!t) {
      router.push("/public/rto-signup");
      return;
    }
    setToken(t);

    // چک کردن اینکه کاربر قبلاً راهنما رو دیده یا نه
    const hasSeenWelcome = localStorage.getItem("rto_welcome_seen");
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }

    fetchTemplates();
  }, []);

  const handleCloseWelcome = () => {
    localStorage.setItem("rto_welcome_seen", "true");
    setShowWelcome(false);
  };

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

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setAssetName(template.name); // اسم پیش‌فرض = اسم قالب
  };

  const handleConfirmSubmit = async () => {
    if (!token || !selectedTemplate || !assetName.trim()) {
      toast.error("لطفاً نام دارایی را وارد کنید");
      return;
    }
    
    try {
      setSubmitting(true);
      
      const { data } = await axios.post(
        `${API_BASE}/intangible/public/rto-screening/`,
        {
          template_id: selectedTemplate.id,
          asset_name: assetName.trim(),
        },
        { headers: { "X-Student-Token": token } }
      );
      
      toast.success("دارایی ثبت شد! در حال انتقال به ارزیابی...");
      
      setTimeout(() => {
        router.push(`/public/rto-valuation/${data.asset_id}?token=${token}`);
      }, 1000);
      
    } catch (err: any) {
      const errData = err?.response?.data;
      const firstError = typeof errData === "object" ? Object.values(errData)[0] : "خطا در ثبت دارایی";
      toast.error(String(firstError));
      setSubmitting(false);
    }
  };

  const filtered = templates.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

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
      {/* مودال راهنما (خوش‌آمدگویی) */}
      {showWelcome && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* هدر مودال */}
            <div className="bg-emerald-600 p-6 text-white relative">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                🎓 راهنمای انتخاب دارایی
              </h2>
              <p className="text-emerald-100 mt-1 text-sm">لطفاً قبل از شروع، این راهنما را با دقت بخوانید</p>
              <button
                onClick={handleCloseWelcome}
                className="absolute top-4 left-4 p-2 bg-emerald-700/50 hover:bg-emerald-700 rounded-full transition-colors"
                title="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* محتوای مودال */}
            <div className="p-8 overflow-y-auto space-y-6 text-gray-700 leading-relaxed text-justify">
              <p className="font-medium text-lg">
                به سامانه ارزیابی دارایی‌های نامشهود خوش آمدید.
              </p>
              <p className="text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
                در این مرحله، لازم است مشخص فرمایید که قصد ارزیابی کدام دارایی نامشهود (از قبیل نرم‌افزار، مدل هوش مصنوعی، دانش فنی، یا الگوریتم) را دارید.
              </p>

              <div className="border-r-4 border-emerald-500 pr-4 py-2 bg-emerald-50/50 rounded-l-xl">
                <h3 className="font-bold text-emerald-900 mb-2 flex items-center gap-2">
                  💻 نمونه‌ای از پایان‌نامه مهندسی کامپیوتر
                </h3>
                <p className="text-sm mb-3">
                  فرض نمایید پایان‌نامه شما پیرامون <strong>«تشخیص نفوذ در شبکه‌های صنعتی با یادگیری عمیق»</strong> بوده و یک <strong>«مدل هوش مصنوعی»</strong> یا <strong>«سیستم نرم‌افزاری»</strong> توسعه داده‌اید.
                </p>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="bg-emerald-200 text-emerald-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">۱</span>
                    <span>در فهرست قالب‌ها، گزینه <strong>«مدل‌های پیش‌بینی/شبیه‌سازی منحصربه‌فرد»</strong> یا <strong>«نرم‌افزارهای اختصاصی (کد منبع)»</strong> را انتخاب نمایید.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-emerald-200 text-emerald-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">۲</span>
                    <span>در پنجره‌ای که گشوده می‌شود، نام دارایی خود را به‌طور دقیق وارد کنید. به‌عنوان مثال: <br/><strong>«مدل تشخیص نفوذ با شبکه‌های عصبی»</strong> یا <strong>«سیستم نرم‌افزاری تحلیل ترافیک شبکه»</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-emerald-200 text-emerald-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">۳</span>
                    <span>سپس وارد پرسشنامه ارزیابی شده و به سوالات (از ۱ تا ۵) پاسخ دهید.</span>
                  </li>
                </ul>
              </div>

              {/* بخش شواهد */}
              <div className="bg-blue-50 border-r-4 border-blue-500 pr-4 py-3 rounded-l-xl">
                <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                  📎 درباره بارگذاری شواهد
                </h3>
                <p className="text-sm mb-3">
                  در هر سوال، دکمه «آپلود شاهد» تعبیه شده است. الزامی به بارگذاری کل پایگاه داده پایان‌نامه نیست؛ تنها ارائه یک شاهد کوتاه کفایت می‌کند:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>برای هر سوال، یک فایل (PDF، تصویر، Word، Excel یا ZIP) و یا یک پیوند (Google Drive، OneDrive یا نشانی وب‌سایت) بارگذاری نمایید.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>در صورت عدم دسترسی به فایل، می‌توانید در بخش «توضیح شاهد»، پاراگرافی مختصر درباره دلیل امتیاز خود بنویسید (به‌عنوان مثال: «نتایج آزمون مدل بر روی ۵۰۰۰ رکورد»).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    <span>شاهد ارائه‌شده باید با سوال مرتبط باشد. به‌عنوان مثال، برای سوال «آیا مدل اعتبارسنجی شده است؟»، گزارش اعتبارسنجی یا خروجی Jupyter Notebook را بارگذاری نمایید.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 text-sm flex items-start gap-2">
                <span className="text-xl">⚠️</span>
                <p>
                  <strong>توجه:</strong> نام دارایی باید دقیقاً بیانگر همان چیزی باشد که در پایان‌نامه خود توسعه داده‌اید. از درج عناوین کلی نظیر «پروژه پایانی» خودداری فرمایید.
                </p>
              </div>
            </div>

            {/* فوتر مودال */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={handleCloseWelcome}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-200 flex items-center gap-2"
              >
                متوجه شدم، ادامه می‌دهم
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-2xl mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-emerald-900">
            انتخاب دارایی برای ارزیابی
          </h1>
          <p className="text-gray-600 mt-2">
            روی قالب مورد نظر کلیک کنید تا نام دارایی خود را وارد کنید
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="جستجو در قالب‌ها..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-gray-50"
            />
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {filtered.length === 0 ? (
              <p className="text-center text-gray-400 py-8">قالبی یافت نشد</p>
            ) : (
              filtered.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleSelectTemplate(t)}
                  className="group relative p-5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between border-gray-100 bg-gray-50 hover:border-emerald-300 hover:bg-white hover:shadow-md"
                >
                  <div>
                    <div className="font-bold text-gray-800 text-lg group-hover:text-emerald-700 transition-colors">
                      {t.name}
                    </div>
                    {t.asset_type_name && (
                      <div className="text-sm text-gray-500 mt-1">
                        نوع: {t.asset_type_name}
                      </div>
                    )}
                  </div>
                  
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-gray-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-all">
                    <ArrowRight className="w-5 h-5 rotate-180" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* مودال وارد کردن نام دارایی */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800">نام دارایی</h3>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="p-1 hover:bg-gray-100 rounded-full text-gray-400"
                disabled={submitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-500">
              قالب انتخابی: <span className="font-semibold text-emerald-700">{selectedTemplate.name}</span>
            </p>

            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">
                نام دارایی خود را وارد کنید
              </label>
              <input
                type="text"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                placeholder="مثلاً: سیستم مدیریت انرژی شرکت"
                autoFocus
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedTemplate(null)}
                disabled={submitting}
                className="flex-1 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                انصراف
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={submitting || !assetName.trim()}
                className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> در حال ثبت...</>
                ) : (
                  "ثبت و ادامه"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
