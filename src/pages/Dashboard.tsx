import { useEffect, useState, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Truck, AlertCircle, Wrench, ChevronDown,
  CheckCircle, Clock, ArrowRight, AlertTriangle, Activity,
  BarChart2, ShieldCheck,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { useAppStore }             from '@/store/useAppStore'
import { useAgencyFilter }         from '@/hooks/useAgencyFilter'
import { useVehicleCategoryStore } from '@/store/vehicleCategoryStore'
import {
  dashboardService,
  alertService,
} from '@/lib/services'
import {
  MOCK_AGENCY_STATS,
  MOCK_COST_TREND,
  MOCK_EXPIRING_HABILITATIONS,
  MOCK_OPEN_INCIDENTS,
} from '@/data/mockDashboard'
import { MOCK_VEHICLES } from '@/data/mockVehicles'
import type { Alert, MaintenanceRecord } from '@/types'

// ── Constantes ─────────────────────────────────────────────────────
const SEVERITY_ORDER = { CRITICAL: 0, WARNING: 1, INFO: 2 } as const

const SEVERITY_STYLES = {
  CRITICAL: { badge: 'bg-red-100 text-red-700 border-red-200',         dot: 'bg-red-500',    bar: '#ef4444' },
  WARNING:  { badge: 'bg-amber-100 text-amber-700 border-amber-200',   dot: 'bg-amber-400',  bar: '#f59e0b' },
  INFO:     { badge: 'bg-blue-100 text-blue-700 border-blue-200',       dot: 'bg-blue-400',   bar: '#3b82f6' },
  MAJOR:    { badge: 'bg-amber-100 text-amber-700 border-amber-200',   dot: 'bg-amber-400',  bar: '#f59e0b' },
  MINOR:    { badge: 'bg-blue-100 text-blue-700 border-blue-200',       dot: 'bg-blue-400',   bar: '#3b82f6' },
} as const

const MAINT_STATUS_STYLES = {
  SCHEDULED:   'bg-blue-50 text-blue-700 border-blue-100',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-100',
  COMPLETED:   'bg-green-50 text-green-700 border-green-100',
  CANCELLED:   'bg-gray-50 text-gray-500 border-gray-100',
} as const

const COLOR_HEX: Record<string, string> = {
  violet: '#7c3aed', blue: '#2563eb', green: '#16a34a',
  orange: '#ea580c', red: '#dc2626',  yellow: '#ca8a04',
  pink: '#db2777',   teal: '#0d9488', gray: '#6b7280',
}

function getCategoryHex(colorKey: string): string {
  return COLOR_HEX[colorKey] ?? '#6b7280'
}

// ── Helpers ────────────────────────────────────────────────────────
function formatDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}
function formatCurrency(n: number) {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
}
function getDaysLeft(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
}
function getAvailColor(rate: number) {
  return rate >= 90 ? '#16a34a' : rate >= 80 ? '#f59e0b' : '#ef4444'
}
function getCompliColor(score: number) {
  return score >= 90 ? '#16a34a' : score >= 75 ? '#f59e0b' : '#ef4444'
}

// ── Jauge circulaire SVG ───────────────────────────────────────────
function CircularGauge({ value, color, label, size = 96 }: {
  value: number; color: string; label: string; size?: number
}) {
  const r = 36; const circ = 2 * Math.PI * r
  const dash = Math.min(value / 100, 1) * circ
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#f3f4f6" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 50 50)" />
        <text x="50" y="50" textAnchor="middle" dominantBaseline="central"
          fontSize="16" fontWeight="700" fill={color}>{value}%</text>
      </svg>
      <span className="text-xs font-medium text-gray-500">{label}</span>
    </div>
  )
}

// ── Section header ─────────────────────────────────────────────────
function SectionHeader({ title, linkTo, linkLabel }: { title: string; linkTo?: string; linkLabel?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-1 h-5 rounded-full bg-violet-600" />
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">{title}</h2>
      </div>
      {linkTo && (
        <Link to={linkTo} className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors">
          {linkLabel} <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  )
}

// ── KPI Card ───────────────────────────────────────────────────────
function KpiCard({
  icon: Icon, label, value, sub, borderColor, bgColor, iconColor, onClick, progress,
}: {
  icon: React.ElementType; label: string; value: React.ReactNode; sub?: React.ReactNode
  borderColor: string; bgColor: string; iconColor: string
  onClick?: () => void; progress?: { value: number; color: string }
}) {
  const Wrapper = onClick ? 'button' : 'div'
  return (
    <Wrapper
      onClick={onClick}
      className={`bg-white rounded-xl border border-l-4 ${borderColor} shadow-sm p-5 text-left w-full transition-all ${onClick ? 'hover:shadow-md cursor-pointer group' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <span className="text-xs font-medium text-gray-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {sub && <div className="mt-1">{sub}</div>}
      {progress && (
        <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all"
            style={{ width: `${progress.value}%`, backgroundColor: progress.color }} />
        </div>
      )}
    </Wrapper>
  )
}

// ── Composant principal ────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const { agencies, selectedAgencyId, setSelectedAgencyId, fetchAgencies } = useAppStore()
  const { visibleAgencyIds } = useAgencyFilter()
  const { getActive, fetchCategories } = useVehicleCategoryStore()

  const [alerts,       setAlerts]       = useState<Alert[]>([])
  const [maintenances, setMaintenances] = useState<MaintenanceRecord[]>([])
  const [loading,      setLoading]      = useState(true)
  const [resolvingId,  setResolvingId]  = useState<string | null>(null)

  const visibleAgencies = useMemo(
    () => agencies.filter((a) => visibleAgencyIds.includes(a.id)),
    [agencies, visibleAgencyIds]
  )
  const categories = useMemo(() => getActive().filter((c) => !c.isSystem), [getActive])

  useEffect(() => { fetchAgencies(); fetchCategories() }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const agencyId = selectedAgencyId ?? undefined
    try {
      const [a, m] = await Promise.all([
        dashboardService.alerts(agencyId),
        dashboardService.maintenances(agencyId),
      ])
      setAlerts(Array.isArray(a)
        ? (a as Alert[]).sort((x, y) => SEVERITY_ORDER[x.severity] - SEVERITY_ORDER[y.severity])
        : [])
      setMaintenances(Array.isArray(m) ? (m as MaintenanceRecord[]) : [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [selectedAgencyId])

  useEffect(() => { fetchAll() }, [fetchAll])

  const kpiStats = useMemo(() => {
    const vehicles = selectedAgencyId
      ? MOCK_VEHICLES.filter((v) => v.agencyId === selectedAgencyId)
      : MOCK_VEHICLES
    const activeVehicles   = vehicles.filter((v) => v.status === 'ACTIVE').length
    const totalVehicles    = vehicles.length
    const availabilityRate = totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0
    const complianceScore  = totalVehicles > 0
      ? Math.round(vehicles.reduce((s, v) => s + (v.complianceScore ?? 0), 0) / totalVehicles) : 0
    const filteredAlerts       = selectedAgencyId ? alerts.filter((a) => a.agencyId === selectedAgencyId) : alerts
    const criticalAlerts       = filteredAlerts.filter((a) => a.severity === 'CRITICAL').length
    const warningAlerts        = filteredAlerts.filter((a) => a.severity === 'WARNING').length
    const filteredMaint        = selectedAgencyId ? maintenances.filter((m) => m.agencyId === selectedAgencyId) : maintenances
    const maintenancesThisWeek = filteredMaint.length
    return { activeVehicles, totalVehicles, availabilityRate, complianceScore, criticalAlerts, warningAlerts, maintenancesThisWeek }
  }, [selectedAgencyId, alerts, maintenances])

  const availColor  = getAvailColor(kpiStats.availabilityRate)
  const compliColor = getCompliColor(kpiStats.complianceScore)

  const agencyStats = useMemo(() =>
    selectedAgencyId ? MOCK_AGENCY_STATS.filter((a) => a.agencyId === selectedAgencyId) : MOCK_AGENCY_STATS,
    [selectedAgencyId])

  const filteredAlerts = useMemo(() =>
    selectedAgencyId ? alerts.filter((a) => a.agencyId === selectedAgencyId) : alerts,
    [alerts, selectedAgencyId])

  const filteredMaintenances = useMemo(() =>
    selectedAgencyId ? maintenances.filter((m) => m.agencyId === selectedAgencyId) : maintenances,
    [maintenances, selectedAgencyId])

  const expiringHabs = useMemo(() => {
    if (!selectedAgencyId) return MOCK_EXPIRING_HABILITATIONS
    const agencyName = MOCK_AGENCY_STATS.find((a) => a.agencyId === selectedAgencyId)?.agencyName
    return MOCK_EXPIRING_HABILITATIONS.filter((h) => h.agencyName === agencyName)
  }, [selectedAgencyId])

  const openIncidents = useMemo(() => {
    if (!selectedAgencyId) return MOCK_OPEN_INCIDENTS
    const agencyName = MOCK_AGENCY_STATS.find((a) => a.agencyId === selectedAgencyId)?.agencyName
    return MOCK_OPEN_INCIDENTS.filter((i) => i.agencyName === agencyName)
  }, [selectedAgencyId])

  const filteredVehicles = useMemo(() =>
    selectedAgencyId ? MOCK_VEHICLES.filter((v) => v.agencyId === selectedAgencyId) : MOCK_VEHICLES,
    [selectedAgencyId])

  const vehiclesByAgency = useMemo(() => {
    const map = new Map<string, Record<string, number>>()
    filteredVehicles.forEach((v) => {
      if (!map.has(v.agencyName)) map.set(v.agencyName, {})
      const entry = map.get(v.agencyName)!
      entry[v.category] = (entry[v.category] ?? 0) + 1
    })
    return Array.from(map.entries()).map(([agencyName, counts]) => ({
      agencyName: agencyName.replace('VYV Ambulance ', ''),
      ...counts,
    }))
  }, [filteredVehicles])

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    categories.forEach((cat) => { totals[cat.id] = filteredVehicles.filter((v) => v.category === cat.id).length })
    const horsListe = getActive().find((c) => c.isSystem)
    if (horsListe) totals[horsListe.id] = filteredVehicles.filter((v) => v.category === horsListe.id).length
    return totals
  }, [filteredVehicles, categories, getActive])

  const allChartCategories = useMemo(() =>
    getActive().filter((c) => (categoryTotals[c.id] ?? 0) > 0),
    [getActive, categoryTotals])

  const handleResolveAlert = async (id: string) => {
    setResolvingId(id)
    try {
      await alertService.resolve(id)
      setAlerts((prev) => prev.filter((a) => a.id !== id))
    } catch (e) { console.error(e) }
    finally { setResolvingId(null) }
  }

  return (
    <div className="space-y-8">

      {/* ── Header page ── */}
      <div className="bg-gradient-to-r from-violet-950 to-violet-800 rounded-2xl p-6 flex items-center justify-between shadow-lg">
        <div>
          <h1 className="text-xl font-bold text-white">Tableau de bord</h1>
          <p className="text-violet-300 text-sm mt-0.5">Vue en temps réel de la flotte VYV Ambulance</p>
        </div>
        <div className="flex items-center gap-3">
          {visibleAgencies.length > 1 && (
            <label className="text-sm font-medium text-violet-300">Agence :</label>
          )}
          <div className="relative">
            <select
              value={selectedAgencyId || ''}
              onChange={(e) => setSelectedAgencyId(e.target.value || null)}
              className="appearance-none bg-white/10 backdrop-blur border border-white/20 rounded-xl px-4 py-2.5 pr-10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-400 cursor-pointer"
            >
              {visibleAgencies.length > 1 && <option value="" className="text-gray-900">Toutes les agences</option>}
              {visibleAgencies.map((a) => <option key={a.id} value={a.id} className="text-gray-900">{a.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── SECTION 1 — KPIs ── */}
      <div>
        <SectionHeader title="Synthèse flotte" />
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-l-4 border-gray-200 p-5 animate-pulse h-28" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              icon={Truck} label="Véhicules actifs"
              value={<span>{kpiStats.activeVehicles}<span className="text-sm font-normal text-gray-400"> / {kpiStats.totalVehicles}</span></span>}
              borderColor="border-violet-500" bgColor="bg-violet-50" iconColor="text-violet-600"
              onClick={() => navigate('/vehicles')}
            />
            <KpiCard
              icon={Activity} label="Disponibilité"
              value={<span style={{ color: availColor }}>{kpiStats.availabilityRate}%</span>}
              borderColor="border-green-500" bgColor="bg-green-50" iconColor="text-green-600"
              progress={{ value: kpiStats.availabilityRate, color: availColor }}
            />
            <KpiCard
              icon={AlertCircle} label="Alertes actives"
              value={
                <div className="flex items-center gap-2">
                  <span className="text-red-600">{kpiStats.criticalAlerts}</span>
                  <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">critiques</span>
                  <span className="text-amber-500">{kpiStats.warningAlerts}</span>
                  <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">warnings</span>
                </div>
              }
              borderColor="border-red-500" bgColor="bg-red-50" iconColor="text-red-500"
              onClick={() => navigate('/alerts')}
            />
            <KpiCard
              icon={Wrench} label="Maintenances"
              value={<span>{kpiStats.maintenancesThisWeek}<span className="text-sm font-normal text-gray-400"> planifiées</span></span>}
              borderColor="border-amber-500" bgColor="bg-amber-50" iconColor="text-amber-600"
              onClick={() => navigate('/maintenance')}
            />
          </div>
        )}
      </div>

      {/* ── Indicateurs + Disponibilité par agence ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <ShieldCheck className="w-4 h-4 text-violet-500" />
            <h3 className="text-sm font-bold text-gray-700">Indicateurs clés</h3>
          </div>
          <div className="flex items-center justify-around">
            <CircularGauge value={kpiStats.availabilityRate} color={availColor}  label="Disponibilité" />
            <CircularGauge value={kpiStats.complianceScore}  color={compliColor} label="Conformité"    />
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <BarChart2 className="w-4 h-4 text-violet-500" />
            <h3 className="text-sm font-bold text-gray-700">Disponibilité par agence</h3>
          </div>
          <div className="space-y-4">
            {agencyStats.map((a) => (
              <div key={a.agencyId} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-44 truncate">{a.agencyName}</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${a.availabilityRate}%`, backgroundColor: getAvailColor(a.availabilityRate) }} />
                </div>
                <span className="text-xs font-bold w-10 text-right" style={{ color: getAvailColor(a.availabilityRate) }}>
                  {a.availabilityRate}%
                </span>
                <span className="text-xs text-gray-400 w-16 text-right">{a.active}/{a.total} véh.</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SECTION 2 — Alertes & Conformité ── */}
      <div>
        <SectionHeader title="Alertes & Conformité" linkTo="/alerts" linkLabel="Toutes les alertes" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Alertes prioritaires */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-700">Alertes prioritaires</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                {filteredAlerts.length} active(s)
              </span>
            </div>
            <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
              {loading ? (
                <div className="px-5 py-8 text-center text-sm text-gray-400 animate-pulse">Chargement...</div>
              ) : filteredAlerts.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Aucune alerte active</p>
                </div>
              ) : filteredAlerts.map((alert) => {
                const s = SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.INFO
                return (
                  <div key={alert.id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50/80 transition-colors">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{alert.vehicleRegistration}</p>
                      <p className="text-xs text-gray-500 truncate">{alert.message}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(alert.dueDate)} · {alert.agencyName}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border flex-shrink-0 font-medium ${s.badge}`}>
                      {alert.severity}
                    </span>
                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      disabled={resolvingId === alert.id}
                      className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-green-600 border border-green-200 rounded-lg hover:bg-green-50 disabled:opacity-50 transition-colors text-xs"
                    >
                      {resolvingId === alert.id ? '…' : '✓'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Habilitations */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-700">Habilitations à renouveler</h3>
              <Link to="/drivers" className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1">
                Conducteurs <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
              {expiringHabs.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Aucune habilitation urgente</p>
                </div>
              ) : expiringHabs.map((h, i) => {
                const s = SEVERITY_STYLES[h.severity]
                return (
                  <div key={i} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50/80 transition-colors">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{h.driverName}</p>
                      <p className="text-xs text-gray-500">{h.type}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{h.agencyName} · expire {formatDate(h.expiryDate)}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border flex-shrink-0 font-medium ${s.badge}`}>
                      J-{h.daysLeft}
                    </span>
                    <Link to="/drivers"
                      className="flex-shrink-0 text-xs text-violet-600 border border-violet-200 rounded-lg px-2 py-1 hover:bg-violet-50 transition-colors">
                      Voir
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 3 — Maintenance & Coûts ── */}
      <div>
        <SectionHeader title="Maintenance & Coûts" linkTo="/maintenance" linkLabel="Toutes les maintenances" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Prochaines interventions */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-700">Prochaines interventions</h3>
            </div>
            <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
              {loading ? (
                <div className="px-5 py-8 text-center text-sm text-gray-400 animate-pulse">Chargement...</div>
              ) : filteredMaintenances.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-gray-500">Aucune maintenance planifiée</div>
              ) : filteredMaintenances.map((m) => {
                const daysLeft = getDaysLeft(m.scheduledDate)
                const urgency  = daysLeft <= 3 ? 'text-red-600' : daysLeft <= 7 ? 'text-amber-600' : 'text-gray-400'
                return (
                  <div key={m.id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50/80 transition-colors">
                    <div className="flex flex-col items-center flex-shrink-0 w-10 text-center">
                      <Clock className={`w-4 h-4 ${urgency}`} />
                      <span className={`text-[10px] font-bold ${urgency}`}>J-{daysLeft}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{m.vehicleRegistration}</p>
                      <p className="text-xs text-gray-500 truncate">{m.label}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{m.provider} · {formatDate(m.scheduledDate)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${MAINT_STATUS_STYLES[m.status as keyof typeof MAINT_STATUS_STYLES] ?? 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                        {m.status === 'SCHEDULED' ? 'Planifiée' : m.status === 'IN_PROGRESS' ? 'En cours' : m.status}
                      </span>
                      {m.estimatedCost != null && (
                        <span className="text-[10px] text-gray-400">{formatCurrency(m.estimatedCost)}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Graphique coûts */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4">Évolution des coûts (6 mois)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={MOCK_COST_TREND} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFuel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorMaint" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}€`} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: 12 }}
                  formatter={(value: number, name: string) => [formatCurrency(value), name === 'fuel' ? 'Carburant' : 'Maintenance']} />
                <Legend formatter={(v) => v === 'fuel' ? 'Carburant' : 'Maintenance'} wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="fuel"        stroke="#7c3aed" strokeWidth={2} fill="url(#colorFuel)"  />
                <Area type="monotone" dataKey="maintenance" stroke="#f59e0b" strokeWidth={2} fill="url(#colorMaint)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── SECTION 4 — Incidents & Activité ── */}
      <div>
        <SectionHeader title="Incidents & Activité" linkTo="/incidents" linkLabel="Tous les incidents" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Incidents ouverts */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-700">Incidents ouverts</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                {openIncidents.length} en cours
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {openIncidents.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Aucun incident ouvert</p>
                </div>
              ) : openIncidents.map((inc) => {
                const s = SEVERITY_STYLES[inc.severity as keyof typeof SEVERITY_STYLES] ?? SEVERITY_STYLES.INFO
                return (
                  <div key={inc.id} className="px-4 py-3 flex items-start gap-3 hover:bg-gray-50/80 transition-colors">
                    <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${inc.severity === 'CRITICAL' ? 'text-red-500' : inc.severity === 'MAJOR' ? 'text-amber-500' : 'text-blue-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-gray-800">{inc.vehicleRegistration}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${s.badge}`}>{inc.severity}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{inc.description}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{inc.agencyName} · {formatDate(inc.date)}</p>
                    </div>
                    <Link to="/incidents"
                      className="flex-shrink-0 text-xs text-violet-600 border border-violet-200 rounded-lg px-2 py-1 hover:bg-violet-50 transition-colors">
                      Voir
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Graphique conformité */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4">Conformité par agence</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={agencyStats} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="agencyName" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" interval={0} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: 12 }}
                  formatter={(v: number, name: string) => [`${v}%`, name === 'availabilityRate' ? 'Disponibilité' : 'Conformité']} />
                <Legend formatter={(v) => v === 'availabilityRate' ? 'Disponibilité' : 'Conformité'} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="availabilityRate" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="complianceScore"  fill="#a78bfa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── SECTION 5 — Répartition flotte ── */}
      <div>
        <SectionHeader title="Répartition de la flotte" linkTo="/vehicles" linkLabel="Tous les véhicules" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Barres empilées */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4">Véhicules par agence et catégorie</h3>
            {allChartCategories.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-sm text-gray-400">
                Aucune catégorie définie — créez-en dans Paramètres
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={vehiclesByAgency} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="agencyName" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} angle={-15} textAnchor="end" interval={0} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: 12 }}
                    formatter={(value: number, catId: string) => {
                      const cat = getActive().find((c) => c.id === catId)
                      return [`${value} véhicule${value > 1 ? 's' : ''}`, cat?.label ?? catId]
                    }} />
                  <Legend formatter={(catId) => { const cat = getActive().find((c) => c.id === catId); return cat?.label ?? catId }} wrapperStyle={{ fontSize: 11, paddingTop: '8px' }} />
                  {allChartCategories.map((cat, idx) => (
                    <Bar key={cat.id} dataKey={cat.id} stackId="fleet" fill={getCategoryHex(cat.color)}
                      radius={idx === allChartCategories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Total par catégorie */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4">Total par catégorie</h3>
            {allChartCategories.length === 0 ? (
              <div className="text-sm text-gray-400 text-center py-8">Aucune catégorie définie</div>
            ) : (
              <div className="space-y-4">
                {allChartCategories.map((cat) => {
                  const count = categoryTotals[cat.id] ?? 0
                  const total = filteredVehicles.length
                  const pct   = total > 0 ? Math.round((count / total) * 100) : 0
                  const hex   = getCategoryHex(cat.color)
                  return (
                    <div key={cat.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: hex }} />
                          <span className="text-xs font-medium text-gray-600">{cat.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-700">{count}</span>
                          <span className="text-[10px] text-gray-400">{pct}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: hex }} />
                      </div>
                    </div>
                  )
                })}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">Total flotte</span>
                  <span className="text-sm font-bold text-violet-600">{filteredVehicles.length} véhicules</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
