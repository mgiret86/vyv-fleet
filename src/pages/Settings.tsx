import { useState } from 'react'
import { Users, Shield, Building2, SlidersHorizontal, Plug, Tag, Settings as SettingsIcon } from 'lucide-react'
import { useAuthStore }    from '@/store/useAuthStore'
import { usePermissions }  from '@/hooks/usePermissions'
import SettingsUsers        from '@/components/settings/SettingsUsers'
import SettingsRoles        from '@/components/settings/SettingsRoles'
import SettingsAgencies     from '@/components/settings/SettingsAgencies'
import SettingsGeneral      from '@/components/settings/SettingsGeneral'
import SettingsIntegrations from '@/components/settings/SettingsIntegrations'
import SettingsCategories   from '@/components/settings/SettingsCategories'

type Tab = 'users' | 'roles' | 'agencies' | 'categories' | 'general' | 'integrations'

const ALL_TABS = [
  { id: 'users'        as Tab, label: 'Utilisateurs',    icon: Users,             requireSuperAdmin: false },
  { id: 'roles'        as Tab, label: 'Rôles et droits', icon: Shield,            requireSuperAdmin: true  },
  { id: 'agencies'     as Tab, label: 'Agences',         icon: Building2,         requireSuperAdmin: false },
  { id: 'categories'   as Tab, label: 'Catégories',      icon: Tag,               requireSuperAdmin: false },
  { id: 'general'      as Tab, label: 'Général',         icon: SlidersHorizontal, requireSuperAdmin: false },
  { id: 'integrations' as Tab, label: 'Intégrations',    icon: Plug,              requireSuperAdmin: true  },
]

const TAB_DESCRIPTIONS: Record<Tab, string> = {
  users:        'Gérez les comptes utilisateurs et leurs accès',
  roles:        'Configurez les rôles et les permissions par module',
  agencies:     'Administrez les agences et leurs paramètres',
  categories:   'Gérez les catégories personnalisées',
  general:      'Paramètres globaux de l\'application',
  integrations: 'Connecteurs et APIs tierces',
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>('users')
  const { can }     = usePermissions()
  const currentUser = useAuthStore((s) => s.currentUser)

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'super-admin'

  const visibleTabs = ALL_TABS.filter((t) => {
    if (isSuperAdmin) return true
    if (!can('settings', 'view')) return false
    if (t.requireSuperAdmin) return false
    return true
  })

  const activeTabDef = ALL_TABS.find((t) => t.id === activeTab)!
  const ActiveIcon   = activeTabDef.icon

  return (
    <>
      {/* ── Header gradient ── */}
      <div className="bg-gradient-to-r from-violet-950 to-violet-800 rounded-2xl px-6 py-5 mb-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Paramètres</h1>
            <p className="text-violet-300 text-xs mt-0.5">Configuration de l'application et gestion des accès</p>
          </div>
        </div>
      </div>

      {/* ── Layout sidebar + contenu ── */}
      <div className="flex flex-col lg:flex-row gap-5">

        {/* ── Sidebar navigation ── */}
        <aside className="lg:w-56 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* En-tête sidebar */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Navigation</p>
            </div>

            <nav className="p-2 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
              {visibleTabs.map((tab) => {
                const Icon   = tab.icon
                const active = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all w-full text-left ${
                      active
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-gray-400'}`} />
                    {tab.label}
                    {tab.requireSuperAdmin && (
                      <Shield className={`w-3 h-3 ml-auto flex-shrink-0 ${active ? 'text-violet-200' : 'text-gray-300'}`} />
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* ── Zone de contenu ── */}
        <div className="flex-1 min-w-0">
          {/* En-tête de section dynamique */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
              <div className="w-1 h-5 rounded-full bg-violet-600" />
              <div className="flex items-center gap-2">
                <ActiveIcon className="w-4 h-4 text-violet-600" />
                <span className="text-sm font-bold text-gray-700">{activeTabDef.label}</span>
              </div>
              <p className="text-xs text-gray-400 ml-1">{TAB_DESCRIPTIONS[activeTab]}</p>
              {activeTabDef.requireSuperAdmin && (
                <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
                  <Shield className="w-3 h-3" /> Super Admin
                </span>
              )}
            </div>

            <div className="p-5">
              {activeTab === 'users'        && <SettingsUsers />}
              {activeTab === 'roles'        && <SettingsRoles />}
              {activeTab === 'agencies'     && <SettingsAgencies />}
              {activeTab === 'categories'   && <SettingsCategories />}
              {activeTab === 'general'      && <SettingsGeneral />}
              {activeTab === 'integrations' && <SettingsIntegrations />}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
