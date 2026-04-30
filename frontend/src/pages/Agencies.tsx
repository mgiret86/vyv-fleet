import { Building2, MapPin, Truck, TrendingUp } from 'lucide-react'
import ComplianceScore from '@/components/shared/ComplianceScore'
import { MOCK_AGENCIES, MOCK_VEHICLES } from '@/data/mock'

export default function Agencies() {
  const agencyStats = MOCK_AGENCIES.map(agency => {
    const vehicles       = MOCK_VEHICLES.filter(v => v.agencyId === agency.id)
    const active         = vehicles.filter(v => v.status === 'ACTIVE').length
    const avgCompliance  = vehicles.length > 0
      ? Math.round(vehicles.reduce((s, v) => s + v.complianceScore, 0) / vehicles.length)
      : 0
    const totalLease     = vehicles.reduce((s, v) => s + (v.monthlyLeaseCost ?? 0), 0)
    return { ...agency, vehicles: vehicles.length, active, avgCompliance, totalLease }
  })

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {agencyStats.map(agency => (
          <div key={agency.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">{agency.name}</h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{agency.city}</span>
                      {agency.code && (
                        <>
                          <span className="text-xs text-gray-300 mx-1">·</span>
                          <span className="text-xs font-mono text-gray-400">{agency.code}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Truck className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Véhicules</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{agency.vehicles}</p>
                  <p className="text-xs text-green-600 font-medium">{agency.active} actifs</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-500">Loyer mensuel</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    {agency.totalLease > 0 ? `${agency.totalLease.toLocaleString('fr-FR')} €` : '—'}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-500 font-medium">Conformité moyenne</span>
                  <span className={`text-xs font-bold ${
                    agency.avgCompliance >= 80 ? 'text-green-600' :
                    agency.avgCompliance >= 60 ? 'text-orange-500' : 'text-red-500'
                  }`}>
                    {agency.avgCompliance}%
                  </span>
                </div>
                <ComplianceScore score={agency.avgCompliance} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}