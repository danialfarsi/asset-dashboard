'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  children?: NavItem[]
}

// منوی اصلی
const MAIN_MENU: NavItem[] = [
  { label: 'داشبورد', href: '/dashboard' },
  { label: 'دارایی‌های فیزیکی', href: '/dashboard/assets' },
  { label: 'دارایی‌های کشف شده', href: '/dashboard/intangible/assets' },
]

// منوی مراحل ۱۰ گانه
const STAGES: NavItem[] = [
  { label: 'مرحله ۱: برنامه‌ریزی', href: '/dashboard/stage/1' },
  { 
    label: 'مرحله ۲: کشف و شناسایی', 
    href: '/dashboard/stage/2',
    children: [
      { label: 'فرم کشف دستی', href: '/dashboard/intangible/stage2/discovery/new' },
      { label: 'غربالگری', href: '/dashboard/intangible/screening' },
      { label: 'دارایی‌های غربالگری شده', href: '/dashboard/intangible/screening/list' },
      { label: 'موتور شناسایی', href: '/dashboard/intangible/discovery-wizard' },
    ]
  },
  { label: 'مرحله ۳: ارزیابی کیفی', href: '/dashboard/intangible/evaluation/list' },
  { label: 'مرحله ۴: ارزش‌گذاری مالی', href: '/dashboard/intangible/valuation/valuation' },
  { label: 'مرحله ۵: حفاظت و امنیت', href: '/dashboard/stage/5' },
  { label: 'مرحله ۶: یکپارچه‌سازی', href: '/dashboard/stage/6' },
  { label: 'مرحله ۷: بهره‌برداری', href: '/dashboard/stage/7' },
  { label: 'مرحله ۸: پایش', href: '/dashboard/stage/8' },
  { label: 'مرحله ۹: بهینه‌سازی', href: '/dashboard/stage/9' },
  { label: 'مرحله ۱۰: گزارش‌دهی', href: '/dashboard/stage/10' },
]

// منوی سیستم
const SYSTEM_MENU: NavItem[] = [
  { label: 'تنظیمات', href: '/dashboard/settings' },
  { label: 'راهنما', href: '/dashboard/help' },
]

// منوی مدیریت (فقط ادمین)
const ADMIN_MENU: NavItem[] = [
  { label: 'مدیریت سازمان‌ها', href: '/dashboard/organizations' },
  { label: 'مدیریت کاربران', href: '/dashboard/users' },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const role = user?.role || 'org_user'

  // تشخیص نقش‌ها
  const isSuperAdmin = role === 'super_admin'
  const isOrgAdmin = role === 'org_admin'
  const isOrgUser = role === 'org_user'

  // اگر org_admin باشد، فقط تنظیمات را نشان بده
  if (isOrgAdmin) {
    return (
      <aside className="w-64 h-screen bg-white border-l border-gray-200 flex-shrink-0 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-lg font-bold text-[#015345]">مدیریت دارایی‌ها</h1>
        </div>
        <nav className="p-3">
          <p className="text-xs text-gray-400 uppercase tracking-wider px-3 mb-2">سیستم</p>
          {SYSTEM_MENU.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>
      </aside>
    )
  }

  return (
    <aside className="w-64 h-screen bg-white border-l border-gray-200 flex-shrink-0 overflow-y-auto">
      {/* هدر */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-lg font-bold text-[#015345]">مدیریت دارایی‌ها</h1>
        <p className="text-xs text-gray-400 mt-0.5">متا پلتفرم</p>
      </div>

      <nav className="p-3 space-y-6">
        {/* بخش اصلی */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider px-3 mb-2">اصلی</p>
          {MAIN_MENU.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>

        {/* بخش مدیریت (فقط super_admin) */}
        {isSuperAdmin && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider px-3 mb-2">مدیریت</p>
            {ADMIN_MENU.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        )}

        {/* بخش چرخه مدیریت (super_admin و org_user) */}
        {(isSuperAdmin || isOrgUser) && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider px-3 mb-2">
              چرخه مدیریت دارایی‌های نامشهود
            </p>
            {STAGES.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        )}

        {/* بخش سیستم */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider px-3 mb-2">سیستم</p>
          {SYSTEM_MENU.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
      </nav>
    </aside>
  )
}

// کامپوننت لینک ناوبری
function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
  const hasChildren = item.children && item.children.length > 0

  return (
    <div className="mb-0.5">
      <Link
        href={item.href}
        className={cn(
          'block px-3 py-2 rounded-md text-sm transition-all duration-150',
          'hover:bg-gray-100',
          isActive
            ? 'bg-[#015345] text-white hover:bg-[#015345]/90'
            : 'text-gray-700 hover:text-gray-900'
        )}
      >
        {item.label}
      </Link>

      {/* زیرمنوها */}
      {hasChildren && isActive && (
        <div className="mr-4 mt-0.5 space-y-0.5 border-r-2 border-[#015345]/20 pr-3">
          {item.children!.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              className={cn(
                'block px-3 py-1.5 rounded-md text-sm transition-all duration-150',
                'hover:bg-gray-100',
                pathname === child.href
                  ? 'bg-[#015345] text-white hover:bg-[#015345]/90'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}