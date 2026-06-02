import { useState } from 'react'
import { X, Eye, EyeOff } from 'lucide-react'
import { MOCK_ROLES } from '@/data/mockSettings'
import { useAppStore } from '@/store/useAppStore'
import { useToastStore } from '@/store/toastStore'
import type { SettingsUser } from '@/types/settings'

interface Props {
  user?:    SettingsUser
  onClose:  () => void
  onSave:   () => void
}

export default function UserModal({ user, onClose, onSave }: Props) {
  const { addToast } = useToastStore()
  const isEdit = !!user

  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName,  setLastName]  = useState(user?.lastName  ?? '')
  const [email,     setEmail]     = useState(user?.email     ?? '')
  const [password,  setPassword]  = useState('')
  const [roleId,    setRoleId]    = useState(user?.roleId    ?? 'standard')
  const [agencyIds, setAgencyIds] = useState<string[]>(user?.agencyIds ?? [])
  const [isActive,  setIsActive]  = useState(user?.isActive  ?? true)
  const [showPwd,   setShowPwd]   = useState(false)
  const [errors,    setErrors]    = useState<Record<string, string>>({})

  const isGlobalRole = roleId === 'super-admin' || roleId === 'admin'

  const handleRoleChange = (id: string) => {
    setRoleId(id)
    if (id === 'super-admin' || id === 'admin') setAgencyIds([])
  }

  const toggleAgency = (id: string) =>
    setAgencyIds((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id])

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!firstName.trim()) e.firstName = 'Prenom obligatoire'
    if (!lastName.trim())  e.lastName  = 'Nom obligatoire'
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Email invalide'
    if (!isEdit && !password.trim()) e.password = 'Mot de passe obligatoire'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    addToast({ type: 'success', message: isEdit ? 'Utilisateur modifie.' : 'Utilisateur cree.' })
    onSave()
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">
            {isEdit ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Prenom <span className="text-red-500">*</span></label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} />
              {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nom <span className="text-red-500">*</span></label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} />
              {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>
          {!isEdit && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Mot de passe <span className="text-red-500">*</span></label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)} className={`${inputCls} pr-10`} />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Role <span className="text-red-500">*</span></label>
            <select value={roleId} onChange={(e) => handleRoleChange(e.target.value)} className={inputCls}>
              {MOCK_ROLES.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          {isGlobalRole ? (
            <p className="text-xs text-violet-600 bg-violet-50 px-3 py-2 rounded-lg">
              Ce role a acces a toutes les agences automatiquement.
            </p>
          ) : (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Agences autorisees</label>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                {useAppStore.getState().agencies.map((a) => (
                  <label key={a.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={agencyIds.includes(a.id)} onChange={() => toggleAgency(a.id)}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                    <span className="text-xs text-gray-700 flex-1">{a.name}</span>
                    <span className="text-xs text-gray-400 font-mono">{a.code}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setIsActive(!isActive)}
              className={`relative w-10 h-5 rounded-full transition-colors ${isActive ? 'bg-violet-600' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <span className="text-sm text-gray-700">Compte actif</span>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Annuler</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors">
              {isEdit ? 'Enregistrer' : 'Creer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}