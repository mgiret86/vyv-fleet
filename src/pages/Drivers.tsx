import { useState, useMemo, useEffect, useCallback } from 'react'
import { Plus, Users, ShieldAlert, UserCheck, UserX } from 'lucide-react'
import { useAgencyFilter } from '@/hooks/useAgencyFilter'
import { usePermissions } from '@/hooks/usePermissions'
import DriverKPI from '@/components/drivers/DriverKPI'
import DriverFilters from '@/components/drivers/DriverFilters'
import DriverTable from '@/components/drivers/DriverTable'
import HabilitationTable from '@/components/drivers/HabilitationTable'
import DriverStats from '@/components/drivers/DriverStats'
import DriverForm from '@/components/drivers/DriverForm'
import { driverService } from '@/lib/services'
import type { Driver } from '@/types'

type Tab = 'list' | 'habilitations' | 'stats'

function getDaysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function hasExpiringHab(driver: Driver): boolean {
  const dates = [
    driver.licenseExpiry,
    driver.medicalExamExpiry,
    driver.deaExpiry,
    driver.fspExpiry,
    driver.medicalCertificateExpiry,
  ]
  for (const d of dates) {
    const days = getDaysUntil(d)
    if (days !== null && days < 90) return true
  }
  return false
}

const TABS: { value: Tab; label: string }[] = [
  { value: 'list',          label: 'Conducteurs'   },
  { value: 'habilitations', label: 'Habilitations' },
  { value: 'stats',         label: 'Statistiques'  },
]

export default function Drivers() {
  const { filterByAgency, visibleAgencyIds } = useAgencyFilter()
  const { can } = usePermissions()

  const [drivers,       setDrivers]       = useState<Driver[]>([])
  const [loading,       setLoading]       = useState(true)
  const [tab,           setTab]           = useState<Tab>('list')
  const [search,        setSearch]        = useState('')
  const [roleFilter,    setRoleFilter]    = useState('ALL')
  const [statusFilter,  setStatusFilter]  = useState('ALL')
  const [agencyFilter,  setAgencyFilter]  = useState('')
  const [urgentOnly,    setUrgentOnly]    = useState(false)
  const [isFormOpen,    setIsFormOpen]    = useState(false)
  const [editingDriver, setEditingDriver] = useState<Driver | undefined>(undefined)

  const fetchDrivers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await driverService.list()
      setDrivers(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchDrivers() }, [fetchDrivers])

  const visibleDrivers = useMemo(() => filterByAgency(drivers), [drivers, filterByAgency])

  const filteredDrivers = useMemo(() => {
    return filterByAgency(drivers).filter((d) => {
      if (search) {
        const s = search.toLowerCase()
        const fullName = `${d.firstName} ${d.lastName}`.toLowerCase()
        if (!fullName.includes(s) && !d.email.toLowerCase().includes(s)) return false
      }
      if (roleFilter   !== 'ALL' && d.role   !== roleFilter)   return false
      if (statusFilter !== 'ALL' && d.status !== statusFilter) return false
      if (agencyFilter && d.agencyId !== agencyFilter)          return false
      if (urgentOnly && !hasExpiringHab(d))                     return false
      return true
    })
  }, [drivers, search, roleFilter, statusFilter, agencyFilter, urgentOnly, filterByAgency])

  const alertCount    = useMemo(() => visibleDrivers.filter(hasExpiringHab).length, [visibleDrivers])
  const activeCount   = useMemo(() => visibleDrivers.filter((d) => d.status === 'ACTIVE').length, [visibleDrivers])
  const inactiveCount = useMemo(() => visibleDrivers.filter((d) => d.status !== 'ACTIVE').length, [visibleDrivers])

  const handleSave = async (driver: Driver) => {
    try {
      const exists = drivers.some((d) => d.id === driver.id)
      if (exists) {
        const updated = await driverService.update(driver.id, driver)
        setDrivers((prev) => prev.map((d) => d.id === driver.id ? { ...d, ...updated } : d))
      } else {
        const created = await driverService.create(driver)
        setDrivers((prev) => [...prev, created])
      }
      setIsFormOpen(false)
    } catch (e) { console.error(e) }
  }

  const handleDelete = async (driver: Driver) => {
    if (!window.confirm(`Supprimer ${driver.firstName} ${driver.lastName} ?`)) return
    try {
      await driverService.remove(driver.id)
      setDrivers((prev) => prev.filter((d) => d.id !== driver.id))
    } catch (e) { console.error(e) }
  }

  return (
    <>
      {/* ── Header gradient ── */}
      <div className="bg-gradient-to-r from-violet-950 to-violet-800 rounded-2xl px-6 py-5 mb-6 shadow-lg">
        <div className="flex items-center justify-between gap-4 flex-wrap">

          {/* Titre + icône */}
          <div className="flex items-center gap-5 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Conducteurs</h1>
                <p className="text-violet-300 text-xs mt-0.5">
                  {loading ? 'Chargement...' : `${visibleDrivers.length} conducteur${visibleDrivers.length > 1 ? 's' : ''} dans la flotte`}
                </p>
              </div>
            </div>

            {/* Compteurs rapides */}
            {!loading && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/20 border border-green-400/30">
                  <UserCheck className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-xs font-bold text-green-300">{activeCount}</span>
                  <span className="text-[10px] text-green-400">actifs</span>
                </div>
                {inactiveCount > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-500/20 border border-gray-400/30">
                    <UserX className="w-3.5 h-3.5 text-gray-300" />
                    <span className="text-xs font-bold text-gray-300">{inactiveCount}</span>
                    <span className="text-[10px] text-gray-400">inactifs</span>
                  </div>
                )}
                {alertCount > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-400/30">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-xs font-bold text-red-300">{alertCount}</span>
                    <span className="text-[10px] text-red-400">habilitation{alertCount > 1 ? 's' : ''} urgente{alertCount > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bouton ajouter */}
          {can('drivers', 'create') && (
            <button
              onClick={() => { setEditingDriver(undefined); setIsFormOpen(true) }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-violet-700 text-sm font-semibold rounded-xl hover:bg-violet-50 transition-colors shadow-sm flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              Nouveau conducteur
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">

        {/* ── KPI cards ── */}
        <DriverKPI
          total={visibleDrivers.length}
          active={activeCount}
          inactive={inactiveCount}
          alerts={alertCount}
        />

        {/* ── Onglets ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-gray-100 px-2 pt-2">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`px-5 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all ${
                  tab === t.value
                    ? 'border-violet-600 text-violet-700 bg-violet-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Filtres (hors stats) */}
          {tab !== 'stats' && (
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/40">
              <DriverFilters
                search={search}             onSearchChange={setSearch}
                roleFilter={roleFilter}     onRoleChange={setRoleFilter}
                statusFilter={statusFilter} onStatusChange={setStatusFilter}
                agencyFilter={agencyFilter} onAgencyChange={setAgencyFilter}
                urgentOnly={urgentOnly}     onUrgentChange={setUrgentOnly}
                visibleAgencyIds={visibleAgencyIds}
              />
            </div>
          )}

          {/* Contenu de l'onglet */}
          {loading ? (
            <div className="p-12 text-center text-sm text-gray-400 animate-pulse">
              Chargement des conducteurs...
            </div>
          ) : tab === 'list' ? (
            <>
              {/* En-tête tableau */}
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 rounded-full bg-violet-600" />
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Liste des conducteurs</span>
                </div>
                <span className="text-xs text-gray-400 font-medium">
                  {filteredDrivers.length} conducteur{filteredDrivers.length !== 1 ? 's' : ''}
                </span>
              </div>
              <DriverTable
                drivers={filteredDrivers}
                onEdit={(d) => { setEditingDriver(d); setIsFormOpen(true) }}
                onDelete={handleDelete}
              />
            </>
          ) : tab === 'habilitations' ? (
            <>
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="w-1 h-4 rounded-full bg-violet-600" />
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Suivi des habilitations</span>
                <span className="text-xs text-gray-400 font-medium">
                  {filteredDrivers.length} conducteur{filteredDrivers.length !== 1 ? 's' : ''}
                </span>
              </div>
              <HabilitationTable drivers={filteredDrivers} />
            </>
          ) : (
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-4 rounded-full bg-violet-600" />
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Statistiques conducteurs</span>
              </div>
              <DriverStats drivers={visibleDrivers} />
            </div>
          )}
        </div>
      </div>

      <DriverForm
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingDriver(undefined) }}
        driver={editingDriver}
        onSave={handleSave}
      />
    </>
  )
}
