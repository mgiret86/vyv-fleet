import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  MaintenanceTemplate,
  MaintenanceChecklistItem,
  MaintenanceType,
  MaintenanceTriggerType,
} from '@/types'

/**
 * applicableCategories contient désormais des ids dynamiques (string)
 * issus de vehicleCategoryStore, et non plus des valeurs VehicleCategory fixes.
 *
 * Les templates mock utilisent [] (toutes catégories) car les ids réels
 * ne sont connus qu'à l'exécution. Renseignez-les depuis Paramètres > Modèles.
 */

// ── Mock data ──────────────────────────────────────────────────────
const MOCK_TEMPLATES: MaintenanceTemplate[] = [
  {
    id:          'tpl-001',
    name:        'Vidange + filtres',
    description: 'Vidange huile moteur et remplacement des filtres (huile, habitacle, air)',
    type:        'PREVENTIVE',
    triggerType: 'HYBRID',
    triggerKm:   25000,
    triggerDays: 730,
    estimatedCost: 180,
    applicableCategories: [],   // [] = applicable à toutes les catégories
    isMandatory: false,
    createdAt:   '2024-01-01T00:00:00.000Z',
    updatedAt:   '2024-01-01T00:00:00.000Z',
    checklist: [
      { id: 'c1-1', label: 'Vidange huile moteur',          order: 1 },
      { id: 'c1-2', label: 'Remplacement filtre à huile',   order: 2 },
      { id: 'c1-3', label: 'Remplacement filtre habitacle', order: 3 },
      { id: 'c1-4', label: 'Remplacement filtre à air',     order: 4 },
      { id: 'c1-5', label: 'Contrôle niveau liquides',      order: 5 },
      { id: 'c1-6', label: "Rapport d'intervention signé",  order: 6 },
    ],
  },
  {
    id:          'tpl-002',
    name:        'Contrôle technique',
    description: 'Contrôle technique réglementaire obligatoire tous les 2 ans',
    type:        'REGULATORY',
    triggerType: 'TIME_ONLY',
    triggerKm:   null,
    triggerDays: 730,
    estimatedCost: 80,
    applicableCategories: [],
    isMandatory: true,
    createdAt:   '2024-01-01T00:00:00.000Z',
    updatedAt:   '2024-01-01T00:00:00.000Z',
    checklist: [
      { id: 'c2-1', label: 'Prise de rendez-vous centre agréé', order: 1 },
      { id: 'c2-2', label: 'Présentation du véhicule',          order: 2 },
      { id: 'c2-3', label: 'Récupération du procès-verbal',     order: 3 },
      { id: 'c2-4', label: 'Mise à jour fiche véhicule',        order: 4 },
    ],
  },
  {
    id:          'tpl-003',
    name:        'Révision complète',
    description: 'Révision générale incluant freins, pneumatiques, éclairage et équipements de sécurité',
    type:        'PREVENTIVE',
    triggerType: 'HYBRID',
    triggerKm:   50000,
    triggerDays: 365,
    estimatedCost: 450,
    // À renseigner avec les ids des catégories ambulance créées dans Paramètres
    applicableCategories: [],
    isMandatory: false,
    createdAt:   '2024-01-01T00:00:00.000Z',
    updatedAt:   '2024-01-01T00:00:00.000Z',
    checklist: [
      { id: 'c3-1', label: 'Contrôle et remplacement plaquettes freins', order: 1 },
      { id: 'c3-2', label: 'Contrôle disques de frein',                  order: 2 },
      { id: 'c3-3', label: 'Contrôle usure pneumatiques',                order: 3 },
      { id: 'c3-4', label: 'Contrôle éclairage complet',                 order: 4 },
      { id: 'c3-5', label: "Contrôle équipements d'urgence",             order: 5 },
      { id: 'c3-6', label: 'Contrôle climatisation',                     order: 6 },
      { id: 'c3-7', label: 'Contrôle batterie',                          order: 7 },
      { id: 'c3-8', label: "Rapport d'intervention signé",               order: 8 },
    ],
  },
  {
    id:          'tpl-004',
    name:        'Désinfection sanitaire',
    description: 'Désinfection complète cellule sanitaire selon protocole ARS',
    type:        'SANITAIRE',
    triggerType: 'TIME_ONLY',
    triggerKm:   null,
    triggerDays: 90,
    estimatedCost: 120,
    applicableCategories: [],
    isMandatory: true,
    createdAt:   '2024-01-01T00:00:00.000Z',
    updatedAt:   '2024-01-01T00:00:00.000Z',
    checklist: [
      { id: 'c4-1', label: 'Nettoyage sol et parois cellule',     order: 1 },
      { id: 'c4-2', label: 'Désinfection équipements médicaux',   order: 2 },
      { id: 'c4-3', label: 'Désinfection brancard et fixations',  order: 3 },
      { id: 'c4-4', label: 'Traitement air (spray désinfectant)', order: 4 },
      { id: 'c4-5', label: 'Contrôle stock consommables',         order: 5 },
      { id: 'c4-6', label: 'Signature fiche de traçabilité',      order: 6 },
    ],
  },
  {
    id:          'tpl-005',
    name:        'Renouvellement agrément ARS',
    description: "Préparation et dépôt du dossier de renouvellement d'agrément ARS",
    type:        'REGULATORY',
    triggerType: 'TIME_ONLY',
    triggerKm:   null,
    triggerDays: 365,
    estimatedCost: null,
    applicableCategories: [],
    isMandatory: true,
    createdAt:   '2024-01-01T00:00:00.000Z',
    updatedAt:   '2024-01-01T00:00:00.000Z',
    checklist: [
      { id: 'c5-1', label: 'Vérification conformité équipements', order: 1 },
      { id: 'c5-2', label: 'Rassemblement pièces dossier',        order: 2 },
      { id: 'c5-3', label: 'Dépôt dossier ARS',                   order: 3 },
      { id: 'c5-4', label: 'Suivi instruction dossier',           order: 4 },
      { id: 'c5-5', label: 'Réception et archivage agrément',     order: 5 },
    ],
  },
]

// ── Helpers ────────────────────────────────────────────────────────
function generateId(): string {
  return `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function generateItemId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function now(): string {
  return new Date().toISOString()
}

// ── Types du store ─────────────────────────────────────────────────
export interface TemplateFormData {
  name:                 string
  description:          string
  type:                 MaintenanceType
  triggerType:          MaintenanceTriggerType
  triggerKm:            number | null
  triggerDays:          number | null
  estimatedCost:        number | null
  applicableCategories: string[]   // ids dynamiques de VehicleCategory
  isMandatory:          boolean
  checklist:            Omit<MaintenanceChecklistItem, 'id'>[]
}

interface MaintenanceTemplateState {
  templates: MaintenanceTemplate[]

  addTemplate:    (data: TemplateFormData) => MaintenanceTemplate
  updateTemplate: (id: string, data: TemplateFormData) => void
  deleteTemplate: (id: string) => void
  getTemplate:    (id: string) => MaintenanceTemplate | undefined

  addChecklistItem:    (templateId: string, label: string) => void
  removeChecklistItem: (templateId: string, itemId: string) => void
  reorderChecklist:    (templateId: string, items: MaintenanceChecklistItem[]) => void
}

// ── Store ──────────────────────────────────────────────────────────
export const useMaintenanceTemplateStore = create<MaintenanceTemplateState>()(
  persist(
    (set, get) => ({
      templates: MOCK_TEMPLATES,

      addTemplate: (data) => {
        const template: MaintenanceTemplate = {
          ...data,
          id:        generateId(),
          createdAt: now(),
          updatedAt: now(),
          checklist: data.checklist.map((item, idx) => ({
            ...item,
            id:    generateItemId(),
            order: idx + 1,
          })),
        }
        set((s) => ({ templates: [...s.templates, template] }))
        return template
      },

      updateTemplate: (id, data) =>
        set((s) => ({
          templates: s.templates.map((t) =>
            t.id !== id ? t : {
              ...t,
              ...data,
              id,
              updatedAt: now(),
              checklist: data.checklist.map((item, idx) => ({
                ...item,
                id:    generateItemId(),
                order: idx + 1,
              })),
            }
          ),
        })),

      deleteTemplate: (id) =>
        set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),

      getTemplate: (id) => get().templates.find((t) => t.id === id),

      addChecklistItem: (templateId, label) =>
        set((s) => ({
          templates: s.templates.map((t) => {
            if (t.id !== templateId) return t
            const newItem: MaintenanceChecklistItem = {
              id:    generateItemId(),
              label,
              order: t.checklist.length + 1,
            }
            return { ...t, updatedAt: now(), checklist: [...t.checklist, newItem] }
          }),
        })),

      removeChecklistItem: (templateId, itemId) =>
        set((s) => ({
          templates: s.templates.map((t) => {
            if (t.id !== templateId) return t
            const checklist = t.checklist
              .filter((i) => i.id !== itemId)
              .map((i, idx) => ({ ...i, order: idx + 1 }))
            return { ...t, updatedAt: now(), checklist }
          }),
        })),

      reorderChecklist: (templateId, items) =>
        set((s) => ({
          templates: s.templates.map((t) =>
            t.id !== templateId ? t : { ...t, updatedAt: now(), checklist: items }
          ),
        })),
    }),
    {
      name:    'vyv-maintenance-templates',
      version: 1,
    }
  )
)

export default MOCK_TEMPLATES;
