import { useState, useMemo, useEffect, useCallback } from 'react'
import { Fuel, Plus, RefreshCw } from 'lucide-react'
import { useAgencyFilter } from '@/hooks/useAgencyFilter'
import FuelKPI     from '@/components/fuel/FuelKPI'
import FuelFilters from '@/components/fuel/FuelFilters'
import FuelBarChart from '@/components/fuel/FuelBarChart'
import FuelTable   from '@/components/fuel/FuelTable'
import FuelForm    from '@/components/fuel/FuelForm'
import TCOKPI      from '@/components/fuel/TCOKPI'
import TCOPieChart from '@/components/fuel/TCOPieChart'
import TCOTable    from '@/components/fuel/TCOTable'
import { fuelService } from '@/lib/services'
import type { FuelEntry } from '@/types'

// ── Types locaux ──────────────────────────────────────────────────
type FuelTypeFilter = 'ALL' | 'DIESEL' | 'HYBRID' | 'ELECTRIC'
type PeriodFilter   = 'CURRENT_MONTH' | 'PREVIOUS_MONTH' | 'LAST_3_MONTHS' | 'CURRENT_YEAR'

// TCOEntry calqué sur ce qu'attendent TCOPieChart et TCOTable (mockFuel shape)
export interface TCOEntry {
  vehicleId:           string
  vehicleRegistration: string
  agencyId:            string
  agencyName:          string
  monthlyLease:        number
  monthlyFuel:         number
  monthlyMaintenance:  number
  monthlyInsurance:    number
  monthlyOther:        number
  totalMonthlyCost:    number
  annualCost:          number
  costPerKm:           number
  mileage:             number
}

// ── Utilitaire période ─────────────────────────────────────────────
function isWithinPeriod(dateStr: string, period: PeriodFilter): boolean {
  const date  = new Date(dateStr)
  const now   = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth()
  switch (period) {
    case 'CURRENT_MONTH':
      return date.getFullYear() === year && date.getMonth() === month
    case 'PREVIOUS_MONTH': {
      const pm = month === 0 ? 11 : month - 1
      const py = month === 0 ? year - 1 : year
      return date.getFullYear() === py && date.getMonth() === pm
    }
    case 'LAST_3_MONTHS': {
      const limit = new Date(now)
      limit.setMonth(now.getMonth() - 3)
      limit.setDate(1)
      limit.setHours(0, 0, 0, 0)
      return date >= limit
    }
    case 'CURRENT_YEAR':
      return date.getFullYear() === year
    default:
      return true
  }
}

// ── Composant principal ───────────────────────────────────────────
export default function FuelPage() {
  const { filterByAgency, visibleAgencyIds } = useAgencyFilter()

  const [entries,        setEntries]        = useState<FuelEntry[]>([])
  const [loading,        setLoading]        = useState(true)
  const [activeTab,      setActiveTab]      = useState<'fuel' | 'tco'>('fuel')
  const [search,         setSearch]         = useState('')
  const [fuelTypeFilter, setFuelTypeFilter] = useState<FuelTypeFilter>('ALL')
  const [agencyFilter,   setAgencyFilter]   = useState('')
  const [periodFilter,   setPeriodFilter]   = useState<PeriodFilter>('LAST_3_MONTHS')
  const [isFormOpen,     setIsFormOpen]     = useState(false)
  const [editingEntry,   setEditingEntry]   = useState<FuelEntry | null>(null)

  // ── Fetch ────────────────────────────────────────────────────────
  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fuelService.list()
      setEntries(data)
    } catch (e) {
      console.error('Erreur chargement carburant :', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  // ── Données filtrées ─────────────────────────────────────────────
  const visibleEntries = useMemo(
    () => filterByAgency(entries),
    [entries, filterByAgency]
  )

  const filteredEntries = useMemo<FuelEntry[]>(() => {
    const lowerSearch = search.toLowerCase()
    return filterByAgency(entries).filter((entry) => {
      if (search) {
        const match =
          entry.vehicleRegistration.toLowerCase().includes(lowerSearch) ||
          (entry.driverName?.toLowerCase() ?? '').includes(lowerSearch) ||
          (entry.station?.toLowerCase()    ?? '').includes(lowerSearch)
        if (!match) return false
      }
      if (fuelTypeFilter !== 'ALL' && entry.fuelType !== fuelTypeFilter) return false
      if (agencyFilter   !== ''    && entry.agencyId !== agencyFilter)   return false
      if (!isWithinPeriod(entry.date, periodFilter))                     return false
      return true
    })
  }, [entries, search, fuelTypeFilter, agencyFilter, periodFilter, filterByAgency])

  // ── KPIs FuelKPI (props réelles : totalCost, avgConsumption, maxCost, fillCount) ──
  const totalCost = useMemo(
    () => filteredEntries.reduce((s, e) => s + e.totalCost, 0),
    [filteredEntries]
  )
  const maxCost = useMemo(
    () => filteredEntries.reduce((max, e) => Math.max(max, e.totalCost), 0),
    [filteredEntries]
  )
  const fillCount = filteredEntries.length
  const avgConsumption = useMemo(() => {
    const withConso = filteredEntries.filter((e) => e.consumption != null)
    if (!withConso.length) return 0
    return withConso.reduce((s, e) => s + (e.consumption ?? 0), 0) / withConso.length
  }, [filteredEntries])

  // ── Données graphique mensuel (FuelBarChart attend { data: MonthlyEntry[] }) ──
  const barChartData = useMemo(() => {
    const map = new Map<string, number>()
    filteredEntries.forEach((e) => {
      const d     = new Date(e.date)
      const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      map.set(month, (map.get(month) ?? 0) + e.totalCost)
    })
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, cost]) => ({ month, cost }))
  }, [filteredEntries])

  // ── TCO calculé dynamiquement (shape attendu par TCOPieChart & TCOTable) ──
  const tcoEntries = useMemo<TCOEntry[]>(() => {
    const map = new Map<string, TCOEntry>()
    visibleEntries.forEach((e) => {
      if (!map.has(e.vehicleId)) {
        map.set(e.vehicleId, {
          vehicleId:           e.vehicleId,
          vehicleRegistration: e.vehicleRegistration,
          agencyId:            e.agencyId,
          agencyName:          e.agencyName,
          monthlyLease:        0,
          monthlyFuel:         0,
          monthlyMaintenance:  0,
          monthlyInsurance:    0,
          monthlyOther:        0,
          totalMonthlyCost:    0,
          annualCost:          0,
          costPerKm:           0,
          mileage:             e.mileageAtFill ?? 0,
        })
      }
      const tco = map.get(e.vehicleId)!
      tco.monthlyFuel     += e.totalCost / 12
      tco.totalMonthlyCost = tco.monthlyLease + tco.monthlyFuel + tco.monthlyMaintenance + tco.monthlyInsurance + tco.monthlyOther
      tco.annualCost       = tco.totalMonthlyCost * 12
      tco.mileage          = Math.max(tco.mileage, e.mileageAtFill ?? 0)
      tco.costPerKm        = tco.mileage > 0 ? tco.annualCost / tco.mileage : 0
    })
    return Array.from(map.values()).sort((a, b) => b.totalMonthlyCost - a.totalMonthlyCost)
  }, [visibleEntries])

  // ── KPIs TCO (props réelles : totalCost, avgCostPerKm, maxCost, vehicleCount) ──
  const tcoCost       = tcoEntries.reduce((s, t) => s + t.totalMonthlyCost, 0)
  const tcoMaxCost    = tcoEntries.reduce((max, t) => Math.max(max, t.totalMonthlyCost), 0)
  const tcoAvgPerKm   = tcoEntries.length
    ? tcoEntries.reduce((s, t) => s + t.costPerKm, 0) / tcoEntries.length
    : 0
  const tcoVehicleCount = tcoEntries.length

  // ── Handlers ─────────────────────────────────────────────────────
  const handleSave = async (entry: FuelEntry) => {
    try {
      const exists = entries.some((e) => e.id === entry.id)
      if (exists) {
        const updated = await fuelService.update(entry.id, entry)
        setEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, ...updated } : e))
      } else {
        const created = await fuelService.create(entry)
        setEntries((prev) => [...prev, created])
      }
      setIsFormOpen(false)
      setEditingEntry(null)
    } catch (e) {
      console.error('Erreur sauvegarde carburant :', e)
    }
  }

  const handleDelete = async (entry: FuelEntry) => {
    if (!window.confirm('Supprimer cette entrée carburant ?')) return
    try {
      await fuelService.remove(entry.id)
      setEntries((prev) => prev.filter((e) => e.id !== entry.id))
    } catch (e) {
      console.error('Erreur suppression carburant :', e)
    }
  }

  const handleEdit = (entry: FuelEntry) => {
    setEditingEntry(entry)
    setIsFormOpen(true)
  }

  // ── Rendu ────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Carburant & TCO</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading
              ? 'Chargement...'
              : `${visibleEntries.length} entrée${visibleEntries.length > 1 ? 's' : ''} · ${filteredEntries.length} affichée${filteredEntries.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchEntries}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <button
            onClick={() => { setEditingEntry(null); setIsFormOpen(true) }}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Nouvelle entrée
          </button>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 border-b border-gray-200">
        {([
          { value: 'fuel', label: 'Carburant' },
          { value: 'tco',  label: 'TCO'       },
        ] as const).map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.value
                ? 'border-violet-600 text-violet-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Onglet Carburant */}
      {activeTab === 'fuel' && (
        <>
          <FuelKPI
            totalCost={totalCost}
            avgConsumption={avgConsumption}
            maxCost={maxCost}
            fillCount={fillCount}
          />

          <FuelFilters
            search={search}               onSearchChange={setSearch}
            fuelTypeFilter={fuelTypeFilter} onFuelTypeChange={setFuelTypeFilter}
            agencyFilter={agencyFilter}   onAgencyChange={setAgencyFilter}
            periodFilter={periodFilter}   onPeriodChange={setPeriodFilter}
            visibleAgencyIds={visibleAgencyIds}
          />

          {loading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-sm text-gray-400 animate-pulse">
              Chargement des données carburant...
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Fuel className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Aucune entrée carburant</p>
              <p className="text-gray-400 text-sm mt-1">
                Ajoutez une première entrée ou modifiez vos filtres.
              </p>
            </div>
          ) : (
            <>
              <FuelBarChart data={barChartData} />
              <FuelTable
                entries={filteredEntries}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </>
          )}
        </>
      )}

      {/* Onglet TCO */}
      {activeTab === 'tco' && (
        <>
          <TCOKPI
            totalCost={tcoCost}
            avgCostPerKm={tcoAvgPerKm}
            maxCost={tcoMaxCost}
            vehicleCount={tcoVehicleCount}
          />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <TCOPieChart tcoEntries={tcoEntries as any} />
            <TCOTable    entries={tcoEntries as any} />
          </div>
        </>
      )}

      {/* Formulaire */}
      <FuelForm
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingEntry(null) }}
        entry={editingEntry}
        onSave={handleSave}
      />
    </div>
  )
}
