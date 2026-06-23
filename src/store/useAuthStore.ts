import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '@/lib/api'
import type { ApiResponse } from '@/lib/api'
import type { AppModule, PermissionAction, AppSettings } from '@/types/settings'
import { DEFAULT_SETTINGS } from '@/data/mockSettings'

interface AuthUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  roleId?: string
  agencyIds: string[]
  permissions: { module: string; action: string }[]
}

interface AuthState {
  currentUser: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  hasHydrated: boolean
  sessionExpiresAt: number | null
  settings: AppSettings
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>
  logout: () => void
  checkSession: () => void
  updateSettings: (partial: Partial<AppSettings>) => void
  hasPermission: (module: AppModule, action: PermissionAction) => boolean
  canAccess: (module: AppModule) => boolean
  getVisibleAgencyIds: () => string[]
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      accessToken: null,
      hasHydrated: false,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      sessionExpiresAt: null,
      settings: DEFAULT_SETTINGS,

      login: async (email, password, rememberMe) => {
        set({ isLoading: true, error: null })

        // Mode développement : Bypass de l'appel API et acceptation de n'importe quel identifiant
        if (import.meta.env.DEV || import.meta.env.VITE_DEV_MODE === 'true') {
          // Simuler un léger délai réseau pour une meilleure UX (transition fluide)
          await new Promise((resolve) => setTimeout(resolve, 600))

          const mockDevUser: AuthUser = {
            id: 'dev-user-id',
            firstName: 'Thomas',
            lastName: 'Martin (Dev)',
            email: email || 'thomas.martin@vyv-fleet.fr',
            role: 'SUPER_ADMIN',
            roleId: 'SUPER_ADMIN',
            agencyIds: ['ag1', 'ag2', 'ag3', 'ag4', 'ag5'],
            permissions: [
              { module: 'dashboard', action: 'view' },
              { module: 'vehicles', action: 'view' },
              { module: 'vehicles', action: 'create' },
              { module: 'vehicles', action: 'edit' },
              { module: 'vehicles', action: 'delete' },
              { module: 'drivers', action: 'view' },
              { module: 'drivers', action: 'create' },
              { module: 'drivers', action: 'edit' },
              { module: 'drivers', action: 'delete' },
              { module: 'maintenance', action: 'view' },
              { module: 'maintenance', action: 'create' },
              { module: 'maintenance', action: 'edit' },
              { module: 'compliance', action: 'view' },
              { module: 'fuel', action: 'view' },
              { module: 'incidents', action: 'view' },
              { module: 'settings', action: 'view' },
              { module: 'settings', action: 'edit' },
            ]
          }

          const hours = rememberMe ? 24 : get().settings.sessionDurationHours
          set({
            currentUser: mockDevUser,
            accessToken: 'mock-dev-access-token',
            refreshToken: 'mock-dev-refresh-token',
            isAuthenticated: true,
            isLoading: false,
            error: null,
            hasHydrated: true,
            sessionExpiresAt: Date.now() + hours * 3600000,
          })
          return
        }

        try {
          const { data } = await authApi.post<ApiResponse<{
            accessToken: string
            refreshToken: string
            user: AuthUser
          }>>('/auth/login', { email, password })
          const { accessToken, refreshToken, user } = data.data
          const hours = rememberMe ? 24 : get().settings.sessionDurationHours
          set({
            currentUser: { ...user, roleId: user.role, permissions: user.permissions ?? [] },
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            hasHydrated: true,
            sessionExpiresAt: Date.now() + hours * 3600000,
          })
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Email ou mot de passe incorrect.'
          set({ isLoading: false, error: message })
        }
      },

      logout: () => {
        set({
          currentUser: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
          sessionExpiresAt: null,
        })
      },

      checkSession: () => {
        const { sessionExpiresAt, logout } = get()
        if (sessionExpiresAt && Date.now() > sessionExpiresAt) logout()
      },

      updateSettings: (partial) => {
        const next = { ...get().settings, ...partial }
        const updates: Partial<AuthState> = { settings: next }
        if (partial.sessionDurationHours && get().sessionExpiresAt) {
          updates.sessionExpiresAt = Date.now() + partial.sessionDurationHours * 3600000
        }
        set(updates)
      },

      hasPermission: (_module: AppModule, _action: PermissionAction) => {
        const { currentUser } = get()
        if (!currentUser) return false
        if (currentUser.role === 'SUPER_ADMIN') return true
        return (currentUser.permissions ?? []).some(
          (p) => p.module === _module && p.action === _action
        )
      },

      canAccess: (module) => get().hasPermission(module, 'view'),

      getVisibleAgencyIds: () => {
        const { currentUser } = get()
        if (!currentUser) return []
        return currentUser.agencyIds ?? []
      },
    }),
    {
      name: 'vyv-fleet-auth',
      onRehydrateStorage: () => () => { useAuthStore.setState({ hasHydrated: true }) },
      partialize: (state) => ({
        currentUser: state.currentUser,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        sessionExpiresAt: state.sessionExpiresAt,
        settings: state.settings,
      }),
    }
  )
)
