interface ComplianceGaugeProps {
  title: string
  compliant: number
  total: number
  expired: number
  expiring30: number
  expiring90: number
}

export default function ComplianceGauge({
  title, compliant, total, expired, expiring30, expiring90,
}: ComplianceGaugeProps) {
  const pct = total > 0 ? Math.round((compliant / total) * 100) : 0
  const color = pct >= 90 ? '#22c55e' : pct >= 70 ? '#f97316' : '#ef4444'
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col items-center gap-4">
      <h3 className="text-sm font-semibold text-gray-700 text-center">{title}</h3>

      <div className="relative">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
          <circle
            cx="50" cy="50" r={radius} fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-gray-900">{pct}%</span>
          <span className="text-xs text-gray-500">{compliant}/{total}</span>
        </div>
      </div>

      <div className="w-full space-y-1 text-xs">
        {expired > 0 && (
          <div className="flex justify-between">
            <span className="text-red-600 font-medium">Expires</span>
            <span className="font-bold text-red-600">{expired}</span>
          </div>
        )}
        {expiring30 > 0 && (
          <div className="flex justify-between">
            <span className="text-orange-600 font-medium">Expirent dans 30j</span>
            <span className="font-bold text-orange-600">{expiring30}</span>
          </div>
        )}
        {expiring90 > 0 && (
          <div className="flex justify-between">
            <span className="text-yellow-600 font-medium">Expirent dans 90j</span>
            <span className="font-bold text-yellow-600">{expiring90}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-gray-100 pt-1 mt-1">
          <span className="text-green-600 font-medium">Conformes</span>
          <span className="font-bold text-green-600">{compliant}</span>
        </div>
      </div>
    </div>
  )
}
