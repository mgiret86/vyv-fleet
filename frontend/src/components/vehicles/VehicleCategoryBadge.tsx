import type { VehicleCategory } from '@/types'

const categoryStyles = {
  AMBULANCE_A: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    label: 'Ambulance A',
  },
  AMBULANCE_B: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    label: 'Ambulance B',
  },
  VSL: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    label: 'VSL',
  },
  TPMR: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    label: 'TPMR',
  },
  TAXI: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    label: 'Taxi',
  },
  SERVICE: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    label: 'Service',
  },
  ASSU_C: {
    bg: 'bg-cyan-100',
    text: 'text-cyan-700',
    label: 'ASSU C',
  },
} as const satisfies Record<string, { bg: string; text: string; label: string }>

interface Props {
  category: VehicleCategory | string
}

export default function VehicleCategoryBadge({ category }: Props) {
  const style = categoryStyles[category as keyof typeof categoryStyles] ?? {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    label: category,
  }
  const { bg, text, label } = style

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  )
}
