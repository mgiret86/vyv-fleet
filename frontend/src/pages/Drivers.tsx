import { useState, useMemo, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Conducteurs</h1>
            <p className="text-sm text-gray-500 mt-1">
              {loading ? 'Chargement...' : `${visibleDrivers.length} conducteur${visibleDrivers.length > 1 ? 's' : ''}`}
            </p>
          </div>
          {can('drivers', 'create') && (
            <button
              onClick={() => { setEditingDriver(undefined); setIsFormOpen(true) }}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Nouveau conducteur
            </button>
          )}
        </div>

        <DriverKPI
          total={visibleDrivers.length}
          active={activeCount}
          inactive={inactiveCount}
          alerts={alertCount}
        />

        <div className="flex gap-1 border-b border-gray-200">
          {TABS.map((t) => (
            <button key={t.value} onClick={() => setTab(t.value)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.value
                  ? 'border-violet-600 text-violet-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab !== 'stats' && (
          <DriverFilters
            search={search}           onSearchChange={setSearch}
            roleFilter={roleFilter}   onRoleChange={setRoleFilter}
            statusFilter={statusFilter} onStatusChange={setStatusFilter}
            agencyFilter={agencyFilter} onAgencyChange={setAgencyFilter}
            urgentOnly={urgentOnly}   onUrgentChange={setUrgentOnly}
            visibleAgencyIds={visibleAgencyIds}
          />
        )}

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-sm text-gray-400 animate-pulse">
            Chargement des conducteurs...
          </div>
        ) : tab === 'list' ? (
          <DriverTable
            drivers={filteredDrivers}
            onEdit={(d) => { setEditingDriver(d); setIsFormOpen(true) }}
            onDelete={handleDelete}
          />
        ) : tab === 'habilitations' ? (
          <HabilitationTable drivers={filteredDrivers} />
        ) : (
          <DriverStats drivers={visibleDrivers} />
        )}
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
