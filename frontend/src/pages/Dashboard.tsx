import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Truck, AlertCircle, Wrench, TrendingUp, ChevronDown } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useAgencyFilter } from '@/hooks/useAgencyFilter'
import { dashboardService, type DashboardStats } from '@/lib/services'
import type { Alert, MaintenanceRecord } from '@/types'

const SEVERITY_ORDER = { CRITICAL: 0, WARNING: 1, INFO: 2 } as const

const severityColors = {
  CRITICAL: 'bg-red-100 text-red-700 border-red-200',
  WARNING:  'bg-orange-100 text-orange-700 border-orange-200',
  INFO:     'bg-blue-100 text-blue-700 border-blue-200',
} as const

const severityDotColors = {
  CRITICAL: 'bg-red-500',
  WARNING:  'bg-orange-400',
  INFO:     'bg-blue-400',
} as const

const maintenanceStatusColors = {
  SCHEDULED:   'bg-blue-100 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-orange-100 text-orange-700 border-orange-200',
} as const

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function getAvailabilityColor(rate: number): string {
  return rate >= 90 ? 'text-green-600' : rate >= 80 ? 'text-orange-600' : 'text-red-600'
}

function getAvailabilityBg(rate: number): string {
  return rate >= 90 ? 'bg-green-50' : rate >= 80 ? 'bg-orange-50' : 'bg-red-50'
}

export default function Dashboard() {
  const { agencies, selectedAgencyId, setSelectedAgencyId } = useAppStore()
  const { visibleAgencyIds } = useAgencyFilter()

  const [stats,        setStats]        = useState<DashboardStats | null>(null)
  const [alerts,       setAlerts]       = useState<Alert[]>([])
  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>([])
  const [loading,      setLoading]      = useState(true)

  const visibleAgencies = useMemo(
    () => agencies.filter((a) => visibleAgencyIds.includes(a.id)),
    [agencies, visibleAgencyIds]
  )

  useEffect(() => {
    setLoading(true)
    const agencyId = selectedAgencyId ?? undefined
    Promise.all([
      dashboardService.stats(agencyId),
      dashboardService.alerts(agencyId),
      dashboardService.maintenances(agencyId),
    ])
      .then(([s, a, m]) => {
        setStats(s)
        setAlerts((a as unknown as Alert[]).sort(
          (x, y) => SEVERITY_ORDER[x.severity] - SEVERITY_ORDER[y.severity]
        ))
        setMaintenances(m as unknown as MaintenanceRecord[])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedAgencyId])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-4">
        <label className="text-sm font-medium text-gray-700">Agence :</label>
        <div className="relative">
          <select
            value={selectedAgencyId || ''}
            onChange={(e) => setSelectedAgencyId(e.target.value || null)}
            className="appearance-none bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 pr-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            {visibleAgencies.length > 1 && <option value="">Toutes les agences</option>}
            {visibleAgencies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
                <Truck className="w-5 h-5 text-violet-600" />
              </div>
              <div className="text-xs text-gray-500">Véhicules actifs</div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats?.activeVehicles ?? 0} / {stats?.totalVehicles ?? 0}
            </div>
          </div>

          <div className={`bg-white rounded-xl border border-gray-200 p-5 shadow-sm ${getAvailabilityBg(stats?.availabilityRate ?? 100)}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg ${getAvailabilityBg(stats?.availabilityRate ?? 100)} flex items-center justify-center`}>
                <TrendingUp className={`w-5 h-5 ${getAvailabilityColor(stats?.availabilityRate ?? 100)}`} />
              </div>
              <div className="text-xs text-gray-500">Taux de disponibilité</div>
            </div>
            <div className={`text-2xl font-bold ${getAvailabilityColor(stats?.availabilityRate ?? 100)}`}>
              {stats?.availabilityRate ?? 100}%
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertCircle className={`w-5 h-5 ${(stats?.criticalAlerts ?? 0) > 0 ? 'text-red-600' : 'text-gray-400'}`} />
              </div>
              <div className="text-xs text-gray-500">Alertes</div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats?.criticalAlerts ?? 0} critiques · {stats?.warningAlerts ?? 0} avertissements
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-xs text-gray-500">Maintenances cette semaine</div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats?.maintenancesThisWeek ?? 0}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Alertes prioritaires</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm animate-pulse">Chargement...</div>
            ) : alerts.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-500 text-sm">Aucune alerte</div>
            ) : alerts.map((alert) => (
              <div key={alert.id} className="px-5 py-3 flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${severityDotColors[alert.severity]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{alert.vehicleRegistration}</p>
                  <p className="text-xs text-gray-500">{alert.type}</p>
                  <p className="text-xs text-gray-400">{formatDate(alert.dueDate)} · {alert.agencyName}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border ${severityColors[alert.severity]}`}>
                  {alert.severity}
                </span>
                <Link to="/alerts" className="text-xs text-violet-600 hover:text-violet-700 font-medium">Voir</Link>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Maintenances à venir</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm animate-pulse">Chargement...</div>
            ) : maintenances.length === 0 ? (
              <div className="px-5 py-8 text-center text-gray-500 text-sm">Aucune maintenance à venir</div>
            ) : maintenances.map((m) => (
              <div key={m.id} className="px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                  <Wrench className="w-4 h-4 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{m.vehicleRegistration}</p>
                  <p className="text-xs text-gray-500">{m.type}</p>
                  <p className="text-xs text-gray-400">{m.provider} · {formatDate(m.scheduledDate)} · {m.agencyName}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border ${maintenanceStatusColors[m.status as keyof typeof maintenanceStatusColors]}`}>
                  {m.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
