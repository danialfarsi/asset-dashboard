'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Lightbulb, Target, FileText, Activity, CheckCircle, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// کامپوننت‌های گام‌ها
import { GapAnalysisPanel } from '@/components/engine05/GapAnalysisPanel';
import { PrioritizationPanel } from '@/components/engine05/PrioritizationPanel';
import { PlanningPanel } from '@/components/engine05/PlanningPanel';
import { ExecutionPanel } from '@/components/engine05/ExecutionPanel';
import { CompletionPanel } from '@/components/engine05/CompletionPanel';

type Tab = 'gap' | 'prioritization' | 'planning' | 'execution' | 'completion';

const TABS = [
  { key: 'gap', label: 'گام ۱: تحلیل شکاف', icon: Target, color: 'text-blue-600' },
  { key: 'prioritization', label: 'گام ۲: اولویت‌بندی', icon: BarChart3, color: 'text-purple-600' },
  { key: 'planning', label: 'گام ۳: برنامه‌ریزی', icon: FileText, color: 'text-teal-600' },
  { key: 'execution', label: 'گام ۴: اجرا و پایش', icon: Activity, color: 'text-amber-600' },
  { key: 'completion', label: 'گام ۵: تکمیل', icon: CheckCircle, color: 'text-green-600' },
];

export default function Stage5Page() {
  const [activeTab, setActiveTab] = useState<Tab>('gap');

  return (
    <div className="container mx-auto p-6 rtl max-w-7xl">
      {/* دکمه بازگشت */}
      <div className="mb-4">
        <Link href="/dashboard">
          <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#04241D] transition group">
            <ArrowRight className="w-4 h-4 group-hover:-translate-x-1 transition" />
            <span>بازگشت به داشبورد</span>
          </button>
        </Link>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-l from-[#04241D] to-[#0B3D30] rounded-2xl shadow-xl p-6 mb-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/60 text-xs mb-1">مرحله ۵ چرخه مدیریت دارایی‌های نامشهود</p>
            <h1 className="text-2xl font-bold mb-2 flex items-center gap-3">
              <Lightbulb className="w-7 h-7 text-yellow-400" />
              توسعه و نوآوری
            </h1>
            <p className="text-white/80 text-sm">
              ارتقای دارایی‌های نامشهود موجود و خلق دارایی‌های جدید
            </p>
          </div>
          <div className="text-4xl">🚀</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as Tab)}
                className={`
                  flex items-center gap-2 px-5 py-4 text-sm font-medium transition-all
                  whitespace-nowrap border-b-2
                  ${isActive 
                    ? 'border-[#04241D] text-[#04241D] bg-gray-50' 
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? tab.color : 'text-gray-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === 'gap' && <GapAnalysisPanel />}
          {activeTab === 'prioritization' && <PrioritizationPanel />}
          {activeTab === 'planning' && <PlanningPanel />}
          {activeTab === 'execution' && <ExecutionPanel />}
          {activeTab === 'completion' && <CompletionPanel />}
        </div>
      </div>
    </div>
  );
}
