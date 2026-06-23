import { useState, useMemo, useEffect, useCallback } from 'react'
import { ShieldCheck, AlertTriangle } from 'lucide-react'
import { useAppStore }     from '@/store/useAppStore'
import { useAgencyFilter } from '@/hooks/useAgencyFilter'
import { usePermissions }  from '@/hooks/usePermissions'
import { alertService }    from '@/lib/services'
import AlertKPI            from '@/components/compliance/AlertKPI'
import AlertFilters        from '@/components/compliance/AlertFilters'
import AlertCard           from '@/components/compliance/AlertCard'
import AgencyScoreTable    from '@/components/compliance/AgencyScoreTable'
import ComplianceGauge     from '@/components/compliance/ComplianceGauge'
import type { Alert, ComplianceScore } from '@/types'

// ── Calcul des scores par agence ──────────────────────────────────
function computeScores(alerts: Alert[], agencies: { id: string; name: string }[]): ComplianceScore[] {
  return agencies.map((agency) => {
    const agencyAlerts = alerts.filter((a) => a.agencyId === agency.id)
    const categories = ['ARS', 'CT', 'ASSURANCE', 'EQUIPEMENT', 'MAINTENANCE'] as const
    const now = new Date()
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const details = Object.fromEntries(
      categories.map((cat) => {
        const catAlerts    = agencyAlerts.filter((a) => a.category === cat)
        const expired      = catAlerts.filter((a) => a.dueDate && new Date(a.dueDate) < now && a.status !== 'RESOLVED').length
        const expiringSoon = catAlerts.filter((a) => a.dueDate && new Date(a.dueDate) >= now && new Date(a.dueDate) <= in30 && a.status !== 'RESOLVED').length
        const total        = catAlerts.length
        const compliant    = catAlerts.filter((a) => a.status === 'RESOLVED' || a.severity === 'INFO').length
        return [cat, { compliant, total, expired, expiringSoon }]
      })
    ) as ComplianceScore['details']

    const totalAlerts = agencyAlerts.length
    const criticals   = agencyAlerts.filter((a) => a.severity === 'CRITICAL' && a.status !== 'RESOLVED').length
    const warnings    = agencyAlerts.filter((a) => a.severity === 'WARNING'  && a.status !== 'RESOLVED').length
    const score = totalAlerts === 0 ? 100 : Math.max(0, Math.round(100 - (criticals * 10 + warnings * 3)))

    return { agencyId: agency.id, agencyName: agency.name, score, vehicleCount: 0, details }
  })
}

// ── Calcul du tableau réglementaire ──────────────────────────────
function computeRegulatoryData(alerts: Alert[]) {
  const now  = new Date()
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const in90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
  const cats = [
    { key: 'ARS',        title: 'Agréments ARS'        },
    { key: 'CT',         title: 'Contrôles techniques' },
    { key: 'ASSURANCE',  title: 'Assurances'            },
    { key: 'EQUIPEMENT', title: 'Équipements médicaux' },
  ] as const
  return cats.map(({ key, title }) => {
    const catAlerts  = alerts.filter((a) => a.category === key)
    const total      = catAlerts.length
    const expired    = catAlerts.filter((a) => a.dueDate && new Date(a.dueDate) < now  && a.status !== 'RESOLVED').length
    const expiring30 = catAlerts.filter((a) => a.dueDate && new Date(a.dueDate) >= now && new Date(a.dueDate) <= in30 && a.status !== 'RESOLVED').length
    const expiring90 = catAlerts.filter((a) => a.dueDate && new Date(a.dueDate) >= now && new Date(a.dueDate) <= in90 && a.status !== 'RESOLVED').length
    const compliant  = Math.max(0, total - expired - expiring30)
    return { title, compliant, total, expired, expiring30, expiring90 }
  })
}

// ── Composant principal ───────────────────────────────────────────
export default function Compliance() {
  const { agencies = [], fetchAgencies, isLoadingAgencies } = useAppStore()
  const { filterByAgency, visibleAgencyIds } = useAgencyFilter()
  const { can }                              = usePermissions()

  const [alerts,    setAlerts]    = useState<Alert[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [severity,  setSeverity]  = useState('Tous')
  const [category,  setCategory]  = useState('Tous')
  const [status,    setStatus]    = useState('Tous')
  const [agencyId,  setAgencyId]  = useState('')
  const [activeTab, setActiveTab] = useState<'alerts' | 'scores' | 'regulatory'>('alerts')

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true)
      const data = await alertService.list()
      setAlerts(data)
    } catch (e) { console.error('Erreur chargement alertes :', e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadAlerts() }, [loadAlerts])
  useEffect(() => { if (agencies.length === 0) fetchAgencies() }, [fetchAgencies, agencies.length])

  const handleStatusChange = useCallback(async (id: string, newStatus: 'IN_PROGRESS' | 'RESOLVED') => {
    if (!can('compliance', 'edit')) return
    try {
      if (newStatus === 'RESOLVED') await alertService.resolve(id)
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, status: newStatus, resolvedAt: newStatus === 'RESOLVED' ? new Date().toISOString() : a.resolvedAt, resolvedBy: newStatus === 'RESOLVED' ? 'Chef d agence' : a.resolvedBy }
            : a
        )
      )
    } catch (e) { console.error('Erreur résolution alerte :', e) }
  }, [can])

  const visibleAgencies = useMemo(() => agencies.filter((a) => visibleAgencyIds.includes(a.id)), [agencies, visibleAgencyIds])
  const visibleAlerts   = useMemo(() => filterByAgency(alerts), [alerts, filterByAgency])

  const filteredAlerts = useMemo(() => {
    return filterByAgency(alerts)
      .filter((alert) => {
        if (search) {
          const s = search.toLowerCase()
          if (!alert.vehicleRegistration.toLowerCase().includes(s) && !alert.message.toLowerCase().includes(s) && !alert.description.toLowerCase().includes(s)) return false
        }
        if (severity !== 'Tous') {
          const sevMap = { Critique: 'CRITICAL', Avertissement: 'WARNING', Info: 'INFO' } as const
          if (alert.severity !== sevMap[severity as keyof typeof sevMap]) return false
        }
        if (category !== 'Tous') {
          const catMap = { ARS: 'ARS', CT: 'CT', Assurance: 'ASSURANCE', Equipement: 'EQUIPEMENT', Maintenance: 'MAINTENANCE' } as const
          if (alert.category !== catMap[category as keyof typeof catMap]) return false
        }
        if (status !== 'Tous') {
          const statMap = { Ouverte: 'OPEN', 'En cours': 'IN_PROGRESS', Resolue: 'RESOLVED' } as const
          if (alert.status !== statMap[status as keyof typeof statMap]) return false
        }
        if (agencyId && alert.agencyId !== agencyId) return false
        return true
      })
      .sort((a, b) =>
        ({ CRITICAL: 0, WARNING: 1, INFO: 2 } as const)[a.severity] -
        ({ CRITICAL: 0, WARNING: 1, INFO: 2 } as const)[b.severity]
      )
  }, [alerts, search, severity, category, status, agencyId, filterByAgency])

  const visibleScores  = useMemo(() => computeScores(visibleAlerts, visibleAgencies), [visibleAlerts, visibleAgencies])
  const regulatoryData = useMemo(() => computeRegulatoryData(visibleAlerts),          [visibleAlerts])

  // KPIs rapides header
  const criticalCount = useMemo(() => visibleAlerts.filter((a) => a.severity === 'CRITICAL' && a.status !== 'RESOLVED').length, [visibleAlerts])
  const warningCount  = useMemo(() => visibleAlerts.filter((a) => a.severity === 'WARNING'  && a.status !== 'RESOLVED').length, [visibleAlerts])
  const openCount     = useMemo(() => visibleAlerts.filter((a) => a.status !== 'RESOLVED').length, [visibleAlerts])
  const avgScore      = useMemo(() => visibleScores.length ? Math.round(visibleScores.reduce((s, sc) => s + sc.score, 0) / visibleScores.length) : 100, [visibleScores])

  const TABS = [
    { id: 'alerts'     as const, label: 'Alertes actives'       },
    { id: 'scores'     as const, label: 'Score par agence'      },
    { id: 'regulatory' as const, label: 'Tableau réglementaire' },
  ]

  return (
    <>
      {/* ── Header gradient ── */}
      <div className="bg-gradient-to-r from-violet-950 to-violet-800 rounded-2xl px-6 py-5 mb-6 shadow-lg">
        <div className="flex items-center justify-between gap-4 flex-wrap">

          <div className="flex items-center gap-5 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Conformité & Alertes</h1>
                <p className="text-violet-300 text-xs mt-0.5">Suivi de la conformité réglementaire et gestion des alertes</p>
              </div>
            </div>

            {/* Compteurs rapides */}
            {!loading && (
              <div className="flex items-center gap-2 flex-wrap">
                {/* Score conformité moyen */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                  avgScore >= 80 ? 'bg-green-500/20 border-green-400/30' :
                  avgScore >= 60 ? 'bg-amber-500/20 border-amber-400/30' :
                                   'bg-red-500/20 border-red-400/30'
                }`}>
                  <ShieldCheck className={`w-3.5 h-3.5 ${avgScore >= 80 ? 'text-green-400' : avgScore >= 60 ? 'text-amber-400' : 'text-red-400'}`} />
                  <span className={`text-xs font-bold ${avgScore >= 80 ? 'text-green-300' : avgScore >= 60 ? 'text-amber-300' : 'text-red-300'}`}>
                    {avgScore}%
                  </span>
                  <span className={`text-[10px] ${avgScore >= 80 ? 'text-green-400' : avgScore >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                    score moy.
                  </span>
                </div>

                {openCount > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20">
                    <span className="text-xs font-bold text-white">{openCount}</span>
                    <span className="text-[10px] text-violet-300">alerte{openCount > 1 ? 's' : ''} ouverte{openCount > 1 ? 's' : ''}</span>
                  </div>
                )}
                {criticalCount > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-400/30">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-xs font-bold text-red-300">{criticalCount}</span>
                    <span className="text-[10px] text-red-400">critique{criticalCount > 1 ? 's' : ''}</span>
                  </div>
                )}
                {warningCount > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/30">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-xs font-bold text-amber-300">{warningCount}</span>
                    <span className="text-[10px] text-amber-400">avertissement{warningCount > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">

        {/* ── KPIs ── */}
        {!loading && <AlertKPI alerts={visibleAlerts} />}

        {/* ── Onglets + contenu dans une carte unifiée ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Tab bar */}
          <div className="flex border-b border-gray-100 px-2 pt-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-violet-600 text-violet-700 bg-violet-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Onglet Alertes ── */}
          {activeTab === 'alerts' && (
            <>
              {/* Filtres */}
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/40">
                <AlertFilters
                  search={search}       onSearchChange={setSearch}
                  severity={severity}   onSeverityChange={setSeverity}
                  category={category}   onCategoryChange={setCategory}
                  status={status}       onStatusChange={setStatus}
                  agencyId={agencyId}   onAgencyChange={setAgencyId}
                  agencies={visibleAgencies}
                />
              </div>

              {/* En-tête section */}
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 rounded-full bg-violet-600" />
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Liste des alertes</span>
                </div>
                <span className="text-xs text-gray-400 font-medium">
                  {loading ? 'Chargement...' : `${filteredAlerts.length} alerte${filteredAlerts.length !== 1 ? 's' : ''}`}
                </span>
              </div>

              {/* Contenu */}
              {loading ? (
                <div className="p-12 text-center text-sm text-gray-400 animate-pulse">
                  Chargement des alertes...
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className="p-12 text-center">
                  <ShieldCheck className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium text-sm">Aucune alerte trouvée</p>
                  <p className="text-gray-400 text-xs mt-1">Aucune alerte ne correspond aux filtres sélectionnés.</p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {filteredAlerts.map((alert) => (
                    <AlertCard
                      key={alert.id}
                      alert={alert}
                      onStatusChange={can('compliance', 'edit') ? handleStatusChange : undefined}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Onglet Scores ── */}
          {activeTab === 'scores' && (
            <>
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 rounded-full bg-violet-600" />
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Score de conformité par agence</span>
                </div>
                <span className="text-xs text-gray-400 font-medium">
                  {visibleAgencies.length} agence{visibleAgencies.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="p-4">
                {isLoadingAgencies ? (
                  <div className="py-12 text-center text-sm text-gray-400 animate-pulse">Chargement des agences...</div>
                ) : visibleScores.length === 0 ? (
                  <div className="py-12 text-center">
                    <ShieldCheck className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">Aucune agence disponible.</p>
                  </div>
                ) : (
                  <AgencyScoreTable scores={visibleScores} />
                )}
              </div>
            </>
          )}

          {/* ── Onglet Réglementaire ── */}
          {activeTab === 'regulatory' && (
            <>
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-violet-600" />
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Tableau réglementaire</span>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {regulatoryData.map((item) => (
                    <ComplianceGauge key={item.title} {...item} />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
