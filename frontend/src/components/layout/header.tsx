'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'

interface HeaderProps {
  userName?: string
  userRole?: string
}

export function Header({ userName = 'کاربر', userRole = 'مدیر سیستم' }: HeaderProps) {
  const router = useRouter()

  const handleLogout = () => {
    document.cookie = 'access_token=; Max-Age=0; path=/'
    router.push('/login')
  }

  return (
    <header className="flex items-center justify-between px-6 h-14 border-b bg-background">
      <SidebarTrigger />

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium leading-none">{userName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{userRole}</p>
        </div>

        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
          <LogOut className="w-4 h-4" />
          خروج
        </Button>
      </div>
    </header>
  )
}
