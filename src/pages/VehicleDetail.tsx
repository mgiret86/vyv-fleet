import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit, Truck, Award, Car, Calendar, Fuel, Building2, FileText, Radio, Cpu } from 'lucide-react'
import { useVehicleStore }         from '@/store/vehicleStore'
import Button                      from '@/components/ui/Button'
import VehicleCategoryBadge        from '@/components/vehicles/VehicleCategoryBadge'
import VehicleStatusBadge          from '@/components/vehicles/VehicleStatusBadge'
import VehicleForm                 from '@/components/vehicles/VehicleForm'
import VehicleStatusModal          from '@/components/vehicles/VehicleStatusModal'
import VehicleMaintenanceTab       from '@/components/vehicles/VehicleMaintenanceTab'
import VehicleFinanceTab           from '@/components/vehicles/VehicleFinanceTab'

// ── Helpers ────────────────────────────────────────────────────────
const ENERGY_LABELS: Record<string, string> = {
  DIESEL:   'Diesel',
  HYBRID:   'Hybride',
  ELECTRIC: 'Électrique',
  GASOLINE: 'Essence',
}

type DetailTab = 'info' | 'maintenance' | 'finance'

function getDays(date: string | null | undefined): number | null {
  if (!date) return null
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ── Sous-composants ────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 font-medium">{label}</span>
      <span className="text-sm font-semibold text-gray-800 text-right">{value ?? '—'}</span>
    </div>
  )
}

function ExpiryRow({ label, date }: { label: string; date: string | null | undefined }) {
  const days = getDays(date)

  const badge =
    days === null ? null :
    days < 0      ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">Expiré ({Math.abs(days)}j)</span> :
    days <= 30    ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">J-{days}</span> :
    days <= 90    ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">J-{days}</span> :
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">J-{days}</span>

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 font-medium">{label}</span>
      <div className="flex flex-col items-end gap-1">
        <span className="text-sm font-semibold text-gray-800">{formatDate(date)}</span>
        {badge}
      </div>
    </div>
  )
}

// ── Page principale ────────────────────────────────────────────────
export default function VehicleDetail() {
  const { id }       = useParams<{ id: string }>()
  const navigate     = useNavigate()
  const { vehicles } = useVehicleStore()
  const vehicle      = vehicles.find((v) => v.id === id)

  const [activeTab,         setActiveTab]         = useState<DetailTab>('info')
  const [isFormModalOpen,   setIsFormModalOpen]   = useState(false)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false)

  if (!vehicle) {
    return (
      <div className="p-8 text-center">
        <Car className="w-12 h-12 text-gray-200 mx-auto mb-4" />
        <p className="text-gray-500 text-sm font-medium mb-6">Ce véhicule est introuvable ou a été supprimé.</p>
        <Button variant="PRIMARY" onClick={() => navigate('/vehicles')}>
          Retour à la liste
        </Button>
      </div>
    )
  }

  const score      = vehicle.complianceScore
  const scoreColor = score >= 80
    ? 'text-green-600 bg-green-50 border-green-200'
    : score >= 60
      ? 'text-amber-600 bg-amber-50 border-amber-200'
      : 'text-red-600 bg-red-50 border-red-200'

  const TABS = [
    { id: 'info'        as DetailTab, label: 'Informations'          },
    { id: 'maintenance' as DetailTab, label: 'Cycles de maintenance' },
    { id: 'finance'     as DetailTab, label: 'Contrat & Financement' },
  ]

  // Vérifie si au moins un champ carte grise est renseigné
  const hasCarteGrise =
    vehicle.color        ||
    vehicle.vin          ||
    vehicle.nationalGenre ||
    vehicle.co2Emission  ||
    vehicle.seatingCapacity

  // Vérifie si au moins un IMEI est renseigné
  const hasTelematics = vehicle.imeiPda || vehicle.imeiTelematics

  return (
    <>
      {/* ── Header gradient ── */}
      <div className="bg-gradient-to-r from-violet-950 to-violet-800 rounded-2xl px-6 py-5 mb-6 shadow-lg">
        <div className="flex items-center justify-between gap-4 flex-wrap">

          <div className="flex items-center gap-4 flex-wrap flex-1 min-w-0">
            {/* Retour */}
            <button
              onClick={() => navigate('/vehicles')}
              className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>

            {/* Icône véhicule */}
            <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0">
              <Car className="w-6 h-6 text-white" />
            </div>

            {/* Infos principales */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-white">
                  {vehicle.brand} {vehicle.model}
                </h1>
                <VehicleCategoryBadge category={vehicle.category} />
                <VehicleStatusBadge   status={vehicle.status}   />
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-violet-300 text-xs font-mono font-semibold">{vehicle.registration}</span>
                {vehicle.vin && (
                  <>
                    <span className="text-violet-500 text-xs">·</span>
                    <span className="text-violet-400 text-xs font-mono">VIN : {vehicle.vin}</span>
                  </>
                )}
                <span className="text-violet-500 text-xs">·</span>
                <Building2 className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-violet-300 text-xs">{vehicle.agencyName}</span>
                <span className="text-violet-500 text-xs">·</span>
                <Fuel className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-violet-300 text-xs">{ENERGY_LABELS[vehicle.energy] ?? vehicle.energy}</span>
                {vehicle.color && (
                  <>
                    <span className="text-violet-500 text-xs">·</span>
                    <span className="text-violet-300 text-xs">{vehicle.color}</span>
                  </>
                )}
              </div>
            </div>

            {/* Score conformité */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold flex-shrink-0 ${scoreColor}`}>
              <Award className="w-4 h-4" />
              {score} / 100
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setIsStatusModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/10 border border-white/20 text-white text-xs font-medium rounded-xl hover:bg-white/20 transition-colors"
            >
              <Truck className="w-3.5 h-3.5" /> Changer statut
            </button>
            <button
              onClick={() => setIsFormModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-violet-700 text-sm font-semibold rounded-xl hover:bg-violet-50 transition-colors shadow-sm"
            >
              <Edit className="w-4 h-4" /> Modifier
            </button>
          </div>
        </div>
      </div>

      {/* ── Onglets + contenu dans une carte unifiée ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Tab bar */}
        <div className="flex border-b border-gray-100 px-2 pt-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-violet-600 text-violet-700 bg-violet-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Onglet Informations ── */}
        {activeTab === 'info' && (
          <>
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-violet-600" />
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Fiche technique & échéances</span>
            </div>

            <div className="p-5 flex flex-col gap-5">

              {/* ── Ligne 1 : Infos générales + Échéances ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Informations générales */}
                <div className="bg-gray-50/60 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Car className="w-4 h-4 text-violet-500" />
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Informations générales</span>
                  </div>
                  <InfoRow label="Énergie"                value={ENERGY_LABELS[vehicle.energy] ?? vehicle.energy} />
                  <InfoRow label="Kilométrage"             value={`${vehicle.mileage.toLocaleString('fr-FR')} km`} />
                  <InfoRow label="Agence"                  value={vehicle.agencyName} />
                  <InfoRow
                    label="Coût mensuel (leasing)"
                    value={vehicle.monthlyLeaseCost
                      ? `${vehicle.monthlyLeaseCost.toLocaleString('fr-FR')} €`
                      : 'Non applicable'}
                  />
                </div>

                {/* Échéances administratives */}
                <div className="bg-gray-50/60 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-violet-500" />
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Échéances administratives</span>
                  </div>
                  <ExpiryRow label="Agrément ARS"          date={vehicle.arsApprovalExpiry}         />
                  <ExpiryRow label="Assurance"              date={vehicle.insuranceExpiry}           />
                  <ExpiryRow label="Contrôle technique"     date={vehicle.technicalInspectionExpiry} />
                  <ExpiryRow label="Prochaine maintenance"  date={vehicle.nextMaintenanceDate}       />
                </div>
              </div>

              {/* ── Ligne 2 : Données carte grise ── */}
              <div className="bg-gray-50/60 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-violet-500" />
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Données carte grise</span>
                  {!hasCarteGrise && (
                    <span className="ml-auto text-[10px] text-gray-400 italic">Non renseignées — modifiez le véhicule pour les compléter</span>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Couleur</span>
                    <span className="text-sm font-semibold text-gray-800">{vehicle.color ?? '—'}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Code VIN (E)</span>
                    <span className="text-sm font-semibold text-gray-800 font-mono break-all">{vehicle.vin ?? '—'}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Genre national (J.1)</span>
                    <span className="text-sm font-semibold text-gray-800">{vehicle.nationalGenre ?? '—'}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">CO₂ g/km (V.7)</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {vehicle.co2Emission != null ? `${vehicle.co2Emission} g/km` : '—'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Places assises (S.1)</span>
                    <span className="text-sm font-semibold text-gray-800">
                      {vehicle.seatingCapacity != null ? `${vehicle.seatingCapacity} place${vehicle.seatingCapacity > 1 ? 's' : ''}` : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Ligne 3 : Matériels embarqués ── */}
              <div className="bg-gray-50/60 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <Radio className="w-4 h-4 text-violet-500" />
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Matériels embarqués</span>
                  {!hasTelematics && (
                    <span className="ml-auto text-[10px] text-gray-400 italic">Non renseignés — modifiez le véhicule pour les compléter</span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-gray-100">
                    <Cpu className="w-4 h-4 text-violet-400 flex-shrink-0" />
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">N° IMEI PDA</span>
                      <span className={`text-sm font-semibold font-mono ${vehicle.imeiPda ? 'text-gray-800' : 'text-gray-400'}`}>
                        {vehicle.imeiPda ?? '—'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg border border-gray-100">
                    <Radio className="w-4 h-4 text-violet-400 flex-shrink-0" />
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">N° IMEI Boitier Télématique</span>
                      <span className={`text-sm font-semibold font-mono ${vehicle.imeiTelematics ? 'text-gray-800' : 'text-gray-400'}`}>
                        {vehicle.imeiTelematics ?? '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </>
        )}

        {/* ── Onglet Maintenance ── */}
        {activeTab === 'maintenance' && (
          <>
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-violet-600" />
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Cycles de maintenance</span>
            </div>
            <div className="p-5">
              <VehicleMaintenanceTab vehicle={vehicle} />
            </div>
          </>
        )}

        {/* ── Onglet Finance ── */}
        {activeTab === 'finance' && (
          <>
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-violet-600" />
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Contrat & Financement</span>
            </div>
            <div className="p-5">
              <VehicleFinanceTab vehicle={vehicle} />
            </div>
          </>
        )}
      </div>

      {/* ── Modales ── */}
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
    </>
  )
}
