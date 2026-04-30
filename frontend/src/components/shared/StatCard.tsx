import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  trend?: { value: number; label: string }
  className?: string
}

export default function StatCard({ title, value, subtitle, icon: Icon, iconColor = 'text-violet-600', iconBg = 'bg-violet-50', trend, className }: StatCardProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 font-medium truncate">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          {trend && (
            <p className={cn('text-xs font-medium mt-1', trend.value >= 0 ? 'text-green-600' : 'text-red-500')}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', iconBg)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
      </div>
    </div>
  )
}
