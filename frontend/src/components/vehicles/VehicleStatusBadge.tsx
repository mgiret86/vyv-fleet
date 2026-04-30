const statusStyles = {
  ACTIVE: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    label: 'Actif',
  },
  IN_MAINTENANCE: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    label: 'En maintenance',
  },
  INACTIVE: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    label: 'Inactif',
  },
  IMMOBILIZED: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    label: 'Immobilise',
  },
} as const satisfies Record<string, { bg: string; text: string; label: string }>

interface Props {
  status: string
}

export default function VehicleStatusBadge({ status }: Props) {
  const style = statusStyles[status as keyof typeof statusStyles] ?? {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    label: status,
  }
  const { bg, text, label } = style

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  )
}
