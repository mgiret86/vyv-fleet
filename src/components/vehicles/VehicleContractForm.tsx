import React, { useState, useEffect } from 'react'
import { X, Euro, Building2, FileText, Calendar, Gauge, Settings } from 'lucide-react'
import type { VehicleContract, VehicleContractType, ContractStatus } from '@/types'
import type { ContractFormData } from '@/store/vehicleContractStore'

// ─── Options ──────────────────────────────────────────────────────
const TYPE_OPTIONS: { value: VehicleContractType; label: string }[] = [
  { value: 'LLD',             label: 'LLD — Location Longue Durée'         },
  { value: 'LOA',             label: "LOA — Location avec Option d'Achat"  },
  { value: 'CREDIT_BAIL',     label: 'Crédit-bail'                         },
  { value: 'CREDIT_BANCAIRE', label: 'Crédit bancaire'                     },
  { value: 'EN_PROPRIETE',    label: 'En propriété'                        },
]

const STATUS_OPTIONS: { value: ContractStatus; label: string }[] = [
  { value: 'ACTIVE',     label: 'Actif'     },
  { value: 'DRAFT',      label: 'Brouillon' },
  { value: 'TERMINATED', label: 'Résilié'   },
  { value: 'EXPIRED',    label: 'Expiré'    },
]

// ─── FormState ────────────────────────────────────────────────────
type FormState = {
  type: VehicleContractType; status: ContractStatus
  lessorName: string; contractRef: string
  startDate: string; endDate: string; durationMonths: string
  monthlyRentHT: string; deposit: string; residualValue: string
  startMileage: string; contractedKmPerYear: string; excessKmCostPerKm: string
  monthlyInsuranceCost: string
  maintenance: boolean; tires: boolean; insurance: boolean; assistance: boolean
  notes: string
}
type Errors = Partial<Record<keyof FormState, string>>

const DEFAULT: FormState = {
  type: 'LLD', status: 'ACTIVE', lessorName: '', contractRef: '',
  startDate: '', endDate: '', durationMonths: '',
  monthlyRentHT: '', deposit: '0', residualValue: '',
  startMileage: '', contractedKmPerYear: '', excessKmCostPerKm: '',
  monthlyInsuranceCost: '', maintenance: false, tires: false, insurance: false, assistance: false,
  notes: '',
}

function contractToForm(c: VehicleContract): FormState {
  return {
    type: c.type, status: c.status, lessorName: c.lessorName, contractRef: c.contractRef,
    startDate: c.startDate.split('T')[0], endDate: c.endDate ? c.endDate.split('T')[0] : '',
    durationMonths: String(c.durationMonths), monthlyRentHT: String(c.monthlyRentHT),
    deposit: String(c.deposit),
    residualValue:        c.residualValue        != null ? String(c.residualValue)        : '',
    startMileage:         c.startMileage         != null ? String(c.startMileage)         : '',
    contractedKmPerYear:  c.contractedKmPerYear  != null ? String(c.contractedKmPerYear)  : '',
    excessKmCostPerKm:    c.excessKmCostPerKm    != null ? String(c.excessKmCostPerKm)    : '',
    monthlyInsuranceCost: c.monthlyInsuranceCost != null ? String(c.monthlyInsuranceCost) : '',
    maintenance: c.includedServices.maintenance, tires: c.includedServices.tires,
    insurance: c.includedServices.insurance, assistance: c.includedServices.assistance,
    notes: c.notes ?? '',
  }
}

function formToData(form: FormState, vehicleId: string): ContractFormData {
  const isOwned = form.type === 'EN_PROPRIETE'
  return {
    vehicleId, type: form.type, status: form.status,
    lessorName:   isOwned ? 'En propriété' : form.lessorName.trim(),
    contractRef:  isOwned ? '' : form.contractRef.trim(),
    startDate: form.startDate, endDate: form.endDate || form.startDate,
    durationMonths: parseInt(form.durationMonths) || 0,
    monthlyRentHT: isOwned ? 0 : (parseFloat(form.monthlyRentHT) || 0),
    deposit:       isOwned ? 0 : (parseFloat(form.deposit) || 0),
    residualValue:        (!isOwned && form.residualValue !== '')        ? parseFloat(form.residualValue)        : null,
    startMileage:         form.startMileage !== ''                       ? parseInt(form.startMileage)           : null,
    contractedKmPerYear:  form.contractedKmPerYear !== ''                ? parseInt(form.contractedKmPerYear)    : null,
    excessKmCostPerKm:    form.excessKmCostPerKm !== ''                  ? parseFloat(form.excessKmCostPerKm)    : null,
    monthlyInsuranceCost: (!isOwned && form.monthlyInsuranceCost !== '') ? parseFloat(form.monthlyInsuranceCost) : null,
    includedServices: {
      maintenance: isOwned ? false : form.maintenance,
      tires:       isOwned ? false : form.tires,
      insurance:   isOwned ? false : form.insurance,
      assistance:  isOwned ? false : form.assistance,
    },
    notes: form.notes.trim() !== '' ? form.notes.trim() : null,
  }
}

// ─── Sous-composants ──────────────────────────────────────────────
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function Field({ error, children }: { error?: string; children: React.ReactNode }) {
  return (
    <div>
      {children}
      {error && <p className="text-[10px] text-red-500 mt-0.5 font-medium">{error}</p>}
    </div>
  )
}

function inputCls(error?: string, readonly?: boolean) {
  if (readonly) return 'w-full px-3 py-2 text-sm rounded-lg border border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
  return `w-full px-3 py-2 text-sm rounded-lg border transition focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder-gray-300 ${
    error ? 'border-red-300 bg-red-50/30 text-gray-900' : 'border-gray-200 hover:border-gray-300 bg-white text-gray-900'
  }`
}

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <div className="w-1 h-4 rounded-full bg-violet-600" />
      <Icon className="w-3.5 h-3.5 text-violet-500" />
      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────
interface VehicleContractFormProps {
  vehicleId: string
  contract?: VehicleContract
  onClose:   () => void
  onSave:    (data: ContractFormData) => void
}

// ─── Composant principal ──────────────────────────────────────────
export default function VehicleContractForm({ vehicleId, contract, onClose, onSave }: VehicleContractFormProps) {
  const isEdit = Boolean(contract)
  const [form,   setForm]   = useState<FormState>(contract ? contractToForm(contract) : DEFAULT)
  const [errors, setErrors] = useState<Errors>({})

  useEffect(() => { setForm(contract ? contractToForm(contract) : DEFAULT); setErrors({}) }, [contract])

  useEffect(() => {
    if (!form.startDate || !form.endDate) return
    const start = new Date(form.startDate), end = new Date(form.endDate)
    if (end <= start) return
    const months = Math.round((end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()))
    setForm((f) => ({ ...f, durationMonths: String(months) }))
  }, [form.startDate, form.endDate])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    if (errors[name as keyof FormState]) setErrors((p) => { const n = { ...p }; delete n[name as keyof FormState]; return n })
  }

  function handleCheck(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, checked } = e.target
    setForm((f) => ({ ...f, [name]: checked }))
  }

  function validate(): boolean {
    const next: Errors = {}
    const isOwned = form.type === 'EN_PROPRIETE'
    if (!form.startDate) next.startDate = 'Obligatoire'
    if (!isOwned) {
      if (!form.lessorName.trim())    next.lessorName    = 'Obligatoire'
      if (!form.contractRef.trim())   next.contractRef   = 'Obligatoire'
      if (!form.endDate)              next.endDate       = 'Obligatoire'
      if (!form.monthlyRentHT || parseFloat(form.monthlyRentHT) <= 0) next.monthlyRentHT = 'Valeur > 0'
      if (form.startDate && form.endDate && form.endDate <= form.startDate) next.endDate = 'Doit être postérieure au début'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSave() { if (validate()) onSave(formToData(form, vehicleId)) }

  // Flags
  const isOwned    = form.type === 'EN_PROPRIETE'
  const needsKm    = form.type === 'LOA' || form.type === 'LLD'
  const hasResidual = form.type === 'LOA' || form.type === 'CREDIT_BAIL'
  const hasBorrowed = form.type === 'CREDIT_BANCAIRE'

  const lessorLabel       = form.type === 'CREDIT_BANCAIRE' ? 'Établissement bancaire' : 'Bailleur / Organisme'
  const lessorPlaceholder = form.type === 'CREDIT_BANCAIRE' ? 'Ex : BNP Paribas…'     : 'Ex : ALD Automotive…'
  const rentLabel         = form.type === 'CREDIT_BANCAIRE' ? 'Mensualité HT (€)'      : 'Loyer mensuel HT (€)'
  const depositLabel      = form.type === 'CREDIT_BANCAIRE' ? 'Apport initial (€)'     : 'Dépôt de garantie (€)'

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-4xl flex flex-col overflow-hidden">

        {/* ── En-tête ── */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
          <div className="w-1 h-5 rounded-full bg-violet-600" />
          <Euro className="w-4 h-4 text-violet-500" />
          <div className="flex-1">
            <h2 className="text-sm font-bold text-gray-900">
              {isEdit ? 'Modifier le contrat' : 'Nouveau contrat de financement'}
            </h2>
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 mt-0.5">
              {isEdit ? 'Modifiez les informations ci-dessous' : 'Renseignez les informations du contrat'}
            </p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── Corps — grille 3 colonnes ── */}
        <div className="p-5 grid grid-cols-3 gap-x-5 gap-y-0 flex-1 min-h-0">

          {/* ══ Colonne 1 : Type + Identification + Dates ══ */}
          <div className="space-y-3">

            {/* Type & statut */}
            <div>
              <SectionHeader icon={Settings} label="Type de financement" />
              <div className="space-y-2">
                <Field error={errors.type}>
                  <Label required>Type de contrat</Label>
                  <select name="type" value={form.type} onChange={handleChange} className={inputCls()}>
                    {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
                <Field error={errors.status}>
                  <Label>Statut</Label>
                  <select name="status" value={form.status} onChange={handleChange} className={inputCls()}>
                    {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
              </div>
            </div>

            {/* Bannière EN_PROPRIETE */}
            {isOwned && (
              <div className="px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-bold text-blue-700 mb-0.5">Véhicule en propriété</p>
                <p className="text-[10px] text-blue-600 leading-relaxed">
                  Seule la date d'acquisition est obligatoire. La date de cession sera renseignée lors de la sortie du véhicule.
                </p>
              </div>
            )}

            {/* Identification — masquée EN_PROPRIETE */}
            {!isOwned && (
              <div>
                <SectionHeader icon={FileText} label="Identification" />
                <div className="space-y-2">
                  <Field error={errors.lessorName}>
                    <Label required>{lessorLabel}</Label>
                    <input type="text" name="lessorName" value={form.lessorName} onChange={handleChange}
                      placeholder={lessorPlaceholder} className={inputCls(errors.lessorName)} />
                  </Field>
                  <Field error={errors.contractRef}>
                    <Label required>Référence contrat</Label>
                    <input type="text" name="contractRef" value={form.contractRef} onChange={handleChange}
                      placeholder="Ex : ALD-2024-00142" className={inputCls(errors.contractRef)} />
                  </Field>
                </div>
              </div>
            )}

            {/* Dates */}
            <div>
              <SectionHeader icon={Calendar} label={isOwned ? 'Dates de possession' : 'Durée du contrat'} />
              <div className="space-y-2">
                <Field error={errors.startDate}>
                  <Label required>{isOwned ? "Date d'acquisition" : 'Date de début'}</Label>
                  <input type="date" name="startDate" value={form.startDate} onChange={handleChange} className={inputCls(errors.startDate)} />
                </Field>
                <Field error={errors.endDate}>
                  <Label required={!isOwned}>{isOwned ? 'Date de cession' : 'Date de fin'}</Label>
                  <input type="date" name="endDate" value={form.endDate} onChange={handleChange} className={inputCls(isOwned ? undefined : errors.endDate)} />
                  {isOwned && <p className="text-[10px] text-gray-400 mt-0.5">Facultatif — à renseigner lors de la sortie du parc</p>}
                </Field>
                {!isOwned && (
                  <Field>
                    <Label>Durée (mois)</Label>
                    <input type="number" name="durationMonths" value={form.durationMonths} readOnly
                      placeholder="Calculée auto." className={inputCls(undefined, true)} />
                  </Field>
                )}
              </div>
            </div>
          </div>

          {/* ══ Colonne 2 : Finances + Kilométrage ══ */}
          <div className="space-y-3">

            {/* Conditions financières — masquées EN_PROPRIETE */}
            {!isOwned ? (
              <div>
                <SectionHeader icon={Euro} label="Conditions financières" />
                <div className="space-y-2">
                  <Field error={errors.monthlyRentHT}>
                    <Label required>{rentLabel}</Label>
                    <input type="number" name="monthlyRentHT" value={form.monthlyRentHT} onChange={handleChange}
                      placeholder="Ex : 680" min="0" step="0.01" className={inputCls(errors.monthlyRentHT)} />
                  </Field>
                  <Field>
                    <Label>Assurance mensuelle (€)</Label>
                    <input type="number" name="monthlyInsuranceCost" value={form.monthlyInsuranceCost} onChange={handleChange}
                      placeholder="Ex : 145" min="0" step="0.01" className={inputCls()} />
                  </Field>
                  <Field>
                    <Label>{depositLabel}</Label>
                    <input type="number" name="deposit" value={form.deposit} onChange={handleChange}
                      placeholder="0" min="0" step="0.01" className={inputCls()} />
                  </Field>
                  {(hasResidual || hasBorrowed) && (
                    <Field>
                      <Label>{hasBorrowed ? 'Montant emprunté (€)' : "Valeur résiduelle / Option d'achat (€)"}</Label>
                      <input type="number" name="residualValue" value={form.residualValue} onChange={handleChange}
                        placeholder={hasBorrowed ? 'Ex : 35 000' : 'Ex : 8 500'} min="0" step="0.01" className={inputCls()} />
                    </Field>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-center px-4">
                <Euro className="w-8 h-8 text-gray-200 mb-2" />
                <p className="text-xs text-gray-400">Aucune condition financière pour un véhicule en propriété.</p>
              </div>
            )}

            {/* Kilométrique — LOA / LLD */}
            {needsKm && (
              <div>
                <SectionHeader icon={Gauge} label="Forfait kilométrique" />
                <div className="space-y-2">
                  <Field>
                    <Label>Km au démarrage</Label>
                    <input type="number" name="startMileage" value={form.startMileage} onChange={handleChange}
                      placeholder="Ex : 12 000" min="0" className={inputCls()} />
                  </Field>
                  <Field>
                    <Label>Km contractuels / an</Label>
                    <input type="number" name="contractedKmPerYear" value={form.contractedKmPerYear} onChange={handleChange}
                      placeholder="Ex : 40 000" min="0" className={inputCls()} />
                  </Field>
                  <Field>
                    <Label>Coût km excédentaire (€/km)</Label>
                    <input type="number" name="excessKmCostPerKm" value={form.excessKmCostPerKm} onChange={handleChange}
                      placeholder="Ex : 0.12" min="0" step="0.001" className={inputCls()} />
                  </Field>
                </div>
              </div>
            )}
          </div>

          {/* ══ Colonne 3 : Services inclus + Notes ══ */}
          <div className="space-y-3">

            {/* Services inclus — masqués EN_PROPRIETE */}
            {!isOwned ? (
              <div>
                <SectionHeader icon={Building2} label="Services inclus" />
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { name: 'maintenance', label: 'Entretien'    },
                    { name: 'tires',       label: 'Pneumatiques' },
                    { name: 'insurance',   label: 'Assurance'    },
                    { name: 'assistance',  label: 'Assistance'   },
                  ] as const).map(({ name, label }) => (
                    <label
                      key={name}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors select-none ${
                        form[name]
                          ? 'bg-violet-50 border-violet-300 text-violet-700'
                          : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <input type="checkbox" name={name} checked={form[name]} onChange={handleCheck} className="accent-violet-600 flex-shrink-0" />
                      <span className="text-xs font-semibold">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-24 text-center px-4">
                <Building2 className="w-8 h-8 text-gray-200 mb-2" />
                <p className="text-xs text-gray-400">Aucun service inclus pour un véhicule en propriété.</p>
              </div>
            )}

            {/* Notes */}
            <div>
              <SectionHeader icon={FileText} label="Notes" />
              <textarea
                name="notes" rows={6}
                value={form.notes} onChange={handleChange}
                placeholder="Informations complémentaires, conditions particulières…"
                className={`${inputCls()} resize-none`}
              />
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
              {isEdit ? 'Enregistrer les modifications' : 'Créer le contrat'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
