import { create } from 'zustand'
import type { Vehicle } from '@/types'
import { vehicleService } from '@/lib/services'

interface VehicleState {
  vehicles: Vehicle[]
  isLoading: boolean
  error: string | null
  selectedAgencyId: string | null
  fetchVehicles: () => Promise<void>
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => Promise<void>
  updateVehicle: (id: string, updates: Partial<Vehicle>) => Promise<void>
  updateVehicleStatus: (id: string, status: Vehicle['status'], reason?: string) => Promise<void>
  deleteVehicle: (id: string) => Promise<void>
  setSelectedAgencyId: (id: string | null) => void
}

export const useVehicleStore = create<VehicleState>((set) => ({
  vehicles: [],
  isLoading: false,
  error: null,
  selectedAgencyId: null,

  fetchVehicles: async () => {
    set({ isLoading: true, error: null })
    try {
      const vehicles = await vehicleService.list()
      set({ vehicles, isLoading: false })
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Erreur', isLoading: false })
    }
  },

  addVehicle: async (newVehicleData) => {
    const vehicle = await vehicleService.create(newVehicleData)
    set((s) => ({ vehicles: [...s.vehicles, vehicle] }))
  },

  updateVehicle: async (id, updates) => {
    const updated = await vehicleService.update(id, updates)
    set((s) => ({ vehicles: s.vehicles.map((v) => (v.id === id ? updated : v)) }))
  },

  updateVehicleStatus: async (id, status, reason) => {
    const updated = await vehicleService.updateStatus(id, status, reason)
    set((s) => ({ vehicles: s.vehicles.map((v) => (v.id === id ? updated : v)) }))
  },

  deleteVehicle: async (id) => {
    await vehicleService.remove(id)
    set((s) => ({ vehicles: s.vehicles.filter((v) => v.id !== id) }))
  },

  setSelectedAgencyId: (id) => set({ selectedAgencyId: id }),
}))
