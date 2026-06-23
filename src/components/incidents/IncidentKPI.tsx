import { AlertTriangle, Clock, Euro, CalendarOff } from 'lucide-react'
import type { Incident } from '@/data/mockIncidents'

// ─── Config KPIs ──────────────────────────────────────────────────
interface KpiConfig {
  label:      string
  value:      string | number
  subtext:    string
  icon:       React.ElementType
  barColor:   string
  valueColor: string
}

// ─── KpiCard ──────────────────────────────────────────────────────
function KpiCard({ label, value, subtext, icon: Icon, barColor, valueColor }: KpiConfig) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/60 flex items-center gap-2">
        <div className={`w-1 h-3 rounded-full ${barColor}`} />
        <Icon className={`w-3.5 h-3.5 ${valueColor}`} />
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className="px-4 py-3.5">
        <p className={`text-3xl font-black leading-none ${valueColor}`}>{value}</p>
        <p className="text-[10px] font-semibold text-gray-400 mt-1.5 uppercase tracking-wide">{subtext}</p>
      </div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────
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

  const kpis: KpiConfig[] = [
    {
      label:      'Total sinistres',
      value:      total,
      subtext:    'depuis le début',
      icon:       AlertTriangle,
      barColor:   'bg-gray-400',
      valueColor: 'text-gray-800',
    },
    {
      label:      'En cours',
      value:      inProgress,
      subtext:    'sinistres ouverts ou en traitement',
      icon:       Clock,
      barColor:   inProgress > 0 ? 'bg-orange-500' : 'bg-gray-300',
      valueColor: inProgress > 0 ? 'text-orange-600' : 'text-gray-800',
    },
    {
      label:      'Coût estimé total',
      value:      `${(totalEstimatedCost / 1000).toFixed(1)}k €`,
      subtext:    'réparations toutes agences',
      icon:       Euro,
      barColor:   'bg-violet-500',
      valueColor: 'text-violet-700',
    },
    {
      label:      "Jours d'immobilisation",
      value:      totalImmobilizationDays,
      subtext:    'jours cumulés hors parc',
      icon:       CalendarOff,
      barColor:   totalImmobilizationDays > 30 ? 'bg-red-500' : 'bg-amber-400',
      valueColor: totalImmobilizationDays > 30 ? 'text-red-600' : 'text-amber-600',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.label} {...kpi} />
      ))}
    </div>
  )
}
