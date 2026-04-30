import { Search } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import type { IncidentType, IncidentSeverity, IncidentStatus, PeriodFilter } from '@/data/mockIncidents'

interface IncidentFiltersProps {
  search: string
  onSearchChange: (v: string) => void
  typeFilter: IncidentType | 'ALL'
  onTypeFilterChange: (v: IncidentType | 'ALL') => void
  severityFilter: IncidentSeverity | 'ALL'
  onSeverityFilterChange: (v: IncidentSeverity | 'ALL') => void
  statusFilter: IncidentStatus | 'ALL'
  onStatusFilterChange: (v: IncidentStatus | 'ALL') => void
  agencyFilter: string
  onAgencyFilterChange: (v: string) => void
  periodFilter: PeriodFilter
  onPeriodFilterChange: (v: PeriodFilter) => void
  visibleAgencyIds: string[]
}

export default function IncidentFilters({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  severityFilter,
  onSeverityFilterChange,
  statusFilter,
  onStatusFilterChange,
  agencyFilter,
  onAgencyFilterChange,
  periodFilter,
  onPeriodFilterChange,
  visibleAgencyIds,
}: IncidentFiltersProps) {
  const { agencies } = useAppStore()
  const visibleAgencies = agencies.filter((a) => visibleAgencyIds.includes(a.id))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
      <div className="flex flex-wrap gap-3 items-center">

        {/* Recherche texte */}
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-48">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Immat, conducteur, ref assurance..."
            className="bg-transparent text-sm outline-none w-full text-gray-700 placeholder-gray-400"
          />
        </div>

        {/* Filtre type */}
        <select
          value={typeFilter}
          onChange={(e) => onTypeFilterChange(e.target.value as IncidentType | 'ALL')}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="ALL">Tous types</option>
          <option value="ACCIDENT">Accident</option>
          <option value="THEFT">Vol</option>
          <option value="VANDALISM">Vandalisme</option>
          <option value="BREAKDOWN">Panne</option>
        </select>

        {/* Filtre sévérité */}
        <select
          value={severityFilter}
          onChange={(e) => onSeverityFilterChange(e.target.value as IncidentSeverity | 'ALL')}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="ALL">Toutes severites</option>
          <option value="CRITICAL">Critique</option>
          <option value="MAJOR">Majeur</option>
          <option value="MINOR">Mineur</option>
        </select>

        {/* Filtre statut */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as IncidentStatus | 'ALL')}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="ALL">Tous statuts</option>
          <option value="OPEN">Ouvert</option>
          <option value="IN_PROGRESS">En cours</option>
          <option value="CLOSED">Clos</option>
        </select>

        {/* Filtre agence — restreint aux agences visibles selon le rôle */}
        <select
          value={agencyFilter}
          onChange={(e) => onAgencyFilterChange(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">Toutes les agences</option>
          {visibleAgencies.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>

        {/* Filtre période */}
        <select
          value={periodFilter}
          onChange={(e) => onPeriodFilterChange(e.target.value as PeriodFilter)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="ALL">Toute periode</option>
          <option value="THIS_MONTH">Ce mois</option>
          <option value="LAST_3_MONTHS">3 derniers mois</option>
          <option value="THIS_YEAR">Cette annee</option>
        </select>

      </div>
    </div>
  )
}
