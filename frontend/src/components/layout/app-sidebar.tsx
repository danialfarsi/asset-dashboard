'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'

import {
  LayoutDashboard,
  Package,
  Search,
  DollarSign,
  Shield,
  Lightbulb,
  Share2,
  ShoppingCart,
  Eye,
  TrendingUp,
  FileText,
  Settings,
  HelpCircle,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar'

const mainNavItems = [
  { label: 'داشبورد', href: '/dashboard', icon: LayoutDashboard },
  { label: 'دارایی‌های فیزیکی', href: '/dashboard/assets', icon: Package },
 { label: 'دارایی‌های کشف شده', href: '/dashboard/intangible/assets', icon: Package },

]

const stageNavItems = [
  { label: 'مرحله ۱: برنامه‌ریزی و نقشه‌برداری', href: '/dashboard/intangible/stage1', icon: LayoutDashboard },
  { label: 'مرحله ۲: کشف و شناسایی', href: '/dashboard/intangible/stage2', icon: Search },
  { label: 'مرحله ۳: ارزیابی و ارزش‌گذاری', href: '/dashboard/intangible/stage3', icon: DollarSign },
  { label: 'مرحله ۴: حفاظت و امنیت', href: '/dashboard/intangible/stage4', icon: Shield },
  { label: 'مرحله ۵: توسعه و نوآوری', href: '/dashboard/intangible/stage5', icon: Lightbulb },
  { label: 'مرحله ۶: یکپارچه‌سازی و هم‌افزایی', href: '/dashboard/intangible/stage6', icon: Share2 },
  { label: 'مرحله ۷: بهره‌برداری و تجاری‌سازی', href: '/dashboard/intangible/stage7', icon: ShoppingCart },
  { label: 'مرحله ۸: پایش و به‌روزرسانی', href: '/dashboard/intangible/stage8', icon: Eye },
  { label: 'مرحله ۹: بهینه‌سازی و ارتقا', href: '/dashboard/intangible/stage9', icon: TrendingUp },
  { label: 'مرحله ۱۰: گزارش‌دهی و تصمیم‌گیری', href: '/dashboard/intangible/stage10', icon: FileText },
]

const settingsNavItems = [
  { label: 'تنظیمات', href: '/dashboard/settings', icon: Settings },
  { label: 'راهنما', href: '/dashboard/help', icon: HelpCircle },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useAuthStore()
  
  const role = user?.role || 'org_user'
  const canSeeAllStages = role === 'super_admin' || role === 'org_admin'

  return (
    <Sidebar side="right" dir="rtl">
      <SidebarHeader className="p-4 border-b">
        <span className="text-base font-bold text-primary">مدیریت دارایی‌ها</span>
      </SidebarHeader>

      <SidebarContent>
        {/* منوی اصلی */}
        <SidebarGroup>
          <SidebarGroupLabel>اصلی</SidebarGroupLabel>
          <SidebarMenu>
            {mainNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive}>
                    <Link href={item.href} className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>

        {/* منوی مراحل ۱۰ گانه */}
        {canSeeAllStages && (
          <SidebarGroup>
            <SidebarGroupLabel>چرخه مدیریت دارایی‌های نامشهود</SidebarGroupLabel>
            <SidebarMenu>
              {stageNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href} className="flex items-center gap-3">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* تنظیمات */}
        <SidebarGroup>
          <SidebarGroupLabel>سیستم</SidebarGroupLabel>
          <SidebarMenu>
            {settingsNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive}>
                    <Link href={item.href} className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}