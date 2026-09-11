'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Eye, EyeOff, Check, ShieldCheck } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    console.log('🔑 Login attempt with:', { email: form.email, password: '***' });

    try {
      await login({ email: form.email, password: form.password });
      const next = searchParams.get('next') || '/dashboard';
      router.push(next);
    } catch (err: any) {
      console.error('❌ Login error:', err);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F5F3EC]" dir="rtl">
      {/* ============================================
          RIGHT PANEL — THE FORM (comes first so it
          sits on the right edge in RTL flow)
      ============================================ */}
      <div className="w-full lg:w-[46%] flex items-center justify-center p-6 sm:p-12 relative">
        {/* faint corner watermark of the real logo, tying the two panels together */}
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-72 h-72 opacity-[0.04] rotate-12">
          <Image src="/logo.png" alt="" width={288} height={288} className="object-contain" />
        </div>

        <div className="w-full max-w-[400px] relative">
          {/* lockup */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-11 h-11 relative shrink-0 bg-white rounded-xl shadow-[0_2px_10px_rgba(4,36,29,0.08)] border border-gray-100 flex items-center justify-center">
              <Image src="/logo.png" alt="متا پلتفرم" width={26} height={26} className="object-contain" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#0B2C24] leading-tight">پلتفرم مدیریت دارایی‌های نامشهود</p>
              <p className="text-[10px] text-gray-400 tracking-wide mt-0.5">دوقلو دیجیتال دارایی‌ها</p>
            </div>
          </div>

          <div className="mb-9">
            <p className="text-[11px] tracking-[0.25em] text-golden-amber font-bold uppercase mb-3">ورود امن</p>
            <h1 className="text-[30px] font-bold text-[#0B2C24] leading-tight">خوش آمدید</h1>
            <div className="w-10 h-[3px] bg-golden-amber rounded-full mt-4 mb-4" />
            <p className="text-gray-500 text-sm leading-6">برای ادامه، وارد حساب کاربری خود شوید</p>
          </div>

          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error === 'Login failed' ? 'ایمیل یا رمز عبور اشتباه است' : error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#0B2C24]/70 mb-1.5 tracking-wide">
                ایمیل
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-[#0B2C24] placeholder:text-gray-400 shadow-[0_1px_2px_rgba(4,36,29,0.03)] focus:outline-none focus:ring-2 focus:ring-dark-green/60 focus:border-transparent transition-all"
                placeholder="you@company.com"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0B2C24]/70 mb-1.5 tracking-wide">
                رمز عبور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 pl-11 text-sm text-[#0B2C24] placeholder:text-gray-400 shadow-[0_1px_2px_rgba(4,36,29,0.03)] focus:outline-none focus:ring-2 focus:ring-dark-green/60 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-dark-green transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-[5px] border flex items-center justify-center transition-all ${rememberMe ? 'bg-dark-green border-dark-green' : 'border-gray-300'}`}>
                    {rememberMe && <Check size={10} className="text-white" strokeWidth={3} />}
                  </div>
                </div>
                <span className="text-xs text-gray-500">مرا به خاطر بسپار</span>
              </label>
              <button type="button" className="text-xs text-dark-green hover:text-medium-green font-medium">
                فراموشی رمز عبور؟
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full bg-[#04241D] hover:bg-[#062E24] disabled:opacity-50 text-white font-medium text-sm py-3.5 rounded-xl transition-all duration-200 mt-2 shadow-[0_14px_34px_rgba(4,36,29,0.28)] overflow-hidden"
            >
              <span className="absolute inset-y-0 right-0 w-[3px] bg-golden-amber" />
              {isLoading ? 'در حال ورود...' : 'ورود به سیستم'}
            </button>
          </form>

          <div className="mt-7 text-center">
            <p className="text-xs text-gray-500">
              حساب کاربری ندارید؟{' '}
              <button type="button" className="text-dark-green hover:text-medium-green font-semibold">
                ثبت نام کنید
              </button>
            </p>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-200/70 flex items-center justify-center gap-2 text-[10px] text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            اطلاعات شما با رمزنگاری استاندارد محافظت می‌شود
          </div>
        </div>
      </div>

      {/* ============================================
          LEFT PANEL — THE REGISTRY (signature visual)
      ============================================ */}
      <div className="hidden lg:flex lg:w-[54%] relative overflow-hidden bg-[#04241D]">
        {/* dot-grid texture */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.15]" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#8ECFAF" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* connecting asset-network graph */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 800" fill="none">
          <g stroke="#8ECFAF" strokeOpacity="0.3" strokeWidth="1">
            <line x1="120" y1="140" x2="300" y2="260" />
            <line x1="300" y1="260" x2="480" y2="180" />
            <line x1="300" y1="260" x2="220" y2="420" />
            <line x1="300" y1="260" x2="420" y2="440" />
            <line x1="220" y1="420" x2="120" y2="560" />
            <line x1="420" y1="440" x2="500" y2="600" />
            <line x1="220" y1="420" x2="420" y2="440" />
            <line x1="120" y1="560" x2="300" y2="680" />
            <line x1="500" y1="600" x2="300" y2="680" />
          </g>
          <g fill="#D4A547">
            <circle cx="120" cy="140" r="3" />
            <circle cx="480" cy="180" r="2.5" />
            <circle cx="120" cy="560" r="2.5" />
            <circle cx="500" cy="600" r="3" />
            <circle cx="300" cy="680" r="2.5" />
          </g>
          <g fill="#8ECFAF">
            <circle cx="300" cy="260" r="4" />
            <circle cx="220" cy="420" r="3.5" />
            <circle cx="420" cy="440" r="3.5" />
          </g>
        </svg>

        {/* huge faint logo watermark, off-canvas, giving scale and depth */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-[420px] h-[420px] opacity-[0.06]">
          <Image src="/logo.png" alt="" width={420} height={420} className="object-contain brightness-0 invert" />
        </div>

        <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-golden-amber/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[360px] h-[360px] bg-aqua-green/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

        {/* content */}
        <div className="relative z-10 flex flex-col justify-between w-full px-16 py-16 text-white">
          <span className="text-xs tracking-[0.3em] text-white/50 uppercase">Meta Platform · Established Registry</span>

          <div className="max-w-md">
            {/* the seal, built from the real logo */}
            <div className="relative w-28 h-28 mb-10">
              <svg viewBox="0 0 100 100" className="w-28 h-28 animate-[spin_50s_linear_infinite]">
                <defs>
                  <path id="sealCircle" d="M 50,50 m -40,0 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0" />
                </defs>
                <circle cx="50" cy="50" r="47" fill="none" stroke="#D4A547" strokeOpacity="0.4" strokeWidth="0.75" />
                <circle cx="50" cy="50" r="33" fill="none" stroke="#D4A547" strokeOpacity="0.25" strokeWidth="0.5" />
                <text fill="#D4A547" fontSize="6.6" letterSpacing="2.2">
                  <textPath href="#sealCircle" startOffset="0%">
                    · ثبت و ارزش‌گذاری رسمی دارایی نامشهود · پلتفرم متا ·
                  </textPath>
                </text>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-golden-amber/40 flex items-center justify-center shadow-[0_0_0_1px_rgba(212,165,71,0.15),0_10px_30px_rgba(0,0,0,0.35)]">
                  <Image src="/logo.png" alt="متا پلتفرم" width={30} height={30} className="object-contain brightness-0 invert" />
                </div>
              </div>
            </div>

            <h2 className="text-[36px] leading-[1.35] font-bold tracking-tight">
              دانش سازمان شما،<br />ثبت‌شده و قابل‌اتکا.
            </h2>
            <p className="text-white/60 text-sm leading-7 mt-5 max-w-sm">
              بستری برای شناسایی، غربالگری و ارزش‌گذاری دارایی‌های نامشهود؛
              جایی که سرمایه‌های پنهان سازمان به اعداد و مستندات قابل استناد تبدیل می‌شوند.
            </p>

            <div className="flex flex-wrap items-center gap-2 mt-7">
              {['امن', 'رسمی', 'قابل‌استناد'].map((tag) => (
                <span key={tag} className="text-[11px] px-3 py-1 rounded-full bg-white/8 border border-white/15 text-white/70">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-8 text-white/45 text-[11px]">
            <span>ویژه سازمان‌های بزرگ و متوسط</span>
            <span className="w-1 h-1 rounded-full bg-white/25" />
            <span>مطابق با استانداردهای ارزش‌گذاری دارایی نامشهود</span>
          </div>
        </div>
      </div>
    </div>
  );
}