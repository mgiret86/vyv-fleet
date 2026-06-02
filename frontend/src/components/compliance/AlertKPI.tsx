import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react'
import type { Alert } from '@/types'

interface AlertKPIProps {
  alerts: Alert[]
}

export default function AlertKPI({ alerts }: AlertKPIProps) {
  const critical = alerts.filter((a) => a.severity === 'CRITICAL' && a.status !== 'RESOLVED').length
  const warning = alerts.filter((a) => a.severity === 'WARNING' && a.status !== 'RESOLVED').length
  const info = alerts.filter((a) => a.severity === 'INFO' && a.status !== 'RESOLVED').length
  const resolved = alerts.filter((a) => a.status === 'RESOLVED').length

  const kpis = [
    {
      label: 'Critiques',
      value: critical,
      icon: AlertTriangle,
      bg: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-200',
    },
    {
      label: 'Avertissements',
      value: warning,
      icon: AlertCircle,
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      border: 'border-orange-200',
    },
    {
      label: 'Informations',
      value: info,
      icon: Info,
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200',
    },
    {
      label: 'Resolues',
      value: resolved,
      icon: CheckCircle,
      bg: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-200',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon
        return (
          <div
            key={kpi.label}
            className={`rounded-xl border p-4 flex items-center gap-4 ${kpi.bg} ${kpi.border}`}
          >
            <div className={`p-2 rounded-lg bg-white shadow-sm`}>
              <Icon className={`h-5 w-5 ${kpi.text}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
              <p className={`text-xs font-medium ${kpi.text}`}>{kpi.label}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
