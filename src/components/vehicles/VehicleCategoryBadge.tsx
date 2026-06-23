import { useVehicleCategoryStore, getCategoryColor } from '@/store/vehicleCategoryStore'

interface Props {
  category: string   // id dynamique de VehicleCategory
}

export default function VehicleCategoryBadge({ category }: Props) {
  const { getById } = useVehicleCategoryStore()

  const cat   = getById(category)
  const label = cat?.label ?? 'Hors liste'
  const color = cat?.color ?? 'gray'
  const cfg   = getCategoryColor(color)

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {label}
    </span>
  )
}
