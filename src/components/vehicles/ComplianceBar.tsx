interface Props {
  score: number
  showLabel?: boolean
}

function getColor(score: number): string {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-orange-500'
  return 'bg-red-500'
}

function getLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 75) return 'Bon'
  if (score >= 60) return 'A surveiller'
  return 'Critique'
}

export default function ComplianceBar({ score, showLabel = false }: Props) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-24">
        <div
          className={`h-full rounded-full transition-all ${getColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-700 min-w-8">{score}%</span>
      {showLabel && (
        <span className="text-xs text-gray-500 ml-1">{getLabel(score)}</span>
      )}
    </div>
  )
}
