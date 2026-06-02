import { useState, useMemo, useEffect, useCallback } from 'react'
import { PlusCircle, Package, RefreshCw } from 'lucide-react'
import { useAgencyFilter } from '@/hooks/useAgencyFilter'
import { equipmentService } from '@/lib/services'
import type { EquipmentCategory, EquipmentStatus } from '@/data/mockEquipment'
import EquipmentCard    from '@/components/equipment/EquipmentCard'
import EquipmentFilters from '@/components/equipment/EquipmentFilters'
import EquipmentForm    from '@/components/equipment/EquipmentForm'
import EquipmentKPI     from '@/components/equipment/EquipmentKPI'

// ── Type local (reflète le modèle Prisma) ─────────────────────────
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

// ── Utilitaire urgence ────────────────────────────────────────────
function isUrgent(dateStr: string | null, days = 30): boolean {
  if (!dateStr) return false
  const diff = (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  return diff >= 0 && diff < days
}

// ── Composant principal ───────────────────────────────────────────
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

  // ── Fetch ────────────────────────────────────────────────────────
  const fetchEquipments = useCallback(async () => {
    setLoading(true)
    try {
      const data = await equipmentService.list()
      setEquipments(data)
    } catch (e) {
      console.error('Erreur chargement équipements :', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEquipments() }, [fetchEquipments])

  // ── Données filtrées ─────────────────────────────────────────────
  const visibleEquipments = useMemo(
    () => filterByAgency(equipments),
    [equipments, filterByAgency]
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return filterByAgency(equipments).filter((e) => {
      if (q && ![
        e.label,
        e.vehicleRegistration,
        e.agencyName,
        e.serialNumber ?? '',
      ].some((f) => f.toLowerCase().includes(q))) return false
      if (category !== 'ALL' && e.category !== category) return false
      if (status   !== 'ALL' && e.status   !== status)   return false
      if (agencyId && e.agencyId !== agencyId)            return false
      if (urgentOnly && !isUrgent(e.nextCheckDate) && !isUrgent(e.expiryDate)) return false
      return true
    })
  }, [equipments, search, category, status, agencyId, urgentOnly, filterByAgency])

  // ── Handlers ─────────────────────────────────────────────────────
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
      setShowForm(false)
      setEditingItem(undefined)
    } catch (e) {
      console.error('Erreur sauvegarde équipement :', e)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Supprimer cet équipement ?')) return
    try {
      await equipmentService.remove(id)
      setEquipments((prev) => prev.filter((e) => e.id !== id))
    } catch (e) {
      console.error('Erreur suppression équipement :', e)
    }
  }

  function handleEdit(item: Equipment) {
    setEditingItem(item)
    setShowForm(true)
  }

  // ── Rendu ────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Équipements</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading
              ? 'Chargement...'
              : `${visibleEquipments.length} équipement${visibleEquipments.length > 1 ? 's' : ''} · ${filtered.length} affiché${filtered.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchEquipments}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <button
            onClick={() => { setEditingItem(undefined); setShowForm(true) }}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4" /> Nouvel équipement
          </button>
        </div>
      </div>

      {/* KPIs — calcule ses propres données en interne */}
      <EquipmentKPI equipments={visibleEquipments} />

      {/* Filtres */}
      <EquipmentFilters
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        status={status}
        onStatusChange={setStatus}
        agencyId={agencyId}
        onAgencyChange={setAgencyId}
        urgentOnly={urgentOnly}
        onUrgentChange={setUrgentOnly}
        visibleAgencyIds={visibleAgencyIds}
      />

      {/* Contenu */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-sm text-gray-400 animate-pulse">
          Chargement des équipements...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucun équipement trouvé</p>
          <p className="text-gray-400 text-sm mt-1">
            {urgentOnly || category !== 'ALL' || status !== 'ALL' || search
              ? 'Aucun équipement ne correspond à vos filtres.'
              : 'Ajoutez un premier équipement pour commencer.'}
          </p>
        </div>
      ) : (
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
      )}

      {/* Formulaire — monté/démonté conditionnellement (pas de prop isOpen) */}
      {showForm && (
        <EquipmentForm
          equipment={editingItem as any}
          onClose={() => { setShowForm(false); setEditingItem(undefined) }}
          onSave={(item) => handleSave(item as any)}
        />
      )}

    </div>
  )
}
