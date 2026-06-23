import type { TCOEntry } from '@/data/mockFuel'

// ─── Config segments ──────────────────────────────────────────────
const SEGMENTS_CONFIG = [
  { key: 'monthlyLease',       label: 'Location',    color: '#7c3aed', bg: 'bg-violet-500' },
  { key: 'monthlyFuel',        label: 'Carburant',   color: '#3b82f6', bg: 'bg-blue-500'   },
  { key: 'monthlyMaintenance', label: 'Maintenance', color: '#f97316', bg: 'bg-orange-500' },
  { key: 'monthlyInsurance',   label: 'Assurance',   color: '#22c55e', bg: 'bg-green-500'  },
  { key: 'monthlyOther',       label: 'Divers',      color: '#6b7280', bg: 'bg-gray-400'   },
] as const

interface TCOPieChartProps {
  tcoEntries: TCOEntry[]
}

export default function TCOPieChart({ tcoEntries }: TCOPieChartProps) {
  const count = tcoEntries.length || 1

  const avgs = SEGMENTS_CONFIG.map((seg) => ({
    ...seg,
    value: tcoEntries.reduce((s, t) => s + (t[seg.key] as number), 0) / count,
  }))

  const total = avgs.reduce((s, seg) => s + seg.value, 0) || 1

  // ─── Calcul des arcs SVG ─────────────────────────────────────
  const cx = 90
  const cy = 90
  const rOuter = 72
  const rInner = 44
  let startAngle = -90

  const paths = avgs.map((seg) => {
    const pct      = seg.value / total
    const angle    = pct * 360
    const sRad     = (startAngle * Math.PI) / 180
    const eRad     = ((startAngle + angle) * Math.PI) / 180
    const x1o = cx + rOuter * Math.cos(sRad)
    const y1o = cy + rOuter * Math.sin(sRad)
    const x2o = cx + rOuter * Math.cos(eRad)
    const y2o = cy + rOuter * Math.sin(eRad)
    const x1i = cx + rInner * Math.cos(eRad)
    const y1i = cy + rInner * Math.sin(eRad)
    const x2i = cx + rInner * Math.cos(sRad)
    const y2i = cy + rInner * Math.sin(sRad)
    const large = angle > 180 ? 1 : 0
    startAngle += angle
    return {
      ...seg,
      pct,
      d: `M ${x1o} ${y1o} A ${rOuter} ${rOuter} 0 ${large} 1 ${x2o} ${y2o} L ${x1i} ${y1i} A ${rInner} ${rInner} 0 ${large} 0 ${x2i} ${y2i} Z`,
    }
  })

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">

      {/* Titre */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-4 rounded-full bg-violet-600" />
        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
          Répartition TCO moyenne / véhicule / mois
        </h3>
      </div>

      <div className="flex items-center gap-6">

        {/* Donut SVG */}
        <div className="flex-shrink-0">
          <svg width={cx * 2} height={cy * 2} viewBox={`0 0 ${cx * 2} ${cy * 2}`}>
            {paths.map((p, i) => (
              <path key={i} d={p.d} fill={p.color}
                className="hover:opacity-75 transition-opacity cursor-pointer">
                <title>{p.label} : {p.value.toFixed(0)} € ({(p.pct * 100).toFixed(1)} %)</title>
              </path>
            ))}
            {/* Centre */}
            <text x={cx} y={cy - 8} textAnchor="middle"
              style={{ fontSize: '9px', fontWeight: 700, fill: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total
            </text>
            <text x={cx} y={cy + 8} textAnchor="middle"
              style={{ fontSize: '15px', fontWeight: 800, fill: '#111827' }}>
              {total.toFixed(0)} €
            </text>
            <text x={cx} y={cy + 22} textAnchor="middle"
              style={{ fontSize: '8px', fontWeight: 600, fill: '#9ca3af' }}>
              / mois
            </text>
          </svg>
        </div>

        {/* Légende détaillée */}
        <div className="flex-1 space-y-2">
          {paths.map((p, i) => (
            <div key={i} className="flex items-center gap-2.5">
              {/* Dot couleur */}
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />

              {/* Label */}
              <span className="text-xs font-semibold text-gray-600 flex-1">{p.label}</span>

              {/* Barre proportionnelle */}
              <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${(p.pct * 100).toFixed(1)}%`, backgroundColor: p.color }}
                />
              </div>

              {/* Montant */}
              <span className="text-xs font-bold text-gray-800 w-16 text-right flex-shrink-0">
                {p.value.toFixed(0)} €
              </span>

              {/* % */}
              <span className="text-[10px] font-bold w-10 text-right flex-shrink-0"
                style={{ color: p.color }}>
                {(p.pct * 100).toFixed(1)} %
              </span>
            </div>
          ))}

          {/* Séparateur + total annuel */}
          <div className="pt-2 mt-1 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Coût annuel estimé</span>
            <span className="text-sm font-black text-gray-900">
              {(total * 12).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
