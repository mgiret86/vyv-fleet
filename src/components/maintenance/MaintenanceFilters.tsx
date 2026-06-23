import { Search } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

interface MaintenanceFiltersProps {
  search: string
  onSearchChange: (v: string) => void
  statusFilter: string
  onStatusChange: (v: string) => void
  typeFilter: string
  onTypeChange: (v: string) => void
  agencyFilter: string
  onAgencyChange: (v: string) => void
  periodFilter: string
  onPeriodChange: (v: string) => void
  visibleAgencyIds: string[]
}

export default function MaintenanceFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  agencyFilter,
  onAgencyChange,
  periodFilter,
  onPeriodChange,
  visibleAgencyIds,
}: MaintenanceFiltersProps) {
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
            placeholder="Immatriculation, label, prestataire..."
            className="bg-transparent text-sm outline-none w-full text-gray-700 placeholder-gray-400"
          />
        </div>

        {/* Filtre statut */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="ALL">Tous statuts</option>
          <option value="SCHEDULED">Planifiee</option>
          <option value="IN_PROGRESS">En cours</option>
          <option value="COMPLETED">Terminee</option>
          <option value="CANCELLED">Annulee</option>
        </select>

        {/* Filtre type */}
        <select
          value={typeFilter}
          onChange={(e) => onTypeChange(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="ALL">Tous types</option>
          <option value="PREVENTIVE">Preventive</option>
          <option value="CORRECTIVE">Corrective</option>
          <option value="REGULATORY">Reglementaire</option>
          <option value="SANITAIRE">Sanitaire</option>
        </select>

        {/* Filtre agence — restreint aux agences visibles selon le rôle */}
        <select
          value={agencyFilter}
          onChange={(e) => onAgencyChange(e.target.value)}
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
          onChange={(e) => onPeriodChange(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="ALL">Toute periode</option>
          <option value="CURRENT_MONTH">Ce mois</option>
          <option value="NEXT_3_MONTHS">3 prochains mois</option>
          <option value="LAST_30_DAYS">30 derniers jours</option>
        </select>

      </div>
    </div>
  )
}
