import { useAppStore } from '@/store/useAppStore'
import { useState, useEffect } from 'react'
import { X, Car, Fuel, User } from 'lucide-react'
import { vehicleService, driverService } from '@/lib/services'
import type { Vehicle, Driver, FuelEntry } from '@/types'

// ─── Types ────────────────────────────────────────────────────────
interface FormState {
  vehicleId:           string
  vehicleRegistration: string
  agencyId:            string
  driverName:          string
  driverSelectedId:    string
  cardNumber:          string
  fuelType:            'DIESEL' | 'HYBRID' | 'ELECTRIC' | ''
  date:                string
  station:             string
  mileageAtFill:       string
  distanceSinceLast:   string
  liters:              string
  pricePerLiter:       string
  totalCost:           string
}

interface FormErrors {
  vehicleRegistration?: string
  agencyId?:            string
  driverName?:          string
  cardNumber?:          string
  fuelType?:            string
  date?:                string
  station?:             string
  mileageAtFill?:       string
  distanceSinceLast?:   string
  liters?:              string
  pricePerLiter?:       string
  totalCost?:           string
}

interface FuelFormProps {
  isOpen:  boolean
  onClose: () => void
  entry:   FuelEntry | null
  onSave:  (entry: FuelEntry) => void
}

// ─── Défauts ──────────────────────────────────────────────────────
const defaultFormState: FormState = {
  vehicleId:           '',
  vehicleRegistration: '',
  agencyId:            '',
  date:                new Date().toISOString().split('T')[0],
  fuelType:            '',
  liters:              '',
  pricePerLiter:       '',
  totalCost:           '',
  mileageAtFill:       '',
  distanceSinceLast:   '',
  driverName:          '',
  driverSelectedId:    '',
  station:             '',
  cardNumber:          '',
}

// ─── Validation ───────────────────────────────────────────────────
function validate(form: FormState): FormErrors {
  const e: FormErrors = {}
  if (!form.vehicleRegistration.trim()) e.vehicleRegistration = 'Requis'
  if (!form.agencyId.trim())           e.agencyId            = 'Requis'
  if (!form.date)                      e.date                = 'Requis'
  if (!form.fuelType)                  e.fuelType            = 'Requis'
  const isElectric = form.fuelType === 'ELECTRIC'
  if (!isElectric) {
    if (!form.liters || isNaN(Number(form.liters)) || Number(form.liters) <= 0)
      e.liters = 'Volume requis (> 0)'
    if (!form.pricePerLiter || isNaN(Number(form.pricePerLiter)) || Number(form.pricePerLiter) <= 0)
      e.pricePerLiter = 'Prix requis (> 0)'
  }
  if (!form.totalCost || isNaN(Number(form.totalCost)) || Number(form.totalCost) <= 0)
    e.totalCost = 'Requis (> 0)'
  if (!form.mileageAtFill || isNaN(Number(form.mileageAtFill)) || Number(form.mileageAtFill) < 0)
    e.mileageAtFill = 'Requis (>= 0)'
  if (!form.distanceSinceLast || isNaN(Number(form.distanceSinceLast)) || Number(form.distanceSinceLast) < 0)
    e.distanceSinceLast = 'Requis (>= 0)'
  if (!form.driverName.trim()) e.driverName = 'Requis'
  if (!form.cardNumber.trim()) e.cardNumber = 'Requis'
  return e
}

// ─── Sous-composants ──────────────────────────────────────────────
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function FieldWrapper({ error, children }: { error?: string; children: React.ReactNode }) {
  return (
    <div>
      {children}
      {error && <p className="text-[10px] text-red-500 mt-0.5 font-medium">{error}</p>}
    </div>
  )
}

function getInputCls(error?: string, disabled?: boolean): string {
  const base = 'w-full px-3 py-2 text-sm rounded-lg border transition focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder-gray-300'
  if (disabled) return `${base} bg-gray-50 text-gray-400 cursor-not-allowed opacity-70 border-gray-200`
  if (error)    return `${base} border-red-300 bg-red-50/30 text-gray-900`
  return `${base} border-gray-200 hover:border-gray-300 bg-white text-gray-900`
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
export default function FuelForm({ isOpen, onClose, entry, onSave }: FuelFormProps) {
  const agencies = useAppStore((s) => s.agencies)

  const [form,            setForm]            = useState<FormState>(defaultFormState)
  const [errors,          setErrors]          = useState<FormErrors>({})
  const [submitting,      setSubmitting]      = useState(false)
  const [vehicles,        setVehicles]        = useState<Vehicle[]>([])
  const [drivers,         setDrivers]         = useState<Driver[]>([])
  const [loadingVehicles, setLoadingVehicles] = useState(false)

  // ─── Chargement véhicules / conducteurs ───────────────────────
  useEffect(() => {
    if (!isOpen) return
    setLoadingVehicles(true)
    Promise.all([vehicleService.list(), driverService.list()])
      .then(([v, d]) => {
        setVehicles(v)
        setDrivers(d.filter((dr: any) => dr.status === 'ACTIVE' && !dr.deletedAt))
      })
      .finally(() => setLoadingVehicles(false))
  }, [isOpen])

  // ─── Pré-remplissage ──────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setForm(defaultFormState)
      setErrors({})
      return
    }
    if (entry) {
      setForm({
        vehicleId:           entry.vehicleId ?? '',
        vehicleRegistration: entry.vehicleRegistration ?? '',
        agencyId:            entry.agencyId ?? '',
        driverName:          entry.driverName ?? '',
        driverSelectedId:    '',
        cardNumber:          entry.cardNumber ?? '',
        fuelType:            entry.fuelType ?? '',
        date:                entry.date ? entry.date.split('T')[0] : new Date().toISOString().split('T')[0],
        station:             entry.station ?? '',
        mileageAtFill:       entry.mileageAtFill > 0 ? String(entry.mileageAtFill) : '',
        distanceSinceLast:   entry.distanceSinceLast > 0 ? String(entry.distanceSinceLast) : '',
        liters:              entry.liters > 0 ? String(entry.liters) : '',
        pricePerLiter:       entry.pricePerLiter > 0 ? String(entry.pricePerLiter) : '',
        totalCost:           entry.totalCost > 0 ? String(entry.totalCost) : '',
      })
    } else {
      setForm(defaultFormState)
    }
    setErrors({})
  }, [isOpen, entry])

  // ─── Auto-calcul coût total ───────────────────────────────────
  useEffect(() => {
    if (form.fuelType === 'ELECTRIC') {
      setForm((prev) => ({ ...prev, totalCost: '' }))
      return
    }
    const q = Number(form.liters)
    const p = Number(form.pricePerLiter)
    if (!isNaN(q) && !isNaN(p) && q >= 0 && p >= 0) {
      setForm((prev) => ({ ...prev, totalCost: (q * p).toFixed(2) }))
    } else {
      setForm((prev) => ({ ...prev, totalCost: '' }))
    }
  }, [form.liters, form.pricePerLiter, form.fuelType])

  // ─── Handlers ─────────────────────────────────────────────────
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  function handleVehicleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const selected = e.target.value
    const vehicle  = vehicles.find((v) => v.id === selected)
    if (!vehicle) {
      setForm((prev) => ({ ...prev, vehicleId: '', vehicleRegistration: '', agencyId: '', fuelType: '' }))
      return
    }
    setForm((prev) => ({
      ...prev,
      vehicleId:           vehicle.id,
      vehicleRegistration: vehicle.registration,
      agencyId:            vehicle.agencyId,
      fuelType:            (vehicle.energy as 'DIESEL' | 'HYBRID' | 'ELECTRIC') || '',
    }))
    setErrors((prev) => ({
      ...prev,
      vehicleRegistration: undefined,
      agencyId:            undefined,
      fuelType:            undefined,
    }))
  }

  function handleDriverChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const driverId = e.target.value
    const driver   = drivers.find((d: any) => d.id === driverId)
    if (!driver) {
      setForm((prev) => ({ ...prev, driverSelectedId: '', driverName: '' }))
      return
    }
    setForm((prev) => ({
      ...prev,
      driverSelectedId: driverId,
      driverName:       `${(driver as any).firstName} ${(driver as any).lastName}`,
    }))
    setErrors((prev) => ({ ...prev, driverName: undefined }))
  }

  function computeConsumption(): number {
    const liters   = parseFloat(form.liters) || 0
    const distance = parseInt(form.distanceSinceLast) || 0
    if (distance > 0 && liters > 0) return (liters / distance) * 100
    return 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setSubmitting(true)
    try {
      const isElectric     = form.fuelType === 'ELECTRIC'
      const selectedAgency = agencies.find((a) => a.id === form.agencyId)
      const payload: FuelEntry = {
        id:                  entry?.id ?? crypto.randomUUID(),
        vehicleId:           form.vehicleId,
        vehicleRegistration: form.vehicleRegistration,
        agencyId:            form.agencyId,
        agencyName:          selectedAgency?.name ?? '',
        date:                form.date ? new Date(`${form.date}T00:00:00.000Z`).toISOString() : '',
        liters:              isElectric ? 0 : parseFloat(form.liters) || 0,
        pricePerLiter:       isElectric ? 0 : parseFloat(form.pricePerLiter) || 0,
        totalCost:           parseFloat(form.totalCost) || 0,
        mileageAtFill:       parseInt(form.mileageAtFill) || 0,
        distanceSinceLast:   parseInt(form.distanceSinceLast) || 0,
        consumption:         computeConsumption(),
        fuelType:            form.fuelType as 'DIESEL' | 'HYBRID' | 'ELECTRIC',
        station:             form.station.trim(),
        driverName:          form.driverName.trim(),
        cardNumber:          form.cardNumber.trim(),
      }
      await onSave(payload)
      onClose()
    } catch (err) {
      console.error('FuelForm submit error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  const isElectric = form.fuelType === 'ELECTRIC'

  const liveConso: string | null = (() => {
    const l = parseFloat(form.liters)
    const d = parseInt(form.distanceSinceLast)
    if (!isElectric && l > 0 && d > 0) return ((l / d) * 100).toFixed(1)
    return null
  })()

  const consoLevel = liveConso !== null
    ? parseFloat(liveConso) > 11 ? 'high' : parseFloat(liveConso) > 9.5 ? 'mid' : 'low'
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-5xl flex flex-col overflow-hidden">

        {/* En-tête */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
          <div className="w-1 h-5 rounded-full bg-violet-600" />
          <Fuel className="w-4 h-4 text-violet-500" />
          <div className="flex-1">
            <h2 className="text-sm font-bold text-gray-900">
              {entry ? 'Modifier le plein' : 'Nouveau plein de carburant'}
            </h2>
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 mt-0.5">
              {entry ? 'Modifiez les informations ci-dessous' : 'Renseignez les informations du plein'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Corps */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="p-5 grid grid-cols-3 gap-x-5">

            {/* Col 1 : Véhicule & Agence */}
            <div className="space-y-3">
              <SectionHeader icon={Car} label="Véhicule & Agence" />
              <div className="space-y-2">

                <FieldWrapper error={errors.vehicleRegistration}>
                  <FieldLabel required>Immatriculation</FieldLabel>
                  <select
                    value={form.vehicleId}
                    onChange={handleVehicleChange}
                    disabled={loadingVehicles}
                    className={getInputCls(errors.vehicleRegistration, loadingVehicles)}
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
                </FieldWrapper>

                <FieldWrapper error={errors.agencyId}>
                  <FieldLabel required>Agence</FieldLabel>
                  <select
                    name="agencyId"
                    value={form.agencyId}
                    onChange={handleChange}
                    disabled={!!form.vehicleId}
                    className={getInputCls(errors.agencyId, !!form.vehicleId)}
                  >
                    <option value="">Sélectionner une agence</option>
                    {agencies.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                  {!!form.vehicleId && (
                    <p className="text-[10px] text-gray-400 mt-0.5">Rempli depuis le véhicule</p>
                  )}
                </FieldWrapper>

                <FieldWrapper error={errors.fuelType}>
                  <FieldLabel required>Type de carburant</FieldLabel>
                  <select
                    name="fuelType"
                    value={form.fuelType}
                    onChange={handleChange}
                    disabled={!!form.vehicleId}
                    className={getInputCls(errors.fuelType, !!form.vehicleId)}
                  >
                    <option value="">Sélectionner un type</option>
                    <option value="DIESEL">Diesel</option>
                    <option value="HYBRID">Hybride</option>
                    <option value="ELECTRIC">Électrique</option>
                  </select>
                  {!!form.vehicleId && (
                    <p className="text-[10px] text-gray-400 mt-0.5">Rempli depuis le véhicule</p>
                  )}
                </FieldWrapper>

                <FieldWrapper error={errors.date}>
                  <FieldLabel required>Date du plein</FieldLabel>
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    className={getInputCls(errors.date)}
                  />
                </FieldWrapper>

              </div>
            </div>

            {/* Col 2 : Quantité & Coûts */}
            <div className="space-y-3">
              <SectionHeader icon={Fuel} label="Quantité & Coûts" />
              <div className="space-y-2">

                {!isElectric && (
                  <FieldWrapper error={errors.liters}>
                    <FieldLabel required>Volume (L)</FieldLabel>
                    <input
                      type="number"
                      name="liters"
                      value={form.liters}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className={getInputCls(errors.liters)}
                    />
                  </FieldWrapper>
                )}

                {!isElectric && (
                  <FieldWrapper error={errors.pricePerLiter}>
                    <FieldLabel required>Prix unitaire (€/L)</FieldLabel>
                    <input
                      type="number"
                      name="pricePerLiter"
                      value={form.pricePerLiter}
                      onChange={handleChange}
                      min="0"
                      step="0.001"
                      placeholder="0.000"
                      className={getInputCls(errors.pricePerLiter)}
                    />
                  </FieldWrapper>
                )}

                <FieldWrapper error={errors.totalCost}>
                  <FieldLabel required>
                    Coût total (€)
                    {!isElectric && (
                      <span className="ml-1.5 text-[9px] font-bold text-blue-500 normal-case tracking-normal">
                        auto-calculé
                      </span>
                    )}
                  </FieldLabel>
                  <input
                    type="number"
                    name="totalCost"
                    value={form.totalCost}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className={getInputCls(errors.totalCost)}
                  />
                </FieldWrapper>

                <FieldWrapper error={errors.mileageAtFill}>
                  <FieldLabel required>Kilométrage au plein</FieldLabel>
                  <input
                    type="number"
                    name="mileageAtFill"
                    value={form.mileageAtFill}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    placeholder="0"
                    className={getInputCls(errors.mileageAtFill)}
                  />
                </FieldWrapper>

                <FieldWrapper error={errors.distanceSinceLast}>
                  <FieldLabel required>Distance depuis dernier plein</FieldLabel>
                  <input
                    type="number"
                    name="distanceSinceLast"
                    value={form.distanceSinceLast}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    placeholder="0"
                    className={getInputCls(errors.distanceSinceLast)}
                  />
                </FieldWrapper>

                {liveConso !== null && consoLevel !== null && (
                  <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                    consoLevel === 'high' ? 'bg-red-50 border-red-200' :
                    consoLevel === 'mid'  ? 'bg-orange-50 border-orange-200' :
                                           'bg-green-50 border-green-200'
                  }`}>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                      Conso estimée
                    </span>
                    <span className={`text-sm font-black ${
                      consoLevel === 'high' ? 'text-red-600' :
                      consoLevel === 'mid'  ? 'text-orange-600' :
                                             'text-green-700'
                    }`}>
                      {liveConso} L/100
                    </span>
                  </div>
                )}

              </div>
            </div>

            {/* Col 3 : Conducteur & Station */}
            <div className="space-y-3">
              <SectionHeader icon={User} label="Conducteur & Station" />
              <div className="space-y-2">

                <FieldWrapper error={errors.driverName}>
                  <FieldLabel required>Conducteur</FieldLabel>
                  <select
                    name="driverSelectedId"
                    value={form.driverSelectedId}
                    onChange={handleDriverChange}
                    disabled={loadingVehicles}
                    className={getInputCls(errors.driverName, loadingVehicles)}
                  >
                    <option value="">
                      {loadingVehicles ? 'Chargement…' : 'Sélectionner un conducteur'}
                    </option>
                    {drivers.map((d: any) => (
                      <option key={d.id} value={d.id}>
                        {d.firstName} {d.lastName}
                      </option>
                    ))}
                  </select>
                </FieldWrapper>

                <FieldWrapper error={errors.station}>
                  <FieldLabel>Station</FieldLabel>
                  <input
                    type="text"
                    name="station"
                    value={form.station}
                    onChange={handleChange}
                    placeholder="Total, BP, Shell…"
                    className={getInputCls(errors.station)}
                  />
                </FieldWrapper>

                <FieldWrapper error={errors.cardNumber}>
                  <FieldLabel required>Numéro de carte</FieldLabel>
                  <input
                    type="text"
                    name="cardNumber"
                    value={form.cardNumber}
                    onChange={handleChange}
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    className={getInputCls(errors.cardNumber)}
                  />
                </FieldWrapper>

              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
            <p className="text-[10px] text-gray-400">
              <span className="text-red-500">*</span> Champs obligatoires
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting || loadingVehicles}
                className="px-4 py-2 text-sm font-bold text-white bg-violet-600 rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Enregistrement…' : entry ? 'Mettre à jour' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
