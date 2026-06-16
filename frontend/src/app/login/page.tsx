'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Eye, EyeOff, Check, Building2, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [form, setForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login({ email: form.username, password: form.password });
      const next = searchParams.get('next') || '/dashboard';
      router.push(next);
    } catch {
      // error is set in store
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-50">
      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          {/* Logo with Sparkles Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute -top-2 -right-2">
                <Sparkles className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              </div>
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Building2 className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">خوش آمدید</h1>
          <p className="text-gray-500 text-center text-sm mb-8">
            برای ادامه، لطفا وارد حساب کاربری خود شوید
          </p>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error === 'Login failed' ? 'نام کاربری یا رمز عبور اشتباه است' : error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نام کاربری
              </label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="نام کاربری خود را وارد کنید"
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
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all pr-10"
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
                  <div className={`w-4 h-4 rounded border ${rememberMe ? 'bg-purple-600 border-purple-600' : 'border-gray-300'} flex items-center justify-center transition-all`}>
                    {rememberMe && <Check size={10} className="text-white" />}
                  </div>
                </div>
                <span className="text-sm text-gray-600">مرا به خاطر بسپار</span>
              </label>
              <button type="button" className="text-sm text-purple-600 hover:text-purple-700">
                فراموشی رمز عبور؟
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-all duration-200 mt-6 shadow-md"
            >
              {isLoading ? 'در حال ورود...' : 'ورود به سیستم'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              حساب کاربری ندارید؟{' '}
              <button type="button" className="text-purple-600 hover:text-purple-700 font-medium">
                ثبت نام کنید
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Left side - Banner/Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 items-center justify-center p-12">
        <div className="text-center text-white">
          <div className="mb-6">
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <Building2 className="w-10 h-10" />
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-4">پلتفرم مدیریت دارایی‌های نامشهود</h2>
          <p className="text-indigo-100 text-lg max-w-md mx-auto">
            بستر تبدیل دانش پراکنده به سرمایه سازمان یافته
          </p>
          <p className="text-indigo-200 text-sm mt-6">
            ویژه سازمان‌ها و شرکت‌های بزرگ و متوسط
          </p>
        </div>
      </div>
    </div>
  );
}
