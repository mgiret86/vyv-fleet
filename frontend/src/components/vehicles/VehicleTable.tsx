import React from 'react'
import { Link } from 'react-router-dom'
import type { Vehicle } from '@/types'
import VehicleCategoryBadge from './VehicleCategoryBadge'
import VehicleStatusBadge from './VehicleStatusBadge'

interface VehicleTableProps {
  vehicles: Vehicle[]
  actionColumns?: {
    id: string
    header: string
    cell: (vehicle: Vehicle) => React.ReactNode
  }[]
}

export default function VehicleTable({ vehicles, actionColumns = [] }: VehicleTableProps) {
  if (vehicles.length === 0) {
    return (
      <div className="p-6 text-center text-gray-600">
        Aucun vehicule trouve.
      </div>
    )
  }

  const baseColumns = [
    {
      id: 'registration',
      header: 'Immatriculation',
      cell: (vehicle: Vehicle) => (
        <Link to={`/vehicles/${vehicle.id}`} className="text-violet-600 hover:underline font-medium">
          {vehicle.registration}
        </Link>
      ),
    },
    {
      id: 'brandModel',
      header: 'Marque et Modele',
      cell: (vehicle: Vehicle) => `${vehicle.brand} ${vehicle.model}`,
    },
    {
      id: 'category',
      header: 'Categorie',
      cell: (vehicle: Vehicle) => <VehicleCategoryBadge category={vehicle.category} />,
    },
    {
      id: 'status',
      header: 'Statut',
      cell: (vehicle: Vehicle) => <VehicleStatusBadge status={vehicle.status} />,
    },
    {
      id: 'agency',
      header: 'Agence',
      cell: (vehicle: Vehicle) => vehicle.agencyName,
    },
    {
      id: 'mileage',
      header: 'Kilometrage',
      cell: (vehicle: Vehicle) => `${vehicle.mileage.toLocaleString()} km`,
    },
    {
      id: 'nextMaintenanceDate', // Changed from nextMaintenance
      header: 'Prochaine maintenance',
      cell: (vehicle: Vehicle) => vehicle.nextMaintenanceDate ?? 'Non planifiee', // Changed from nextMaintenance
    },
  ]

  const allColumns = [...baseColumns, ...actionColumns]

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {allColumns.map((column) => (
              <th
                key={column.id}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {vehicles.map((vehicle) => (
            <tr key={vehicle.id}>
              {allColumns.map((column) => (
                <td key={column.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                  {column.cell(vehicle)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
