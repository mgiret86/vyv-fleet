import { useAppStore } from '@/store/useAppStore'
import { useState, useEffect } from 'react'
import { X, User, Building2, CreditCard, ShieldCheck, GraduationCap } from 'lucide-react'
import type { Driver, DriverRole, DriverStatus, ContractType } from '@/types'

// ─── Constants ────────────────────────────────────────────────────
const ROLES: { value: DriverRole; label: string }[] = [
  { value: 'AMBULANCIER_DE',       label: 'Ambulancier DE'        },
  { value: 'AUXILIAIRE_AMBULANCIER', label: 'Auxiliaire Ambulancier' },
  { value: 'CHAUFFEUR_VSL',        label: 'Chauffeur VSL'         },
  { value: 'OTHER',                label: 'Autre'                 },
]
const STATUSES: { value: DriverStatus; label: string }[] = [
  { value: 'ACTIVE',    label: 'Actif'    },
  { value: 'INACTIVE',  label: 'Inactif'  },
  { value: 'SUSPENDED', label: 'Suspendu' },
  { value: 'LEAVE',     label: 'Congé'    },
]
const CONTRACTS: { value: ContractType; label: string }[] = [
  { value: 'CDI',    label: 'CDI'    },
  { value: 'CDD',    label: 'CDD'    },
  { value: 'INTERIM', label: 'Intérim' },
]

// ─── Interfaces ───────────────────────────────────────────────────
interface DriverFormProps {
  isOpen:  boolean
  onClose: () => void
  driver?: Driver
  onSave:  (d: Driver) => void
}
interface FormErrors {
  firstName?: string; lastName?: string; email?: string; phone?: string
  agencyId?: string; role?: string; licenseNumber?: string; licenseExpiry?: string
}

function toDateInputValue(dateStr?: string | null): string {
  return dateStr?.slice(0, 10) ?? ''
}

// ─── Sous-composants ──────────────────────────────────────────────
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">
      {children}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}
function Field({ error, children }: { error?: string; children: React.ReactNode }) {
  return (
    <div>
      {children}
      {error && <p className="text-[10px] text-red-500 mt-0.5 font-medium">{error}</p>}
    </div>
  )
}
function inputCls(error?: string) {
  return `w-full px-3 py-2 text-sm rounded-lg border transition focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder-gray-300 ${
    error
      ? 'border-red-300 bg-red-50/30 text-gray-900'
      : 'border-gray-200 hover:border-gray-300 bg-white text-gray-900'
  }`
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

// ─── Composant principal ──────────────────────────────────────────
export default function DriverForm({ isOpen, onClose, driver, onSave }: DriverFormProps) {
  const agencies = useAppStore((s) => s.agencies)

  // State
  const [firstName,                setFirstName]                = useState('')
  const [lastName,                 setLastName]                 = useState('')
  const [email,                    setEmail]                    = useState('')
  const [phone,                    setPhone]                    = useState('')
  const [address,                  setAddress]                  = useState('')
  const [agencyId,                 setAgencyId]                 = useState('')
  const [role,                     setRole]                     = useState<DriverRole>('AMBULANCIER_DE')
  const [status,                   setStatus]                   = useState<DriverStatus>('ACTIVE')
  const [contractType,             setContractType]             = useState<ContractType>('CDI')
  const [licenseNumber,            setLicenseNumber]            = useState('')
  const [licenseExpiry,            setLicenseExpiry]            = useState('')
  const [deaExpiry,                setDeaExpiry]                = useState('')
  const [fspExpiry,                setFspExpiry]                = useState('')
  const [medicalCertificateExpiry, setMedicalCertificateExpiry] = useState('')
  const [medicalExamDate,          setMedicalExamDate]          = useState('')
  const [medicalExamExpiry,        setMedicalExamExpiry]        = useState('')
  const [nextTrainingDate,         setNextTrainingDate]         = useState('')
  const [errors,                   setErrors]                   = useState<FormErrors>({})

  useEffect(() => {
    if (!isOpen) return
    if (driver) {
      setFirstName(driver.firstName); setLastName(driver.lastName)
      setEmail(driver.email); setPhone(driver.phone); setAddress(driver.address ?? '')
      setAgencyId(driver.agencyId); setRole(driver.role); setStatus(driver.status)
      setContractType(driver.contractType); setLicenseNumber(driver.licenseNumber)
      setLicenseExpiry(toDateInputValue(driver.licenseExpiry))
      setDeaExpiry(toDateInputValue(driver.deaExpiry))
      setFspExpiry(toDateInputValue(driver.fspExpiry))
      setMedicalCertificateExpiry(toDateInputValue(driver.medicalCertificateExpiry))
      setMedicalExamDate(toDateInputValue(driver.medicalExamDate))
      setMedicalExamExpiry(toDateInputValue(driver.medicalExamExpiry))
      setNextTrainingDate(toDateInputValue(driver.nextTrainingDate))
    } else {
      setFirstName(''); setLastName(''); setEmail(''); setPhone(''); setAddress('')
      setAgencyId(''); setRole('AMBULANCIER_DE'); setStatus('ACTIVE'); setContractType('CDI')
      setLicenseNumber(''); setLicenseExpiry(''); setDeaExpiry(''); setFspExpiry('')
      setMedicalCertificateExpiry(''); setMedicalExamDate(''); setMedicalExamExpiry('')
      setNextTrainingDate('')
    }
    setErrors({})
  }, [isOpen, driver])

  function validate(): boolean {
    const next: FormErrors = {}
    if (!firstName.trim())   next.firstName    = 'Requis'
    if (!lastName.trim())    next.lastName     = 'Requis'
    if (!email.trim())       next.email        = 'Requis'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Email invalide'
    if (!phone.trim())       next.phone        = 'Requis'
    if (!agencyId)           next.agencyId     = 'Requis'
    if (!role)               next.role         = 'Requis'
    if (!licenseNumber.trim()) next.licenseNumber = 'Requis'
    if (!licenseExpiry)      next.licenseExpiry = 'Requis'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    const selectedAgency = agencies.find((a) => a.id === agencyId)
    const record: Driver = {
      id: driver?.id ?? crypto.randomUUID(),
      firstName: firstName.trim(), lastName: lastName.trim(),
      email: email.trim(), phone: phone.trim(), address: address.trim(),
      agencyId, agencyName: selectedAgency?.name ?? '',
      role, status, contractType,
      licenseNumber: licenseNumber.trim(), licenseExpiry,
      deaExpiry: role === 'AMBULANCIER_DE' && deaExpiry !== '' ? deaExpiry : null,
      fspExpiry: fspExpiry || null,
      medicalCertificateExpiry: medicalCertificateExpiry || null,
      medicalExamDate: medicalExamDate || '',
      medicalExamExpiry: medicalExamExpiry || '',
      nextTrainingDate: nextTrainingDate || null,
      totalMileage:   driver?.totalMileage   ?? 0,
      incidentsCount: driver?.incidentsCount ?? 0,
      incidents:      driver?.incidents      ?? [],
      habilitations:  driver?.habilitations  ?? [],
    }
    onSave(record)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-5xl flex flex-col overflow-hidden">

        {/* ── En-tête ── */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
          <div className="w-1 h-5 rounded-full bg-violet-600" />
          <User className="w-4 h-4 text-violet-500" />
          <div className="flex-1">
            <h2 className="text-sm font-bold text-gray-900">
              {driver ? 'Modifier le conducteur' : 'Nouveau conducteur'}
            </h2>
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 mt-0.5">
              {driver ? 'Modifiez les informations ci-dessous' : 'Renseignez les informations du conducteur'}
            </p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── Corps — grille 3 colonnes ── */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="p-5 grid grid-cols-3 gap-x-5 gap-y-0">

            {/* ══ Col 1 : Identité ══ */}
            <div className="space-y-3">
              <SectionHeader icon={User} label="Informations personnelles" />
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Field error={errors.firstName}>
                    <Label required>Prénom</Label>
                    <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jean" className={inputCls(errors.firstName)} />
                  </Field>
                  <Field error={errors.lastName}>
                    <Label required>Nom</Label>
                    <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                      placeholder="Dupont" className={inputCls(errors.lastName)} />
                  </Field>
                </div>
                <Field error={errors.email}>
                  <Label required>E-mail</Label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="jean.dupont@vyv.fr" className={inputCls(errors.email)} />
                </Field>
                <Field error={errors.phone}>
                  <Label required>Téléphone</Label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="06 12 34 56 78" className={inputCls(errors.phone)} />
                </Field>
                <Field>
                  <Label>Adresse</Label>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                    placeholder="12 rue de la Paix, 75001 Paris" className={inputCls()} />
                </Field>
              </div>
            </div>

            {/* ══ Col 2 : Affectation + Permis ══ */}
            <div className="space-y-3">
              {/* Affectation & contrat */}
              <div>
                <SectionHeader icon={Building2} label="Affectation & contrat" />
                <div className="space-y-2">
                  <Field error={errors.agencyId}>
                    <Label required>Agence</Label>
                    <select value={agencyId} onChange={(e) => setAgencyId(e.target.value)} className={inputCls(errors.agencyId)}>
                      <option value="">Sélectionner…</option>
                      {agencies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field error={errors.role}>
                      <Label required>Rôle</Label>
                      <select value={role} onChange={(e) => setRole(e.target.value as DriverRole)} className={inputCls(errors.role)}>
                        {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </Field>
                    <Field>
                      <Label>Statut</Label>
                      <select value={status} onChange={(e) => setStatus(e.target.value as DriverStatus)} className={inputCls()}>
                        {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </Field>
                  </div>
                  <Field>
                    <Label>Type de contrat</Label>
                    <select value={contractType} onChange={(e) => setContractType(e.target.value as ContractType)} className={inputCls()}>
                      {CONTRACTS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </Field>
                </div>
              </div>

              {/* Permis de conduire */}
              <div>
                <SectionHeader icon={CreditCard} label="Permis de conduire" />
                <div className="space-y-2">
                  <Field error={errors.licenseNumber}>
                    <Label required>Numéro de permis</Label>
                    <input type="text" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="75AB12345" className={inputCls(errors.licenseNumber)} />
                  </Field>
                  <Field error={errors.licenseExpiry}>
                    <Label required>Date d'expiration</Label>
                    <input type="date" value={licenseExpiry} onChange={(e) => setLicenseExpiry(e.target.value)}
                      className={inputCls(errors.licenseExpiry)} />
                  </Field>
                </div>
              </div>
            </div>

            {/* ══ Col 3 : Habilitations + Formation ══ */}
            <div className="space-y-3">
              {/* Habilitations sanitaires */}
              <div>
                <SectionHeader icon={ShieldCheck} label="Habilitations sanitaires" />
                <div className="space-y-2">
                  {role === 'AMBULANCIER_DE' && (
                    <Field>
                      <Label>Expiration DEA</Label>
                      <input type="date" value={deaExpiry} onChange={(e) => setDeaExpiry(e.target.value)} className={inputCls()} />
                    </Field>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <Field>
                      <Label>Expiration FSP</Label>
                      <input type="date" value={fspExpiry} onChange={(e) => setFspExpiry(e.target.value)} className={inputCls()} />
                    </Field>
                    <Field>
                      <Label>Certificat médical</Label>
                      <input type="date" value={medicalCertificateExpiry} onChange={(e) => setMedicalCertificateExpiry(e.target.value)} className={inputCls()} />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Field>
                      <Label>Visite médicale</Label>
                      <input type="date" value={medicalExamDate} onChange={(e) => setMedicalExamDate(e.target.value)} className={inputCls()} />
                    </Field>
                    <Field>
                      <Label>Exp. visite médicale</Label>
                      <input type="date" value={medicalExamExpiry} onChange={(e) => setMedicalExamExpiry(e.target.value)} className={inputCls()} />
                    </Field>
                  </div>
                </div>
              </div>

              {/* Formation continue */}
              <div>
                <SectionHeader icon={GraduationCap} label="Formation continue" />
                <Field>
                  <Label>Prochaine formation</Label>
                  <input type="date" value={nextTrainingDate} onChange={(e) => setNextTrainingDate(e.target.value)} className={inputCls()} />
                </Field>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
            <p className="text-[10px] text-gray-400">
              <span className="text-red-500">*</span> Champs obligatoires
            </p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button type="submit"
                className="px-4 py-2 text-sm font-bold text-white bg-violet-600 rounded-xl hover:bg-violet-700 transition-colors">
                {driver ? 'Mettre à jour' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
