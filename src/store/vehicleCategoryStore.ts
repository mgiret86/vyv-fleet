import { create }  from 'zustand'
import { persist } from 'zustand/middleware'
import type { VehicleCategory } from '@/types'
import { MOCK_CATEGORIES }      from '@/data/mockCategories'
import { useVehicleStore }      from '@/store/vehicleStore'

// ─── Palette de couleurs disponibles ──────────────────────────────
export const CATEGORY_COLORS = [
  { key: 'violet', label: 'Violet', bg: 'bg-violet-100', text: 'text-violet-700', dot: 'bg-violet-500' },
  { key: 'blue',   label: 'Bleu',   bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
  { key: 'green',  label: 'Vert',   bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
  { key: 'orange', label: 'Orange', bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  { key: 'red',    label: 'Rouge',  bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500'    },
  { key: 'yellow', label: 'Jaune',  bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  { key: 'pink',   label: 'Rose',   bg: 'bg-pink-100',   text: 'text-pink-700',   dot: 'bg-pink-500'   },
  { key: 'teal',   label: 'Teal',   bg: 'bg-teal-100',   text: 'text-teal-700',   dot: 'bg-teal-500'   },
  { key: 'gray',   label: 'Gris',   bg: 'bg-gray-100',   text: 'text-gray-700',   dot: 'bg-gray-400'   },
] as const

export type CategoryColorKey = typeof CATEGORY_COLORS[number]['key']

// ─── Helper : génère un code slug depuis un label ─────────────────
function toCode(label: string): string {
  return label
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // retire accents
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

// ─── Helper : récupère la config couleur ─────────────────────────
export function getCategoryColor(colorKey: string) {
  return CATEGORY_COLORS.find((c) => c.key === colorKey) ?? CATEGORY_COLORS[8] // fallback gray
}

// ─── Types store ──────────────────────────────────────────────────
export interface CategoryFormData {
  label:   string
  color:   string
  vatRate: number
  order:   number
}

interface VehicleCategoryState {
  categories:       VehicleCategory[]
  fetchCategories:  () => void
  addCategory:      (data: CategoryFormData) => void
  updateCategory:   (id: string, data: CategoryFormData) => void
  deactivateCategory: (id: string) => void   // réaffecte les véhicules → Hors liste
  getById:          (id: string) => VehicleCategory | undefined
  getActive:        () => VehicleCategory[]
}

// ─── Store ────────────────────────────────────────────────────────
export const useVehicleCategoryStore = create<VehicleCategoryState>()(
  persist(
    (set, get) => ({
      categories: MOCK_CATEGORIES,

      fetchCategories: () => {
        // Garantit que la catégorie système existe toujours
        set((s) => {
          const hasSystem = s.categories.some((c) => c.isSystem)
          if (hasSystem) return s
          return { categories: [...s.categories, ...MOCK_CATEGORIES] }
        })
      },

      addCategory: (data) => {
        const now = new Date().toISOString()
        const newCat: VehicleCategory = {
          id:        `cat-${Date.now()}`,
          label:     data.label.trim(),
          code:      toCode(data.label),
          color:     data.color,
          vatRate:   data.vatRate,
          isActive:  true,
          isSystem:  false,
          order:     data.order,
          createdAt: now,
          updatedAt: now,
        }
        set((s) => ({ categories: [...s.categories, newCat] }))
      },

      updateCategory: (id, data) => {
        set((s) => ({
          categories: s.categories.map((c) =>
            c.id === id
              ? { ...c, ...data, label: data.label.trim(), updatedAt: new Date().toISOString() }
              : c
          ),
        }))
      },

      deactivateCategory: (id) => {
        const cat = get().categories.find((c) => c.id === id)
        if (!cat || cat.isSystem) return

        // Réaffecte les véhicules concernés → catégorie Hors liste
        const horsListeId = get().categories.find((c) => c.isSystem)?.id ?? 'cat-hors-liste'
        const vehicleStore = useVehicleStore.getState()
        const impacted = vehicleStore.vehicles.filter((v) => v.category === id)
        impacted.forEach((v) => {
          vehicleStore.updateVehicle?.(v.id, { category: horsListeId })
        })

        set((s) => ({
          categories: s.categories.map((c) =>
            c.id === id
              ? { ...c, isActive: false, updatedAt: new Date().toISOString() }
              : c
          ),
        }))
      },

      getById:  (id) => get().categories.find((c) => c.id === id),
      getActive: ()  => get().categories
        .filter((c) => c.isActive)
        .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label)),
    }),
    { name: 'vyv-vehicle-categories' }
  )
)
