'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  Tag,
  MapPin,
  Users,
  Wrench,
  BarChart2,
  Bell,
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
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'داشبورد', href: '/dashboard', icon: LayoutDashboard },
  { label: 'دارایی‌ها', href: '/dashboard/assets', icon: Package },
  { label: 'دسته‌بندی‌ها', href: '/dashboard/categories', icon: Tag },
  { label: 'مکان‌ها', href: '/dashboard/locations', icon: MapPin },
  { label: 'تخصیص‌ها', href: '/dashboard/assignments', icon: Users },
  { label: 'تعمیر و نگهداری', href: '/dashboard/maintenance', icon: Wrench },
  { label: 'گزارش‌ها', href: '/dashboard/reports', icon: BarChart2 },
  { label: 'هشدارها', href: '/dashboard/alerts', icon: Bell },
  { label: 'تنظیمات', href: '/dashboard/settings', icon: Settings },
  { label: 'راهنما', href: '/dashboard/help', icon: HelpCircle },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar side="right" dir="rtl">
      <SidebarHeader className="p-4 border-b">
        <span className="text-base font-bold text-primary">مدیریت دارایی‌ها</span>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>منو اصلی</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href)

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
