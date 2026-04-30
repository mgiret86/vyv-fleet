import { useAppStore } from '@/store/useAppStore'
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { Driver, DriverRole, DriverStatus, ContractType } from '@/types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ROLES: { value: DriverRole; label: string }[] = [
  { value: 'AMBULANCIER_DE', label: 'Ambulancier DE' },
  { value: 'AUXILIAIRE_AMBULANCIER', label: 'Auxiliaire Ambulancier' },
  { value: 'CHAUFFEUR_VSL', label: 'Chauffeur VSL' },
  { value: 'OTHER', label: 'Autre' },
]

const STATUSES: { value: DriverStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'INACTIVE', label: 'Inactif' },
  { value: 'SUSPENDED', label: 'Suspendu' },
  { value: 'LEAVE', label: 'Congé' },
]

const CONTRACTS: { value: ContractType; label: string }[] = [
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'INTERIM', label: 'Intérim' },
]

// AGENCIES chargées dynamiquement via useAppStore

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

interface DriverFormProps {
  isOpen: boolean
  onClose: () => void
  driver?: Driver
  onSave: (d: Driver) => void
}

interface FormErrors {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  agencyId?: string
  role?: string
  licenseNumber?: string
  licenseExpiry?: string
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/** Converts an ISO date-time string to the YYYY-MM-DD format required by <input type="date" /> */
function toDateInputValue(dateStr?: string | null): string {
  return dateStr?.slice(0, 10) ?? ''
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DriverForm({ isOpen, onClose, driver, onSave }: DriverFormProps) {
  // ── Personal information ──────────────────────────────────────────────────
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')

  // ── Assignment & contract ─────────────────────────────────────────────────
  const agencies = useAppStore((s) => s.agencies)
  const [agencyId, setAgencyId] = useState('')
  const [role, setRole] = useState<DriverRole>('AMBULANCIER_DE')
  const [status, setStatus] = useState<DriverStatus>('ACTIVE')
  const [contractType, setContractType] = useState<ContractType>('CDI')

  // ── Driving licence ───────────────────────────────────────────────────────
  const [licenseNumber, setLicenseNumber] = useState('')
  const [licenseExpiry, setLicenseExpiry] = useState('')

  // ── Health qualifications ─────────────────────────────────────────────────
  const [deaExpiry, setDeaExpiry] = useState('') // Corrected state declaration
  const [fspExpiry, setFspExpiry] = useState('')
  const [medicalCertificateExpiry, setMedicalCertificateExpiry] = useState('')
  const [medicalExamDate, setMedicalExamDate] = useState('')
  const [medicalExamExpiry, setMedicalExamExpiry] = useState('')

  // ── Continuous training ───────────────────────────────────────────────────
  const [nextTrainingDate, setNextTrainingDate] = useState('')

  // ── Validation errors ─────────────────────────────────────────────────────
  const [errors, setErrors] = useState<FormErrors>({})

  // ── Populate / reset fields whenever the modal opens or the driver changes ─
  useEffect(() => {
    if (!isOpen) return

    if (driver) {
      // Edit mode — pre-fill every field from the existing driver record
      setFirstName(driver.firstName)
      setLastName(driver.lastName)
      setEmail(driver.email)
      setPhone(driver.phone)
      setAddress(driver.address ?? '')
      setAgencyId(driver.agencyId)
      setRole(driver.role)
      setStatus(driver.status)
      setContractType(driver.contractType)
      setLicenseNumber(driver.licenseNumber)
      setLicenseExpiry(toDateInputValue(driver.licenseExpiry))
      setDeaExpiry(toDateInputValue(driver.deaExpiry))
      setFspExpiry(toDateInputValue(driver.fspExpiry))
      setMedicalCertificateExpiry(toDateInputValue(driver.medicalCertificateExpiry))
      setMedicalExamDate(toDateInputValue(driver.medicalExamDate))
      setMedicalExamExpiry(toDateInputValue(driver.medicalExamExpiry))
      setNextTrainingDate(toDateInputValue(driver.nextTrainingDate))
    } else {
      // Create mode — reset everything to sensible defaults
      setFirstName('')
      setLastName('')
      setPhone('') // Corrected line
      setEmail('')
      setAddress('')
      setAgencyId('')
      setRole('AMBULANCIER_DE')
      setStatus('ACTIVE')
      setContractType('CDI')
      setLicenseNumber('')
      setLicenseExpiry('')
      setDeaExpiry('') // Reset for create mode
      setFspExpiry('')
      setMedicalCertificateExpiry('')
      setMedicalExamDate('')
      setMedicalExamExpiry('')
      setNextTrainingDate('')
    }

    // Always clear validation errors when the modal opens
    setErrors({})
  }, [isOpen, driver])

  // ── Validation ────────────────────────────────────────────────────────────

  function validate(): boolean {
    const next: FormErrors = {}

    if (!firstName.trim()) next.firstName = 'Le prénom est requis.'
    if (!lastName.trim()) next.lastName = 'Le nom est requis.'

    if (!email.trim()) {
      next.email = "L'adresse e-mail est requise."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "L'adresse e-mail n'est pas valide."
    }

    if (!phone.trim()) next.phone = 'Le numéro de téléphone est requis.'
    if (!agencyId) next.agencyId = "L'agence est requise."
    if (!role) next.role = 'Le rôle est requis.'
    if (!licenseNumber.trim()) next.licenseNumber = 'Le numéro de permis est requis.'
    if (!licenseExpiry) next.licenseExpiry = "La date d'expiration du permis est requise."

    setErrors(next)
    return Object.keys(next).length === 0
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    // Resolve the human-readable agency the selected id
    const selectedAgency = agencies.find((a) => a.id === agencyId)

    const record: Driver = {
      id: driver?.id ?? crypto.randomUUID(),

      // Personal information
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),

      // Assignment & contract
      agencyId,
      agencyName: selectedAgency?.name ?? '',
      role,
      status,
      contractType,

      // Driving licence
      licenseNumber: licenseNumber.trim(),
      licenseExpiry,

      // Health qualifications — DEA only relevant for AMBULANCIER_DE
      deaExpiry: role === 'AMBULANCIER_DE' && deaExpiry !== '' ? deaExpiry : null,
      fspExpiry: fspExpiry || null,
      medicalCertificateExpiry: medicalCertificateExpiry || null,
      medicalExamDate: medicalExamDate || '', // Ensure null if empty
      medicalExamExpiry: medicalExamExpiry || '', // Ensure null if empty

      // Continuous training
      nextTrainingDate: nextTrainingDate || null,

      // Statistics — preserved from existing record or initialised to zero
      totalMileage: driver?.totalMileage ?? 0,
      incidentsCount: driver?.incidentsCount ?? 0,
      incidents: driver?.incidents ?? [],
      habilitations: driver?.habilitations ?? [],
    }

    onSave(record)
  }

  // ── Guard — do not mount when closed ─────────────────────────────────────
  if (!isOpen) return null

  // ── Shared class helpers ──────────────────────────────────────────────────

  const inputBase =
    'w-full rounded-lg border border-gray-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500'
  const inputError = 'border-red-400 bg-red-50'

  function inputCls(hasError?: string) {
    return `${inputBase} ${hasError ? inputError : ''}`.trim()
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    /* Overlay */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      {/* Panel */}
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">

        {/* ── Sticky header ── */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 rounded-t-2xl">
          <h2 className="text-base font-semibold text-gray-800">
            {driver ? 'Modifier le conducteur' : 'Nouveau conducteur'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-6 space-y-6">

            {/* ════════════════════════════════════════════════════════════
                SECTION 1 — Personal════════════════════════════════════════════════════════════ */}
            <section>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Informations personnelles
              </h3>

              {/* firstName + lastName */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={inputCls(errors.firstName)}
                    placeholder="Jean"
                  />
                  {errors.firstName && (
                    <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={inputCls(errors.lastName)}
                    placeholder="Dupont"
                  />
                  {errors.lastName && (
                    <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>

              {/* email + phone */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    E-mail <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputCls(errors.email)}
                    placeholder="jean.dupont@vyv.fr"
                  />
                  {errors.email && ( // Corrected JSX for error display
                    <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Téléphone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputCls(errors.phone)}
                    placeholder="06 12 34 56 78"
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>

              {/* address */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Adresse
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={inputCls()}
                  placeholder="12 rue de la Paix, 75001 Paris"
                />
              </div>
            </section>

            {/* ════════════════════════════════════════════════════════════
                SECTION 2 — Assignment & contract
            ════════════════════════════════════════════════════════════ */}
            <section className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Affectation &amp; contrat
              </h3>

              {/* agencyId + role + status */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Agence <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={agencyId}
                    onChange={(e) => setAgencyId(e.target.value)}
                    className={inputCls(errors.agencyId)}
                  >
                    <option value="">Sélectionner…</option>
                    {agencies.map((a) => (
                      <option key={a.id} value={a.id}> {/* Corrected value attribute */}
                        {a.name}
                      </option>
                    ))}
                  </select>
                  {errors.agencyId && (
                    <p className="text-xs text-red-500 mt-1">{errors.agencyId}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Rôle <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as DriverRole)}
                    className={inputCls(errors.role)}
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  {errors.role && (
                    <p className="text-xs text-red-500 mt-1">{errors.role}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Statut
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as DriverStatus)}
                    className={inputCls()}
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* contractType + placeholder for alignment */}
              <div className="grid grid-cols-2 gap-4"> {/* Corrected closing div */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Type de contrat
                  </label>
                  <select
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value as ContractType)}
                    className={inputCls()}
                  >
                    {CONTRACTS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Empty column to maintain alignment */}
                <div></div> {/* Corrected empty div */}
              </div>
            </section>

            {/* ════════════════════════════════════════════════════════════
                SECTION 3 — Driving licence
            ════════════════════════════════════════════════════════════ */}
            <section className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Permis de conduire
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Numéro de permis <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className={inputCls(errors.licenseNumber)}
                    placeholder="75AB12345"
                  />
                  {errors.licenseNumber && (
                    <p className="text-xs text-red-500 mt-1">{errors.licenseNumber}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Date d'expiration <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={licenseExpiry}
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                    className={inputCls(errors.licenseExpiry)}
                  />
                  {errors.licenseExpiry && (
                    <p className="text-xs text-red-500 mt-1">{errors.licenseExpiry}</p>
                  )}
                </div>
              </div>
            </section>

            {/* ════════════════════════════════════════════════════════════
                SECTION 4 — Health qualifications
            ════════════════════════════════════════════════════════════ */}
            <section className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Habilitations sanitaires
              </h3>

              {/* DEA — only relevant for AMBULANCIER_DE */}
              {role === 'AMBULANCIER_DE' && (
                <div className="mb-4"> {/* Corrected className */}
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Expiration DEA
                  </label>
                  <input
                    type="date"
                    value={deaExpiry}
                    onChange={(e) => setDeaExpiry(e.target.value)}
                    className={inputCls()}
                  />
                </div>
              )}

              {/* FSP + medical certificate */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Expiration FSP
                  </label>
                  <input
                    type="date"
                    value={fspExpiry}
                    onChange={(e) => setFspExpiry(e.target.value)}
                    className={inputCls()}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Certificat médical d'aptitude
                  </label>
                  <input
                    type="date"
                    value={medicalCertificateExpiry}
                    onChange={(e) => setMedicalCertificateExpiry(e.target.value)}
                    className={inputCls()}
                  />
                </div>
              </div>

              {/* Medical exam date + expiry */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Date visite médicale
                  </label>
                  <input
                    type="date"
                    value={medicalExamDate}
                    onChange={(e) => setMedicalExamDate(e.target.value)}
                    className={inputCls()}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Expiration visite médicale
                  </label>
                  <input
                    type="date"
                    value={medicalExamExpiry}
                    onChange={(e) => setMedicalExamExpiry(e.target.value)}
                    className={inputCls()}
                  />
                </div>
              </div>
            </section>

            {/* ════════════════════════════════
                SECTION 5 — Continuous training
            ════════════════════════════════════════════════════════════ */}
            <section className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Formation continue
              </h3>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Prochaine formation
                </label>
                <input
                  type="date"
                  value={nextTrainingDate}
                  onChange={(e) => setNextTrainingDate(e.target.value)}
                  className={inputCls()}
                />
              </div>
            </section>
          </div>

          {/* ── Footer actions ── */}
          <div className="sticky bottom-0 flex justify-end gap-3 px-6 py-4 bg-white border-t border-gray-200 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
            >
              {driver ? 'Mettre à jour' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
