import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { MaintenanceRecord } from '@/types'
import MaintenanceTypeBadge from './MaintenanceTypeBadge'

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS   = ['Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
                   'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre']

const typeColors = {
  PREVENTIVE:  'bg-blue-500',
  CORRECTIVE:  'bg-red-500',
  REGULATORY:  'bg-purple-500',
  SANITAIRE:   'bg-green-500',
} as const

interface MaintenanceCalendarProps {
  maintenances: MaintenanceRecord[]  // ← données déjà filtrées par filterByAgency() dans Maintenance.tsx
  selectedMaintenanceId: string | null
  onSelectMaintenance: (id: string | null) => void
}

export default function MaintenanceCalendar({
  maintenances,
  selectedMaintenanceId,
  onSelectMaintenance,
}: MaintenanceCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const year  = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const startingDay     = (firstDayOfMonth.getDay() + 6) % 7
  const daysInMonth     = new Date(year, month + 1, 0).getDate()

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = []
    for (let i = 0; i < startingDay; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)
    return days
  }, [startingDay, daysInMonth])

  // Indexation par jour — basée sur les données reçues en props
  const maintenancesByDay = useMemo(() => {
    const map: Record<number, MaintenanceRecord[]> = {}
    maintenances.forEach((m) => {
      const d = new Date(m.scheduledDate)
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate()
        if (!map[day]) map[day] = []
        map[day].push(m)
      }
    })
    return map
  }, [maintenances, year, month])

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const selectedMaintenance = selectedMaintenanceId
    ? maintenances.find((m) => m.id === selectedMaintenanceId)
    : null

  const today   = new Date()
  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">

      {/* Navigation mois */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h3 className="font-semibold text-gray-900">{MONTHS[month]} {year}</h3>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* En-têtes jours */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {WEEKDAYS.map((d) => (
          <div key={d} className="p-2 text-center text-xs font-semibold text-gray-500">{d}</div>
        ))}
      </div>

      {/* Grille calendrier */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, idx) => (
          <div
            key={idx}
            className={`min-h-24 p-1 border-b border-r border-gray-50
              ${day === null ? 'bg-gray-25' : ''}
              ${isToday(day ?? 0) ? 'bg-violet-50' : ''}`}
          >
            {day !== null && (
              <>
                <div className={`text-xs p-1 ${isToday(day) ? 'font-bold text-violet-600' : 'text-gray-500'}`}>
                  {day}
                </div>
                <div className="space-y-1">
                  {maintenancesByDay[day]?.slice(0, 3).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => onSelectMaintenance(m.id)}
                      className={`w-full text-left text-xs px-1 py-0.5 rounded text-white truncate ${typeColors[m.type]}`}
                    >
                      {m.vehicleRegistration} · {m.vehicleBrand} {m.vehicleModel}
                    </button>
                  ))}
                  {(maintenancesByDay[day]?.length ?? 0) > 3 && (
                    <p className="text-xs text-gray-400 px-1">
                      +{maintenancesByDay[day].length - 3}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Panneau détail */}
      {selectedMaintenance && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => onSelectMaintenance(null)} />
          <div className="relative w-full max-w-md bg-white shadow-xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">Detail maintenance</h4>
              <button onClick={() => onSelectMaintenance(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="text-xs text-gray-500">Vehicule</p>
                <p className="font-mono font-semibold text-gray-900">{selectedMaintenance.vehicleRegistration}</p>
                <p className="text-sm text-gray-600">{selectedMaintenance.vehicleBrand} {selectedMaintenance.vehicleModel}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Agence</p>
                <p className="text-sm text-gray-900">{selectedMaintenance.agencyName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Intervention</p>
                <p className="text-sm text-gray-900 font-medium">{selectedMaintenance.label}</p>
                <div className="mt-1"><MaintenanceTypeBadge type={selectedMaintenance.type} /></div>
              </div>
              <div>
                <p className="text-xs text-gray-500">Date planifiee</p>
                <p className="text-sm text-gray-900">
                  {new Date(selectedMaintenance.scheduledDate).toLocaleDateString('fr-FR', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>
              {selectedMaintenance.provider && (
                <div>
                  <p className="text-xs text-gray-500">Prestataire</p>
                  <p className="text-sm text-gray-900">{selectedMaintenance.provider}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Cout estime</p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedMaintenance.estimatedCost ?? '-'} EUR
                  </p>
                </div>
                {selectedMaintenance.realCost !== null && (
                  <div>
                    <p className="text-xs text-gray-500">Cout reel</p>
                    <p className="text-sm font-medium text-gray-900">{selectedMaintenance.realCost} EUR</p>
                  </div>
                )}
              </div>
              {selectedMaintenance.notes && (
                <div>
                  <p className="text-xs text-gray-500">Notes</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{selectedMaintenance.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
