import type { EquipmentStatus } from '@/data/mockEquipment'

interface EquipmentItem {
  status: EquipmentStatus
}

interface Props {
  equipments: EquipmentItem[]
}

interface KPIData {
  total:    number
  ok:       number
  warning:  number
  critical: number
}

function PulseBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="relative flex h-3 w-3 ml-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
    </span>
  )
}

export default function EquipmentKPI({ equipments }: Props) {
  const kpi: KPIData = {
    total:    equipments.length,
    ok:       equipments.filter((e) => e.status === 'OK').length,
    warning:  equipments.filter((e) => e.status === 'WARNING').length,
    critical: equipments.filter((e) => e.status === 'CRITICAL').length,
  }

  const cards: { label: string; value: number; color: string; border: string; bg: string; urgent?: boolean }[] = [
    { label: 'Total equipements', value: kpi.total,    color: 'text-gray-800',   border: 'border-gray-200',   bg: 'bg-white'     },
    { label: 'Conformes',         value: kpi.ok,       color: 'text-green-600',  border: 'border-green-200',  bg: 'bg-green-50'  },
    { label: 'Avertissements',    value: kpi.warning,  color: 'text-orange-600', border: 'border-orange-200', bg: 'bg-orange-50' },
    { label: 'Critiques',         value: kpi.critical, color: 'text-red-600',    border: 'border-red-200',    bg: 'bg-red-50', urgent: true },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className={`${card.bg} rounded-xl border ${card.border} p-4 shadow-sm`}>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">{card.label}</p>
            {card.urgent && <PulseBadge count={card.value} />}
          </div>
          <p className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  )
}
