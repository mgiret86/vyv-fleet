// tailwindcss
import { useAppStore } from '@/store/useAppStore'
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { vehicleService, driverService } from '@/lib/services'
import type { Vehicle, Driver, FuelEntry } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  vehicleId: string
  vehicleRegistration: string
  agencyId: string
  driverName: string
  driverSelectedId: string // Added for driver selection
  cardNumber: string
  fuelType: 'DIESEL' | 'HYBRID' | 'ELECTRIC' | ''
  date: string
  station: string
  mileageAtFill: string
  distanceSinceLast: string
  liters: string
  pricePerLiter: string
  totalCost: string
}

interface FormErrors {
  vehicleRegistration?: string
  agencyId?: string
  driverName?: string
  cardNumber?: string
  fuelType?: string
  date?: string
  station?: string
  mileageAtFill?: string
  distanceSinceLast?: string
  liters?: string
  pricePerLiter?: string
  totalCost?: string
}

interface FuelFormProps {
  isOpen: boolean
  onClose: () => void
  entry: FuelEntry | null
  onSave: (entry: FuelEntry) => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const defaultFormState: FormState = {
  vehicleId: '',
  vehicleRegistration: '',
  agencyId: '',
  date: new Date().toISOString().split('T')[0],
  fuelType: '',
  liters: '',
  pricePerLiter: '',
  totalCost: '',
  mileageAtFill: '',
  distanceSinceLast: '',
  driverName: '',
  driverSelectedId: '', // Added for driver selection
  station: '',
  cardNumber: '',
}

const inputBase =
  'w-full rounded-lg border border-gray-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500'

const inputError = 'border-red-400 bg-red-50'

const labelClass = 'text-sm font-medium text-gray-700 mb-1 block'

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {}

  if (!form.vehicleRegistration.trim()) {
    errors.vehicleRegistration = 'Immatriculation requise'
  }

  if (!form.agencyId.trim()) {
    errors.agencyId = 'Agence requise'
  }

  if (!form.date) {
    errors.date = 'Date requise'
  }

  if (!form.fuelType) {
    errors.fuelType = 'Type de carburant requis'
  }

  const isElectric = form.fuelType === 'ELECTRIC'

  if (!isElectric) {
    if (!form.liters || isNaN(Number(form.liters)) || Number(form.liters) <= 0) {
      errors.liters = 'Volume requis (> 0)'
    }
    if (!form.pricePerLiter || isNaN(Number(form.pricePerLiter)) || Number(form.pricePerLiter) <= 0) {
      errors.pricePerLiter = 'Prix unitaire requis (> 0)'
    }
  }

  if (!form.totalCost || isNaN(Number(form.totalCost)) || Number(form.totalCost) <= 0) {
    errors.totalCost = 'Coût total requis (> 0)'
  }

  if (!form.mileageAtFill || isNaN(Number(form.mileageAtFill)) || Number(form.mileageAtFill) < 0) {
    errors.mileageAtFill = 'Kilométrage au plein requis (≥ 0)'
  }

  if (!form.distanceSinceLast || isNaN(Number(form.distanceSinceLast)) || Number(form.distanceSinceLast) < 0) {
    errors.distanceSinceLast = 'Distance depuis le dernier plein requise (≥ 0)'
  }

  if (!form.driverName.trim()) {
    errors.driverName = 'Conducteur requis'
  }

  if (!form.cardNumber.trim()) {
    errors.cardNumber = 'Numéro de carte requis'
  }

  return errors
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FuelForm({ isOpen, onClose, entry, onSave }: FuelFormProps) {
  const agencies = useAppStore((s) => s.agencies)

  const [form, setForm] = useState<FormState>(defaultFormState)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)

  // New states for vehicle and driver selectors
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loadingVehicles, setLoadingVehicles] = useState(false)

  // ── Load vehicles and drivers when modal opens ────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    setLoadingVehicles(true)
    Promise.all([
      vehicleService.list(),
      driverService.list(),
    ])
      .then(([v, d]) => {
        setVehicles(v)
        // Only show active, non-deleted drivers
        setDrivers(d.filter((dr: any) => dr.status === 'ACTIVE' && !dr.deletedAt))
      })
      .finally(() => setLoadingVehicles(false))
  }, [isOpen])

  // ── Populate form when opening in edit mode ───────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setForm(defaultFormState)
      setErrors({})
      return
    }

    if (entry) {
      setForm({
        vehicleId: entry.vehicleId ?? '',
        vehicleRegistration: entry.vehicleRegistration ?? '',
        agencyId: entry.agencyId ?? '',
        driverName: entry.driverName ?? '',
        driverSelectedId: '', // Cannot reliably map driverName to ID on edit, user must re-select
        cardNumber: entry.cardNumber ?? '',
        fuelType: entry.fuelType ?? '',
        date: entry.date ? entry.date.split('T')[0] : new Date().toISOString().split('T')[0],
        station: entry.station ?? '',
        mileageAtFill: entry.mileageAtFill > 0 ? String(entry.mileageAtFill) : '',
        distanceSinceLast: entry.distanceSinceLast > 0 ? String(entry.distanceSinceLast) : '',
        liters: entry.liters > 0 ? String(entry.liters) : '',
        pricePerLiter: entry.pricePerLiter > 0 ? String(entry.pricePerLiter) : '',
        totalCost: entry.totalCost > 0 ? String(entry.totalCost) : '',
      })
    } else {
      setForm(defaultFormState)
    }

    setErrors({})
  }, [isOpen, entry])

  // ── Auto-calculate totalCost ──────────────────────────────────────────────
  useEffect(() => {
    const isElectric = form.fuelType === 'ELECTRIC'
    let quantity = 0;
    let price = 0;

    if (!isElectric) { // Only calculate for non-electric
      quantity = Number(form.liters);
      price = Number(form.pricePerLiter);
    }

    if (!isNaN(quantity) && !isNaN(price) && quantity >= 0 && price >= 0) {
      const computed = (quantity * price).toFixed(2);
      setForm((prev) => ({ ...prev, totalCost: computed }));
    } else {
      setForm((prev) => ({ ...prev, totalCost: '' }));
    }
  }, [form.liters, form.pricePerLiter, form.fuelType])

  // ── Generic input change handler ──────────────────────────────────────────
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    // Clear the error for the changed field
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  // ── Vehicle selector handler ──────────────────────────────────────────────
  function handleVehicleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const selectedId = e.target.value
    const vehicle = vehicles.find((v) => v.id === selectedId)

    if (!vehicle) {
      setForm((prev) => ({ ...prev, vehicleId: '', vehicleRegistration: '', agencyId: '', fuelType: '' }))
      return
    }

    setForm((prev) => ({
      ...prev,
      vehicleId: vehicle.id,
      vehicleRegistration: vehicle.registration,
      agencyId: vehicle.agencyId,
      fuelType: (vehicle.energy as 'DIESEL' | 'HYBRID' | 'ELECTRIC') || '',
    }))

    // Clear errors on auto-filled fields
    setErrors((prev) => ({
      ...prev,
      vehicleRegistration: undefined,
      agencyId: undefined,
      fuelType: undefined,
    }))
  }

  // ── Driver selector handler ───────────────────────────────────────────────
  function handleDriverChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const driverId = e.target.value
    const driver = drivers.find((d: any) => d.id === driverId)

    if (!driver) {
      setForm((prev) => ({ ...prev, driverSelectedId: '', driverName: '' }))
      return
    }

    setForm((prev) => ({
      ...prev,
      driverSelectedId: driverId,
      driverName: `${(driver as any).firstName} ${(driver as any).lastName}`,
    }))

    setErrors((prev) => ({ ...prev, driverName: undefined }))
  }

  // Helper function for consumption, based on new fields
  const computeConsumption = () => {
    const liters = parseFloat(form.liters) || 0;
    const distance = parseInt(form.distanceSinceLast) || 0;
    if (distance > 0 && liters > 0) {
      return (liters / distance) * 100; // L/100km
    }
    return 0;
  };

  // ── Submit handler ────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setSubmitting(true)

    try {
      const isElectric = form.fuelType === 'ELECTRIC'

      const selectedAgency = agencies.find((a) => a.id === form.agencyId)
      const liters = isElectric ? 0 : parseFloat(form.liters) || 0
      const pricePerLiter = isElectric ? 0 : parseFloat(form.pricePerLiter) || 0
      const totalCost = parseFloat(form.totalCost) || 0
      const mileageAtFill = parseInt(form.mileageAtFill) || 0
      const distanceSinceLast = parseInt(form.distanceSinceLast) || 0
      const consumption = computeConsumption()

      // Convertir YYYY-MM-DD → ISO 8601 datetime attendu par le backend Zod
      const isoDate = form.date
        ? new Date(`${form.date}T00:00:00.000Z`).toISOString()
        : ''

      const payload: FuelEntry = {
        id:                  entry?.id ?? crypto.randomUUID(), // Ensure an ID is always present
        vehicleId:           form.vehicleId,
        vehicleRegistration: form.vehicleRegistration,
        agencyId:            form.agencyId,
        agencyName:          selectedAgency?.name ?? '',
        date:                isoDate, // Replaced form.date with isoDate
        liters,
        pricePerLiter,
        totalCost,
        mileageAtFill,
        distanceSinceLast,
        consumption,
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* ── Sticky Header ─────────────────────────────────────────────── */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            {entry ? 'Modifier le plein' : 'Nouveau plein de carburant'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Form Body ─────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="overflow-y-auto px-6 py-4 space-y-6">
            {/* ── Section : Véhicule & Agence ───────────────────────────── */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Véhicule &amp; Agence
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Véhicule (select) */}
                <div>
                  <label className={labelClass}>
                    Immatriculation <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="vehicleId"
                    value={form.vehicleId}
                    onChange={handleVehicleChange}
                    disabled={loadingVehicles}
                    className={`${inputBase} ${errors.vehicleRegistration ? inputError : ''} disabled:cursor-not-allowed disabled:opacity-60`}
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
                  {errors.vehicleRegistration && (
                    <p className="mt-1 text-xs text-red-500">{errors.vehicleRegistration}</p>
                  )}
                </div>

                {/* Agence (auto-rempli) */}
                <div>
                  <label className={labelClass}>
                    Agence <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="agencyId"
                    value={form.agencyId}
                    onChange={handleChange}
                    disabled={!!form.vehicleId}
                    className={`${inputBase} ${errors.agencyId ? inputError : ''} disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <option value="">Sélectionner une agence</option>
                    {agencies.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                  {!!form.vehicleId && (
                    <p className="mt-1 text-xs text-gray-400">
                      Rempli automatiquement depuis le véhicule
                    </p>
                  )}
                  {errors.agencyId && (
                    <p className="mt-1 text-xs text-red-500">{errors.agencyId}</p>
                  )}
                </div>
              </div>
            </section>

            {/* ── Section : Carburant ───────────────────────────────────── */}
            <section className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Carburant
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Date */}
                <div>
                  <label className={labelClass}>
                    Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    className={`${inputBase} ${errors.date ? inputError : ''}`}
                  />
                  {errors.date && (
                    <p className="mt-1 text-xs text-red-500">{errors.date}</p>
                  )}
                </div>

                {/* Type de carburant */}
                <div>
                  <label className={labelClass}>
                    Type de carburant <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="fuelType"
                    value={form.fuelType}
                    onChange={handleChange}
                    disabled={!!form.vehicleId}
                    className={`${inputBase} ${errors.fuelType ? inputError : ''} disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <option value="">Sélectionner un type</option>
                    <option value="DIESEL">Diesel</option>
                    <option value="HYBRID">Hybride</option>
                    <option value="ELECTRIC">Électrique</option>
                  </select>
                  {!!form.vehicleId && (
                    <p className="mt-1 text-xs text-gray-400">
                      Rempli automatiquement depuis le véhicule
                    </p>
                  )}
                  {errors.fuelType && (
                    <p className="mt-1 text-xs text-red-500">{errors.fuelType}</p>
                  )}
                </div>

                {/* Volume (litres) - Only for non-electric */}
                {!isElectric && (
                  <div>
                    <label className={labelClass}>
                      Volume (L) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      name="liters"
                      value={form.liters}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className={`${inputBase} ${errors.liters ? inputError : ''}`}
                    />
                    {errors.liters && (
                      <p className="mt-1 text-xs text-red-500">{errors.liters}</p>
                    )}
                  </div>
                )}

                {/* Prix unitaire (€/L) - Only for non-electric */}
                {!isElectric && (
                  <div>
                    <label className={labelClass}>
                      Prix unitaire (€/L) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      name="pricePerLiter"
                      value={form.pricePerLiter}
                      onChange={handleChange}
                      min="0"
                      step="0.001"
                      placeholder="0.000"
                      className={`${inputBase} ${errors.pricePerLiter ? inputError : ''}`}
                    />
                    {errors.pricePerLiter && (
                      <p className="mt-1 text-xs text-red-500">{errors.pricePerLiter}</p>
                    )}
                  </div>
                )}

                {/* Coût total (auto-calculé) */}
                <div>
                  <label className={labelClass}>
                    Coût total (€) <span className="text-red-400">*</span>
                    <span className="ml-2 text-xs font-normal text-blue-400">
                      (auto-calculé)
                    </span>
                  </label>
                  <input
                    type="number"
                    name="totalCost"
                    value={form.totalCost}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className={`${inputBase} ${errors.totalCost ? inputError : ''}`}
                  />
                  {errors.totalCost && (
                    <p className="mt-1 text-xs text-red-500">{errors.totalCost}</p>
                  )}
                </div>

                {/* Kilométrage au plein */}
                <div>
                  <label className={labelClass}>
                    Kilométrage au plein <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    name="mileageAtFill"
                    value={form.mileageAtFill}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    placeholder="0"
                    className={`${inputBase} ${errors.mileageAtFill ? inputError : ''}`}
                  />
                  {errors.mileageAtFill && (
                    <p className="mt-1 text-xs text-red-500">{errors.mileageAtFill}</p>
                  )}
                </div>

                {/* Distance depuis le dernier plein */}
                <div>
                  <label className={labelClass}>
                    Distance depuis dernier plein <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    name="distanceSinceLast"
                    value={form.distanceSinceLast}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    placeholder="0"
                    className={`${inputBase} ${errors.distanceSinceLast ? inputError : ''}`}
                  />
                  {errors.distanceSinceLast && (
                    <p className="mt-1 text-xs text-red-500">{errors.distanceSinceLast}</p>
                  )}
                </div>
              </div>
            </section>

            {/* ── Section : Conducteur & Station ───────────────────────── */}
            <section className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Conducteur &amp; Station
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Conducteur (select) */}
                <div>
                  <label className={labelClass}>
                    Conducteur <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="driverSelectedId" // Changed name
                    value={form.driverSelectedId} // Changed value
                    onChange={handleDriverChange}
                    disabled={loadingVehicles}
                    className={`${inputBase} ${errors.driverName ? inputError : ''} disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    <option value="">
                      {loadingVehicles ? 'Chargement...' : 'Sélectionner un conducteur'}
                    </option>
                    {drivers.map((d: any) => (
                      <option
                        key={d.id}
                        value={d.id} // value is d.id now
                      >
                        {d.firstName} {d.lastName}
                      </option>
                    ))}
                  </select>
                  {errors.driverName && (
                    <p className="mt-1 text-xs text-red-500">{errors.driverName}</p>
                  )}
                </div>

                {/* Station */}
                <div>
                  <label className={labelClass}>Station</label>
                  <input
                    type="text"
                    name="station"
                    value={form.station}
                    onChange={handleChange}
                    placeholder="Ex. Total, BP, Shell…"
                    className={`${inputBase} ${errors.station ? inputError : ''}`}
                  />
                  {errors.station && (
                    <p className="mt-1 text-xs text-red-500">{errors.station}</p>
                  )}
                </div>

                {/* Numéro de carte */}
                <div>
                  <label className={labelClass}>
                    Numéro de carte <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={form.cardNumber}
                    onChange={handleChange}
                    placeholder="XXXX-XXXX-XXXX-XXXX"
                    className={`${inputBase} ${errors.cardNumber ? inputError : ''}`}
                  />
                  {errors.cardNumber && (
                    <p className="mt-1 text-xs text-red-500">{errors.cardNumber}</p>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* ── Sticky Footer ─────────────────────────────────────────────── */}
          <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t bg-white px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || loadingVehicles}
              className="bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? 'Enregistrement…'
                : entry
                ? 'Mettre à jour'
                : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
