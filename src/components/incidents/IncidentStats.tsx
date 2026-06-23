import { useMemo } from 'react'
import { AlertTriangle, Building2, TrendingUp, User, Heart, Wrench, Users } from 'lucide-react'
import type { Incident } from '@/data/mockIncidents'

// ── Helpers ────────────────────────────────────────────────────────
function getLast6Months(): { label: string; year: number; month: number }[] {
  const LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
  const now = new Date()
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    return { label: LABELS[d.getMonth()], year: d.getFullYear(), month: d.getMonth() }
  })
}

// ── StatCard ───────────────────────────────────────────────────────
function StatCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
        <div className="w-1 h-4 rounded-full bg-violet-600" />
        <Icon className="w-4 h-4 text-violet-500" />
        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{title}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

// ── Barre horizontale ──────────────────────────────────────────────
function HBar({
  label, value, max, color, rank,
}: {
  label: string; value: number; max: number; color: string; rank?: number
}) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      {rank !== undefined && (
        <span className="text-[10px] font-bold text-gray-400 w-4 flex-shrink-0">{rank}</span>
      )}
      <span className="text-xs font-semibold text-gray-700 w-24 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-bold text-gray-700 w-6 text-right flex-shrink-0">{value}</span>
    </div>
  )
}

// ── Graphique barres verticales (évolution mensuelle) ──────────────
function MonthlyChart({ data, max }: { data: { label: string; value: number }[]; max: number }) {
  return (
    <div className="flex items-end justify-between gap-2 h-28">
      {data.map((d) => {
        const pct = max > 0 ? (d.value / max) * 100 : 0
        return (
          <div key={d.label} className="flex flex-col items-center gap-1.5 flex-1">
            <span className="text-[10px] font-bold text-gray-500">{d.value > 0 ? d.value : ''}</span>
            <div className="w-full bg-gray-100 rounded-t-md overflow-hidden flex items-end" style={{ height: 72 }}>
              <div
                className="w-full rounded-t-md bg-violet-500 transition-all"
                style={{ height: `${pct}%`, minHeight: d.value > 0 ? 4 : 0 }}
              />
            </div>
            <span className="text-[10px] text-gray-400 font-medium">{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Jauge SVG ──────────────────────────────────────────────────────
function GaugeSvg({ value, sub }: { value: number; sub: string }) {
  const radius = 44
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  const color = value > 60 ? '#ef4444' : value > 30 ? '#f97316' : '#22c55e'

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={108} height={108} viewBox="0 0 108 108">
        <circle cx="54" cy="54" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="10" />
        <circle
          cx="54" cy="54" r={radius}
          fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 54 54)"
        />
        <text x="54" y="50" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 18, fontWeight: 800, fill: '#111827' }}>
          {value}%
        </text>
        <text x="54" y="66" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 9, fill: '#9ca3af' }}>
          responsable
        </text>
      </svg>
      <span className="text-xs text-gray-400 text-center">{sub}</span>
    </div>
  )
}

// ── KPI mini-card ──────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, color }: {
  icon:  React.ElementType
  label: string
  value: string | number
  color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-1.5">
        <div className={`w-1 h-3 rounded-full ${color}`} />
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="px-4 py-3 flex items-center gap-2">
        <Icon className={`w-4 h-4 flex-shrink-0 ${color.replace('bg-', 'text-')}`} />
        <span className="text-lg font-bold text-gray-800 leading-none">{value}</span>
      </div>
    </div>
  )
}

// ── Composant principal ────────────────────────────────────────────
interface IncidentStatsProps {
  incidents: Incident[]
}

export default function IncidentStats({ incidents }: IncidentStatsProps) {

  const typeCount = { ACCIDENT: 0, THEFT: 0, VANDALISM: 0, BREAKDOWN: 0 }
  incidents.forEach((i) => { typeCount[i.type]++ })
  const typeMax = Math.max(...Object.values(typeCount), 1)

  const agencyCount: Record<string, number> = {}
  incidents.forEach((i) => {
    agencyCount[i.agencyName] = (agencyCount[i.agencyName] || 0) + 1
  })
  const topAgencies = Object.entries(agencyCount).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const agencyMax = topAgencies[0]?.[1] || 1

  const monthlyData = useMemo(() => {
    const slots = getLast6Months()
    return slots.map((slot) => ({
      label: slot.label,
      value: incidents.filter((i) => {
        const d = new Date(i.date)
        return d.getFullYear() === slot.year && d.getMonth() === slot.month
      }).length,
    }))
  }, [incidents])
  const monthlyMax = Math.max(...monthlyData.map((d) => d.value), 1)

  const driverResponsibleCount = incidents.filter((i) => i.driverResponsible).length
  const driverPct = incidents.length > 0 ? Math.round((driverResponsibleCount / incidents.length) * 100) : 0

  const totalEstimated = incidents.reduce((s, i) => s + (i.estimatedRepairCost ?? 0), 0)
  const avgCost = incidents.length > 0 ? Math.round(totalEstimated / incidents.length) : 0

  const patientCount = incidents.filter((i) => i.patientInVehicle).length
  const patientPct   = incidents.length > 0 ? Math.round((patientCount / incidents.length) * 100) : 0

  const providerCount: Record<string, number> = {}
  incidents.forEach((i) => {
    if (i.repairProvider) providerCount[i.repairProvider] = (providerCount[i.repairProvider] || 0) + 1
  })
  const topProvider = Object.entries(providerCount).sort((a, b) => b[1] - a[1])[0]
  const thirdPartyCount = incidents.filter((i) => i.thirdPartyInvolved).length

  if (incidents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="w-10 h-10 text-gray-200 mb-3" />
        <p className="text-sm font-semibold text-gray-500">Aucune donnée statistique disponible</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* ── Ligne 1 : Types + Agences ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <StatCard title="Répartition par type" icon={AlertTriangle}>
          <div className="space-y-3">
            <HBar label="Accident"   value={typeCount.ACCIDENT}  max={typeMax} color="#ef4444" />
            <HBar label="Vol"        value={typeCount.THEFT}     max={typeMax} color="#8b5cf6" />
            <HBar label="Vandalisme" value={typeCount.VANDALISM} max={typeMax} color="#f59e0b" />
            <HBar label="Panne"      value={typeCount.BREAKDOWN} max={typeMax} color="#6b7280" />
          </div>
        </StatCard>

        <StatCard title="Top agences" icon={Building2}>
          <div className="space-y-3">
            {topAgencies.map(([name, count], i) => (
              <HBar key={name} label={name} value={count} max={agencyMax} color="#8b5cf6" rank={i + 1} />
            ))}
          </div>
        </StatCard>
      </div>

      {/* ── Ligne 2 : Évolution + Responsabilité ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <StatCard title="Évolution mensuelle (6 mois)" icon={TrendingUp}>
          <MonthlyChart data={monthlyData} max={monthlyMax} />
        </StatCard>

        <StatCard title="Taux de responsabilité conducteur" icon={User}>
          <div className="flex items-center justify-center gap-8 py-2">
            <GaugeSvg value={driverPct} sub={`${driverResponsibleCount} sinistre${driverResponsibleCount > 1 ? 's' : ''} sur ${incidents.length}`} />
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Conducteur responsable</p>
                <p className="text-2xl font-bold text-gray-900">{driverResponsibleCount}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Non responsable</p>
                <p className="text-2xl font-bold text-gray-900">{incidents.length - driverResponsibleCount}</p>
              </div>
            </div>
          </div>
        </StatCard>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={TrendingUp}
          label="Coût moyen / sinistre"
          value={`${avgCost.toLocaleString('fr-FR')} €`}
          color="bg-violet-500"
        />
        <KpiCard
          icon={Heart}
          label={`Patient à bord (${patientPct}%)`}
          value={`${patientCount} cas`}
          color="bg-cyan-500"
        />
        <KpiCard
          icon={Wrench}
          label="Prestataire principal"
          value={topProvider?.[0]?.split(' ')[0] ?? 'N/A'}
          color="bg-amber-500"
        />
        <KpiCard
          icon={Users}
          label="Sinistres avec tiers"
          value={thirdPartyCount}
          color="bg-orange-500"
        />
      </div>
    </div>
  )
}
