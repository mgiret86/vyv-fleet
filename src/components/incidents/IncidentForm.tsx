import { useAppStore } from '@/store/useAppStore'
import { useVehicleStore } from '@/store/vehicleStore'
import { useState, useEffect } from 'react'
import { AlertTriangle, X, Car, Info, Shield, Wrench } from 'lucide-react'
import type { Incident, IncidentType, IncidentSeverity, IncidentStatus } from '@/data/mockIncidents'

// ─── État initial ─────────────────────────────────────────────────
function buildInitial(incident?: Incident): Incident {
  if (incident) {
    return {
      ...incident,
      date:            incident.date            ? new Date(incident.date).toISOString().split('T')[0]            : '',
      declarationDate: incident.declarationDate ? new Date(incident.declarationDate).toISOString().split('T')[0] : '',
    }
  }
  return {
    id:                  '',
    vehicleId:           '',
    vehicleRegistration: '',
    agencyId:            '',
    agencyName:          '',
    date:                '',
    declarationDate:     '',
    type:                'ACCIDENT'  as IncidentType,
    severity:            'MINOR'     as IncidentSeverity,
    status:              'OPEN'      as IncidentStatus,
    description:         '',
    location:            '',
    driverName:          null,
    driverResponsible:   false,
    injuredPersons:      0,
    patientInVehicle:    false,
    thirdPartyInvolved:  false,
    thirdPartyInsurance: null,
    insuranceReference:  null,
    estimatedRepairCost: null,
    realRepairCost:      null,
    immobilizationDays:  null,
    repairProvider:      null,
    notes:               null,
  }
}

// ─── Sous-composants ──────────────────────────────────────────────
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function inputCls(disabled?: boolean): string {
  const base = 'w-full px-3 py-2 text-sm rounded-lg border transition focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder-gray-300'
  return disabled
    ? `${base} bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200`
    : `${base} border-gray-200 hover:border-gray-300 bg-white text-gray-900`
}

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-1 h-4 rounded-full bg-violet-600" />
      <Icon className="w-3.5 h-3.5 text-violet-500" />
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>
    </div>
  )
}

function CheckRow({ id, name, label, checked, onChange }: {
  id:       string
  name:     string
  label:    string
  checked:  boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <label htmlFor={id} className="flex items-center gap-2.5 cursor-pointer group">
      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
        checked ? 'bg-violet-600 border-violet-600' : 'border-gray-300 bg-white group-hover:border-violet-400'
      }`}>
        {checked && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <input type="checkbox" id={id} name={name} checked={checked} onChange={onChange} className="sr-only" />
      <span className="text-xs font-semibold text-gray-700">{label}</span>
    </label>
  )
}

// ─── Composant principal ──────────────────────────────────────────
type IncidentFormProps = {
  incident?: Incident
  onClose:   () => void
  onSave:    (incident: Incident) => void
}

export default function IncidentForm({ incident, onClose, onSave }: IncidentFormProps) {
  const isEditMode    = !!incident
  const agencies      = useAppStore((s) => s.agencies)
  const vehicles      = useVehicleStore((s) => s.vehicles)
  const fetchVehicles = useVehicleStore((s) => s.fetchVehicles)
  const [form, setForm] = useState<Incident>(() => buildInitial(incident))

  useEffect(() => { if (vehicles.length === 0) fetchVehicles() }, [vehicles.length, fetchVehicles])
  useEffect(() => { setForm(buildInitial(incident)) }, [incident])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    if (name === 'agencyId') {
      const agency = agencies.find((a) => a.id === value)
      setForm((p) => ({ ...p, agencyId: value, agencyName: agency?.name ?? '' }))
      return
    }
    if (type === 'number') {
      const parsed = parseFloat(value)
      setForm((p) => ({ ...p, [name]: isNaN(parsed) ? null : parsed }))
      return
    }
    setForm((p) => ({ ...p, [name]: value }))
  }

  function handleCheckbox(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, checked } = e.target
    setForm((p) => ({ ...p, [name]: checked }))
  }

  function handleVehicleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = vehicles.find((x) => x.id === e.target.value)
    if (!v) return
    setForm((p) => ({
      ...p,
      vehicleId:           v.id,
      vehicleRegistration: v.registration,
      agencyId:            v.agencyId,
      agencyName:          v.agencyName ?? '',
    }))
  }

  function handleSave() {
    if (!form.vehicleRegistration || !form.date || !form.type || !form.severity || !form.status) {
      alert('Veuillez remplir tous les champs obligatoires.')
      return
    }
    const toSave: Incident = { ...form }
    if (!isEditMode) toSave.id = `inc-${Date.now()}`
    onSave(toSave)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-6xl flex flex-col overflow-hidden">

        {/* ── En-tête ── */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
          <div className="w-1 h-5 rounded-full bg-violet-600" />
          <AlertTriangle className="w-4 h-4 text-violet-500" />
          <div className="flex-1">
            <h2 className="text-sm font-bold text-gray-900">
              {isEditMode ? 'Modifier le sinistre' : 'Nouveau sinistre'}
            </h2>
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 mt-0.5">
              {isEditMode ? 'Modifiez les informations ci-dessous' : 'Renseignez les informations du sinistre'}
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── Corps — grille 4 colonnes ── */}
        <div className="p-5 grid grid-cols-4 gap-x-5">

          {/* ══ Col 1 : Véhicule & Qualification ══ */}
          <div className="space-y-3">
            <SectionHeader icon={Car} label="Véhicule & Qualification" />
            <div className="space-y-2">

              <div>
                <FieldLabel required>Véhicule</FieldLabel>
                <select value={form.vehicleId} onChange={handleVehicleChange} className={inputCls()}>
                  <option value="">Sélectionner un véhicule</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registration} — {v.brand} {v.model}
                    </option>
                  ))}
                </select>
              </div>

              {form.agencyName && (
                <div>
                  <FieldLabel>Agence</FieldLabel>
                  <input type="text" value={form.agencyName} readOnly className={inputCls(true)} />
                </div>
              )}

              <div>
                <FieldLabel required>Date du sinistre</FieldLabel>
                <input type="date" name="date" value={form.date} onChange={handleChange} className={inputCls()} />
              </div>

              <div>
                <FieldLabel>Date de déclaration</FieldLabel>
                <input type="date" name="declarationDate" value={form.declarationDate} onChange={handleChange} className={inputCls()} />
              </div>

              <div>
                <FieldLabel required>Type</FieldLabel>
                <select name="type" value={form.type} onChange={handleChange} className={inputCls()}>
                  <option value="ACCIDENT">Accident</option>
                  <option value="THEFT">Vol</option>
                  <option value="VANDALISM">Vandalisme</option>
                  <option value="BREAKDOWN">Panne</option>
                </select>
              </div>

              <div>
                <FieldLabel required>Gravité</FieldLabel>
                <select name="severity" value={form.severity} onChange={handleChange} className={inputCls()}>
                  <option value="CRITICAL">Critique</option>
                  <option value="MAJOR">Majeure</option>
                  <option value="MINOR">Mineure</option>
                </select>
              </div>

              <div>
                <FieldLabel required>Statut</FieldLabel>
                <select name="status" value={form.status} onChange={handleChange} className={inputCls()}>
                  <option value="OPEN">Ouvert</option>
                  <option value="IN_PROGRESS">En cours</option>
                  <option value="CLOSED">Fermé</option>
                </select>
              </div>
            </div>
          </div>

          {/* ══ Col 2 : Détails de l'incident ══ */}
          <div className="space-y-3">
            <SectionHeader icon={Info} label="Détails de l'incident" />
            <div className="space-y-2">

              <div>
                <FieldLabel>Description</FieldLabel>
                <textarea name="description" value={form.description} onChange={handleChange} rows={4}
                  placeholder="Décrivez les circonstances…"
                  className={`${inputCls()} resize-none`} />
              </div>

              <div>
                <FieldLabel>Lieu</FieldLabel>
                <input type="text" name="location" value={form.location} onChange={handleChange}
                  placeholder="Adresse, route…" className={inputCls()} />
              </div>

              <div>
                <FieldLabel>Conducteur</FieldLabel>
                <input type="text" name="driverName" value={form.driverName ?? ''} onChange={handleChange}
                  placeholder="Prénom Nom" className={inputCls()} />
              </div>

              <div>
                <FieldLabel>Personnes blessées</FieldLabel>
                <input type="number" name="injuredPersons" value={form.injuredPersons} onChange={handleChange}
                  min="0" className={inputCls()} />
              </div>

              <div className="space-y-2.5 pt-1">
                <CheckRow id="driverResponsible" name="driverResponsible"
                  label="Conducteur responsable"
                  checked={form.driverResponsible} onChange={handleCheckbox} />
                <CheckRow id="patientInVehicle" name="patientInVehicle"
                  label="Patient dans le véhicule"
                  checked={form.patientInVehicle} onChange={handleCheckbox} />
              </div>
            </div>
          </div>

          {/* ══ Col 3 : Tiers & Assurance ══ */}
          <div className="space-y-3">
            <SectionHeader icon={Shield} label="Tiers & Assurance" />
            <div className="space-y-2">

              <div className="pt-1">
                <CheckRow id="thirdPartyInvolved" name="thirdPartyInvolved"
                  label="Tiers impliqué"
                  checked={form.thirdPartyInvolved} onChange={handleCheckbox} />
              </div>

              {form.thirdPartyInvolved && (
                <div>
                  <FieldLabel>Assurance du tiers</FieldLabel>
                  <input type="text" name="thirdPartyInsurance"
                    value={form.thirdPartyInsurance ?? ''} onChange={handleChange}
                    placeholder="Nom assureur, n° contrat…" className={inputCls()} />
                </div>
              )}

              <div>
                <FieldLabel>Référence assurance</FieldLabel>
                <input type="text" name="insuranceReference"
                  value={form.insuranceReference ?? ''} onChange={handleChange}
                  placeholder="Ex. ASS-2024-00123" className={inputCls()} />
              </div>

              <div>
                <FieldLabel>Notes</FieldLabel>
                <textarea name="notes" value={form.notes ?? ''} onChange={handleChange} rows={5}
                  placeholder="Observations complémentaires…"
                  className={`${inputCls()} resize-none`} />
              </div>
            </div>
          </div>

          {/* ══ Col 4 : Réparation & Coûts ══ */}
          <div className="space-y-3">
            <SectionHeader icon={Wrench} label="Réparation & Coûts" />
            <div className="space-y-2">

              <div>
                <FieldLabel>Coût estimé (€)</FieldLabel>
                <input type="number" name="estimatedRepairCost"
                  value={form.estimatedRepairCost ?? ''} onChange={handleChange}
                  min="0" step="0.01" placeholder="0.00" className={inputCls()} />
              </div>

              <div>
                <FieldLabel>Coût réel (€)</FieldLabel>
                <input type="number" name="realRepairCost"
                  value={form.realRepairCost ?? ''} onChange={handleChange}
                  min="0" step="0.01" placeholder="0.00" className={inputCls()} />
              </div>

              {/* Écart live */}
              {form.estimatedRepairCost !== null && form.realRepairCost !== null && (
                (() => {
                  const diff = form.realRepairCost - form.estimatedRepairCost
                  return (
                    <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                      diff > 0 ? 'bg-red-50 border-red-200' :
                      diff < 0 ? 'bg-green-50 border-green-200' :
                                 'bg-gray-50 border-gray-200'
                    }`}>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Écart</span>
                      <span className={`text-sm font-black ${
                        diff > 0 ? 'text-red-600' : diff < 0 ? 'text-green-700' : 'text-gray-600'
                      }`}>
                        {diff > 0 ? '+' : ''}{diff.toLocaleString('fr-FR')} €
                      </span>
                    </div>
                  )
                })()
              )}

              <div>
                <FieldLabel>Jours d'immobilisation</FieldLabel>
                <input type="number" name="immobilizationDays"
                  value={form.immobilizationDays ?? ''} onChange={handleChange}
                  min="0" placeholder="0" className={inputCls()} />
              </div>

              <div>
                <FieldLabel>Prestataire de réparation</FieldLabel>
                <input type="text" name="repairProvider"
                  value={form.repairProvider ?? ''} onChange={handleChange}
                  placeholder="Nom du garage…" className={inputCls()} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
          <p className="text-[10px] text-gray-400">
            <span className="text-red-500">*</span> Champs obligatoires
          </p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              Annuler
            </button>
            <button type="button" onClick={handleSave}
              className="px-4 py-2 text-sm font-bold text-white bg-violet-600 rounded-xl hover:bg-violet-700 transition-colors">
              {isEditMode ? 'Mettre à jour' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
