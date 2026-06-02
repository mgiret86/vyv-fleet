import { useState } from 'react'
import { Users, Shield, Building2, SlidersHorizontal } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { usePermissions } from '@/hooks/usePermissions'
import SettingsUsers from '@/components/settings/SettingsUsers'
import SettingsRoles from '@/components/settings/SettingsRoles'
import SettingsAgencies from '@/components/settings/SettingsAgencies'
import SettingsGeneral from '@/components/settings/SettingsGeneral'

type Tab = 'users' | 'roles' | 'agencies' | 'general'

const ALL_TABS = [
  { id: 'users'    as Tab, label: 'Utilisateurs',    icon: Users,            requireSuperAdmin: false },
  { id: 'roles'    as Tab, label: 'Roles et Droits', icon: Shield,           requireSuperAdmin: true  },
  { id: 'agencies' as Tab, label: 'Agences',         icon: Building2,        requireSuperAdmin: false },
  { id: 'general'  as Tab, label: 'General',         icon: SlidersHorizontal,requireSuperAdmin: false },
]

export default function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>('users')
  const { can } = usePermissions()
  const currentUser = useAuthStore((s) => s.currentUser)

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'super-admin'

  const visibleTabs = ALL_TABS.filter((t) => {
    // SUPER_ADMIN a toujours accès à tout
    if (isSuperAdmin) return true
    if (!can('settings', 'view')) return false
    if (t.requireSuperAdmin) return false
    return true
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Parametres</h1>
        <p className="text-sm text-gray-500 mt-1">Configuration de l'application et gestion des acces</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar tabs - vertical desktop */}
        <aside className="lg:w-52 flex-shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-violet-50 text-violet-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <tab.icon className={`w-4 h-4 flex-shrink-0 ${activeTab === tab.id ? 'text-violet-600' : 'text-gray-400'}`} />
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'users'    && <SettingsUsers />}
          {activeTab === 'roles'    && <SettingsRoles />}
          {activeTab === 'agencies' && <SettingsAgencies />}
          {activeTab === 'general'  && <SettingsGeneral />}
        </div>
      </div>
    </div>
  )
}
