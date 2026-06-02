// EquipmentForm.tsx — avec sélecteur véhicule dynamique et prestataire optionnel
import { useAppStore } from '@/store/useAppStore'
import React, { useState, useEffect } from 'react'
import { X, Stethoscope } from 'lucide-react'
import { vehicleService } from '@/lib/services'
import type { Vehicle } from '@/types'
import {
  Equipment,
  EquipmentCategory,
  EquipmentStatus,
  CATEGORY_LABELS,
  STATUS_LABELS,
} from '@/data/mockEquipment'

interface EquipmentFormProps {
  equipment?: Equipment
  onClose: () => void
  onSave: (equipment: Equipment) => void
}

const NULLABLE_FIELDS: (keyof Equipment)[] = [
  'serialNumber',
  'installDate',
  'expiryDate',
  'notes',
]

const REQUIRED_FIELDS: { key: keyof Equipment; label: string }[] = [
  { key: 'vehicleId', label: 'Immatriculation du vehicule' },
  { key: 'label', label: 'Designation' },
  { key: 'lastCheckDate', label: 'Date du dernier controle' },
  { key: 'nextCheckDate', label: 'Date du prochain controle' },
]

type FormState = {
  id: string
  vehicleId: string
  vehicleRegistration: string
  agencyId: string
  agencyName: string
  category: EquipmentCategory
  label: string
  serialNumber: string | null
  status: EquipmentStatus
  installDate: string | null
  lastCheckDate: string
  nextCheckDate: string
  expiryDate: string | null
  maintenanceProvider: string
  notes: string | null
}

const DEFAULT_FORM_STATE: FormState = {
  id: '',
  vehicleId: '',
  vehicleRegistration: '',
  agencyId: '',
  agencyName: '',
  category: 'DEFIBRILLATOR',
  label: '',
  serialNumber: null,
  status: 'OK',
  installDate: null,
  lastCheckDate: '',
  nextCheckDate: '',
  expiryDate: null,
  maintenanceProvider: '',
  notes: null,
}

function toIso(dateStr: string | null): string | null {
  if (!dateStr) return null
  return new Date(`${dateStr}T00:00:00.000Z`).toISOString()
}

function equipmentToFormState(eq: Equipment): FormState {
  return {
    id: eq.id,
    vehicleId: eq.vehicleId,
    vehicleRegistration: eq.vehicleRegistration,
    agencyId: eq.agencyId,
    agencyName: eq.agencyName,
    category: eq.category,
    label: eq.label,
    serialNumber: eq.serialNumber ?? null,
    status: eq.status,
    installDate: eq.installDate ? eq.installDate.split('T')[0] : null,
    lastCheckDate: eq.lastCheckDate ? eq.lastCheckDate.split('T')[0] : '',
    nextCheckDate: eq.nextCheckDate ? eq.nextCheckDate.split('T')[0] : '',
    expiryDate: eq.expiryDate ? eq.expiryDate.split('T')[0] : null,
    maintenanceProvider: eq.maintenanceProvider ?? '',
    notes: eq.notes ?? null,
  }
}

export default function EquipmentForm({
  equipment,
  onClose,
  onSave,
}: EquipmentFormProps) {
  const isEditMode = Boolean(equipment)
  const agencies = useAppStore((s) => s.agencies)

  const [form, setForm] = useState<FormState>(
    equipment ? equipmentToFormState(equipment) : DEFAULT_FORM_STATE
  )
  const [errors, setErrors] = useState<Partial<Record<keyof Equipment, string>>>({})
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loadingVehicles, setLoadingVehicles] = useState(false)

  // Charger la liste des véhicules au mount
  useEffect(() => {
    setLoadingVehicles(true)
    vehicleService.list()
      .then(setVehicles)
      .finally(() => setLoadingVehicles(false))
  }, [])

  // Repopuler le formulaire en mode édition
  useEffect(() => {
    if (equipment) {
      setForm(equipmentToFormState(equipment))
    } else {
      setForm(DEFAULT_FORM_STATE)
    }
    setErrors({})
  }, [equipment])

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target
    const key = name as keyof FormState
    setForm((prev) => ({
      ...prev,
      [key]: NULLABLE_FIELDS.includes(key as keyof Equipment) && value === ''
        ? null
        : value,
    }))
    if (errors[key as keyof Equipment]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key as keyof Equipment]
        return next
      })
    }
  }

  function handleVehicleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const selectedId = e.target.value
    const vehicle = vehicles.find((v) => v.id === selectedId)
    if (!vehicle) {
      setForm((prev) => ({
        ...prev,
        vehicleId: '',
        vehicleRegistration: '',
        agencyId: '',
        agencyName: '',
      }))
      return
    }
    const agency = agencies.find((a) => a.id === vehicle.agencyId)
    setForm((prev) => ({
      ...prev,
      vehicleId: vehicle.id,
      vehicleRegistration: vehicle.registration,
      agencyId: vehicle.agencyId,
      agencyName: agency?.name ?? '',
    }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next.vehicleId
      return next
    })
  }

  function handleAgencyChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const agencyId = e.target.value
    const agency = agencies.find((a) => a.id === agencyId)
    setForm((prev) => ({
      ...prev,
      agencyId,
      agencyName: agency ? agency.name : '',
    }))
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof Equipment, string>> = {}
    for (const field of REQUIRED_FIELDS) {
      const value = form[field.key as keyof FormState]
      if (!value || String(value).trim() === '') {
        newErrors[field.key] = `Le champ "${field.label}" est obligatoire.`
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSave() {
    if (!validate()) return
    const agency = agencies.find((a) => a.id === form.agencyId)
    const saved: Equipment = {
      ...form,
      id: isEditMode ? form.id : '',
      agencyName: agency ? agency.name : form.agencyName,
      serialNumber: form.serialNumber,
      installDate: toIso(form.installDate),
      lastCheckDate: toIso(form.lastCheckDate) ?? '',
      nextCheckDate: toIso(form.nextCheckDate) ?? '',
      expiryDate: toIso(form.expiryDate),
      notes: form.notes,
    }
    onSave(saved)
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 ' +
    'focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent ' +
    'placeholder-gray-400'

  const inputErrorClass =
    'w-full rounded-lg border border-red-400 px-3 py-2 text-sm text-gray-800 ' +
    'focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent ' +
    'placeholder-gray-400'

  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  function getInputClass(key: keyof Equipment) {
    return errors[key] ? inputErrorClass : inputClass
  }

  return (
    <div
      className="fixed inset-0 bg-gray-900/75 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-100">
              <Stethoscope className="w-5 h-5 text-violet-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEditMode ? "Modifier l'equipement" : 'Nouvel equipement'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="overflow-y-auto flex-grow p-6 space-y-8">

          {/* Section: Identification */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Identification
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Sélecteur véhicule */}
              <div>
                <label className={labelClass} htmlFor="vehicleId">
                  Immatriculation du vehicule
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  id="vehicleId"
                  name="vehicleId"
                  value={form.vehicleId}
                  onChange={handleVehicleChange}
                  disabled={loadingVehicles}
                  className={`${getInputClass('vehicleId')} disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  <option value="">
                    {loadingVehicles ? 'Chargement...' : 'Sélectionner un véhicule'}
                  </option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registration} — {v.brand} {v.model}
                    </option>
                  ))}
                </select>
                {errors.vehicleId && (
                  <p className="mt-1 text-xs text-red-500">{errors.vehicleId}</p>
                )}
              </div>

              {/* Immatriculation auto-remplie (lecture seule) */}
              <div>
                <label className={labelClass}>
                  Immatriculation (auto-remplie)
                </label>
                <input
                  type="text"
                  value={form.vehicleRegistration}
                  disabled
                  placeholder="Sélectionner un véhicule ci-dessus"
                  className={inputClass + ' bg-gray-50 text-gray-500 cursor-not-allowed'}
                />
              </div>

              {/* Agence auto-remplie */}
              <div>
                <label className={labelClass} htmlFor="agencyId">
                  Agence
                </label>
                <select
                  id="agencyId"
                  name="agencyId"
                  value={form.agencyId}
                  onChange={handleAgencyChange}
                  disabled={!!form.vehicleId}
                  className={`${inputClass}${form.vehicleId ? ' bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                >
                  <option value="">Sélectionner une agence</option>
                  {agencies.map((agency) => (
                    <option key={agency.id} value={agency.id}>
                      {agency.name}
                    </option>
                  ))}
                </select>
                {form.vehicleId && (
                  <p className="mt-1 text-xs text-gray-400">Rempli automatiquement depuis le véhicule</p>
                )}
              </div>

              {/* Catégorie */}
              <div>
                <label className={labelClass} htmlFor="category">
                  Categorie
                </label>
                <select
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className={inputClass}
                >
                  {(Object.keys(CATEGORY_LABELS) as EquipmentCategory[]).map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Désignation */}
              <div>
                <label className={labelClass} htmlFor="label">
                  Designation
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  id="label"
                  name="label"
                  type="text"
                  value={form.label}
                  onChange={handleChange}
                  placeholder="Ex: Defibrillateur Zoll AED Plus"
                  className={getInputClass('label')}
                />
                {errors.label && (
                  <p className="mt-1 text-xs text-red-500">{errors.label}</p>
                )}
              </div>

              {/* Numéro de série */}
              <div>
                <label className={labelClass} htmlFor="serialNumber">
                  Numero de serie
                </label>
                <input
                  id="serialNumber"
                  name="serialNumber"
                  type="text"
                  value={form.serialNumber ?? ''}
                  onChange={handleChange}
                  placeholder="Ex: SN-2024-00123"
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Section: Statut et Dates */}
          <section className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Statut et Dates
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="status">
                  Statut
                </label>
                <select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className={inputClass}
                >
                  {(Object.keys(STATUS_LABELS) as EquipmentStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass} htmlFor="installDate">
                  Date d'installation
                </label>
                <input
                  id="installDate"
                  name="installDate"
                  type="date"
                  value={form.installDate ?? ''}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="lastCheckDate">
                  Date du dernier controle
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  id="lastCheckDate"
                  name="lastCheckDate"
                  type="date"
                  value={form.lastCheckDate}
                  onChange={handleChange}
                  className={getInputClass('lastCheckDate')}
                />
                {errors.lastCheckDate && (
                  <p className="mt-1 text-xs text-red-500">{errors.lastCheckDate}</p>
                )}
              </div>

              <div>
                <label className={labelClass} htmlFor="nextCheckDate">
                  Date du prochain controle
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  id="nextCheckDate"
                  name="nextCheckDate"
                  type="date"
                  value={form.nextCheckDate}
                  onChange={handleChange}
                  className={getInputClass('nextCheckDate')}
                />
                {errors.nextCheckDate && (
                  <p className="mt-1 text-xs text-red-500">{errors.nextCheckDate}</p>
                )}
              </div>

              <div>
                <label className={labelClass} htmlFor="expiryDate">
                  Date d'expiration
                </label>
                <input
                  id="expiryDate"
                  name="expiryDate"
                  type="date"
                  value={form.expiryDate ?? ''}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          {/* Section: Maintenance */}
          <section className="border-t border-gray-200 pt-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Maintenance
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className={labelClass} htmlFor="maintenanceProvider">
                  Prestataire de maintenance
                </label>
                <input
                  id="maintenanceProvider"
                  name="maintenanceProvider"
                  type="text"
                  value={form.maintenanceProvider}
                  onChange={handleChange}
                  placeholder="Ex: BioMed Services France"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="notes">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  value={form.notes ?? ''}
                  onChange={handleChange}
                  placeholder="Informations complementaires, observations..."
                  className={inputClass + ' resize-none'}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white z-10 flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1 transition-colors"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}
