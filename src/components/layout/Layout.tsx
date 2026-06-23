import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Home, Truck, Wrench, ClipboardCheck, Fuel, AlertTriangle,
  Users, BriefcaseMedical, Menu, X, Settings, LogOut,
  UserCircle, Euro, Bell, ChevronRight,
} from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useAppStore } from '@/store/useAppStore'
import GlobalSearch from '@/components/layout/GlobalSearch'

interface LayoutProps { children: React.ReactNode }

const NAV_GROUPS = [
  {
    label: 'Principal',
    items: [
      { name: 'Tableau de bord', href: '/dashboard',  icon: Home,              module: 'dashboard'   },
      { name: 'Véhicules',       href: '/vehicles',   icon: Truck,             module: 'vehicles'    },
      { name: 'Conducteurs',     href: '/drivers',    icon: Users,             module: 'drivers'     },
    ],
  },
  {
    label: 'Opérations',
    items: [
      { name: 'Maintenance',  href: '/maintenance', icon: Wrench,           module: 'maintenance' },
      { name: 'Carburant',    href: '/fuel',        icon: Fuel,             module: 'fuel'        },
      { name: 'Équipements',  href: '/equipment',   icon: BriefcaseMedical, module: 'equipment'   },
      { name: 'Incidents',    href: '/incidents',   icon: AlertTriangle,    module: 'incidents'   },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { name: 'Finance',    href: '/finance',    icon: Euro,           module: 'finance'    },
      { name: 'Conformité', href: '/compliance', icon: ClipboardCheck, module: 'compliance' },
    ],
  },
  {
    label: 'Système',
    items: [
      { name: 'Paramètres', href: '/settings', icon: Settings, module: 'settings' },
    ],
  },
] as const

const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard:   'Tableau de bord',
  vehicles:    'Véhicules',
  drivers:     'Conducteurs',
  maintenance: 'Maintenance',
  fuel:        'Carburant',
  equipment:   'Équipements',
  incidents:   'Incidents',
  finance:     'Finance',
  compliance:  'Conformité',
  settings:    'Paramètres',
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN:      'Super Admin',
  'super-admin':    'Super Admin',
  ADMIN:            'Administrateur',
  admin:            'Administrateur',
  MANAGER:          'Manager',
  'agency-manager': 'Resp. Agence',
  standard:         'Utilisateur',
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location  = useLocation()
  const navigate  = useNavigate()
  const { currentUser, canAccess, logout, getVisibleAgencyIds, settings } = useAuthStore()
  const { fetchAgencies } = useAppStore()
  const hasHydrated = useAuthStore((s) => s.hasHydrated)

  useEffect(() => { if (hasHydrated) fetchAgencies() }, [hasHydrated])

  const initials = currentUser
    ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase()
    : '?'

  const handleLogout = () => { logout(); navigate('/login') }

  // Breadcrumb dynamique
  const segments = location.pathname.split('/').filter(Boolean)
  const breadcrumb = segments.map((seg, i) => ({
    label: BREADCRUMB_LABELS[seg] ?? seg,
    href:  '/' + segments.slice(0, i + 1).join('/'),
  }))

  const isItemVisible = (module: string) => {
    if (module === 'finance') return true
    return canAccess(module as Parameters<typeof canAccess>[0])
  }

  const agencyIds    = getVisibleAgencyIds()
  const isRestricted = currentUser?.role === 'agency-manager' || currentUser?.role === 'standard'
  const roleLabel    = currentUser ? (ROLE_LABELS[currentUser.role] ?? currentUser.role) : ''

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-violet-950">

      {/* Logo */}
      <div className="flex h-16 items-center px-5 border-b border-violet-800/60 flex-shrink-0">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center flex-shrink-0">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="h-6 w-6 object-contain rounded" />
            ) : (
              <Truck className="h-4 w-4 text-white" />
            )}
          </div>
          <span className="text-white font-bold text-base truncate">
            {settings.appName || 'VYV Fleet'}
          </span>
        </Link>
      </div>

      {/* Navigation groupée */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden scrollbar-none">
        <div className="space-y-5 px-3">
          {NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter((item) => isItemVisible(item.module))
            if (visibleItems.length === 0) return null
            return (
              <div key={group.label}>
                <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-violet-400/70">
                  {group.label}
                </p>
                <ul className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const isActive = item.href === '/dashboard'
                      ? location.pathname === '/dashboard'
                      : location.pathname.startsWith(item.href)
                    return (
                      <li key={item.href}>
                        <Link
                          to={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            isActive
                              ? 'bg-violet-700/70 text-white'
                              : 'text-violet-200/70 hover:bg-violet-800/50 hover:text-violet-100'
                          }`}
                        >
                          {isActive && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r bg-violet-300" />
                          )}
                          <item.icon className={`w-4 h-4 flex-shrink-0 ${
                            isActive ? 'text-violet-200' : 'text-violet-400/70'
                          }`} />
                          <span className="truncate">{item.name}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      </nav>

      {/* Utilisateur connecté */}
      {currentUser && (
        <div className="border-t border-violet-800/60 p-3 flex-shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {currentUser.firstName} {currentUser.lastName}
              </p>
              <p className="text-[10px] text-violet-300/70 truncate">{roleLabel}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-1 w-full flex items-center gap-2 px-3 py-2 text-sm text-violet-300/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50">

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar mobile */}
      {sidebarOpen && (
        <div className="fixed inset-y-0 left-0 z-50 w-64 shadow-2xl lg:hidden">
          <button
            className="absolute top-4 right-4 text-violet-300 hover:text-white transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
          <SidebarContent />
        </div>
      )}

      {/* Sidebar desktop */}
      <div className="hidden w-64 lg:flex flex-col flex-shrink-0 shadow-xl">
        <SidebarContent />
      </div>

      {/* Contenu principal */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Topbar */}
        <div className="sticky top-0 z-10 flex h-16 items-center justify-between bg-white border-b border-gray-200 px-4 shadow-sm flex-shrink-0">

          {/* Gauche : burger + breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb */}
            <nav className="hidden sm:flex items-center gap-1 text-sm">
              <Link to="/dashboard" className="text-gray-400 hover:text-violet-600 transition-colors text-xs">
                Accueil
              </Link>
              {breadcrumb.map((crumb, i) => (
                <React.Fragment key={crumb.href}>
                  <ChevronRight className="w-3 h-3 text-gray-300" />
                  {i === breadcrumb.length - 1 ? (
                    <span className="text-gray-800 font-medium text-xs">{crumb.label}</span>
                  ) : (
                    <Link to={crumb.href} className="text-gray-400 hover:text-violet-600 transition-colors text-xs">
                      {crumb.label}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Droite : badge agence + recherche + notifs + avatar */}
          <div className="flex items-center gap-2">
            {isRestricted && agencyIds.length > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-medium">
                <UserCircle className="w-3 h-3" />
                {agencyIds.length} agence{agencyIds.length > 1 ? 's' : ''}
              </span>
            )}

            <GlobalSearch />

            {/* Notifications */}
            <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
            </button>

            {/* Avatar */}
            {currentUser && (
              <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-violet-400 transition-all">
                <span className="text-xs font-bold text-white">{initials}</span>
              </div>
            )}
          </div>
        </div>

        {/* Page */}
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
