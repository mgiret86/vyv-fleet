import { useAppStore } from '@/store/useAppStore'
import type { VehicleStatus } from '@/types'

interface Props {
  search:        string
  onSearchChange:(v: string) => void
  statusFilter:  VehicleStatus | 'ALL'
  onStatusChange:(v: VehicleStatus | 'ALL') => void
  agencyFilter:  string
  onAgencyChange:(v: string) => void
  vehicleCount:  number
  visibleAgencyIds: string[]
}

const STATUS_OPTIONS = [
  { value: 'ALL',              label: 'Tous les statuts'  },
  { value: 'ACTIVE',           label: 'Actif'             },
  { value: 'MAINTENANCE',      label: 'En maintenance'    },
  { value: 'IMMOBILIZED',      label: 'Immobilisé'        },
  { value: 'DECOMMISSIONED',   label: 'Réformé'           },
  { value: 'PENDING_APPROVAL', label: 'En attente'        },
  { value: 'IN_TRANSFER',      label: 'En transfert'      },
] as const

export default function VehicleFilters({
  search, onSearchChange,
  statusFilter, onStatusChange,
  agencyFilter, onAgencyChange,
  vehicleCount, visibleAgencyIds,
}: Props) {
  const { agencies } = useAppStore()
  const visibleAgencies = agencies.filter((a) => visibleAgencyIds.includes(a.id))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
      <div className="flex flex-wrap items-center gap-3">

        {/* Recherche texte */}
        <div className="flex-1 min-w-52">
          <input
            type="text"
            placeholder="Immatriculation, marque, modèle..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Filtre statut */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as VehicleStatus | 'ALL')}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-gray-700"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Filtre agence */}
        {visibleAgencies.length > 1 && (
          <select
            value={agencyFilter}
            onChange={(e) => onAgencyChange(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 text-gray-700"
          >
            <option value="">Toutes les agences</option>
            {visibleAgencies.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        )}

        {/* Compteur */}
        <span className="text-sm text-gray-400 whitespace-nowrap ml-auto">
          {vehicleCount} véhicule{vehicleCount > 1 ? 's' : ''}
        </span>

      </div>
    </div>
  )
}
