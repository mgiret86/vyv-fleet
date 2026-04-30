import { useState, useMemo, useEffect, useCallback } from 'react'
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

// ── Calcul des scores par agence depuis les alertes réelles ──────────────────
function computeScores(alerts: Alert[], agencies: { id: string; name: string }[]): ComplianceScore[] {
  return agencies.map((agency) => {
    const agencyAlerts = alerts.filter((a) => a.agencyId === agency.id)
    const categories = ['ARS', 'CT', 'ASSURANCE', 'EQUIPEMENT', 'MAINTENANCE'] as const
    const now = new Date()
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const details = Object.fromEntries(
      categories.map((cat) => {
        const catAlerts = agencyAlerts.filter((a) => a.category === cat)
        const expired     = catAlerts.filter((a) => a.dueDate && new Date(a.dueDate) < now && a.status !== 'RESOLVED').length
        const expiringSoon = catAlerts.filter((a) => a.dueDate && new Date(a.dueDate) >= now && new Date(a.dueDate) <= in30 && a.status !== 'RESOLVED').length
        const total       = catAlerts.length
        const compliant   = catAlerts.filter((a) => a.status === 'RESOLVED' || a.severity === 'INFO').length
        return [cat, { compliant, total, expired, expiringSoon }]
      })
    ) as ComplianceScore['details']

    const totalAlerts   = agencyAlerts.length
    const criticals     = agencyAlerts.filter((a) => a.severity === 'CRITICAL' && a.status !== 'RESOLVED').length
    const warnings      = agencyAlerts.filter((a) => a.severity === 'WARNING'  && a.status !== 'RESOLVED').length
    const score = totalAlerts === 0
      ? 100
      : Math.max(0, Math.round(100 - (criticals * 10 + warnings * 3)))

    return {
      agencyId:     agency.id,
      agencyName:   agency.name,
      score,
      vehicleCount: 0,
      details,
    }
  })
}

// ── Calcul du tableau réglementaire depuis les alertes réelles ───────────────
function computeRegulatoryData(alerts: Alert[]) {
  const now   = new Date()
  const in30  = new Date(now.getTime() + 30  * 24 * 60 * 60 * 1000)
  const in90  = new Date(now.getTime() + 90  * 24 * 60 * 60 * 1000)
  const cats  = [
    { key: 'ARS',        title: 'Agréments ARS'         },
    { key: 'CT',         title: 'Contrôles techniques'  },
    { key: 'ASSURANCE',  title: 'Assurances'             },
    { key: 'EQUIPEMENT', title: 'Équipements médicaux'  },
  ] as const
  return cats.map(({ key, title }) => {
    const catAlerts = alerts.filter((a) => a.category === key)
    const total       = catAlerts.length
    const expired     = catAlerts.filter((a) => a.dueDate && new Date(a.dueDate) < now  && a.status !== 'RESOLVED').length
    const expiring30  = catAlerts.filter((a) => a.dueDate && new Date(a.dueDate) >= now && new Date(a.dueDate) <= in30 && a.status !== 'RESOLVED').length
    const expiring90  = catAlerts.filter((a) => a.dueDate && new Date(a.dueDate) >= now && new Date(a.dueDate) <= in90 && a.status !== 'RESOLVED').length
    const compliant   = total - expired - expiring30
    return { title, compliant: Math.max(0, compliant), total, expired, expiring30, expiring90 }
  })
}

// ── Composant principal ───────────────────────────────────────────────────────
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

  // ── Chargement initial depuis l'API ─────────────────────────────────────────
  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true)
      const data = await alertService.list()
      setAlerts(data)
    } catch (e) {
      console.error('Erreur chargement alertes :', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAlerts() }, [loadAlerts])
  useEffect(() => { if (agencies.length === 0) fetchAgencies() }, [fetchAgencies, agencies.length])

  // ── Résolution d'une alerte ─────────────────────────────────────────────────
  const handleStatusChange = useCallback(async (id: string, newStatus: 'IN_PROGRESS' | 'RESOLVED') => {
    if (!can('compliance', 'edit')) return
    try {
      if (newStatus === 'RESOLVED') {
        await alertService.resolve(id)
      }
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                status:     newStatus,
                resolvedAt: newStatus === 'RESOLVED' ? new Date().toISOString() : a.resolvedAt,
                resolvedBy: newStatus === 'RESOLVED' ? 'Chef d agence' : a.resolvedBy,
              }
            : a
        )
      )
    } catch (e) {
      console.error('Erreur résolution alerte :', e)
    }
  }, [can])

  const visibleAgencies = useMemo(
    () => agencies.filter((a) => visibleAgencyIds.includes(a.id)),
    [agencies, visibleAgencyIds]
  )

  const visibleAlerts = useMemo(() => filterByAgency(alerts), [alerts, filterByAgency])

  const filteredAlerts = useMemo(() => {
    return filterByAgency(alerts)
      .filter((alert) => {
        if (search) {
          const s = search.toLowerCase()
          if (
            !alert.vehicleRegistration.toLowerCase().includes(s) &&
            !alert.message.toLowerCase().includes(s) &&
            !alert.description.toLowerCase().includes(s)
          ) return false
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

  const visibleScores   = useMemo(() => computeScores(visibleAlerts, visibleAgencies),  [visibleAlerts, visibleAgencies])
  const regulatoryData  = useMemo(() => computeRegulatoryData(visibleAlerts),            [visibleAlerts])

  const tabs = [
    { id: 'alerts'     as const, label: 'Alertes actives'       },
    { id: 'scores'     as const, label: 'Score par agence'      },
    { id: 'regulatory' as const, label: 'Tableau réglementaire' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Conformité et Alertes</h1>
        <p className="text-sm text-gray-500 mt-1">Suivi de la conformité réglementaire et gestion des alertes</p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={['py-3 px-1 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-violet-600 text-violet-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              ].join(' ')}>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'alerts' && (
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12 text-gray-400 text-sm">Chargement des alertes...</div>
          ) : (
            <>
              <AlertKPI alerts={visibleAlerts} />
              <AlertFilters
                search={search}       onSearchChange={setSearch}
                severity={severity}   onSeverityChange={setSeverity}
                category={category}   onCategoryChange={setCategory}
                status={status}       onStatusChange={setStatus}
                agencyId={agencyId}   onAgencyChange={setAgencyId}
                agencies={visibleAgencies}
              />
              <div className="space-y-3">
                {filteredAlerts.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-sm">
                    Aucune alerte ne correspond aux filtres.
                  </div>
                ) : (
                  filteredAlerts.map((alert) => (
                    <AlertCard
                      key={alert.id}
                      alert={alert}
                      onStatusChange={can('compliance', 'edit') ? handleStatusChange : undefined}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'scores' && (isLoadingAgencies ? <div className="text-center py-12 text-gray-400 text-sm">Chargement des agences...</div> : visibleScores.length === 0 ? <div className="text-center py-12 text-gray-400 text-sm">Aucune agence disponible.</div> : <AgencyScoreTable scores={visibleScores} />)}
      {activeTab === 'regulatory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {regulatoryData.map((item) => <ComplianceGauge key={item.title} {...item} />)}
        </div>
      )}
    </div>
  )
}
