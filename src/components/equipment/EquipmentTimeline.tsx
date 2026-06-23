import { Link } from 'react-router-dom'
import { MOCK_EQUIPMENT, STATUS_COLORS, STATUS_LABELS } from '@/data/mockEquipment'
import type { Equipment } from '@/data/mockEquipment'

interface EquipmentTimelineProps {
  urgentOnly: boolean
}

function getMonthName(date: Date): string {
  return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function getDaysColor(days: number): string {
  if (days < 0) return 'text-red-600'
  if (days < 30) return 'text-orange-600'
  return 'text-green-600'
}

export default function EquipmentTimeline({ urgentOnly }: EquipmentTimelineProps) {
  const now = new Date()
  const months: { key: string; label: string; isCurrentMonth: boolean }[] = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    months.push({
      key: getMonthKey(d),
      label: getMonthName(d),
      isCurrentMonth: i === 0,
    })
  }

  const equipmentByMonth: Record<string, Equipment[]> = {}
  months.forEach((m) => {
    equipmentByMonth[m.key] = []
  })

  MOCK_EQUIPMENT.forEach((eq) => {
    const dueDate = new Date(eq.nextCheckDate)
    const key = getMonthKey(dueDate)
    if (equipmentByMonth[key]) {
      equipmentByMonth[key].push(eq)
    }
  })

  const filteredEquipment = urgentOnly
    ? MOCK_EQUIPMENT.filter((eq) => daysUntil(eq.nextCheckDate) < 30)
    : MOCK_EQUIPMENT

  const summaryRows = filteredEquipment
    .map((eq) => ({
      ...eq,
      days: daysUntil(eq.nextCheckDate),
    }))
    .sort((a, b) => a.days - b.days)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-6 gap-2">
        {months.map((month) => (
          <div
            key={month.key}
            className={`rounded-lg border p-3 text-center ${
              month.isCurrentMonth ? 'bg-violet-50 border-violet-200' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <p className={`text-xs font-medium ${month.isCurrentMonth ? 'text-violet-700' : 'text-gray-600'}`}>
              {month.label}
            </p>
            <p className={`text-lg font-bold mt-1 ${month.isCurrentMonth ? 'text-violet-600' : 'text-gray-800'}`}>
              {equipmentByMonth[month.key].length}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-6 gap-2">
        {months.map((month) => (
          <div key={month.key} className="space-y-1">
            {equipmentByMonth[month.key].map((eq) => (
              <div
                key={eq.id}
                className={`text-xs p-1.5 rounded border ${
                  eq.status === 'CRITICAL'
                    ? 'bg-red-50 border-red-200'
                    : eq.status === 'WARNING'
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                <span className="font-mono font-semibold">{eq.vehicleRegistration}</span>
                <span className="ml-1 text-gray-500">{eq.label.split(' ')[0]}</span>
              </div>
            ))}
            {equipmentByMonth[month.key].length === 0 && (
              <div className="text-xs text-gray-400 text-center py-2">-</div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Equipement</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Vehicule</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Agence</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Prochaine echeance</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Jours restants</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Prestataire</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {summaryRows.map((eq) => (
              <tr key={eq.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-900">{eq.label}</span>
                  <span className="ml-2 text-xs text-gray-400 font-mono">{eq.serialNumber}</span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    to={`/vehicles/${eq.vehicleId}`}
                    className="font-mono font-semibold text-violet-600 hover:text-violet-700"
                  >
                    {eq.vehicleRegistration}
                  </Link>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{eq.agencyName}</td>
                <td className="px-4 py-3 text-xs">
                  <span className={eq.days < 0 ? 'text-red-600 font-medium' : eq.days < 30 ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                    {formatDate(eq.nextCheckDate)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-semibold ${getDaysColor(eq.days)}`}>
                    {eq.days < 0 ? `${Math.abs(eq.days)}j depasse` : `${eq.days}j`}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{eq.maintenanceProvider}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[eq.status]}`}>
                    {STATUS_LABELS[eq.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
