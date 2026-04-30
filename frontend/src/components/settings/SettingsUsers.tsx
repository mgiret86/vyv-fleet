import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { userService, roleService, agencyService, type ApiUser, type ApiRole } from '@/lib/services'
import type { Agency } from '@/types'

const ROLE_BADGE: Record<string, string> = {
  'SUPER_ADMIN':    'bg-violet-100 text-violet-700',
  'ADMIN':          'bg-blue-100 text-blue-700',
  'AGENCY_MANAGER': 'bg-green-100 text-green-700',
  'STANDARD':       'bg-gray-100 text-gray-700',
}

function UserForm({
  user, roles, agencies, onSave, onClose,
}: {
  user?:     ApiUser
  roles:     ApiRole[]
  agencies:  Agency[]
  onSave:    () => void
  onClose:   () => void
}) {
  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName:  user?.lastName  ?? '',
    email:     user?.email     ?? '',
    password:  '',
    roleId:    user?.roleId    ?? (roles[0]?.id ?? ''),
    agencyIds: user?.agencyIds ?? [] as string[],
    isActive:  user?.isActive  ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  const toggleAgency = (id: string) =>
    setForm((f) => ({
      ...f,
      agencyIds: f.agencyIds.includes(id)
        ? f.agencyIds.filter((a) => a !== id)
        : [...f.agencyIds, id],
    }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (user) {
        const payload: Partial<ApiUser> & { password?: string } = {
          firstName: form.firstName,
          lastName:  form.lastName,
          email:     form.email,
          roleId:    form.roleId,
          agencyIds: form.agencyIds,
          isActive:  form.isActive,
        }
        if (form.password) payload.password = form.password
        await userService.update(user.id, payload)
      } else {
        await userService.create({ ...form, password: form.password })
      }
      onSave()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {user ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Prénom *</label>
              <input required value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Nom *</label>
              <input required value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
            <input required type="email" value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Mot de passe {!user && '*'}
            </label>
            <input
              required={!user} type="password" value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder={user ? 'Laisser vide pour ne pas modifier' : ''}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Rôle *</label>
            <select value={form.roleId}
              onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Agences affectées</label>
            <div className="border border-gray-200 rounded-lg max-h-44 overflow-y-auto divide-y divide-gray-100">
              {agencies.map((ag) => (
                <label key={ag.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                  <input type="checkbox" checked={form.agencyIds.includes(ag.id)}
                    onChange={() => toggleAgency(ag.id)} className="accent-violet-600" />
                  <span className="text-sm text-gray-700">{ag.name}</span>
                  <span className="ml-auto text-xs text-gray-400">{ag.code}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="accent-violet-600" />
            <label htmlFor="isActive" className="text-sm text-gray-700">Compte actif</label>
          </div>
        </form>
        <div className="flex justify-end gap-2 px-6 py-4 border-t">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
            Annuler
          </button>
          <button onClick={handleSubmit as unknown as React.MouseEventHandler} disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50">
            {saving ? 'Enregistrement...' : user ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SettingsUsers() {
  const [users,     setUsers]     = useState<ApiUser[]>([])
  const [roles,     setRoles]     = useState<ApiRole[]>([])
  const [agencies,  setAgencies]  = useState<Agency[]>([])
  const [loading,   setLoading]   = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing,   setEditing]   = useState<ApiUser | undefined>()

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [u, r, a] = await Promise.all([
        userService.list(),
        roleService.list(),
        agencyService.list(),
      ])
      setUsers(u)
      setRoles(r)
      setAgencies(a as unknown as Agency[])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleSave = async () => {
    setIsFormOpen(false)
    setEditing(undefined)
    await fetchAll()
  }

  const handleEdit   = (u: ApiUser) => { setEditing(u); setIsFormOpen(true) }
  const handleDelete = async (u: ApiUser) => {
    if (!window.confirm(`Supprimer l'utilisateur ${u.firstName} ${u.lastName} ?`)) return
    try {
      await userService.remove(u.id)
      setUsers((prev) => prev.filter((x) => x.id !== u.id))
    } catch (e) { console.error(e) }
  }

  const getRoleName = (u: ApiUser) =>
    u.role?.name ?? roles.find((r) => r.id === u.roleId)?.name ?? u.roleId

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Utilisateurs</h2>
          <p className="text-xs text-gray-500">{users.length} utilisateur{users.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setEditing(undefined); setIsFormOpen(true) }}
          className="flex items-center gap-2 px-3 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700">
          <Plus className="w-4 h-4" /> Nouvel utilisateur
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400 animate-pulse">Chargement...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Utilisateur</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Rôle</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 hidden md:table-cell">Agences</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Statut</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => {
                const initials = `${u.firstName[0]}${u.lastName[0]}`.toUpperCase()
                const roleName = getRoleName(u)
                const agencyNames = u.agencyIds.length === 0
                  ? 'Toutes'
                  : u.agencyIds.map((id) => agencies.find((a) => a.id === id)?.name ?? id).join(', ')
                return (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-violet-700">{initials}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs px-2 py-0.5 rounded font-medium ${ROLE_BADGE[roleName] ?? 'bg-gray-100 text-gray-700'}`}>
                        {roleName}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-gray-600 line-clamp-1">{agencyNames}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                        {u.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEdit(u)}
                          className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(u)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {isFormOpen && (
        <UserForm
          user={editing} roles={roles} agencies={agencies}
          onSave={handleSave}
          onClose={() => { setIsFormOpen(false); setEditing(undefined) }}
        />
      )}
    </div>
  )
}
