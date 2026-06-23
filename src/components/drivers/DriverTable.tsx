import { Link } from 'react-router-dom'
import { Edit, Trash2, Users } from 'lucide-react'
import type { Driver } from '@/types'

// ── Config ─────────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  AMBULANCIER_DE:         'Ambulancier DE',
  AUXILIAIRE_AMBULANCIER: 'Auxiliaire Ambulancier',
  CHAUFFEUR_VSL:          'Chauffeur VSL',
  OTHER:                  'Autre',
}

const CONTRACT_LABELS: Record<string, string> = {
  CDI:     'CDI',
  CDD:     'CDD',
  INTERIM: 'Intérim',
}

const ROLE_COLORS: Record<string, string> = {
  AMBULANCIER_DE:         'bg-red-100 text-red-700 border-red-200',
  AUXILIAIRE_AMBULANCIER: 'bg-orange-100 text-orange-700 border-orange-200',
  CHAUFFEUR_VSL:          'bg-blue-100 text-blue-700 border-blue-200',
  OTHER:                  'bg-gray-100 text-gray-600 border-gray-200',
}

const STATUS_CONFIG: Record<string, { badge: string; dot: string; label: string }> = {
  ACTIVE:    { badge: 'bg-green-100 text-green-700 border-green-200',   dot: 'bg-green-500',  label: 'Actif'     },
  SUSPENDED: { badge: 'bg-red-100 text-red-700 border-red-200',         dot: 'bg-red-500',    label: 'Suspendu'  },
  LEAVE:     { badge: 'bg-amber-100 text-amber-700 border-amber-200',   dot: 'bg-amber-500',  label: 'Congé'     },
  INACTIVE:  { badge: 'bg-gray-100 text-gray-500 border-gray-200',      dot: 'bg-gray-400',   label: 'Inactif'   },
}

// ── Helpers ────────────────────────────────────────────────────────
function getDaysUntil(dateStr: string): number {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

// ── Cellule expiration ─────────────────────────────────────────────
function ExpiryCell({ dateStr }: { dateStr?: string | null }) {
  if (!dateStr) return <span className="text-gray-300 text-sm">—</span>
  const days = getDaysUntil(dateStr)

  if (days < 0) return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm font-semibold text-red-600">{formatDate(dateStr)}</span>
      <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full w-fit">
        Expiré ({Math.abs(days)}j)
      </span>
    </div>
  )
  if (days === 0) return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm font-semibold text-red-600">{formatDate(dateStr)}</span>
      <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full w-fit">
        Aujourd'hui
      </span>
    </div>
  )
  if (days < 30) return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm font-semibold text-amber-600">{formatDate(dateStr)}</span>
      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full w-fit">
        J-{days}
      </span>
    </div>
  )
  if (days < 90) return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm text-gray-700">{formatDate(dateStr)}</span>
      <span className="text-[10px] font-bold text-amber-500 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full w-fit">
        J-{days}
      </span>
    </div>
  )
  return <span className="text-sm text-gray-600">{formatDate(dateStr)}</span>
}

// ── Composant principal ────────────────────────────────────────────
interface DriverTableProps {
  drivers:   Driver[]
  onEdit?:   (driver: Driver) => void
  onDelete?: (driver: Driver) => void
}

export default function DriverTable({ drivers, onEdit, onDelete }: DriverTableProps) {
  if (drivers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Users className="w-10 h-10 text-gray-200 mb-3" />
        <p className="text-sm font-semibold text-gray-500">Aucun conducteur trouvé</p>
        <p className="text-xs text-gray-400 mt-1">Modifiez vos filtres ou ajoutez un nouveau conducteur.</p>
      </div>
    )
  }

  const showActions = onEdit || onDelete

  const HEADERS = [
    'Nom',
    'Rôle',
    'Agence',
    'Permis',
    'Visite médicale',
    'Sinistres',
    'Statut',
    ...(showActions ? ['Actions'] : []),
  ]

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">

        {/* ── En-tête ── */}
        <thead>
          <tr className="border-b border-gray-100">
            {HEADERS.map((h) => (
              <th
                key={h}
                scope="col"
                className={`px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/60 whitespace-nowrap ${
                  h === 'Sinistres' || h === 'Actions' ? 'text-center' : 'text-left'
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        {/* ── Corps ── */}
        <tbody className="bg-white divide-y divide-gray-50">
          {drivers.map((driver) => {
            const roleColor     = ROLE_COLORS[driver.role]     ?? ROLE_COLORS['OTHER']
            const statusCfg     = STATUS_CONFIG[driver.status]  ?? STATUS_CONFIG['INACTIVE']
            const incidents     = driver.incidentsCount ?? 0
            const contractLabel = CONTRACT_LABELS[driver.contractType] ?? driver.contractType

            return (
              <tr key={driver.id} className="hover:bg-violet-50/20 transition-colors group">

                {/* Nom + contrat */}
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <div>
                    <Link
                      to={`/drivers/${driver.id}`}
                      className="text-sm font-bold text-gray-800 hover:text-violet-600 transition-colors"
                    >
                      {driver.lastName} {driver.firstName}
                    </Link>
                    <p className="text-[10px] font-semibold text-gray-400 mt-0.5">
                      {contractLabel}
                    </p>
                  </div>
                </td>

                {/* Rôle */}
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleColor}`}>
                    {ROLE_LABELS[driver.role] ?? driver.role}
                  </span>
                </td>

                {/* Agence */}
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <span className="text-sm text-gray-500 font-medium">
                    {driver.agencyName ?? '—'}
                  </span>
                </td>

                {/* Permis */}
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <ExpiryCell dateStr={driver.licenseExpiry} />
                </td>

                {/* Visite médicale */}
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <ExpiryCell dateStr={driver.medicalCertificateExpiry} />
                </td>

                {/* Sinistres */}
                <td className="px-4 py-3.5 whitespace-nowrap text-center">
                  <span className={`inline-flex items-center justify-center min-w-[1.75rem] h-6 px-2 rounded-full text-xs font-bold border ${
                    incidents > 2
                      ? 'bg-red-100 text-red-700 border-red-200'
                      : incidents > 0
                      ? 'bg-amber-100 text-amber-700 border-amber-200'
                      : 'bg-gray-100 text-gray-500 border-gray-200'
                  }`}>
                    {incidents}
                  </span>
                </td>

                {/* Statut */}
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusCfg.dot}`} />
                    <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.badge}`}>
                      {statusCfg.label}
                    </span>
                  </div>
                </td>

                {/* Actions */}
                {showActions && (
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(driver)}
                          title="Modifier"
                          className="w-7 h-7 rounded-lg hover:bg-violet-100 flex items-center justify-center text-gray-400 hover:text-violet-600 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(driver)}
                          title="Supprimer"
                          className="w-7 h-7 rounded-lg hover:bg-red-100 flex items-center justify-center text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
