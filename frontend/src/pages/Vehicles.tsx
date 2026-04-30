import { useState, useMemo, useEffect } from 'react'
import { Plus, Edit, Truck, Trash2 } from 'lucide-react'
import { useVehicleStore } from '@/store/vehicleStore'
import VehicleTable from '@/components/vehicles/VehicleTable'
import VehicleFilters from '@/components/vehicles/VehicleFilters'
import Button from '@/components/ui/Button'
import VehicleForm from '@/components/vehicles/VehicleForm'
import VehicleStatusModal from '@/components/vehicles/VehicleStatusModal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import type { Vehicle, VehicleStatus, VehicleCategory } from '@/types'
import { useToast } from '@/hooks/useToast'
import { useAgencyFilter } from '@/hooks/useAgencyFilter'

export default function Vehicles() {
  const { vehicles, deleteVehicle, fetchVehicles } = useVehicleStore()

  useEffect(() => { fetchVehicles() }, [])
  const toast = useToast()
  const { filterByAgency, visibleAgencyIds } = useAgencyFilter()

  // Modal / selection state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)

  // Individual filter state variables (replaces the old `filters` object)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'ALL'>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<VehicleCategory | 'ALL'>('ALL')
  const [agencyFilter, setAgencyFilter] = useState('')

  // Derived / memoised list of vehicles applying all active filters
  const filteredVehicles = useMemo(() => {
    // Apply agency visibility filter first
    let filtered = filterByAgency(vehicles)

    // Agency filter — only apply when a specific agency is selected
    if (agencyFilter !== '') {
      filtered = filtered.filter((v) => v.agencyId === agencyFilter)
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((v) => v.status === statusFilter)
    }

    // Category filter
    if (categoryFilter !== 'ALL') {
      filtered = filtered.filter((v) => v.category === categoryFilter)
    }

    // Full-text search across registration, brand and model (case-insensitive)
    if (search) {
      const lowerSearch = search.toLowerCase()
      filtered = filtered.filter(
        (v) =>
          v.registration.toLowerCase().includes(lowerSearch) ||
          v.brand.toLowerCase().includes(lowerSearch) ||
          v.model.toLowerCase().includes(lowerSearch)
      )
    }

    return filtered
  }, [vehicles, agencyFilter, statusFilter, categoryFilter, search, filterByAgency])

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleAddVehicleClick = () => {
    setSelectedVehicle(null)
    setIsFormModalOpen(true)
  }

  const handleEditVehicleClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setIsFormModalOpen(true)
  }

  const handleChangeStatusClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setIsStatusModalOpen(true)
  }

  const handleDeleteVehicleClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle)
    setIsConfirmModalOpen(true)
  }

  const handleConfirmDelete = () => {
    if (selectedVehicle) {
      deleteVehicle(selectedVehicle.id)
     toast.success('Vehicule retire du parc')
      setIsConfirmModalOpen(false)
      setSelectedVehicle(null)
    }
  }

  // ── Action columns injected into VehicleTable ────────────────────────────────

  const actionColumns = [
    {
      id: 'actions',
      header: 'Actions',
      cell: (vehicle: Vehicle) => (
        <div className="flex items-center space-x-2">
          <Button
            variant="OUTLINE"
            size="sm"
            onClick={() => handleEditVehicleClick(vehicle)}
            leftIcon={<Edit className="h-4 w-4" />}
          >
            Modifier
          </Button>
          <Button
            variant="GHOST"
            size="sm"
            onClick={() => handleChangeStatusClick(vehicle)}
            leftIcon={<Truck className="h-4 w-4" />}
          >
            Statut
          </Button>
          <Button
            variant="GHOST"
            size="sm"
            onClick={() => handleDeleteVehicleClick(vehicle)}
            leftIcon={<Trash2 className="h-4 w-4 text-" />}
          >
            Supprimer
          </Button>
        </div>
      ),
    },
  ]

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Vehicules</h1>
        <Button
          onClick={handleAddVehicleClick}
          leftIcon={<Plus className="h-5 w-5" />}
        >
          Ajouter un vehicule
        </Button>
      </div>

      {/* Filter bar — each filter is now an individual controlled prop */}
      <VehicleFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        agencyFilter={agencyFilter}
        onAgencyChange={setAgencyFilter}
        vehicleCount={filteredVehicles.length}
        visibleAgencyIds={visibleAgencyIds}
      />

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <VehicleTable vehicles={filteredVehicles} actionColumns={actionColumns} />
      </div>

      {/* Add / edit form modal */}
      {isFormModalOpen && (
        <VehicleForm
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          vehicle={selectedVehicle || undefined}
        />
      )}

      {/* Status change modal */}
      {isStatusModalOpen && selectedVehicle && (
        <VehicleStatusModal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          vehicle={selectedVehicle}
        />
      )}

      {/* Delete confirmation modal */}
      {isConfirmModalOpen && selectedVehicle && (
        <ConfirmModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Supprimer le vehicule"
          message={`Etes-vous sur de vouloir supprimer le vehicule ${selectedVehicle.registration} ? Cette action est irreversible.`}
          confirmLabel="Supprimer"
          variant="DANGER"
        />
      )}
    </>
  )
}
