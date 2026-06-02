import { Link } from 'react-router-dom'
import { Edit, Trash2, Users } from 'lucide-react'
import type { Driver } from '@/types'

const ROLE_LABELS: Record<string, string> = {
  AMBULANCIER_DE:         'Ambulancier DE',
  AUXILIAIRE_AMBULANCIER: 'Auxiliaire Ambulancier',
  CHAUFFEUR_VSL:          'Chauffeur VSL',
  OTHER:                  'Autre',
}

const CONTRACT_LABELS: Record<string, string> = {
  CDI:    'CDI',
  CDD:    'CDD',
  INTERIM: 'Intérim',
}

const ROLE_COLORS: Record<string, string> = {
  AMBULANCIER_DE:         'bg-red-100 text-red-700',
  AUXILIAIRE_AMBULANCIER: 'bg-orange-100 text-orange-700',
  CHAUFFEUR_VSL:          'bg-blue-100 text-blue-700',
  OTHER:                  'bg-gray-100 text-gray-600',
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:    'bg-green-100 text-green-700',
  SUSPENDED: 'bg-red-100 text-red-700',
  LEAVE:     'bg-yellow-100 text-yellow-700',
  INACTIVE:  'bg-gray-100 text-gray-500',
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE:    'Actif',
  SUSPENDED: 'Suspendu',
  LEAVE:     'Congé',
  INACTIVE:  'Inactif',
}

function getDaysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function ExpiryCell({ dateStr }: { dateStr?: string | null }) {
  if (!dateStr) return <span className="text-gray-400 text-sm">—</span>
  const days = getDaysUntil(dateStr)
  const colorClass =
    days < 0   ? 'text-red-600 font-semibold' :
    days < 90  ? 'text-orange-500 font-medium' :
                 'text-gray-500'
  const label =
    days < 0  ? `(expiré il y a ${Math.abs(days)}j)` :
    days === 0 ? "(aujourd'hui)" :
                 `(dans ${days}j)`
  return (
    <span className={`text-sm ${colorClass}`}>
      {formatDate(dateStr)} <span className="text-xs opacity-80">{label}</span>
    </span>
  )
}

interface DriverTableProps {
  drivers:  Driver[]
  onEdit?:  (driver: Driver) => void
  onDelete?:(driver: Driver) => void
}

export default function DriverTable({ drivers, onEdit, onDelete }: DriverTableProps) {
  if (drivers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Users className="w-14 h-14 mb-4 opacity-30" />
        <p className="text-base font-medium">Aucun conducteur trouvé</p>
        <p className="text-sm mt-1 opacity-70">Modifiez vos filtres ou ajoutez un nouveau conducteur.</p>
      </div>
    )
  }

  const showActions = onEdit || onDelete

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
      <table className="min-w-full divide-y divide-gray-100 bg-white text-sm">
        <thead className="bg-gray-50">
          <tr>
            {[
              'Nom', 'Rôle', 'Agence', 'Permis', 'Certificat médical', 'Sinistres', 'Statut',
              ...(showActions ? ['Actions'] : []),
            ].map((col) => (
              <th key={col} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {drivers.map((driver) => {
            const roleColor   = ROLE_COLORS[driver.role]   ?? ROLE_COLORS['OTHER']
            const statusColor = STATUS_COLORS[driver.status] ?? STATUS_COLORS['INACTIVE']
            const incidents   = driver.incidentsCount ?? 0

            return (
              <tr key={driver.id} className="hover:bg-violet-50/40 transition-colors duration-100">

                <td className="px-4 py-3 whitespace-nowrap">
                  <Link to={`/drivers/${driver.id}`} className="font-medium text-gray-800 hover:text-violet-600 transition-colors">
                    {driver.lastName} {driver.firstName}
                  </Link>
                  <span className="ml-1 text-xs text-gray-400">
                    {CONTRACT_LABELS[driver.contractType] ?? driver.contractType}
                  </span>
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColor}`}>
                    {ROLE_LABELS[driver.role] ?? driver.role}
                  </span>
                </td>

                <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                  {driver.agencyName ?? '—'}
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  <ExpiryCell dateStr={driver.licenseExpiry} />
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  <ExpiryCell dateStr={driver.medicalCertificateExpiry} />
                </td>

                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <span className={`inline-block min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-semibold ${incidents > 2 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                    {incidents}
                  </span>
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                    {STATUS_LABELS[driver.status] ?? driver.status}
                  </span>
                </td>

                {showActions && (
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      {onEdit && (
                        <button onClick={() => onEdit(driver)} title="Modifier" className="p-1.5 rounded-lg hover:bg-violet-50 text-gray-400 hover:text-violet-600 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {onDelete && (
                        <button onClick={() => onDelete(driver)} title="Supprimer" className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
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