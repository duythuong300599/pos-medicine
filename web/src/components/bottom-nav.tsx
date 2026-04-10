import { ShoppingCart, History, Package, Settings2 } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

const navItems = [
  { title: 'Bán hàng', url: '/', icon: ShoppingCart },
  { title: 'Lịch sử', url: '/history', icon: History },
  { title: 'Kho', url: '/inventory', icon: Package },
  { title: 'Cài đặt', url: '/settings', icon: Settings2 },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background lg:hidden">
      <div className="flex h-16 items-stretch">
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center justify-center gap-1 text-xs transition-all duration-150',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn('h-5 w-5 transition-transform duration-150', isActive && 'stroke-[2.5px] scale-110')}
                />
                <span className={cn('text-[11px]', isActive && 'font-semibold')}>
                  {item.title}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
