import { useAppStore } from '@/store/useAppStore'
import React, { useState, useEffect } from 'react'
import { X, Stethoscope, Car, CalendarClock, Wrench } from 'lucide-react'
import { vehicleService } from '@/lib/services'
import type { Vehicle } from '@/types'
import {
  Equipment,
  EquipmentCategory,
  EquipmentStatus,
  CATEGORY_LABELS,
  STATUS_LABELS,
} from '@/data/mockEquipment'

// ─── Types ────────────────────────────────────────────────────────
type FormState = {
  id:                  string
  vehicleId:           string
  vehicleRegistration: string
  agencyId:            string
  agencyName:          string
  category:            EquipmentCategory
  label:               string
  serialNumber:        string | null
  status:              EquipmentStatus
  installDate:         string | null
  lastCheckDate:       string
  nextCheckDate:       string
  expiryDate:          string | null
  maintenanceProvider: string
  notes:               string | null
}

type FormErrors = Partial<Record<keyof FormState, string>>

// ─── Constantes ───────────────────────────────────────────────────
const NULLABLE_FIELDS: (keyof Equipment)[] = ['serialNumber', 'installDate', 'expiryDate', 'notes']

const REQUIRED_FIELDS: { key: keyof Equipment; label: string }[] = [
  { key: 'vehicleId',     label: 'Véhicule'              },
  { key: 'label',         label: 'Désignation'           },
  { key: 'lastCheckDate', label: 'Dernier contrôle'      },
  { key: 'nextCheckDate', label: 'Prochain contrôle'     },
]

const DEFAULT_FORM: FormState = {
  id:                  '',
  vehicleId:           '',
  vehicleRegistration: '',
  agencyId:            '',
  agencyName:          '',
  category:            'DEFIBRILLATOR',
  label:               '',
  serialNumber:        null,
  status:              'OK',
  installDate:         null,
  lastCheckDate:       '',
  nextCheckDate:       '',
  expiryDate:          null,
  maintenanceProvider: '',
  notes:               null,
}

// ─── Helpers ──────────────────────────────────────────────────────
function toIso(dateStr: string | null): string | null {
  if (!dateStr) return null
  return new Date(`${dateStr}T00:00:00.000Z`).toISOString()
}

function equipmentToForm(eq: Equipment): FormState {
  return {
    id:                  eq.id,
    vehicleId:           eq.vehicleId,
    vehicleRegistration: eq.vehicleRegistration,
    agencyId:            eq.agencyId,
    agencyName:          eq.agencyName,
    category:            eq.category,
    label:               eq.label,
    serialNumber:        eq.serialNumber ?? null,
    status:              eq.status,
    installDate:         eq.installDate ? eq.installDate.split('T')[0] : null,
    lastCheckDate:       eq.lastCheckDate ? eq.lastCheckDate.split('T')[0] : '',
    nextCheckDate:       eq.nextCheckDate ? eq.nextCheckDate.split('T')[0] : '',
    expiryDate:          eq.expiryDate ? eq.expiryDate.split('T')[0] : null,
    maintenanceProvider: eq.maintenanceProvider ?? '',
    notes:               eq.notes ?? null,
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

function inputCls(error?: string, disabled?: boolean): string {
  const base = 'w-full px-3 py-2 text-sm rounded-lg border transition focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder-gray-300'
  if (disabled) return `${base} bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200`
  if (error)    return `${base} border-red-300 bg-red-50/30 text-gray-900`
  return `${base} border-gray-200 hover:border-gray-300 bg-white text-gray-900`
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="text-[10px] text-red-500 mt-0.5 font-medium">{msg}</p>
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

// ─── Composant principal ──────────────────────────────────────────
interface EquipmentFormProps {
  equipment?: Equipment
  onClose:    () => void
  onSave:     (equipment: Equipment) => void
}

export default function EquipmentForm({ equipment, onClose, onSave }: EquipmentFormProps) {
  const isEditMode = Boolean(equipment)
  const agencies   = useAppStore((s) => s.agencies)

  const [form,            setForm]            = useState<FormState>(equipment ? equipmentToForm(equipment) : DEFAULT_FORM)
  const [errors,          setErrors]          = useState<FormErrors>({})
  const [vehicles,        setVehicles]        = useState<Vehicle[]>([])
  const [loadingVehicles, setLoadingVehicles] = useState(false)

  useEffect(() => {
    setLoadingVehicles(true)
    vehicleService.list().then(setVehicles).finally(() => setLoadingVehicles(false))
  }, [])

  useEffect(() => {
    setForm(equipment ? equipmentToForm(equipment) : DEFAULT_FORM)
    setErrors({})
  }, [equipment])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    const key = name as keyof FormState
    setForm((p) => ({
      ...p,
      [key]: NULLABLE_FIELDS.includes(key as keyof Equipment) && value === '' ? null : value,
    }))
    setErrors((p) => { const n = { ...p }; delete n[key]; return n })
  }

  function handleVehicleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = vehicles.find((x) => x.id === e.target.value)
    if (!v) {
      setForm((p) => ({ ...p, vehicleId: '', vehicleRegistration: '', agencyId: '', agencyName: '' }))
      return
    }
    const agency = agencies.find((a) => a.id === v.agencyId)
    setForm((p) => ({
      ...p,
      vehicleId:           v.id,
      vehicleRegistration: v.registration,
      agencyId:            v.agencyId,
      agencyName:          agency?.name ?? '',
    }))
    setErrors((p) => { const n = { ...p }; delete n.vehicleId; return n })
  }

  function validate(): boolean {
    const errs: FormErrors = {}
    for (const f of REQUIRED_FIELDS) {
      const v = form[f.key as keyof FormState]
      if (!v || String(v).trim() === '') errs[f.key as keyof FormState] = `${f.label} requis`
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSave() {
    if (!validate()) return
    const agency = agencies.find((a) => a.id === form.agencyId)
    const saved: Equipment = {
      ...form,
      id:            isEditMode ? form.id : '',
      agencyName:    agency?.name ?? form.agencyName,
      installDate:   toIso(form.installDate),
      lastCheckDate: toIso(form.lastCheckDate) ?? '',
      nextCheckDate: toIso(form.nextCheckDate) ?? '',
      expiryDate:    toIso(form.expiryDate),
    }
    onSave(saved)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-5xl flex flex-col overflow-hidden">

        {/* ── En-tête ── */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
          <div className="w-1 h-5 rounded-full bg-violet-600" />
          <Stethoscope className="w-4 h-4 text-violet-500" />
          <div className="flex-1">
            <h2 className="text-sm font-bold text-gray-900">
              {isEditMode ? "Modifier l'équipement" : 'Nouvel équipement'}
            </h2>
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 mt-0.5">
              {isEditMode ? 'Modifiez les informations ci-dessous' : 'Renseignez les informations de l\'équipement'}
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── Corps — 3 colonnes ── */}
        <div className="p-5 grid grid-cols-3 gap-x-5">

          {/* ══ Col 1 : Identification ══ */}
          <div className="space-y-3">
            <SectionHeader icon={Car} label="Identification" />
            <div className="space-y-2">

              <div>
                <FieldLabel required>Véhicule</FieldLabel>
                <select
                  name="vehicleId"
                  value={form.vehicleId}
                  onChange={handleVehicleChange}
                  disabled={loadingVehicles}
                  className={inputCls(errors.vehicleId, loadingVehicles)}
                >
                  <option value="">
                    {loadingVehicles ? 'Chargement…' : 'Sélectionner un véhicule'}
                  </option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registration} — {v.brand} {v.model}
                    </option>
                  ))}
                </select>
                <FieldError msg={errors.vehicleId} />
              </div>

              <div>
                <FieldLabel>Immatriculation</FieldLabel>
                <input
                  type="text"
                  value={form.vehicleRegistration}
                  readOnly
                  placeholder="Auto-remplie"
                  className={inputCls(undefined, true)}
                />
              </div>

              <div>
                <FieldLabel>Agence</FieldLabel>
                <input
                  type="text"
                  value={form.agencyName}
                  readOnly
                  placeholder="Auto-remplie depuis le véhicule"
                  className={inputCls(undefined, true)}
                />
              </div>

              <div>
                <FieldLabel>Catégorie</FieldLabel>
                <select name="category" value={form.category} onChange={handleChange} className={inputCls()}>
                  {(Object.keys(CATEGORY_LABELS) as EquipmentCategory[]).map((cat) => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel required>Désignation</FieldLabel>
                <input
                  type="text"
                  name="label"
                  value={form.label}
                  onChange={handleChange}
                  placeholder="Ex : Défibrillateur Zoll AED Plus"
                  className={inputCls(errors.label)}
                />
                <FieldError msg={errors.label} />
              </div>

              <div>
                <FieldLabel>Numéro de série</FieldLabel>
                <input
                  type="text"
                  name="serialNumber"
                  value={form.serialNumber ?? ''}
                  onChange={handleChange}
                  placeholder="Ex : SN-2024-00123"
                  className={inputCls()}
                />
              </div>
            </div>
          </div>

          {/* ══ Col 2 : Statut & Dates ══ */}
          <div className="space-y-3">
            <SectionHeader icon={CalendarClock} label="Statut & Dates" />
            <div className="space-y-2">

              <div>
                <FieldLabel>Statut</FieldLabel>
                <select name="status" value={form.status} onChange={handleChange} className={inputCls()}>
                  {(Object.keys(STATUS_LABELS) as EquipmentStatus[]).map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel>Date d'installation</FieldLabel>
                <input
                  type="date"
                  name="installDate"
                  value={form.installDate ?? ''}
                  onChange={handleChange}
                  className={inputCls()}
                />
              </div>

              <div>
                <FieldLabel required>Dernier contrôle</FieldLabel>
                <input
                  type="date"
                  name="lastCheckDate"
                  value={form.lastCheckDate}
                  onChange={handleChange}
                  className={inputCls(errors.lastCheckDate)}
                />
                <FieldError msg={errors.lastCheckDate} />
              </div>

              <div>
                <FieldLabel required>Prochain contrôle</FieldLabel>
                <input
                  type="date"
                  name="nextCheckDate"
                  value={form.nextCheckDate}
                  onChange={handleChange}
                  className={inputCls(errors.nextCheckDate)}
                />
                <FieldError msg={errors.nextCheckDate} />
              </div>

              <div>
                <FieldLabel>Date d'expiration</FieldLabel>
                <input
                  type="date"
                  name="expiryDate"
                  value={form.expiryDate ?? ''}
                  onChange={handleChange}
                  className={inputCls()}
                />
              </div>
            </div>
          </div>

          {/* ══ Col 3 : Maintenance & Notes ══ */}
          <div className="space-y-3">
            <SectionHeader icon={Wrench} label="Maintenance & Notes" />
            <div className="space-y-2">

              <div>
                <FieldLabel>Prestataire de maintenance</FieldLabel>
                <input
                  type="text"
                  name="maintenanceProvider"
                  value={form.maintenanceProvider}
                  onChange={handleChange}
                  placeholder="Ex : BioMed Services France"
                  className={inputCls()}
                />
              </div>

              <div>
                <FieldLabel>Notes</FieldLabel>
                <textarea
                  name="notes"
                  value={form.notes ?? ''}
                  onChange={handleChange}
                  rows={8}
                  placeholder="Observations complémentaires, historique…"
                  className={`${inputCls()} resize-none`}
                />
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
