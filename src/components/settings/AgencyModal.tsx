import { useState } from 'react'
import { X } from 'lucide-react'
import { MOCK_SETTINGS_USERS } from '@/data/mockSettings'
import { useToastStore } from '@/store/toastStore'
import type { SettingsAgency } from '@/types/settings'

interface Props {
  agency: SettingsAgency
  onClose: () => void
  onSave: () => void
}

export default function AgencyModal({ agency, onClose, onSave }: Props) {
  const { addToast } = useToastStore()

  const [name,      setName]      = useState(agency.name)
  const [code,      setCode]      = useState(agency.code)
  const [address,   setAddress]   = useState(agency.address)
  const [zipCode,   setZipCode]   = useState(agency.zipCode)
  const [city,      setCity]      = useState(agency.city)
  const [phone,     setPhone]     = useState(agency.phone)
  const [email,     setEmail]     = useState(agency.email)
  const [managerId, setManagerId] = useState(agency.managerId ?? '')
  const [isActive,  setIsActive]  = useState(agency.isActive)
  const [errors,    setErrors]    = useState<Record<string, string>>({})

  const managers = MOCK_SETTINGS_USERS.filter((u) => u.isActive)

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!name.trim())    e.name    = 'Nom obligatoire'
    if (!code.trim())    e.code    = 'Code obligatoire'
    if (!address.trim()) e.address = 'Adresse obligatoire'
    if (!city.trim())    e.city    = 'Ville obligatoire'
    if (!zipCode.trim()) e.zipCode = 'Code postal obligatoire'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    addToast({ type: 'success', message: 'Agence mise a jour.' })
    onSave()
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Modifier l'agence</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Nom <span className="text-red-500">*</span>
              </label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Code <span className="text-red-500">*</span>
              </label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className={`${inputCls} font-mono`}
              />
              {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Adresse <span className="text-red-500">*</span>
            </label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} />
            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Code postal <span className="text-red-500">*</span>
              </label>
              <input value={zipCode} onChange={(e) => setZipCode(e.target.value)} className={inputCls} />
              {errors.zipCode && <p className="text-xs text-red-500 mt-1">{errors.zipCode}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Ville <span className="text-red-500">*</span>
              </label>
              <input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} />
              {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Telephone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email de contact</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Responsable</label>
            <select
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              className={inputCls}
            >
              <option value="">Aucun responsable</option>
              {managers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative w-10 h-5 rounded-full transition-colors ${isActive ? 'bg-violet-600' : 'bg-gray-300'}`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  isActive ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
            <span className="text-sm text-gray-700">Agence active</span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
