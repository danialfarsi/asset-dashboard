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
  Building2,
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

// منوی اصلی (برای همه کاربران)
const mainNavItems = [
  { label: 'داشبورد', href: '/dashboard', icon: LayoutDashboard },
  { label: 'دارایی‌های فیزیکی', href: '/dashboard/assets', icon: Package },
  { label: 'دارایی‌های کشف شده', href: '/dashboard/intangible/assets', icon: Package },
]

// منوی مراحل ۱۰ گانه (برای org_user و super_admin)
const stageNavItems = [
  { label: 'مرحله ۱: برنامه‌ریزی', href: '/dashboard/intangible/stage1', icon: LayoutDashboard },
  { 
    label: 'مرحله ۲: کشف و شناسایی', 
    href: '/dashboard/intangible/stage2', 
    icon: Search,
    children: [
      { label: 'فرم کشف دستی', href: '/dashboard/intangible/stage2/discovery/new', icon: Search },
      { label: 'هویت‌سنجی دارایی‌ها', href: '/dashboard/intangible/screening', icon: ClipboardCheck },
      { label: 'دارایی‌های غربالگری شده', href: '/dashboard/intangible/screening/list', icon: CheckCircle },
    ]
  },
  { label: 'مرحله ۳: ارزیابی', href: '/dashboard/intangible/stage3', icon: DollarSign },
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
  const [isStagesOpen, setIsStagesOpen] = useState(true)
  const [isStage2Open, setIsStage2Open] = useState(true)
  
  const role = user?.role || 'org_user'
  const isSuperAdmin = role === 'super_admin'
  const isOrgAdmin = role === 'org_admin'
  const isOrgUser = role === 'org_user'

  // org_admin: فقط واحدهای تحت مدیریت
  if (isOrgAdmin) {
    return (
      <Sidebar side="right" dir="rtl" className="w-72">
        <SidebarHeader className="p-4 border-b">
          <span className="text-base font-bold text-primary">مدیریت دارایی‌ها</span>
        </SidebarHeader>
        <SidebarContent>
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
                      <Link href={item.href} className="flex items-center gap-3 w-full">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="text-sm truncate">{item.label}</span>
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

  return (
    <Sidebar side="right" dir="rtl" className="w-72">
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
                    <Link href={item.href} className="flex items-center gap-3 w-full">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="text-sm truncate">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>

        {/* منوی مدیریت مجموعه‌ها - فقط برای super_admin */}
        {isSuperAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>مدیریت</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/dashboard/organizations'}>
                  <Link href="/dashboard/organizations" className="flex items-center gap-3 w-full">
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span className="text-sm truncate">مدیریت مجموعه‌ها</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* منوی مراحل ۱۰ گانه - برای super_admin و org_user */}
        {(isSuperAdmin || isOrgUser) && (
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
                  
                  if (item.children) {
                    return (
                      <div key={item.href} className="space-y-0">
                        <SidebarMenuItem>
                          <button
                            onClick={() => setIsStage2Open(!isStage2Open)}
                            className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg hover:bg-gray-100 ${
                              isActive ? 'bg-gray-100 font-medium' : ''
                            }`}
                          >
                            <span className="flex items-center gap-3 text-sm">
                              <Icon className="w-4 h-4 shrink-0 ml-1" />
                              <span className="truncate">{item.label}</span>
                            </span>
                            {isStage2Open ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronLeft className="w-4 h-4" />
                            )}
                          </button>
                        </SidebarMenuItem>
                        {isStage2Open && (
                          <div className="mr-6">
                            {item.children.map((child) => {
                              const ChildIcon = child.icon
                              const isChildActive = pathname === child.href || pathname.startsWith(child.href + '/')
                              return (
                                <SidebarMenuItem key={child.href}>
                                  <SidebarMenuButton asChild isActive={isChildActive} className="pr-8">
                                    <Link href={child.href} className="flex items-center gap-3 w-full">
                                      <ChildIcon className="w-4 h-4 shrink-0" />
                                      <span className="text-sm truncate">{child.label}</span>
                                    </Link>
                                  </SidebarMenuButton>
                                </SidebarMenuItem>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  }
                  
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive} className="pr-8">
                        <Link href={item.href} className="flex items-center gap-3 w-full">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="text-sm truncate">{item.label}</span>
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
                    <Link href={item.href} className="flex items-center gap-3 w-full">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="text-sm truncate">{item.label}</span>
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
