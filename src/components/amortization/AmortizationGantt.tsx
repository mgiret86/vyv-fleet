import { useMemo } from 'react'
import { TrendingDown, CheckCircle2, Clock } from 'lucide-react'
import type { Amortization } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────
function formatEur(n: number): string {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
}
function formatMonthLabel(iso: string): string {
  const [y, m] = iso.split('-')
  return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
}

// ─── Config couleurs par source ───────────────────────────────────
const SOURCE_CONFIG = {
  CREDIT_BAIL: { label: 'Crédit-bail (VR)', bar: 'bg-violet-400', badge: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
  MAINTENANCE:  { label: 'Maintenance',      bar: 'bg-blue-400',   badge: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500'   },
}

// ─── Props ────────────────────────────────────────────────────────
interface AmortizationGanttProps {
  amortizations: Amortization[]
  title?:        string
  showVehicle?:  boolean // true = page Finance (flotte), false = fiche véhicule
  vehicleLabel?: (vehicleId: string) => string
}

export default function AmortizationGantt({
  amortizations,
  title        = 'Suivi des amortissements',
  showVehicle  = false,
  vehicleLabel = (id) => id,
}: AmortizationGanttProps) {

  // ─── Calcul de la fenêtre temporelle ──────────────────────────
  const { months, minMonth, maxMonth } = useMemo(() => {
    if (amortizations.length === 0) return { months: [], minMonth: '', maxMonth: '' }

    const allMonths = amortizations.flatMap((a) => a.entries.map((e) => e.month))
    const sorted    = [...new Set(allMonths)].sort()
    const minMonth  = sorted[0]
    const maxMonth  = sorted[sorted.length - 1]

    // Génère tous les mois de la fenêtre
    const months: string[] = []
    const cursor = new Date(minMonth + '-01')
    const end    = new Date(maxMonth + '-01')
    while (cursor <= end) {
      months.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`)
      cursor.setMonth(cursor.getMonth() + 1)
    }
    return { months, minMonth, maxMonth }
  }, [amortizations])

  const today = new Date()
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  // ─── Dotation mensuelle totale par mois (toutes sources) ──────
  const totalByMonth = useMemo(() => {
    return months.map((month) => ({
      month,
      total: amortizations
        .filter((a) => a.status === 'ACTIVE')
        .reduce((sum, a) => {
          const entry = a.entries.find((e) => e.month === month)
          return sum + (entry?.dotation ?? 0)
        }, 0),
    }))
  }, [amortizations, months])

  const maxDotation = Math.max(...totalByMonth.map((m) => m.total), 1)

  if (amortizations.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center">
        <TrendingDown className="w-8 h-8 text-gray-200 mx-auto mb-3" />
        <p className="text-sm text-gray-400 font-medium">Aucun amortissement en cours</p>
        <p className="text-xs text-gray-300 mt-1">
          Les amortissements apparaîtront ici dès leur création
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

      {/* ── En-tête ── */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-violet-500" />
          <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {amortizations.length} amortissement{amortizations.length > 1 ? 's' : ''}
          </span>
        </div>
        {/* Légende */}
        <div className="flex items-center gap-4">
          {Object.entries(SOURCE_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
              <span className="text-xs text-gray-500">{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-5 space-y-6">

        {/* ── Graphique dotation mensuelle ── */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Dotation mensuelle totale
          </p>
          <div className="flex items-end gap-1 h-20 overflow-x-auto pb-1">
            {totalByMonth.map(({ month, total }) => {
              const pct      = (total / maxDotation) * 100
              const isPast   = month < currentMonth
              const isCurrent = month === currentMonth
              return (
                <div key={month} className="flex flex-col items-center gap-1 flex-shrink-0" style={{ minWidth: '28px' }}>
                  <div className="w-full flex items-end justify-center" style={{ height: '56px' }}>
                    <div
                      className={`w-full rounded-t-sm transition-colors ${
                        isCurrent ? 'bg-violet-500' :
                        isPast    ? 'bg-gray-200'   : 'bg-violet-200 hover:bg-violet-300'
                      }`}
                      style={{ height: `${Math.max(4, pct)}%` }}
                      title={`${formatMonthLabel(month)} : ${formatEur(total)}`}
                    />
                  </div>
                  {isCurrent && (
                    <span className="text-[8px] font-bold text-violet-600">
                      {formatMonthLabel(month)}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-between mt-1 text-xs text-gray-400">
            <span>{minMonth ? formatMonthLabel(minMonth) : ''}</span>
            <span className="text-violet-600 font-medium">
              Aujourd'hui : {formatEur(totalByMonth.find((m) => m.month === currentMonth)?.total ?? 0)}/mois
            </span>
            <span>{maxMonth ? formatMonthLabel(maxMonth) : ''}</span>
          </div>
        </div>

        {/* ── Gantt lignes ── */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Calendrier des amortissements
          </p>

          {/* En-tête mois — limité aux 24 prochains mois depuis aujourd'hui pour lisibilité */}
          {(() => {
            const visibleMonths = months.filter((m) => {
              const d = new Date(m + '-01')
              const limit = new Date()
              limit.setMonth(limit.getMonth() + 24)
              const start = new Date()
              start.setMonth(start.getMonth() - 6)
              return d >= start && d <= limit
            })

            return (
              <div className="overflow-x-auto">
                <div style={{ minWidth: `${Math.max(600, visibleMonths.length * 36)}px` }}>

                  {/* Header mois */}
                  <div className="flex mb-2" style={{ paddingLeft: showVehicle ? '320px' : '240px' }}>
                    {visibleMonths.map((month) => (
                      <div
                        key={month}
                        className={`flex-shrink-0 text-center text-[10px] font-medium ${
                          month === currentMonth ? 'text-violet-600' : 'text-gray-400'
                        }`}
                        style={{ width: '36px' }}
                      >
                        {formatMonthLabel(month)}
                      </div>
                    ))}
                  </div>

                  {/* Ligne par amortissement */}
                  {amortizations.map((amort) => {
                    const cfg       = SOURCE_CONFIG[amort.source]
                    const isClosed  = amort.status === 'CLOSED'
                    const vnc       = (() => {
                      const lastPassed = [...amort.entries]
                        .filter((e) => e.month <= currentMonth)
                        .pop()
                      return lastPassed?.remaining ?? amort.amount
                    })()

                    return (
                      <div
                        key={amort.id}
                        className="flex items-center mb-2 group"
                      >
                        {/* Label */}
                        <div
                          className="flex-shrink-0 pr-3"
                          style={{ width: showVehicle ? '320px' : '240px' }}
                        >
                          <div className="flex items-start gap-2">
                            {isClosed
                              ? <CheckCircle2 className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-0.5" />
                              : <Clock className="w-3.5 h-3.5 text-violet-400 flex-shrink-0 mt-0.5" />
                            }
                            <div className="min-w-0">
                              <p className={`text-xs font-medium truncate ${isClosed ? 'text-gray-400' : 'text-gray-700'}`}>
                                {amort.label}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
                                  {cfg.label}
                                </span>
                                {showVehicle && (
                                  <span className="text-[10px] text-gray-400">
                                    {vehicleLabel(amort.vehicleId)}
                                  </span>
                                )}
                                <span className="text-[10px] text-gray-400">
                                  {formatEur(amort.amount)} · {amort.durationMonths}m
                                </span>
                                {!isClosed && (
                                  <span className="text-[10px] text-violet-600 font-medium">
                                    VNC : {formatEur(vnc)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Barre Gantt */}
                        <div className="flex flex-1">
                          {visibleMonths.map((month) => {
                            const entry    = amort.entries.find((e) => e.month === month)
                            const isActive = Boolean(entry) && !isClosed
                            const isPast   = month < currentMonth
                            const isCur    = month === currentMonth
                            const isFirst  = amort.entries[0]?.month === month
                            const isLast   = amort.entries[amort.entries.length - 1]?.month === month

                            return (
                              <div
                                key={month}
                                className="flex-shrink-0 flex items-center justify-center"
                                style={{ width: '36px', height: '28px' }}
                                title={entry ? `${formatMonthLabel(month)} : ${formatEur(entry.dotation)}/mois` : undefined}
                              >
                                {isActive ? (
                                  <div
                                    className={`h-5 w-full transition-opacity ${
                                      isCur     ? `${cfg.bar} opacity-100` :
                                      isPast    ? `${cfg.bar} opacity-40`  :
                                                  `${cfg.bar} opacity-70 group-hover:opacity-90`
                                    } ${isFirst ? 'rounded-l-full ml-1' : ''} ${isLast ? 'rounded-r-full mr-1' : ''}`}
                                  />
                                ) : isClosed && entry ? (
                                  <div className="h-5 w-full bg-gray-100 opacity-50
                                    first:rounded-l-full last:rounded-r-full" />
                                ) : (
                                  <div
                                    className={`w-px h-3 ${month === currentMonth ? 'bg-violet-200' : 'bg-gray-100'}`}
                                  />
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}

                  {/* Ligne de today */}
                  <div className="flex mt-1" style={{ paddingLeft: showVehicle ? '320px' : '240px' }}>
                    {visibleMonths.map((month) => (
                      <div
                        key={month}
                        className="flex-shrink-0 flex justify-center"
                        style={{ width: '36px' }}
                      >
                        {month === currentMonth && (
                          <div className="w-0.5 h-3 bg-violet-400 rounded-full" />
                        )}
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            )
          })()}
        </div>

        {/* ── Tableau récapitulatif ── */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Détail des amortissements
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  {[
                    'Libellé', 'Source', 'Réf. comptable',
                    'Montant', 'Dotation/mois', 'Début', 'Fin', 'VNC', 'Statut'
                  ].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {amortizations.map((amort) => {
                  const cfg      = SOURCE_CONFIG[amort.source]
                  const dotation = amort.amount / amort.durationMonths
                  const endDate  = (() => {
                    const d = new Date(amort.startDate)
                    d.setMonth(d.getMonth() + amort.durationMonths)
                    return d.toLocaleDateString('fr-FR', { month: '2-digit', year: 'numeric' })
                  })()
                  const vnc = (() => {
                    const lastPassed = [...amort.entries]
                      .filter((e) => e.month <= currentMonth)
                      .pop()
                    return lastPassed?.remaining ?? amort.amount
                  })()

                  return (
                    <tr key={amort.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-gray-800 text-xs">{amort.label}</p>
                        {showVehicle && (
                          <p className="text-[10px] text-gray-400">{vehicleLabel(amort.vehicleId)}</p>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-500 font-mono">{amort.reference}</td>
                      <td className="px-3 py-2.5 text-xs font-semibold text-gray-800">{formatEur(amort.amount)}</td>
                      <td className="px-3 py-2.5 text-xs font-semibold text-violet-700">{formatEur(dotation)}</td>
                      <td className="px-3 py-2.5 text-xs text-gray-500">
                        {new Date(amort.startDate).toLocaleDateString('fr-FR', { month: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-500">{endDate}</td>
                      <td className="px-3 py-2.5 text-xs font-bold text-gray-900">{formatEur(vnc)}</td>
                      <td className="px-3 py-2.5">
                        {amort.status === 'CLOSED' ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            Clôturé
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            Actif
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {/* Totaux */}
              <tfoot className="border-t-2 border-gray-200 bg-violet-50">
                <tr>
                  <td colSpan={3} className="px-3 py-2.5 text-xs font-semibold text-violet-700">
                    TOTAL ({amortizations.filter((a) => a.status === 'ACTIVE').length} actifs)
                  </td>
                  <td className="px-3 py-2.5 text-xs font-bold text-violet-700">
                    {formatEur(amortizations.reduce((s, a) => s + a.amount, 0))}
                  </td>
                  <td className="px-3 py-2.5 text-xs font-bold text-violet-700">
                    {formatEur(
                      amortizations
                        .filter((a) => a.status === 'ACTIVE')
                        .reduce((s, a) => {
                          const entry = a.entries.find((e) => e.month === currentMonth)
                          return s + (entry?.dotation ?? 0)
                        }, 0)
                    )}
                  </td>
                  <td colSpan={2} />
                  <td className="px-3 py-2.5 text-xs font-bold text-gray-900">
                    {formatEur(
                      amortizations
                        .filter((a) => a.status === 'ACTIVE')
                        .reduce((s, a) => {
                          const lastPassed = [...a.entries].filter((e) => e.month <= currentMonth).pop()
                          return s + (lastPassed?.remaining ?? a.amount)
                        }, 0)
                    )}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
