'use client'

import {useEffect} from 'react'
import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {LogOut, X} from 'lucide-react'
import {cn} from '@/lib/utils'
import {navGroupsByRole, roleLabels, type NavGroup} from '@/config/navigation'
import {useLocalStorageValue} from '@/lib/use-local-storage'

import Image from 'next/image'
import type {UserRole} from '@/components/shared/mock-data'

// ─── Sidebar Content (shared antara desktop fixed sidebar & mobile drawer) ──
function SidebarContent({role, onClose}: {role: UserRole; onClose?: () => void}) {
  const pathname = usePathname()
  const groups = navGroupsByRole[role] || navGroupsByRole.OPERATOR_LAPANGAN
  const storedName = useLocalStorageValue("userNama")
  const legacyName = useLocalStorageValue("userName")
  const userName = storedName || legacyName

  return (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-200 shrink-0">
        <div className="w-10 h-10 rounded-lg  flex items-center justify-center">
          {/* <LifeBuoy className="h-6 w-6 text-white" /> */}
          {/* public\logo-transparant.png */}
          <Image src="/logo-transparant.png" alt="Logo" width={40} height={40} />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-slate-800 truncate">Siap SAR</h1>
          <p className="text-xs text-slate-500 truncate">Kantor P3KB Mamuju</p>
        </div>
        {/* Close button — mobile only */}
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors md:hidden"
            aria-label="Tutup menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {groups.map((group: NavGroup) => (
          <div key={group.title} className="mb-5">
            <p className="px-3 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/operator' &&
                    item.href !== '/bmn' &&
                    item.href !== '/pimpinan' &&
                    item.href !== '/admin' &&
                    pathname.startsWith(item.href + '/')) ||
                  (item.href === '/operator' && pathname === '/operator') ||
                  (item.href === '/bmn' && pathname === '/bmn') ||
                  (item.href === '/pimpinan' && pathname === '/pimpinan') ||
                  (item.href === '/admin' && pathname === '/admin')

                const Icon = item.icon

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary-light text-primary'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800',
                      )}
                    >
                      <span className={cn(isActive ? 'text-primary' : 'text-slate-400')}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span className="min-w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center px-1.5">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer — User Info & Logout */}
      <div className="p-3 border-t border-slate-200 shrink-0">
        {/* User info */}
        <div className="md:hidden mb-2 px-3 py-2 rounded-lg bg-slate-50">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Masuk sebagai
          </p>
          <p className="text-xs font-semibold text-slate-700 truncate">
            {userName || "User"}
          </p>
          <p className="text-[11px] text-slate-500">
            {roleLabels[role] || role}
          </p>
        </div>
        {/* Logout */}
        <Link
          href="/login"
          onClick={() => {
            localStorage.removeItem('userRole')
            localStorage.removeItem('userNama')
            localStorage.removeItem('userName')
          }}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-5 w-5 text-slate-400" />
          <span>Keluar</span>
        </Link>
      </div>
    </>
  )
}

// ─── Exported Sidebar ───────────────────────────────────────────────────────
// Desktop: fixed sidebar kiri  |  Mobile: drawer overlay via `open` prop
// Per-role: menerima prop `role` untuk menfilter navigasi
export function Sidebar({
  open,
  onClose,
  role,
}: {
  open?: boolean
  onClose?: () => void
  role?: UserRole
}) {
  // Use provided role, or read from localStorage, or default to OPERATOR_LAPANGAN
  const effectiveRole: UserRole =
    role ||
    (typeof localStorage !== 'undefined' ? (localStorage.getItem('userRole') as UserRole) : null) ||
    'OPERATOR_LAPANGAN'

  // Lock body scroll saat drawer mobile terbuka
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      {/* ── Desktop sidebar (always visible ≥ md) ── */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-slate-200 z-30">
        <SidebarContent role={effectiveRole} />
      </aside>

      {/* ── Mobile drawer overlay (< md) ── */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden" onClick={onClose} />
          {/* Drawer */}
          <aside className="fixed inset-y-0 left-0 w-72 bg-white z-50 flex flex-col shadow-xl md:hidden animate-slide-in">
            <SidebarContent role={effectiveRole} onClose={onClose} />
          </aside>
        </>
      )}
    </>
  )
}
