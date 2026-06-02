import type { Vehicle } from '@/types'

// Calcul du statut CT depuis la date d'expiration
function getInspectionStatus(expiry: string): 'VALID' | 'EXPIRED' | 'PENDING' {
  if (!expiry) return 'PENDING'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiryDate = new Date(expiry)
  const daysUntil = Math.round((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (daysUntil < 0) return 'EXPIRED'
  if (daysUntil <= 60) return 'PENDING'
  return 'VALID'
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

const STATUS_STYLES = {
  VALID:   { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Valide'      },
  EXPIRED: { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Expiré'      },
  PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Bientôt expiré' },
} as const

type Props = {
  technicalInspectionExpiry: Vehicle['technicalInspectionExpiry']
}

export default function TechnicalInspectionTable({ technicalInspectionExpiry }: Props) {
  const status = getInspectionStatus(technicalInspectionExpiry)
  const style  = STATUS_STYLES[status]

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiryDate = new Date(technicalInspectionExpiry)
  const daysUntil  = Math.round((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center py-2 border-b border-gray-100">
        <span className="text-sm text-gray-500">Statut</span>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${style.bg} ${style.text}`}>
          {style.label}
        </span>
      </div>
      <div className="flex justify-between items-center py-2 border-b border-gray-100">
        <span className="text-sm text-gray-500">Expiration</span>
        <span className="text-sm font-medium text-gray-900">{formatDate(technicalInspectionExpiry)}</span>
      </div>
      <div className="flex justify-between items-center py-2">
        <span className="text-sm text-gray-500">Jours restants</span>
        <span className={`text-sm font-medium ${daysUntil < 0 ? 'text-red-600' : daysUntil <= 60 ? 'text-orange-500' : 'text-gray-900'}`}>
          {daysUntil < 0 ? `Expiré il y a ${Math.abs(daysUntil)}j` : `${daysUntil}j`}
        </span>
      </div>
    </div>
  )
}