import { useMemo } from 'react'
import { ROLE_LABELS } from '@/data/mockDrivers'
import type { Driver, DriverRole, ContractType } from '@/types/index'
import { useAgencyFilter } from '@/hooks/useAgencyFilter'
import { useAppStore } from '@/store/useAppStore'
import { Users, Route, AlertTriangle, Briefcase, Building2 } from 'lucide-react'

// ── Helpers ────────────────────────────────────────────────────────
function formatNumber(n: number | undefined | null): string {
  return (n ?? 0).toLocaleString('fr-FR')
}

const ROLE_COLORS_HEX: Record<string, string> = {
  AMBULANCIER_DE:         '#ef4444',
  AUXILIAIRE_AMBULANCIER: '#f97316',
  CHAUFFEUR_VSL:          '#3b82f6',
  OTHER:                  '#9ca3af',
}

// ── Barre horizontale ──────────────────────────────────────────────
function HorizontalBar({
  label,
  value,
  max,
  color,
  count,
  rank,
  subLabel,
}: {
  label:     string
  value:     number
  max:       number
  color:     string
  count?:    string | number
  rank?:     number
  subLabel?: string
}) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      {rank !== undefined && (
        <span className="text-[10px] font-bold text-gray-400 w-4 flex-shrink-0">{rank}</span>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-gray-700 truncate">{label}</span>
          {subLabel && <span className="text-[10px] text-gray-400 ml-2 flex-shrink-0">{subLabel}</span>}
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
      </div>
      {count !== undefined && (
        <span className="text-xs font-bold text-gray-700 w-10 text-right flex-shrink-0">{count}</span>
      )}
    </div>
  )
}

// ── Card section ───────────────────────────────────────────────────
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

// ── Composant principal ────────────────────────────────────────────
interface DriverStatsProps {
  drivers: Driver[]
}

export default function DriverStats({ drivers }: DriverStatsProps) {
  const { agencies }        = useAppStore()
  const { visibleAgencyIds } = useAgencyFilter()

  const visibleAgencies = useMemo(
    () => agencies.filter((a) => visibleAgencyIds.includes(a.id)),
    [agencies, visibleAgencyIds]
  )

  const byRole = useMemo(() => {
    const counts: Record<DriverRole, number> = {
      AMBULANCIER_DE: 0, AUXILIAIRE_AMBULANCIER: 0, CHAUFFEUR_VSL: 0, OTHER: 0,
    }
    drivers.forEach((d) => { if (d.role && d.role in counts) counts[d.role]++ })
    return counts
  }, [drivers])

  const byAgency = useMemo(() => {
    const counts: Record<string, number> = {}
    visibleAgencies.forEach((a) => (counts[a.name] = 0))
    drivers.forEach((d) => {
      const agency = visibleAgencies.find((a) => a.id === d.agencyId)
      if (agency) counts[agency.name] = (counts[agency.name] ?? 0) + 1
    })
    return counts
  }, [drivers, visibleAgencies])

  const byContract = useMemo(() => {
    const counts: Record<ContractType, number> = { CDI: 0, CDD: 0, INTERIM: 0 }
    drivers.forEach((d) => {
      const ct = d.contractType ?? 'CDI'
      if (ct in counts) counts[ct]++
    })
    return counts
  }, [drivers])

  const topMileage = useMemo(
    () => [...drivers].sort((a, b) => (b.totalMileage ?? 0) - (a.totalMileage ?? 0)).slice(0, 5),
    [drivers]
  )

  const topIncidents = useMemo(
    () => [...drivers].sort((a, b) => (b.incidentsCount ?? 0) - (a.incidentsCount ?? 0)).slice(0, 5),
    [drivers]
  )

  const maxMileage   = drivers.length > 0 ? Math.max(...drivers.map((d) => d.totalMileage   ?? 0)) : 0
  const maxIncidents = drivers.length > 0 ? Math.max(...drivers.map((d) => d.incidentsCount ?? 0)) : 0
  const maxAgency    = Math.max(...Object.values(byAgency), 1)
  const totalContract = Object.values(byContract).reduce((a, b) => a + b, 0)

  // Camembert contrats
  const contractData = [
    { label: 'CDI',     value: byContract.CDI,     color: '#10b981', bg: 'bg-emerald-100', text: 'text-emerald-700' },
    { label: 'CDD',     value: byContract.CDD,     color: '#f59e0b', bg: 'bg-amber-100',   text: 'text-amber-700'   },
    { label: 'Intérim', value: byContract.INTERIM,  color: '#6b7280', bg: 'bg-gray-100',    text: 'text-gray-600'    },
  ]

  const RADIUS = 56
  const CX = 76
  const CY = 76
  let currentAngle = -90
  const paths = contractData
    .filter((d) => d.value > 0)
    .map((d) => {
      const angle      = (d.value / totalContract) * 360
      const startAngle = currentAngle
      const endAngle   = currentAngle + angle
      currentAngle     = endAngle
      const x1 = CX + RADIUS * Math.cos((startAngle * Math.PI) / 180)
      const y1 = CY + RADIUS * Math.sin((startAngle * Math.PI) / 180)
      const x2 = CX + RADIUS * Math.cos((endAngle * Math.PI) / 180)
      const y2 = CY + RADIUS * Math.sin((endAngle * Math.PI) / 180)
      const large = angle > 180 ? 1 : 0
      return {
        path: `M ${CX} ${CY} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${large} 1 ${x2} ${y2} Z`,
        color: d.color,
        label: d.label,
        value: d.value,
      }
    })

  if (drivers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Users className="w-10 h-10 text-gray-200 mb-3" />
        <p className="text-sm font-semibold text-gray-500">Aucune donnée statistique disponible</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

      {/* ── Colonne gauche ── */}
      <div className="space-y-4">

        {/* Répartition par rôle */}
        <StatCard title="Répartition par rôle" icon={Users}>
          <div className="space-y-3">
            {(Object.keys(byRole) as DriverRole[]).map((role) => (
              <HorizontalBar
                key={role}
                label={ROLE_LABELS[role]}
                value={byRole[role] ?? 0}
                max={drivers.length}
                color={ROLE_COLORS_HEX[role] ?? '#9ca3af'}
                count={`${byRole[role] ?? 0}`}
                subLabel={drivers.length > 0 ? `${Math.round(((byRole[role] ?? 0) / drivers.length) * 100)}%` : '0%'}
              />
            ))}
          </div>
        </StatCard>

        {/* Répartition par agence */}
        <StatCard title="Répartition par agence" icon={Building2}>
          <div className="space-y-3">
            {visibleAgencies.map((agency) => (
              <HorizontalBar
                key={agency.id}
                label={agency.name}
                value={byAgency[agency.name] ?? 0}
                max={maxAgency}
                color="#8b5cf6"
                count={`${byAgency[agency.name] ?? 0}`}
              />
            ))}
          </div>
        </StatCard>

        {/* Répartition contrats */}
        <StatCard title="Répartition CDI / CDD / Intérim" icon={Briefcase}>
          {totalContract === 0 ? (
            <p className="text-sm text-gray-400 italic">Aucune donnée de contrat disponible.</p>
          ) : (
            <div className="flex items-center gap-6">
              <svg width={152} height={152} viewBox="0 0 152 152">
                {paths.map((p, i) => (
                  <path key={i} d={p.path} fill={p.color} />
                ))}
                <circle cx={CX} cy={CY} r={28} fill="white" />
                <text x={CX} y={CY + 1} textAnchor="middle" dominantBaseline="middle" className="text-xs" style={{ fontSize: 11, fontWeight: 700, fill: '#374151' }}>
                  {drivers.length}
                </text>
                <text x={CX} y={CY + 14} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 8, fill: '#9ca3af' }}>
                  conducteurs
                </text>
              </svg>
              <div className="space-y-3 flex-1">
                {contractData.map((d) => (
                  <div key={d.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-sm text-gray-600">{d.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-800">{d.value}</span>
                      <span className="text-[10px] text-gray-400">
                        {totalContract > 0 ? `${Math.round((d.value / totalContract) * 100)}%` : '0%'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </StatCard>
      </div>

      {/* ── Colonne droite ── */}
      <div className="space-y-4">

        {/* Top kilométrage */}
        <StatCard title="Top kilométrage" icon={Route}>
          <div className="space-y-3">
            {topMileage.map((d, i) => (
              <HorizontalBar
                key={d.id}
                label={`${d.firstName} ${d.lastName}`}
                value={d.totalMileage ?? 0}
                max={maxMileage}
                color="#8b5cf6"
                rank={i + 1}
                count={`${formatNumber(d.totalMileage)} km`}
              />
            ))}
          </div>
        </StatCard>

        {/* Top sinistres */}
        <StatCard title="Sinistres par conducteur" icon={AlertTriangle}>
          <div className="space-y-3">
            {topIncidents.map((d, i) => {
              const count = d.incidentsCount ?? 0
              return (
                <HorizontalBar
                  key={d.id}
                  label={`${d.firstName} ${d.lastName}`}
                  value={count}
                  max={maxIncidents}
                  color={count > 2 ? '#ef4444' : '#f97316'}
                  rank={i + 1}
                  count={
                    <span className={count > 2 ? 'text-red-600 font-bold' : count > 0 ? 'text-amber-600 font-semibold' : 'text-gray-500'}>
                      {count}
                    </span> as any
                  }
                />
              )
            })}
          </div>
        </StatCard>

      </div>
    </div>
  )
}
