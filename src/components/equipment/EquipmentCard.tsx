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

// ─── Config ───────────────────────────────────────────────────────
const STATUS_DOT: Record<EquipmentStatus, string> = {
  OK:             'bg-green-500',
  WARNING:        'bg-amber-500',
  CRITICAL:       'bg-red-500',
  OUT_OF_SERVICE: 'bg-gray-400',
}

// ─── Helpers ──────────────────────────────────────────────────────
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function dateUrgency(dateStr: string | null | undefined, threshold = 30): 'expired' | 'soon' | 'ok' {
  if (!dateStr) return 'ok'
  const diff = (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  if (diff < 0)         return 'expired'
  if (diff < threshold) return 'soon'
  return 'ok'
}

function urgencyColor(u: 'expired' | 'soon' | 'ok'): string {
  if (u === 'expired') return 'text-red-600'
  if (u === 'soon')    return 'text-amber-600'
  return 'text-gray-700'
}

// ─── MetaRow ──────────────────────────────────────────────────────
function MetaRow({ icon: Icon, label, children }: {
  icon:     React.ElementType
  label:    string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-2.5 h-2.5 text-gray-400" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
        <div className="text-xs font-semibold text-gray-700 mt-0.5 leading-snug">{children}</div>
      </div>
    </div>
  )
}

// ─── DateValue ────────────────────────────────────────────────────
function DateValue({ dateStr, threshold = 30 }: { dateStr: string | null | undefined; threshold?: number }) {
  const u = dateUrgency(dateStr, threshold)
  return (
    <span className={`inline-flex items-center gap-1 ${urgencyColor(u)}`}>
      {formatDate(dateStr)}
      {u !== 'ok' && <AlertTriangle className="w-3 h-3 flex-shrink-0" />}
    </span>
  )
}

// ─── Composant principal ──────────────────────────────────────────
interface EquipmentCardProps {
  equipment: Equipment
  onEdit:    (equipment: Equipment) => void
  onDelete:  (id: string) => void
}

export default function EquipmentCard({ equipment, onEdit, onDelete }: EquipmentCardProps) {
  const categoryCls = CATEGORY_COLORS[equipment.category] ?? CATEGORY_COLORS['OTHER']
  const statusCls   = STATUS_COLORS[equipment.status]     ?? STATUS_COLORS['OK']
  const dotCls      = STATUS_DOT[equipment.status]        ?? STATUS_DOT['OK']

  return (
    <article className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col">

      {/* ── En-tête ── */}
      <div className="px-4 pt-3.5 pb-3 border-b border-gray-100 flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1.5 min-w-0">
          <h3 className="text-sm font-bold text-gray-900 leading-tight truncate">{equipment.label}</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 text-[10px] font-bold text-violet-600">
              <Car className="w-3 h-3 flex-shrink-0" />
              {equipment.vehicleRegistration}
            </span>
            <span className="text-gray-200 text-[10px]">·</span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-wide">
              <Building2 className="w-3 h-3 flex-shrink-0" />
              {equipment.agencyName}
            </span>
          </div>
        </div>

        {/* Badges droite */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border ${categoryCls}`}>
            {CATEGORY_LABELS[equipment.category]}
          </span>
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCls}`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotCls}`} />
            {STATUS_LABELS[equipment.status]}
          </span>
        </div>
      </div>

      {/* ── Corps ── */}
      <div className="px-4 py-3.5 grid grid-cols-2 gap-x-3 gap-y-2.5 flex-1">
        <MetaRow icon={Hash} label="N° de série">
          {equipment.serialNumber ?? '—'}
        </MetaRow>

        <MetaRow icon={CalendarPlus} label="Installation">
          {formatDate(equipment.installDate)}
        </MetaRow>

        <MetaRow icon={CalendarCheck} label="Dernier contrôle">
          {formatDate(equipment.lastCheckDate)}
        </MetaRow>

        <MetaRow icon={CalendarClock} label="Prochain contrôle">
          <DateValue dateStr={equipment.nextCheckDate} threshold={30} />
        </MetaRow>

        <MetaRow icon={Clock} label="Expiration">
          {equipment.expiryDate
            ? <DateValue dateStr={equipment.expiryDate} threshold={30} />
            : '—'
          }
        </MetaRow>

        <MetaRow icon={Wrench} label="Prestataire">
          {equipment.maintenanceProvider || '—'}
        </MetaRow>
      </div>

      {/* ── Notes ── */}
      {equipment.notes && (
        <div className="mx-4 mb-3 flex items-start gap-2 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-100">
          <FileText className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] font-semibold text-gray-500 leading-relaxed line-clamp-2">{equipment.notes}</p>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={() => onEdit(equipment)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-violet-200 text-violet-700 bg-white hover:bg-violet-50 transition-colors"
        >
          <Pencil className="w-3 h-3" />
          Modifier
        </button>
        <button
          type="button"
          onClick={() => onDelete(equipment.id)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-red-200 text-red-600 bg-white hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          Supprimer
        </button>
      </div>
    </article>
  )
}
