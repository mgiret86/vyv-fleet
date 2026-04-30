import { useState, useMemo, useEffect, useCallback } from 'react'
import { AlertTriangle, Plus } from 'lucide-react'
import { useAgencyFilter } from '@/hooks/useAgencyFilter'
import IncidentKPI from '@/components/incidents/IncidentKPI'
import IncidentFilters from '@/components/incidents/IncidentFilters'
import IncidentCard from '@/components/incidents/IncidentCard'
import IncidentStats from '@/components/incidents/IncidentStats'
import InsuranceTable from '@/components/incidents/InsuranceTable'
import IncidentForm from '@/components/incidents/IncidentForm'
import { incidentService } from '@/lib/services'
import type { IncidentType, IncidentSeverity, IncidentStatus, PeriodFilter } from '@/data/mockIncidents'

type Tab = 'incidents' | 'stats' | 'insurance'

export default function Incidents() {
  const { filterByAgency, visibleAgencyIds } = useAgencyFilter()

  const [incidents,      setIncidents]      = useState<any[]>([])
  const [tab,            setTab]            = useState<Tab>('incidents')
  const [search,         setSearch]         = useState('')
  const [typeFilter,     setTypeFilter]     = useState<IncidentType | 'ALL'>('ALL')
  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity | 'ALL'>('ALL')
  const [statusFilter,   setStatusFilter]   = useState<IncidentStatus | 'ALL'>('ALL')
  const [agencyFilter,   setAgencyFilter]   = useState('')
  const [periodFilter,   setPeriodFilter]   = useState<PeriodFilter>('ALL')
  const [showForm,        setShowForm]        = useState(false)
  const [editingIncident, setEditingIncident] = useState<any | null>(null)

  const fetchIncidents = useCallback(async () => {
    try {
      const data = await incidentService.list()
      setIncidents(data)
    } catch (e) { console.error(e) }
  }, [])

  useEffect(() => { fetchIncidents() }, [fetchIncidents])

  const visibleIncidents = useMemo(
    () => filterByAgency(incidents),
    [incidents, filterByAgency]
  )

  const filteredIncidents = useMemo(() => {
    const now = new Date()
    return filterByAgency(incidents).filter((incident) => {
      if (search) {
        const lower = search.toLowerCase()
        const match =
          (incident.description ?? '').toLowerCase().includes(lower) ||
          (incident.vehicleRegistration ?? '').toLowerCase().includes(lower) ||
          (incident.driverName ?? '').toLowerCase().includes(lower) ||
          (incident.insuranceReference ?? '').toLowerCase().includes(lower)
        if (!match) return false
      }
      if (typeFilter     !== 'ALL' && incident.type     !== typeFilter)     return false
      if (severityFilter !== 'ALL' && incident.severity !== severityFilter) return false
      if (statusFilter   !== 'ALL' && incident.status   !== statusFilter)   return false
      if (agencyFilter   !== ''    && incident.agencyId !== agencyFilter)   return false
      if (periodFilter !== 'ALL') {
        const incidentDate = new Date(incident.date)
        const thisYear     = now.getFullYear()
        const thisMonth    = now.getMonth()
        if (periodFilter === 'THIS_MONTH') {
          if (incidentDate.getFullYear() !== thisYear || incidentDate.getMonth() !== thisMonth) return false
        }
        if (periodFilter === 'LAST_3_MONTHS') {
          const limit = new Date(now)
          limit.setMonth(limit.getMonth() - 3)
          if (incidentDate < limit) return false
        }
        if (periodFilter === 'THIS_YEAR') {
          if (incidentDate.getFullYear() !== thisYear) return false
        }
      }
      return true
    })
  }, [incidents, search, typeFilter, severityFilter, statusFilter, agencyFilter, periodFilter, filterByAgency])

  const handleNew  = () => { setEditingIncident(null); setShowForm(true) }
  const handleEdit = (incident: any) => { setEditingIncident(incident); setShowForm(true) }
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
      setShowForm(false)
      setEditingIncident(null)
    } catch (e) { console.error(e) }
  }
  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cet incident ?')) return
    try {
      await incidentService.remove(id)
      setIncidents((prev) => prev.filter((i) => i.id !== id))
    } catch (e) { console.error(e) }
  }
  const handleClose = () => { setShowForm(false); setEditingIncident(null) }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-violet-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sinistres & Accidents</h1>
              <p className="text-sm text-gray-500 mt-0.5">Gestion et suivi des incidents de la flotte</p>
            </div>
          </div>
          <button
            onClick={handleNew}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouveau sinistre
          </button>
        </div>

        <IncidentKPI incidents={visibleIncidents} />

        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          {(['incidents', 'stats', 'insurance'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'incidents' ? 'Incidents' : t === 'stats' ? 'Statistiques' : 'Assurances'}
            </button>
          ))}
        </div>

        {tab === 'incidents' && (
          <div className="space-y-4">
            <IncidentFilters
              search={search}
              onSearchChange={setSearch}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
              severityFilter={severityFilter}
              onSeverityFilterChange={setSeverityFilter}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              agencyFilter={agencyFilter}
              onAgencyFilterChange={setAgencyFilter}
              periodFilter={periodFilter}
              onPeriodFilterChange={setPeriodFilter}
              visibleAgencyIds={visibleAgencyIds}
            />
            <div className="space-y-3">
              {filteredIncidents.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  Aucun incident ne correspond aux filtres selectionnes.
                </div>
              ) : (
                filteredIncidents.map((incident) => (
                  <IncidentCard key={incident.id} incident={incident} onEdit={handleEdit} onDelete={handleDelete} />
                ))
              )}
            </div>
          </div>
        )}

        {tab === 'stats' && <IncidentStats incidents={visibleIncidents} />}

        {/* InsuranceTable reçoit la prop incidents obligatoire */}
        {tab === 'insurance' && (
          <InsuranceTable incidents={filteredIncidents.filter((i) => i.insuranceReference !== null)} />
        )}
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
