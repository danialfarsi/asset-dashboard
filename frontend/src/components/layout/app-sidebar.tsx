'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { useState, useEffect } from 'react'
import api from '@/lib/api'
import {
  LayoutDashboard,
  Search,
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
  BarChart3,
  ListChecks,
  Award,
  PieChart,
  Target,
  Sparkles,
  Database
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
import Image from 'next/image'

// ============ منوهای اصلی ============
const mainNavItems = [
  { label: 'داشبورد', href: '/dashboard', icon: LayoutDashboard },
]

// ============ منوهای مرحله ۱ ============
const stage1Children = [
  { label: 'برنامه‌ریزی استراتژیک', href: '/dashboard/intangible/stage1/planning', icon: Target },
  { label: 'شناسایی نیازها', href: '/dashboard/intangible/stage1/needs', icon: Sparkles },
  { label: 'تدوین چشم‌انداز', href: '/dashboard/intangible/stage1/vision', icon: Eye },
]

// ============ منوهای مرحله ۲ ============
const stage2Children = [
  { label: 'شناسایی هوشمند دارایی‌ها', href: '/dashboard/intangible/discovery-wizard', icon: Target },
  { label: 'هویت‌سنجی دارایی‌ها', href: '/dashboard/intangible/screening', icon: ClipboardCheck },
  { label: 'دارایی‌های غربالگری شده', href: '/dashboard/intangible/screening/list', icon: CheckCircle },
]

// ============ منوی مرحله ۳ ============
const stage3Children = [
  { label: 'ارزیابی دارایی‌ها', href: '/dashboard/intangible/valuation/list', icon: ListChecks },
  { label: 'دارایی‌های ارزیابی شده', href: '/dashboard/intangible/valuation/completed', icon: Award },
  { label: 'ارزش‌گذاری دارایی‌ها', href: '/dashboard/intangible/valuation/valuation', icon: PieChart },
  {
  label: "دارایی‌های ارزش‌گذاری شده",
  href: "/dashboard/intangible/valuation/registered",
  icon: Database,
}
]

// ============ منوی مراحل ۱۰ گانه ============
const stageNavItems = [
  { 
    label: 'مرحله ۱: برنامه و نقشه راهبردی', 
    href: '/dashboard/intangible/stage1', 
    icon: LayoutDashboard,
    children: stage1Children,
    id: 'stage1'
  },
  { 
    label: 'مرحله ۲: کشف و شناسایی', 
    href: '/dashboard/intangible/stage2', 
    icon: Search,
    children: stage2Children,
    id: 'stage2'
  },
  { 
    label: 'مرحله ۳: ارزیابی و ارزشگذاری', 
    href: '/dashboard/intangible/stage3', 
    icon: BarChart3,
    children: stage3Children,
    id: 'stage3'
  },
  { label: 'مرحله ۴: حفاظت و امنیت', href: '/dashboard/intangible/stage4', icon: Shield },
  { label: 'مرحله ۵: توسعه و نوآوری', href: '/dashboard/intangible/stage5', icon: Lightbulb },
  { label: 'مرحله ۶: تجاری سازی', href: '/dashboard/intangible/stage6', icon: Share2 },
  { label: 'مرحله ۷: پایش و حکمرانی', href: '/dashboard/intangible/stage7', icon: ShoppingCart },
  { label: 'مرحله ۸: هم افزایی و ارتباطات', href: '/dashboard/intangible/stage8', icon: Eye },
  { label: 'مرحله ۹: مدیریت و بهینه سازی', href: '/dashboard/intangible/stage9', icon: TrendingUp },
  { label: 'مرحله ۱۰: تحلیل پیش بین', href: '/dashboard/intangible/stage10', icon: FileText },
]

// ============ منوهای سیستم ============
const settingsNavItems = [
  { label: 'تنظیمات', href: '/dashboard/settings', icon: Settings },
  { label: 'راهنما', href: '/dashboard/help', icon: HelpCircle },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const [departments, setDepartments] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [isStagesOpen, setIsStagesOpen] = useState(true)
  const [openStage, setOpenStage] = useState<string | null>(null)
  const [isDepartmentsOpen, setIsDepartmentsOpen] = useState(false)
  const [isCompaniesOpen, setIsCompaniesOpen] = useState(false)
  
  const role = user?.role || 'org_user'
  const isSuperAdmin = role === 'super_admin'
  const isOrgAdmin = role === 'org_admin'
  const isOrgUser = role === 'org_user'

  useEffect(() => {
    if (pathname.includes('/dashboard/intangible/stage1')) {
      setIsStagesOpen(true)
      setOpenStage('stage1')
    } else if (pathname.includes('/dashboard/intangible/stage2') || 
               pathname.includes('/dashboard/intangible/discovery-wizard') ||
               pathname.includes('/dashboard/intangible/screening')) {
      setIsStagesOpen(true)
      setOpenStage('stage2')
    } else if (pathname.includes('/dashboard/intangible/stage3') || 
               pathname.includes('/dashboard/intangible/valuation')) {
      setIsStagesOpen(true)
      setOpenStage('stage3')
    } else {
      setOpenStage(null)
    }
  }, [pathname])

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

  const toggleStage = (stageId: string) => {
    if (openStage === stageId) {
      setOpenStage(null)
    } else {
      setOpenStage(stageId)
    }
  }

  const renderMenuItem = (item: any, isChild: boolean = false) => {
    const Icon = item.icon
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
    
    return (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton asChild isActive={isActive} className={isChild ? 'pr-6' : ''}>
          <Link href={item.href} className="flex items-center gap-3 w-full">
            {/* 🔥 آیکون همیشه خاکستری */}
            <Icon className="w-4 h-4 shrink-0 text-gray-500" />
            {/* 🔥 متن همیشه مشکی پررنگ */}
            <span className={`text-sm ${isActive ? 'font-semibold' : 'font-normal'} text-gray-800`}>
              {item.label}
            </span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  const renderChildrenItems = (children: any[]) => {
    return (
      <div className="mr-4 border-r-2 border-gray-200 pr-3 space-y-0">
        {children.map((child: any) => renderMenuItem(child, true))}
      </div>
    )
  }

  const renderMainNav = () => {
    return (
      <SidebarGroup>
        <SidebarMenu>
          {mainNavItems.map(item => renderMenuItem(item))}
        </SidebarMenu>
      </SidebarGroup>
    )
  }

  const renderStagesNav = () => {
    if (!isOrgUser && !isOrgAdmin) return null
    
    return (
      <SidebarGroup>
        <SidebarGroupLabel className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600">چرخه مدیریت</span>
          <button
            onClick={() => setIsStagesOpen(!isStagesOpen)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {isStagesOpen ? (
              <ChevronDown className="w-3 h-3 text-gray-400" />
            ) : (
              <ChevronLeft className="w-3 h-3 text-gray-400" />
            )}
          </button>
        </SidebarGroupLabel>
        {isStagesOpen && (
          <SidebarMenu>
            {stageNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const isOpen = openStage === item.id
              
              if (item.children) {
                return (
                  <div key={item.href} className="space-y-0">
                    <SidebarMenuItem>
                      <button
                        onClick={() => toggleStage(item.id)}
                        className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg transition-all ${
                          isActive ? 'bg-dark-green/10' : 'hover:bg-gray-50'
                        }`}
                      >
                        <span className="flex items-center gap-3 text-sm">
                          {/* 🔥 آیکون همیشه خاکستری */}
                          <Icon className="w-4 h-4 shrink-0 text-gray-500" />
                          {/* 🔥 متن همیشه مشکی پررنگ */}
                          <span className={`text-sm ${isActive ? 'font-semibold' : 'font-normal'} text-gray-800`}>
                            {item.label}
                          </span>
                        </span>
                        {isOpen ? (
                          <ChevronDown className="w-3 h-3 text-gray-500" />
                        ) : (
                          <ChevronLeft className="w-3 h-3 text-gray-400" />
                        )}
                      </button>
                    </SidebarMenuItem>
                    {isOpen && renderChildrenItems(item.children)}
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
        <SidebarGroupLabel className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600">واحدها</span>
          <button
            onClick={() => setIsDepartmentsOpen(!isDepartmentsOpen)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {isDepartmentsOpen ? (
              <ChevronDown className="w-3 h-3 text-gray-400" />
            ) : (
              <ChevronLeft className="w-3 h-3 text-gray-400" />
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
        <SidebarGroupLabel className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600">شرکت‌ها</span>
          <button
            onClick={() => setIsCompaniesOpen(!isCompaniesOpen)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {isCompaniesOpen ? (
              <ChevronDown className="w-3 h-3 text-gray-400" />
            ) : (
              <ChevronLeft className="w-3 h-3 text-gray-400" />
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

  const renderSettingsNav = () => {
    return (
      <SidebarGroup>
        <SidebarGroupLabel className="text-xs font-medium text-gray-600">سیستم</SidebarGroupLabel>
        <SidebarMenu>
          {settingsNavItems.map(item => renderMenuItem(item))}
        </SidebarMenu>
      </SidebarGroup>
    )
  }

  return (
    <Sidebar side="right" dir="rtl" className="w-72 border-l border-gray-100">
      {/* ===== HEADER ===== */}
      <SidebarHeader className="p-5 border-b border-gray-100 bg-gradient-to-br from-dark-green to-medium-green">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-white/20 rounded-xl blur-sm" />
            <Image 
              src="/logo.png"
              alt="متا پلتفرم"
              width={48}
              height={48}
              className="relative rounded-xl object-contain border border-white/20"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-white tracking-tight">مِتا</span>
            <span className="text-[10px] text-white/70 tracking-wide">پلتفرم دارایی‌های نامشهود</span>
          </div>
        </Link>
      </SidebarHeader>

      {/* ===== CONTENT ===== */}
      <SidebarContent className="px-3 py-4">
        {renderMainNav()}
        {renderStagesNav()}
        {renderDepartmentsNav()}
        {renderCompaniesNav()}
        {renderSettingsNav()}
      </SidebarContent>
    </Sidebar>
  )
}