import { Package, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react'
import type { EquipmentStatus } from '@/data/mockEquipment'

// ─── Types ────────────────────────────────────────────────────────
interface EquipmentItem {
  status: EquipmentStatus
}

interface Props {
  equipments: EquipmentItem[]
}

// ─── PulseBadge ───────────────────────────────────────────────────
function PulseBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
    </span>
  )
}

// ─── KpiCard ──────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  icon: Icon,
  barColor,
  valueColor,
  urgent,
}: {
  label:      string
  value:      number
  icon:       React.ElementType
  barColor:   string
  valueColor: string
  urgent?:    boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/60 flex items-center gap-2">
        <div className={`w-1 h-3 rounded-full ${barColor}`} />
        <Icon className={`w-3.5 h-3.5 ${valueColor}`} />
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex-1">{label}</span>
        {urgent && <PulseBadge count={value} />}
      </div>
      <div className="px-4 py-3.5">
        <p className={`text-3xl font-black leading-none ${valueColor}`}>{value}</p>
        <p className="text-[10px] font-semibold text-gray-400 mt-1.5 uppercase tracking-wide">
          équipement{value > 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────
export default function EquipmentKPI({ equipments }: Props) {
  const total    = equipments.length
  const ok       = equipments.filter((e) => e.status === 'OK').length
  const warning  = equipments.filter((e) => e.status === 'WARNING').length
  const critical = equipments.filter((e) => e.status === 'CRITICAL').length

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KpiCard
        label="Total équipements"
        value={total}
        icon={Package}
        barColor="bg-gray-400"
        valueColor="text-gray-800"
      />
      <KpiCard
        label="Conformes"
        value={ok}
        icon={CheckCircle2}
        barColor="bg-green-500"
        valueColor="text-green-600"
      />
      <KpiCard
        label="Avertissements"
        value={warning}
        icon={AlertTriangle}
        barColor={warning > 0 ? 'bg-orange-500' : 'bg-gray-300'}
        valueColor={warning > 0 ? 'text-orange-600' : 'text-gray-800'}
      />
      <KpiCard
        label="Critiques"
        value={critical}
        icon={ShieldAlert}
        barColor={critical > 0 ? 'bg-red-500' : 'bg-gray-300'}
        valueColor={critical > 0 ? 'text-red-600' : 'text-gray-800'}
        urgent
      />
    </div>
  )
}
