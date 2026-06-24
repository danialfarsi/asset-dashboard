'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { useState, useEffect } from 'react'
import api from '@/lib/api'
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
  Users,
  Building,
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

// ============ منوهای اصلی (مشترک) ============
const mainNavItems = [
  { label: 'داشبورد', href: '/dashboard', icon: LayoutDashboard },
  { label: 'دارایی‌های فیزیکی', href: '/dashboard/assets', icon: Package },
  { label: 'دارایی‌های کشف شده', href: '/dashboard/intangible/assets', icon: Package },
]

// ============ منوهای مرحله ۲ ============
const stage2Children = [
  { label: 'فرم کشف دستی', href: '/dashboard/intangible/stage2/discovery/new', icon: Search },
  { label: 'هویت‌سنجی دارایی‌ها', href: '/dashboard/intangible/screening', icon: ClipboardCheck },
  { label: 'دارایی‌های غربالگری شده', href: '/dashboard/intangible/screening/list', icon: CheckCircle },
]

// ============ منوی مراحل ۱۰ گانه ============
const stageNavItems = [
  { label: 'مرحله ۱: برنامه‌ریزی', href: '/dashboard/intangible/stage1', icon: LayoutDashboard },
  { 
    label: 'مرحله ۲: کشف و شناسایی', 
    href: '/dashboard/intangible/stage2', 
    icon: Search,
    children: stage2Children
  },
  { label: 'مرحله ۳: ارزیابی', href: '/dashboard/intangible/stage3', icon: DollarSign },
  { label: 'مرحله ۴: حفاظت و امنیت', href: '/dashboard/intangible/stage4', icon: Shield },
  { label: 'مرحله ۵: توسعه و نوآوری', href: '/dashboard/intangible/stage5', icon: Lightbulb },
  { label: 'مرحله ۶: یکپارچه‌سازی', href: '/dashboard/intangible/stage6', icon: Share2 },
  { label: 'مرحله ۷: بهره‌برداری', href: '/dashboard/intangible/stage7', icon: ShoppingCart },
  { label: 'مرحله ۸: پایش', href: '/dashboard/intangible/stage8', icon: Eye },
  { label: 'مرحله ۹: بهینه‌سازی', href: '/dashboard/intangible/stage9', icon: TrendingUp },
  { label: 'مرحله ۱۰: گزارش‌دهی', href: '/dashboard/intangible/stage10', icon: FileText },
]

// ============ منوهای تنظیمات (مشترک) ============
const settingsNavItems = [
  { label: 'تنظیمات', href: '/dashboard/settings', icon: Settings },
  { label: 'راهنما', href: '/dashboard/help', icon: HelpCircle },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const [departments, setDepartments] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  
  // ============ حالت دراپ‌داون‌ها - پیش‌فرض بسته ============
  const [isStagesOpen, setIsStagesOpen] = useState(false)      // بسته
  const [isStage2Open, setIsStage2Open] = useState(false)     // بسته
  const [isDepartmentsOpen, setIsDepartmentsOpen] = useState(false)  // بسته
  const [isCompaniesOpen, setIsCompaniesOpen] = useState(false)      // بسته
  
  const role = user?.role || 'org_user'
  const isSuperAdmin = role === 'super_admin'
  const isOrgAdmin = role === 'org_admin'
  const isOrgUser = role === 'org_user'

  // دریافت واحدها از API
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const { data } = await api.get('/auth/departments/')
        const depts = data.results || data || []
        setDepartments(depts)
      } catch (error) {
        console.error('Error fetching departments:', error)
      }
    }
    
    if (user && isOrgAdmin) {
      fetchDepartments()
    }
    
    if (user && isSuperAdmin) {
      const fetchCompanies = async () => {
        try {
          const { data } = await api.get('/auth/organizations/')
          const orgs = data.results || data || []
          setCompanies(orgs)
        } catch (error) {
          console.error('Error fetching companies:', error)
        }
      }
      fetchCompanies()
    }
  }, [user, isOrgAdmin, isSuperAdmin])

  // ============ رندر آیتم‌های منو ============
  const renderMenuItem = (item: any, isChild: boolean = false) => {
    const Icon = item.icon
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
    
    return (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton asChild isActive={isActive} className={isChild ? 'pr-8' : ''}>
          <Link href={item.href} className="flex items-center gap-3 w-full">
            <Icon className="w-4 h-4 shrink-0" />
            <span className="text-sm truncate">{item.label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  // ============ رندر منوهای اصلی ============
  const renderMainNav = () => {
    const items = isSuperAdmin 
      ? mainNavItems.filter(item => item.label === 'داشبورد')
      : mainNavItems
    
    return (
      <SidebarGroup>
        <SidebarGroupLabel>اصلی</SidebarGroupLabel>
        <SidebarMenu>
          {items.map(item => renderMenuItem(item))}
        </SidebarMenu>
      </SidebarGroup>
    )
  }

  // ============ رندر منوی مراحل ۱۰ گانه (org_user و org_admin) ============
  const renderStagesNav = () => {
    if (!isOrgUser && !isOrgAdmin) return null
    
    return (
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
                        {item.children.map((child: any) => renderMenuItem(child, true))}
                      </div>
                    )}
                  </div>
                )
              }
              
              return renderMenuItem(item)
            })}
          </SidebarMenu>
        )}
      </SidebarGroup>
    )
  }

  // ============ رندر منوی واحدها (فقط org_admin) ============
  const renderDepartmentsNav = () => {
    if (!isOrgAdmin) return null
    
    const userDepts = departments.filter(
      (dept: any) => dept.organization?.id === user?.organization_id
    )
    
    if (userDepts.length === 0) return null
    
    const deptNavItems = userDepts.map((dept: any) => ({
      label: dept.name,
      href: `/dashboard/departments/${dept.code}`,
      icon: Building,
    }))
    
    return (
      <SidebarGroup>
        <SidebarGroupLabel>
          <button
            onClick={() => setIsDepartmentsOpen(!isDepartmentsOpen)}
            className="flex items-center justify-between w-full text-right text-xs font-medium"
          >
            <span>واحدها</span>
            {isDepartmentsOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </SidebarGroupLabel>
        {isDepartmentsOpen && (
          <SidebarMenu>
            {deptNavItems.map((item: any) => renderMenuItem(item))}
          </SidebarMenu>
        )}
      </SidebarGroup>
    )
  }

  // ============ رندر منوی شرکت‌ها (فقط super_admin) ============
  const renderCompaniesNav = () => {
    if (!isSuperAdmin) return null
    
    const companyNavItems = companies.map((org: any) => ({
      label: org.name,
      href: `/dashboard/companies/${org.code}`,
      icon: Building2,
    }))
    
    if (companyNavItems.length === 0) return null
    
    return (
      <SidebarGroup>
        <SidebarGroupLabel>
          <button
            onClick={() => setIsCompaniesOpen(!isCompaniesOpen)}
            className="flex items-center justify-between w-full text-right text-xs font-medium"
          >
            <span>شرکت‌ها</span>
            {isCompaniesOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </SidebarGroupLabel>
        {isCompaniesOpen && (
          <SidebarMenu>
            {companyNavItems.map((item: any) => renderMenuItem(item))}
          </SidebarMenu>
        )}
      </SidebarGroup>
    )
  }

  // ============ رندر منوی تنظیمات (مشترک) ============
  const renderSettingsNav = () => {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>سیستم</SidebarGroupLabel>
        <SidebarMenu>
          {settingsNavItems.map(item => renderMenuItem(item))}
        </SidebarMenu>
      </SidebarGroup>
    )
  }

  // ============ رندر نهایی ============
  return (
    <Sidebar side="right" dir="rtl" className="w-72">
      <SidebarHeader className="p-4 border-b">
        <span className="text-base font-bold text-primary">مدیریت دارایی‌ها</span>
      </SidebarHeader>

      <SidebarContent>
        {renderMainNav()}
        {renderStagesNav()}
        {renderDepartmentsNav()}
        {renderCompaniesNav()}
        {renderSettingsNav()}
      </SidebarContent>
    </Sidebar>
  )
}
