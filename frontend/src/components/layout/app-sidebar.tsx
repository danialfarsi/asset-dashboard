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
  ClipboardCheck,
  CheckCircle,
  Users,
  Building,
  BarChart3,
  ListChecks,
  Award,
  PieChart,
  Target,
  Database,
  Activity,
  ShieldCheck,
  Plus,
  List,
  Building2,
  Package,
  Layers3,
  Crown,
  Boxes,
  SlidersHorizontal,
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

/* ───────────────────────── Design tokens ───────────────────────── */
const BRAND = {
  ink: '#04241D',
  inkSoft: '#0B4A3C',
  gold: '#D9B65D',
  goldSoft: '#F2D27E',
  goldDeep: '#9B792B',
}

// ============================================================
// منوهای اصلی
// ============================================================

const getMainNavItems = (user: any) => [
  {
    label: 'داشبورد',
    href: '/dashboard',
    icon: LayoutDashboard,
    id: 'main-dashboard',
  },
]

// ============================================================
// منوهای مرحله ۱ (VIAM)
// ============================================================

const stage1Children = [
  {
    label: 'ثبت درخواست جدید',
    href: '/viam/establishment/new',
    icon: Plus,
    roles: ['super_admin', 'org_admin'],
    id: 'viam-new-request',
  },
  {
    label: 'لیست درخواست‌ها',
    href: '/viam/establishment/list',
    icon: List,
    id: 'viam-requests',
  },
  {
    label: 'برنامه‌ریزی و نقشه‌برداری',
    href: '/viam/strategic/planning',
    icon: Target,
    id: 'viam-strategic-planning',
  },
  {
    label: 'جریان‌سازی و فرهنگ‌سازی',
    href: '/viam/culture',
    icon: Share2,
    id: 'viam-culture',
  },
  {
    label: 'توانمندسازی و گواهی حرفه‌ای',
    href: '/viam/empowerment',
    icon: Award,
    id: 'viam-empowerment',
  },
  {
    label: 'عملکرد، ممیزی و بلوغ',
    href: '/viam/performance',
    icon: BarChart3,
    id: 'viam-performance',
  },
]

const stage1ChildrenOrgUser = [
  {
    label: 'واحد مجازی مدیریت دارایی‌های نامشهود',
    href: '/viam/unit-dashboard',
    icon: Package,
    id: 'unit-dashboard',
  },
]

// ============================================================
// مرحله ۲
// ============================================================

const stage2Children = [
  {
    label: 'شناسایی هوشمند دارایی‌ها',
    href: '/dashboard/intangible/discovery-wizard',
    icon: Target,
    id: 'discovery-wizard',
  },
  {
    label: 'هویت‌سنجی دارایی‌ها',
    href: '/dashboard/intangible/screening',
    icon: ClipboardCheck,
    id: 'screening',
  },
  {
    label: 'دارایی‌های غربالگری شده',
    href: '/dashboard/intangible/screening/list',
    icon: CheckCircle,
    id: 'screening-list',
  },
]

// ============================================================
// مرحله ۳
// ============================================================

const stage3Children = [
  {
    label: 'ارزیابی دارایی‌ها',
    href: '/dashboard/intangible/valuation/list',
    icon: ListChecks,
    id: 'valuation-list',
  },
  {
    label: 'دارایی‌های ارزیابی شده',
    href: '/dashboard/intangible/valuation/completed',
    icon: Award,
    id: 'valuation-completed',
  },
  {
    label: 'ارزش‌گذاری دارایی‌ها',
    href: '/dashboard/intangible/valuation/valuation',
    icon: PieChart,
    id: 'valuation-valuation',
  },
  {
    label: 'دارایی‌های ارزش‌گذاری شده',
    href: '/dashboard/intangible/valuation/registered',
    icon: Database,
    id: 'valuation-registered',
  },
]

// ============================================================
// مرحله ۴
// ============================================================

const stage4Children = [
  {
    label: 'حفاظت و امنیت دارایی‌ها',
    href: '/dashboard/intangible/protection',
    icon: Shield,
    id: 'protection',
  },
  {
    label: 'دارایی‌های حفاظت شده',
    href: '/dashboard/intangible/protected-assets',
    icon: ShieldCheck,
    id: 'protected-assets',
  },
]

// ============================================================
// مراحل ۱۰ گانه
// ============================================================

const stageNavItems = [
  {
    label: 'مرحله ۱: برنامه و نقشه راهبردی',
    href: '/dashboard/intangible/stage1',
    icon: LayoutDashboard,
    children: stage1Children,
    id: 'stage1',
  },
  {
    label: 'مرحله ۲: کشف و شناسایی',
    href: '/dashboard/intangible/stage2',
    icon: Search,
    children: stage2Children,
    id: 'stage2',
  },
  {
    label: 'مرحله ۳: ارزیابی و ارزشگذاری',
    href: '/dashboard/intangible/stage3',
    icon: BarChart3,
    children: stage3Children,
    id: 'stage3',
  },
  {
    label: 'مرحله ۴: حفاظت و امنیت',
    href: '/dashboard/intangible/protection',
    icon: Shield,
    children: stage4Children,
    id: 'stage4',
  },
  {
    label: 'مرحله ۵: توسعه و نوآوری',
    href: '/dashboard/intangible/stage5',
    icon: Lightbulb,
    id: 'stage5',
  },
  {
    label: 'مرحله ۶: تجاری سازی',
    href: '/dashboard/intangible/stage6',
    icon: Share2,
    id: 'stage6',
  },
  {
    label: 'مرحله ۷: پایش و حکمرانی',
    href: '/dashboard/intangible/stage7',
    icon: ShoppingCart,
    id: 'stage7',
  },
  {
    label: 'مرحله ۸: هم افزایی و ارتباطات',
    href: '/dashboard/intangible/stage8',
    icon: Eye,
    id: 'stage8',
  },
  {
    label: 'مرحله ۹: مدیریت و بهینه سازی',
    href: '/dashboard/intangible/stage9',
    icon: TrendingUp,
    id: 'stage9',
  },
  {
    label: 'مرحله ۱۰: تحلیل پیش بین',
    href: '/dashboard/intangible/stage10',
    icon: FileText,
    id: 'stage10',
  },
]

// ============================================================
// سیستم
// ============================================================

const settingsNavItems = [
  {
    label: 'تنظیمات',
    href: '/dashboard/settings',
    icon: Settings,
    id: 'settings',
  },
  {
    label: 'راهنما',
    href: '/dashboard/help',
    icon: HelpCircle,
    id: 'help',
  },
]

// ============================================================
// تاریخچه API
// ============================================================

const apiHistoryItem = {
  label: 'تاریخچه API',
  href: '/admin/api-dashboard',
  icon: Activity,
  id: 'api-history',
}

// ============================================================
// مدیریت
// ============================================================

const adminNavItems = [
  {
    label: 'تأیید سازمان‌ها',
    href: '/admin/organization-approvals',
    icon: Building2,
    id: 'admin-org-approvals',
    roles: ['super_admin'],
  },
  {
    label: 'تایید VIAM',
    href: '/admin/viam-approvals',
    icon: CheckCircle,
    id: 'admin-viam-approvals',
    roles: ['super_admin'],
  },
]

// ============================================================
// Component
// ============================================================

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useAuthStore()

  const [departments, setDepartments] = useState<any[]>([])
  const [companies, setCompanies] = useState<any[]>([])
  const [isStagesOpen, setIsStagesOpen] = useState(true)
  const [openStage, setOpenStage] = useState<string | null>('stage1')
  const [isDepartmentsOpen, setIsDepartmentsOpen] = useState(false)
  const [isCompaniesOpen, setIsCompaniesOpen] = useState(false)

  const role = user?.role || 'org_user'

  const isSuperAdmin = role === 'super_admin'
  const isOrgAdmin = role === 'org_admin'
  const isOrgUser = role === 'org_user'

  const orgStatus = (user as any)?.organization_status || 'active'

  const isPendingOrgAdmin = isOrgAdmin && orgStatus === 'pending'

  const [hasApprovedEstablishment, setHasApprovedEstablishment] = useState(false)

  // ============================================================
  // بررسی Establishment
  // ============================================================

  useEffect(() => {
    const checkEstablishment = async () => {
      if (isOrgAdmin) {
        try {
          const res = await api.get('/intangible/viam/establishment-requests/')
          const requests = res.data.results || []
          const hasApproved = requests.some((r: any) => r.status === 'approved')
          setHasApprovedEstablishment(hasApproved)
        } catch (err) {
          console.error('Establishment check error:', err)
        }
      }
    }

    checkEstablishment()
  }, [isOrgAdmin])

  const showFullAdminMenu = isSuperAdmin || (isOrgAdmin && hasApprovedEstablishment)
  const showLimitedAdminMenu = isOrgAdmin && !hasApprovedEstablishment

  // ============================================================
  // تشخیص مرحله فعال
  // ============================================================

  useEffect(() => {
    if (pathname.includes('/dashboard/intangible/stage1') || pathname.includes('/viam/establishment')) {
      setIsStagesOpen(true)
      setOpenStage('stage1')
    } else if (
      pathname.includes('/dashboard/intangible/stage2') ||
      pathname.includes('/dashboard/intangible/discovery-wizard') ||
      pathname.includes('/dashboard/intangible/screening')
    ) {
      setIsStagesOpen(true)
      setOpenStage('stage2')
    } else if (
      pathname.includes('/dashboard/intangible/stage3') ||
      pathname.includes('/dashboard/intangible/valuation')
    ) {
      setIsStagesOpen(true)
      setOpenStage('stage3')
    } else if (
      pathname.includes('/dashboard/intangible/protection') ||
      pathname.includes('/dashboard/intangible/protected-assets')
    ) {
      setIsStagesOpen(true)
      setOpenStage('stage4')
    }
  }, [pathname])

  // ============================================================
  // دریافت Departments / Companies
  // ============================================================

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

    if (user && (isOrgAdmin || isSuperAdmin)) {
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

  // ============================================================
  // Helpers
  // ============================================================

  const toggleStage = (stageId: string) => {
    setOpenStage((prev) => (prev === stageId ? null : stageId))
  }

  const hasPermission = (item: any): boolean => {
    if (!item.roles) return true
    return item.roles.includes(role)
  }

  // ============================================================
  // Menu Item
  // ============================================================

  const renderMenuItem = (item: any, isChild: boolean = false) => {
    const Icon = item.icon
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

    if (!hasPermission(item)) return null

    return (
      <SidebarMenuItem key={item.id || item.href} className="my-0.5">
        <SidebarMenuButton
          asChild
          isActive={isActive}
          className={`group/menu relative h-auto min-h-11 overflow-hidden rounded-xl p-0 transition-all duration-200 ${
            isActive
              ? 'bg-gradient-to-l from-[#04241D] to-[#0B4A3C] text-white shadow-md shadow-[#04241D]/15 hover:from-[#04241D] hover:to-[#0B4A3C] hover:text-white'
              : 'text-slate-600 hover:bg-[#04241D]/[0.05] hover:text-[#04241D]'
          }`}
        >
          <Link href={item.href} className="flex w-full items-center gap-3 px-3 py-2.5">
            {isActive && (
              <span className="absolute right-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-l-full bg-[#D9B65D]" />
            )}

            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'bg-white/15 text-white'
                  : 'bg-[#04241D]/[0.06] text-[#0B4A3C] group-hover/menu:bg-white group-hover/menu:shadow-sm'
              }`}
            >
              <Icon className="h-[17px] w-[17px]" />
            </div>

            <span
              className={`min-w-0 flex-1 truncate text-right text-[13.5px] leading-6 ${
                isActive ? 'font-bold text-white' : 'font-semibold text-slate-700 group-hover/menu:text-[#04241D]'
              }`}
            >
              {item.label}
            </span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  // ============================================================
  // Children
  // ============================================================

  const renderChildrenItems = (children: any[]) => (
    <div className="relative mr-5 mt-1 space-y-0.5 pr-4">
      <div className="absolute bottom-2 right-0 top-1 w-px bg-gradient-to-b from-[#0B4A3C]/25 via-[#0B4A3C]/10 to-transparent" />
      {children.map((child: any) => renderMenuItem(child, true))}
    </div>
  )

  // ============================================================
  // Section label (shared)
  // ============================================================

  const SectionLabel = ({
    icon: Icon,
    label,
    badge,
    tone = 'default',
    collapsible,
    isOpen,
    onToggle,
  }: {
    icon: any
    label: string
    badge?: string | number
    tone?: 'default' | 'gold'
    collapsible?: boolean
    isOpen?: boolean
    onToggle?: () => void
  }) => (
    <div className="flex w-full items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-lg ${
            tone === 'gold' ? 'bg-[#D9B65D]/15' : 'bg-[#04241D]/[0.07]'
          }`}
        >
          <Icon className={`h-4 w-4 ${tone === 'gold' ? 'text-[#9B792B]' : 'text-[#0B4A3C]'}`} />
        </div>
        <span className="text-[13px] font-bold text-[#04241D]">{label}</span>
        {badge !== undefined && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-[#04241D]/[0.07] px-1.5 text-[11px] font-bold text-[#0B4A3C]">
            {badge}
          </span>
        )}
      </div>

      {collapsible && (
        <button
          onClick={onToggle}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#0B4A3C] transition-colors hover:bg-[#04241D]/[0.06]"
        >
          <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-0' : 'rotate-90'}`} />
        </button>
      )}
    </div>
  )

  // ============================================================
  // Main Nav
  // ============================================================

  const renderMainNav = () => (
    <SidebarGroup className="px-1.5 pb-1 pt-2">
      <SidebarMenu>{getMainNavItems(user).map((item: any) => renderMenuItem(item))}</SidebarMenu>
    </SidebarGroup>
  )

  // ============================================================
  // Stages
  // ============================================================

  const renderStagesNav = () => {
    if (isSuperAdmin) return null
    if (!isOrgUser && !isOrgAdmin) return null

    const stagesToRender = isOrgUser
      ? stageNavItems.map((item) =>
          item.id === 'stage1' ? { ...item, children: stage1ChildrenOrgUser } : item
        )
      : showLimitedAdminMenu
      ? stageNavItems.filter((item) => item.id === 'stage1')
      : stageNavItems

    return (
      <SidebarGroup className="px-1.5 py-2">
        <SidebarGroupLabel className="mb-1.5 h-9 px-1.5">
          <SectionLabel
            icon={Layers3}
            label="چرخه مدیریت"
            collapsible
            isOpen={isStagesOpen}
            onToggle={() => setIsStagesOpen(!isStagesOpen)}
          />
        </SidebarGroupLabel>

        {isStagesOpen && (
          <SidebarMenu className="space-y-0.5">
            {stagesToRender.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const isOpen = openStage === item.id

              if (item.children) {
                return (
                  <div key={item.id || item.href} className="space-y-0.5">
                    <SidebarMenuItem>
                      <button
                        onClick={() => toggleStage(item.id)}
                        className={`group/stage relative flex min-h-11 w-full items-center justify-between rounded-xl px-3 py-2.5 text-right transition-colors duration-200 ${
                          isActive
                            ? 'bg-[#04241D]/[0.07] text-[#04241D]'
                            : 'text-slate-600 hover:bg-[#04241D]/[0.04] hover:text-[#04241D]'
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                              isActive
                                ? 'bg-[#0B4A3C] text-white shadow-sm'
                                : 'bg-[#04241D]/[0.05] text-[#0B4A3C] group-hover/stage:bg-white group-hover/stage:shadow-sm'
                            }`}
                          >
                            <Icon className="h-[17px] w-[17px]" />
                          </span>
                          <span
                            className={`truncate text-right text-[13.5px] leading-6 ${
                              isActive ? 'font-bold text-[#04241D]' : 'font-semibold text-slate-700'
                            }`}
                          >
                            {item.label}
                          </span>
                        </span>

                        <ChevronDown
                          className={`mr-2 h-4 w-4 shrink-0 transition-transform duration-300 ${
                            isOpen ? 'rotate-0' : 'rotate-90'
                          } ${isActive ? 'text-[#0B4A3C]' : 'text-slate-400'}`}
                        />
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

  // ============================================================
  // Departments
  // ============================================================

  const renderDepartmentsNav = () => {
    if (showLimitedAdminMenu) return null
    if (isOrgUser) return null
    if (!isOrgAdmin && !isSuperAdmin) return null

    const userDepts = departments.filter((dept: any) => dept.organization?.id === user?.organization_id)

    if (userDepts.length === 0) return null

    const deptNavItems = userDepts.map((dept: any) => ({
      label: dept.name,
      href: `/dashboard/departments/${dept.code}`,
      icon: Building,
      id: `dept-${dept.id}`,
    }))

    return (
      <SidebarGroup className="px-1.5 py-2">
        <SidebarGroupLabel className="mb-1.5 h-9 px-1.5">
          <SectionLabel
            icon={Boxes}
            label="واحدها"
            badge={userDepts.length.toLocaleString('fa-IR')}
            collapsible
            isOpen={isDepartmentsOpen}
            onToggle={() => setIsDepartmentsOpen(!isDepartmentsOpen)}
          />
        </SidebarGroupLabel>

        {isDepartmentsOpen && (
          <SidebarMenu>{deptNavItems.map((item: any) => renderMenuItem(item))}</SidebarMenu>
        )}
      </SidebarGroup>
    )
  }

  // ============================================================
  // Companies
  // ============================================================

  const renderCompaniesNav = () => {
    if (showLimitedAdminMenu) return null
    if (!isSuperAdmin) return null

    const companyNavItems = companies.map((org: any) => ({
      label: org.name,
      href: `/dashboard/companies/${org.code}`,
      icon: Building2,
      id: `company-${org.id}`,
    }))

    if (companyNavItems.length === 0) return null

    return (
      <SidebarGroup className="px-1.5 py-2">
        <SidebarGroupLabel className="mb-1.5 h-9 px-1.5">
          <SectionLabel
            icon={Building2}
            label="شرکت‌ها"
            badge={companyNavItems.length.toLocaleString('fa-IR')}
            collapsible
            isOpen={isCompaniesOpen}
            onToggle={() => setIsCompaniesOpen(!isCompaniesOpen)}
          />
        </SidebarGroupLabel>

        {isCompaniesOpen && (
          <SidebarMenu>{companyNavItems.map((item: any) => renderMenuItem(item))}</SidebarMenu>
        )}
      </SidebarGroup>
    )
  }

  // ============================================================
  // API History
  // ============================================================

  const renderApiHistoryNav = () => {
    if (showLimitedAdminMenu) return null
    if (!isSuperAdmin) return null

    return (
      <SidebarGroup className="px-1.5 py-1">
        <SidebarMenu>{renderMenuItem(apiHistoryItem)}</SidebarMenu>
      </SidebarGroup>
    )
  }

  // ============================================================
  // Admin
  // ============================================================

  const renderAdminNav = () => {
    if (showLimitedAdminMenu) return null
    if (!isSuperAdmin) return null

    return (
      <SidebarGroup className="px-1.5 py-2">
        <SidebarGroupLabel className="mb-1.5 h-9 px-1.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#D9B65D]/15">
              <Crown className="h-4 w-4 text-[#9B792B]" />
            </div>
            <span className="text-[13px] font-bold text-[#04241D]">مدیریت</span>
            <span className="rounded-md border border-[#D9B65D]/30 bg-[#D9B65D]/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#80621F]">
              ADMIN
            </span>
          </div>
        </SidebarGroupLabel>

        <SidebarMenu>{adminNavItems.map((item) => renderMenuItem(item))}</SidebarMenu>
      </SidebarGroup>
    )
  }

  // ============================================================
  // Settings
  // ============================================================

  const renderSettingsNav = () => (
    <SidebarGroup className="px-1.5 pb-4 pt-2">
      <SidebarGroupLabel className="mb-1.5 h-9 px-1.5">
        <SectionLabel icon={SlidersHorizontal} label="سیستم" />
      </SidebarGroupLabel>

      <SidebarMenu>{settingsNavItems.map((item) => renderMenuItem(item))}</SidebarMenu>
    </SidebarGroup>
  )

  // ============================================================
  // Render
  // ============================================================

  return (
    <Sidebar side="right" dir="rtl" className="w-80 border-l border-[#04241D]/10 bg-white">
      {/* ======================================================
          HEADER
      ====================================================== */}
      <SidebarHeader className="relative overflow-hidden border-b border-white/10 p-0">
        <div
          className="relative overflow-hidden px-5 py-6"
          style={{ background: `linear-gradient(135deg, ${BRAND.ink} 0%, ${BRAND.inkSoft} 65%, #0d5a49 100%)` }}
        >
          {/* بافت تزئینی */}
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-white/[0.06] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-[#D9B65D]/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,.5) 1px, transparent 0)', backgroundSize: '20px 20px' }}
          />

          {/* برند */}
          <Link href="/dashboard" className="relative flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-2xl bg-white/15 blur-md" />
              <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-1.5 shadow-xl backdrop-blur-sm">
                <Image src="/logo.png" alt="متا پلتفرم" width={56} height={56} className="h-full w-full object-contain" />
              </div>
              <span className="absolute -bottom-0.5 -left-0.5 flex h-4 w-4 items-center justify-center rounded-full border-[3px] border-[#04241D] bg-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              </span>
            </div>

            <div className="min-w-0 flex-1 text-right">
              <span className="block text-[21px] font-black tracking-tight text-white">مِتا</span>
              <p className="mt-1 text-[12px] font-medium leading-5 text-white/65">پلتفرم دارایی‌های نامشهود</p>
            </div>
          </Link>

          {/* نقش کاربر */}
          <div className="relative mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.07] px-3.5 py-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                {isSuperAdmin ? (
                  <Crown className="h-[18px] w-[18px]" style={{ color: BRAND.goldSoft }} />
                ) : isOrgAdmin ? (
                  <ShieldCheck className="h-[18px] w-[18px] text-white" />
                ) : (
                  <Users className="h-[18px] w-[18px] text-white" />
                )}
              </div>

              <div className="text-right">
                <p className="text-[10px] font-medium text-white/50">سطح دسترسی</p>
                <p className="mt-0.5 text-[13px] font-bold text-white">
                  {isSuperAdmin ? 'مدیر کل سیستم' : isOrgAdmin ? 'مدیر سازمان' : 'کاربر سازمان'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1">
              <span className={`h-2 w-2 rounded-full ${isPendingOrgAdmin ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              <span className="text-[10px] font-semibold text-white/70">
                {isPendingOrgAdmin ? 'در انتظار' : 'فعال'}
              </span>
            </div>
          </div>
        </div>
      </SidebarHeader>

      {/* ======================================================
          CONTENT
      ====================================================== */}
      <SidebarContent className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#04241D]/15 bg-white px-2 py-3">
        {renderMainNav()}

        <div className="mx-3.5 my-1.5 h-px bg-[#04241D]/[0.07]" />

        {renderStagesNav()}
        {renderAdminNav()}
        {renderDepartmentsNav()}
        {renderCompaniesNav()}
        {renderApiHistoryNav()}

        <div className="mx-3.5 mt-2 h-px bg-gradient-to-l from-transparent via-[#04241D]/15 to-transparent" />

        {renderSettingsNav()}
      </SidebarContent>
    </Sidebar>
  )
}
