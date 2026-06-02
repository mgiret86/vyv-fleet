import type { TCOEntry } from '@/data/mockFuel'

const COLORS = {
  lease:       '#7c3aed',
  fuel:        '#3b82f6',
  maintenance: '#f97316',
  insurance:   '#22c55e',
  other:       '#6b7280',
} as const

interface TCOPieChartProps {
  tcoEntries: TCOEntry[]
}

export default function TCOPieChart({ tcoEntries }: TCOPieChartProps) {
  const count = tcoEntries.length || 1

  const avgLease       = tcoEntries.reduce((s, t) => s + t.monthlyLease,       0) / count
  const avgFuel        = tcoEntries.reduce((s, t) => s + t.monthlyFuel,        0) / count
  const avgMaintenance = tcoEntries.reduce((s, t) => s + t.monthlyMaintenance, 0) / count
  const avgInsurance   = tcoEntries.reduce((s, t) => s + t.monthlyInsurance,   0) / count
  const avgOther       = tcoEntries.reduce((s, t) => s + t.monthlyOther,       0) / count

  const total = avgLease + avgFuel + avgMaintenance + avgInsurance + avgOther

  const segments = [
    { label: 'Location',    value: avgLease,       color: COLORS.lease       },
    { label: 'Carburant',   value: avgFuel,        color: COLORS.fuel        },
    { label: 'Maintenance', value: avgMaintenance, color: COLORS.maintenance },
    { label: 'Assurance',   value: avgInsurance,   color: COLORS.insurance   },
    { label: 'Divers',      value: avgOther,       color: COLORS.other       },
  ]

  const cx = 100
  const cy = 100
  const r  = 80
  let startAngle = -90

  const paths = segments.map((seg) => {
    const angle    = (seg.value / (total || 1)) * 360
    const startRad = (startAngle * Math.PI) / 180
    const endRad   = ((startAngle + angle) * Math.PI) / 180
    const x1 = cx + r * Math.cos(startRad)
    const y1 = cy + r * Math.sin(startRad)
    const x2 = cx + r * Math.cos(endRad)
    const y2 = cy + r * Math.sin(endRad)
    const largeArc = angle > 180 ? 1 : 0
    startAngle += angle
    return { ...seg, d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z` }
  })

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">Repartition TCO moyenne</h3>
      <div className="flex items-center gap-8">
        <svg width={cx * 2} height={cy * 2} viewBox="0 0 200 200">
          {paths.map((p, i) => (
            <path key={i} d={p.d} fill={p.color} className="hover:opacity-80 transition-opacity cursor-pointer">
              <title>{p.label}: {p.value.toFixed(0)} EUR ({(p.value / (total || 1) * 100).toFixed(1)}%)</title>
            </path>
          ))}
          <circle cx={cx} cy={cy} r={40} fill="white" />
          <text x={cx} y={cy - 5}  textAnchor="middle" className="fill-gray-500" style={{ fontSize: '10px' }}>Total</text>
          <text x={cx} y={cy + 10} textAnchor="middle" className="fill-gray-800" style={{ fontSize: '14px', fontWeight: 600 }}>
            {total.toFixed(0)} EUR
          </text>
        </svg>
        <div className="flex flex-col gap-2">
          {paths.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: p.color }} />
              <span className="text-sm text-gray-600">{p.label}</span>
              <span className="text-sm font-medium text-gray-800 ml-auto pl-4">
                {(p.value / (total || 1) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}