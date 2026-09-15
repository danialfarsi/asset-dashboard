'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Eye, EyeOff, Check, ShieldCheck, Building2, Users, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import Image from 'next/image';

interface InviteInfo {
  department_id: number;
  department_name: string;
  organization_id: number;
  organization_name: string;
  organization_code: string;
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    password: '',
    password_confirm: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadInvite = async () => {
      try {
        const res = await api.get(`/auth/invite/${token}/`);
        setInviteInfo(res.data);
      } catch (err: any) {
        console.error('Load invite error:', err);
        setLoadError(
          err.response?.data?.error || 'دعوت نامعتبر یا منقضی شده است'
        );
      } finally {
        setLoading(false);
      }
    };
    if (token) loadInvite();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.first_name || !form.last_name) {
      setError('نام و نام خانوادگی الزامی است');
      return;
    }
    if (!form.email || !form.username || !form.password) {
      setError('ایمیل، نام کاربری و رمز عبور الزامی است');
      return;
    }
    if (form.password.length < 6) {
      setError('رمز عبور باید حداقل ۶ کاراکتر باشد');
      return;
    }
    if (form.password !== form.password_confirm) {
      setError('رمز عبور و تکرار آن یکسان نیستند');
      return;
    }
    if (!agree) {
      setError('برای ثبت‌نام باید شرایط را بپذیرید');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/auth/register-user/', {
        invite_token: token,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        username: form.username,
        password: form.password,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      console.error('Register error:', err);
      setError(err.response?.data?.error || 'خطا در ثبت‌نام');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F3EC] p-6" dir="rtl">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-100 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 opacity-50" />
          
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              🎉 ثبت‌نام موفق!
            </h1>
            <p className="text-gray-600 text-sm mb-6">
              حساب شما با موفقیت ساخته شد
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-right">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <span>📧</span>
                <span>ایمیل شما:</span>
              </div>
              <p className="font-mono text-sm text-gray-800 bg-white px-3 py-2 rounded-lg border border-gray-200" dir="ltr">
                {form.email}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-3 mb-2">
                <span>🏢</span>
                <span>سازمان و واحد:</span>
              </div>
              <p className="text-sm text-gray-800 font-medium">
                {inviteInfo?.organization_name} — {inviteInfo?.department_name}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                <span>در حال انتقال به صفحه ورود...</span>
              </div>

              <button
                onClick={() => router.push('/login')}
                className="w-full bg-[#04241D] hover:bg-[#062E24] text-white font-medium text-sm py-3 rounded-xl transition shadow-lg"
              >
                ورود به سیستم →
              </button>
            </div>

            <p className="text-xs text-gray-400 mt-5">
              اگر تا ۳ ثانیه منتقل نشدید، روی دکمه بالا کلیک کنید
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F3EC]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#04241D] mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F3EC] p-6" dir="rtl">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">دعوت نامعتبر</h1>
          <p className="text-gray-600 text-sm mb-6">{loadError}</p>
          <a
            href="/login"
            className="inline-block px-6 py-3 bg-[#04241D] hover:bg-[#062E24] text-white text-sm font-medium rounded-xl transition"
          >
            بازگشت به صفحه ورود
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F5F3EC]" dir="rtl">
      <div className="w-full lg:w-[46%] flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-72 h-72 opacity-[0.04] rotate-12">
          <Image src="/logo.png" alt="" width={288} height={288} className="object-contain" />
        </div>

        <div className="w-full max-w-[440px] relative">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-11 h-11 relative shrink-0 bg-white rounded-xl shadow-[0_2px_10px_rgba(4,36,29,0.08)] border border-gray-100 flex items-center justify-center">
              <Image src="/logo.png" alt="متا پلتفرم" width={26} height={26} className="object-contain" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#0B2C24] leading-tight">پلتفرم مدیریت دارایی‌های نامشهود</p>
              <p className="text-[10px] text-gray-400 tracking-wide mt-0.5">دوقلو دیجیتال دارایی‌ها</p>
            </div>
          </div>

          {inviteInfo && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
              <p className="text-xs text-green-700 font-medium mb-2">
                🎉 شما به سازمان دعوت شده‌اید
              </p>
              <div className="flex items-center gap-2 text-sm text-green-800 mb-1">
                <Building2 size={14} />
                <span className="font-bold">{inviteInfo.organization_name}</span>
                <span className="text-xs text-green-600 font-mono">({inviteInfo.organization_code})</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-800">
                <Users size={14} />
                <span>{inviteInfo.department_name}</span>
              </div>
            </div>
          )}

          <div className="mb-8">
            <p className="text-[11px] tracking-[0.25em] text-golden-amber font-bold uppercase mb-3">ثبت‌نام مدیر واحد</p>
            <h1 className="text-[28px] font-bold text-[#0B2C24] leading-tight">خوش آمدید</h1>
            <div className="w-10 h-[3px] bg-golden-amber rounded-full mt-3 mb-3" />
            <p className="text-gray-500 text-sm leading-6">
              برای ورود به پنل واحد خود، فرم زیر را تکمیل کنید.
            </p>
          </div>

          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#0B2C24]/70 mb-1.5">نام</label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-dark-green/60 transition-all"
                  placeholder="علی"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0B2C24]/70 mb-1.5">نام خانوادگی</label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-dark-green/60 transition-all"
                  placeholder="بهلولی"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0B2C24]/70 mb-1.5">ایمیل</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-dark-green/60 transition-all"
                placeholder="ali@company.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0B2C24]/70 mb-1.5">نام کاربری</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-dark-green/60 transition-all"
                placeholder="ali"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#0B2C24]/70 mb-1.5">رمز عبور</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-dark-green/60 transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-dark-green"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0B2C24]/70 mb-1.5">تکرار رمز</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password_confirm}
                  onChange={(e) => setForm({ ...form, password_confirm: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-dark-green/60 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer select-none pt-2">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded-[5px] border flex items-center justify-center transition-all ${agree ? 'bg-dark-green border-dark-green' : 'border-gray-300'}`}>
                  {agree && <Check size={10} className="text-white" strokeWidth={3} />}
                </div>
              </div>
              <span className="text-xs text-gray-500 leading-5">
                شرایط استفاده و سیاست حفظ حریم خصوصی را می‌پذیرم
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="relative w-full bg-[#04241D] hover:bg-[#062E24] disabled:opacity-50 text-white font-medium text-sm py-3.5 rounded-xl transition-all duration-200 shadow-[0_14px_34px_rgba(4,36,29,0.28)] overflow-hidden mt-2"
            >
              <span className="absolute inset-y-0 right-0 w-[3px] bg-golden-amber" />
              {submitting ? 'در حال ثبت‌نام...' : 'ثبت‌نام و ورود به پنل'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200/70 flex items-center justify-center gap-2 text-[10px] text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            اطلاعات شما با رمزنگاری استاندارد محافظت می‌شود
          </div>
        </div>
      </div>

      <div className="hidden lg:flex lg:w-[54%] relative overflow-hidden bg-[#04241D]">
        <svg className="absolute inset-0 w-full h-full opacity-[0.15]" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="grid3" width="44" height="44" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#8ECFAF" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid3)" />
        </svg>

        <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-golden-amber/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[360px] h-[360px] bg-aqua-green/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

        <div className="relative z-10 flex flex-col justify-between w-full px-16 py-16 text-white">
          <span className="text-xs tracking-[0.3em] text-white/50 uppercase">Meta Platform · Manager Invitation</span>

          <div className="max-w-md">
            <div className="relative w-28 h-28 mb-10">
              <svg viewBox="0 0 100 100" className="w-28 h-28 animate-[spin_50s_linear_infinite]">
                <defs>
                  <path id="sealCircle3" d="M 50,50 m -40,0 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0" />
                </defs>
                <circle cx="50" cy="50" r="47" fill="none" stroke="#D4A547" strokeOpacity="0.4" strokeWidth="0.75" />
                <circle cx="50" cy="50" r="33" fill="none" stroke="#D4A547" strokeOpacity="0.25" strokeWidth="0.5" />
                <text fill="#D4A547" fontSize="6.6" letterSpacing="2.2">
                  <textPath href="#sealCircle3" startOffset="0%">
                    · ثبت و ارزش‌گذاری رسمی دارایی نامشهود · پلتفرم متا ·
                  </textPath>
                </text>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-golden-amber/40 flex items-center justify-center">
                  <Image src="/logo.png" alt="متا پلتفرم" width={30} height={30} className="object-contain brightness-0 invert" />
                </div>
              </div>
            </div>

            {inviteInfo && (
              <>
                <h2 className="text-[36px] leading-[1.35] font-bold tracking-tight">
                  خوش آمدید به<br />{inviteInfo.organization_name}.
                </h2>
                <p className="text-white/60 text-sm leading-7 mt-5 max-w-sm">
                  شما به عنوان مدیر «{inviteInfo.department_name}» دعوت شده‌اید.
                  پس از تکمیل ثبت‌نام، به پنل اختصاصی واحد خود دسترسی خواهید داشت.
                </p>
              </>
            )}
          </div>

          <div className="flex items-center gap-8 text-white/45 text-[11px]">
            <span>دعوت رسمی از سازمان</span>
            <span className="w-1 h-1 rounded-full bg-white/25" />
            <span>پلتفرم مدیریت دارایی‌های نامشهود</span>
          </div>
        </div>
      </div>
    </div>
  );
}
