import { useState } from 'react'
import {
  Plus, Trash2, CheckCircle2, AlertTriangle,
  Clock, Zap, GitMerge, ChevronDown, ChevronRight,
  RefreshCw, Power, Wrench,
} from 'lucide-react'
import type {
  Vehicle, MaintenanceTemplate,
  VehicleMaintenanceAssignment, AssignmentStatus,
} from '@/types'
import { useVehicleMaintenanceStore, computeAssignmentStatus } from '@/store/vehicleMaintenanceStore'
import { useMaintenanceTemplateStore } from '@/store/maintenanceTemplateStore'

// ─── Config ───────────────────────────────────────────────────────
const STATUS_CONFIG: Record<AssignmentStatus, { label: string; badge: string; icon: React.ElementType }> = {
  OK:      { label: 'OK',            badge: 'bg-green-50 text-green-700 border-green-200',    icon: CheckCircle2  },
  SOON:    { label: 'Bientôt',       badge: 'bg-orange-50 text-orange-700 border-orange-200', icon: Clock         },
  OVERDUE: { label: 'Dépassé',       badge: 'bg-red-50 text-red-700 border-red-200',          icon: AlertTriangle },
  UNKNOWN: { label: 'Non renseigné', badge: 'bg-gray-50 text-gray-500 border-gray-200',       icon: Clock         },
}

const TYPE_CONFIG: Record<string, { label: string; badge: string }> = {
  PREVENTIVE: { label: 'Préventive',     badge: 'bg-blue-100 text-blue-700 border-blue-200'     },
  CORRECTIVE: { label: 'Corrective',     badge: 'bg-orange-100 text-orange-700 border-orange-200' },
  REGULATORY: { label: 'Réglementaire', badge: 'bg-red-100 text-red-700 border-red-200'         },
  SANITAIRE:  { label: 'Sanitaire',     badge: 'bg-green-100 text-green-700 border-green-200'   },
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ─── TriggerSummary ───────────────────────────────────────────────
function TriggerSummary({ template }: { template: MaintenanceTemplate }) {
  const fmtDays = (d: number) => d >= 365 ? `${Math.round(d / 365)} an(s)` : `${Math.round(d / 30)} mois`
  if (template.triggerType === 'HYBRID') return (
    <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-400">
      <GitMerge className="w-3 h-3 text-violet-400" />
      {template.triggerKm?.toLocaleString('fr-FR')} km ou {fmtDays(template.triggerDays!)}
    </span>
  )
  if (template.triggerType === 'KM_ONLY') return (
    <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-400">
      <Zap className="w-3 h-3 text-orange-400" />
      {template.triggerKm?.toLocaleString('fr-FR')} km
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-400">
      <Clock className="w-3 h-3 text-blue-400" />
      {fmtDays(template.triggerDays!)}
    </span>
  )
}

// ─── inputCls ─────────────────────────────────────────────────────
function inputCls() {
  return 'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 hover:border-gray-300 bg-white text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition'
}

// ─── AssignModal ──────────────────────────────────────────────────
function AssignModal({ vehicle, assignedTemplateIds, onAssign, onClose }: {
  vehicle: Vehicle
  assignedTemplateIds: Set<string>
  onAssign: (templateId: string, lastDoneDate: string | null, lastDoneMileage: number | null) => void
  onClose: () => void
}) {
  const { templates } = useMaintenanceTemplateStore()
  const [selectedId,      setSelectedId]      = useState('')
  const [lastDoneDate,    setLastDoneDate]    = useState('')
  const [lastDoneMileage, setLastDoneMileage] = useState('')

  const available = templates.filter((t) =>
    !assignedTemplateIds.has(t.id) &&
    (t.applicableCategories.length === 0 || t.applicableCategories.includes(vehicle.category))
  )
  const selectedTemplate = templates.find((t) => t.id === selectedId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden border border-gray-100">

        {/* En-tête */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="w-1 h-5 rounded-full bg-violet-600" />
          <Wrench className="w-4 h-4 text-violet-500" />
          <div className="flex-1">
            <h2 className="text-sm font-bold text-gray-900">Affecter un cycle</h2>
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 mt-0.5">
              {vehicle.registration} — {vehicle.brand} {vehicle.model}
            </p>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Sélection du cycle */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">
              Cycle <span className="text-red-500">*</span>
            </label>
            {available.length === 0 ? (
              <div className="flex items-center justify-center p-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-xs text-gray-400 text-center">Tous les cycles compatibles sont déjà affectés.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {available.map((t) => (
                  <button key={t.id} type="button" onClick={() => setSelectedId(t.id)}
                    className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                      selectedId === t.id
                        ? 'border-violet-400 bg-violet-50/60 ring-1 ring-violet-300'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-gray-900">{t.name}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${TYPE_CONFIG[t.type]?.badge ?? ''}`}>
                          {TYPE_CONFIG[t.type]?.label ?? t.type}
                        </span>
                        {t.isMandatory && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border bg-red-50 text-red-600 border-red-200">
                            Obligatoire
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5"><TriggerSummary template={t} /></div>
                    </div>
                    {selectedId === t.id && <CheckCircle2 className="w-4 h-4 text-violet-600 flex-shrink-0 mt-0.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dernière intervention */}
          {selectedTemplate && (
            <div className="px-4 py-3.5 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-1 h-3 rounded-full bg-violet-600" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Dernière intervention</span>
                  <span className="text-[10px] text-gray-400">(optionnel)</span>
                </div>
                <p className="text-[10px] text-gray-400 ml-3">Renseignez ces données pour calculer la prochaine échéance automatiquement.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Date</label>
                  <input type="date" value={lastDoneDate} onChange={(e) => setLastDoneDate(e.target.value)} className={inputCls()} />
                </div>
                {selectedTemplate.triggerType !== 'TIME_ONLY' && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Kilométrage</label>
                    <input type="number" min={0} value={lastDoneMileage} onChange={(e) => setLastDoneMileage(e.target.value)}
                      placeholder={`Actuel : ${vehicle.mileage.toLocaleString('fr-FR')} km`} className={inputCls()} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-gray-100 bg-gray-50/50">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button type="button"
            onClick={() => onAssign(selectedId, lastDoneDate || null, lastDoneMileage ? Number(lastDoneMileage) : null)}
            disabled={!selectedId || available.length === 0}
            className="px-4 py-2 text-sm font-bold text-white bg-violet-600 rounded-xl hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Affecter le cycle
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── RecordModal ──────────────────────────────────────────────────
function RecordModal({ assignment, template, vehicle, onRecord, onClose }: {
  assignment: VehicleMaintenanceAssignment
  template:   MaintenanceTemplate
  vehicle:    Vehicle
  onRecord:   (doneDate: string, doneMileage: number | null) => void
  onClose:    () => void
}) {
  void assignment
  const [doneDate,    setDoneDate]    = useState(new Date().toISOString().slice(0, 10))
  const [doneMileage, setDoneMileage] = useState(String(vehicle.mileage))
  const [checklist,   setChecklist]   = useState<Record<string, boolean>>(
    Object.fromEntries(template.checklist.map((i) => [i.id, false]))
  )
  const doneCount = Object.values(checklist).filter(Boolean).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 flex flex-col max-h-[90vh] overflow-hidden border border-gray-100">

        {/* En-tête */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
          <div className="w-1 h-5 rounded-full bg-violet-600" />
          <RefreshCw className="w-4 h-4 text-violet-500" />
          <div className="flex-1">
            <h2 className="text-sm font-bold text-gray-900">Enregistrer une intervention</h2>
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 mt-0.5">
              {template.name} — {vehicle.registration}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Date + km */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input type="date" value={doneDate} onChange={(e) => setDoneDate(e.target.value)} className={inputCls()} />
            </div>
            {template.triggerType !== 'TIME_ONLY' && (
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Kilométrage</label>
                <input type="number" min={0} value={doneMileage} onChange={(e) => setDoneMileage(e.target.value)} className={inputCls()} />
              </div>
            )}
          </div>

          {/* Checklist */}
          {template.checklist.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-3 rounded-full bg-violet-600" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Checklist</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  doneCount === template.checklist.length
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-gray-50 text-gray-500 border-gray-200'
                }`}>
                  {doneCount} / {template.checklist.length}
                </span>
              </div>
              <ul className="space-y-1.5">
                {template.checklist.sort((a, b) => a.order - b.order).map((item) => (
                  <li key={item.id}
                    onClick={() => setChecklist((c) => ({ ...c, [item.id]: !c[item.id] }))}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors select-none">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                      checklist[item.id] ? 'bg-violet-600 border-violet-600' : 'border-gray-300'
                    }`}>
                      {checklist[item.id] && (
                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                          <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-xs font-semibold ${checklist[item.id] ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button type="button" onClick={() => onRecord(doneDate, doneMileage ? Number(doneMileage) : null)}
            disabled={!doneDate}
            className="px-4 py-2 text-sm font-bold text-white bg-violet-600 rounded-xl hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Valider l'intervention
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── AssignmentCard ───────────────────────────────────────────────
function AssignmentCard({ assignment, template, vehicle, onUnassign, onRecord, onToggle }: {
  assignment: VehicleMaintenanceAssignment
  template:   MaintenanceTemplate
  vehicle:    Vehicle
  onUnassign: () => void
  onRecord:   () => void
  onToggle:   () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const status    = computeAssignmentStatus(assignment, vehicle.mileage)
  const cfg       = STATUS_CONFIG[status]
  const Icon      = cfg.icon
  const typeCfg   = TYPE_CONFIG[template.type]

  const kmLeft   = assignment.nextDueMileage != null ? assignment.nextDueMileage - vehicle.mileage : null
  const daysLeft = assignment.nextDueDate
    ? Math.ceil((new Date(assignment.nextDueDate).getTime() - Date.now()) / 86400000)
    : null

  const borderCls =
    status === 'OVERDUE' ? 'border-red-200' :
    status === 'SOON'    ? 'border-orange-200' : 'border-gray-200'

  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-opacity ${borderCls} ${!assignment.isActive ? 'opacity-60' : ''}`}>

      {/* ── En-tête ── */}
      <div className="px-5 py-3.5 flex items-start gap-3">

        {/* Icône statut */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${cfg.badge}`}>
          <Icon className="w-4 h-4" />
        </div>

        {/* Infos */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-gray-900">{template.name}</span>
            {typeCfg && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${typeCfg.badge}`}>
                {typeCfg.label}
              </span>
            )}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${cfg.badge}`}>
              {cfg.label}
            </span>
            {!assignment.isActive && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                Inactif
              </span>
            )}
          </div>

          <div className="mt-0.5"><TriggerSummary template={template} /></div>

          {/* Prochaines échéances */}
          <div className="mt-2 flex items-center gap-4 flex-wrap">
            {assignment.nextDueDate && (
              <span className="text-[11px] text-gray-500">
                Date : <strong className="text-gray-800">{formatDate(assignment.nextDueDate)}</strong>
                {daysLeft != null && (
                  <span className={`ml-1 font-bold ${daysLeft < 0 ? 'text-red-500' : daysLeft <= 30 ? 'text-orange-500' : 'text-gray-400'}`}>
                    ({daysLeft < 0 ? `${Math.abs(daysLeft)}j dépassé` : `J-${daysLeft}`})
                  </span>
                )}
              </span>
            )}
            {assignment.nextDueMileage != null && (
              <span className="text-[11px] text-gray-500">
                Km : <strong className="text-gray-800">{assignment.nextDueMileage.toLocaleString('fr-FR')} km</strong>
                {kmLeft != null && (
                  <span className={`ml-1 font-bold ${kmLeft < 0 ? 'text-red-500' : kmLeft <= 2000 ? 'text-orange-500' : 'text-gray-400'}`}>
                    ({kmLeft < 0 ? `${Math.abs(kmLeft).toLocaleString('fr-FR')} km dépassé` : `${kmLeft.toLocaleString('fr-FR')} km restants`})
                  </span>
                )}
              </span>
            )}
            {!assignment.nextDueDate && !assignment.nextDueMileage && (
              <span className="text-[11px] text-gray-400 italic">Aucune donnée — renseignez la dernière intervention</span>
            )}
          </div>

          {/* Dernière intervention */}
          {assignment.lastDoneDate && (
            <p className="text-[10px] text-gray-400 mt-1">
              Dernière : {formatDate(assignment.lastDoneDate)}
              {assignment.lastDoneMileage != null && ` — ${assignment.lastDoneMileage.toLocaleString('fr-FR')} km`}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {template.checklist.length > 0 && (
            <button onClick={() => setExpanded(!expanded)} title="Checklist"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          )}
          <button onClick={onRecord} title="Enregistrer une intervention"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-green-50 hover:text-green-600 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={onToggle} title={assignment.isActive ? 'Désactiver' : 'Activer'}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <Power className="w-3.5 h-3.5" />
          </button>
          <button onClick={onUnassign} title="Retirer ce cycle"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Checklist dépliée ── */}
      {expanded && template.checklist.length > 0 && (
        <div className="px-5 pb-4 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-3 rounded-full bg-violet-600" />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Checklist</span>
          </div>
          <ul className="space-y-1.5">
            {template.checklist.sort((a, b) => a.order - b.order).map((item) => (
              <li key={item.id} className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded border border-gray-300 flex-shrink-0 bg-white" />
                <span className="text-xs text-gray-600">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────
export default function VehicleMaintenanceTab({ vehicle }: { vehicle: Vehicle }) {
  const { assignments, assign, unassign, recordIntervention, toggleActive } = useVehicleMaintenanceStore()
  const { templates } = useMaintenanceTemplateStore()

  const [showAssignModal,     setShowAssignModal]     = useState(false)
  const [recordingAssignment, setRecordingAssignment] = useState<VehicleMaintenanceAssignment | null>(null)

  const vehicleAssignments  = assignments.filter((a) => a.vehicleId === vehicle.id)
  const assignedTemplateIds = new Set(vehicleAssignments.map((a) => a.templateId))

  const handleAssign = (templateId: string, lastDoneDate: string | null, lastDoneMileage: number | null) => {
    const template = templates.find((t) => t.id === templateId)
    if (!template) return
    assign(vehicle.id, templateId, template, lastDoneDate, lastDoneMileage)
    setShowAssignModal(false)
  }

  const handleRecord = (doneDate: string, doneMileage: number | null) => {
    if (!recordingAssignment) return
    const template = templates.find((t) => t.id === recordingAssignment.templateId)
    if (!template) return
    recordIntervention(recordingAssignment.id, doneDate, doneMileage, template)
    setRecordingAssignment(null)
  }

  const handleUnassign = (id: string) => {
    if (!window.confirm('Retirer ce cycle de maintenance du véhicule ?')) return
    unassign(id)
  }

  const ORDER: Record<AssignmentStatus, number> = { OVERDUE: 0, SOON: 1, UNKNOWN: 2, OK: 3 }
  const sorted = [...vehicleAssignments].sort((a, b) =>
    ORDER[computeAssignmentStatus(a, vehicle.mileage)] - ORDER[computeAssignmentStatus(b, vehicle.mileage)]
  )

  const recordingTemplate = recordingAssignment
    ? templates.find((t) => t.id === recordingAssignment.templateId)
    : undefined

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-gray-800">
            {vehicleAssignments.length} cycle{vehicleAssignments.length > 1 ? 's' : ''} affecté{vehicleAssignments.length > 1 ? 's' : ''}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Kilométrage actuel : <strong className="text-gray-600">{vehicle.mileage.toLocaleString('fr-FR')} km</strong>
          </p>
        </div>
        <button onClick={() => setShowAssignModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Affecter un cycle
        </button>
      </div>

      {/* ── État vide ── */}
      {sorted.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-12 text-center">
          <RefreshCw className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-400">Aucun cycle affecté</p>
          <p className="text-xs text-gray-300 mt-1">Affectez des cycles pour suivre les échéances automatiquement</p>
          <button onClick={() => setShowAssignModal(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors">
            <Plus className="w-4 h-4" />
            Affecter un premier cycle
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((assignment) => {
            const template = templates.find((t) => t.id === assignment.templateId)
            if (!template) return null
            return (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                template={template}
                vehicle={vehicle}
                onUnassign={() => handleUnassign(assignment.id)}
                onRecord={() => setRecordingAssignment(assignment)}
                onToggle={() => toggleActive(assignment.id)}
              />
            )
          })}
        </div>
      )}

      {/* ── Modales ── */}
      {showAssignModal && (
        <AssignModal
          vehicle={vehicle}
          assignedTemplateIds={assignedTemplateIds}
          onAssign={handleAssign}
          onClose={() => setShowAssignModal(false)}
        />
      )}

      {recordingAssignment && recordingTemplate && (
        <RecordModal
          assignment={recordingAssignment}
          template={recordingTemplate}
          vehicle={vehicle}
          onRecord={handleRecord}
          onClose={() => setRecordingAssignment(null)}
        />
      )}
    </div>
  )
}
