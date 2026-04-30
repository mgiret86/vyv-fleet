import { Link } from 'react-router-dom'
import { AlertCircle, Shield, Users } from 'lucide-react'
import {
  TYPE_LABELS,
  SEVERITY_LABELS,
  STATUS_LABELS,
} from '@/data/mockIncidents'
import type {
  Incident,
  IncidentType,
  IncidentSeverity,
  IncidentStatus,
} from '@/data/mockIncidents'

const TYPE_COLORS: Record<IncidentType, string> = {
  ACCIDENT:  'bg-red-100 text-red-700',
  THEFT:     'bg-purple-100 text-purple-700',
  VANDALISM: 'bg-orange-100 text-orange-700',
  BREAKDOWN: 'bg-blue-100 text-blue-700',
}

const SEVERITY_COLORS: Record<IncidentSeverity, string> = {
  CRITICAL: 'bg-red-600 text-white',
  MAJOR:    'bg-orange-500 text-white',
  MINOR:    'bg-yellow-500 text-white',
}

const STATUS_COLORS: Record<IncidentStatus, string> = {
  OPEN:        'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  CLOSED:      'bg-green-100 text-green-700',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatCurrency(amount: number | null): string {
  if (amount === null) return '-'
  return `${amount.toLocaleString('fr-FR')} EUR`
}

interface InsuranceTableProps {
  incidents: Incident[]
}

export default function InsuranceTable({ incidents }: InsuranceTableProps) {
  const withoutReference   = incidents.filter((i) => !i.insuranceReference).length
  const estimatedFranchise = incidents.reduce((sum, i) => {
    if (i.status === 'CLOSED' && i.realRepairCost !== null) return sum + i.realRepairCost * 0.2
    return sum
  }, 0)
  const withThirdParty = incidents.filter((i) => i.thirdPartyInvolved).length

  const kpiData = [
    { icon: AlertCircle, label: 'A declarer',          value: withoutReference,                               subtext: 'sinistres sans ref assurance', color: 'text-red-600',    bg: 'bg-red-50'    },
    { icon: Shield,      label: 'Franchises estimees',  value: `${(estimatedFranchise / 1000).toFixed(1)}k`, subtext: 'EUR',                           color: 'text-orange-600', bg: 'bg-orange-50' },
    { icon: Users,       label: 'Tiers impliques',      value: withThirdParty,                                subtext: 'sinistres avec tiers',          color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {kpiData.map((kpi) => (
          <div key={kpi.label} className={`${kpi.bg} rounded-xl border border-gray-100 p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              <span className="text-xs text-gray-500 font-medium">{kpi.label}</span>
            </div>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{kpi.subtext}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Ref Sinistre', 'Date Declaration', 'Immatriculation', 'Type', 'Severite', 'Assurance Tiers', 'Cout Est. / Reel', 'Statut', 'Prestataire', 'Jours Immob.'].map((col) => (
                  <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {incidents.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-sm text-gray-400">Aucun sinistre disponible.</td></tr>
              ) : (
                incidents.map((incident) => {
                  const costDiff =
                    incident.realRepairCost !== null && incident.estimatedRepairCost !== null
                      ? incident.realRepairCost - incident.estimatedRepairCost
                      : null
                  return (
                    <tr key={incident.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">
                        {incident.insuranceReference ?? <span className="text-red-500 font-semibold">--</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(incident.declarationDate)}</td>
                      <td className="px-4 py-3">
                        <Link to={`/vehicles/${incident.vehicleId}`} className="font-mono font-semibold text-violet-600 hover:text-violet-700">
                          {incident.vehicleRegistration}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${TYPE_COLORS[incident.type]}`}>
                          {TYPE_LABELS[incident.type]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${SEVERITY_COLORS[incident.severity]}`}>
                          {SEVERITY_LABELS[incident.severity]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{incident.thirdPartyInsurance ?? '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-gray-900 font-medium">{formatCurrency(incident.estimatedRepairCost)}</span>
                          {incident.status === 'CLOSED' && incident.realRepairCost !== null && (
                            <span className={`text-xs ${costDiff !== null && costDiff > 0 ? 'text-red-600' : costDiff !== null && costDiff < 0 ? 'text-green-600' : 'text-gray-500'}`}>
                              {formatCurrency(incident.realRepairCost)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[incident.status]}`}>
                          {STATUS_LABELS[incident.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{incident.repairProvider ?? '-'}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{incident.immobilizationDays ?? '-'}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}