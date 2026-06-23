import { useVehicleCategoryStore, getCategoryColor } from '@/store/vehicleCategoryStore'

interface Props {
  selected: Set<string>
  counts:   Partial<Record<string, number>>
  onChange: (selected: Set<string>) => void
}

export default function CategoryFilterBar({ selected, counts, onChange }: Props) {
  const { getActive } = useVehicleCategoryStore()
  const categories    = getActive()
  const allSelected   = selected.size === 0

  const toggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    onChange(next)
  }

  const selectAll = () => onChange(new Set())

  return (
    <div className="flex items-center gap-2 flex-wrap">

      {/* Bouton "Tout" */}
      <button
        onClick={selectAll}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
          allSelected
            ? 'border-gray-900 bg-gray-900 text-white ring-2 ring-gray-400'
            : 'border-gray-200 text-gray-500 bg-white hover:border-gray-400 hover:text-gray-700'
        }`}
      >
        <span>🚛</span>
        <span>Tout</span>
      </button>

      {/* Séparateur */}
      <div className="w-px h-6 bg-gray-200" />

      {/* Une pastille par catégorie active */}
      {categories.map((cat) => {
        const isActive = selected.has(cat.id)
        const count    = counts[cat.id] ?? 0
        const cfg      = getCategoryColor(cat.color)

        const baseClass   = `${cfg.bg} ${cfg.text} border-transparent hover:opacity-80`
        const activeClass = `${cfg.bg} ${cfg.text} border-current ring-2 ring-current/30 opacity-100`

        return (
          <button
            key={cat.id}
            onClick={() => toggle(cat.id)}
            title={cat.label}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              isActive ? activeClass : baseClass
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            <span>{cat.label}</span>
            {count > 0 && (
              <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                isActive ? 'bg-white/60' : 'bg-white/80'
              }`}>
                {count}
              </span>
            )}
          </button>
        )
      })}

      {/* État vide : aucune catégorie créée */}
      {categories.filter((c) => !c.isSystem).length === 0 && (
        <span className="text-xs text-gray-400 italic">
          Aucune catégorie — créez-en dans Paramètres
        </span>
      )}
    </div>
  )
}
