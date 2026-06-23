import { useEffect, useCallback } from 'react'
import { z } from 'zod'
import { useForm } from '@/hooks/useForm'
import { useToast } from '@/hooks/useToast'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { useVehicleStore }         from '@/store/vehicleStore'
import { useAppStore }             from '@/store/useAppStore'
import { useVehicleCategoryStore } from '@/store/vehicleCategoryStore'
import type { Vehicle } from '@/types'
import { Truck, Gauge, CalendarClock, Info, FileText, Radio } from 'lucide-react'

// ── Zod schema ─────────────────────────────────────────────────────
const vehicleSchema = z.object({
  registration:              z.string().regex(/^[A-Z]{2}-[0-9]{3}-[A-Z]{2}$/, 'Format invalide (ex: AB-123-CD)'),
  brand:                     z.string().min(2, 'Min. 2 caractères'),
  model:                     z.string().min(2, 'Min. 2 caractères'),
  category:                  z.string().min(1, 'Requis'),
  energy:                    z.enum(['DIESEL', 'HYBRID', 'ELECTRIC', 'GASOLINE']),
  agencyId:                  z.string().min(1, 'Requis'),
  mileage:                   z.coerce.number().min(0, 'Valeur négative impossible'),
  monthlyLeaseCost:          z.coerce.number().nullable(),
  arsApprovalExpiry:         z.string().nullable(),
  insuranceExpiry:           z.string().min(1, 'Requis'),
  technicalInspectionExpiry: z.string().min(1, 'Requis'),
  nextMaintenanceDate:       z.string().nullable(),
  // ── Données carte grise ────────────────────────────────────────
  color:                     z.string().nullable(),
  vin:                       z.string().nullable(),
  nationalGenre:             z.string().nullable(),
  co2Emission:               z.coerce.number().nullable(),
  seatingCapacity:           z.coerce.number().int().nullable(),
  // ── Matériels embarqués ───────────────────────────────────────
  imeiPda:                   z.string().nullable(),
  imeiTelematics:            z.string().nullable(),
})

type VehicleFormData = z.infer<typeof vehicleSchema>

const INITIAL: VehicleFormData = {
  registration: '', brand: '', model: '', category: '', energy: 'DIESEL',
  agencyId: '', mileage: 0, monthlyLeaseCost: null, arsApprovalExpiry: null,
  insuranceExpiry: '', technicalInspectionExpiry: '', nextMaintenanceDate: null,
  color: null, vin: null, nationalGenre: null, co2Emission: null,
  seatingCapacity: null, imeiPda: null, imeiTelematics: null,
}

interface VehicleFormProps {
  isOpen:   boolean
  onClose:  () => void
  vehicle?: Partial<Vehicle>
}

// ── Sous-composants champs ─────────────────────────────────────────
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function Input({ error, className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <>
      <input
        {...props}
        className={`w-full px-3 py-2 text-sm bg-white border rounded-lg text-gray-900 placeholder-gray-300 transition focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent ${
          error ? 'border-red-300 bg-red-50/30' : 'border-gray-200 hover:border-gray-300'
        } ${className}`}
      />
      {error && <p className="text-[10px] text-red-500 mt-0.5 font-medium">{error}</p>}
    </>
  )
}

function Select({ error, children, className = '', ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: string }) {
  return (
    <>
      <select
        {...props}
        className={`w-full px-3 py-2 text-sm bg-white border rounded-lg text-gray-900 transition focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent ${
          error ? 'border-red-300 bg-red-50/30' : 'border-gray-200 hover:border-gray-300'
        } ${className}`}
      >
        {children}
      </select>
      {error && <p className="text-[10px] text-red-500 mt-0.5 font-medium">{error}</p>}
    </>
  )
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

// ── Composant principal ────────────────────────────────────────────
export default function VehicleForm({ isOpen, onClose, vehicle }: VehicleFormProps) {
  const { addVehicle, updateVehicle } = useVehicleStore()
  const { agencies = [] }             = useAppStore()
  const { fetchCategories }           = useVehicleCategoryStore()
  const toast                         = useToast()

  const rawCategories = useVehicleCategoryStore((s) => s.categories)
  const categories    = rawCategories
    .filter((c) => c.isActive && !c.isSystem)
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label))
  const horsListe     = rawCategories.find((c) => c.isActive && c.isSystem)

  useEffect(() => { fetchCategories() }, [])

  const { formData, errors, handleChange, handleSubmit, resetForm, setFormData } =
    useForm<VehicleFormData>(vehicleSchema, INITIAL)

  const handleFieldChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      handleChange(e.target.name, e.target.value)
    },
    [handleChange]
  )

  useEffect(() => {
    if (!isOpen) return
    if (vehicle) {
      const snap             = useVehicleCategoryStore.getState().categories.filter((c) => c.isActive)
      const rawCategory      = vehicle.category ?? INITIAL.category
      const resolvedCategory =
        snap.find((c) => c.id    === rawCategory)?.id ??
        snap.find((c) => c.label === rawCategory)?.id ??
        INITIAL.category

      setFormData({
        registration:              vehicle.registration              ?? INITIAL.registration,
        brand:                     vehicle.brand                     ?? INITIAL.brand,
        model:                     vehicle.model                     ?? INITIAL.model,
        category:                  resolvedCategory,
        energy:                    vehicle.energy                    ?? INITIAL.energy,
        agencyId:                  vehicle.agencyId                  ?? INITIAL.agencyId,
        mileage:                   vehicle.mileage                   ?? INITIAL.mileage,
        monthlyLeaseCost:          vehicle.monthlyLeaseCost          ?? INITIAL.monthlyLeaseCost,
        arsApprovalExpiry:         vehicle.arsApprovalExpiry         ?? INITIAL.arsApprovalExpiry,
        insuranceExpiry:           vehicle.insuranceExpiry           ?? INITIAL.insuranceExpiry,
        technicalInspectionExpiry: vehicle.technicalInspectionExpiry ?? INITIAL.technicalInspectionExpiry,
        nextMaintenanceDate:       vehicle.nextMaintenanceDate       ?? INITIAL.nextMaintenanceDate,
        color:                     vehicle.color                     ?? INITIAL.color,
        vin:                       vehicle.vin                       ?? INITIAL.vin,
        nationalGenre:             vehicle.nationalGenre             ?? INITIAL.nationalGenre,
        co2Emission:               vehicle.co2Emission               ?? INITIAL.co2Emission,
        seatingCapacity:           vehicle.seatingCapacity           ?? INITIAL.seatingCapacity,
        imeiPda:                   vehicle.imeiPda                   ?? INITIAL.imeiPda,
        imeiTelematics:            vehicle.imeiTelematics            ?? INITIAL.imeiTelematics,
      })
    } else {
      resetForm()
    }
  }, [isOpen, vehicle])

  const onSubmit = async (data: VehicleFormData) => {
    const agencyName = agencies.find((a) => a.id === data.agencyId)?.name ?? 'Inconnu'
    const vehicleData: Omit<Vehicle, 'id'> = {
      ...data,
      agencyName,
      arsApprovalExpiry:   data.arsApprovalExpiry   === '' ? null : data.arsApprovalExpiry,
      nextMaintenanceDate: data.nextMaintenanceDate  === '' ? null : data.nextMaintenanceDate,
      complianceScore:     vehicle?.complianceScore ?? 100,
      status:              vehicle?.status          ?? 'ACTIVE',
    }
    try {
      if (vehicle?.id) {
        await updateVehicle(vehicle.id, vehicleData)
        toast.success('Véhicule mis à jour avec succès')
      } else {
        await addVehicle(vehicleData)
        toast.success('Véhicule ajouté avec succès')
      }
      onClose()
      resetForm()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      toast.error(`Échec : ${msg}`)
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSubmit(onSubmit, () => toast.error('Veuillez corriger les erreurs'))
  }

  const title = vehicle?.id
    ? `Modifier ${vehicle.registration}`
    : vehicle?.registration
      ? `Nouveau véhicule — ${vehicle.registration}`
      : 'Ajouter un véhicule'

  const isPrefilled = (f: keyof VehicleFormData) =>
    !vehicle?.id &&
    vehicle?.[f as keyof Vehicle] !== undefined &&
    vehicle?.[f as keyof Vehicle] !== null &&
    vehicle?.[f as keyof Vehicle] !== ''

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">

        {/* ── Bandeau pré-remplissage ── */}
        {!vehicle?.id && vehicle?.registration && (
          <div className="flex items-center gap-2.5 px-3 py-2 bg-violet-50 border border-violet-100 rounded-lg">
            <Info className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
            <p className="text-xs text-violet-700">
              Champs pré-remplis via l'API immatriculation. Vérifiez avant d'enregistrer.
            </p>
          </div>
        )}

        {/* ── Avertissement catégories vides ── */}
        {categories.length === 0 && (
          <div className="flex items-center gap-2.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <Info className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              Aucune catégorie créée. Allez dans <strong>Paramètres › Catégories</strong> pour en ajouter.
            </p>
          </div>
        )}

        {/* ── Grille 3 colonnes ── */}
        <div className="grid grid-cols-3 gap-x-5 gap-y-0">

          {/* ── Col 1 : Identification ── */}
          <div className="space-y-2.5">
            <SectionHeader icon={Truck} label="Identification" />

            <div>
              <Label required>Immatriculation</Label>
              <Input
                name="registration"
                value={formData.registration}
                onChange={handleFieldChange}
                error={errors.registration}
                placeholder="AB-123-CD"
                className={isPrefilled('registration') ? 'border-violet-300 bg-violet-50/40' : ''}
              />
            </div>

            <div>
              <Label required>Marque</Label>
              <Input
                name="brand"
                value={formData.brand}
                onChange={handleFieldChange}
                error={errors.brand}
                className={isPrefilled('brand') ? 'border-violet-300 bg-violet-50/40' : ''}
              />
            </div>

            <div>
              <Label required>Modèle</Label>
              <Input
                name="model"
                value={formData.model}
                onChange={handleFieldChange}
                error={errors.model}
                className={isPrefilled('model') ? 'border-violet-300 bg-violet-50/40' : ''}
              />
            </div>

            <div>
              <Label required>Catégorie</Label>
              <Select
                name="category"
                value={formData.category}
                onChange={handleFieldChange}
                error={errors.category}
              >
                <option value="">— Sélectionner —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
                {horsListe && (
                  <option value={horsListe.id}>{horsListe.label} (non classé)</option>
                )}
              </Select>
            </div>

            <div>
              <Label required>Énergie</Label>
              <Select
                name="energy"
                value={formData.energy}
                onChange={handleFieldChange}
                error={errors.energy}
              >
                <option value="DIESEL">Diesel</option>
                <option value="HYBRID">Hybride</option>
                <option value="ELECTRIC">Électrique</option>
                <option value="GASOLINE">Essence</option>
              </Select>
            </div>

            <div>
              <Label required>Agence</Label>
              <Select
                name="agencyId"
                value={formData.agencyId}
                onChange={handleFieldChange}
                error={errors.agencyId}
              >
                <option value="">— Sélectionner —</option>
                {agencies.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </Select>
            </div>
          </div>

          {/* ── Col 2 : Kilométrage & coûts ── */}
          <div className="space-y-2.5">
            <SectionHeader icon={Gauge} label="Kilométrage & coûts" />

            <div>
              <Label required>Kilométrage (km)</Label>
              <Input
                type="number"
                name="mileage"
                value={formData.mileage}
                onChange={handleFieldChange}
                error={errors.mileage}
                min={0}
              />
            </div>

            <div>
              <Label>Loyer mensuel (€)</Label>
              <Input
                type="number"
                name="monthlyLeaseCost"
                value={formData.monthlyLeaseCost ?? ''}
                onChange={handleFieldChange}
                error={errors.monthlyLeaseCost}
                placeholder="Vide si N/A"
              />
            </div>
          </div>

          {/* ── Col 3 : Échéances ── */}
          <div className="space-y-2.5">
            <SectionHeader icon={CalendarClock} label="Échéances" />

            <div>
              <Label>Agrément ARS</Label>
              <Input
                type="date"
                name="arsApprovalExpiry"
                value={formData.arsApprovalExpiry ?? ''}
                onChange={handleFieldChange}
                error={errors.arsApprovalExpiry}
                className={isPrefilled('arsApprovalExpiry') ? 'border-violet-300 bg-violet-50/40' : ''}
              />
            </div>

            <div>
              <Label required>Assurance</Label>
              <Input
                type="date"
                name="insuranceExpiry"
                value={formData.insuranceExpiry}
                onChange={handleFieldChange}
                error={errors.insuranceExpiry}
              />
            </div>

            <div>
              <Label required>Contrôle technique</Label>
              <Input
                type="date"
                name="technicalInspectionExpiry"
                value={formData.technicalInspectionExpiry}
                onChange={handleFieldChange}
                error={errors.technicalInspectionExpiry}
                className={isPrefilled('technicalInspectionExpiry') ? 'border-violet-300 bg-violet-50/40' : ''}
              />
            </div>

            <div>
              <Label>Prochaine maintenance</Label>
              <Input
                type="date"
                name="nextMaintenanceDate"
                value={formData.nextMaintenanceDate ?? ''}
                onChange={handleFieldChange}
                error={errors.nextMaintenanceDate}
              />
            </div>
          </div>
        </div>

        {/* ── Données carte grise ── */}
        <div className="border-t border-gray-100 pt-4">
          <SectionHeader icon={FileText} label="Données carte grise" />
          <div className="grid grid-cols-5 gap-x-4 gap-y-2.5">
            <div>
              <Label>Couleur</Label>
              <Input
                name="color"
                value={formData.color ?? ''}
                onChange={handleFieldChange}
                error={errors.color}
                placeholder="Ex : Blanc"
                className={isPrefilled('color') ? 'border-violet-300 bg-violet-50/40' : ''}
              />
            </div>
            <div>
              <Label>Code VIN (E)</Label>
              <Input
                name="vin"
                value={formData.vin ?? ''}
                onChange={handleFieldChange}
                error={errors.vin}
                placeholder="17 caractères"
                className={isPrefilled('vin') ? 'border-violet-300 bg-violet-50/40' : ''}
              />
            </div>
            <div>
              <Label>Genre national (J.1)</Label>
              <Input
                name="nationalGenre"
                value={formData.nationalGenre ?? ''}
                onChange={handleFieldChange}
                error={errors.nationalGenre}
                placeholder="Ex : VASP"
                className={isPrefilled('nationalGenre') ? 'border-violet-300 bg-violet-50/40' : ''}
              />
            </div>
            <div>
              <Label>CO₂ g/km (V.7)</Label>
              <Input
                type="number"
                name="co2Emission"
                value={formData.co2Emission ?? ''}
                onChange={handleFieldChange}
                error={errors.co2Emission}
                placeholder="Ex : 120"
                min={0}
                className={isPrefilled('co2Emission') ? 'border-violet-300 bg-violet-50/40' : ''}
              />
            </div>
            <div>
              <Label>Places assises (S.1)</Label>
              <Input
                type="number"
                name="seatingCapacity"
                value={formData.seatingCapacity ?? ''}
                onChange={handleFieldChange}
                error={errors.seatingCapacity}
                placeholder="Ex : 3"
                min={1}
                className={isPrefilled('seatingCapacity') ? 'border-violet-300 bg-violet-50/40' : ''}
              />
            </div>
          </div>
        </div>

        {/* ── Matériels embarqués ── */}
        <div className="border-t border-gray-100 pt-4">
          <SectionHeader icon={Radio} label="Matériels embarqués" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            <div>
              <Label>N° IMEI PDA</Label>
              <Input
                name="imeiPda"
                value={formData.imeiPda ?? ''}
                onChange={handleFieldChange}
                error={errors.imeiPda}
                placeholder="15 chiffres"
              />
            </div>
            <div>
              <Label>N° IMEI Boitier Télématique</Label>
              <Input
                name="imeiTelematics"
                value={formData.imeiTelematics ?? ''}
                onChange={handleFieldChange}
                error={errors.imeiTelematics}
                placeholder="15 chiffres"
              />
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 mt-1">
          <Button type="button" variant="SECONDARY" onClick={onClose}>Annuler</Button>
          <Button type="submit" variant="PRIMARY">
            {vehicle?.id ? 'Enregistrer les modifications' : 'Ajouter le véhicule'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
