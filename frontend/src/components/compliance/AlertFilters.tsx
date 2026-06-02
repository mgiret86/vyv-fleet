import { Search } from 'lucide-react'
import type { Agency } from '@/types'

interface AlertFiltersProps {
  search: string
  onSearchChange: (v: string) => void
  severity: string
  onSeverityChange: (v: string) => void
  category: string
  onCategoryChange: (v: string) => void
  status: string
  onStatusChange: (v: string) => void
  agencyId: string
  onAgencyChange: (v: string) => void
  agencies: Agency[]
}

const selectClass = 'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500'

export default function AlertFilters({
  search, onSearchChange,
  severity, onSeverityChange,
  category, onCategoryChange,
  status, onStatusChange,
  agencyId, onAgencyChange,
  agencies,
}: AlertFiltersProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
          />
        </div>

        <select value={severity} onChange={(e) => onSeverityChange(e.target.value)} className={selectClass}>
          <option value="Tous">Toutes severites</option>
          <option value="Critique">Critique</option>
          <option value="Avertissement">Avertissement</option>
          <option value="Info">Info</option>
        </select>

        <select value={category} onChange={(e) => onCategoryChange(e.target.value)} className={selectClass}>
          <option value="Tous">Toutes categories</option>
          <option value="ARS">ARS</option>
          <option value="CT">Controle technique</option>
          <option value="Assurance">Assurance</option>
          <option value="Equipement">Equipement</option>
          <option value="Maintenance">Maintenance</option>
        </select>

        <select value={status} onChange={(e) => onStatusChange(e.target.value)} className={selectClass}>
          <option value="Tous">Tous statuts</option>
          <option value="Ouverte">Ouverte</option>
          <option value="En cours">En cours</option>
          <option value="Resolue">Resolue</option>
        </select>

        <select value={agencyId} onChange={(e) => onAgencyChange(e.target.value)} className={selectClass}>
          <option value="">Toutes agences</option>
          {agencies.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
