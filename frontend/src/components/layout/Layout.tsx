import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Home, Truck, Wrench, ClipboardCheck, Fuel, AlertTriangle,
  Users, BriefcaseMedical, Menu, X, Settings, LogOut, UserCircle,
} from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useAppStore } from '@/store/useAppStore'
import GlobalSearch from '@/components/layout/GlobalSearch'

interface LayoutProps { children: React.ReactNode }

const NAV_ITEMS = [
  { name: 'Tableau de bord', href: '/dashboard',  icon: Home,              module: 'dashboard'   },
  { name: 'Vehicules',       href: '/vehicles',   icon: Truck,             module: 'vehicles'    },
  { name: 'Maintenance',     href: '/maintenance', icon: Wrench,           module: 'maintenance' },
  { name: 'Conformite',      href: '/compliance',  icon: ClipboardCheck,   module: 'compliance'  },
  { name: 'Incidents',       href: '/incidents',   icon: AlertTriangle,    module: 'incidents'   },
  { name: 'Conducteurs',     href: '/drivers',     icon: Users,            module: 'drivers'     },
  { name: 'Carburant',       href: '/fuel',        icon: Fuel,             module: 'fuel'        },
  { name: 'Equipements',     href: '/equipment',   icon: BriefcaseMedical, module: 'equipment'   },
  { name: 'Parametres',      href: '/settings',    icon: Settings,         module: 'settings'    },
] as const

const ROLE_BADGE: Record<string, string> = {
  SUPER_ADMIN:    'bg-violet-100 text-violet-700',
  'super-admin':  'bg-violet-100 text-violet-700',
  ADMIN:          'bg-blue-100 text-blue-700',
  admin:          'bg-blue-100 text-blue-700',
  MANAGER:        'bg-green-100 text-green-700',
  'agency-manager':'bg-green-100 text-green-700',
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser, canAccess, logout, getVisibleAgencyIds, settings } = useAuthStore()
  const { fetchAgencies } = useAppStore()
  const hasHydrated = useAuthStore((s) => s.hasHydrated)
  useEffect(() => { if (hasHydrated) fetchAgencies() }, [hasHydrated])

  const initials = currentUser
    ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase()
    : '?'

  const handleLogout = () => { logout(); navigate('/login') }

  const visibleNav = NAV_ITEMS.filter((item) =>
    canAccess(item.module as Parameters<typeof canAccess>[0])
  )
  const agencyIds   = getVisibleAgencyIds()
  const isRestricted = currentUser?.role === 'agency-manager' || currentUser?.role === 'standard'
  const roleBadgeClass = currentUser
    ? (ROLE_BADGE[currentUser.role] ?? 'bg-gray-100 text-gray-700')
    : 'bg-gray-100 text-gray-700'

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex h-16 items-center px-4 border-b border-gray-100">
        <Link to="/dashboard" className="flex items-center gap-2 text-lg font-bold text-violet-600">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="h-20 w-20 object-contain rounded" />
          ) : (
            <Truck className="h-6 w-6" />
          )}
          {settings.appName || 'CarFleet Manager'}
        </Link>
      </div>
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-0.5 px-2">
          {visibleNav.map((item) => {
            const isActive = item.href === '/dashboard'
              ? location.pathname === '/dashboard'
              : location.pathname.startsWith(item.href)
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-violet-50 text-violet-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-violet-600' : 'text-gray-400'}`} />
                  {item.name}
                  {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-600" />}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      {currentUser && (
        <div className="border-t border-gray-100 p-3">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-violet-700">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {currentUser.firstName} {currentUser.lastName}
              </p>
              <span className={`inline-block text-xs px-1.5 py-0.5 rounded font-medium ${roleBadgeClass}`}>
                {currentUser.role}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-1 w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Deconnexion
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      {sidebarOpen && (
        <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg lg:hidden">
          <button
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
          <SidebarContent />
        </div>
      )}
      <div className="hidden w-64 flex-col border-r border-gray-200 bg-white lg:flex">
        <SidebarContent />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm">
          <button className="text-gray-500 lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-3 flex-1 px-4">
            {isRestricted && agencyIds.length > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-medium">
                <UserCircle className="w-3 h-3" />
                {agencyIds.length} agence{agencyIds.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <GlobalSearch />
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Deconnexion"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        <main className="flex-1 overflow-y-auto">
          <div className="py-6">
            <div className="w-full px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
