import { useAuthStore } from '@/store/useAuthStore'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Truck, Bell, Wrench, HeartPulse,
  AlertTriangle, Fuel, FileText, Building2, ChevronLeft,
  ChevronRight, Activity, Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/vehicles', icon: Truck, label: 'Vehicules' },
  { to: '/compliance', icon: Bell, label: 'Alertes' },
  { to: '/maintenance', icon: Wrench, label: 'Maintenance' },
  { to: '/equipment', icon: HeartPulse, label: 'Equipements medicaux' },
  { to: '/incidents', icon: AlertTriangle, label: 'Sinistres' },
  { to: '/fuel', icon: Fuel, label: 'Carburant' },
  { to: '/fines', icon: FileText, label: 'Infractions' },
  { to: '/agencies', icon: Building2, label: 'Agences' },
]

export default function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore()
  const location = useLocation()

  const { settings } = useAuthStore()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-white border-r border-gray-200 flex flex-col z-40 transition-all duration-300 shadow-sm',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-4 border-b border-gray-100', sidebarCollapsed ? 'justify-center' : 'gap-3')}>
        {settings.logoUrl ? (
          <img
            src={settings.logoUrl}
            alt="Logo"
            className="flex-shrink-0 w-24 h-24 rounded-lg object-contain"
          />
        ) : (
          <div className="flex-shrink-0 w-24 h-24 rounded-lg bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center shadow-md">
            <Activity className="w-4 h-4 text-white" />
          </div>
        )}
        {!sidebarCollapsed && (
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">{settings.appName || 'CarFleet Manager'}</p>
            <p className="text-xs text-violet-600 font-medium">Manager</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-0.5 px-2">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
            const isActive = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
            return (
              <li key={to}>
                <NavLink
                  to={to}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                    isActive
                      ? 'bg-violet-50 text-violet-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                    sidebarCollapsed && 'justify-center px-2'
                  )}
                  title={sidebarCollapsed ? label : undefined}
                >
                  <Icon className={cn('flex-shrink-0 w-4 h-4', isActive ? 'text-violet-600' : 'text-gray-400 group-hover:text-gray-600')} />
                  {!sidebarCollapsed && <span className="truncate">{label}</span>}
                  {isActive && !sidebarCollapsed && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-600" />
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Compliance badge */}
      {!sidebarCollapsed && (
        <div className="mx-3 mb-3 p-3 rounded-xl bg-gradient-to-br from-violet-50 to-blue-50 border border-violet-100">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-3.5 h-3.5 text-violet-600" />
            <span className="text-xs font-semibold text-violet-700">Conformite globale</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-violet-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full" style={{ width: '78%' }} />
            </div>
            <span className="text-xs font-bold text-violet-700">78%</span>
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="flex items-center justify-center h-10 border-t border-gray-100 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
      >
        {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  )
}
