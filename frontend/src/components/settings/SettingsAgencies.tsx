import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, X, Users, ChevronLeft } from 'lucide-react'
import { agencyService, userService, roleService, type ApiUser, type ApiRole } from '@/lib/services'
import type { Agency } from '@/types'

function AgencyForm({
  agency, onSave, onClose,
}: {
  agency?: Agency
  onSave: () => void
  onClose: () => void
}) {
  const [form, setForm] = useState({
    name:     agency?.name    ?? '',
    code:     agency?.code    ?? '',
    city:     agency?.city    ?? '',
    address:  agency?.address ?? '',
    zipCode:  agency?.zipCode ?? '',
    phone:    agency?.phone   ?? '',
    email:    agency?.email   ?? '',
    isActive: agency?.active !== undefined ? agency.active > 0 : true,
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      if (agency) {
        await agencyService.update(agency.id, form)
      } else {
        await agencyService.create(form)
      }
      onSave()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'enregistrement')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {agency ? "Modifier l'agence" : 'Nouvelle agence'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Nom *</label>
              <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Code *</label>
              <input required maxLength={10} value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 uppercase" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Adresse</label>
            <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Ville *</label>
              <input required value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Code postal</label>
              <input value={form.zipCode} onChange={(e) => setForm((f) => ({ ...f, zipCode: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Téléphone</label>
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="agIsActive" checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="accent-violet-600" />
            <label htmlFor="agIsActive" className="text-sm text-gray-700">Agence active</label>
          </div>
        </form>
        <div className="flex justify-end gap-2 px-6 py-4 border-t">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
            Annuler
          </button>
          <button onClick={handleSubmit as unknown as React.MouseEventHandler} disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50">
            {saving ? 'Enregistrement...' : agency ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AgencyDetail({ agency, users, roles, onEdit, onBack }: {
  agency: Agency
  users: ApiUser[]
  roles: ApiRole[]
  onEdit: () => void
  onBack: () => void
}) {
  const attachedUsers = users.filter((u) => u.agencyIds.includes(agency.id))
  const getRoleName = (roleId: string) => roles.find((r) => r.id === roleId)?.name ?? roleId

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900">
        <ChevronLeft className="w-4 h-4" /> Retour
      </button>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <span className="text-sm font-bold text-violet-700">{agency.code}</span>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">{agency.name}</h3>
              <p className="text-sm text-gray-500">{agency.city} — {agency.zipCode}</p>
            </div>
          </div>
          <button onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-violet-600 border border-violet-200 rounded-lg hover:bg-violet-50">
            <Pencil className="w-3.5 h-3.5" /> Modifier
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div><p className="text-xs text-gray-500 mb-0.5">Adresse</p><p className="text-gray-900">{agency.address || '—'}</p></div>
          <div><p className="text-xs text-gray-500 mb-0.5">Téléphone</p><p className="text-gray-900">{agency.phone || '—'}</p></div>
          <div><p className="text-xs text-gray-500 mb-0.5">Email</p><p className="text-gray-900 truncate">{agency.email || '—'}</p></div>
        </div>
        <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-lg font-bold text-violet-700">{agency.vehicles ?? 0}</p>
            <p className="text-xs text-gray-500">Véhicules</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-violet-700">{attachedUsers.length}</p>
            <p className="text-xs text-gray-500">Utilisateurs</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
          <Users className="w-4 h-4 text-violet-600" />
          <h4 className="text-sm font-semibold text-gray-900">Utilisateurs rattachés ({attachedUsers.length})</h4>
        </div>
        {attachedUsers.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">Aucun utilisateur rattaché</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Utilisateur</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Rôle</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attachedUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-violet-700">{u.firstName[0]}{u.lastName[0]}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block text-xs px-2 py-0.5 rounded font-medium bg-gray-100 text-gray-700">
                      {getRoleName(u.roleId)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                      {u.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default function SettingsAgencies() {
  const [agencies,   setAgencies]   = useState<Agency[]>([])
  const [users,      setUsers]      = useState<ApiUser[]>([])
  const [roles,      setRoles]      = useState<ApiRole[]>([])
  const [loading,    setLoading]    = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing,    setEditing]    = useState<Agency | undefined>()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [a, u, r] = await Promise.all([
        agencyService.list(),
        userService.list(),
        roleService.list(),
      ])
      setAgencies(a as unknown as Agency[])
      setUsers(u)
      setRoles(r)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleSave = async () => {
    setIsFormOpen(false); setEditing(undefined)
    await fetchAll()
  }

  const handleEdit   = (a: Agency) => { setEditing(a); setIsFormOpen(true) }
  const handleDelete = async (a: Agency) => {
    if (!window.confirm(`Supprimer l'agence ${a.name} ?Cette action est irréversible.`)) return
    try {
      await agencyService.remove(a.id)
      if (selectedId === a.id) setSelectedId(null)
      await fetchAll()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur lors de la suppression'
      window.alert(`⚠️ ${msg}`)
    }
  }

  const selectedAgency = agencies.find((a) => a.id === selectedId)

  if (selectedAgency && !isFormOpen) {
    return (
      <AgencyDetail
        agency={selectedAgency} users={users} roles={roles}
        onEdit={() => handleEdit(selectedAgency)}
        onBack={() => setSelectedId(null)}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Agences</h2>
          <p className="text-xs text-gray-500">{agencies.length} agence{agencies.length > 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setEditing(undefined); setIsFormOpen(true) }}
          className="flex items-center gap-2 px-3 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700">
          <Plus className="w-4 h-4" /> Nouvelle agence
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400 animate-pulse">Chargement...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Agence</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 hidden sm:table-cell">Ville</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 hidden md:table-cell">Véhicules</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 hidden md:table-cell">Utilisateurs</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Statut</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {agencies.map((ag) => {
                const attachedCount = users.filter((u) => u.agencyIds.includes(ag.id)).length
		const isActive = ag.active !== undefined ? ag.active > 0 : true
                return (
                  <tr key={ag.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedId(ag.id)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-violet-600">{ag.code}</span>
                        </div>
                        <span className="font-medium text-gray-900">{ag.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{ag.city}</td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{ag.vehicles ?? 0}</td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{attachedCount}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleEdit(ag)}
                          className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(ag)}
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
        <AgencyForm
          agency={editing}
          onSave={handleSave}
          onClose={() => { setIsFormOpen(false); setEditing(undefined) }}
        />
      )}
    </div>
  )
}
