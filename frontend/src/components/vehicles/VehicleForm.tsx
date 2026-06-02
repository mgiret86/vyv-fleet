// ============================================================
// src/components/vehicles/VehicleForm.tsx
// ============================================================
// Corrections :
// 1. z.preprocess() supprimé sur arsApprovalExpiry et nextMaintenanceDate
//    → remplacé par z.string().nullable() (input = string | null, pas unknown)
//    → la transformation '' → null est faite dans onSubmit, pas dans le schéma
// 2. z.preprocess() supprimé sur monthlyLeaseCost
//    → remplacé par z.coerce.number().nullable()
//    → input = number | null (string sera coercé par z.coerce)
// 3. toast.success / toast.error : signature (message) sans title (useToast ne prend qu'un arg)
// 4. import React supprimé

import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from '@/hooks/useForm'
import { useToast } from '@/hooks/useToast'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import FormField from '@/components/ui/FormField'
import { useVehicleStore } from '@/store/vehicleStore'
import { useAppStore } from '@/store/useAppStore'
import type { Vehicle } from '@/types'

// ── Zod schema ────────────────────────────────────────────────────────────────
// RÈGLE : z.preprocess() type _input en unknown → incompatible avec useForm<T>
// Solution : utiliser des types Zod natifs avec .nullable()
const vehicleSchema = z.object({
  registration: z
    .string()
    .regex(/^[A-Z]{2}-[0-9]{3}-[A-Z]{2}$/, 'Format invalide (ex: AB-123-CD)'),
  brand:    z.string().min(2, 'La marque doit contenir au moins 2 caracteres'),
  model:    z.string().min(2, 'Le modele doit contenir au moins 2 caracteres'),
  category: z.enum(['AMBULANCE_A', 'AMBULANCE_B', 'VSL', 'TPMR', 'TAXI', 'SERVICE']),
  energy:   z.enum(['DIESEL', 'HYBRID', 'ELECTRIC', 'GASOLINE']),
  agencyId: z.string().min(1, "L'agence est requise"),
  mileage:  z.coerce.number().min(0, 'Le kilometrage ne peut pas etre negatif'),

  // number | null — z.coerce.number() accepte string, number, null
  monthlyLeaseCost: z.coerce.number().nullable(),

  // string | null — input typé string | null (pas unknown)
  arsApprovalExpiry:         z.string().nullable(),
  insuranceExpiry:           z.string().min(1, "L'assurance est requise"),
  technicalInspectionExpiry: z.string().min(1, 'Le controle technique est requis'),

  // string | null — idem
  nextMaintenanceDate: z.string().nullable(),
})

type VehicleFormData = z.infer<typeof vehicleSchema>

const INITIAL_VALUES: VehicleFormData = {
  registration:              '',
  brand:                     '',
  model:                     '',
  category:                  'AMBULANCE_A',
  energy:                    'DIESEL',
  agencyId:                  '',
  mileage:                   0,
  monthlyLeaseCost:          null,
  arsApprovalExpiry:         null,
  insuranceExpiry:           '',
  technicalInspectionExpiry: '',
  nextMaintenanceDate:       null,
}

interface VehicleFormProps {
  isOpen:   boolean
  onClose:  () => void
  vehicle?: Vehicle
}

export default function VehicleForm({ isOpen, onClose, vehicle }: VehicleFormProps) {
  const { addVehicle, updateVehicle } = useVehicleStore()
  const { agencies = [] }             = useAppStore()
  const toast                         = useToast()

  const { formData, errors, handleChange, handleSubmit, resetForm, setFormData } =
    useForm<VehicleFormData>(vehicleSchema, INITIAL_VALUES)

  useEffect(() => {
    if (!isOpen) return
    if (vehicle) {
      setFormData({
        registration:              vehicle.registration,
        brand:                     vehicle.brand,
        model:                     vehicle.model,
        category:                  vehicle.category,
        energy:                    vehicle.energy,
        agencyId:                  vehicle.agencyId,
        mileage:                   vehicle.mileage,
        monthlyLeaseCost:          vehicle.monthlyLeaseCost,
        // '' → null pour les champs date optionnels
        arsApprovalExpiry:         vehicle.arsApprovalExpiry || null,
        insuranceExpiry:           vehicle.insuranceExpiry,
        technicalInspectionExpiry: vehicle.technicalInspectionExpiry,
        nextMaintenanceDate:       vehicle.nextMaintenanceDate || null,
      })
    } else {
      resetForm()
    }
  }, [isOpen, vehicle])

  const onSubmit = async (data: VehicleFormData) => {
    const agencyName = agencies.find((a) => a.id === data.agencyId)?.name ?? 'Inconnu'

    // Normalisation '' → null pour les champs date optionnels
    const arsApprovalExpiry   = data.arsApprovalExpiry   === '' ? null : data.arsApprovalExpiry
    const nextMaintenanceDate = data.nextMaintenanceDate === '' ? null : data.nextMaintenanceDate

    const vehicleData: Omit<Vehicle, 'id'> = {
      registration:              data.registration,
      brand:                     data.brand,
      model:                     data.model,
      category:                  data.category,
      energy:                    data.energy,
      agencyId:                  data.agencyId,
      agencyName,
      mileage:                   data.mileage,
      monthlyLeaseCost:          data.monthlyLeaseCost,
      arsApprovalExpiry,
      insuranceExpiry:           data.insuranceExpiry,
      technicalInspectionExpiry: data.technicalInspectionExpiry,
      nextMaintenanceDate,
      complianceScore:           vehicle?.complianceScore ?? 100,
      status:                    vehicle?.status          ?? 'ACTIVE',
    }

    try {
      if (vehicle) {
        await updateVehicle(vehicle.id, vehicleData)
        toast.success('Vehicule mis a jour avec succes')
      } else {
        await addVehicle(vehicleData)
        toast.success('Vehicule ajoute avec succes')
      }
      onClose()
      resetForm()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inconnue'
      toast.error(`Echec de l'enregistrement : ${msg}`)
      console.error('[VehicleForm] onSubmit error:', err)
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSubmit(onSubmit, () => {
      toast.error('Veuillez corriger les erreurs du formulaire')
    })
  }

  const title = vehicle?.registration
    ? `Modifier ${vehicle.registration}`
    : 'Ajouter un vehicule'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Colonne gauche — identification */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Identification
            </h4>
            <FormField
              label="Immatriculation" name="registration"
              value={formData.registration} onChange={handleChange}
              error={errors.registration} placeholder="Ex: AB-123-CD" required
            />
            <FormField label="Marque" name="brand" value={formData.brand} onChange={handleChange} error={errors.brand} required />
            <FormField label="Modele" name="model" value={formData.model} onChange={handleChange} error={errors.model} required />
            <FormField
              label="Categorie" name="category" type="select"
              value={formData.category} onChange={handleChange} error={errors.category} required
              options={[
                { value: 'AMBULANCE_A', label: 'Ambulance A' },
                { value: 'AMBULANCE_B', label: 'Ambulance B' },
                { value: 'VSL',         label: 'VSL'         },
                { value: 'TPMR',        label: 'TPMR'        },
                { value: 'TAXI',        label: 'Taxi'        },
                { value: 'SERVICE',     label: 'Service'     },
              ]}
            />
            <FormField
              label="Energie" name="energy" type="select"
              value={formData.energy} onChange={handleChange} error={errors.energy} required
              options={[
                { value: 'DIESEL',   label: 'Diesel'     },
                { value: 'HYBRID',   label: 'Hybride'    },
                { value: 'ELECTRIC', label: 'Electrique' },
                { value: 'GASOLINE', label: 'Essence'    },
              ]}
            />
            <FormField
              label="Agence" name="agencyId" type="select"
              value={formData.agencyId} onChange={handleChange} error={errors.agencyId} required
              placeholder="Selectionner une agence"
              options={(agencies ?? []).map((a) => ({ value: a.id, label: a.name }))}
            />
          </div>

          {/* Colonne droite — kilométrage, coûts, échéances */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Kilometrage et couts
            </h4>
            <FormField
              label="Kilometrage (km)" name="mileage" type="number"
              value={formData.mileage} onChange={handleChange} error={errors.mileage} required
            />
            <FormField
              label="Cout de leasing mensuel (€)" name="monthlyLeaseCost" type="number"
              value={formData.monthlyLeaseCost ?? ''} onChange={handleChange}
              error={errors.monthlyLeaseCost}
              hint="Laisser vide si non applicable"
            />

            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-6 mb-4">
              Echeances administratives
            </h4>
            <FormField
              label="Expiration agrement ARS" name="arsApprovalExpiry" type="date"
              value={formData.arsApprovalExpiry ?? ''} onChange={handleChange}
              error={errors.arsApprovalExpiry}
              hint="Laisser vide si non concerne"
            />
            <FormField
              label="Expiration assurance" name="insuranceExpiry" type="date"
              value={formData.insuranceExpiry} onChange={handleChange}
              error={errors.insuranceExpiry} required
            />
            <FormField
              label="Expiration controle technique" name="technicalInspectionExpiry" type="date"
              value={formData.technicalInspectionExpiry} onChange={handleChange}
              error={errors.technicalInspectionExpiry} required
            />
            <FormField
              label="Prochaine maintenance" name="nextMaintenanceDate" type="date"
              value={formData.nextMaintenanceDate ?? ''} onChange={handleChange}
              error={errors.nextMaintenanceDate}
              hint="Laisser vide si non planifiee"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button type="button" variant="SECONDARY" onClick={onClose}>Annuler</Button>
          <Button type="submit"  variant="PRIMARY">Enregistrer</Button>
        </div>
      </form>
    </Modal>
  )
}