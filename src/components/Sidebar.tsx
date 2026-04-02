'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/AuthContext'

const navItems = [
  { section: 'Main' },
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/pos', label: 'New Sale', icon: '🧾' },
  { section: 'Inventory' },
  { href: '/stock', label: 'Stock', icon: '📦' },
  { href: '/stock/add', label: 'Add Stock', icon: '➕' },
  { section: 'Finance' },
  { href: '/sales', label: 'Sales History', icon: '💰' },
  { href: '/credit', label: 'Credit / Debtors', icon: '📋' },
  { href: '/expenses', label: 'Expenses', icon: '💸' },
  { href: '/cash', label: 'Cash / Safe', icon: '🔐', superOnly: false },
  { section: 'Reports' },
  { href: '/reports/daily', label: 'Daily Summary', icon: '📅' },
  { href: '/reports/monthly', label: 'Monthly Report', icon: '📈' },
  { section: 'Admin', superOnly: true },
  { href: '/users', label: 'User Management', icon: '👥', superOnly: true },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout, isSuperAdmin } = useAuth()

  return (
    <nav className="fixed left-0 top-0 bottom-0 w-60 bg-surface border-r border-border flex flex-col z-50 no-print">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <h1 className="font-serif text-accent text-xl tracking-tight">Gorayo Wholesalers</h1>
        <p className="text-xs text-muted uppercase tracking-widest mt-1">Wholesale & Retail</p>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-3 px-3">
        {navItems.map((item, i) => {
          if ('section' in item && item.section) {
            if ((item as any).superOnly && !isSuperAdmin) return null
            return (
              <p key={i} className="text-[10px] text-muted uppercase tracking-widest px-3 pt-4 pb-1 mt-1">
                {item.section}
              </p>
            )
          }
          if ((item as any).superOnly && !isSuperAdmin) return null
          const href = (item as any).href
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 text-sm font-medium transition-all
                ${active
                  ? 'bg-accent/10 text-accent'
                  : 'text-sub hover:bg-surface2 hover:text-white'
                }`}
            >
              <span className="w-5 text-center text-base">{(item as any).icon}</span>
              {(item as any).label}
            </Link>
          )
        })}
      </div>

      {/* User + Logout */}
      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium truncate">{user?.name}</p>
            <p className="text-[10px] text-muted uppercase tracking-wider">
              {user?.role === 'super_admin' ? '⭐ Super Admin' : '👤 Staff'}
            </p>
          </div>
        </div>
        <button onClick={logout}
          className="btn btn-ghost btn-sm w-full justify-center text-muted hover:text-red">
          🚪 Sign Out
        </button>
      </div>
    </nav>
  )
}
