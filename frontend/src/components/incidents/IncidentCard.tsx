import { Edit, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Incident, IncidentType, IncidentSeverity, IncidentStatus } from '@/data/mockIncidents'

const TYPE_COLORS: Record<IncidentType, string> = {
  ACCIDENT: 'bg-red-100 text-red-700',
  THEFT: 'bg-purple-100 text-purple-700',
  VANDALISM: 'bg-yellow-100 text-yellow-700',
  BREAKDOWN: 'bg-gray-100 text-gray-700',
}

const SEVERITY_COLORS: Record<IncidentSeverity, string> = {
  CRITICAL: 'bg-red-500',
  MAJOR: 'bg-orange-500',
  MINOR: 'bg-yellow-400',
}

const STATUS_COLORS: Record<IncidentStatus, string> = {
  OPEN: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-orange-100 text-orange-700',
  CLOSED: 'bg-gray-100 text-gray-500',
}

const TYPE_LABELS: Record<IncidentType, string> = {
  ACCIDENT: 'Accident',
  THEFT: 'Vol',
  VANDALISM: 'Vandalisme',
  BREAKDOWN: 'Panne',
}

const SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  CRITICAL: 'Critique',
  MAJOR: 'Majeur',
  MINOR: 'Mineur',
}

const STATUS_LABELS: Record<IncidentStatus, string> = {
  OPEN: 'Ouvert',
  IN_PROGRESS: 'En cours',
  CLOSED: 'Clos',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatCurrency(val: number | null): string {
  if (val === null) return '-'
  return val.toLocaleString('fr-FR') + ' EUR'
}

interface IncidentCardProps {
  incident: Incident
  onEdit: (incident: Incident) => void
  onDelete: (id: string) => void
}

export default function IncidentCard({ incident, onEdit, onDelete }: IncidentCardProps) {
  const costDiff =
    incident.realRepairCost !== null && incident.estimatedRepairCost !== null
      ? incident.realRepairCost - incident.estimatedRepairCost
      : null

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="flex">
        <div className={`w-1.5 ${SEVERITY_COLORS[incident.severity]}`} />
        <div className="flex-1 p-5">

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`px-2.5 py-1 rounded text-xs font-semibold ${TYPE_COLORS[incident.type]}`}>
              {TYPE_LABELS[incident.type]}
            </span>
            <span className={`px-2.5 py-1 rounded text-xs font-medium ${STATUS_COLORS[incident.status]}`}>
              {STATUS_LABELS[incident.status]}
            </span>
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={() => onEdit(incident)}
                className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(incident.id)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-400 ml-2">
                {formatDate(incident.date)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-3">
            <Link
              to={`/vehicles/${incident.vehicleId}`}
              className="text-base font-bold text-gray-900 hover:text-violet-600 transition-colors"
            >
              {incident.vehicleRegistration}
            </Link>
            <span className="text-sm text-gray-500">{incident.agencyName}</span>
            <span className="text-xs text-gray-400 italic">
              {SEVERITY_LABELS[incident.severity]}
            </span>
          </div>

          {incident.description && (
            <p className="text-sm text-gray-600 mb-3 leading-relaxed">
              {incident.description}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
            {incident.location && (
              <div className="flex items-start gap-1.5">
                <span className="text-xs font-medium text-gray-500 shrink-0">Lieu :</span>
                <span className="text-xs text-gray-700">{incident.location}</span>
              </div>
            )}
            {incident.driverName && (
              <div className="flex items-start gap-1.5">
                <span className="text-xs font-medium text-gray-500 shrink-0">Conducteur :</span>
                <span className="text-xs text-gray-700">{incident.driverName}</span>
              </div>
            )}
            <div className="flex items-start gap-1.5">
              <span className="text-xs font-medium text-gray-500 shrink-0">Patient a bord :</span>
              <span className="text-xs text-gray-700">
                {incident.patientInVehicle ? 'Oui' : 'Non'}
              </span>
            </div>
            {incident.insuranceReference && (
              <div className="flex items-start gap-1.5">
                <span className="text-xs font-medium text-gray-500 shrink-0">Ref. assurance :</span>
                <span className="text-xs text-gray-700">{incident.insuranceReference}</span>
              </div>
            )}
            <div className="flex items-start gap-1.5">
              <span className="text-xs font-medium text-gray-500 shrink-0">Tiers implique :</span>
              <span className="text-xs text-gray-700">
                {incident.thirdPartyInvolved ? 'Oui' : 'Non'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 border-t border-gray-100 pt-3">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Cout estime</p>
              <p className="text-sm font-semibold text-gray-800">
                {formatCurrency(incident.estimatedRepairCost)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Cout reel</p>
              <p className="text-sm font-semibold text-gray-800">
                {formatCurrency(incident.realRepairCost)}
              </p>
            </div>
            {costDiff !== null && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Ecart</p>
                <p className={`text-sm font-semibold ${costDiff > 0 ? 'text-red-600' : costDiff < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                  {costDiff > 0 ? '+' : ''}
                  {formatCurrency(costDiff)}
                </p>
              </div>
            )}
          </div>

          {incident.notes && (
            <p className="text-xs text-gray-400 italic mt-3 border-t border-gray-100 pt-3">
              {incident.notes}
            </p>
          )}

        </div>
      </div>
    </div>
  )
}
