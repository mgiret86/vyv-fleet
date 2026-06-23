import type { VehicleCategory } from '@/types'

function now() { return new Date().toISOString() }

export const MOCK_CATEGORIES: VehicleCategory[] = [
  {
    id:        'cat-hors-liste',
    label:     'Hors liste',
    code:      'HORS_LISTE',
    color:     'gray',
    vatRate:   20,
    isActive:  true,
    isSystem:  true,       // Non supprimable, non désactivable
    order:     999,
    createdAt: now(),
    updatedAt: now(),
  },
]
