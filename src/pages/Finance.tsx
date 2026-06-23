import { useMemo, useEffect } from 'react'
import {
  Euro, TrendingUp, TrendingDown, AlertTriangle, Clock,
  Car, BarChart3, Gauge, FileText,
} from 'lucide-react'
import { useVehicleStore }         from '@/store/vehicleStore'
import { useVehicleContractStore } from '@/store/vehicleContractStore'
import type { VehicleContract, VehicleContractType } from '@/types'
import { useAmortizationStore }    from '@/store/amortizationStore'
import AmortizationGantt           from '@/components/amortization/AmortizationGantt'

// ─── Config types ─────────────────────────────────────────────────
const TYPE_CONFIG: Record<VehicleContractType, { label: string; color: string; dot: string }> = {
  CREDIT_BAIL:     { label: 'Crédit-bail',     color: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
  LOA:             { label: 'LOA',             color: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500'   },
  LLD:             { label: 'LLD',             color: 'bg-green-100 text-green-700',   dot: 'bg-green-500'  },
  CREDIT_BANCAIRE: { label: 'Crédit bancaire', color: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-500'  },
  EN_PROPRIETE:    { label: 'En propriété',    color: 'bg-gray-100 text-gray-700',     dot: 'bg-gray-400'   },
}

const TYPE_FALLBACK = { label: 'Inconnu', color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-300' }

function getTypeCfg(type: string) {
  return TYPE_CONFIG[type as VehicleContractType] ?? TYPE_FALLBACK
}

const ALL_TYPES: VehicleContractType[] = ['LLD', 'LOA', 'CREDIT_BAIL', 'CREDIT_BANCAIRE', 'EN_PROPRIETE']

// ─── Helpers ──────────────────────────────────────────────────────
function formatEur(n: number): string {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
}

// ─── KPI Card (avec bordure gauche colorée) ───────────────────────
function KpiCard({ label, value, sub, icon, borderColor, bgColor }: {
  label: string; value: string; sub?: string
  icon: React.ReactNode; borderColor: string; bgColor: string
}) {
  return (
    <div className={`bg-white rounded-xl border border-l-4 ${borderColor} shadow-sm p-5 flex items-start gap-4`}>
      <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-400 mb-1">{label}</p>
        <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Barre de répartition ─────────────────────────────────────────
function DistributionBar({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return <p className="text-xs text-gray-300 italic">Aucune donnée</p>
  return (
    <div className="space-y-3">
      <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
        {data.filter((d) => d.value > 0).map((d) => (
          <div key={d.label} className={`${d.color} transition-all`} style={{ width: `${(d.value / total) * 100}%` }} />
        ))}
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        {data.filter((d) => d.value > 0).map((d) => (
          <div key={d.label} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${d.color}`} />
            <span className="text-xs text-gray-500">{d.label}</span>
            <span className="text-xs font-semibold text-gray-700">{Math.round((d.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Ligne de contrat ─────────────────────────────────────────────
function ContractRow({ contract, vehicleName, currentMileage }: {
  contract: VehicleContract; vehicleName: string; currentMileage: number
}) {
  const { computeKmStatus } = useVehicleContractStore()

  const cfg     = getTypeCfg(contract.type)
  const isOwned = contract.type === 'EN_PROPRIETE'
  const hasEnd  = Boolean(contract.endDate)
  const days    = hasEnd ? daysUntil(contract.endDate) : null
  const needsKm = contract.type === 'LOA' || contract.type === 'LLD'
  const kmStatus = needsKm ? computeKmStatus(contract, currentMileage) : null

  const urgency =
    days == null ? 'text-gray-500 bg-gray-50 border-gray-200'        :
    days < 0     ? 'text-red-600 bg-red-50 border-red-200'           :
    days <= 30   ? 'text-red-600 bg-red-50 border-red-200'           :
    days <= 90   ? 'text-amber-600 bg-amber-50 border-amber-200'     :
                   'text-green-600 bg-green-50 border-green-200'

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <Car className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-900">{vehicleName}</span>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
      </td>
      <td className="py-3 px-4 text-sm text-gray-600">
        {isOwned ? <span className="italic text-gray-300">—</span> : contract.lessorName}
      </td>
      <td className="py-3 px-4 text-sm font-semibold text-gray-900">
        {isOwned ? '—' : formatEur(contract.monthlyRentHT)}
      </td>
      <td className="py-3 px-4 text-sm text-gray-600">
        {isOwned ? '—' : formatEur(contract.monthlyInsuranceCost ?? 0)}
      </td>
      <td className="py-3 px-4 text-sm font-bold text-violet-700">
        {isOwned ? '—' : formatEur(contract.monthlyRentHT + (contract.monthlyInsuranceCost ?? 0))}
      </td>
      <td className="py-3 px-4">
        {!hasEnd ? (
          <span className="text-xs text-gray-400 italic">Non définie</span>
        ) : (
          <div className="flex flex-col items-start gap-1">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${urgency}`}>
              {days! < 0 ? `Expiré (${Math.abs(days!)}j)` : `J-${days}`}
            </span>
            <span className="text-[10px] text-gray-400">{formatDate(contract.endDate)}</span>
          </div>
        )}
      </td>
      <td className="py-3 px-4">
        {kmStatus && contract.contractedKmTotal ? (
          <div className="space-y-1 min-w-[100px]">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  kmStatus.progressPct >= 100 ? 'bg-red-500' :
                  kmStatus.progressPct >= 85  ? 'bg-amber-500' : 'bg-violet-500'
                }`}
                style={{ width: `${Math.min(100, kmStatus.progressPct)}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400">
              {kmStatus.progressPct}% · {kmStatus.contractKmDone.toLocaleString('fr-FR')} km
            </p>
          </div>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )}
      </td>
    </tr>
  )
}

// ─── Page principale ──────────────────────────────────────────────
export default function Finance() {
  const { vehicles }                                   = useVehicleStore()
  const { contracts, computeKmStatus, fetchContracts } = useVehicleContractStore()
  const { amortizations, fetchAmortizations }          = useAmortizationStore()

  useEffect(() => { fetchContracts() },    [])
  useEffect(() => { fetchAmortizations() }, [])

  const activeContracts    = useMemo(() => contracts.filter((c) => c.isActive && c.status === 'ACTIVE'), [contracts])
  const financialContracts = useMemo(() => activeContracts.filter((c) => c.type !== 'EN_PROPRIETE'), [activeContracts])

  const enriched = useMemo(() => activeContracts.map((c) => {
    const v = vehicles.find((v) => v.id === c.vehicleId)
    return {
      contract:       c,
      vehicleName:    v ? `${v.registration} — ${v.brand} ${v.model}` : 'Véhicule inconnu',
      currentMileage: v?.mileage ?? 0,
    }
  }), [activeContracts, vehicles])

  const totalMonthlyRent      = financialContracts.reduce((s, c) => s + c.monthlyRentHT, 0)
  const totalMonthlyInsurance = financialContracts.reduce((s, c) => s + (c.monthlyInsuranceCost ?? 0), 0)
  const totalMonthlyKnown     = totalMonthlyRent + totalMonthlyInsurance

  const totalMonthlyAmortization = useMemo(() => {
    const today        = new Date()
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
    return amortizations
      .filter((a) => a.status === 'ACTIVE')
      .reduce((sum, a) => {
        const entry = a.entries.find((e) => e.month === currentMonth)
        return sum + (entry?.dotation ?? 0)
      }, 0)
  }, [amortizations])

  const totalMonthlyCost = totalMonthlyKnown + totalMonthlyAmortization

  const expiringSoon = financialContracts.filter((c) => {
    if (!c.endDate) return false
    const d = daysUntil(c.endDate)
    return d >= 0 && d <= 90
  })
  const expired = financialContracts.filter((c) => c.endDate && daysUntil(c.endDate) < 0)
  const kmAlerts = financialContracts.filter((c) => {
    if (c.type !== 'LOA' && c.type !== 'LLD') return false
    const v = vehicles.find((v) => v.id === c.vehicleId)
    if (!v) return false
    return (computeKmStatus(c, v.mileage).projectedOverrun ?? 0) > 0
  })

  const byType = useMemo(() =>
    ALL_TYPES.map((t) => ({
      label: getTypeCfg(t).label,
      value: activeContracts.filter((c) => c.type === t).length,
      color: getTypeCfg(t).dot,
      rent:  financialContracts.filter((c) => c.type === t).reduce((s, c) => s + c.monthlyRentHT, 0),
    })),
    [activeContracts, financialContracts]
  )

  const sparkValues = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => {
      const expiring = financialContracts
        .filter((c) => {
          if (!c.endDate) return false
          const end = new Date(c.endDate)
          const ref = new Date(); ref.setMonth(ref.getMonth() + i)
          return end <= ref
        })
        .reduce((s, c) => s + c.monthlyRentHT, 0)
      return totalMonthlyRent - expiring
    }),
    [financialContracts, totalMonthlyRent]
  )

  const sorted = useMemo(() =>
    [...enriched].sort((a, b) => {
      if (!a.contract.endDate) return 1
      if (!b.contract.endDate) return -1
      return new Date(a.contract.endDate).getTime() - new Date(b.contract.endDate).getTime()
    }),
    [enriched]
  )

  const hasAlerts = expiringSoon.length > 0 || expired.length > 0 || kmAlerts.length > 0

  return (
    <>
      {/* ── Header gradient ── */}
      <div className="bg-gradient-to-r from-violet-950 to-violet-800 rounded-2xl px-6 py-5 mb-6 shadow-lg">
        <div className="flex items-center justify-between gap-4 flex-wrap">

          <div className="flex items-center gap-5 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Finance & Contrats</h1>
                <p className="text-violet-300 text-xs mt-0.5">
                  {activeContracts.length} contrat{activeContracts.length > 1 ? 's' : ''} actif{activeContracts.length > 1 ? 's' : ''} ·
                  {financialContracts.length} avec engagement financier
                </p>
              </div>
            </div>

            {/* Compteurs rapides */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/20 border border-violet-400/30">
                <span className="text-xs font-bold text-violet-200">{formatEur(totalMonthlyRent)}</span>
                <span className="text-[10px] text-violet-400">loyers/mois</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20">
                <span className="text-xs font-bold text-white">{formatEur(totalMonthlyCost)}</span>
                <span className="text-[10px] text-violet-300">TCO/mois</span>
              </div>
              {hasAlerts && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-400/30">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-xs font-bold text-red-300">
                    {expired.length + expiringSoon.length + kmAlerts.length}
                  </span>
                  <span className="text-[10px] text-red-400">alerte{(expired.length + expiringSoon.length + kmAlerts.length) > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">

        {/* ── Alertes ── */}
        {hasAlerts && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {expired.length > 0 && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-700">
                    {expired.length} contrat{expired.length > 1 ? 's' : ''} expiré{expired.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-red-500 mt-0.5">Action immédiate requise</p>
                </div>
              </div>
            )}
            {expiringSoon.length > 0 && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-700">
                    {expiringSoon.length} contrat{expiringSoon.length > 1 ? 's' : ''} dans les 90 jours
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">Renouvellement à anticiper</p>
                </div>
              </div>
            )}
            {kmAlerts.length > 0 && (
              <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <Gauge className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-yellow-700">
                    {kmAlerts.length} dépassement{kmAlerts.length > 1 ? 's' : ''} km projeté{kmAlerts.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-yellow-600 mt-0.5">Coût de dépassement estimé</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── KPIs ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard
            label="Loyers mensuels HT"
            value={formatEur(totalMonthlyRent)}
            sub={`${formatEur(totalMonthlyRent * 12)} / an`}
            icon={<Euro className="w-5 h-5 text-violet-600" />}
            borderColor="border-violet-500" bgColor="bg-violet-50"
          />
          <KpiCard
            label="Assurances mensuelles"
            value={formatEur(totalMonthlyInsurance)}
            sub={`${formatEur(totalMonthlyInsurance * 12)} / an`}
            icon={<FileText className="w-5 h-5 text-blue-600" />}
            borderColor="border-blue-500" bgColor="bg-blue-50"
          />
          <KpiCard
            label="Dotations amortissement"
            value={formatEur(totalMonthlyAmortization)}
            sub={`${amortizations.filter((a) => a.status === 'ACTIVE').length} amortissement(s) actif(s)`}
            icon={<TrendingDown className="w-5 h-5 text-amber-600" />}
            borderColor="border-amber-500" bgColor="bg-amber-50"
          />
          <KpiCard
            label="TCO mensuel total"
            value={formatEur(totalMonthlyCost)}
            sub="Loyers + assurances + dotations"
            icon={<TrendingUp className="w-5 h-5 text-red-600" />}
            borderColor="border-red-500" bgColor="bg-red-50"
          />
          <KpiCard
            label="TCO annuel estimé"
            value={formatEur(totalMonthlyCost * 12)}
            sub="Sur la base du mois en cours"
            icon={<Car className="w-5 h-5 text-green-600" />}
            borderColor="border-green-500" bgColor="bg-green-50"
          />
        </div>

        {/* ── Répartition + Projection ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Répartition par type */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-violet-600" />
              <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Répartition par type de financement</h2>
            </div>
            <div className="p-5 space-y-4">
              <DistributionBar data={byType.map((d) => ({ label: d.label, value: d.value, color: d.color }))} />
              <div className="space-y-1 pt-1">
                {byType.filter((d) => d.value > 0).map((d) => (
                  <div key={d.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${d.color}`} />
                      <span className="text-sm text-gray-600">{d.label}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-400">{d.value} véhicule{d.value > 1 ? 's' : ''}</span>
                      {d.rent > 0 && <span className="text-sm font-bold text-gray-900">{formatEur(d.rent)}/mois</span>}
                    </div>
                  </div>
                ))}
                {byType.every((d) => d.value === 0) && (
                  <p className="text-xs text-gray-300 italic text-center py-4">
                    Aucun contrat actif — créez des contrats depuis les fiches véhicules
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Projection 12 mois */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-violet-600" />
              <div>
                <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Projection des loyers — 12 mois</h2>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-gray-400">Évolution du loyer mensuel total au fil des fins de contrat</p>
              {totalMonthlyRent === 0 ? (
                <div className="h-24 flex items-center justify-center">
                  <p className="text-xs text-gray-300 italic">Aucune donnée disponible</p>
                </div>
              ) : (
                <>
                  <div className="flex items-end justify-between gap-1 h-24 pt-2">
                    {sparkValues.map((v, i) => {
                      const maxV  = Math.max(...sparkValues, 1)
                      const pct   = (v / maxV) * 100
                      const ref   = new Date(); ref.setMonth(ref.getMonth() + i)
                      const label = ref.toLocaleDateString('fr-FR', { month: 'short' })
                      return (
                        <div key={i} className="flex flex-col items-center gap-1 flex-1">
                          <div className="w-full flex items-end justify-center" style={{ height: '72px' }}>
                            <div
                              className="w-full rounded-t-sm bg-violet-200 hover:bg-violet-400 transition-colors cursor-default"
                              style={{ height: `${Math.max(4, pct)}%` }}
                              title={`${label} : ${formatEur(v)}`}
                            />
                          </div>
                          <span className="text-[9px] text-gray-400">{label}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                    <span className="text-xs text-gray-400">
                      Aujourd'hui : <strong className="text-gray-700">{formatEur(sparkValues[0])}/mois</strong>
                    </span>
                    <span className="text-xs text-gray-400">
                      Dans 12 mois : <strong className="text-gray-700">{formatEur(sparkValues[11])}/mois</strong>
                    </span>
                  </div>
                  {sparkValues[0] !== sparkValues[11] && (
                    <p className={`text-xs font-semibold ${sparkValues[11] < sparkValues[0] ? 'text-green-600' : 'text-amber-600'}`}>
                      {sparkValues[11] < sparkValues[0]
                        ? `Économie potentielle : ${formatEur(sparkValues[0] - sparkValues[11])}/mois`
                        : `Hausse projetée : ${formatEur(sparkValues[11] - sparkValues[0])}/mois`}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Tableau des contrats ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-violet-600" />
              <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Détail des contrats actifs</h2>
            </div>
            <span className="text-xs text-gray-400 font-medium">
              {activeContracts.length} contrat{activeContracts.length > 1 ? 's' : ''}
            </span>
          </div>

          {sorted.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400 font-medium">Aucun contrat actif</p>
              <p className="text-xs text-gray-300 mt-1">
                Associez des contrats aux véhicules depuis l'onglet "Contrat & Financement" de chaque fiche véhicule
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Véhicule', 'Type', 'Bailleur', 'Loyer HT', 'Assurance', 'Total/mois', 'Échéance', 'Km contrat'].map((h) => (
                      <th key={h} className="py-2.5 px-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(({ contract, vehicleName, currentMileage }) => (
                    <ContractRow
                      key={contract.id}
                      contract={contract}
                      vehicleName={vehicleName}
                      currentMileage={currentMileage}
                    />
                  ))}
                </tbody>
                <tfoot className="border-t border-gray-200 bg-gray-50">
                  <tr>
                    <td colSpan={3} className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Total flotte ({financialContracts.length} contrats financiers)
                    </td>
                    <td className="py-3 px-4 text-sm font-bold text-gray-900">{formatEur(totalMonthlyRent)}</td>
                    <td className="py-3 px-4 text-sm font-bold text-gray-900">{formatEur(totalMonthlyInsurance)}</td>
                    <td className="py-3 px-4 text-sm font-bold text-violet-700">{formatEur(totalMonthlyKnown)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* ── Gantt amortissements ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
            <div className="w-1 h-4 rounded-full bg-violet-600" />
            <h2 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Amortissements — vue flotte</h2>
          </div>
          <div className="p-4">
            <AmortizationGantt
              amortizations={amortizations}
              title=""
              showVehicle={true}
              vehicleLabel={(vehicleId) => {
                const v = vehicles.find((v) => v.id === vehicleId)
                return v ? `${v.registration} — ${v.brand} ${v.model}` : vehicleId
              }}
            />
          </div>
        </div>

      </div>
    </>
  )
}
