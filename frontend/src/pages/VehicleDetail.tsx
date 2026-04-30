import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Truck, Award } from 'lucide-react'
import { useVehicleStore } from '@/store/vehicleStore'
import Layout from '@/components/layout/Layout'
import Button from '@/components/ui/Button'
import VehicleCategoryBadge from '@/components/vehicles/VehicleCategoryBadge'
import VehicleStatusBadge from '@/components/vehicles/VehicleStatusBadge'
import VehicleForm from '@/components/vehicles/VehicleForm'
import VehicleStatusModal from '@/components/vehicles/VehicleStatusModal'

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-base font-semibold text-gray-700 mb-4 border-b border-gray-100 pb-2">
        {title}
      </h2>
      {children}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value ?? 'Non renseigne'}</span>
    </div>
  )
}

function ComplianceScore({ score }: { score: number }) {
  const color =
    score >= 80 ? 'text-green-600 bg-green-50' :
    score >= 60 ? 'text-orange-600 bg-orange-50' :
                  'text-red-600 bg-red-50'
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${color}`}>
      <Award className="h-4 w-4" />
      Score conformite : {score} / 100
    </div>
  )
}

function ExpiryRow({ label, date }: { label: string; date: string | null | undefined }) {
  if (!date) return <InfoRow label={label} value="Non renseigne" />

  const days = Math.ceil(
    (new Date(date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )
  const color =
    days < 0  ? 'text-red-600 font-semibold'    :
    days < 30 ? 'text-orange-600 font-semibold' :
    days < 90 ? 'text-yellow-600'               :
                'text-green-600'

  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <div className="text-right">
        <p className="text-sm font-medium text-gray-800">{date}</p>
        <p className={`text-xs ${color}`}>
          {days < 0 ? `Expiré depuis ${Math.abs(days)} jours` : `${days} jours restants`}
        </p>
      </div>
    </div>
  )
}

const ENERGY_LABELS = {
  DIESEL:   'Diesel',
  HYBRID:   'Hybride',
  ELECTRIC: 'Electrique',
  GASOLINE: 'Essence',
} as const

export default function VehicleDetail() {
  const { id }     = useParams<{ id: string }>()
  const navigate   = useNavigate()
  const { vehicles } = useVehicleStore()
  const vehicle    = vehicles.find((v) => v.id === id)

  const [isFormModalOpen,   setIsFormModalOpen]   = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)

  if (!vehicle) {
    return (
      <Layout>
        <div className="p-6 text-center">
          <p className="text-gray-500 text-sm mb-4">
            Ce vehicule est introuvable ou a ete supprime.
          </p>
          <Button variant="PRIMARY" onClick={() => navigate('/vehicles')}>
            Retour a la liste
          </Button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">

        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/vehicles')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-violet-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux vehicules
          </button>
          <div className="flex gap-3">
            <Button
              variant="OUTLINE"
              onClick={() => setIsStatusModalOpen(true)}
              leftIcon={<Truck className="h-4 w-4" />}
            >
              Changer statut
            </Button>
            <Button
              variant="PRIMARY"
              onClick={() => setIsFormModalOpen(true)}
              leftIcon={<Edit className="h-4 w-4" />}
            >
              Modifier
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {vehicle.brand} {vehicle.model}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {vehicle.registration} · {vehicle.agencyName}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <VehicleCategoryBadge category={vehicle.category} />
                <VehicleStatusBadge   status={vehicle.status}   />
              </div>
            </div>
            <ComplianceScore score={vehicle.complianceScore} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InfoCard title="Informations generales">
            <InfoRow label="Energie"              value={ENERGY_LABELS[vehicle.energy] ?? vehicle.energy} />
            <InfoRow label="Kilometrage"           value={`${vehicle.mileage.toLocaleString('fr-FR')} km`} />
            <InfoRow label="Agence"               value={vehicle.agencyName} />
            <InfoRow
              label="Cout mensuel (leasing)"
              value={vehicle.monthlyLeaseCost
                ? `${vehicle.monthlyLeaseCost.toLocaleString('fr-FR')} EUR`
                : 'Non applicable'}
            />
          </InfoCard>

          <InfoCard title="Echeances administratives">
            <ExpiryRow label="Agrement ARS"        date={vehicle.arsApprovalExpiry}         />
            <ExpiryRow label="Assurance"            date={vehicle.insuranceExpiry}           />
            <ExpiryRow label="Controle technique"   date={vehicle.technicalInspectionExpiry} />
            <ExpiryRow label="Prochaine maintenance" date={vehicle.nextMaintenanceDate}       />
          </InfoCard>
        </div>

      </div>

      {isFormModalOpen && (
        <VehicleForm
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          vehicle={vehicle}
        />
      )}

      {isStatusModalOpen && (
        <VehicleStatusModal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          vehicle={vehicle}
        />
      )}
    </Layout>
  )
}