/**
 * 🎨 LoadingScreen — برای استفاده در loading.tsx
 */
'use client';

import { Building2, Search, Shield, Target, BarChart3, Lightbulb, FileText } from 'lucide-react';

interface LoadingScreenProps {
  title?: string;
  icon?: 'building' | 'search' | 'shield' | 'target' | 'chart' | 'lightbulb' | 'file';
}

const ICONS = {
  building: Building2,
  search: Search,
  shield: Shield,
  target: Target,
  chart: BarChart3,
  lightbulb: Lightbulb,
  file: FileText,
};

export function LoadingScreen({
  title = 'در حال دریافت اطلاعات',
  icon = 'building',
}: LoadingScreenProps) {
  const Icon = ICONS[icon];

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#f7f9f8] flex items-center justify-center font-vazir"
    >
      {/* Decorative background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-48 -top-48 h-[500px] w-[500px] rounded-full bg-emerald-100/30 blur-3xl" />
        <div className="absolute -left-56 top-[35%] h-[450px] w-[450px] rounded-full bg-teal-100/20 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center">
        <div className="relative">
          <div className="h-20 w-20 rounded-3xl bg-white shadow-xl shadow-emerald-900/5 border border-emerald-100 flex items-center justify-center">
            <Icon className="h-8 w-8 text-emerald-600" />
          </div>

          <div className="absolute -inset-2 rounded-[28px] border-2 border-emerald-500/20 border-t-emerald-600 animate-spin" />
        </div>

        <p className="mt-7 text-[16px] font-bold text-slate-700">
          {title}
        </p>

        <p className="mt-1 text-[13px] text-slate-400">
          لطفاً چند لحظه منتظر بمانید...
        </p>

        {/* Loading dots */}
        <div className="mt-5 flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <span
            className="h-2 w-2 rounded-full bg-emerald-500 animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    </div>
  );
}
