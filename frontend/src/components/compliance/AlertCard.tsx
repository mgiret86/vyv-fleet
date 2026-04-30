import { AlertTriangle, AlertCircle, Info, CheckCircle, Clock, MapPin } from 'lucide-react'
import type { Alert } from '@/types'

interface AlertCardProps {
  alert: Alert
  onStatusChange?: (id: string, status: 'IN_PROGRESS' | 'RESOLVED') => void
}

const severityConfig = {
  CRITICAL: {
    icon: AlertTriangle,
    bg: 'bg-red-50 border-red-200',
    badge: 'bg-red-100 text-red-700',
    icon_color: 'text-red-500',
    label: 'Critique',
  },
  WARNING: {
    icon: AlertCircle,
    bg: 'bg-orange-50 border-orange-200',
    badge: 'bg-orange-100 text-orange-700',
    icon_color: 'text-orange-500',
    label: 'Avertissement',
  },
  INFO: {
    icon: Info,
    bg: 'bg-blue-50 border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    icon_color: 'text-blue-500',
    label: 'Info',
  },
} as const

const categoryLabels: Record<string, string> = {
  ARS:         'Agrement ARS',
  CT:          'Controle technique',
  ASSURANCE:   'Assurance',
  EQUIPEMENT:  'Equipement',
  MAINTENANCE: 'Maintenance',
}

const statusConfig: Record<string, { label: string; class: string }> = {
  OPEN:        { label: 'Ouverte',  class: 'bg-gray-100 text-gray-600'    },
  IN_PROGRESS: { label: 'En cours', class: 'bg-yellow-100 text-yellow-700' },
  RESOLVED:    { label: 'Resolue',  class: 'bg-green-100 text-green-700'  },
}

const DEFAULT_STATUS   = { label: 'Inconnu', class: 'bg-gray-100 text-gray-400' }
const DEFAULT_SEVERITY = 'INFO' as const

export default function AlertCard({ alert, onStatusChange }: AlertCardProps) {
  const severityKey = (alert.severity in severityConfig)
    ? alert.severity as keyof typeof severityConfig
    : DEFAULT_SEVERITY
  const config = severityConfig[severityKey]
  const Icon   = config.icon

  const currentStatus  = statusConfig[alert.status] ?? DEFAULT_STATUS
  const categoryLabel  = categoryLabels[alert.category] ?? alert.category ?? 'Autre'

  return (
    <div className={`rounded-xl border p-4 ${config.bg}`}>
      <div className="flex items-start gap-4">
        <div className="mt-0.5 flex-shrink-0">
          <Icon className={`h-5 w-5 ${config.icon_color}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.badge}`}>
              {config.label}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">
              {categoryLabel}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${currentStatus.class}`}>
              {currentStatus.label}
            </span>
          </div>

          <p className="text-sm font-semibold text-gray-900">{alert.message}</p>

          {alert.description && (
            <p className="text-xs text-gray-600 mt-0.5">{alert.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {alert.vehicleRegistration} · {alert.agencyName}
            </span>
            {alert.dueDate && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Echeance : {new Date(alert.dueDate).toLocaleDateString('fr-FR')}
              </span>
            )}
            {alert.resolvedAt && (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-3 w-3" />
                Resolu le {new Date(alert.resolvedAt).toLocaleDateString('fr-FR')}
              </span>
            )}
          </div>
        </div>

        {/* Boutons d'action — masqués si onStatusChange absent ou alerte déjà résolue */}
        {onStatusChange && alert.status !== 'RESOLVED' && (
          <div className="flex flex-col gap-2 flex-shrink-0">
            {alert.status === 'OPEN' && (
              <button
                onClick={() => onStatusChange(alert.id, 'IN_PROGRESS')}
                className="text-xs px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Prendre en charge
              </button>
            )}
            <button
              onClick={() => onStatusChange(alert.id, 'RESOLVED')}
              className="text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors font-medium"
            >
              Resoudre
            </button>
          </div>
        )}
      </div>
    </div>
  )
}