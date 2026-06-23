import { useMemo } from 'react'
import { CalendarClock, Wrench, DollarSign, TrendingUp } from 'lucide-react'
import type { MaintenanceRecord } from '@/types'

interface MaintenanceKPIProps {
  maintenances: MaintenanceRecord[]
  budgetGap:    number
}

export default function MaintenanceKPI({ maintenances, budgetGap }: MaintenanceKPIProps) {
  const scheduled  = maintenances.filter((m) => m.status === 'SCHEDULED').length
  const inProgress = maintenances.filter((m) => m.status === 'IN_PROGRESS').length

  const estimatedThisMonth = useMemo(() => {
    const now = new Date()
    return maintenances
      .filter((m) => {
        const d = new Date(m.scheduledDate)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      .reduce((sum, m) => sum + (m.estimatedCost ?? 0), 0)
  }, [maintenances])

  const gapColor = budgetGap > 0 ? 'text-red-600' : budgetGap < 0 ? 'text-green-600' : 'text-gray-600'
  const gapBg    = budgetGap > 0 ? 'bg-red-50'    : budgetGap < 0 ? 'bg-green-50'    : 'bg-gray-50'

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg"><CalendarClock className="w-5 h-5 text-blue-600" /></div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Planifiées</p>
            <p className="text-2xl font-bold text-gray-900">{scheduled}</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg"><Wrench className="w-5 h-5 text-orange-600" /></div>
          <div>
            <p className="text-xs text-gray-500 font-medium">En cours</p>
            <p className="text-2xl font-bold text-orange-600">{inProgress}</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 rounded-lg"><DollarSign className="w-5 h-5 text-violet-600" /></div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Budget estimé (mois)</p>
            <p className="text-2xl font-bold text-gray-900">{estimatedThisMonth.toLocaleString('fr-FR')} €</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${gapBg}`}><TrendingUp className={`w-5 h-5 ${gapColor}`} /></div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Écart budgétaire</p>
            <p className={`text-2xl font-bold ${gapColor}`}>
              {budgetGap >= 0 ? '+' : ''}{budgetGap.toLocaleString('fr-FR')} €
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
