import { useState, useMemo, useEffect, useCallback } from 'react'
import { Bell, CheckCircle, RefreshCw, AlertTriangle, Info } from 'lucide-react'
import { alertService } from '@/lib/services'
import { formatDate } from '@/lib/utils'
import type { AlertSeverity } from '@/types'

const SEVERITY_COLORS = {
  CRITICAL: { card: 'bg-red-50 border-red-200',       text: 'text-red-700',    dot: 'bg-red-500',    badge: 'bg-red-100 text-red-700',       header: 'border-red-500'    },
  WARNING:  { card: 'bg-amber-50 border-amber-200',   text: 'text-amber-700',  dot: 'bg-amber-400',  badge: 'bg-amber-100 text-amber-700',   header: 'border-amber-500'  },
  INFO:     { card: 'bg-blue-50 border-blue-200',     text: 'text-blue-700',   dot: 'bg-blue-400',   badge: 'bg-blue-100 text-blue-700',     header: 'border-blue-500'   },
}

const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  CRITICAL: 'Critique',
  WARNING:  'Avertissement',
  INFO:     'Information',
}

const TYPE_LABELS: Record<string, string> = {
  INSURANCE_EXPIRY:     'Assurance',
  TECHNICAL_INSPECTION: 'Contrôle technique',
  ARS_APPROVAL:         'Agrément ARS',
  MAINTENANCE_DUE:      'Maintenance',
  MILEAGE_THRESHOLD:    'Kilométrage',
  LICENSE_EXPIRY:       'Permis',
  MEDICAL_EXAM:         'Visite médicale',
  DEA_EXPIRY:           'DEA',
  FSP_EXPIRY:           'FSP',
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

  const totalOpen = counts.critical + counts.warning + counts.info

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
    <>
      {/* ── Header gradient ── */}
      <div className="bg-gradient-to-r from-violet-950 to-violet-800 rounded-2xl px-6 py-5 mb-6 shadow-lg">
        <div className="flex items-center justify-between gap-4 flex-wrap">

          <div className="flex items-center gap-5 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Alertes</h1>
                <p className="text-violet-300 text-xs mt-0.5">
                  {loading ? 'Chargement...' : `${totalOpen} alerte${totalOpen > 1 ? 's' : ''} ouverte${totalOpen > 1 ? 's' : ''}`}
                </p>
              </div>
            </div>

            {/* Compteurs rapides */}
            {!loading && (
              <div className="flex items-center gap-2 flex-wrap">
                {counts.critical > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-400/30">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-xs font-bold text-red-300">{counts.critical}</span>
                    <span className="text-[10px] text-red-400">critique{counts.critical > 1 ? 's' : ''}</span>
                  </div>
                )}
                {counts.warning > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/30">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-xs font-bold text-amber-300">{counts.warning}</span>
                    <span className="text-[10px] text-amber-400">avertissement{counts.warning > 1 ? 's' : ''}</span>
                  </div>
                )}
                {counts.info > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/20 border border-blue-400/30">
                    <Info className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-xs font-bold text-blue-300">{counts.info}</span>
                    <span className="text-[10px] text-blue-400">info{counts.info > 1 ? 's' : ''}</span>
                  </div>
                )}
                {totalOpen === 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/20 border border-green-400/30">
                    <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-[10px] text-green-400">Tout est en ordre</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actualiser */}
          <button
            onClick={fetchAlerts}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/10 border border-white/20 text-white text-xs font-medium rounded-xl hover:bg-white/20 transition-colors disabled:opacity-40 flex-shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      <div className="space-y-4">

        {/* ── Cards de comptage cliquables ── */}
        <div className="grid grid-cols-3 gap-4">
          {([
            { label: 'Critiques',      count: counts.critical, severity: 'CRITICAL' as AlertSeverity, icon: <AlertTriangle className="w-4 h-4" /> },
            { label: 'Avertissements', count: counts.warning,  severity: 'WARNING'  as AlertSeverity, icon: <span className="w-3 h-3 rounded-full bg-current inline-block" /> },
            { label: 'Informations',   count: counts.info,     severity: 'INFO'     as AlertSeverity, icon: <Info className="w-4 h-4" /> },
          ]).map(({ label, count, severity, icon }) => {
            const c       = SEVERITY_COLORS[severity]
            const active  = severityFilter === severity
            return (
              <button
                key={severity}
                onClick={() => setSeverityFilter(active ? 'ALL' : severity)}
                className={`p-4 rounded-xl border-2 text-left transition-all bg-white shadow-sm hover:shadow-md ${
                  active ? `${c.header} ring-2 ring-offset-1 ring-violet-400` : 'border-gray-200'
                }`}
              >
                <div className={`flex items-center gap-2 mb-2 ${active ? c.text : 'text-gray-400'}`}>
                  {icon}
                  <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
                </div>
                <p className={`text-3xl font-bold ${active ? c.text : 'text-gray-800'}`}>{count}</p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {count === 0 ? 'Aucune' : `alerte${count > 1 ? 's' : ''} ouverte${count > 1 ? 's' : ''}`}
                </p>
              </button>
            )
          })}
        </div>

        {/* ── Liste des alertes dans une carte unifiée ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Barre de filtres */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/40 flex items-center gap-3 flex-wrap">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value as AlertSeverity | 'ALL')}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 bg-white outline-none focus:ring-2 focus:ring-violet-300 transition"
            >
              <option value="ALL">Toutes sévérités</option>
              <option value="CRITICAL">Critique</option>
              <option value="WARNING">Avertissement</option>
              <option value="INFO">Information</option>
            </select>

            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer ml-auto select-none">
              <input
                type="checkbox"
                checked={showResolved}
                onChange={(e) => setShowResolved(e.target.checked)}
                className="rounded accent-violet-600"
              />
              Afficher les alertes résolues
            </label>
          </div>

          {/* En-tête section */}
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-violet-600" />
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                {severityFilter === 'ALL'
                  ? 'Toutes les alertes'
                  : SEVERITY_LABELS[severityFilter]}
              </span>
            </div>
            <span className="text-xs text-gray-400 font-medium">
              {loading ? 'Chargement...' : `${filtered.length} alerte${filtered.length !== 1 ? 's' : ''}`}
            </span>
          </div>

          {/* Contenu */}
          {loading ? (
            <div className="p-12 text-center text-sm text-gray-400 animate-pulse">
              Chargement des alertes...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium text-sm">Aucune alerte</p>
              <p className="text-gray-400 text-xs mt-1">
                {showResolved ? 'Aucune alerte dans la base.' : 'Toutes les alertes sont résolues.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((alert) => {
                const c          = SEVERITY_COLORS[alert.severity as AlertSeverity] ?? SEVERITY_COLORS.INFO
                const isResolved = alert.status === 'RESOLVED' || !!alert.resolvedAt
                return (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-4 px-5 py-4 transition-colors hover:bg-gray-50/60 ${isResolved ? 'opacity-50' : ''}`}
                  >
                    {/* Dot couleur */}
                    <div className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${c.dot}`} />

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.badge}`}>
                          {SEVERITY_LABELS[alert.severity as AlertSeverity] ?? alert.severity}
                        </span>
                        <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {TYPE_LABELS[alert.type] ?? alert.type}
                        </span>
                        {isResolved && (
                          <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                            Résolue
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-semibold text-gray-900">
                        {alert.vehicleRegistration || alert.vehicle?.registration || 'Véhicule inconnu'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{alert.message}</p>

                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        {alert.agencyName && (
                          <span className="text-[10px] text-gray-400">{alert.agencyName}</span>
                        )}
                        {alert.dueDate && (
                          <span className="text-[10px] text-gray-400">
                            Échéance : <span className="font-medium text-gray-600">{formatDate(alert.dueDate)}</span>
                          </span>
                        )}
                        {isResolved && alert.resolvedAt && (
                          <span className="text-[10px] text-green-600">
                            Résolue le {formatDate(alert.resolvedAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bouton résoudre */}
                    {!isResolved && (
                      <button
                        onClick={() => handleResolve(alert.id)}
                        disabled={resolving === alert.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-green-700 border border-green-200 rounded-lg hover:bg-green-50 disabled:opacity-50 transition-colors flex-shrink-0"
                      >
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
      </div>
    </>
  )
}
