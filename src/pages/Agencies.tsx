import { Building2, MapPin, Truck, TrendingUp, Award } from 'lucide-react'
import ComplianceScore from '@/components/shared/ComplianceScore'
import { MOCK_AGENCIES, MOCK_VEHICLES } from '@/data/mock'

export default function Agencies() {
  const agencyStats = MOCK_AGENCIES.map((agency) => {
    const vehicles      = MOCK_VEHICLES.filter((v) => v.agencyId === agency.id)
    const active        = vehicles.filter((v) => v.status === 'ACTIVE').length
    const avgCompliance = vehicles.length > 0
      ? Math.round(vehicles.reduce((s, v) => s + v.complianceScore, 0) / vehicles.length)
      : 0
    const totalLease    = vehicles.reduce((s, v) => s + (v.monthlyLeaseCost ?? 0), 0)
    return { ...agency, vehicles: vehicles.length, active, avgCompliance, totalLease }
  })

  const totalVehicles  = agencyStats.reduce((s, a) => s + a.vehicles, 0)
  const totalActive    = agencyStats.reduce((s, a) => s + a.active, 0)
  const totalLease     = agencyStats.reduce((s, a) => s + a.totalLease, 0)
  const globalCompliance = agencyStats.length > 0
    ? Math.round(agencyStats.reduce((s, a) => s + a.avgCompliance, 0) / agencyStats.length)
    : 0
  const globalColor = globalCompliance >= 80 ? 'text-green-300' : globalCompliance >= 60 ? 'text-amber-300' : 'text-red-300'

  return (
    <>
      {/* ── Header gradient ── */}
      <div className="bg-gradient-to-r from-violet-950 to-violet-800 rounded-2xl px-6 py-5 mb-6 shadow-lg">
        <div className="flex items-center justify-between gap-4 flex-wrap">

          <div className="flex items-center gap-5 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Agences</h1>
                <p className="text-violet-300 text-xs mt-0.5">
                  {agencyStats.length} agence{agencyStats.length > 1 ? 's' : ''} dans le réseau
                </p>
              </div>
            </div>

            {/* Compteurs rapides */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20">
                <Truck className="w-3.5 h-3.5 text-violet-300" />
                <span className="text-xs font-bold text-white">{totalVehicles}</span>
                <span className="text-[10px] text-violet-300">véhicule{totalVehicles > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/20 border border-green-400/30">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-xs font-bold text-green-300">{totalActive}</span>
                <span className="text-[10px] text-green-400">actif{totalActive > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20">
                <TrendingUp className="w-3.5 h-3.5 text-violet-300" />
                <span className="text-xs font-bold text-white">
                  {totalLease > 0 ? `${totalLease.toLocaleString('fr-FR')} €` : '—'}
                </span>
                <span className="text-[10px] text-violet-300">/mois</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20">
                <Award className="w-3.5 h-3.5 text-violet-300" />
                <span className={`text-xs font-bold ${globalColor}`}>{globalCompliance}%</span>
                <span className="text-[10px] text-violet-300">conformité moy.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── En-tête de section ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full bg-violet-600" />
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Réseau des agences</span>
        </div>
        <span className="text-xs text-gray-400 font-medium">
          {agencyStats.length} agence{agencyStats.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Grille des agences ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {agencyStats.map((agency) => {
          const scoreColor =
            agency.avgCompliance >= 80 ? 'text-green-600' :
            agency.avgCompliance >= 60 ? 'text-amber-500' :
                                         'text-red-500'

          return (
            <div
              key={agency.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 overflow-hidden"
            >
              {/* En-tête card */}
              <div className="px-4 py-4 border-b border-gray-100 bg-gray-50/40">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm leading-tight truncate">{agency.name}</h3>
                    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                      <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-500">{agency.city}</span>
                      {agency.code && (
                        <>
                          <span className="text-xs text-gray-300 mx-0.5">·</span>
                          <span className="text-xs font-mono font-semibold text-violet-500">{agency.code}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {/* Véhicules */}
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Truck className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Véhicules</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 leading-none">{agency.vehicles}</p>
                    <p className="text-[10px] text-green-600 font-semibold mt-1">
                      {agency.active} actif{agency.active > 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Loyer mensuel */}
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Loyer/mois</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 leading-none">
                      {agency.totalLease > 0
                        ? `${agency.totalLease.toLocaleString('fr-FR')} €`
                        : '—'}
                    </p>
                  </div>
                </div>

                {/* Conformité */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Conformité moyenne</span>
                    </div>
                    <span className={`text-sm font-bold ${scoreColor}`}>
                      {agency.avgCompliance}%
                    </span>
                  </div>
                  <ComplianceScore score={agency.avgCompliance} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
