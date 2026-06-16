'use client';

import Link from 'next/link';
import { Search, Users, Brain, List, Tag, CheckSquare, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const forms = [
  { code: 'IA-F-02-01', title: 'فرم کشف دارایی‌های نامشهود', href: '/dashboard/intangible/stage2/discovery/new', icon: Search, description: 'فرم اصلی کشف دارایی‌های دانشی، تجربی و فناورانه' },
  { code: 'FA-02-02', title: 'فرم مصاحبه با متخصصان', href: '/dashboard/intangible/stage2/expert-interview/new', icon: Users, description: 'مصاحبه با خبرگان برای کشف دانش ضمنی' },
  { code: 'FA-02-03', title: 'فرم شناسایی دانش ضمنی', href: '/dashboard/intangible/stage2/tacit-knowledge/new', icon: Brain, description: 'مستندسازی دانش پنهان در سازمان' },
  { code: 'FA-02-04', title: 'فرم فهرست دارایی‌ها', href: '/dashboard/intangible/stage2/asset-list/new', icon: List, description: 'لیست نهایی دارایی‌های کشف شده' },
  { code: 'FA-02-05', title: 'فرم طبقه‌بندی دارایی‌ها', href: '/dashboard/intangible/stage2/classification/new', icon: Tag, description: 'دسته‌بندی دارایی‌ها بر اساس نوع' },
  { code: 'FA-02-06', title: 'چک‌لیست دارایی‌های پنهان', href: '/dashboard/intangible/stage2/hidden-checklist/new', icon: CheckSquare, description: 'ارزیابی وجود دارایی‌های پنهان' },
  { code: 'FA-02-07', title: 'ارزیابی اولیه ارزش', href: '/dashboard/intangible/stage2/preliminary-evaluation/new', icon: TrendingUp, description: 'پیش‌ارزش‌گذاری دارایی‌های کشف شده' },
];

export default function Stage2Page() {
  return (
    <div dir="rtl" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">مرحله ۲: کشف و شناسایی</h1>
        <p className="text-sm text-gray-500 mt-1">فرآیند کشف دارایی‌های دانشی، تجربی و فناورانه ضمنی، پنهان یا نادیده‌گرفته شده</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {forms.map((form) => {
          const Icon = form.icon;
          return (
            <Card key={form.code} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{form.title}</CardTitle>
                    <CardDescription className="text-xs mt-1">{form.code}</CardDescription>
                  </div>
                  <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 mb-4">{form.description}</p>
                <Button asChild size="sm" className="w-full">
                  <Link href={form.href}>ثبت فرم</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
