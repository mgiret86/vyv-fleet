import { useState, useMemo, useEffect, useCallback } from 'react'
import { AlertTriangle, Plus } from 'lucide-react'
import { useAgencyFilter } from '@/hooks/useAgencyFilter'
import IncidentKPI     from '@/components/incidents/IncidentKPI'
import IncidentFilters from '@/components/incidents/IncidentFilters'
import IncidentCard    from '@/components/incidents/IncidentCard'
import IncidentStats   from '@/components/incidents/IncidentStats'
import InsuranceTable  from '@/components/incidents/InsuranceTable'
import IncidentForm    from '@/components/incidents/IncidentForm'
import { incidentService } from '@/lib/services'
import type { IncidentType, IncidentSeverity, IncidentStatus, PeriodFilter } from '@/data/mockIncidents'

type Tab = 'incidents' | 'stats' | 'insurance'

const TAB_LABELS: Record<Tab, string> = {
  incidents: 'Incidents',
  stats:     'Statistiques',
  insurance: 'Assurances',
}

export default function Incidents() {
  const { filterByAgency, visibleAgencyIds } = useAgencyFilter()

  const [incidents,       setIncidents]       = useState<any[]>([])
  const [tab,             setTab]             = useState<Tab>('incidents')
  const [search,          setSearch]          = useState('')
  const [typeFilter,      setTypeFilter]      = useState<IncidentType | 'ALL'>('ALL')
  const [severityFilter,  setSeverityFilter]  = useState<IncidentSeverity | 'ALL'>('ALL')
  const [statusFilter,    setStatusFilter]    = useState<IncidentStatus | 'ALL'>('ALL')
  const [agencyFilter,    setAgencyFilter]    = useState('')
  const [periodFilter,    setPeriodFilter]    = useState<PeriodFilter>('ALL')
  const [showForm,        setShowForm]        = useState(false)
  const [editingIncident, setEditingIncident] = useState<any | null>(null)

  const fetchIncidents = useCallback(async () => {
    try {
      const data = await incidentService.list()
      setIncidents(data)
    } catch (e) { console.error(e) }
  }, [])

  useEffect(() => { fetchIncidents() }, [fetchIncidents])

  const visibleIncidents = useMemo(() => filterByAgency(incidents), [incidents, filterByAgency])

  const filteredIncidents = useMemo(() => {
    const now = new Date()
    return filterByAgency(incidents).filter((incident) => {
      if (search) {
        const lower = search.toLowerCase()
        const match =
          (incident.description       ?? '').toLowerCase().includes(lower) ||
          (incident.vehicleRegistration ?? '').toLowerCase().includes(lower) ||
          (incident.driverName          ?? '').toLowerCase().includes(lower) ||
          (incident.insuranceReference  ?? '').toLowerCase().includes(lower)
        if (!match) return false
      }
      if (typeFilter     !== 'ALL' && incident.type     !== typeFilter)     return false
      if (severityFilter !== 'ALL' && incident.severity !== severityFilter) return false
      if (statusFilter   !== 'ALL' && incident.status   !== statusFilter)   return false
      if (agencyFilter   !== ''    && incident.agencyId !== agencyFilter)   return false
      if (periodFilter !== 'ALL') {
        const incidentDate = new Date(incident.date)
        const thisYear = now.getFullYear()
        const thisMonth = now.getMonth()
        if (periodFilter === 'THIS_MONTH' && (incidentDate.getFullYear() !== thisYear || incidentDate.getMonth() !== thisMonth)) return false
        if (periodFilter === 'LAST_3_MONTHS') {
          const limit = new Date(now); limit.setMonth(limit.getMonth() - 3)
          if (incidentDate < limit) return false
        }
        if (periodFilter === 'THIS_YEAR' && incidentDate.getFullYear() !== thisYear) return false
      }
      return true
    })
  }, [incidents, search, typeFilter, severityFilter, statusFilter, agencyFilter, periodFilter, filterByAgency])

  // Compteurs rapides header
  const criticalCount = useMemo(() => visibleIncidents.filter((i) => i.severity === 'CRITICAL' && i.status !== 'CLOSED').length, [visibleIncidents])
  const openCount     = useMemo(() => visibleIncidents.filter((i) => i.status === 'OPEN' || i.status === 'IN_PROGRESS').length,  [visibleIncidents])
  const insuranceCount = useMemo(() => visibleIncidents.filter((i) => i.insuranceReference).length, [visibleIncidents])

  const handleNew    = () => { setEditingIncident(null); setShowForm(true) }
  const handleEdit   = (incident: any) => { setEditingIncident(incident); setShowForm(true) }
  const handleClose  = () => { setShowForm(false); setEditingIncident(null) }

  const handleSave = async (incident: any) => {
    try {
      const exists = incidents.some((i) => i.id === incident.id)
      if (exists) {
        const updated = await incidentService.update(incident.id, incident)
        setIncidents((prev) => prev.map((i) => i.id === incident.id ? { ...i, ...updated } : i))
      } else {
        const created = await incidentService.create(incident)
        setIncidents((prev) => [...prev, created])
      }
      setShowForm(false); setEditingIncident(null)
    } catch (e) { console.error(e) }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cet incident ?')) return
    try {
      await incidentService.remove(id)
      setIncidents((prev) => prev.filter((i) => i.id !== id))
    } catch (e) { console.error(e) }
  }

  return (
    <>
      {/* ── Header gradient ── */}
      <div className="bg-gradient-to-r from-violet-950 to-violet-800 rounded-2xl px-6 py-5 mb-6 shadow-lg">
        <div className="flex items-center justify-between gap-4 flex-wrap">

          <div className="flex items-center gap-5 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Sinistres & Accidents</h1>
                <p className="text-violet-300 text-xs mt-0.5">
                  {visibleIncidents.length} incident{visibleIncidents.length > 1 ? 's' : ''} dans la flotte
                </p>
              </div>
            </div>

            {/* Compteurs rapides */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20">
                <span className="text-xs font-bold text-white">{visibleIncidents.length}</span>
                <span className="text-[10px] text-violet-300">au total</span>
              </div>
              {openCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/30">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-xs font-bold text-amber-300">{openCount}</span>
                  <span className="text-[10px] text-amber-400">en cours</span>
                </div>
              )}
              {criticalCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-400/30">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-xs font-bold text-red-300">{criticalCount}</span>
                  <span className="text-[10px] text-red-400">critique{criticalCount > 1 ? 's' : ''}</span>
                </div>
              )}
              {insuranceCount > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/20 border border-blue-400/30">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-xs font-bold text-blue-300">{insuranceCount}</span>
                  <span className="text-[10px] text-blue-400">dossier{insuranceCount > 1 ? 's' : ''} assurance</span>
                </div>
              )}
            </div>
          </div>

          {/* Action */}
          <button
            onClick={handleNew}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-violet-700 text-sm font-semibold rounded-xl hover:bg-violet-50 transition-colors shadow-sm flex-shrink-0"
          >
            <Plus className="w-4 h-4" /> Nouveau sinistre
          </button>
        </div>
      </div>

      <div className="space-y-4">

        {/* ── KPIs ── */}
        <IncidentKPI incidents={visibleIncidents} />

        {/* ── Onglets + contenu dans une carte unifiée ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Tab bar */}
          <div className="flex border-b border-gray-100 px-2 pt-2">
            {(['incidents', 'stats', 'insurance'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all ${
                  tab === t
                    ? 'border-violet-600 text-violet-700 bg-violet-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>

          {/* ── Onglet Incidents ── */}
          {tab === 'incidents' && (
            <>
              {/* Filtres */}
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/40">
                <IncidentFilters
                  search={search}                   onSearchChange={setSearch}
                  typeFilter={typeFilter}           onTypeFilterChange={setTypeFilter}
                  severityFilter={severityFilter}   onSeverityFilterChange={setSeverityFilter}
                  statusFilter={statusFilter}       onStatusFilterChange={setStatusFilter}
                  agencyFilter={agencyFilter}       onAgencyFilterChange={setAgencyFilter}
                  periodFilter={periodFilter}       onPeriodFilterChange={setPeriodFilter}
                  visibleAgencyIds={visibleAgencyIds}
                />
              </div>

              {/* En-tête section */}
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 rounded-full bg-violet-600" />
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Liste des incidents</span>
                </div>
                <span className="text-xs text-gray-400 font-medium">
                  {filteredIncidents.length} incident{filteredIncidents.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Contenu */}
              {filteredIncidents.length === 0 ? (
                <div className="p-12 text-center">
                  <AlertTriangle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium text-sm">Aucun incident trouvé</p>
                  <p className="text-gray-400 text-xs mt-1">Aucun incident ne correspond aux filtres sélectionnés.</p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {filteredIncidents.map((incident) => (
                    <IncidentCard
                      key={incident.id}
                      incident={incident}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Onglet Statistiques ── */}
          {tab === 'stats' && (
            <>
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-violet-600" />
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Analyse statistique des incidents</span>
                <span className="text-xs text-gray-400 ml-auto">{visibleIncidents.length} incident{visibleIncidents.length !== 1 ? 's' : ''} analysé{visibleIncidents.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="p-4">
                <IncidentStats incidents={visibleIncidents} />
              </div>
            </>
          )}

          {/* ── Onglet Assurances ── */}
          {tab === 'insurance' && (
            <>
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-violet-600" />
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Dossiers assurance</span>
                <span className="text-xs text-gray-400 ml-auto">
                  {filteredIncidents.filter((i) => i.insuranceReference).length} dossier{filteredIncidents.filter((i) => i.insuranceReference).length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="p-4">
                <InsuranceTable incidents={filteredIncidents.filter((i) => i.insuranceReference !== null)} />
              </div>
            </>
          )}
        </div>
      </div>

      {showForm && (
        <IncidentForm
          incident={editingIncident ?? undefined}
          onClose={handleClose}
          onSave={handleSave}
        />
      )}
    </>
  )
}
