import { Outlet } from 'react-router-dom'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { BottomNav } from '@/components/bottom-nav'
import { Separator } from '@/components/ui/separator'
import { Toaster } from '@/components/ui/sonner'
import { useKeyboardScroll } from '@/hooks/use-keyboard-scroll'

export function AppLayout() {
  useKeyboardScroll()
  return (
    <SidebarProvider>
      {/* Sidebar chỉ hiện trên desktop (lg+) */}
      <div className="hidden lg:contents">
        <AppSidebar />
      </div>
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b px-4">
          <div className="hidden lg:flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4" />
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <span className="text-xs font-bold">P</span>
            </div>
            <span className="text-sm font-semibold">PharmaPOS</span>
          </div>
        </header>
        {/* pb-16 trên mobile để tránh bị bottom nav che */}
        <main className="flex flex-1 flex-col overflow-hidden pb-16 lg:pb-0">
          <Outlet />
        </main>
      </SidebarInset>
      <BottomNav />
      <Toaster richColors position="top-right" />
    </SidebarProvider>
  )
}
