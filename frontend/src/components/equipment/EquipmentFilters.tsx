import { Search } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import type { EquipmentCategory, EquipmentStatus } from '@/data/mockEquipment'

interface EquipmentFiltersProps {
  search: string
  onSearchChange: (v: string) => void
  category: EquipmentCategory | 'ALL'
  onCategoryChange: (v: EquipmentCategory | 'ALL') => void
  status: EquipmentStatus | 'ALL'
  onStatusChange: (v: EquipmentStatus | 'ALL') => void
  agencyId: string
  onAgencyChange: (v: string) => void
  urgentOnly: boolean
  onUrgentChange: (v: boolean) => void
  visibleAgencyIds: string[]
}

const CATEGORIES: { value: EquipmentCategory | 'ALL'; label: string }[] = [
  { value: 'ALL',          label: 'Toutes categories' },
  { value: 'DEFIBRILLATOR', label: 'Defibrillateur' },
  { value: 'OXYGEN',        label: 'Oxygene' },
  { value: 'STRETCHER',     label: 'Brancard' },
  { value: 'MONITOR',       label: 'Moniteur' },
  { value: 'DISINFECTION',  label: 'Desinfection' },
  { value: 'OTHER',         label: 'Autre' },
]

const STATUSES: { value: EquipmentStatus | 'ALL'; label: string }[] = [
  { value: 'ALL',            label: 'Tous statuts' },
  { value: 'OK',             label: 'Conforme' },
  { value: 'WARNING',        label: 'Avertissement' },
  { value: 'CRITICAL',       label: 'Critique' },
  { value: 'OUT_OF_SERVICE', label: 'Hors service' },
]

export default function EquipmentFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  status,
  onStatusChange,
  agencyId,
  onAgencyChange,
  urgentOnly,
  onUrgentChange,
  visibleAgencyIds,
}: EquipmentFiltersProps) {
  const { agencies } = useAppStore()
  const visibleAgencies = agencies.filter((a) => visibleAgencyIds.includes(a.id))

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex flex-wrap gap-4">

        {/* Recherche texte */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Recherche label, immat, serie..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>

        {/* Filtre catégorie */}
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value as EquipmentCategory | 'ALL')}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        {/* Filtre statut */}
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value as EquipmentStatus | 'ALL')}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        {/* Filtre agence — restreint aux agences visibles selon le rôle */}
        <select
          value={agencyId}
          onChange={(e) => onAgencyChange(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">Toutes les agences</option>
          {visibleAgencies.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>

        {/* Filtre urgences */}
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={urgentOnly}
            onChange={(e) => onUrgentChange(e.target.checked)}
            className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
          />
          <span>Echeances moins de 30j</span>
        </label>

      </div>
    </div>
  )
}
