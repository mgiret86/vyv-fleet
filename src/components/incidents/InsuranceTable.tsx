import { Link } from 'react-router-dom'
import { AlertCircle, Shield, Users, FileWarning } from 'lucide-react'
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

// ─── Config badges ────────────────────────────────────────────────
const TYPE_CONFIG: Record<IncidentType, string> = {
  ACCIDENT:  'bg-red-50 text-red-700 border-red-200',
  THEFT:     'bg-violet-50 text-violet-700 border-violet-200',
  VANDALISM: 'bg-amber-50 text-amber-700 border-amber-200',
  BREAKDOWN: 'bg-blue-50 text-blue-700 border-blue-200',
}

const SEVERITY_CONFIG: Record<IncidentSeverity, string> = {
  CRITICAL: 'bg-red-500 text-white border-red-600',
  MAJOR:    'bg-orange-500 text-white border-orange-600',
  MINOR:    'bg-amber-400 text-white border-amber-500',
}

const STATUS_CONFIG: Record<IncidentStatus, { badge: string; dot: string }> = {
  OPEN:        { badge: 'bg-gray-100 text-gray-500 border-gray-200',     dot: 'bg-gray-400'   },
  IN_PROGRESS: { badge: 'bg-blue-50 text-blue-700 border-blue-200',      dot: 'bg-blue-500'   },
  CLOSED:      { badge: 'bg-green-50 text-green-700 border-green-200',   dot: 'bg-green-500'  },
}

// ─── Helpers ──────────────────────────────────────────────────────
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function formatCurrency(amount: number | null): string {
  if (amount === null) return '—'
  return `${amount.toLocaleString('fr-FR')} €`
}

// ─── KpiCard ──────────────────────────────────────────────────────
function KpiCard({
  icon: Icon, label, value, subtext, barColor, valueColor,
}: {
  icon:       React.ElementType
  label:      string
  value:      string | number
  subtext:    string
  barColor:   string
  valueColor: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/60 flex items-center gap-2">
        <div className={`w-1 h-3 rounded-full ${barColor}`} />
        <Icon className={`w-3.5 h-3.5 ${valueColor}`} />
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className="px-4 py-3.5">
        <p className={`text-3xl font-black leading-none ${valueColor}`}>{value}</p>
        <p className="text-[10px] font-semibold text-gray-400 mt-1.5 uppercase tracking-wide">{subtext}</p>
      </div>
    </div>
  )
}

// ─── Colonnes ─────────────────────────────────────────────────────
const HEADERS: { label: string; right?: boolean }[] = [
  { label: 'Réf. sinistre'     },
  { label: 'Date déclaration'  },
  { label: 'Immatriculation'   },
  { label: 'Type'              },
  { label: 'Sévérité'          },
  { label: 'Assurance tiers'   },
  { label: 'Coût est. / réel', right: true },
  { label: 'Statut'            },
  { label: 'Prestataire'       },
  { label: 'Immob. (j)',        right: true },
]

// ─── Composant principal ──────────────────────────────────────────
interface InsuranceTableProps {
  incidents: Incident[]
}

export default function InsuranceTable({ incidents }: InsuranceTableProps) {
  const withoutReference   = incidents.filter((i) => !i.insuranceReference).length
  const withThirdParty     = incidents.filter((i) => i.thirdPartyInvolved).length
  const estimatedFranchise = incidents.reduce((sum, i) => {
    if (i.status === 'CLOSED' && i.realRepairCost !== null) return sum + i.realRepairCost * 0.2
    return sum
  }, 0)

  return (
    <div className="space-y-4">

      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiCard
          icon={AlertCircle}
          label="À déclarer"
          value={withoutReference}
          subtext="sinistres sans réf. assurance"
          valueColor="text-red-600"
          barColor="bg-red-500"
        />
        <KpiCard
          icon={Shield}
          label="Franchises estimées"
          value={`${(estimatedFranchise / 1000).toFixed(1)}k €`}
          subtext="sur sinistres clôturés"
          valueColor="text-amber-600"
          barColor="bg-amber-500"
        />
        <KpiCard
          icon={Users}
          label="Tiers impliqués"
          value={withThirdParty}
          subtext="sinistres avec tiers"
          valueColor="text-violet-600"
          barColor="bg-violet-500"
        />
      </div>

      {/* ── Tableau ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">

            {/* En-tête */}
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                {HEADERS.map((h, i) => (
                  <th key={i}
                    className={`px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap ${
                      h.right ? 'text-right' : 'text-left'
                    }`}>
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Corps */}
            <tbody className="divide-y divide-gray-50">
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan={HEADERS.length} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <FileWarning className="w-5 h-5 text-gray-300" />
                      </div>
                      <p className="text-xs font-bold text-gray-400">Aucun sinistre disponible</p>
                    </div>
                  </td>
                </tr>
              ) : (
                incidents.map((incident) => {
                  const costDiff =
                    incident.realRepairCost !== null && incident.estimatedRepairCost !== null
                      ? incident.realRepairCost - incident.estimatedRepairCost
                      : null
                  const statusCfg = STATUS_CONFIG[incident.status]

                  return (
                    <tr key={incident.id}
                      className="hover:bg-violet-50/30 transition-colors duration-100 group">

                      {/* Réf. assurance */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {incident.insuranceReference ? (
                          <span className="font-mono text-[11px] font-bold text-gray-600">
                            {incident.insuranceReference}
                          </span>
                        ) : (
                          <span className="inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                            À déclarer
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs font-semibold text-gray-600">
                          {formatDate(incident.declarationDate)}
                        </span>
                      </td>

                      {/* Immatriculation */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link to={`/vehicles/${incident.vehicleId}`}
                          className="font-mono text-[11px] font-bold text-violet-600 hover:text-violet-800 hover:underline underline-offset-2 transition-colors">
                          {incident.vehicleRegistration}
                        </Link>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border ${TYPE_CONFIG[incident.type]}`}>
                          {TYPE_LABELS[incident.type]}
                        </span>
                      </td>

                      {/* Sévérité */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border ${SEVERITY_CONFIG[incident.severity]}`}>
                          {SEVERITY_LABELS[incident.severity]}
                        </span>
                      </td>

                      {/* Assurance tiers */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-[10px] font-semibold text-gray-400">
                          {incident.thirdPartyInsurance ?? '—'}
                        </span>
                      </td>

                      {/* Coûts */}
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-xs font-bold text-gray-800 tabular-nums">
                            {formatCurrency(incident.estimatedRepairCost)}
                          </span>
                          {incident.status === 'CLOSED' && incident.realRepairCost !== null && (
                            <span className={`text-[10px] font-bold tabular-nums ${
                              costDiff !== null && costDiff > 0 ? 'text-red-600' :
                              costDiff !== null && costDiff < 0 ? 'text-green-600' :
                                                                  'text-gray-500'
                            }`}>
                              {formatCurrency(incident.realRepairCost)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Statut */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusCfg.dot}`} />
                          <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.badge}`}>
                            {STATUS_LABELS[incident.status]}
                          </span>
                        </div>
                      </td>

                      {/* Prestataire */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-[10px] font-semibold text-gray-400">
                          {incident.repairProvider ?? '—'}
                        </span>
                      </td>

                      {/* Immobilisation */}
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        {incident.immobilizationDays != null ? (
                          <span className={`text-xs font-black tabular-nums ${
                            incident.immobilizationDays > 10 ? 'text-red-600' :
                            incident.immobilizationDays > 5  ? 'text-amber-600' :
                                                               'text-gray-700'
                          }`}>
                            {incident.immobilizationDays} j
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
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
