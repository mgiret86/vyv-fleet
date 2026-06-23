import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── Types ──────────────────────────────────────────────────────────
export interface ApiIntegration {
  key:         string   // Clé API (masquée dans l'UI)
  enabled:     boolean  // Intégration activée ou non
  lastTestedAt: string | null  // ISO date du dernier test
  lastTestOk:   boolean | null // Résultat du dernier test
}

export interface SettingsState {
  integrations: {
    registrationApi: ApiIntegration
  }
  // Actions
  setRegistrationApiKey:    (key: string) => void
  setRegistrationApiEnabled:(enabled: boolean) => void
  setRegistrationApiTestResult: (ok: boolean) => void
  clearRegistrationApiKey:  () => void
}

// ── Store ──────────────────────────────────────────────────────────
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      integrations: {
        registrationApi: {
          key:          '',
          enabled:      false,
          lastTestedAt: null,
          lastTestOk:   null,
        },
      },

      setRegistrationApiKey: (key) =>
        set((s) => ({
          integrations: {
            ...s.integrations,
            registrationApi: { ...s.integrations.registrationApi, key, enabled: key.length > 0 },
          },
        })),

      setRegistrationApiEnabled: (enabled) =>
        set((s) => ({
          integrations: {
            ...s.integrations,
            registrationApi: { ...s.integrations.registrationApi, enabled },
          },
        })),

      setRegistrationApiTestResult: (ok) =>
        set((s) => ({
          integrations: {
            ...s.integrations,
            registrationApi: {
              ...s.integrations.registrationApi,
              lastTestedAt: new Date().toISOString(),
              lastTestOk:   ok,
            },
          },
        })),

      clearRegistrationApiKey: () =>
        set((s) => ({
          integrations: {
            ...s.integrations,
            registrationApi: {
              key:          '',
              enabled:      false,
              lastTestedAt: null,
              lastTestOk:   null,
            },
          },
        })),
    }),
    {
      name:    'vyv-settings',      // Clé localStorage
      version: 1,
    }
  )
)

// ── Sélecteurs utilitaires ─────────────────────────────────────────
export const selectRegistrationApiKey     = (s: SettingsState) => s.integrations.registrationApi.key
export const selectRegistrationApiEnabled = (s: SettingsState) => s.integrations.registrationApi.enabled
