import { useState, useMemo, useEffect, useCallback } from 'react'
import { List, Calendar, Plus, RefreshCw, Wrench } from 'lucide-react'
import { useAgencyFilter } from '@/hooks/useAgencyFilter'
import MaintenanceKPI      from '@/components/maintenance/MaintenanceKPI'
import MaintenanceFilters  from '@/components/maintenance/MaintenanceFilters'
import MaintenanceTable    from '@/components/maintenance/MaintenanceTable'
import MaintenanceCalendar from '@/components/maintenance/MaintenanceCalendar'
import MaintenanceForm     from '@/components/maintenance/MaintenanceForm'
import TemplateList        from '@/components/maintenance/TemplateList'
import { maintenanceService } from '@/lib/services'
import { useVehicleStore } from '@/store/vehicleStore'
import type { MaintenanceRecord } from '@/types'

type StatusFilter = 'ALL' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
type TypeFilter   = 'ALL' | 'PREVENTIVE' | 'CORRECTIVE' | 'REGULATORY' | 'SANITAIRE'
type PeriodFilter = 'ALL' | 'CURRENT_MONTH' | 'NEXT_3_MONTHS' | 'LAST_30_DAYS'
type MainTab      = 'interventions' | 'templates'

export default function Maintenance() {
  const { filterByAgency, visibleAgencyIds } = useAgencyFilter()
  const { fetchVehicles } = useVehicleStore()

  const [mainTab,      setMainTab]      = useState<MainTab>('interventions')
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
  const [editingMaintenance,    setEditingMaintenance]    = useState<MaintenanceRecord | undefined>()

  const fetchMaintenances = useCallback(async () => {
    setLoading(true)
    try {
      const data = await maintenanceService.list()
      setMaintenances(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
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
    if (statusFilter !== 'ALL') list = list.filter((m) => m.status   === statusFilter)
    if (typeFilter   !== 'ALL') list = list.filter((m) => m.type     === typeFilter)
    if (agencyFilter !== '')    list = list.filter((m) => m.agencyId === agencyFilter)
    if (periodFilter !== 'ALL') {
      const now = new Date(); const currentMonth = now.getMonth(); const currentYear = now.getFullYear()
      list = list.filter((m) => {
        const d = new Date(m.scheduledDate)
        switch (periodFilter) {
          case 'CURRENT_MONTH':  return d.getMonth() === currentMonth && d.getFullYear() === currentYear
          case 'NEXT_3_MONTHS':  return d >= now && d < new Date(currentYear, currentMonth + 3, 1)
          case 'LAST_30_DAYS':   return d >= new Date(now.getTime() - 30 * 86400000) && d <= now
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
    [visibleMaintenances])

  // KPI rapides pour le header
  const scheduledCount   = useMemo(() => visibleMaintenances.filter((m) => m.status === 'SCHEDULED').length,   [visibleMaintenances])
  const inProgressCount  = useMemo(() => visibleMaintenances.filter((m) => m.status === 'IN_PROGRESS').length, [visibleMaintenances])
  const completedCount   = useMemo(() => visibleMaintenances.filter((m) => m.status === 'COMPLETED').length,   [visibleMaintenances])

  const handleAdd    = () => { setEditingMaintenance(undefined); setIsFormOpen(true); setSaveError(null) }
  const handleEdit   = (m: MaintenanceRecord) => { setEditingMaintenance(m); setIsFormOpen(true); setSaveError(null) }

  const handleDelete = async (m: MaintenanceRecord) => {
    if (!window.confirm(`Supprimer l'intervention "${m.label}" pour ${m.vehicleRegistration} ?`)) return
    try {
      await maintenanceService.remove(m.id)
      setMaintenances((prev) => prev.filter((x) => x.id !== m.id))
    } catch { setSaveError('Erreur lors de la suppression.') }
  }

  const handleSave = async (m: MaintenanceRecord) => {
    const payload = {
      vehicleId: m.vehicleId, agencyId: m.agencyId, type: m.type, label: m.label,
      description: m.description || undefined, scheduledDate: m.scheduledDate,
      completedDate: m.completedDate ?? null, status: m.status,
      provider: m.provider ?? undefined,
      estimatedCost: m.estimatedCost != null ? Number(m.estimatedCost) : null,
      realCost: m.realCost != null ? Number(m.realCost) : null,
      mileageAtMaintenance: m.mileageAtMaintenance != null ? parseInt(String(m.mileageAtMaintenance), 10) : undefined,
      notes: m.notes ?? undefined,
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
      setIsFormOpen(false); setSaveError(null)
    } catch { setSaveError("Erreur lors de l'enregistrement.") }
  }

  return (
    <>
      {/* ── Header gradient ── */}
      <div className="bg-gradient-to-r from-violet-950 to-violet-800 rounded-2xl px-6 py-5 mb-6 shadow-lg">
        <div className="flex items-center justify-between gap-4 flex-wrap">

          <div className="flex items-center gap-5 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Maintenance</h1>
                <p className="text-violet-300 text-xs mt-0.5">Suivi, planification et cycles d'entretien</p>
              </div>
            </div>

            {/* Compteurs rapides */}
            {!loading && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20">
                  <span className="text-xs font-bold text-white">{visibleMaintenances.length}</span>
                  <span className="text-[10px] text-violet-300">au total</span>
                </div>
                {scheduledCount > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/20 border border-blue-400/30">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-xs font-bold text-blue-300">{scheduledCount}</span>
                    <span className="text-[10px] text-blue-400">planifiée{scheduledCount > 1 ? 's' : ''}</span>
                  </div>
                )}
                {inProgressCount > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/30">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-xs font-bold text-amber-300">{inProgressCount}</span>
                    <span className="text-[10px] text-amber-400">en cours</span>
                  </div>
                )}
                {completedCount > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/20 border border-green-400/30">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-xs font-bold text-green-300">{completedCount}</span>
                    <span className="text-[10px] text-green-400">terminée{completedCount > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bouton ajouter (onglet interventions seulement) */}
          {mainTab === 'interventions' && (
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-violet-700 text-sm font-semibold rounded-xl hover:bg-violet-50 transition-colors shadow-sm flex-shrink-0"
            >
              <Plus className="w-4 h-4" /> Nouvelle intervention
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">

        {/* ── KPI ── */}
        <MaintenanceKPI maintenances={visibleMaintenances} budgetGap={budgetGap} />

        {/* ── Onglets + contenu dans une carte unifiée ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Tab bar */}
          <div className="flex border-b border-gray-100 px-2 pt-2">
            {[
              { id: 'interventions' as MainTab, label: 'Interventions' },
              { id: 'templates'     as MainTab, label: 'Cycles de maintenance' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMainTab(tab.id)}
                className={`px-5 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all ${
                  mainTab === tab.id
                    ? 'border-violet-600 text-violet-700 bg-violet-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Onglet Interventions ── */}
          {mainTab === 'interventions' && (
            <>
              {/* Filtres */}
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/40">
                <MaintenanceFilters
                  search={search}             onSearchChange={setSearch}
                  statusFilter={statusFilter} onStatusChange={(v) => setStatusFilter(v as StatusFilter)}
                  typeFilter={typeFilter}     onTypeChange={(v) => setTypeFilter(v as TypeFilter)}
                  agencyFilter={agencyFilter} onAgencyChange={setAgencyFilter}
                  periodFilter={periodFilter} onPeriodChange={(v) => setPeriodFilter(v as PeriodFilter)}
                  visibleAgencyIds={visibleAgencyIds}
                />
              </div>

              {/* Barre vue + actualiser */}
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 rounded-full bg-violet-600" />
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    {viewMode === 'list' ? 'Liste des interventions' : 'Calendrier'}
                  </span>
                </div>

                {/* Toggle vue */}
                <div className="flex border border-gray-200 rounded-lg overflow-hidden ml-3">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                      viewMode === 'list'
                        ? 'bg-violet-600 text-white'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" /> Liste
                  </button>
                  <button
                    onClick={() => setViewMode('calendar')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                      viewMode === 'calendar'
                        ? 'bg-violet-600 text-white'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" /> Calendrier
                  </button>
                </div>

                <button
                  onClick={fetchMaintenances}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Actualiser
                </button>

                <span className="text-xs text-gray-400 font-medium ml-auto">
                  {loading ? 'Chargement...' : `${filtered.length} intervention${filtered.length > 1 ? 's' : ''}`}
                </span>
              </div>

              {/* Contenu liste ou calendrier */}
              {viewMode === 'list'
                ? <MaintenanceTable filtered={filtered} onEdit={handleEdit} onDelete={handleDelete} />
                : (
                  <div className="p-4">
                    <MaintenanceCalendar
                      maintenances={filtered}
                      selectedMaintenanceId={selectedMaintenanceId}
                      onSelectMaintenance={setSelectedMaintenanceId}
                    />
                  </div>
                )
              }
            </>
          )}

          {/* ── Onglet Cycles de maintenance ── */}
          {mainTab === 'templates' && (
            <>
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-violet-600" />
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Cycles de maintenance</span>
              </div>
              <div className="p-4">
                <TemplateList />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Toast erreur */}
      {saveError && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-lg z-50 flex items-start gap-3">
          <div>
            <p className="text-sm font-semibold">Erreur</p>
            <p className="text-xs text-red-600 mt-0.5">{saveError}</p>
          </div>
          <button
            onClick={() => setSaveError(null)}
            className="text-red-400 hover:text-red-600 text-lg font-bold leading-none ml-2"
          >
            &times;
          </button>
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
