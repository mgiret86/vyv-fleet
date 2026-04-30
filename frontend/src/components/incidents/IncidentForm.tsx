import { useAppStore } from '@/store/useAppStore'
import { useVehicleStore } from '@/store/vehicleStore'
import { useState, useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import type { Incident, IncidentType, IncidentSeverity, IncidentStatus } from '@/data/mockIncidents'

// AGENCIES chargées dynamiquement via useAppStore

type IncidentFormProps = {
  incident?: Incident
  onClose:   () => void
  onSave:    (incident: Incident) => void
}

// État initial entièrement typé — tous les champs null remplacés par '' pour les inputs
function buildInitial(incident?: Incident): Incident {
  if (incident) {
    return {
      ...incident,
      date:            incident.date            ? new Date(incident.date).toISOString().split('T')[0]            : '',
      declarationDate: incident.declarationDate ? new Date(incident.declarationDate).toISOString().split('T')[0] : '',
    }
  }
  return {
    id:                   '',
    vehicleId:            '',
    vehicleRegistration:  '',
    agencyId:             '',
    agencyName:           '',
    date:                 '',
    declarationDate:      '',
    type:                 'ACCIDENT' as IncidentType,
    severity:             'MINOR'    as IncidentSeverity,
    status:               'OPEN'     as IncidentStatus,
    description:          '',
    location:             '',
    driverName:           null,
    driverResponsible:    false,
    injuredPersons:       0,
    patientInVehicle:     false,
    thirdPartyInvolved:   false,
    thirdPartyInsurance:  null,
    insuranceReference:   null,
    estimatedRepairCost:  null,
    realRepairCost:       null,
    immobilizationDays:   null,
    repairProvider:       null,
    notes:                null,
  }
}

export default function IncidentForm({ incident, onClose, onSave }: IncidentFormProps) {
  const isEditMode = !!incident
  const agencies = useAppStore((s) => s.agencies)
  const vehicles      = useVehicleStore((s) => s.vehicles)
  const fetchVehicles = useVehicleStore((s) => s.fetchVehicles)
  const [form, setForm] = useState<Incident>(() => buildInitial(incident))

  useEffect(() => {
    if (vehicles.length === 0) fetchVehicles()
  }, [vehicles.length, fetchVehicles])

  useEffect(() => {
    setForm(buildInitial(incident))
  }, [incident])

  // Gestion des champs texte et select
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    // Synchronisation agencyName quand agencyId change
    if (name === 'agencyId') {
      const agency = agencies.find((a) => a.id === value)
      setForm((prev) => ({ ...prev, agencyId: value, agencyName: agency?.name ?? '' }))
      return
    }

    if (type === 'number') {
      const parsed = parseFloat(value)
      setForm((prev) => ({ ...prev, [name]: isNaN(parsed) ? null : parsed }))
      return
    }

    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: checked }))
  }

  const handleSave = () => {
    if (!form.vehicleRegistration || !form.date || !form.type || !form.severity || !form.status) {
      alert('Veuillez remplir tous les champs obligatoires.')
      return
    }
    const toSave: Incident = { ...form }
    if (!isEditMode) toSave.id = `inc-${Date.now()}`
    onSave(toSave)
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-violet-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditMode ? 'Modifier le sinistre' : 'Nouveau sinistre'}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Fermer">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-grow overflow-y-auto space-y-6">

          {/* Section 1 — Informations générales */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations générales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="md:col-span-2">
                <label htmlFor="vehicleId" className="block text-xs font-medium text-gray-700 mb-1">
                  Véhicule <span className="text-red-500">*</span>
                </label>
                <select
                  id="vehicleId"
                  name="vehicleId"
                  value={form.vehicleId}
                  onChange={(e) => {
                    const v = vehicles.find((x) => x.id === e.target.value)
                    if (!v) return
                    setForm((prev) => ({
                      ...prev,
                      vehicleId:           v.id,
                      vehicleRegistration: v.registration,
                      agencyId:            v.agencyId,
                      agencyName:          v.agencyName ?? '',
                    }))
                  }}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                  required
                >
                  <option value="">-- Sélectionner un véhicule --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registration} — {v.brand} {v.model} ({v.agencyName ?? ''})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="date" className="block text-xs font-medium text-gray-700 mb-1">
                  Date du sinistre <span className="text-red-500">*</span>
                </label>
                <input type="date" id="date" name="date" value={form.date} onChange={handleChange}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-violet-500" required />
              </div>

              <div>
                <label htmlFor="declarationDate" className="block text-xs font-medium text-gray-700 mb-1">Date de déclaration</label>
                <input type="date" id="declarationDate" name="declarationDate" value={form.declarationDate} onChange={handleChange}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>

              <div>
                <label htmlFor="type" className="block text-xs font-medium text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
                <select id="type" name="type" value={form.type} onChange={handleChange}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white" required>
                  <option value="ACCIDENT">Accident</option>
                  <option value="THEFT">Vol</option>
                  <option value="VANDALISM">Vandalisme</option>
                  <option value="BREAKDOWN">Panne</option>
                </select>
              </div>

              <div>
                <label htmlFor="severity" className="block text-xs font-medium text-gray-700 mb-1">Gravité <span className="text-red-500">*</span></label>
                <select id="severity" name="severity" value={form.severity} onChange={handleChange}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white" required>
                  <option value="CRITICAL">Critique</option>
                  <option value="MAJOR">Majeure</option>
                  <option value="MINOR">Mineure</option>
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-xs font-medium text-gray-700 mb-1">Statut <span className="text-red-500">*</span></label>
                <select id="status" name="status" value={form.status} onChange={handleChange}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white" required>
                  <option value="OPEN">Ouvert</option>
                  <option value="IN_PROGRESS">En cours</option>
                  <option value="CLOSED">Fermé</option>
                </select>
              </div>
            </div>
          </section>

          {/* Section 2 — Détails */}
          <section className="border-t border-gray-100 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Détails de l'incident</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea id="description" name="description" value={form.description} onChange={handleChange} rows={3}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div>
                <label htmlFor="location" className="block text-xs font-medium text-gray-700 mb-1">Lieu</label>
                <input type="text" id="location" name="location" value={form.location} onChange={handleChange}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div>
                <label htmlFor="driverName" className="block text-xs font-medium text-gray-700 mb-1">Nom du conducteur</label>
                {/* driverName est string | null → value={} accepte string uniquement */}
                <input type="text" id="driverName" name="driverName"
                  value={form.driverName ?? ''} onChange={handleChange}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="driverResponsible" name="driverResponsible"
                  checked={form.driverResponsible} onChange={handleCheckboxChange}
                  className="h-4 w-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500" />
                <label htmlFor="driverResponsible" className="ml-2 block text-sm text-gray-900">Conducteur responsable</label>
              </div>
              <div>
                <label htmlFor="injuredPersons" className="block text-xs font-medium text-gray-700 mb-1">Personnes blessées</label>
                <input type="number" id="injuredPersons" name="injuredPersons"
                  value={form.injuredPersons} onChange={handleChange} min="0"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="patientInVehicle" name="patientInVehicle"
                  checked={form.patientInVehicle} onChange={handleCheckboxChange}
                  className="h-4 w-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500" />
                <label htmlFor="patientInVehicle" className="ml-2 block text-sm text-gray-900">Patient dans le véhicule</label>
              </div>
            </div>
          </section>

          {/* Section 3 — Tiers & Assurance */}
          <section className="border-t border-gray-100 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tiers & Assurance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input type="checkbox" id="thirdPartyInvolved" name="thirdPartyInvolved"
                  checked={form.thirdPartyInvolved} onChange={handleCheckboxChange}
                  className="h-4 w-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500" />
                <label htmlFor="thirdPartyInvolved" className="ml-2 block text-sm text-gray-900">Tiers impliqué</label>
              </div>
              {form.thirdPartyInvolved && (
                <div>
                  <label htmlFor="thirdPartyInsurance" className="block text-xs font-medium text-gray-700 mb-1">Assurance du tiers</label>
                  <input type="text" id="thirdPartyInsurance" name="thirdPartyInsurance"
                    value={form.thirdPartyInsurance ?? ''} onChange={handleChange}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              )}
              <div className="md:col-span-2">
                <label htmlFor="insuranceReference" className="block text-xs font-medium text-gray-700 mb-1">Référence assurance</label>
                <input type="text" id="insuranceReference" name="insuranceReference"
                  value={form.insuranceReference ?? ''} onChange={handleChange}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
            </div>
          </section>

          {/* Section 4 — Réparation & Coûts */}
          <section className="border-t border-gray-100 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Réparation & Coûts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="estimatedRepairCost" className="block text-xs font-medium text-gray-700 mb-1">Coût estimé réparation (€)</label>
                <input type="number" id="estimatedRepairCost" name="estimatedRepairCost"
                  value={form.estimatedRepairCost ?? ''} onChange={handleChange} min="0" step="0.01"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div>
                <label htmlFor="realRepairCost" className="block text-xs font-medium text-gray-700 mb-1">Coût réel réparation (€)</label>
                <input type="number" id="realRepairCost" name="realRepairCost"
                  value={form.realRepairCost ?? ''} onChange={handleChange} min="0" step="0.01"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div>
                <label htmlFor="immobilizationDays" className="block text-xs font-medium text-gray-700 mb-1">Jours d'immobilisation</label>
                <input type="number" id="immobilizationDays" name="immobilizationDays"
                  value={form.immobilizationDays ?? ''} onChange={handleChange} min="0"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div>
                <label htmlFor="repairProvider" className="block text-xs font-medium text-gray-700 mb-1">Prestataire de réparation</label>
                <input type="text" id="repairProvider" name="repairProvider"
                  value={form.repairProvider ?? ''} onChange={handleChange}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="notes" className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <textarea id="notes" name="notes"
                  value={form.notes ?? ''} onChange={handleChange} rows={3}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-100 sticky bottom-0 bg-white z-10">
          <button type="button" onClick={onClose}
            className="mr-3 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button type="button" onClick={handleSave}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 transition-colors">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}