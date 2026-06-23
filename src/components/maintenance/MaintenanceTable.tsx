import { Link } from 'react-router-dom'
import { MessageSquare, Wrench, Edit, Trash2 } from 'lucide-react'
import MaintenanceTypeBadge from './MaintenanceTypeBadge'
import type { MaintenanceRecord } from '@/types'

// ── Config statuts ─────────────────────────────────────────────────
const STATUS_CONFIG = {
  SCHEDULED:   { badge: 'bg-blue-100 text-blue-700 border-blue-200',     label: 'Planifiée'   },
  IN_PROGRESS: { badge: 'bg-amber-100 text-amber-700 border-amber-200',  label: 'En cours'    },
  COMPLETED:   { badge: 'bg-green-100 text-green-700 border-green-200',  label: 'Terminée'    },
  CANCELLED:   { badge: 'bg-gray-100 text-gray-500 border-gray-200',     label: 'Annulée'     },
} as const

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function getDateBadge(scheduledDate: string | null, status: string): React.ReactNode {
  if (status === 'COMPLETED' || status === 'CANCELLED') {
    return <span className="text-sm text-gray-400">{formatDate(scheduledDate)}</span>
  }
  if (!scheduledDate) return <span className="text-sm text-gray-400">—</span>
  const date = new Date(scheduledDate)
  if (isNaN(date.getTime())) return <span className="text-sm text-gray-400">—</span>

  const diffDays = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const formatted = formatDate(scheduledDate)

  if (diffDays < 0) return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm font-semibold text-red-600">{formatted}</span>
      <span className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full w-fit">Dépassé</span>
    </div>
  )
  if (diffDays <= 7) return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm font-semibold text-amber-600">{formatted}</span>
      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full w-fit">J-{diffDays}</span>
    </div>
  )
  return <span className="text-sm text-gray-700">{formatted}</span>
}

interface MaintenanceTableProps {
  filtered: MaintenanceRecord[]
  onEdit:   (m: MaintenanceRecord) => void
  onDelete: (m: MaintenanceRecord) => void
}

export default function MaintenanceTable({ filtered, onEdit, onDelete }: MaintenanceTableProps) {
  if (filtered.length === 0) {
    return (
      <div className="py-16 text-center">
        <Wrench className="w-10 h-10 text-gray-200 mx-auto mb-3" />
        <p className="text-sm font-semibold text-gray-500">Aucune maintenance trouvée</p>
        <p className="text-xs text-gray-400 mt-1">Modifiez les filtres ou planifiez une intervention</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">

        {/* ── En-tête ── */}
        <thead>
          <tr className="border-b border-gray-100">
            {[
              'Date plan.',
              'Immat.',
              'Véhicule',
              'Agence',
              'Type',
              'Intervention',
              'Prestataire',
              'Coût est.',
              'Coût réel',
              'Statut',
              'Notes',
              'Actions',
            ].map((h, i) => (
              <th
                key={h}
                scope="col"
                className={`px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/60 whitespace-nowrap ${
                  i >= 6 ? 'text-right' : 'text-left'
                } ${i === 10 || i === 11 ? 'text-center' : ''}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-50">
          {filtered.map((m) => {
            const statusCfg = STATUS_CONFIG[m.status] ?? STATUS_CONFIG.SCHEDULED

            const costDiff =
              m.realCost != null && m.estimatedCost != null
                ? m.realCost - m.estimatedCost
                : null
            const gapColor =
              costDiff === null ? 'text-gray-700' :
              costDiff > 0     ? 'text-red-600 font-bold' :
              costDiff < 0     ? 'text-green-600 font-bold' :
                                 'text-gray-700'

            return (
              <tr key={m.id} className="hover:bg-violet-50/20 transition-colors group">

                {/* Date planifiée */}
                <td className="px-4 py-3 whitespace-nowrap">
                  {getDateBadge(m.scheduledDate, m.status)}
                </td>

                {/* Immatriculation */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <Link
                    to={`/vehicles/${m.vehicleId}`}
                    className="font-mono font-bold text-violet-600 hover:text-violet-800 hover:underline underline-offset-2 transition-colors text-sm"
                  >
                    {m.vehicleRegistration}
                  </Link>
                </td>

                {/* Marque / Modèle */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{m.vehicleBrand}</p>
                    <p className="text-xs text-gray-400">{m.vehicleModel}</p>
                  </div>
                </td>

                {/* Agence */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-xs text-gray-500 font-medium">
                    {(m.agencyName ?? '').replace('VYV Ambulance ', '')}
                  </span>
                </td>

                {/* Type */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <MaintenanceTypeBadge type={m.type} />
                </td>

                {/* Label intervention */}
                <td className="px-4 py-3 max-w-[180px]">
                  <span className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">{m.label}</span>
                </td>

                {/* Prestataire */}
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  <span className="text-xs text-gray-500">{m.provider ?? '—'}</span>
                </td>

                {/* Coût estimé */}
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  {m.estimatedCost != null
                    ? <span className="text-sm font-semibold text-gray-800 tabular-nums">{m.estimatedCost.toLocaleString('fr-FR')} <span className="text-xs font-normal text-gray-400">€</span></span>
                    : <span className="text-sm text-gray-300">—</span>
                  }
                </td>

                {/* Coût réel */}
                <td className="px-4 py-3 whitespace-nowrap text-right">
                  {m.status === 'COMPLETED' && m.realCost != null
                    ? <span className={`text-sm tabular-nums ${gapColor}`}>{m.realCost.toLocaleString('fr-FR')} <span className="text-xs font-normal">€</span></span>
                    : <span className="text-sm text-gray-300">—</span>
                  }
                </td>

                {/* Statut */}
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <span className={`inline-flex text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusCfg.badge}`}>
                    {statusCfg.label}
                  </span>
                </td>

                {/* Notes tooltip */}
                <td className="px-4 py-3 text-center">
                  {m.notes ? (
                    <div className="relative group/note inline-block">
                      <div className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-violet-100 flex items-center justify-center cursor-default transition-colors">
                        <MessageSquare className="w-3.5 h-3.5 text-gray-400 group-hover/note:text-violet-500 transition-colors" />
                      </div>
                      <div className="hidden group-hover/note:block absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-xl whitespace-nowrap max-w-56 shadow-xl pointer-events-none leading-relaxed">
                        {m.notes}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-200">—</span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onEdit(m)}
                      className="w-7 h-7 rounded-lg hover:bg-violet-100 flex items-center justify-center text-gray-400 hover:text-violet-600 transition-colors"
                      title="Modifier"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(m)}
                      className="w-7 h-7 rounded-lg hover:bg-red-100 flex items-center justify-center text-gray-400 hover:text-red-600 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
