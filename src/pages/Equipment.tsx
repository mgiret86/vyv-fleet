import { useState, useMemo, useEffect, useCallback } from 'react'
import { PlusCircle, Package, RefreshCw } from 'lucide-react'
import { useAgencyFilter } from '@/hooks/useAgencyFilter'
import { equipmentService } from '@/lib/services'
import type { EquipmentCategory, EquipmentStatus } from '@/data/mockEquipment'
import EquipmentCard    from '@/components/equipment/EquipmentCard'
import EquipmentFilters from '@/components/equipment/EquipmentFilters'
import EquipmentForm    from '@/components/equipment/EquipmentForm'
import EquipmentKPI     from '@/components/equipment/EquipmentKPI'

export interface Equipment {
  id:                  string
  vehicleId:           string
  vehicleRegistration: string
  agencyId:            string
  agencyName:          string
  label:               string
  category:            EquipmentCategory
  serialNumber:        string | null
  status:              EquipmentStatus
  installDate:         string | null
  lastCheckDate:       string | null
  nextCheckDate:       string | null
  expiryDate:          string | null
  maintenanceProvider: string
  notes:               string
  createdAt:           string
  updatedAt:           string
}

function isUrgent(dateStr: string | null, days = 30): boolean {
  if (!dateStr) return false
  const diff = (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  return diff >= 0 && diff < days
}

export default function EquipmentPage() {
  const { filterByAgency, visibleAgencyIds } = useAgencyFilter()

  const [equipments,  setEquipments]  = useState<Equipment[]>([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [category,    setCategory]    = useState<EquipmentCategory | 'ALL'>('ALL')
  const [status,      setStatus]      = useState<EquipmentStatus | 'ALL'>('ALL')
  const [agencyId,    setAgencyId]    = useState('')
  const [urgentOnly,  setUrgentOnly]  = useState(false)
  const [showForm,    setShowForm]    = useState(false)
  const [editingItem, setEditingItem] = useState<Equipment | undefined>(undefined)

  const fetchEquipments = useCallback(async () => {
    setLoading(true)
    try {
      const data = await equipmentService.list()
      setEquipments(data)
    } catch (e) { console.error('Erreur chargement équipements :', e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchEquipments() }, [fetchEquipments])

  const visibleEquipments = useMemo(() => filterByAgency(equipments), [equipments, filterByAgency])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return filterByAgency(equipments).filter((e) => {
      if (q && ![e.label, e.vehicleRegistration, e.agencyName, e.serialNumber ?? ''].some((f) => f.toLowerCase().includes(q))) return false
      if (category !== 'ALL' && e.category !== category) return false
      if (status   !== 'ALL' && e.status   !== status)   return false
      if (agencyId && e.agencyId !== agencyId)            return false
      if (urgentOnly && !isUrgent(e.nextCheckDate) && !isUrgent(e.expiryDate)) return false
      return true
    })
  }, [equipments, search, category, status, agencyId, urgentOnly, filterByAgency])

  // Compteurs rapides pour le header
  const urgentCount  = useMemo(() => visibleEquipments.filter((e) => isUrgent(e.nextCheckDate) || isUrgent(e.expiryDate)).length, [visibleEquipments])
  const activeCount  = useMemo(() => visibleEquipments.filter((e) => (e.status as string) === 'ACTIVE' || (e.status as string) === 'OK').length,              [visibleEquipments])
  const expiredCount = useMemo(() => visibleEquipments.filter((e) => (e.status as string) === 'EXPIRED' || (e.status as string) === 'OUT_OF_SERVICE').length, [visibleEquipments])

  async function handleSave(item: Equipment) {
    try {
      const exists = equipments.some((e) => e.id === item.id)
      if (exists) {
        const updated = await equipmentService.update(item.id, item)
        setEquipments((prev) => prev.map((e) => e.id === item.id ? { ...e, ...updated } : e))
      } else {
        const created = await equipmentService.create(item)
        setEquipments((prev) => [...prev, created])
      }
      setShowForm(false); setEditingItem(undefined)
    } catch (e) { console.error('Erreur sauvegarde équipement :', e) }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Supprimer cet équipement ?')) return
    try {
      await equipmentService.remove(id)
      setEquipments((prev) => prev.filter((e) => e.id !== id))
    } catch (e) { console.error('Erreur suppression équipement :', e) }
  }

  function handleEdit(item: Equipment) { setEditingItem(item); setShowForm(true) }

  const hasActiveFilters = search || category !== 'ALL' || status !== 'ALL' || agencyId || urgentOnly

  return (
    <>
      {/* ── Header gradient ── */}
      <div className="bg-gradient-to-r from-violet-950 to-violet-800 rounded-2xl px-6 py-5 mb-6 shadow-lg">
        <div className="flex items-center justify-between gap-4 flex-wrap">

          <div className="flex items-center gap-5 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Équipements</h1>
                <p className="text-violet-300 text-xs mt-0.5">
                  {loading
                    ? 'Chargement...'
                    : `${visibleEquipments.length} équipement${visibleEquipments.length > 1 ? 's' : ''} dans la flotte`}
                </p>
              </div>
            </div>

            {/* Compteurs rapides */}
            {!loading && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20">
                  <span className="text-xs font-bold text-white">{visibleEquipments.length}</span>
                  <span className="text-[10px] text-violet-300">au total</span>
                </div>
                {activeCount > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/20 border border-green-400/30">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-xs font-bold text-green-300">{activeCount}</span>
                    <span className="text-[10px] text-green-400">opérationnel{activeCount > 1 ? 's' : ''}</span>
                  </div>
                )}
                {urgentCount > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/30">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-xs font-bold text-amber-300">{urgentCount}</span>
                    <span className="text-[10px] text-amber-400">contrôle urgent</span>
                  </div>
                )}
                {expiredCount > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-400/30">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-xs font-bold text-red-300">{expiredCount}</span>
                    <span className="text-[10px] text-red-400">hors service</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={fetchEquipments}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/10 border border-white/20 text-white text-xs font-medium rounded-xl hover:bg-white/20 transition-colors disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
            <button
              onClick={() => { setEditingItem(undefined); setShowForm(true) }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-violet-700 text-sm font-semibold rounded-xl hover:bg-violet-50 transition-colors shadow-sm"
            >
              <PlusCircle className="w-4 h-4" /> Nouvel équipement
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">

        {/* ── KPIs ── */}
        <EquipmentKPI equipments={visibleEquipments} />

        {/* ── Filtres + contenu dans une carte unifiée ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Filtres */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/40">
            <EquipmentFilters
              search={search}           onSearchChange={setSearch}
              category={category}       onCategoryChange={setCategory}
              status={status}           onStatusChange={setStatus}
              agencyId={agencyId}       onAgencyChange={setAgencyId}
              urgentOnly={urgentOnly}   onUrgentChange={setUrgentOnly}
              visibleAgencyIds={visibleAgencyIds}
            />
          </div>

          {/* En-tête de section */}
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-violet-600" />
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                {urgentOnly ? 'Équipements à contrôler en urgence' : 'Liste des équipements'}
              </span>
            </div>
            <span className="text-xs text-gray-400 font-medium">
              {loading ? 'Chargement...' : `${filtered.length} équipement${filtered.length !== 1 ? 's' : ''}`}
            </span>
          </div>

          {/* Contenu */}
          {loading ? (
            <div className="p-12 text-center text-sm text-gray-400 animate-pulse">
              Chargement des équipements...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium text-sm">Aucun équipement trouvé</p>
              <p className="text-gray-400 text-xs mt-1">
                {hasActiveFilters
                  ? 'Aucun équipement ne correspond à vos filtres.'
                  : 'Ajoutez un premier équipement pour commencer.'}
              </p>
            </div>
          ) : (
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((item) => (
                  <EquipmentCard
                    key={item.id}
                    equipment={item as any}
                    onEdit={(eq) => handleEdit(eq as any)}
                    onDelete={() => handleDelete(item.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <EquipmentForm
          equipment={editingItem as any}
          onClose={() => { setShowForm(false); setEditingItem(undefined) }}
          onSave={(item) => handleSave(item as any)}
        />
      )}
    </>
  )
}
