import React from 'react'
import { Link } from 'react-router-dom'
import { Car } from 'lucide-react'
import type { Vehicle } from '@/types'
import VehicleStatusBadge from './VehicleStatusBadge'
import { useVehicleCategoryStore, getCategoryColor } from '@/store/vehicleCategoryStore'

interface VehicleTableProps {
  vehicles: Vehicle[]
  actionColumns?: {
    id:     string
    header: string
    cell:   (vehicle: Vehicle) => React.ReactNode
  }[]
}

// ── Colonnes de base ───────────────────────────────────────────────
const BASE_COLUMNS = [
  {
    id: 'registration',
    header: 'Immatriculation',
    cell: (v: Vehicle) => (
      <Link
        to={`/vehicles/${v.id}`}
        className="inline-flex items-center gap-1.5 font-mono font-bold text-violet-600 hover:text-violet-800 hover:underline underline-offset-2 transition-colors text-sm"
      >
        {v.registration}
      </Link>
    ),
  },
  {
    id: 'brandModel',
    header: 'Marque / Modèle',
    cell: (v: Vehicle) => (
      <div>
        <p className="text-sm font-semibold text-gray-900">{v.brand}</p>
        <p className="text-xs text-gray-400">{v.model}</p>
      </div>
    ),
  },
  {
    id: 'status',
    header: 'Statut',
    cell: (v: Vehicle) => <VehicleStatusBadge status={v.status} />,
  },
  {
    id: 'agency',
    header: 'Agence',
    cell: (v: Vehicle) => (
      <span className="text-sm text-gray-600 font-medium">{v.agencyName}</span>
    ),
  },
  {
    id: 'mileage',
    header: 'Kilométrage',
    cell: (v: Vehicle) => (
      <span className="text-sm font-semibold text-gray-800 tabular-nums">
        {v.mileage.toLocaleString('fr-FR')} <span className="text-xs font-normal text-gray-400">km</span>
      </span>
    ),
  },
  {
    id: 'nextMaintenanceDate',
    header: 'Prochaine maintenance',
    cell: (v: Vehicle) => {
      if (!v.nextMaintenanceDate) {
        return <span className="text-xs text-gray-400 italic">Non planifiée</span>
      }
      const days = Math.ceil((new Date(v.nextMaintenanceDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      const badge =
        days < 0    ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 ml-1.5">Dépassé</span> :
        days <= 30  ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 ml-1.5">J-{days}</span> :
        days <= 90  ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 ml-1.5">J-{days}</span> :
                      null
      return (
        <div className="flex items-center flex-wrap gap-1">
          <span className="text-sm text-gray-700">
            {new Date(v.nextMaintenanceDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </span>
          {badge}
        </div>
      )
    },
  },
]

export default function VehicleTable({ vehicles, actionColumns = [] }: VehicleTableProps) {
  const { getActive } = useVehicleCategoryStore()
  const categories    = getActive()

  if (vehicles.length === 0) {
    return (
      <div className="py-16 text-center">
        <Car className="w-10 h-10 text-gray-200 mx-auto mb-3" />
        <p className="text-sm font-semibold text-gray-500">Aucun véhicule trouvé</p>
        <p className="text-xs text-gray-400 mt-1">Modifiez les filtres ou ajoutez un véhicule</p>
      </div>
    )
  }

  const allColumns = [...BASE_COLUMNS, ...actionColumns]

  // ── Regroupement dynamique dans l'ordre des catégories du store ──
  const knownIds = new Set(categories.map((c) => c.id))

  const grouped = categories.reduce<{ id: string; label: string; color: string; vehicles: Vehicle[] }[]>(
    (acc, cat) => {
      const group = vehicles.filter((v) => v.category === cat.id)
      if (group.length > 0) acc.push({ id: cat.id, label: cat.label, color: cat.color, vehicles: group })
      return acc
    },
    []
  )

  const orphans = vehicles.filter((v) => !knownIds.has(v.category))
  if (orphans.length > 0) {
    grouped.push({ id: '__orphan__', label: 'Catégorie inconnue', color: 'gray', vehicles: orphans })
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">

        {/* ── En-tête global ── */}
        <thead>
          <tr className="border-b border-gray-100">
            {allColumns.map((col) => (
              <th
                key={col.id}
                scope="col"
                className="px-5 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/60 first:rounded-tl-lg last:rounded-tr-lg"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="bg-white">
          {grouped.map(({ id, label, color, vehicles: group }) => {
            const cfg = getCategoryColor(color)
            return (
              <React.Fragment key={id}>

                {/* ── En-tête de groupe catégorie ── */}
                <tr>
                  <td
                    colSpan={allColumns.length}
                    className="px-5 py-2 bg-gray-50/80 border-y border-gray-100"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        {label}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-500 text-[10px] font-bold leading-none">
                        {group.length}
                      </span>
                    </div>
                  </td>
                </tr>

                {/* ── Lignes du groupe ── */}
                {group.map((vehicle, idx) => (
                  <tr
                    key={vehicle.id}
                    className={`group hover:bg-violet-50/30 transition-colors ${
                      idx < group.length - 1 ? 'border-b border-gray-50' : 'border-b border-gray-100'
                    }`}
                  >
                    {allColumns.map((col) => (
                      <td
                        key={col.id}
                        className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-700"
                      >
                        {col.cell(vehicle)}
                      </td>
                    ))}
                  </tr>
                ))}

              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
