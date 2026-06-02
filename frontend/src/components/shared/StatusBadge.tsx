import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  label: string
  colorClass: string
  size?: 'sm' | 'md'
}

export default function StatusBadge({ label, colorClass, size = 'md' }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full border font-medium',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
      colorClass
    )}>
      {label}
    </span>
  )
}
