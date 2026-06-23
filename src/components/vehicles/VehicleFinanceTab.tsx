import { useEffect, useState, useMemo } from 'react'
import {
  Euro, Clock, Gauge, AlertTriangle, FileText,
  CheckCircle2, XCircle, Calendar, Building2, Plus, Pencil, TrendingUp,
} from 'lucide-react'
import { useVehicleContractStore }  from '@/store/vehicleContractStore'
import type { ContractFormData }    from '@/store/vehicleContractStore'
import { useAmortizationStore }     from '@/store/amortizationStore'
import VehicleContractForm          from './VehicleContractForm'
import AmortizationGantt            from '@/components/amortization/AmortizationGantt'
import CreditBailAmortizationModal  from '@/components/amortization/CreditBailAmortizationModal'
import type { Vehicle, VehicleContract, VehicleContractType } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────
function formatEur(n: number): string {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
}
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
}

// ─── Config types ─────────────────────────────────────────────────
const TYPE_CONFIG: Record<VehicleContractType, { label: string; badge: string }> = {
  CREDIT_BAIL:     { label: 'Crédit-bail',     badge: 'bg-violet-100 text-violet-700 border-violet-200' },
  LOA:             { label: 'LOA',             badge: 'bg-blue-100 text-blue-700 border-blue-200'       },
  LLD:             { label: 'LLD',             badge: 'bg-green-100 text-green-700 border-green-200'    },
  CREDIT_BANCAIRE: { label: 'Crédit bancaire', badge: 'bg-orange-100 text-orange-700 border-orange-200' },
  EN_PROPRIETE:    { label: 'En propriété',    badge: 'bg-gray-100 text-gray-600 border-gray-200'       },
}

// ─── DataRow ──────────────────────────────────────────────────────
function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-xs font-semibold text-gray-800">{value}</span>
    </div>
  )
}

// ─── ServiceBadge ─────────────────────────────────────────────────
function ServiceBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold ${
      active
        ? 'bg-green-50 text-green-700 border-green-200'
        : 'bg-gray-50 text-gray-400 border-gray-200'
    }`}>
      {active
        ? <CheckCircle2 className="w-3 h-3" />
        : <XCircle className="w-3 h-3" />
      }
      {label}
    </div>
  )
}

// ─── KmProgressBar ────────────────────────────────────────────────
function KmProgressBar({ contract, currentMileage }: { contract: VehicleContract; currentMileage: number }) {
  const { computeKmStatus } = useVehicleContractStore()

  if (!contract.contractedKmTotal || contract.startMileage == null) {
    return <p className="text-xs text-gray-400 italic">Non applicable — pas de forfait km</p>
  }

  const status   = computeKmStatus(contract, currentMileage)
  const pct      = status.progressPct
  const barColor = pct >= 100 ? 'bg-red-500' : pct >= 85 ? 'bg-orange-500' : 'bg-violet-500'

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[11px] font-semibold text-gray-500">
        <span>{status.contractKmDone.toLocaleString('fr-FR')} km parcourus sur contrat</span>
        <span className={pct >= 100 ? 'text-red-600' : pct >= 85 ? 'text-orange-600' : 'text-gray-700'}>{pct}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <div className="flex justify-between text-[10px]">
        <span className="text-gray-400">
          Forfait : {contract.contractedKmTotal.toLocaleString('fr-FR')} km
          {contract.contractedKmPerYear && ` (${contract.contractedKmPerYear.toLocaleString('fr-FR')} km/an)`}
        </span>
        {status.contractKmLeft != null && status.contractKmLeft >= 0 && (
          <span className="text-gray-500 font-semibold">{status.contractKmLeft.toLocaleString('fr-FR')} km restants</span>
        )}
        {status.contractKmOverrun != null && (
          <span className="text-red-600 font-bold">+{status.contractKmOverrun.toLocaleString('fr-FR')} km dépassement</span>
        )}
      </div>
      {status.projectedOverrun != null && status.projectedOverrun > 0 && (
        <div className="flex items-start gap-2 px-3 py-2.5 bg-orange-50 border border-orange-200 rounded-lg mt-1">
          <Gauge className="w-3.5 h-3.5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-bold text-orange-700">
              Dépassement projeté : +{status.projectedOverrun.toLocaleString('fr-FR')} km
            </p>
            {status.excessCostEstimate != null && (
              <p className="text-[10px] text-orange-600 mt-0.5">
                Surcoût estimé : {formatEur(status.excessCostEstimate)}
                {contract.excessKmCostPerKm && ` (${contract.excessKmCostPerKm.toFixed(2)} €/km)`}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── ContractCard ─────────────────────────────────────────────────
function ContractCard({
  contract, currentMileage, isActive, onEdit,
}: {
  contract: VehicleContract; currentMileage: number; isActive: boolean; onEdit: (c: VehicleContract) => void
}) {
  const isOwned = contract.type === 'EN_PROPRIETE'
  const hasEnd  = Boolean(contract.endDate)
  const days    = hasEnd ? daysUntil(contract.endDate) : null
  const expired = days != null && days < 0
  const cfg     = TYPE_CONFIG[contract.type]
  const needsKm = contract.type === 'LOA' || contract.type === 'LLD'

  const urgencyClass =
    days == null          ? '' :
    expired || days <= 30 ? 'bg-red-50 border-red-200 text-red-700'       :
    days <= 90            ? 'bg-orange-50 border-orange-200 text-orange-700' :
                            'bg-green-50 border-green-200 text-green-700'

  return (
    <div className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-opacity ${
      isActive ? 'border-violet-200' : 'border-gray-200 opacity-75'
    }`}>

      {/* ── En-tête card ── */}
      <div className={`px-5 py-3 flex items-center justify-between border-b ${
        isActive ? 'bg-violet-50/60 border-violet-100' : 'bg-gray-50/60 border-gray-100'
      }`}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${cfg.badge}`}>
            {cfg.label}
          </span>
          {isActive ? (
            <span className="text-[10px] font-bold text-violet-700 bg-violet-100 border border-violet-200 px-2 py-0.5 rounded-full">
              Contrat actif
            </span>
          ) : (
            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
              {contract.status === 'TERMINATED' ? 'Résilié' : 'Expiré'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isOwned && (
            <span className="text-[10px] font-mono text-gray-400">{contract.contractRef}</span>
          )}
          <button
            onClick={() => onEdit(contract)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-bold text-violet-600 bg-white hover:bg-violet-50 rounded-lg transition-colors border border-violet-200"
          >
            <Pencil className="w-3 h-3" />
            Modifier
          </button>
        </div>
      </div>

      {/* ── Corps ── */}
      <div className="p-5 space-y-4">

        {/* Alerte échéance */}
        {isActive && hasEnd && (expired || (days != null && days <= 90)) && (
          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border ${urgencyClass}`}>
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <p className="text-xs font-bold">
              {expired
                ? `Contrat expiré depuis ${Math.abs(days!)} jours`
                : `Échéance dans ${days} jours — renouvellement à anticiper`}
            </p>
          </div>
        )}

        {/* EN_PROPRIETE : affichage simplifié */}
        {isOwned ? (
          <div className="grid grid-cols-2 gap-x-8">
            <DataRow label="Date d'acquisition" value={
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-gray-400" />{formatDate(contract.startDate)}
              </span>
            } />
            <DataRow label="Date de cession" value={
              contract.endDate
                ? <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-gray-400" />{formatDate(contract.endDate)}</span>
                : <span className="italic text-gray-400">Non renseignée</span>
            } />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-8">
            {/* Gauche */}
            <div>
              <DataRow label="Bailleur" value={
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-gray-400" />{contract.lessorName}
                </span>
              } />
              <DataRow label="Durée" value={`${contract.durationMonths} mois`} />
              <DataRow label="Début" value={
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-gray-400" />{formatDate(contract.startDate)}
                </span>
              } />
              <DataRow label="Fin" value={
                <span className={`flex items-center gap-1.5 ${expired ? 'text-red-600' : days != null && days <= 90 ? 'text-orange-600' : ''}`}>
                  <Clock className="w-3 h-3" />
                  {contract.endDate ? formatDate(contract.endDate) : '—'}
                  {isActive && hasEnd && !expired && days != null && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${urgencyClass}`}>J-{days}</span>
                  )}
                </span>
              } />
            </div>
            {/* Droite */}
            <div>
              <DataRow
                label={contract.type === 'CREDIT_BANCAIRE' ? 'Mensualité HT' : 'Loyer mensuel HT'}
                value={
                  <span className="flex items-center gap-1 text-violet-700">
                    <Euro className="w-3 h-3" />{formatEur(contract.monthlyRentHT)}
                  </span>
                }
              />
              {contract.monthlyInsuranceCost != null && (
                <DataRow label="Assurance mensuelle" value={formatEur(contract.monthlyInsuranceCost)} />
              )}
              <DataRow label="Total mensuel" value={
                <span className="text-gray-900 font-bold">
                  {formatEur(contract.monthlyRentHT + (contract.monthlyInsuranceCost ?? 0))}
                </span>
              } />
              {contract.deposit > 0 && (
                <DataRow
                  label={contract.type === 'CREDIT_BANCAIRE' ? 'Apport initial' : 'Dépôt de garantie'}
                  value={formatEur(contract.deposit)}
                />
              )}
              {contract.residualValue != null && (
                <DataRow
                  label={contract.type === 'CREDIT_BANCAIRE' ? 'Montant emprunté' : 'Valeur résiduelle'}
                  value={formatEur(contract.residualValue)}
                />
              )}
              {contract.excessKmCostPerKm != null && (
                <DataRow label="Coût km excédentaire" value={`${contract.excessKmCostPerKm.toFixed(2)} €/km`} />
              )}
            </div>
          </div>
        )}

        {/* Services inclus */}
        {!isOwned && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-3 rounded-full bg-violet-600" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Services inclus</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <ServiceBadge active={contract.includedServices.maintenance} label="Entretien"    />
              <ServiceBadge active={contract.includedServices.tires}       label="Pneumatiques" />
              <ServiceBadge active={contract.includedServices.insurance}   label="Assurance"    />
              <ServiceBadge active={contract.includedServices.assistance}  label="Assistance"   />
            </div>
          </div>
        )}

        {/* Suivi km */}
        {needsKm && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-3 rounded-full bg-violet-600" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Suivi kilométrique contractuel</span>
            </div>
            <KmProgressBar contract={contract} currentMileage={currentMileage} />
          </div>
        )}

        {/* Notes */}
        {contract.notes && (
          <div className="flex items-start gap-2 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-lg">
            <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500 italic leading-relaxed">{contract.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────
export default function VehicleFinanceTab({ vehicle }: { vehicle: Vehicle }) {
  const { fetchContracts, getByVehicle, getActive, addContract, updateContract } = useVehicleContractStore()
  const { amortizations, fetchAmortizations } = useAmortizationStore()

  const [formOpen,        setFormOpen]        = useState(false)
  const [editingContract, setEditingContract] = useState<VehicleContract | undefined>(undefined)
  const [creditBailModal, setCreditBailModal] = useState<{
    contractId: string; residualValue: number; endDate: string
  } | null>(null)

  useEffect(() => { fetchContracts() },     [])
  useEffect(() => { fetchAmortizations() }, [])

  const contracts      = getByVehicle(vehicle.id)
  const activeContract = getActive(vehicle.id)
  const pastContracts  = contracts.filter((c) => !c.isActive || c.status !== 'ACTIVE')
  const isOwnedActive  = activeContract?.type === 'EN_PROPRIETE'

  const vehicleAmortizations = useMemo(
    () => amortizations.filter((a) => a.vehicleId === vehicle.id),
    [amortizations, vehicle.id]
  )

  useEffect(() => {
    if (!activeContract || activeContract.type !== 'CREDIT_BAIL') return
    if (!activeContract.residualValue || activeContract.residualValue <= 0) return
    if (!activeContract.endDate) return
    if (new Date(activeContract.endDate) >= new Date()) return
    if (amortizations.some((a) => a.source === 'CREDIT_BAIL' && a.sourceId === activeContract.id)) return
    setCreditBailModal({
      contractId: activeContract.id, residualValue: activeContract.residualValue, endDate: activeContract.endDate,
    })
  }, [activeContract, amortizations])

  function handleOpenCreate() { setEditingContract(undefined); setFormOpen(true) }
  function handleOpenEdit(c: VehicleContract) { setEditingContract(c); setFormOpen(true) }
  function handleClose() { setFormOpen(false); setEditingContract(undefined) }

  async function handleSave(data: ContractFormData) {
    if (editingContract) await updateContract(editingContract.id, data)
    else await addContract(data)
    handleClose()
  }

  return (
    <div className="space-y-4">

      {/* ── Bouton créer ── */}
      <div className="flex justify-end">
        <button
          onClick={handleOpenCreate}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-colors ${
            activeContract
              ? 'text-violet-600 bg-white border border-violet-200 hover:bg-violet-50'
              : 'text-white bg-violet-600 hover:bg-violet-700 shadow-sm'
          }`}
        >
          <Plus className="w-4 h-4" />
          {activeContract ? 'Nouveau contrat' : 'Créer un contrat'}
        </button>
      </div>

      {/* ── KPIs contrat actif ── */}
      {activeContract && !isOwnedActive && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Loyer HT / mois',    value: formatEur(activeContract.monthlyRentHT),                                                                              icon: Euro,        color: 'bg-violet-500' },
            { label: 'Assurance / mois',   value: activeContract.monthlyInsuranceCost != null ? formatEur(activeContract.monthlyInsuranceCost) : '—',                   icon: FileText,    color: 'bg-blue-500'   },
            { label: 'Total / mois',       value: formatEur(activeContract.monthlyRentHT + (activeContract.monthlyInsuranceCost ?? 0)),                                 icon: TrendingUp,  color: 'bg-gray-500'   },
            { label: 'Engagement annuel',  value: formatEur((activeContract.monthlyRentHT + (activeContract.monthlyInsuranceCost ?? 0)) * 12),                          icon: Calendar,    color: 'bg-amber-500'  },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-1.5">
                <div className={`w-1 h-3 rounded-full ${color}`} />
                <Icon className={`w-3 h-3 ${color.replace('bg-', 'text-')}`} />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>
              </div>
              <div className="px-4 py-3">
                <p className="text-lg font-bold text-gray-900">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Contrat actif ── */}
      {activeContract && (
        <ContractCard
          contract={activeContract}
          currentMileage={vehicle.mileage}
          isActive={true}
          onEdit={handleOpenEdit}
        />
      )}

      {/* ── Gantt amortissements ── */}
      {vehicleAmortizations.length > 0 && (
        <AmortizationGantt
          amortizations={vehicleAmortizations}
          title="Amortissements de ce véhicule"
          showVehicle={false}
        />
      )}

      {/* ── Historique contrats ── */}
      {pastContracts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full bg-gray-400" />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Historique des contrats</span>
          </div>
          {pastContracts.map((c) => (
            <ContractCard
              key={c.id}
              contract={c}
              currentMileage={vehicle.mileage}
              isActive={false}
              onEdit={handleOpenEdit}
            />
          ))}
        </div>
      )}

      {/* ── État vide ── */}
      {contracts.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <Euro className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-500">Aucun contrat de financement</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">Ce véhicule ne possède pas encore de contrat enregistré.</p>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Créer le premier contrat
          </button>
        </div>
      )}

      {/* ── Modale formulaire ── */}
      {formOpen && (
        <VehicleContractForm
          vehicleId={vehicle.id}
          contract={editingContract}
          onClose={handleClose}
          onSave={handleSave}
        />
      )}

      {/* ── Modale crédit-bail auto ── */}
      {creditBailModal && (
        <CreditBailAmortizationModal
          vehicleId={vehicle.id}
          contractId={creditBailModal.contractId}
          residualValue={creditBailModal.residualValue}
          contractEndDate={creditBailModal.endDate}
          vehicleLabel={`${vehicle.registration} — ${vehicle.brand} ${vehicle.model}`}
          onClose={() => setCreditBailModal(null)}
        />
      )}
    </div>
  )
}
