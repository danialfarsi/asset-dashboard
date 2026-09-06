'use client';

import { useEffect } from 'react';
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { useAuthStore } from "@/store/auth-store";
import { QueryProvider } from "@/providers/QueryProvider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, fetchMe, isLoading } = useAuthStore();

  useEffect(() => {
    if (!user && !isLoading) {
      console.log('Fetching user info...');
      fetchMe();
    }
  }, [user, isLoading, fetchMe]);

  return (
    <QueryProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <Header />
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </QueryProvider>
  );
}
