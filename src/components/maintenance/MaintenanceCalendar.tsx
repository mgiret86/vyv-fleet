import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, X, Calendar, Building2, Wrench, Euro, FileText, User } from 'lucide-react'
import type { MaintenanceRecord } from '@/types'
import MaintenanceTypeBadge from './MaintenanceTypeBadge'

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS   = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

const TYPE_DOT: Record<MaintenanceRecord['type'], string> = {
  PREVENTIVE: 'bg-blue-500',
  CORRECTIVE: 'bg-orange-500',
  REGULATORY: 'bg-violet-500',
  SANITAIRE:  'bg-green-500',
}
const TYPE_PILL: Record<MaintenanceRecord['type'], string> = {
  PREVENTIVE: 'bg-blue-100 text-blue-700',
  CORRECTIVE: 'bg-orange-100 text-orange-700',
  REGULATORY: 'bg-violet-100 text-violet-700',
  SANITAIRE:  'bg-green-100 text-green-700',
}

interface MaintenanceCalendarProps {
  maintenances:           MaintenanceRecord[]
  selectedMaintenanceId:  string | null
  onSelectMaintenance:    (id: string | null) => void
}

function DataRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-3 h-3 text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
        <div className="text-xs font-semibold text-gray-800 mt-0.5">{value}</div>
      </div>
    </div>
  )
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

  // Compte total du mois
  const monthTotal = Object.values(maintenancesByDay).reduce((acc, arr) => acc + arr.length, 0)

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

      {/* ── Navigation mois ── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
        <button onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-violet-500" />
            <h3 className="text-sm font-bold text-gray-900">{MONTHS[month]} {year}</h3>
          </div>
          {monthTotal > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-violet-50 text-violet-700 border-violet-200">
              {monthTotal} intervention{monthTotal > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <button onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── En-têtes jours ── */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-2 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* ── Grille calendrier ── */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, idx) => {
          const dayMaintenances = day !== null ? (maintenancesByDay[day] ?? []) : []
          const todayCell = day !== null && isToday(day)

          return (
            <div
              key={idx}
              className={`min-h-24 p-1.5 border-b border-r border-gray-50 ${
                day === null ? 'bg-gray-50/40' : todayCell ? 'bg-violet-50/60' : 'bg-white hover:bg-gray-50/50'
              } transition-colors`}
            >
              {day !== null && (
                <>
                  {/* Numéro du jour */}
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mb-1 ${
                    todayCell
                      ? 'bg-violet-600 text-white'
                      : 'text-gray-500'
                  }`}>
                    {day}
                  </div>

                  {/* Events */}
                  <div className="space-y-0.5">
                    {dayMaintenances.slice(0, 3).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => onSelectMaintenance(m.id)}
                        className={`w-full text-left flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-semibold truncate transition-colors ${
                          selectedMaintenanceId === m.id
                            ? `${TYPE_PILL[m.type]} ring-1 ring-offset-0 ring-current`
                            : `${TYPE_PILL[m.type]} hover:opacity-80`
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${TYPE_DOT[m.type]}`} />
                        <span className="truncate">{m.vehicleRegistration}</span>
                      </button>
                    ))}
                    {dayMaintenances.length > 3 && (
                      <p className="text-[10px] font-bold text-gray-400 px-1.5">
                        +{dayMaintenances.length - 3} autre{dayMaintenances.length - 3 > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Légende ── */}
      <div className="flex items-center gap-4 px-5 py-2.5 border-t border-gray-100 bg-gray-50/50">
        {Object.entries(TYPE_DOT).map(([type, dot]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${dot}`} />
            <span className="text-[10px] font-semibold text-gray-400">
              {type === 'PREVENTIVE' ? 'Préventive' : type === 'CORRECTIVE' ? 'Corrective' : type === 'REGULATORY' ? 'Réglementaire' : 'Sanitaire'}
            </span>
          </div>
        ))}
      </div>

      {/* ── Panneau détail (slide-in) ── */}
      {selectedMaintenance && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => onSelectMaintenance(null)} />
          <div className="relative w-full max-w-sm bg-white shadow-2xl border-l border-gray-100 flex flex-col overflow-hidden">

            {/* En-tête slide */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
              <div className="w-1 h-5 rounded-full bg-violet-600" />
              <Wrench className="w-4 h-4 text-violet-500" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-gray-900 truncate">{selectedMaintenance.label}</h4>
                <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 mt-0.5">
                  Détail intervention
                </p>
              </div>
              <button onClick={() => onSelectMaintenance(null)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors flex-shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Badge type */}
            <div className="px-5 py-3 border-b border-gray-100">
              <MaintenanceTypeBadge type={selectedMaintenance.type} />
            </div>

            {/* Corps détail */}
            <div className="flex-1 overflow-y-auto px-5 py-2">
              <DataRow icon={User} label="Véhicule" value={
                <div>
                  <span className="font-mono text-violet-700">{selectedMaintenance.vehicleRegistration}</span>
                  <span className="text-gray-500 ml-1.5">{selectedMaintenance.vehicleBrand} {selectedMaintenance.vehicleModel}</span>
                </div>
              } />
              <DataRow icon={Building2} label="Agence" value={selectedMaintenance.agencyName} />
              <DataRow icon={Calendar} label="Date planifiée" value={
                new Date(selectedMaintenance.scheduledDate).toLocaleDateString('fr-FR', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                })
              } />
              {selectedMaintenance.provider && (
                <DataRow icon={Wrench} label="Prestataire" value={selectedMaintenance.provider} />
              )}
              <DataRow icon={Euro} label="Coûts" value={
                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-[10px] text-gray-400 block">Estimé</span>
                    <span className="text-gray-800">
                      {selectedMaintenance.estimatedCost != null
                        ? selectedMaintenance.estimatedCost.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
                        : '—'}
                    </span>
                  </div>
                  {selectedMaintenance.realCost != null && (
                    <div>
                      <span className="text-[10px] text-gray-400 block">Réel</span>
                      <span className="font-bold text-gray-900">
                        {selectedMaintenance.realCost.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </span>
                    </div>
                  )}
                </div>
              } />
              {selectedMaintenance.notes && (
                <DataRow icon={FileText} label="Notes" value={
                  <p className="text-gray-600 leading-relaxed">{selectedMaintenance.notes}</p>
                } />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
