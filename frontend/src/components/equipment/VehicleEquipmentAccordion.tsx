import { useState } from 'react'
import { ChevronDown, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  MOCK_EQUIPMENT,
  CATEGORY_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
} from '@/data/mockEquipment'
import type { Equipment, EquipmentStatus } from '@/data/mockEquipment'

interface VehicleGroup {
  vehicleId: string
  vehicleRegistration: string
  agencyName: string
  equipment: Equipment[]
  hasCritical: boolean
  hasWarning: boolean
}

function getVehicleGroups(): VehicleGroup[] {
  const groups: Record<string, VehicleGroup> = {}

  MOCK_EQUIPMENT.forEach((eq) => {
    if (!groups[eq.vehicleId]) {
      groups[eq.vehicleId] = {
        vehicleId: eq.vehicleId,
        vehicleRegistration: eq.vehicleRegistration,
        agencyName: eq.agencyName,
        equipment: [],
        hasCritical: false,
        hasWarning: false,
      }
    }
    groups[eq.vehicleId].equipment.push(eq)
    if (eq.status === 'CRITICAL') groups[eq.vehicleId].hasCritical = true
    if (eq.status === 'WARNING') groups[eq.vehicleId].hasWarning = true
  })

  const sorted = Object.values(groups)
  sorted.sort((a, b) => {
    if (a.hasCritical && !b.hasCritical) return -1
    if (!a.hasCritical && b.hasCritical) return 1
    if (a.hasWarning && !b.hasWarning) return -1
    if (!a.hasWarning && b.hasWarning) return 1
    return 0
  })

  return sorted
}

function StatusIcon({ status }: { status: EquipmentStatus }) {
  if (status === 'CRITICAL') return <AlertCircle className="w-4 h-4 text-red-600" />
  if (status === 'WARNING') return <AlertTriangle className="w-4 h-4 text-orange-500" />
  return <CheckCircle className="w-4 h-4 text-green-500" />
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export default function VehicleEquipmentAccordion() {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())
  const groups = getVehicleGroups()

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-2">
      {groups.map((group) => {
        const isOpen = openIds.has(group.vehicleId)
        return (
          <div key={group.vehicleId} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <button
              onClick={() => toggle(group.vehicleId)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <Link
                  to={`/vehicles/${group.vehicleId}`}
                  className="font-mono font-bold text-violet-600 hover:text-violet-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  {group.vehicleRegistration}
                </Link>
                <span className="text-sm text-gray-500">{group.agencyName}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {group.hasCritical && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Critique
                    </span>
                  )}
                  {group.hasWarning && (
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Avertissement
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                    {group.equipment.length} equipement{group.equipment.length > 1 ? 's' : ''}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Categorie</th>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Equipement</th>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                      <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Prochaine verif</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {group.equipment.map((eq) => (
                      <tr key={eq.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <span className="text-xs text-gray-500">{CATEGORY_LABELS[eq.category]}</span>
                        </td>
                        <td className="px-4 py-2">
                          <span className="font-medium text-gray-900">{eq.label}</span>
                          {eq.serialNumber && (
                            <span className="ml-2 text-xs text-gray-400 font-mono">{eq.serialNumber}</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-1.5">
                            <StatusIcon status={eq.status} />
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[eq.status]}`}>
                              {STATUS_LABELS[eq.status]}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-2">
                          <span className={`text-xs ${daysUntil(eq.nextCheckDate) < 0 ? 'text-red-600 font-medium' : daysUntil(eq.nextCheckDate) < 30 ? 'text-orange-600 font-medium' : 'text-gray-600'}`}>
                            {formatDate(eq.nextCheckDate)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
