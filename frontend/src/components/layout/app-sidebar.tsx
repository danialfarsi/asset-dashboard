'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { useState } from 'react'
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
  ChevronDown,
  ChevronLeft,
  ClipboardCheck,
  CheckCircle,
  FileCheck,
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

// منوی اصلی
const mainNavItems = [
  { label: 'داشبورد', href: '/dashboard', icon: LayoutDashboard },
  { label: 'دارایی‌های فیزیکی', href: '/dashboard/assets', icon: Package },
  { label: 'دارایی‌های کشف شده', href: '/dashboard/intangible/assets', icon: Package },
]

// منوی هویت سنجی
const identityNavItems = [
  { label: 'دارایی‌های هویت‌سنجی شده', href: '/dashboard/intangible/verified', icon: CheckCircle },
  { label: 'فرم هویت‌سنجی', href: '/dashboard/intangible/identity-form', icon: FileCheck },
]

// منوی مراحل ۱۰ گانه
const stageNavItems = [
  { label: 'مرحله ۱: برنامه‌ریزی', href: '/dashboard/intangible/stage1', icon: LayoutDashboard },
  { label: 'مرحله ۲: کشف و شناسایی', href: '/dashboard/intangible/stage2', icon: Search },
  { label: 'مرحله ۳: ارزیابی و ارزش‌گذاری', href: '/dashboard/intangible/stage3', icon: DollarSign },
  { label: 'مرحله ۴: حفاظت و امنیت', href: '/dashboard/intangible/stage4', icon: Shield },
  { label: 'مرحله ۵: توسعه و نوآوری', href: '/dashboard/intangible/stage5', icon: Lightbulb },
  { label: 'مرحله ۶: یکپارچه‌سازی', href: '/dashboard/intangible/stage6', icon: Share2 },
  { label: 'مرحله ۷: بهره‌برداری و تجاری‌سازی', href: '/dashboard/intangible/stage7', icon: ShoppingCart },
  { label: 'مرحله ۸: پایش و به‌روزرسانی', href: '/dashboard/intangible/stage8', icon: Eye },
  { label: 'مرحله ۹: بهینه‌سازی و ارتقا', href: '/dashboard/intangible/stage9', icon: TrendingUp },
  { label: 'مرحله ۱۰: گزارش‌دهی', href: '/dashboard/intangible/stage10', icon: FileText },
]

// منوی تنظیمات
const settingsNavItems = [
  { label: 'تنظیمات', href: '/dashboard/settings', icon: Settings },
  { label: 'راهنما', href: '/dashboard/help', icon: HelpCircle },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const [isIdentityOpen, setIsIdentityOpen] = useState(true)
  const [isStagesOpen, setIsStagesOpen] = useState(true)
  
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
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>

        {/* منوی هویت سنجی */}
        {canSeeAllStages && (
          <SidebarGroup>
            <SidebarGroupLabel>
              <button
                onClick={() => setIsIdentityOpen(!isIdentityOpen)}
                className="flex items-center justify-between w-full text-right text-xs font-medium"
              >
                <span>هویت‌سنجی دارایی‌های نامشهود</span>
                {isIdentityOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            </SidebarGroupLabel>
            {isIdentityOpen && (
              <SidebarMenu>
                {identityNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive} className="pr-8">
                        <Link href={item.href} className="flex items-center gap-3">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="text-xs">{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            )}
          </SidebarGroup>
        )}

        {/* منوی مراحل ۱۰ گانه */}
        {canSeeAllStages && (
          <SidebarGroup>
            <SidebarGroupLabel>
              <button
                onClick={() => setIsStagesOpen(!isStagesOpen)}
                className="flex items-center justify-between w-full text-right text-xs font-medium"
              >
                <span>چرخه مدیریت دارایی‌های نامشهود</span>
                {isStagesOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            </SidebarGroupLabel>
            {isStagesOpen && (
              <SidebarMenu>
                {stageNavItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive} className="pr-8">
                        <Link href={item.href} className="flex items-center gap-3">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="text-xs">{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            )}
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
                      <span className="text-sm">{item.label}</span>
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
