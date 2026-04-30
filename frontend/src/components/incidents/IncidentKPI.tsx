import type { Incident } from '@/data/mockIncidents'

interface IncidentKPIProps {
  incidents: Incident[]
}

export default function IncidentKPI({ incidents }: IncidentKPIProps) {
  const total = incidents.length
  const inProgress = incidents.filter(
    (i) => i.status === 'OPEN' || i.status === 'IN_PROGRESS'
  ).length
  const totalEstimatedCost = incidents.reduce(
    (sum, i) => sum + (i.estimatedRepairCost ?? 0),
    0
  )
  const totalImmobilizationDays = incidents.reduce(
    (sum, i) => sum + (i.immobilizationDays ?? 0),
    0
  )

  const kpiData = [
    {
      label: 'Total sinistres',
      value: total,
      subtext: 'depuis le debut',
    },
    {
      label: 'En cours',
      value: inProgress,
      subtext: 'sinistres ouverts',
      highlight: inProgress > 0,
    },
    {
      label: 'Cout estime total',
      value: `${(totalEstimatedCost / 1000).toFixed(1)}k`,
      subtext: 'EUR',
    },
    {
      label: "Jours d'immobilisation",
      value: totalImmobilizationDays,
      subtext: 'au total',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      {kpiData.map((kpi) => (
        <div
          key={kpi.label}
          className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
        >
          <p className="text-xs text-gray-500 font-medium mb-1">{kpi.label}</p>
          <p
            className={`text-2xl font-bold ${kpi.highlight ? 'text-orange-600' : 'text-gray-900'}`}
          >
            {kpi.value}
          </p>
          {kpi.subtext && (
            <p className="text-xs text-gray-400 mt-0.5">{kpi.subtext}</p>
          )}
        </div>
      ))}
    </div>
  )
}
