import { cn } from '@/lib/utils'

interface ComplianceScoreProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
}

export default function ComplianceScore({ score, size = 'md' }: ComplianceScoreProps) {
  const color = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-orange-500' : 'text-red-500'
  const bg = score >= 80 ? 'bg-green-50 border-green-200' : score >= 60 ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200'
  const bar = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-orange-500' : 'bg-red-500'

  if (size === 'sm') {
    return (
      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-bold', bg, color)}>
        {score}%
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', bar)} style={{ width: `${score}%` }} />
      </div>
      <span className={cn('text-xs font-bold w-8 text-right', color)}>{score}%</span>
    </div>
  )
}
