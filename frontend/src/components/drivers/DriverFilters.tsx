import { Search } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

interface DriverFiltersProps {
  search: string
  onSearchChange: (v: string) => void
  roleFilter: string
  onRoleChange: (v: string) => void
  statusFilter: string
  onStatusChange: (v: string) => void
  agencyFilter: string
  onAgencyChange: (v: string) => void
  urgentOnly: boolean
  onUrgentChange: (v: boolean) => void
  visibleAgencyIds: string[]  // ← AJOUT
}

const ROLES = [
  { value: 'ALL', label: 'Tous les roles' },
  { value: 'AMBULANCIER_DE', label: 'Ambulancier DE' },
  { value: 'AUXILIAIRE_AMBULANCIER', label: 'Auxiliaire Ambulancier' },
  { value: 'CHAUFFEUR_VSL', label: 'Chauffeur VSL' },
  { value: 'OTHER', label: 'Autre' },
]

const STATUSES = [
  { value: 'ALL', label: 'Tous les statuts' },
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'INACTIVE', label: 'Inactif' },
  { value: 'SUSPENDED', label: 'Suspendu' },
  { value: 'LEAVE', label: 'Conge' },
]

export default function DriverFilters({
  search, onSearchChange,
  roleFilter, onRoleChange,
  statusFilter, onStatusChange,
  agencyFilter, onAgencyChange,
  urgentOnly, onUrgentChange,
  visibleAgencyIds,  // ← AJOUT
}: DriverFiltersProps) {
  const { agencies } = useAppStore()
  const visibleAgencies = agencies.filter((a) => visibleAgencyIds.includes(a.id))  // ← AJOUT

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Recherche nom, email..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>

        <select
          value={roleFilter}
          onChange={(e) => onRoleChange(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <select
          value={agencyFilter}
          onChange={(e) => onAgencyChange(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">Toutes les agences</option>
          {visibleAgencies.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={urgentOnly}
            onChange={(e) => onUrgentChange(e.target.checked)}
            className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
          />
          <span>Habilitations exp. moins de 90j</span>
        </label>
      </div>
    </div>
  )
}
