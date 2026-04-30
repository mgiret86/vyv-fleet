import { useAppStore } from '@/store/useAppStore'
import type { VehicleStatus, VehicleCategory } from '@/types'

interface Props {
  search: string
  onSearchChange: (v: string) => void
  statusFilter: VehicleStatus | 'ALL'
  onStatusChange: (v: VehicleStatus | 'ALL') => void
  categoryFilter: VehicleCategory | 'ALL'
  onCategoryChange: (v: VehicleCategory | 'ALL') => void
  agencyFilter: string
  onAgencyChange: (v: string) => void
  vehicleCount: number
  visibleAgencyIds: string[]
}

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tous' },
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'MAINTENANCE', label: 'En maintenance' },
  { value: 'IMMOBILIZED', label: 'Immobilise' },
  { value: 'DECOMMISSIONED', label: 'Reforme' },
] as const

const CATEGORY_OPTIONS = [
  { value: 'ALL', label: 'Tous' },
  { value: 'AMBULANCE_A', label: 'Ambulance A' },
  { value: 'AMBULANCE_B', label: 'Ambulance B' },
  { value: 'VSL', label: 'VSL' },
  { value: 'TPMR', label: 'TPMR' },
  { value: 'TAXI', label: 'Taxi' },
  { value: 'SERVICE', label: 'Service' },
] as const

export default function VehicleFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  categoryFilter,
  onCategoryChange,
  agencyFilter,
  onAgencyChange,
  vehicleCount,
  visibleAgencyIds,
}: Props) {
  const { agencies } = useAppStore()
  const visibleAgencies = agencies.filter((a) => visibleAgencyIds.includes(a.id))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
      <div className="flex flex-wrap items-center gap-4">

        {/* Recherche texte */}
        <div className="flex-1 min-w-64">
          <input
            type="text"
            placeholder="Recherche immatriculation, marque, modele..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Filtre statut */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as VehicleStatus | 'ALL')}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Filtre catégorie */}
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value as VehicleCategory | 'ALL')}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Filtre agence — restreint aux agences visibles selon le rôle */}
        <select
          value={agencyFilter}
          onChange={(e) => onAgencyChange(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">Toutes les agences</option>
          {visibleAgencies.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        {/* Compteur véhicules */}
        <span className="text-sm text-gray-500 whitespace-nowrap">
          {vehicleCount} vehicule(s) affiche(s)
        </span>

      </div>
    </div>
  )
}
