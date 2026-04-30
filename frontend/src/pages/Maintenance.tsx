import { useState, useMemo, useEffect, useCallback } from 'react'
import { List, Calendar, Plus } from 'lucide-react'
import { useAgencyFilter } from '@/hooks/useAgencyFilter'
import MaintenanceKPI from '@/components/maintenance/MaintenanceKPI'
import MaintenanceFilters from '@/components/maintenance/MaintenanceFilters'
import MaintenanceTable from '@/components/maintenance/MaintenanceTable'
import MaintenanceCalendar from '@/components/maintenance/MaintenanceCalendar'
import MaintenanceForm from '@/components/maintenance/MaintenanceForm'
import { maintenanceService } from '@/lib/services'
import { useVehicleStore } from '@/store/vehicleStore'
import type { MaintenanceRecord } from '@/types'

type StatusFilter = 'ALL' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
type TypeFilter   = 'ALL' | 'PREVENTIVE' | 'CORRECTIVE' | 'REGULATORY' | 'SANITAIRE'
type PeriodFilter = 'ALL' | 'CURRENT_MONTH' | 'NEXT_3_MONTHS' | 'LAST_30_DAYS'

export default function Maintenance() {
  const { filterByAgency, visibleAgencyIds } = useAgencyFilter()
  const { fetchVehicles } = useVehicleStore()

  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>([])
  const [loading,      setLoading]      = useState(true)
  const [saveError,    setSaveError]    = useState<string | null>(null)

  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [typeFilter,   setTypeFilter]   = useState<TypeFilter>('ALL')
  const [agencyFilter, setAgencyFilter] = useState('')
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('ALL')

  const [viewMode,              setViewMode]              = useState<'list' | 'calendar'>('list')
  const [selectedMaintenanceId, setSelectedMaintenanceId] = useState<string | null>(null)
  const [isFormOpen,            setIsFormOpen]            = useState(false)
  const [editingMaintenance,    setEditingMaintenance]    = useState<MaintenanceRecord | undefined>(undefined)

  const fetchMaintenances = useCallback(async () => {
    setLoading(true)
    try {
      const data = await maintenanceService.list()
      setMaintenances(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMaintenances() }, [fetchMaintenances])
  useEffect(() => { fetchVehicles() }, [])

  const filtered = useMemo<MaintenanceRecord[]>(() => {
    let list = filterByAgency(maintenances)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((m) =>
        m.vehicleRegistration.toLowerCase().includes(q) ||
        m.label.toLowerCase().includes(q) ||
        (m.provider?.toLowerCase().includes(q) ?? false)
      )
    }
    if (statusFilter !== 'ALL') list = list.filter((m) => m.status === statusFilter)
    if (typeFilter   !== 'ALL') list = list.filter((m) => m.type   === typeFilter)
    if (agencyFilter !== '')    list = list.filter((m) => m.agencyId === agencyFilter)
    if (periodFilter !== 'ALL') {
      const now          = new Date()
      const currentMonth = now.getMonth()
      const currentYear  = now.getFullYear()
      list = list.filter((m) => {
        const d = new Date(m.scheduledDate)
        switch (periodFilter) {
          case 'CURRENT_MONTH':  return d.getMonth() === currentMonth && d.getFullYear() === currentYear
          case 'NEXT_3_MONTHS': { const c = new Date(currentYear, currentMonth + 3, 1); return d >= now && d < c }
          case 'LAST_30_DAYS':  { const f = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); return d >= f && d <= now }
          default: return true
        }
      })
    }
    return list.sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
  }, [maintenances, search, statusFilter, typeFilter, agencyFilter, periodFilter, filterByAgency])

  const visibleMaintenances = useMemo(() => filterByAgency(maintenances), [maintenances, filterByAgency])

  const budgetGap = useMemo(() =>
    visibleMaintenances
      .filter((m) => m.status === 'COMPLETED' && m.realCost != null && m.estimatedCost != null)
      .reduce((sum, m) => sum + ((m.realCost ?? 0) - (m.estimatedCost ?? 0)), 0),
    [visibleMaintenances]
  )

  const handleAdd  = () => { setEditingMaintenance(undefined); setIsFormOpen(true); setSaveError(null) }
  const handleEdit = (m: MaintenanceRecord) => { setEditingMaintenance(m); setIsFormOpen(true); setSaveError(null) }

  const handleDelete = async (m: MaintenanceRecord) => {
    if (!window.confirm(`Supprimer l'intervention "${m.label}" pour ${m.vehicleRegistration} ?`)) return
    try {
      await maintenanceService.remove(m.id)
      setMaintenances((prev) => prev.filter((x) => x.id !== m.id))
    } catch (e) {
      setSaveError("Erreur lors de la suppression.")
    }
  }

  const handleSave = async (m: MaintenanceRecord) => {
    // Extraire uniquement les champs attendus par le schema Zod du backend
    const payload = {
      vehicleId:            m.vehicleId,
      agencyId:             m.agencyId,
      type:                 m.type,
      label:                m.label,
      description:          m.description   || undefined,
      scheduledDate:        m.scheduledDate,
      completedDate:        m.completedDate  ?? null,
      status:               m.status,
      provider:             m.provider       ?? undefined,
      estimatedCost:        m.estimatedCost  != null ? Number(m.estimatedCost)          : null,
      realCost:             m.realCost       != null ? Number(m.realCost)             : null,
      mileageAtMaintenance: m.mileageAtMaintenance != null ? parseInt(String(m.mileageAtMaintenance), 10) : undefined,
      notes:                m.notes          ?? undefined,
    }
    try {
      const exists = maintenances.some((x) => x.id === m.id)
      if (exists) {
        const updated = await maintenanceService.update(m.id, payload)
        setMaintenances((prev) => prev.map((x) => x.id === m.id ? updated : x))
      } else {
        const created = await maintenanceService.create(payload)
        setMaintenances((prev) => [...prev, created])
      }
      setIsFormOpen(false)
      setSaveError(null)
    } catch (e) {
      setSaveError("Erreur lors de l'enregistrement.")
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
            <p className="text-sm text-gray-500 mt-1">Suivi et planification des interventions</p>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Nouvelle intervention
          </button>
        </div>

	<MaintenanceKPI maintenances={visibleMaintenances} budgetGap={budgetGap} />

        <MaintenanceFilters
          search={search} onSearchChange={setSearch}
          statusFilter={statusFilter} onStatusChange={(v) => setStatusFilter(v as StatusFilter)}
          typeFilter={typeFilter}     onTypeChange={(v) => setTypeFilter(v as TypeFilter)}
          agencyFilter={agencyFilter} onAgencyChange={setAgencyFilter}
          periodFilter={periodFilter} onPeriodChange={(v) => setPeriodFilter(v as PeriodFilter)}
          visibleAgencyIds={visibleAgencyIds}
        />

        <div className="flex items-center gap-4">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-violet-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              <List className="w-4 h-4" /> Liste
            </button>
            <button onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${viewMode === 'calendar' ? 'bg-violet-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              <Calendar className="w-4 h-4" /> Calendrier
            </button>
          </div>
          <span className="text-sm text-gray-500 ml-auto">
            {loading ? 'Chargement...' : `${filtered.length} intervention${filtered.length > 1 ? 's' : ''}`}
          </span>
        </div>

        {viewMode === 'list'
          ? <MaintenanceTable filtered={filtered} onEdit={handleEdit} onDelete={handleDelete} />
          : <MaintenanceCalendar maintenances={filtered} selectedMaintenanceId={selectedMaintenanceId} onSelectMaintenance={setSelectedMaintenanceId} />
        }
      </div>

      {saveError && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50">
          <p className="font-bold">Erreur</p>
          <p className="text-sm">{saveError}</p>
          <button onClick={() => setSaveError(null)} className="absolute top-1 right-2 text-red-500 hover:text-red-700 text-xl font-bold">&times;</button>
        </div>
      )}

      <MaintenanceForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        maintenance={editingMaintenance}
        onSave={handleSave}
      />
    </>
  )
}
