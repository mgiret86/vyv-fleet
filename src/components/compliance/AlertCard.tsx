import { AlertTriangle, AlertCircle, Info, CheckCircle2, Clock, MapPin, Loader2 } from 'lucide-react'
import type { Alert } from '@/types'

// ─── Config sévérité ──────────────────────────────────────────────
const SEVERITY_CONFIG = {
  CRITICAL: {
    icon:      AlertTriangle,
    bar:       'bg-red-500',
    pill:      'bg-red-50 text-red-700 border-red-200',
    iconColor: 'text-red-500',
    label:     'Critique',
  },
  WARNING: {
    icon:      AlertCircle,
    bar:       'bg-orange-500',
    pill:      'bg-orange-50 text-orange-700 border-orange-200',
    iconColor: 'text-orange-500',
    label:     'Avertissement',
  },
  INFO: {
    icon:      Info,
    bar:       'bg-blue-500',
    pill:      'bg-blue-50 text-blue-700 border-blue-200',
    iconColor: 'text-blue-500',
    label:     'Info',
  },
} as const

// ─── Config statut ────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; dot: string; pill: string }> = {
  OPEN:        { label: 'Ouverte',  dot: 'bg-gray-400',   pill: 'bg-gray-100 text-gray-500 border-gray-200'      },
  IN_PROGRESS: { label: 'En cours', dot: 'bg-orange-500', pill: 'bg-orange-50 text-orange-700 border-orange-200'  },
  RESOLVED:    { label: 'Résolue',  dot: 'bg-green-500',  pill: 'bg-green-50 text-green-700 border-green-200'     },
}

const DEFAULT_STATUS = { label: 'Inconnu', dot: 'bg-gray-300', pill: 'bg-gray-100 text-gray-400 border-gray-200' }

// ─── Labels catégories ────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  ARS:         'Agrément ARS',
  CT:          'Contrôle technique',
  ASSURANCE:   'Assurance',
  EQUIPEMENT:  'Équipement',
  MAINTENANCE: 'Maintenance',
}

// ─── Helpers ──────────────────────────────────────────────────────
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

// ─── Composant ───────────────────────────────────────────────────
interface AlertCardProps {
  alert:          Alert
  onStatusChange?: (id: string, status: 'IN_PROGRESS' | 'RESOLVED') => void
}

export default function AlertCard({ alert, onStatusChange }: AlertCardProps) {
  const severityKey = alert.severity in SEVERITY_CONFIG
    ? alert.severity as keyof typeof SEVERITY_CONFIG
    : 'INFO'
  const cfg    = SEVERITY_CONFIG[severityKey]
  const Icon   = cfg.icon
  const status = STATUS_CONFIG[alert.status] ?? DEFAULT_STATUS
  const cat    = CATEGORY_LABELS[alert.category] ?? alert.category ?? 'Autre'

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex">

      {/* Barre sévérité */}
      <div className={`w-1 flex-shrink-0 ${cfg.bar}`} />

      <div className="flex-1 min-w-0 flex items-start gap-3 px-4 py-3.5">

        {/* Icône sévérité */}
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
            <Icon className={`w-3.5 h-3.5 ${cfg.iconColor}`} />
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 min-w-0 space-y-1.5">

          {/* Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.pill}`}>
              {cfg.label}
            </span>
            <span className="inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border border-gray-200 bg-gray-50 text-gray-500">
              {cat}
            </span>
            <div className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${status.dot}`} />
              <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.pill}`}>
                {status.label}
              </span>
            </div>
          </div>

          {/* Message principal */}
          <p className="text-xs font-bold text-gray-900 leading-snug">{alert.message}</p>

          {/* Description */}
          {alert.description && (
            <p className="text-[10px] font-semibold text-gray-500 leading-relaxed">{alert.description}</p>
          )}

          {/* Méta */}
          <div className="flex flex-wrap items-center gap-3 pt-0.5">
            <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="text-violet-600 font-mono">{alert.vehicleRegistration}</span>
              <span className="text-gray-300">·</span>
              {alert.agencyName}
            </span>

            {alert.dueDate && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600">
                <Clock className="w-3 h-3 flex-shrink-0" />
                Échéance : {formatDate(alert.dueDate)}
              </span>
            )}

            {alert.resolvedAt && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-green-600">
                <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                Résolu le {formatDate(alert.resolvedAt)}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {onStatusChange && alert.status !== 'RESOLVED' && (
          <div className="flex flex-col gap-1.5 flex-shrink-0 ml-2">
            {alert.status === 'OPEN' && (
              <button
                onClick={() => onStatusChange(alert.id, 'IN_PROGRESS')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                <Loader2 className="w-3 h-3" />
                Prendre en charge
              </button>
            )}
            <button
              onClick={() => onStatusChange(alert.id, 'RESOLVED')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors whitespace-nowrap"
            >
              <CheckCircle2 className="w-3 h-3" />
              Résoudre
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
