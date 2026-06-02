import { create } from 'zustand'
import type { Agency } from '@/types'
import { agencyService } from '@/lib/services'
import { useAuthStore } from '@/store/useAuthStore'

interface AppState {
  agencies: Agency[]
  isLoadingAgencies: boolean
  sidebarCollapsed: boolean
  selectedAgencyId: string | null
  fetchAgencies: () => Promise<void>
  setSidebarCollapsed: (v: boolean) => void
  setSelectedAgencyId: (id: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  agencies: [],
  isLoadingAgencies: false,
  sidebarCollapsed: false,
  selectedAgencyId: null,

  fetchAgencies: async () => {
    set({ isLoadingAgencies: true })
    try {
      const all = await agencyService.list()
      const currentUser = useAuthStore.getState().currentUser
      const isAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'super-admin' || currentUser?.role === 'ADMIN' || currentUser?.role === 'admin'
      const visibleIds = useAuthStore.getState().getVisibleAgencyIds()
      const agencies = isAdmin || visibleIds.length === 0
        ? all
        : all.filter((a) => visibleIds.includes(a.id))
      set({ agencies, isLoadingAgencies: false })
    } catch {
      set({ isLoadingAgencies: false })
    }
  },

  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  setSelectedAgencyId: (id) => set({ selectedAgencyId: id }),
}))
