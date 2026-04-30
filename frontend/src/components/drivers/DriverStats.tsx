import { useMemo } from 'react'
import { ROLE_LABELS } from '@/data/mockDrivers'
import type { Driver, DriverRole, ContractType } from '@/types/index'
import { useAgencyFilter } from '@/hooks/useAgencyFilter'
import { useAppStore } from '@/store/useAppStore'

function formatNumber(n: number | undefined | null): string {
  return (n ?? 0).toLocaleString('fr-FR')
}

const MAX_BAR_W = 180

function HorizontalBar({
  label,
  value,
  max,
  color,
  showCount,
}: {
  label: string
  value: number
  max: number
  color: string
  showCount?: boolean
}) {
  const w = max > 0 ? (value / max) * MAX_BAR_W : 0
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-600 w-32 truncate">{label}</span>
      <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
        <div className="h-full rounded" style={{ width: `${w}px`, backgroundColor: color }} />
      </div>
      {showCount && (
        <span className="text-xs font-semibold text-gray-700 w-6 text-right">{value}</span>
      )}
    </div>
  )
}

interface DriverStatsProps {
  drivers: Driver[]
}

export default function DriverStats({ drivers }: DriverStatsProps) {
  const { agencies } = useAppStore()
  const { visibleAgencyIds } = useAgencyFilter()

  const visibleAgencies = useMemo(
    () => agencies.filter((a) => visibleAgencyIds.includes(a.id)),
    [agencies, visibleAgencyIds]
  )

  // Répartition par rôle
  const byRole = useMemo(() => {
    const counts: Record<DriverRole, number> = {
      AMBULANCIER_DE:         0,
      AUXILIAIRE_AMBULANCIER: 0,
      CHAUFFEUR_VSL:          0,
      OTHER:                  0,
    }
    drivers.forEach((d) => {
      if (d.role && d.role in counts) counts[d.role]++
    })
    return counts
  }, [drivers])

  // Répartition par agence
  const byAgency = useMemo(() => {
    const counts: Record<string, number> = {}
    visibleAgencies.forEach((a) => (counts[a.name] = 0))
    drivers.forEach((d) => {
      const agency = visibleAgencies.find((a) => a.id === d.agencyId)
      if (agency) counts[agency.name] = (counts[agency.name] ?? 0) + 1
    })
    return counts
  }, [drivers, visibleAgencies])

  // Répartition par type de contrat — fallback si contractType absent
  const byContract = useMemo(() => {
    const counts: Record<ContractType, number> = { CDI: 0, CDD: 0, INTERIM: 0 }
    drivers.forEach((d) => {
      const ct = d.contractType ?? 'CDI' // Fallback to 'CDI' if undefined
      if (ct in counts) counts[ct]++
    })
    return counts
  }, [drivers])

  // Classement kilométrage — fallback ?? 0
  const topMileage = useMemo(
    () =>
      [...drivers]
        .sort((a, b) => (b.totalMileage ?? 0) - (a.totalMileage ?? 0))
        .slice(0, 5),
    [drivers]
  )

  // Classement sinistres — fallback ?? 0
  const topIncidents = useMemo(
    () =>
      [...drivers]
        .sort((a, b) => (b.incidentsCount ?? 0) - (a.incidentsCount ?? 0))
        .slice(0, 5),
    [drivers]
  )

  const maxMileage   = drivers.length > 0 ? Math.max(...drivers.map((d) => d.totalMileage   ?? 0)) : 0
  const maxIncidents = drivers.length > 0 ? Math.max(...drivers.map((d) => d.incidentsCount ?? 0)) : 0
  const totalContract = Object.values(byContract).reduce((a, b) => a + b, 0)

  // Camembert contrats
  const SVG_W = 320
  const SVG_H = 160
  const RADIUS = 60
  const CX = 90
  const CY = 80

  const contractData = [
    { label: 'CDI',    value: byContract.CDI,    color: '#10b981' },
    { label: 'CDD',    value: byContract.CDD,    color: '#f59e0b' },
    { label: 'INTERIM', value: byContract.INTERIM, color: '#6b7280' },
  ]

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
      <div className="flex items-center justify-center py-20 text-sm text-gray-400">
        Aucune donnee statistique disponible.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-6">

      {/* Colonne gauche */}
      <div className="space-y-6">

        {/* Répartition par rôle */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-800 mb-4">Repartition par role</h3>
          <div className="space-y-2">
            {(Object.keys(byRole) as DriverRole[]).map((role) => (
              <HorizontalBar
                key={role}
                label={ROLE_LABELS[role]}
                value={byRole[role] ?? 0}
                max={drivers.length}
                color={
                  role === 'AMBULANCIER_DE'           ? '#ef4444'
                  : role === 'AUXILIAIRE_AMBULANCIER' ? '#f97316'
                  : role === 'CHAUFFEUR_VSL'          ? '#3b82f6'
                  : '#6b7280'
                }
                showCount
              />
            ))}
          </div>
        </div>

        {/* Répartition par agence */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-800 mb-4">Repartition par agence</h3>
          <div className="space-y-2">
            {visibleAgencies.map((agency) => (
              <HorizontalBar
                key={agency.id}
                label={agency.name}
                value={byAgency[agency.name] ?? 0}
                max={Math.max(...Object.values(byAgency), 1)}
                color="#9ca3af"
                showCount
              />
            ))}
          </div>
        </div>

      </div>

      {/* Colonne droite */}
      <div className="space-y-6">

        {/* Top kilométrage */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-800 mb-4">Top kilometrage</h3>
          <div className="space-y-2">
            {topMileage.map((d, i) => (
              <div key={d.id} className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 w-4">{i + 1}</span>
                <span className="text-xs text-gray-700 w-28 truncate">{d.firstName} {d.lastName}</span>
                <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
                  <div
                    className="h-full bg-violet-500 rounded"
                    style={{
                      width: `${maxMileage > 0 ? ((d.totalMileage ?? 0) / maxMileage) * MAX_BAR_W : 0}px`,
                    }}
                  />
                </div>
                <span className="text-xs text-gray-600 w-16 text-right">
                  {formatNumber(d.totalMileage ?? 0)} km
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sinistres par conducteur */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-800 mb-4">Sinistres par conducteur</h3>
          <div className="space-y-2">
            {topIncidents.map((d, i) => {
              const count = d.incidentsCount ?? 0
              return (
                <div key={d.id} className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 w-4">{i + 1}</span>
                  <span className="text-xs text-gray-700 w-28 truncate">{d.firstName} {d.lastName}</span>
                  <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
                    <div
                      className={`h-full rounded ${count > 2 ? 'bg-red-500' : 'bg-orange-500'}`}
                      style={{
                        width: `${maxIncidents > 0 ? (count / maxIncidents) * MAX_BAR_W : 0}px`,
                      }}
                    />
                  </div>
                  <span className={`text-xs w-6 text-right ${count > 2 ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Répartition CDI / CDD / Intérim */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-800 mb-4">Repartition CDI / CDD / Interim</h3>
          {totalContract === 0 ? (
            <p className="text-sm text-gray-400">Aucune donnee de contrat disponible.</p>
          ) : (
            <div className="flex items-center gap-6">
              <svg width={SVG_W} height={SVG_H}>
                {paths.map((p, i) => (
                  <path key={i} d={p.path} fill={p.color} />
                ))}
                <circle cx={CX} cy={CY} r={30} fill="white" />
              </svg>
              <div className="space-y-2">
                {contractData.map((d) => (
                  <div key={d.label} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-xs text-gray-600">{d.label}: {d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}