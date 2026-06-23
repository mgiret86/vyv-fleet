import { Edit, Trash2, MapPin, User, Shield, FileText, Users, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Incident, IncidentType, IncidentSeverity, IncidentStatus } from '@/data/mockIncidents'

// ─── Config ───────────────────────────────────────────────────────
const TYPE_CONFIG: Record<IncidentType, { pill: string; label: string }> = {
  ACCIDENT:  { pill: 'bg-red-50 text-red-700 border-red-200',         label: 'Accident'   },
  THEFT:     { pill: 'bg-violet-50 text-violet-700 border-violet-200', label: 'Vol'        },
  VANDALISM: { pill: 'bg-amber-50 text-amber-700 border-amber-200',   label: 'Vandalisme' },
  BREAKDOWN: { pill: 'bg-gray-100 text-gray-600 border-gray-200',     label: 'Panne'      },
}

const SEVERITY_CONFIG: Record<IncidentSeverity, { bar: string; pill: string; label: string }> = {
  CRITICAL: { bar: 'bg-red-500',    pill: 'bg-red-50 text-red-700 border-red-200',         label: 'Critique' },
  MAJOR:    { bar: 'bg-orange-500', pill: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Majeur'   },
  MINOR:    { bar: 'bg-amber-400',  pill: 'bg-amber-50 text-amber-700 border-amber-200',   label: 'Mineur'   },
}

const STATUS_CONFIG: Record<IncidentStatus, { pill: string; dot: string; label: string }> = {
  OPEN:        { pill: 'bg-blue-50 text-blue-700 border-blue-200',       dot: 'bg-blue-500',   label: 'Ouvert'   },
  IN_PROGRESS: { pill: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500', label: 'En cours' },
  CLOSED:      { pill: 'bg-gray-100 text-gray-500 border-gray-200',      dot: 'bg-gray-400',   label: 'Clos'     },
}

// ─── Helpers ──────────────────────────────────────────────────────
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function formatCurrency(val: number | null): string {
  if (val === null) return '—'
  return val.toLocaleString('fr-FR') + ' €'
}

// ─── MetaRow ──────────────────────────────────────────────────────
function MetaRow({ icon: Icon, label, value, highlight }: {
  icon: React.ElementType
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-2.5 h-2.5 text-gray-400" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className={`text-xs font-semibold mt-0.5 ${highlight ? 'text-orange-600' : 'text-gray-700'}`}>
          {value}
        </p>
      </div>
    </div>
  )
}

// ─── CostCell ─────────────────────────────────────────────────────
function CostCell({ label, value, diff }: { label: string; value: string; diff?: boolean | null }) {
  return (
    <div className="flex-1 px-4 py-3 border-r border-gray-100 last:border-0 min-w-[110px]">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-xs font-black ${
        diff === true  ? 'text-red-600' :
        diff === false ? 'text-green-600' :
                         'text-gray-900'
      }`}>
        {value}
      </p>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────
interface IncidentCardProps {
  incident: Incident
  onEdit:   (incident: Incident) => void
  onDelete: (id: string) => void
}

export default function IncidentCard({ incident, onEdit, onDelete }: IncidentCardProps) {
  const typeCfg     = TYPE_CONFIG[incident.type]
  const severityCfg = SEVERITY_CONFIG[incident.severity]
  const statusCfg   = STATUS_CONFIG[incident.status]

  const costDiff =
    incident.realRepairCost !== null && incident.estimatedRepairCost !== null
      ? incident.realRepairCost - incident.estimatedRepairCost
      : null

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 overflow-hidden">
      <div className="flex">

        {/* Barre sévérité */}
        <div className={`w-1 flex-shrink-0 ${severityCfg.bar}`} />

        <div className="flex-1 min-w-0">

          {/* ── En-tête ── */}
          <div className="px-4 pt-3.5 pb-3 border-b border-gray-100">
            <div className="flex items-start justify-between gap-3">

              {/* Gauche */}
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <Link
                  to={`/vehicles/${incident.vehicleId}`}
                  className="font-mono text-[11px] font-bold text-violet-600 hover:text-violet-800 hover:underline underline-offset-2 transition-colors"
                >
                  {incident.vehicleRegistration}
                </Link>
                <span className="text-gray-300 text-[10px]">·</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                  {incident.agencyName}
                </span>
                <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeCfg.pill}`}>
                  {typeCfg.label}
                </span>
                <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border ${severityCfg.pill}`}>
                  {severityCfg.label}
                </span>
                <div className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusCfg.dot}`} />
                  <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.pill}`}>
                    {statusCfg.label}
                  </span>
                </div>
              </div>

              {/* Droite */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-[10px] font-semibold text-gray-400">{formatDate(incident.date)}</span>
                <button
                  onClick={() => onEdit(incident)}
                  className="w-7 h-7 rounded-lg hover:bg-violet-50 flex items-center justify-center text-gray-400 hover:text-violet-600 transition-colors"
                  title="Modifier"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(incident.id)}
                  className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ── Corps ── */}
          <div className="px-4 py-3.5 space-y-3.5">

            {/* Description */}
            {incident.description && (
              <p className="text-xs font-medium text-gray-600 leading-relaxed">{incident.description}</p>
            )}

            {/* Méta-infos */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {incident.location && (
                <MetaRow icon={MapPin} label="Lieu" value={incident.location} />
              )}
              {incident.driverName && (
                <MetaRow icon={User} label="Conducteur" value={incident.driverName} />
              )}
              <MetaRow
                icon={Users}
                label="Patient à bord"
                value={incident.patientInVehicle ? 'Oui' : 'Non'}
                highlight={incident.patientInVehicle}
              />
              <MetaRow
                icon={Shield}
                label="Tiers impliqué"
                value={incident.thirdPartyInvolved ? 'Oui' : 'Non'}
                highlight={incident.thirdPartyInvolved}
              />
              {incident.insuranceReference && (
                <MetaRow icon={FileText} label="Réf. assurance" value={incident.insuranceReference} />
              )}
            </div>

            {/* Coûts */}
            <div className="flex flex-wrap border border-gray-100 rounded-xl overflow-hidden">
              <CostCell label="Coût estimé" value={formatCurrency(incident.estimatedRepairCost)} />
              <CostCell label="Coût réel"   value={formatCurrency(incident.realRepairCost)} />
              {costDiff !== null && (
                <CostCell
                  label="Écart"
                  value={`${costDiff > 0 ? '+' : ''}${formatCurrency(costDiff)}`}
                  diff={costDiff > 0 ? true : costDiff < 0 ? false : null}
                />
              )}
            </div>

            {/* Notes */}
            {incident.notes && (
              <div className="flex items-start gap-2 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-100">
                <AlertTriangle className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] font-semibold text-gray-500 leading-relaxed">{incident.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
