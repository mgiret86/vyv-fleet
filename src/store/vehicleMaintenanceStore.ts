import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  VehicleMaintenanceAssignment,
  AssignmentStatus,
  MaintenanceTemplate,
} from '@/types'

// ── Helpers ────────────────────────────────────────────────────────
function generateId(): string {
  return `assign-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function now(): string {
  return new Date().toISOString()
}

/**
 * Calcule nextDueDate et nextDueMileage depuis les données
 * de la dernière intervention et du template.
 */
export function computeNextDue(
  template:       MaintenanceTemplate,
  lastDoneDate:   string | null,
  lastDoneMileage: number | null,
): { nextDueDate: string | null; nextDueMileage: number | null } {
  let nextDueDate:    string | null = null
  let nextDueMileage: number | null = null

  if (template.triggerDays && lastDoneDate) {
    const base = new Date(lastDoneDate)
    base.setDate(base.getDate() + template.triggerDays)
    nextDueDate = base.toISOString()
  }

  if (template.triggerKm && lastDoneMileage != null) {
    nextDueMileage = lastDoneMileage + template.triggerKm
  }

  return { nextDueDate, nextDueMileage }
}

/**
 * Détermine le statut d'une affectation en fonction
 * de la date et du kilométrage actuels.
 */
export function computeAssignmentStatus(
  assignment:      VehicleMaintenanceAssignment,
  currentMileage:  number,
  warningDays:     number = 30,
  warningKm:       number = 2000,
): AssignmentStatus {
  const { nextDueDate, nextDueMileage } = assignment

  if (!nextDueDate && !nextDueMileage) return 'UNKNOWN'

  const today = new Date()

  // Vérification dépassement
  const dateOverdue = nextDueDate
    ? new Date(nextDueDate) < today
    : false
  const kmOverdue = nextDueMileage != null
    ? currentMileage >= nextDueMileage
    : false

  if (dateOverdue || kmOverdue) return 'OVERDUE'

  // Vérification approche
  const dateSoon = nextDueDate
    ? (new Date(nextDueDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24) <= warningDays
    : false
  const kmSoon = nextDueMileage != null
    ? nextDueMileage - currentMileage <= warningKm
    : false

  if (dateSoon || kmSoon) return 'SOON'

  return 'OK'
}

// ── Types du store ─────────────────────────────────────────────────
interface VehicleMaintenanceState {
  assignments: VehicleMaintenanceAssignment[]

  // Lecture
  getByVehicle:  (vehicleId: string)  => VehicleMaintenanceAssignment[]
  getByTemplate: (templateId: string) => VehicleMaintenanceAssignment[]
  getAssignment: (id: string)         => VehicleMaintenanceAssignment | undefined

  // CRUD
  assign: (
    vehicleId:       string,
    templateId:      string,
    template:        MaintenanceTemplate,
    lastDoneDate?:   string | null,
    lastDoneMileage?: number | null,
  ) => VehicleMaintenanceAssignment

  unassign: (assignmentId: string) => void

  // Enregistrement d'une intervention réalisée
  recordIntervention: (
    assignmentId:   string,
    doneDate:       string,
    doneMileage:    number | null,
    template:       MaintenanceTemplate,
  ) => void

  // Activation / désactivation
  toggleActive: (assignmentId: string) => void
}

// ── Store ──────────────────────────────────────────────────────────
export const useVehicleMaintenanceStore = create<VehicleMaintenanceState>()(
  persist(
    (set, get) => ({
      assignments: [],

      // ── Lecture ──────────────────────────────────────────────
      getByVehicle:  (vehicleId)  =>
        get().assignments.filter((a) => a.vehicleId  === vehicleId),

      getByTemplate: (templateId) =>
        get().assignments.filter((a) => a.templateId === templateId),

      getAssignment: (id) =>
        get().assignments.find((a) => a.id === id),

      // ── Affecter un cycle à un véhicule ──────────────────────
      assign: (vehicleId, templateId, template, lastDoneDate = null, lastDoneMileage = null) => {
        const { nextDueDate, nextDueMileage } = computeNextDue(
          template, lastDoneDate, lastDoneMileage,
        )

        const assignment: VehicleMaintenanceAssignment = {
          id: generateId(),
          vehicleId,
          templateId,
          lastDoneDate,
          lastDoneMileage,
          nextDueDate,
          nextDueMileage,
          isActive:   true,
          assignedAt: now(),
          updatedAt:  now(),
        }

        set((s) => ({ assignments: [...s.assignments, assignment] }))
        return assignment
      },

      // ── Désaffecter ───────────────────────────────────────────
      unassign: (assignmentId) =>
        set((s) => ({
          assignments: s.assignments.filter((a) => a.id !== assignmentId),
        })),

      // ── Enregistrer une intervention réalisée ─────────────────
      recordIntervention: (assignmentId, doneDate, doneMileage, template) => {
        const { nextDueDate, nextDueMileage } = computeNextDue(
          template, doneDate, doneMileage,
        )
        set((s) => ({
          assignments: s.assignments.map((a) =>
            a.id !== assignmentId ? a : {
              ...a,
              lastDoneDate:    doneDate,
              lastDoneMileage: doneMileage,
              nextDueDate,
              nextDueMileage,
              updatedAt: now(),
            }
          ),
        }))
      },

      // ── Activer / désactiver ──────────────────────────────────
      toggleActive: (assignmentId) =>
        set((s) => ({
          assignments: s.assignments.map((a) =>
            a.id !== assignmentId ? a : {
              ...a,
              isActive:  !a.isActive,
              updatedAt: now(),
            }
          ),
        })),
    }),
    {
      name:    'vyv-vehicle-maintenance-assignments',
      version: 1,
    }
  )
)
