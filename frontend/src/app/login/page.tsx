'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Eye, EyeOff, Check, Building2, Sparkles } from 'lucide-react';
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
    <div className="min-h-screen flex bg-gradient-to-br from-dark-green/10 via-aqua-green/10 to-golden-amber/5">
      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border-t-4 border-dark-green">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 relative">
                <Image
                  src="/logo.png"
                  alt="متا پلتفرم"
                  width={96}
                  height={96}
                  className="object-contain"
                />
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-dark-green text-center mb-2">خوش آمدید</h1>
          <p className="text-gray-500 text-center text-sm mb-8">
            برای ادامه، لطفا وارد حساب کاربری خود شوید
          </p>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error === 'Login failed' ? 'ایمیل یا رمز عبور اشتباه است' : error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ایمیل
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-dark-green focus:border-transparent transition-all"
                placeholder="ایمیل خود را وارد کنید"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                رمز عبور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-dark-green focus:border-transparent transition-all pr-10"
                  placeholder="رمز عبور خود را وارد کنید"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded border ${rememberMe ? 'bg-dark-green border-dark-green' : 'border-gray-300'} flex items-center justify-center transition-all`}>
                    {rememberMe && <Check size={10} className="text-white" />}
                  </div>
                </div>
                <span className="text-sm text-gray-600">مرا به خاطر بسپار</span>
              </label>
              <button type="button" className="text-sm text-dark-green hover:text-medium-green">
                فراموشی رمز عبور؟
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-dark-green to-medium-green hover:from-dark-green hover:to-medium-green disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-all duration-200 mt-6 shadow-md hover:shadow-lg"
            >
              {isLoading ? 'در حال ورود...' : 'ورود به سیستم'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              حساب کاربری ندارید؟{' '}
              <button type="button" className="text-dark-green hover:text-medium-green font-medium">
                ثبت نام کنید
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Left side - Banner/Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-dark-green to-medium-green items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full"></div>
        
        <div className="text-center text-white relative z-10">
          <div className="mb-6">
            <div className="w-32 h-32 mx-auto mb-4 relative">
              <Image
                src="/logo.png"
                alt="متا پلتفرم"
                width={128}
                height={128}
                className="object-contain brightness-0 invert"
              />
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-4">پلتفرم مدیریت دارایی‌های نامشهود</h2>
          <p className="text-white/80 text-lg max-w-md mx-auto">
            بستر تبدیل دانش پراکنده به سرمایه سازمان یافته
          </p>
          <p className="text-white/60 text-sm mt-6">
            ویژه سازمان‌ها و شرکت‌های بزرگ و متوسط
          </p>
        </div>
      </div>
    </div>
  );
}
