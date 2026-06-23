import type { Vehicle } from '@/types'
import { ShieldCheck, ShieldAlert, Clock, Calendar } from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────
function getInspectionStatus(expiry: string): 'VALID' | 'EXPIRED' | 'PENDING' {
  if (!expiry) return 'PENDING'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const daysUntil = Math.round((new Date(expiry).getTime() - today.getTime()) / 86400000)
  if (daysUntil < 0)   return 'EXPIRED'
  if (daysUntil <= 60) return 'PENDING'
  return 'VALID'
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

// ─── Config statut ────────────────────────────────────────────────
const STATUS_CONFIG = {
  VALID:   { label: 'Valide',          badge: 'bg-green-50 text-green-700 border-green-200',   bar: 'bg-green-500',  icon: ShieldCheck  },
  PENDING: { label: 'Bientôt expiré',  badge: 'bg-orange-50 text-orange-700 border-orange-200', bar: 'bg-orange-400', icon: Clock        },
  EXPIRED: { label: 'Expiré',          badge: 'bg-red-50 text-red-700 border-red-200',         bar: 'bg-red-500',    icon: ShieldAlert  },
} as const

type Props = { technicalInspectionExpiry: Vehicle['technicalInspectionExpiry'] }

// ─── Composant ────────────────────────────────────────────────────
export default function TechnicalInspectionTable({ technicalInspectionExpiry }: Props) {
  const status  = getInspectionStatus(technicalInspectionExpiry)
  const cfg     = STATUS_CONFIG[status]
  const Icon    = cfg.icon

  const today      = new Date(); today.setHours(0, 0, 0, 0)
  const daysUntil  = Math.round((new Date(technicalInspectionExpiry).getTime() - today.getTime()) / 86400000)

  // Barre de progression : 0% = expiré, 100% = +365j
  const barPct = Math.max(0, Math.min(100, (daysUntil / 365) * 100))

  const daysLabel = daysUntil < 0
    ? `Expiré il y a ${Math.abs(daysUntil)} j`
    : `${daysUntil} j restants`

  return (
    <div className="space-y-3">

      {/* Statut + date */}
      <div className="flex items-center justify-between py-2 border-b border-gray-50">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Statut CT</span>
        </div>
        <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${cfg.badge}`}>
          <Icon className="w-3 h-3" />
          {cfg.label}
        </span>
      </div>

      <div className="flex items-center justify-between py-2 border-b border-gray-50">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3 h-3 text-gray-400" />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Expiration</span>
        </div>
        <span className="text-xs font-semibold text-gray-800">{formatDate(technicalInspectionExpiry)}</span>
      </div>

      {/* Barre de validité */}
      <div className="py-2 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-gray-400" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Jours restants</span>
          </div>
          <span className={`text-xs font-bold ${
            daysUntil < 0 ? 'text-red-600' : daysUntil <= 60 ? 'text-orange-500' : 'text-gray-700'
          }`}>
            {daysLabel}
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${cfg.bar}`}
            style={{ width: `${barPct}%` }}
          />
        </div>
      </div>
    </div>
  )
}
