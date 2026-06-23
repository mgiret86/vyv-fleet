type MonthlyEntry = { month: string; cost: number }

interface FuelBarChartProps {
  data?: MonthlyEntry[]
}

export default function FuelBarChart({ data = [] }: FuelBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6 flex items-center justify-center h-32 text-sm text-gray-400">
        Aucune donnee disponible pour la periode selectionnee.
      </div>
    )
  }

  const maxCost       = Math.max(...data.map((d) => d.cost), 1)
  const chartHeight   = 200
  const barWidth      = 36
  const gap           = 24
  const paddingLeft   = 50
  const paddingBottom = 30
  const totalWidth    = paddingLeft + data.length * (barWidth + gap)
  const totalHeight   = chartHeight + paddingBottom
  const yTicks        = [0, 1500, 3000, 4500, 6000]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">Evolution mensuelle</h3>
      <div className="overflow-x-auto">
        <svg
          width={totalWidth}
          height={totalHeight}
          viewBox={`0 0 ${totalWidth} ${totalHeight}`}
          className="block"
        >
          {yTicks.map((tick) => {
            const y = chartHeight - (tick / maxCost) * chartHeight
            return (
              <g key={tick}>
                <line x1={paddingLeft} y1={y} x2={totalWidth} y2={y} stroke="#e5e7eb" strokeWidth={1} />
                <text x={paddingLeft - 8} y={y + 4} textAnchor="end" className="fill-gray-500" style={{ fontSize: '11px' }}>
                  {tick}
                </text>
              </g>
            )
          })}

          {data.map((d, i) => {
            const barHeight = (d.cost / maxCost) * chartHeight
            const x = paddingLeft + i * (barWidth + gap)
            const y = chartHeight - barHeight
            return (
              <g key={d.month}>
                <rect x={x} y={y} width={barWidth} height={barHeight} fill="#7c3aed" rx={4}
                  className="hover:opacity-80 transition-opacity cursor-pointer">
                  <title>{d.month} : {d.cost} EUR</title>
                </rect>
                <text x={x + barWidth / 2} y={chartHeight + 16} textAnchor="middle"
                  className="fill-gray-600" style={{ fontSize: '11px' }}>
                  {d.month}
                </text>
                <text x={x + barWidth / 2} y={y - 6} textAnchor="middle"
                  className="fill-gray-700" style={{ fontSize: '10px', fontWeight: 500 }}>
                  {d.cost}
                </text>
              </g>
            )
          })}

          <text x={8} y={chartHeight / 2} textAnchor="middle" className="fill-gray-500"
            style={{ fontSize: '10px' }} transform={`rotate(-90, 8, ${chartHeight / 2})`}>
            EUR
          </text>
        </svg>
      </div>
    </div>
  )
}
