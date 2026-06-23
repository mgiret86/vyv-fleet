import { useState, useMemo, useEffect } from 'react'
import { Plus, Edit, Truck, Trash2, Car } from 'lucide-react'
import { useVehicleStore }         from '@/store/vehicleStore'
import { useVehicleCategoryStore } from '@/store/vehicleCategoryStore'
import VehicleTable                from '@/components/vehicles/VehicleTable'
import VehicleFilters              from '@/components/vehicles/VehicleFilters'
import CategoryFilterBar           from '@/components/vehicles/CategoryFilterBar'
import VehicleForm                 from '@/components/vehicles/VehicleForm'
import VehicleStatusModal          from '@/components/vehicles/VehicleStatusModal'
import ConfirmModal                from '@/components/ui/ConfirmModal'
import VehicleAddModal             from '@/components/vehicles/VehicleAddModal'
import VehiclePlateScanner         from '@/components/vehicles/VehiclePlateScanner'
import type { Vehicle, VehicleStatus } from '@/types'
import { useToast }                from '@/hooks/useToast'
import { useAgencyFilter }         from '@/hooks/useAgencyFilter'

export default function Vehicles() {
  const { vehicles, deleteVehicle, fetchVehicles } = useVehicleStore()
  const { getActive, fetchCategories }             = useVehicleCategoryStore()

  useEffect(() => { fetchVehicles(); fetchCategories() }, [])

  const toast = useToast()
  const { filterByAgency, visibleAgencyIds } = useAgencyFilter()

  const categories = getActive()

  // ── États modales ──────────────────────────────────────────────
  const [showAddModal,       setShowAddModal]       = useState(false)
  const [showScanner,        setShowScanner]        = useState(false)
  const [isFormModalOpen,    setIsFormModalOpen]    = useState(false)
  const [isStatusModalOpen,  setIsStatusModalOpen]  = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [selectedVehicle,    setSelectedVehicle]    = useState<Vehicle | null>(null)
  const [formPrefill,        setFormPrefill]        = useState<Partial<Vehicle> | undefined>(undefined)

  // ── Filtres ────────────────────────────────────────────────────
  const [search,             setSearch]             = useState('')
  const [statusFilter,       setStatusFilter]       = useState<VehicleStatus | 'ALL'>('ALL')
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [agencyFilter,       setAgencyFilter]       = useState('')

  // ── Compteurs ──────────────────────────────────────────────────
  const globalCounts = useMemo(() => {
    return categories.reduce<Record<string, number>>((acc, cat) => {
      acc[cat.id] = vehicles.filter((v) => v.category === cat.id).length
      return acc
    }, {})
  }, [vehicles, categories])

  const categoryCounts = useMemo(() => {
    let base = filterByAgency(vehicles)
    if (agencyFilter)           base = base.filter((v) => v.agencyId === agencyFilter)
    if (statusFilter !== 'ALL') base = base.filter((v) => v.status   === statusFilter)
    if (search) {
      const q = search.toLowerCase()
      base = base.filter((v) =>
        v.registration.toLowerCase().includes(q) ||
        v.brand.toLowerCase().includes(q)        ||
        v.model.toLowerCase().includes(q)
      )
    }
    return categories.reduce<Record<string, number>>((acc, cat) => {
      acc[cat.id] = base.filter((v) => v.category === cat.id).length
      return acc
    }, {})
  }, [vehicles, categories, agencyFilter, statusFilter, search, filterByAgency])

  const filteredVehicles = useMemo(() => {
    let filtered = filterByAgency(vehicles)
    if (agencyFilter)                filtered = filtered.filter((v) => v.agencyId === agencyFilter)
    if (statusFilter !== 'ALL')      filtered = filtered.filter((v) => v.status   === statusFilter)
    if (selectedCategories.size > 0) filtered = filtered.filter((v) => selectedCategories.has(v.category))
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter((v) =>
        v.registration.toLowerCase().includes(q) ||
        v.brand.toLowerCase().includes(q)        ||
        v.model.toLowerCase().includes(q)
      )
    }
    return filtered
  }, [vehicles, agencyFilter, statusFilter, selectedCategories, search, filterByAgency])

  // ── Handlers bouton principal ──────────────────────────────────
  const handleAddVehicleClick = () => { setSelectedVehicle(null); setFormPrefill(undefined); setShowAddModal(true) }
  const handleChooseAuto      = () => { setShowAddModal(false); setShowScanner(true) }
  const handleChooseManual    = () => { setShowAddModal(false); setFormPrefill(undefined); setIsFormModalOpen(true) }
  const handleScannerBack     = () => { setShowScanner(false); setShowAddModal(true) }
  const handleScannerConfirm  = (prefill: Partial<Vehicle>) => {
    setShowScanner(false); setFormPrefill(prefill); setSelectedVehicle(null); setIsFormModalOpen(true)
  }

  // ── Handlers tableau ───────────────────────────────────────────
  const handleEditVehicleClick   = (vehicle: Vehicle) => { setSelectedVehicle(vehicle); setFormPrefill(undefined); setIsFormModalOpen(true) }
  const handleChangeStatusClick  = (vehicle: Vehicle) => { setSelectedVehicle(vehicle); setIsStatusModalOpen(true) }
  const handleDeleteVehicleClick = (vehicle: Vehicle) => { setSelectedVehicle(vehicle); setIsConfirmModalOpen(true) }

  const handleConfirmDelete = () => {
    if (selectedVehicle) {
      deleteVehicle(selectedVehicle.id)
      toast.success('Véhicule retiré du parc')
      setIsConfirmModalOpen(false)
      setSelectedVehicle(null)
    }
  }

  const actionColumns = [
    {
      id: 'actions',
      header: 'Actions',
      cell: (vehicle: Vehicle) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleEditVehicleClick(vehicle)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-lg transition-colors"
          >
            <Edit className="w-3.5 h-3.5" /> Modifier
          </button>
          <button
            onClick={() => handleChangeStatusClick(vehicle)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
          >
            <Truck className="w-3.5 h-3.5" /> Statut
          </button>
          <button
            onClick={() => handleDeleteVehicleClick(vehicle)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Supprimer
          </button>
        </div>
      ),
    },
  ]

  const totalVehicles   = vehicles.length
  const activeVehicles  = vehicles.filter((v) => v.status === 'ACTIVE').length
  const maintVehicles   = vehicles.filter((v) => v.status === 'MAINTENANCE').length

  return (
    <>
      {/* ── Header gradient ── */}
      <div className="bg-gradient-to-r from-violet-950 to-violet-800 rounded-2xl px-6 py-5 mb-6 shadow-lg">
        <div className="flex items-center justify-between gap-4 flex-wrap">

          {/* Titre + stats */}
          <div className="flex items-center gap-5 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Car className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Véhicules</h1>
                <p className="text-violet-300 text-xs mt-0.5">Gestion du parc automobile</p>
              </div>
            </div>

            {/* Compteurs rapides */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20">
                <span className="w-2 h-2 rounded-full bg-white" />
                <span className="text-xs font-bold text-white">{totalVehicles}</span>
                <span className="text-[10px] text-violet-300">total</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/20 border border-green-400/30">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-xs font-bold text-green-300">{activeVehicles}</span>
                <span className="text-[10px] text-green-400">actifs</span>
              </div>
              {maintVehicles > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/30">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-xs font-bold text-amber-300">{maintVehicles}</span>
                  <span className="text-[10px] text-amber-400">en maint.</span>
                </div>
              )}

              {/* Compteurs par catégorie (hors système) */}
              {categories
                .filter((cat) => !cat.isSystem && (globalCounts[cat.id] ?? 0) > 0)
                .map((cat) => {
                  const count = globalCounts[cat.id] ?? 0
                  const pct   = totalVehicles > 0 ? Math.round((count / totalVehicles) * 100) : 0
                  return (
                    <div key={cat.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20">
                      <span className="w-2 h-2 rounded-full bg-white/70" />
                      <span className="text-xs font-semibold text-white/90">{cat.label}</span>
                      <span className="text-xs font-bold text-white">{count}</span>
                      <span className="text-[10px] text-violet-300">{pct}%</span>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Bouton ajouter */}
          <button
            onClick={handleAddVehicleClick}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-violet-700 text-sm font-semibold rounded-xl hover:bg-violet-50 transition-colors shadow-sm flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            Ajouter un véhicule
          </button>
        </div>
      </div>

      {/* ── Filtres ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 mb-4 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1 h-4 rounded-full bg-violet-600" />
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Filtres</span>
        </div>

        <CategoryFilterBar
          selected={selectedCategories}
          counts={categoryCounts}
          onChange={setSelectedCategories}
        />

        <VehicleFilters
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          agencyFilter={agencyFilter}
          onAgencyChange={setAgencyFilter}
          vehicleCount={filteredVehicles.length}
          visibleAgencyIds={visibleAgencyIds}
        />
      </div>

      {/* ── Tableau ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full bg-violet-600" />
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Liste des véhicules</span>
          </div>
          <span className="text-xs text-gray-400 font-medium">
            {filteredVehicles.length} véhicule{filteredVehicles.length !== 1 ? 's' : ''}
          </span>
        </div>
        <VehicleTable vehicles={filteredVehicles} actionColumns={actionColumns} />
      </div>

      {/* ── Modales ── */}
      <VehicleAddModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAuto={handleChooseAuto}
        onManual={handleChooseManual}
      />
      <VehiclePlateScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onBack={handleScannerBack}
        onConfirm={handleScannerConfirm}
      />
      {isFormModalOpen && (
        <VehicleForm
          isOpen={isFormModalOpen}
          onClose={() => { setIsFormModalOpen(false); setFormPrefill(undefined) }}
          vehicle={selectedVehicle ?? formPrefill as Vehicle | undefined}
        />
      )}
      {isStatusModalOpen && selectedVehicle && (
        <VehicleStatusModal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          vehicle={selectedVehicle}
        />
      )}
      {isConfirmModalOpen && selectedVehicle && (
        <ConfirmModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Supprimer le véhicule"
          message={`Êtes-vous sûr de vouloir supprimer le véhicule ${selectedVehicle.registration} ? Cette action est irréversible.`}
          confirmLabel="Supprimer"
          variant="DANGER"
        />
      )}
    </>
  )
}
