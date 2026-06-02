import { useState, useMemo, useEffect, useCallback } from 'react'
import { Bell, CheckCircle, Filter, RefreshCw } from 'lucide-react'
import { alertService } from '@/lib/services'
import { formatDate } from '@/lib/utils'
import type { AlertSeverity } from '@/types'

const SEVERITY_COLORS = {
  CRITICAL: { card: 'bg-red-50 border-red-200',       text: 'text-red-700',    dot: 'bg-red-500',    badge: 'bg-red-100 text-red-700'    },
  WARNING:  { card: 'bg-orange-50 border-orange-200', text: 'text-orange-700', dot: 'bg-orange-400', badge: 'bg-orange-100 text-orange-700' },
  INFO:     { card: 'bg-blue-50 border-blue-200',     text: 'text-blue-700',   dot: 'bg-blue-400',   badge: 'bg-blue-100 text-blue-700'   },
}

const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  CRITICAL: 'Critique',
  WARNING:  'Avertissement',
  INFO:     'Information',
}

const TYPE_LABELS: Record<string, string> = {
  INSURANCE_EXPIRY:    'Assurance',
  TECHNICAL_INSPECTION:'Contrôle technique',
  ARS_APPROVAL:        'Agrément ARS',
  MAINTENANCE_DUE:     'Maintenance',
  MILEAGE_THRESHOLD:   'Kilométrage',
  LICENSE_EXPIRY:      'Permis',
  MEDICAL_EXAM:        'Visite médicale',
  DEA_EXPIRY:          'DEA',
  FSP_EXPIRY:          'FSP',
}

export default function Alerts() {
  const [alerts,         setAlerts]         = useState<any[]>([])
  const [loading,        setLoading]        = useState(true)
  const [resolving,      setResolving]      = useState<string | null>(null)
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'ALL'>('ALL')
  const [showResolved,   setShowResolved]   = useState(false)

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    try {
      const data = await alertService.list()
      setAlerts(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAlerts() }, [fetchAlerts])

  const filtered = useMemo(() => {
    let list = [...alerts]
    if (!showResolved) list = list.filter((a) => a.status !== 'RESOLVED' && !a.resolvedAt)
    if (severityFilter !== 'ALL') list = list.filter((a) => a.severity === severityFilter)
    return list.sort((a, b) => {
      const order: Record<AlertSeverity, number> = { CRITICAL: 0, WARNING: 1, INFO: 2 }
      return (order[a.severity as AlertSeverity] ?? 3) - (order[b.severity as AlertSeverity] ?? 3)
    })
  }, [alerts, severityFilter, showResolved])

  const counts = useMemo(() => ({
    critical: alerts.filter((a) => a.severity === 'CRITICAL' && a.status !== 'RESOLVED' && !a.resolvedAt).length,
    warning:  alerts.filter((a) => a.severity === 'WARNING'  && a.status !== 'RESOLVED' && !a.resolvedAt).length,
    info:     alerts.filter((a) => a.severity === 'INFO'     && a.status !== 'RESOLVED' && !a.resolvedAt).length,
  }), [alerts])

  const handleResolve = async (id: string) => {
    setResolving(id)
    try {
      await alertService.resolve(id)
      setAlerts((prev) => prev.map((a) => a.id === id
        ? { ...a, status: 'RESOLVED', resolvedAt: new Date().toISOString() }
        : a
      ))
    } catch (e) { console.error(e) }
    finally { setResolving(null) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alertes</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? 'Chargement...' : `${filtered.length} alerte${filtered.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={fetchAlerts} disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Actualiser
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {([
          { label: 'Critiques',      count: counts.critical, severity: 'CRITICAL' as AlertSeverity },
          { label: 'Avertissements', count: counts.warning,  severity: 'WARNING'  as AlertSeverity },
          { label: 'Informations',   count: counts.info,     severity: 'INFO'     as AlertSeverity },
        ]).map(({ label, count, severity }) => {
          const c = SEVERITY_COLORS[severity]
          return (
            <button key={severity}
              onClick={() => setSeverityFilter(severityFilter === severity ? 'ALL' : severity)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${c.card} ${severityFilter === severity ? 'ring-2 ring-offset-1 ring-violet-400' : ''}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
                <span className={`text-xs font-semibold uppercase tracking-wide ${c.text}`}>{label}</span>
              </div>
              <p className={`text-3xl font-bold ${c.text}`}>{count}</p>
            </button>
          )
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-center gap-4">
        <Filter className="w-4 h-4 text-gray-400" />
        <select value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value as AlertSeverity | 'ALL')}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white outline-none">
          <option value="ALL">Toutes sévérités</option>
          <option value="CRITICAL">Critique</option>
          <option value="WARNING">Avertissement</option>
          <option value="INFO">Information</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer ml-auto">
          <input type="checkbox" checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)} className="rounded" />
          Afficher les résolues
        </label>
        <span className="text-sm text-gray-400">{filtered.length} alerte(s)</span>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-sm text-gray-400 animate-pulse">
          Chargement des alertes...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucune alerte</p>
          <p className="text-gray-400 text-sm mt-1">
            {showResolved ? 'Aucune alerte dans la base.' : 'Toutes les alertes sont résolues.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((alert) => {
            const c = SEVERITY_COLORS[alert.severity as AlertSeverity] ?? SEVERITY_COLORS.INFO
            const isResolved = alert.status === 'RESOLVED' || !!alert.resolvedAt
            return (
              <div key={alert.id}
                className={`bg-white rounded-xl border shadow-sm p-4 flex items-start gap-4 transition-all hover:shadow-md ${isResolved ? 'opacity-60' : ''}`}>
                <div className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${c.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>
                      {SEVERITY_LABELS[alert.severity as AlertSeverity] ?? alert.severity}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {TYPE_LABELS[alert.type] ?? alert.type}
                    </span>
                    {isResolved && (
                      <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Résolue</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {alert.vehicleRegistration || alert.vehicle?.registration || 'Véhicule inconnu'}
                  </p>
                  <p className="text-sm text-gray-600 mt-0.5">{alert.message}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    {alert.agencyName && <span>{alert.agencyName}</span>}
                    {alert.dueDate   && <span>Échéance : {formatDate(alert.dueDate)}</span>}
                    {isResolved && alert.resolvedAt && <span>Résolue le {formatDate(alert.resolvedAt)}</span>}
                  </div>
                </div>
                {!isResolved && (
                  <button
                    onClick={() => handleResolve(alert.id)}
                    disabled={resolving === alert.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 border border-green-200 rounded-lg hover:bg-green-50 disabled:opacity-50 flex-shrink-0">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {resolving === alert.id ? 'En cours...' : 'Résoudre'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
