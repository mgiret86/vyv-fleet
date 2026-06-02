import { useMemo } from 'react'
import type { Incident } from '@/data/mockIncidents'

interface IncidentStatsProps {
  incidents: Incident[]
}

function BarHorizontal({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-600 w-20 shrink-0">{label}</span>
      <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
        <div className={`h-full ${color} rounded`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-8 text-right">{value}</span>
    </div>
  )
}

function BarVertical({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-gray-500">{value}</span>
      <div className="w-8 bg-gray-100 rounded-t overflow-hidden flex items-end" style={{ height: 80 }}>
        <div className={`w-full ${color} rounded-t`} style={{ height: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  )
}

function GaugeSvg({ value, label }: { value: number; label: string }) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  const color = value > 50 ? '#f97316' : '#22c55e'

  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={radius}
          fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 50 50)"
        />
        <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" className="text-lg font-bold fill-gray-800">
          {value}%
        </text>
      </svg>
      <span className="text-xs text-gray-500 mt-1 text-center">{label}</span>
    </div>
  )
}

// Génère les 6 derniers mois glissants à partir d'aujourd'hui
function getLast6Months(): { label: string; year: number; month: number }[] {
  const now = new Date()
  const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec']
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    return { label: MONTH_LABELS[d.getMonth()], year: d.getFullYear(), month: d.getMonth() }
  })
}

export default function IncidentStats({ incidents }: IncidentStatsProps) {

  // ── Répartition par type ─────────────────────────────────────────────────
  const typeCount = { ACCIDENT: 0, THEFT: 0, VANDALISM: 0, BREAKDOWN: 0 }
  incidents.forEach((i) => { typeCount[i.type]++ })
  const typeMax = Math.max(...Object.values(typeCount), 1)

  // ── Top 5 agences ────────────────────────────────────────────────────────
  const agencyCount: Record<string, number> = {}
  incidents.forEach((i) => {
    agencyCount[i.agencyName] = (agencyCount[i.agencyName] || 0) + 1
  })
  const topAgencies = Object.entries(agencyCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  const agencyMax = topAgencies[0]?.[1] || 1

  // ── Evolution mensuelle — calculée dynamiquement (6 mois glissants) ──────
  const monthlyData = useMemo(() => {
    const slots = getLast6Months()
    return slots.map((slot) => {
      const count = incidents.filter((i) => {
        const d = new Date(i.date)
        return d.getFullYear() === slot.year && d.getMonth() === slot.month
      }).length
      return { label: slot.label, value: count }
    })
  }, [incidents])
  const monthlyMax = Math.max(...monthlyData.map((d) => d.value), 1)

  // ── Indicateurs clés ──────────────────────────────────────────────────────
  const driverResponsibleCount = incidents.filter((i) => i.driverResponsible).length
  const driverPct = incidents.length > 0 ? Math.round((driverResponsibleCount / incidents.length) * 100) : 0

  const totalEstimated = incidents.reduce((s, i) => s + (i.estimatedRepairCost ?? 0), 0)
  const avgCost = incidents.length > 0 ? Math.round(totalEstimated / incidents.length) : 0

  const patientOnBoardCount = incidents.filter((i) => i.patientInVehicle).length
  const patientPct = incidents.length > 0 ? Math.round((patientOnBoardCount / incidents.length) * 100) : 0

  const providerCount: Record<string, number> = {}
  incidents.forEach((i) => {
    if (i.repairProvider) {
      providerCount[i.repairProvider] = (providerCount[i.repairProvider] || 0) + 1
    }
  })
  const topProvider = Object.entries(providerCount).sort((a, b) => b[1] - a[1])[0]

  if (incidents.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-gray-400">
        Aucune donnee statistique disponible.
      </div>
    )
  }

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Répartition par type */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Repartition par type</h3>
          <div className="space-y-3">
            <BarHorizontal label="Accident"   value={typeCount.ACCIDENT}  max={typeMax} color="bg-red-500"    />
            <BarHorizontal label="Vol"        value={typeCount.THEFT}     max={typeMax} color="bg-purple-500" />
            <BarHorizontal label="Vandalisme" value={typeCount.VANDALISM} max={typeMax} color="bg-yellow-500" />
            <BarHorizontal label="Panne"      value={typeCount.BREAKDOWN} max={typeMax} color="bg-gray-500"   />
          </div>
        </div>

        {/* Top 5 agences — label direct, sans replace() fragile */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Top 5 agences</h3>
          <div className="space-y-3">
            {topAgencies.map(([name, count]) => (
              <BarHorizontal key={name} label={name} value={count} max={agencyMax} color="bg-violet-500" />
            ))}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Evolution mensuelle — 6 mois glissants calculés depuis les incidents */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Evolution mensuelle (6 mois)</h3>
          <div className="flex justify-between items-end">
            {monthlyData.map((d) => (
              <BarVertical key={d.label} label={d.label} value={d.value} max={monthlyMax} color="bg-violet-500" />
            ))}
          </div>
        </div>

        {/* Taux de responsabilité conducteur */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Taux de responsabilite conducteur</h3>
          <div className="flex justify-center">
            <GaugeSvg value={driverPct} label={`${driverResponsibleCount} sinistres sur ${incidents.length}`} />
          </div>
        </div>

      </div>

      {/* KPIs bas de page */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-center">
          <p className="text-xs text-gray-500 mb-1">Cout moyen / sinistre</p>
          <p className="text-xl font-bold text-gray-800">{avgCost.toLocaleString('fr-FR')} EUR</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-center">
          <p className="text-xs text-gray-500 mb-1">Patient a bord</p>
          <p className="text-xl font-bold text-cyan-600">{patientOnBoardCount} ({patientPct}%)</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-center">
          <p className="text-xs text-gray-500 mb-1">Prestataire le plus sollicite</p>
          <p className="text-xl font-bold text-gray-800">{topProvider?.[0]?.split(' ')[0] ?? 'N/A'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-center">
          <p className="text-xs text-gray-500 mb-1">Sinistres avec tiers</p>
          <p className="text-xl font-bold text-orange-600">
            {incidents.filter((i) => i.thirdPartyInvolved).length}
          </p>
        </div>
      </div>

    </div>
  )
}
