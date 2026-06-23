import { useState } from 'react'
import {
  X, Search, Loader2, CheckCircle2, XCircle,
  ChevronRight, AlertTriangle, Car, Fuel,
  Calendar, Hash, Zap, ArrowLeft, ScanLine,
} from 'lucide-react'
import {
  lookupRegistration,
  normalizePlate,
  isValidFrenchPlate,
  type VehicleRegistrationData,
} from '@/lib/registrationService'
import { useSettingsStore }        from '@/store/settingsStore'
import { useVehicleCategoryStore } from '@/store/vehicleCategoryStore'
import type { Vehicle, VehicleEnergy } from '@/types'

// ── Config énergie ─────────────────────────────────────────────────
const ENERGY_CONFIG: Record<string, { label: string; badge: string }> = {
  DIESEL:   { label: 'Diesel',     badge: 'bg-gray-100 text-gray-700 border-gray-200'      },
  GASOLINE: { label: 'Essence',    badge: 'bg-orange-100 text-orange-700 border-orange-200' },
  HYBRID:   { label: 'Hybride',    badge: 'bg-green-100 text-green-700 border-green-200'   },
  ELECTRIC: { label: 'Électrique', badge: 'bg-blue-100 text-blue-700 border-blue-200'      },
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ── InfoRow ────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <Icon className="w-3 h-3 text-gray-400" />
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</span>
      </div>
      {children}
    </div>
  )
}

// ── PlaqueFR ───────────────────────────────────────────────────────
function PlaqueFR({ value, size = 'md' }: { value: string; size?: 'sm' | 'md' }) {
  const sizes = size === 'sm'
    ? { wrap: 'rounded-md border border-gray-200', flag: 'px-1 py-0.5', flagText: 'text-[7px]', plate: 'px-2 py-0.5 text-xs tracking-widest' }
    : { wrap: 'rounded-lg border-2 border-gray-200', flag: 'px-1.5 py-1', flagText: 'text-[8px]', plate: 'px-3 py-1.5 text-sm tracking-widest' }
  return (
    <div className={`flex items-center overflow-hidden flex-shrink-0 ${sizes.wrap}`}>
      <div className={`bg-blue-700 text-white text-center flex-shrink-0 ${sizes.flag}`}>
        <span className={`block leading-none ${sizes.flagText}`}>🇫🇷</span>
        <span className={`block font-bold leading-none ${sizes.flagText}`}>FR</span>
      </div>
      <span className={`font-bold text-gray-900 bg-yellow-50 ${sizes.plate}`}>{value}</span>
    </div>
  )
}

// ── Props & états ──────────────────────────────────────────────────
interface Props {
  isOpen:    boolean
  onClose:   () => void
  onBack:    () => void
  onConfirm: (prefill: Partial<Vehicle>) => void
}
type Step = 'input' | 'loading' | 'result' | 'error'

// ── Composant principal ────────────────────────────────────────────
export default function VehiclePlateScanner({ isOpen, onClose, onBack, onConfirm }: Props) {
  const [plate,    setPlate]    = useState('')
  const [step,     setStep]     = useState<Step>('input')
  const [result,   setResult]   = useState<VehicleRegistrationData | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { integrations } = useSettingsStore()
  const { getActive }    = useVehicleCategoryStore()
  const isMockMode = !integrations.registrationApi.enabled || !integrations.registrationApi.key

  if (!isOpen) return null

  function guessCategoryId(ptac: number | null | undefined): string {
    const categories = getActive()
    const systemCat  = categories.find((c) => c.isSystem)
    const findByLabel = (keywords: string[]): string | undefined =>
      categories.find((c) => !c.isSystem && keywords.some((kw) => c.label.toLowerCase().includes(kw.toLowerCase())))?.id
    if (!ptac) return findByLabel(['service', 'vsl']) ?? systemCat?.id ?? ''
    if (ptac >= 3500) return findByLabel(['ambulance a', 'amb a']) ?? findByLabel(['ambulance']) ?? systemCat?.id ?? ''
    if (ptac >= 2500) return findByLabel(['ambulance b', 'amb b']) ?? findByLabel(['ambulance']) ?? systemCat?.id ?? ''
    return findByLabel(['vsl']) ?? systemCat?.id ?? ''
  }

  function mapToVehicle(data: VehicleRegistrationData): Partial<Vehicle> {
  return {
    // ── Champs de base ──────────────────────────────────────────
    registration:              data.registration,
    brand:                     data.brand,
    model:                     data.model,
    energy:                    data.energy as VehicleEnergy,
    category:                  guessCategoryId(data.ptac),
    technicalInspectionExpiry: data.technicalInspectionExpiry ?? '',
    mileage:                   0,
    complianceScore:           100,
    status:                    'PENDING_APPROVAL',
    arsApprovalExpiry:         null,
    insuranceExpiry:           '',
    nextMaintenanceDate:       null,
    monthlyLeaseCost:          null,
    // ── Données carte grise (nouveaux champs) ───────────────────
    color:                     data.color          ?? null,
    vin:                       data.vin            ?? null,
    nationalGenre:             data.nationalGenre  ?? null,
    co2Emission:               data.co2            ?? null,
    seatingCapacity:           data.seats          ?? null,
    }
  }

  const handlePlateChange = (raw: string) => setPlate(raw.toUpperCase().replace(/[^A-Z0-9\-]/g, ''))
  const normalized = normalizePlate(plate)
  const isValid    = isValidFrenchPlate(normalized)

  const handleSearch = async () => {
    if (!isValid) return
    setStep('loading'); setResult(null); setErrorMsg(null)
    const res = await lookupRegistration(plate)
    if (res.success && res.data) { setResult(res.data); setStep('result') }
    else { setErrorMsg(res.error ?? 'Aucune donnée trouvée pour cette plaque.'); setStep('error') }
  }

  const handleReset   = () => { setPlate(''); setStep('input'); setResult(null); setErrorMsg(null) }
  const handleConfirm = () => { if (result) onConfirm(mapToVehicle(result)) }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden border border-gray-100">

        {/* ── En-tête ── */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <button
            onClick={onBack}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <div className="w-1 h-5 rounded-full bg-violet-600" />
          <ScanLine className="w-4 h-4 text-violet-500" />
          <div className="flex-1">
            <h2 className="text-sm font-bold text-gray-900">Recherche par plaque</h2>
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 mt-0.5">
              {isMockMode ? 'Mode démonstration — données fictives' : 'API immatriculation connectée'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── Corps ── */}
        <div className="p-5 space-y-4">

          {/* ── Saisie / Erreur ── */}
          {(step === 'input' || step === 'error') && (
            <>
              {isMockMode && (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  <p className="text-xs text-amber-700">
                    Aucune clé API configurée — données fictives.
                    <a href="/settings" className="underline ml-1 hover:text-amber-900">Configurer</a>
                  </p>
                </div>
              )}

              {/* Input plaque */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">
                  Plaque d'immatriculation
                </label>
                <div className="flex gap-2">
                  <div className={`relative flex-1 flex items-center rounded-xl overflow-hidden border-2 transition-colors ${
                    plate && !isValid ? 'border-red-300' : isValid ? 'border-violet-400' : 'border-gray-200'
                  }`}>
                    <div className="bg-blue-700 text-white px-2 py-3 text-center flex flex-col items-center justify-center flex-shrink-0 self-stretch">
                      <span className="text-[10px] leading-none">🇫🇷</span>
                      <span className="text-[9px] font-bold mt-0.5 leading-none">FR</span>
                    </div>
                    <input
                      type="text"
                      value={plate}
                      onChange={(e) => handlePlateChange(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && isValid && handleSearch()}
                      placeholder="AA-123-AA"
                      maxLength={9}
                      autoFocus
                      className="flex-1 px-4 py-3 text-xl font-bold tracking-[0.2em] text-gray-900 bg-yellow-50 focus:outline-none placeholder:text-gray-300 placeholder:text-base placeholder:tracking-normal placeholder:font-normal uppercase"
                    />
                    {isValid && (
                      <CheckCircle2 className="w-4 h-4 text-violet-500 mr-3 flex-shrink-0" />
                    )}
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={!isValid}
                    className="flex items-center gap-2 px-5 py-3 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Search className="w-4 h-4" />
                    Rechercher
                  </button>
                </div>
                {plate && !isValid && (
                  <p className="text-[11px] text-red-500 mt-1.5 font-medium">Format invalide — attendu : AA-123-AA</p>
                )}
                {isValid && (
                  <p className="text-[11px] text-violet-600 mt-1.5 font-medium">
                    Plaque détectée : <strong>{normalized}</strong>
                  </p>
                )}
              </div>

              {/* Bloc erreur */}
              {step === 'error' && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-700">Véhicule non trouvé</p>
                    <p className="text-xs text-red-400 mt-0.5">{errorMsg}</p>
                    <button onClick={handleReset} className="text-xs text-red-600 underline mt-2 hover:text-red-800 font-medium">
                      Réessayer avec une autre plaque
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Chargement ── */}
          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-violet-600 animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-gray-900">Interrogation en cours...</p>
                <p className="text-xs text-gray-400 mt-1">
                  Recherche du véhicule <strong className="text-gray-600">{normalized}</strong>
                </p>
              </div>
            </div>
          )}

          {/* ── Résultat ── */}
          {step === 'result' && result && (
            <>
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-100 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                <p className="text-xs text-green-700 font-medium">
                  Véhicule trouvé — vérifiez les informations avant de continuer
                </p>
              </div>

              {/* Card véhicule */}
              <div className="rounded-xl border border-gray-200 overflow-hidden">

                {/* Header véhicule */}
                <div className="px-4 py-3.5 bg-gray-50/50 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Car className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{result.brand} {result.model}</p>
                    {result.version && <p className="text-xs text-gray-400 truncate">{result.version}</p>}
                  </div>
                  <PlaqueFR value={result.registration} size="sm" />
                </div>

                {/* Grille infos */}
                <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-3.5">
                  <InfoRow icon={Fuel} label="Énergie">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border w-fit ${ENERGY_CONFIG[result.energy]?.badge ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {ENERGY_CONFIG[result.energy]?.label ?? result.energy}
                    </span>
                  </InfoRow>

                  <InfoRow icon={Calendar} label="1ère immat.">
                    <span className="text-xs font-semibold text-gray-700">{formatDate(result.firstRegistrationDate)}</span>
                  </InfoRow>

                  <InfoRow icon={Calendar} label="Fin CT">
                    <span className="text-xs font-semibold text-gray-700">{formatDate(result.technicalInspectionExpiry)}</span>
                  </InfoRow>

                  <InfoRow icon={Hash} label="VIN">
                    <span className="text-xs font-mono text-gray-600 truncate">{result.vin ?? '—'}</span>
                  </InfoRow>

                  {result.ptac && (
                    <InfoRow icon={Zap} label="PTAC">
                      <span className="text-xs font-semibold text-gray-700">{result.ptac} kg</span>
                    </InfoRow>
                  )}

                  {result.power && (
                    <InfoRow icon={Zap} label="Puissance">
                      <span className="text-xs font-semibold text-gray-700">{result.power} kW</span>
                    </InfoRow>
                  )}

                  {result.color && (
                    <InfoRow icon={Car} label="Couleur">
                      <span className="text-xs font-semibold text-gray-700">{result.color}</span>
                    </InfoRow>
                  )}

									{result.nationalGenre && (
  									<InfoRow icon={Car} label="Genre national (J.1)">
    									<span className="text-xs font-semibold text-gray-700">{result.nationalGenre}</span>
  									</InfoRow>
									)}

                  {result.seats && (
                    <InfoRow icon={Car} label="Places">
                      <span className="text-xs font-semibold text-gray-700">{result.seats}</span>
                    </InfoRow>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Nouvelle recherche
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-violet-600 rounded-xl hover:bg-violet-700 transition-colors"
                >
                  Compléter la fiche
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
