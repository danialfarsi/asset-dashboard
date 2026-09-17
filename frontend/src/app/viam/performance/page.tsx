/**
 * 📊 عملکرد، ممیزی و بلوغ
 * مرحله ۱ VIAM — بخش ۴
 */
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, ClipboardCheck, TrendingUp, Award, Target, Activity } from 'lucide-react';

export default function PerformancePage() {
  const sections = [
    {
      icon: BarChart3,
      title: 'سنجش عملکرد',
      description: 'ارزیابی عملکرد فردی و سازمانی',
      color: 'text-blue-600 bg-blue-50',
    },
    {
      icon: ClipboardCheck,
      title: 'ممیزی داخلی',
      description: 'حسابرسی و ممیزی فرآیندها',
      color: 'text-green-600 bg-green-50',
    },
    {
      icon: TrendingUp,
      title: 'سطح بلوغ سازمانی',
      description: 'سنجش بلوغ و تعالی سازمانی',
      color: 'text-amber-600 bg-amber-50',
    },
    {
      icon: Award,
      title: 'مدل‌های تعالی',
      description: 'ارزیابی بر اساس مدل‌های تعالی',
      color: 'text-purple-600 bg-purple-50',
    },
    {
      icon: Target,
      title: 'شاخص‌های کلیدی',
      description: 'KPIها و داشبوردهای عملکرد',
      color: 'text-cyan-600 bg-cyan-50',
    },
    {
      icon: Activity,
      title: 'بهبود مستمر',
      description: 'چرخه‌های بهبود و نوآوری',
      color: 'text-red-600 bg-red-50',
    },
  ];

  return (
    <div className="container mx-auto p-6 rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">عملکرد، ممیزی و بلوغ</h1>
        <p className="text-gray-600 text-sm mt-1">
          ارزیابی و پایش عملکرد سازمانی و سطح بلوغ
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((section, i) => {
          const Icon = section.icon;
          return (
            <Card key={i} className="hover:shadow-md transition cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-lg ${section.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm text-gray-800 mb-1">{section.title}</h3>
                    <p className="text-xs text-gray-600 leading-5">{section.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
