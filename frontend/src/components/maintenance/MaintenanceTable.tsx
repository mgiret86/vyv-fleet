import { Link } from 'react-router-dom'
import { MessageSquare, Wrench, Edit, Trash2 } from 'lucide-react'
import MaintenanceTypeBadge from './MaintenanceTypeBadge'
import type { MaintenanceRecord } from '@/types'

const statusColors = {
  SCHEDULED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-orange-100 text-orange-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
} as const

const statusLabels = {
  SCHEDULED: 'Planifiee',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminee',
  CANCELLED: 'Annulee',
} as const

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function getDateCellColor(scheduledDate: string | null, status: string): string {
  if (status === 'COMPLETED' || status === 'CANCELLED') return 'text-gray-400'
  // Ensure scheduledDate is defined before creating a Date object
  if (!scheduledDate) return 'text-gray-600'

  const now = new Date()
  const date = new Date(scheduledDate)
  // Check if date is valid
  if (isNaN(date.getTime())) return 'text-gray-600'

  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'text-red-600 font-semibold'
  if (diffDays <= 7) return 'text-orange-600 font-semibold'
  return 'text-gray-600'
}

interface MaintenanceTableProps {
  filtered: MaintenanceRecord[]
  onEdit: (m: MaintenanceRecord) => void
  onDelete: (m: MaintenanceRecord) => void
}

export default function MaintenanceTable({ filtered, onEdit, onDelete }: MaintenanceTableProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date plan.</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Immat.</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vehicule</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Agence</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Intervention</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Prestataire</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cout est.</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Couteel</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(m => {
              const dateColor = getDateCellColor(m.scheduledDate, m.status)

              // Compute cost gap and choose a color to signal over/under budget
              const costDiff =
                m.realCost != null && m.estimatedCost != null
                  ? m.realCost - m.estimatedCost
                  : null
              const gapColor =
                costDiff !== null
                  ? costDiff > 0
                    ? 'text-red-600'
                    : costDiff < 0
                    ? 'text-green-600'
                    : 'text-gray-600'
                  : ''

              return (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  {/* Scheduled date — coloured when overdue or approaching */}
                  <td className={`px-4 py-3 font-medium ${dateColor}`}>
                    {formatDate(m.scheduledDate)}
                  </td>

                  {/* Registration plate linked to the vehicle detail page */}
                  <td className="px-4 py-3">
                    <Link
                      to={`/vehicles/${m.vehicleId}`}
                      className="font text-violet-600 hover:text-violet-700"
                    >
                      {m.vehicleRegistration}
                    </Link>
                  </td>

                  <td className="px-4 py-3 text-gray-600">
                    {m.vehicleBrand} {m.vehicleModel}
                  </td>

                  {/* Strip the common prefix to keep cells compact */}
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {(m.agencyName ?? '').replace('VYV Ambulance ', '')}
                  </td>

                  <td className="px-4 py-3">
                    <MaintenanceTypeBadge type={m.type} />
                  </td>

                  <td className="px-4 py-3 text-gray-800 font-medium">{m.label}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{m.provider ?? '-'}</td>

                  <td className="px-4 py-3 text-right text-gray-900 font-medium">
                    {m.estimatedCost !== null
                      ? `${(m.estimatedCost ?? 0).toLocaleString('fr-FR')} €`
                      : '-'}
                  </td>

                  {/* Real cost shown only when maintenance is completed */}
                  <td className={`px-4 py-3 text-right font-medium ${gapColor}`}>
                    {m.status === 'COMPLETED' && m.realCost !== null
                      ? `${(m.realCost ?? 0).toLocaleString('fr-FR')} €`
                      : '-'}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[m.status]}`}
                    >
                      {statusLabels[m.status]}
                    </span>
                  </td>

                  {/* Notes revealed on hover via a simple CSS tooltip */}
                  <td className="px-4 py">
                    {m.notes && (
                      <div className="relative group inline-block">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        <div className="hidden group-hover:block absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap max-w-48">
                          {m.notes}
                        </div>
                      </div>
                    )}
                  </td>

                  {/* CRUD action buttons */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onEdit(m)}
                        className="p-1.5 rounded-lg hover:bg-violet-50 text-gray-400 hover:text-violet-600 transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(m)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Empty state displayed when the filtered list is empty */}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Wrench className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucune maintenance trouvee</p>
          </div>
        )}
      </div>
    </div>
  )
}
