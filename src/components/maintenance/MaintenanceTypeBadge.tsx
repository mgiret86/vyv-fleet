const typeColors = {
  PREVENTIVE: 'bg-blue-100 text-blue-700',
  CORRECTIVE: 'bg-red-100 text-red-700',
  REGULATORY: 'bg-purple-100 text-purple-700',
  SANITAIRE: 'bg-green-100 text-green-700',
} as const

const typeLabels = {
  PREVENTIVE: 'Preventive',
  CORRECTIVE: 'Corrective',
  REGULATORY: 'Reglementaire',
  SANITAIRE: 'Sanitaire',
} as const

type MaintenanceType = keyof typeof typeColors

interface MaintenanceTypeBadgeProps {
  type: MaintenanceType
}

export default function MaintenanceTypeBadge({ type }: MaintenanceTypeBadgeProps) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[type]}`}>
      {typeLabels[type]}
    </span>
  )
}
