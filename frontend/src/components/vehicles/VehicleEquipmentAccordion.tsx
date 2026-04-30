import { useState } from 'react'
import { ChevronDown, AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react'
import {
  MOCK_EQUIPMENT,
  CATEGORY_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
} from '@/data/mockEquipment'
import type { Equipment, EquipmentStatus } from '@/data/mockEquipment'

interface Props {
  vehicleId: string
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

function dateClass(dateStr: string): string {
  const days = daysUntil(dateStr)
  if (days < 0) return 'text-red-600 font-medium'
  if (days < 30) return 'text-orange-600 font-medium'
  return 'text-gray-600'
}

export default function VehicleEquipmentAccordion({ vehicleId }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const equipment = MOCK_EQUIPMENT.filter((eq) => eq.vehicleId === vehicleId)

  if (equipment.length === 0) {
    return (
      <p className="text-sm text-gray-500">Aucun equipement enregistre pour ce vehicule.</p>
    )
  }

  const hasCritical = equipment.some((eq) => eq.status === 'CRITICAL')
  const hasWarning = equipment.some((eq) => eq.status === 'WARNING')

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {hasCritical && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Critique
            </span>
          )}
          {hasWarning && (
            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Avertissement
            </span>
          )}
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
            {equipment.length} equipement{equipment.length > 1 ? 's' : ''}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
              {equipment.map((eq: Equipment) => (
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
                    <span className={`text-xs ${dateClass(eq.nextCheckDate)}`}>
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
}
