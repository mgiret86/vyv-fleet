import {
  Car, Building2, Hash, CalendarPlus, CalendarCheck, CalendarClock,
  Clock, Wrench, FileText, AlertTriangle, Pencil, Trash2,
} from 'lucide-react'
import {
  Equipment,
  EquipmentStatus,
  CATEGORY_LABELS,
  STATUS_LABELS,
  CATEGORY_COLORS,
  STATUS_COLORS,
} from '@/data/mockEquipment'

const STATUS_DOT_COLOR: Record<EquipmentStatus, string> = {
  OK:             'bg-green-500',
  WARNING:        'bg-amber-500',
  CRITICAL:       'bg-red-500',
  OUT_OF_SERVICE: 'bg-gray-400',
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('fr-FR', {
    day:   '2-digit',
    month: '2-digit',
    year:  'numeric',
  })
}

function isExpiredOrSoon(dateStr: string | null | undefined, daysThreshold = 30): 'expired' | 'soon' | 'ok' {
  if (!dateStr) return 'ok'
  const date     = new Date(dateStr)
  const now      = new Date()
  const diffDays = (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  if (diffDays < 0)              return 'expired'
  if (diffDays < daysThreshold)  return 'soon'
  return 'ok'
}

interface MetaRowProps {
  icon:  React.ReactNode
  label: string
  value: React.ReactNode
}

function MetaRow({ icon, label, value }: MetaRowProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="flex items-center gap-1 text-xs font-medium text-gray-400 uppercase tracking-wide">
        {icon}{label}
      </span>
      <span className="text-sm text-gray-700 font-medium leading-snug">{value}</span>
    </div>
  )
}

interface EquipmentCardProps {
  equipment: Equipment
  onEdit:    (equipment: Equipment) => void
  onDelete:  (id: string) => void
}

export default function EquipmentCard({ equipment, onEdit, onDelete }: EquipmentCardProps) {
  const categoryClass  = CATEGORY_COLORS[equipment.category] ?? CATEGORY_COLORS['OTHER']
  const statusClass    = STATUS_COLORS[equipment.status]     ?? STATUS_COLORS['OK']
  const statusDotClass = STATUS_DOT_COLOR[equipment.status]  ?? STATUS_DOT_COLOR['OK']

  const nextCheckUrgency = isExpiredOrSoon(equipment.nextCheckDate, 30)
  const expiryUrgency    = isExpiredOrSoon(equipment.expiryDate, 30)

  return (
    <article className="flex flex-col gap-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 p-5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${categoryClass}`}>
          {CATEGORY_LABELS[equipment.category]}
        </span>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusClass}`}>
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDotClass}`} aria-hidden="true" />
          {STATUS_LABELS[equipment.status]}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <h3 className="text-base font-bold text-gray-900 leading-tight">{equipment.label}</h3>
        <div className="flex items-center gap-3 flex-wrap text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Car className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            <span className="font-medium">{equipment.vehicleRegistration}</span>
          </span>
          <span className="flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            <span>{equipment.agencyName}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <MetaRow icon={<Hash className="w-3 h-3" />}          label="N° de série"       value={equipment.serialNumber ?? '—'} />
        <MetaRow icon={<CalendarPlus className="w-3 h-3" />}  label="Installation"      value={formatDate(equipment.installDate)} />
        <MetaRow icon={<CalendarCheck className="w-3 h-3" />} label="Dernier contrôle"  value={formatDate(equipment.lastCheckDate)} />
        <MetaRow icon={<CalendarClock className="w-3 h-3" />} label="Prochain contrôle"
          value={
            <span className={`flex items-center gap-1 ${getDateColorClass(nextCheckUrgency)}`}>
              {formatDate(equipment.nextCheckDate)}
              {nextCheckUrgency !== 'ok' && <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />}
            </span>
          }
        />
        <MetaRow icon={<Clock className="w-3 h-3" />} label="Expiration"
          value={
            equipment.expiryDate ? (
              <span className={`flex items-center gap-1 ${getDateColorClass(expiryUrgency)}`}>
                {formatDate(equipment.expiryDate)}
                {expiryUrgency !== 'ok' && <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />}
              </span>
            ) : '—'
          }
        />
        <MetaRow icon={<Wrench className="w-3 h-3" />} label="Prestataire" value={equipment.maintenanceProvider || '—'} />
      </div>

      {equipment.notes && (
        <div className="flex gap-2 bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
          <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-gray-600 leading-snug line-clamp-2">{equipment.notes}</p>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100">
        <button type="button" onClick={() => onEdit(equipment)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-violet-300 text-violet-700 bg-white hover:bg-violet-50 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-400">
          <Pencil className="w-3.5 h-3.5" /> Modifier
        </button>
        <button type="button" onClick={() => onDelete(equipment.id)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-red-300 text-red-600 bg-white hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400">
          <Trash2 className="w-3.5 h-3.5" /> Supprimer
        </button>
      </div>
    </article>
  )
}

function getDateColorClass(urgency: 'expired' | 'soon' | 'ok'): string {
  if (urgency === 'expired') return 'text-red-600'
  if (urgency === 'soon')    return 'text-amber-600'
  return 'text-gray-700'
}
