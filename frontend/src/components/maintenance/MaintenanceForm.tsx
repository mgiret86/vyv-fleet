import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useVehicleStore } from '@/store/vehicleStore'
import type { MaintenanceRecord } from '@/types'

interface MaintenanceFormProps {
  isOpen:       boolean
  onClose:      () => void
  maintenance?: MaintenanceRecord
  onSave:       (m: MaintenanceRecord) => void
}

interface FormErrors {
  vehicleId?:    string
  type?:         string
  label?:        string
  scheduledDate?: string
}

const MAINTENANCE_TYPES: { value: MaintenanceRecord['type']; label: string }[] = [
  { value: 'PREVENTIVE',  label: 'Préventive'    },
  { value: 'CORRECTIVE',  label: 'Corrective'    },
  { value: 'REGULATORY',  label: 'Réglementaire' },
  { value: 'SANITAIRE',   label: 'Sanitaire'     },
]

const MAINTENANCE_STATUSES: { value: MaintenanceRecord['status']; label: string }[] = [
  { value: 'SCHEDULED',   label: 'Planifiée' },
  { value: 'IN_PROGRESS', label: 'En cours'  },
  { value: 'COMPLETED',   label: 'Terminée'  },
  { value: 'CANCELLED',   label: 'Annulée'   },
]


function toDateInputValue(dateStr?: string | null): string {
  if (!dateStr) return ''
  return dateStr.slice(0, 10)
}

export default function MaintenanceForm({ isOpen, onClose, maintenance, onSave }: MaintenanceFormProps) {
  const vehicles   = useVehicleStore((s) => s.vehicles)
  const toISO = (d: string | null | undefined): string | null =>
    d ? (d.includes('T') ? d : d + 'T00:00:00.000Z') : null
  const isEditMode = Boolean(maintenance)

  const [vehicleId,            setVehicleId]            = useState<string>('')
  const [type,                 setType]                 = useState<MaintenanceRecord['type']>('PREVENTIVE')
  const [label,                setLabel]                = useState<string>('')
  const [description,          setDescription]          = useState<string>('')
  const [scheduledDate,        setScheduledDate]        = useState<string>('')
  const [status,               setStatus]               = useState<MaintenanceRecord['status']>('SCHEDULED')
  const [provider,             setProvider]             = useState<string>('')
  const [estimatedCost,        setEstimatedCost]        = useState<string>('')
  const [realCost,             setRealCost]             = useState<string>('')
  const [mileageAtMaintenance, setMileageAtMaintenance] = useState<string>('')
  const [notes,                setNotes]                = useState<string>('')
  const [errors,               setErrors]               = useState<FormErrors>({})

  useEffect(() => {
    if (!isOpen) return
    setVehicleId(maintenance?.vehicleId ?? '')
    setType(maintenance?.type ?? 'PREVENTIVE')
    setLabel(maintenance?.label ?? '')
    setDescription(maintenance?.description ?? '')
    setScheduledDate(toDateInputValue(maintenance?.scheduledDate))
    setStatus(maintenance?.status ?? 'SCHEDULED')
    setProvider(maintenance?.provider ?? '')
    setEstimatedCost(maintenance?.estimatedCost != null ? String(maintenance.estimatedCost) : '')
    setRealCost(maintenance?.realCost       != null ? String(maintenance.realCost)       : '')
    setMileageAtMaintenance(maintenance?.mileageAtMaintenance != null ? String(maintenance.mileageAtMaintenance) : '')
    setNotes(maintenance?.notes ?? '')
    setErrors({})
  }, [maintenance, isOpen])

  function validate(): boolean {
    const newErrors: FormErrors = {}
    if (!vehicleId.trim())    newErrors.vehicleId    = 'Le véhicule est requis.'
    if (!type)                newErrors.type         = 'Le type est requis.'
    if (!label.trim())        newErrors.label        = 'Le libellé est requis.'
    if (!scheduledDate)       newErrors.scheduledDate = 'La date planifiée est requise.'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    // Récupération des infos véhicule depuis le catalogue mock
    const vehicleInfo = vehicles.find((v) => v.id === vehicleId)

    const record: MaintenanceRecord = {
      id:                   isEditMode ? maintenance!.id : crypto.randomUUID(),
      vehicleId:            vehicleId.trim(),
      vehicleRegistration:  vehicleInfo?.registration ?? vehicleId,
      vehicleBrand:         vehicleInfo?.brand        ?? '',
      vehicleModel:         vehicleInfo?.model        ?? '',
      agencyId:             vehicleInfo?.agencyId     ?? '',
      agencyName:           vehicleInfo?.agencyName   ?? '',
      type,
      label:                label.trim(),
      description:          description.trim() || '',
      scheduledDate: toISO(scheduledDate) ?? scheduledDate,
      completedDate:        status === 'COMPLETED' ? (toISO(maintenance?.completedDate) ?? new Date().toISOString()) : null,
      status,
      provider:             provider.trim() || null,
      estimatedCost:        estimatedCost        !== '' ? parseFloat(estimatedCost)        : null,
      realCost:             status === 'COMPLETED' && realCost !== '' ? parseFloat(realCost) : null,
      mileageAtMaintenance: mileageAtMaintenance !== '' ? parseInt(mileageAtMaintenance, 10) : null,
      notes:                notes.trim() || null,
    }

    onSave(record)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog" aria-modal="true" aria-labelledby="maintenance-form-title">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">

        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl bg-white px-6 py-4 border-b border-gray-200">
          <h2 id="maintenance-form-title" className="text-lg font-semibold text-gray-900">
            {isEditMode ? "Modifier l'intervention" : 'Nouvelle intervention de maintenance'}
          </h2>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors" aria-label="Fermer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="px-6 py-6 space-y-5">

          {/* Véhicule */}
          <div>
            <label htmlFor="vehicleId" className="block text-sm font-medium text-gray-700 mb-1">
              Véhicule <span className="text-red-500">*</span>
            </label>
            <select id="vehicleId" value={vehicleId}
              onChange={(e) => { setVehicleId(e.target.value); setErrors((p) => ({ ...p, vehicleId: undefined })) }}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.vehicleId ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}>
              <option value="">— Sélectionner un véhicule —</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registration} — {v.brand} {v.model}</option>)}
            </select>
            {errors.vehicleId && <p className="mt-1 text-xs text-red-500">{errors.vehicleId}</p>}
          </div>

          {/* Type + Statut */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
              <select id="type" value={type}
                onChange={(e) => { setType(e.target.value as MaintenanceRecord['type']); setErrors((p) => ({ ...p, type: undefined })) }}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.type ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}>
                {MAINTENANCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              {errors.type && <p className="mt-1 text-xs text-red-500">{errors.type}</p>}
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
              <select id="status" value={status}
                onChange={(e) => setStatus(e.target.value as MaintenanceRecord['status'])}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                {MAINTENANCE_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* Libellé */}
          <div>
            <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-1">Libellé <span className="text-red-500">*</span></label>
            <input id="label" type="text" value={label}
              onChange={(e) => { setLabel(e.target.value); setErrors((p) => ({ ...p, label: undefined })) }}
              placeholder="Ex: Vidange moteur"
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.label ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`} />
            {errors.label && <p className="mt-1 text-xs text-red-500">{errors.label}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              placeholder="Détails de l'intervention..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
          </div>

          {/* Date + Prestataire */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700 mb-1">Date planifiée <span className="text-red-500">*</span></label>
              <input id="scheduledDate" type="date" value={scheduledDate}
                onChange={(e) => { setScheduledDate(e.target.value); setErrors((p) => ({ ...p, scheduledDate: undefined })) }}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${errors.scheduledDate ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`} />
              {errors.scheduledDate && <p className="mt-1 text-xs text-red-500">{errors.scheduledDate}</p>}
            </div>
            <div>
              <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-1">Prestataire</label>
              <input id="provider" type="text" value={provider} onChange={(e) => setProvider(e.target.value)}
                placeholder="Nom du garage / prestataire"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
          </div>

          {/* Coût estimé + Kilométrage */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="estimatedCost" className="block text-sm font-medium text-gray-700 mb-1">Coût estimé (€)</label>
              <input id="estimatedCost" type="number" min={0} step={0.01} value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)}
                placeholder="0.00" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
            <div>
              <label htmlFor="mileageAtMaintenance" className="block text-sm font-medium text-gray-700 mb-1">Kilométrage</label>
              <input id="mileageAtMaintenance" type="number" min={0} step={1} value={mileageAtMaintenance} onChange={(e) => setMileageAtMaintenance(e.target.value)}
                placeholder="Ex: 85000" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
          </div>

          {status === 'COMPLETED' && (
            <div>
              <label htmlFor="realCost" className="block text-sm font-medium text-gray-700 mb-1">Coût réel (€)</label>
              <input id="realCost" type="number" min={0} step={0.01} value={realCost} onChange={(e) => setRealCost(e.target.value)}
                placeholder="0.00" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
          )}

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              placeholder="Observations supplémentaires…"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Annuler
            </button>
            <button type="submit"
              className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors">
              {isEditMode ? 'Mettre à jour' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}