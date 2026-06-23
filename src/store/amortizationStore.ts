import { create }  from 'zustand'
import { persist } from 'zustand/middleware'
import type { Amortization, AmortizationFormData } from '@/types'
import { MOCK_AMORTIZATIONS, buildAmortizationEntries } from '@/data/mockAmortizations'

const USE_MOCK = true

function now(): string { return new Date().toISOString() }
function generateId(): string {
  return `amort-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}
function fakeFetch<T>(data: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(data)), 150))
}

// ─── Interface du store ───────────────────────────────────────────
interface AmortizationState {
  amortizations: Amortization[]
  isLoading:     boolean
  error:         string | null

  fetchAmortizations:      ()                                          => Promise<void>
  getByVehicle:            (vehicleId: string)                        => Amortization[]
  getActiveByVehicle:      (vehicleId: string)                        => Amortization[]
  addAmortization:         (data: AmortizationFormData)               => Promise<Amortization>
  updateAmortization:      (id: string, data: Partial<AmortizationFormData>) => Promise<void>
  closeAmortization:       (id: string, closedAt?: string)            => Promise<void>
  closeByVehicle:          (vehicleId: string, closedAt?: string)     => Promise<void>

  // Calculs TCO
  getMonthlyDotation:      (vehicleId: string, month?: string)        => number
  getTotalDotationToDate:  (vehicleId: string)                        => number
  getVNC:                  (vehicleId: string)                        => number

  // Vérification déclenchement auto crédit-bail
  triggerCreditBailAmortization: (
    vehicleId:      string,
    contractId:     string,
    residualValue:  number,
    contractEndDate: string,
  ) => Promise<Amortization | null>
}

export const useAmortizationStore = create<AmortizationState>()(
  persist(
    (set, get) => ({
      amortizations: [],
      isLoading:     false,
      error:         null,

      // ─── Fetch ──────────────────────────────────────────────────
      fetchAmortizations: async () => {
        const existing = get().amortizations
        if (USE_MOCK && existing.length > 0) return

        set({ isLoading: true, error: null })
        try {
          const data = await fakeFetch(MOCK_AMORTIZATIONS)
          set({ amortizations: data, isLoading: false })
        } catch (err: unknown) {
          set({ error: err instanceof Error ? err.message : 'Erreur', isLoading: false })
        }
      },

      // ─── Getters ────────────────────────────────────────────────
      getByVehicle: (vehicleId) =>
        get().amortizations
          .filter((a) => a.vehicleId === vehicleId)
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),

      getActiveByVehicle: (vehicleId) =>
        get().amortizations.filter(
          (a) => a.vehicleId === vehicleId && a.status === 'ACTIVE'
        ),

      // ─── Création ───────────────────────────────────────────────
      addAmortization: async (data) => {
        const entries = buildAmortizationEntries(data.startDate, data.amount, data.durationMonths)
        const amort: Amortization = {
          id:             generateId(),
          vehicleId:      data.vehicleId,
          source:         data.source,
          sourceId:       data.sourceId,
          reference:      data.reference,
          label:          data.label,
          amount:         data.amount,
          startDate:      data.startDate,
          durationMonths: data.durationMonths,
          status:         'ACTIVE',
          closedAt:       null,
          entries,
          createdAt:      now(),
          updatedAt:      now(),
        }
        if (USE_MOCK) console.info('[MOCK] addAmortization', amort)
        set((s) => ({ amortizations: [...s.amortizations, amort] }))
        return amort
      },

      // ─── Mise à jour ─────────────────────────────────────────────
      updateAmortization: async (id, data) => {
        set((s) => ({
          amortizations: s.amortizations.map((a) => {
            if (a.id !== id) return a
            const updated = { ...a, ...data, updatedAt: now() }
            // Recalcul des entrées si montant ou durée changés
            if (data.amount !== undefined || data.durationMonths !== undefined) {
              updated.entries = buildAmortizationEntries(
                updated.startDate,
                updated.amount,
                updated.durationMonths,
              )
            }
            return updated
          }),
        }))
      },

      // ─── Clôture individuelle ────────────────────────────────────
      closeAmortization: async (id, closedAt) => {
        const closeDate = closedAt ?? now()
        set((s) => ({
          amortizations: s.amortizations.map((a) =>
            a.id !== id
              ? a
              : { ...a, status: 'CLOSED', closedAt: closeDate, updatedAt: now() }
          ),
        }))
      },

      // ─── Clôture de tous les amortissements d'un véhicule (cession) ──
      closeByVehicle: async (vehicleId, closedAt) => {
        const closeDate = closedAt ?? now()
        set((s) => ({
          amortizations: s.amortizations.map((a) =>
            a.vehicleId !== vehicleId || a.status === 'CLOSED'
              ? a
              : { ...a, status: 'CLOSED', closedAt: closeDate, updatedAt: now() }
          ),
        }))
      },

      // ─── TCO : dotation mensuelle (mois courant par défaut) ──────
      getMonthlyDotation: (vehicleId, month) => {
        const targetMonth = month ?? (() => {
          const d = new Date()
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        })()

        return get()
          .amortizations
          .filter((a) => a.vehicleId === vehicleId && a.status === 'ACTIVE')
          .reduce((sum, a) => {
            const entry = a.entries.find((e) => e.month === targetMonth)
            return sum + (entry?.dotation ?? 0)
          }, 0)
      },

      // ─── TCO : cumul total des dotations passées à date ──────────
      getTotalDotationToDate: (vehicleId) => {
        const today = new Date()
        const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

        return get()
          .amortizations
          .filter((a) => a.vehicleId === vehicleId)
          .reduce((sum, a) => {
            const passedEntries = a.entries.filter((e) => e.month <= currentMonth)
            return sum + passedEntries.reduce((s, e) => s + e.dotation, 0)
          }, 0)
      },

      // ─── VNC : montant restant à amortir sur tous les amortissements actifs ──
      getVNC: (vehicleId) => {
        const today = new Date()
        const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

        return get()
          .amortizations
          .filter((a) => a.vehicleId === vehicleId && a.status === 'ACTIVE')
          .reduce((sum, a) => {
            const lastPassedEntry = [...a.entries]
              .filter((e) => e.month <= currentMonth)
              .pop()
            return sum + (lastPassedEntry?.remaining ?? a.amount)
          }, 0)
      },

      // ─── Déclenchement auto crédit-bail ──────────────────────────
      // À appeler quand contractEndDate est dépassée et qu'aucun amortissement
      // CREDIT_BAIL n'existe déjà pour ce contrat
      triggerCreditBailAmortization: async (vehicleId, contractId, residualValue, contractEndDate) => {
        const existing = get().amortizations.find(
          (a) => a.source === 'CREDIT_BAIL' && a.sourceId === contractId
        )
        if (existing) return null // Déjà créé, pas de doublon

        const startDate = (() => {
          const d = new Date(contractEndDate)
          d.setDate(d.getDate() + 1) // J+1
          return d.toISOString().split('T')[0]
        })()

        const data: AmortizationFormData = {
          vehicleId,
          source:         'CREDIT_BAIL',
          sourceId:       contractId,
          reference:      `AMORT-CB-${contractId.slice(-6).toUpperCase()}`,
          label:          'Valeur résiduelle — Crédit-bail',
          amount:         residualValue,
          startDate,
          durationMonths: 12, // Valeur par défaut, ajustable manuellement
        }

        return get().addAmortization(data)
      },
    }),
    { name: 'vyv-amortizations', version: 1 }
  )
)
