import { Search } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

type FuelTypeFilter = 'ALL' | 'DIESEL' | 'HYBRID' | 'ELECTRIC'
type PeriodFilter = 'CURRENT_MONTH' | 'PREVIOUS_MONTH' | 'LAST_3_MONTHS' | 'CURRENT_YEAR'

interface FuelFiltersProps {
  search: string
  onSearchChange: (v: string) => void
  fuelTypeFilter: FuelTypeFilter
  onFuelTypeChange: (v: FuelTypeFilter) => void
  agencyFilter: string
  onAgencyChange: (v: string) => void
  periodFilter: PeriodFilter
  onPeriodChange: (v: PeriodFilter) => void
  visibleAgencyIds: string[]
}

export default function FuelFilters({
  search,
  onSearchChange,
  fuelTypeFilter,
  onFuelTypeChange,
  agencyFilter,
  onAgencyChange,
  periodFilter,
  onPeriodChange,
  visibleAgencyIds,
}: FuelFiltersProps) {
  const { agencies } = useAppStore()
  const visibleAgencies = agencies.filter((a) => visibleAgencyIds.includes(a.id))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

        {/* Recherche texte */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Immatriculation, conducteur, station..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
        </div>

        {/* Filtre type carburant */}
        <select
          value={fuelTypeFilter}
          onChange={(e) => onFuelTypeChange(e.target.value as FuelTypeFilter)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="ALL">Tous carburants</option>
          <option value="DIESEL">Diesel</option>
          <option value="HYBRID">Hybride</option>
          <option value="ELECTRIC">Electrique</option>
        </select>

        {/* Filtre agence — restreint aux agences visibles selon le rôle */}
        <select
          value={agencyFilter}
          onChange={(e) => onAgencyChange(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">Toutes les agences</option>
          {visibleAgencies.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>

        {/* Filtre période */}
        <select
          value={periodFilter}
          onChange={(e) => onPeriodChange(e.target.value as PeriodFilter)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="CURRENT_MONTH">Ce mois</option>
          <option value="PREVIOUS_MONTH">Mois precedent</option>
          <option value="LAST_3_MONTHS">3 derniers mois</option>
          <option value="CURRENT_YEAR">Cette annee</option>
        </select>

        {/* Reset */}
        <button
          onClick={() => {
            onSearchChange('')
            onFuelTypeChange('ALL')
            onAgencyChange('')
            onPeriodChange('CURRENT_MONTH')
          }}
          className="px-4 py-2 text-sm font-medium text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
        >
          Reinitialiser
        </button>

      </div>
    </div>
  )
}
