import { useState, useEffect, useCallback } from 'react'
import { Pencil, Trash2, X, Plus } from 'lucide-react'
import { roleService, type ApiRole } from '@/lib/services'

export type AppModule = 'dashboard' | 'vehicles' | 'maintenance' | 'compliance' | 'incidents' | 'drivers' | 'fuel' | 'equipment' | 'settings'
export type PermissionAction = 'view' | 'create' | 'edit' | 'delete'

const APP_MODULES: AppModule[] = ['dashboard','vehicles','maintenance','compliance','incidents','drivers','fuel','equipment','settings']
const APP_ACTIONS: PermissionAction[] = ['view','create','edit','delete']

const MODULE_LABELS: Record<AppModule, string> = {
  dashboard: 'Tableau de bord', vehicles: 'Véhicules', maintenance: 'Maintenance',
  compliance: 'Conformité', incidents: 'Incidents', drivers: 'Conducteurs',
  fuel: 'Carburant', equipment: 'Équipements', settings: 'Paramètres',
}
const ACTION_LABELS: Record<PermissionAction, string> = {
  view: 'Voir', create: 'Créer', edit: 'Modifier', delete: 'Supprimer',
}

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  violet: { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-300', dot: 'bg-violet-600' },
  blue:   { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-300',   dot: 'bg-blue-600'   },
  green:  { bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-300',  dot: 'bg-green-600'  },
  red:    { bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-300',    dot: 'bg-red-600'    },
  gray:   { bg: 'bg-gray-100',   text: 'text-gray-700',   border: 'border-gray-300',   dot: 'bg-gray-600'   },
}

type PermissionSet = Record<string, Record<string, boolean>>

function emptyPermissions(): PermissionSet {
  const p: PermissionSet = {}
  for (const m of APP_MODULES) { p[m] = {}; for (const a of APP_ACTIONS) p[m][a] = false }
  return p
}

function apiPermsToBool(perms: Record<string, Record<string, boolean>>): PermissionSet {
  const p = emptyPermissions()
  for (const m of APP_MODULES) {
    for (const a of APP_ACTIONS) {
      p[m][a] = perms?.[m]?.[a] ?? false
    }
  }
  return p
}

function boolPermsToArray(perms: PermissionSet): { module: AppModule; action: PermissionAction }[] {
  const result: { module: AppModule; action: PermissionAction }[] = []
  for (const m of APP_MODULES) {
    for (const a of APP_ACTIONS) {
      if (perms[m]?.[a]) result.push({ module: m as AppModule, action: a as PermissionAction })
    }
  }
  return result
}

export default function SettingsRoles() {
  const [roles,   setRoles]   = useState<ApiRole[]>([])
  const [loading, setLoading] = useState(true)

  const [isDialogOpen,        setIsDialogOpen]        = useState(false)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [editingRole,         setEditingRole]         = useState<ApiRole | null>(null)
  const [roleToDeleteId,      setRoleToDeleteId]      = useState<string | null>(null)
  const [saving,              setSaving]              = useState(false)
  const [formError,           setFormError]           = useState<string | null>(null)

  const [roleName,        setRoleName]        = useState('')
  const [roleDescription, setRoleDescription] = useState('')
  const [roleColor,       setRoleColor]       = useState('gray')
  const [permissions,     setPermissions]     = useState<PermissionSet>(emptyPermissions())

  const fetchRoles = useCallback(async () => {
    setLoading(true)
    try { setRoles(await roleService.list()) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchRoles() }, [fetchRoles])

  const openCreate = () => {
    setEditingRole(null)
    setRoleName(''); setRoleDescription(''); setRoleColor('gray')
    setPermissions(emptyPermissions()); setFormError(null)
    setIsDialogOpen(true)
  }

  const openEdit = (role: ApiRole) => {
    setEditingRole(role)
    setRoleName(role.name)
    setRoleDescription(role.description ?? '')
    setRoleColor('gray')
    setPermissions(apiPermsToBool(role.permissions))
    setFormError(null)
    setIsDialogOpen(true)
  }

  const handlePermChange = (module: AppModule, action: PermissionAction, checked: boolean) =>
    setPermissions((p) => ({ ...p, [module]: { ...p[module], [action]: checked } }))

  const handleToggleModule = (module: AppModule, checked: boolean) =>
    setPermissions((p) => {
      const m = { ...p[module] }
      for (const a of APP_ACTIONS) m[a] = checked
      return { ...p, [module]: m }
    })

  const handleSave = async () => {
    if (!roleName.trim()) { setFormError('Le nom du rôle est requis.'); return }
    setSaving(true); setFormError(null)
    try {
    const payload = {
      name:        roleName.trim(),
      description: roleDescription.trim(),
      color:       roleColor,
      permissions: boolPermsToArray(permissions),
    }
    if (editingRole) {
      await roleService.update(editingRole.id, payload as unknown as Partial<ApiRole>)
    } else {
      await roleService.create(payload as unknown as Partial<ApiRole>)
    }
      setIsDialogOpen(false)
      await fetchRoles()
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Erreur lors de l\'enregistrement')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!roleToDeleteId) return
    try {
      await roleService.remove(roleToDeleteId)
      setIsDeleteConfirmOpen(false); setRoleToDeleteId(null)
      await fetchRoles()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Erreur lors de la suppression')
      setIsDeleteConfirmOpen(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rôles et droits</h1>
        <button onClick={openCreate}
          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-violet-600 hover:bg-violet-700">
          <Plus className="mr-2 h-4 w-4" /> Nouveau rôle
        </button>
      </div>

      {loading ? (
        <div className="text-center text-sm text-gray-400 animate-pulse py-12">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => {
            const colorKey = role.color ?? 'gray'
            const colors   = ROLE_COLORS[colorKey] ?? ROLE_COLORS.gray
            const viewMods = APP_MODULES.filter((m) => role.permissions?.[m]?.view)
            return (
              <div key={role.id} className={`${colors.bg} border ${colors.border} rounded-xl shadow-sm p-5 flex flex-col justify-between`}>
                <div>
                  <div className="flex items-center mb-2">
                    <span className={`w-3 h-3 rounded-full mr-2 ${colors.dot}`} />
                    <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                    <span className={`ml-3 px-2 py-0.5 rounded-full text-xs font-medium ${role.isSystem ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>
                      {role.isSystem ? 'Système' : 'Personnalisé'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-4">{role.description}</p>
                  <div className="mb-4">
                    <h4 className="text-xs font-medium text-gray-600 uppercase mb-2">Accès en lecture :</h4>
                    <div className="flex flex-wrap gap-2">
                      {viewMods.length > 0
                        ? viewMods.map((m) => (
                            <span key={m} className="px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-800">
                              {MODULE_LABELS[m]}
                            </span>
                          ))
                        : <span className="px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-600">Aucun</span>
                      }
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 mt-4">
                  <button onClick={() => openEdit(role)} disabled={role.isSystem}
                    className="p-2 rounded-md text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => { setRoleToDeleteId(role.id); setIsDeleteConfirmOpen(true) }} disabled={role.isSystem}
                    className="p-2 rounded-md text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingRole ? `Modifier : ${editingRole.name}` : 'Nouveau rôle'}
              </h2>
              <button onClick={() => setIsDialogOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
              {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{formError}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input value={roleName} onChange={(e) => setRoleName(e.target.value)} disabled={editingRole?.isSystem}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-violet-500 focus:border-violet-500 disabled:bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input value={roleDescription} onChange={(e) => setRoleDescription(e.target.value)} disabled={editingRole?.isSystem}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-violet-500 focus:border-violet-500 disabled:bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Couleur</label>
                <select value={roleColor} onChange={(e) => setRoleColor(e.target.value)} disabled={editingRole?.isSystem}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-violet-500 disabled:bg-gray-50">
                  {Object.keys(ROLE_COLORS).map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">Permissions</h3>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Module</th>
                        {APP_ACTIONS.map((a) => <th key={a} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">{ACTION_LABELS[a]}</th>)}
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tout</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {APP_MODULES.map((module) => (
                        <tr key={module}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{MODULE_LABELS[module]}</td>
                          {APP_ACTIONS.map((action) => (
                            <td key={action} className="px-4 py-3 text-center">
                              <input type="checkbox" checked={permissions[module]?.[action] ?? false}
                                onChange={(e) => handlePermChange(module, action, e.target.checked)}
                                disabled={editingRole?.isSystem}
                                className="h-4 w-4 accent-violet-600 disabled:opacity-50" />
                            </td>
                          ))}
                          <td className="px-4 py-3 text-center">
                            <input type="checkbox"
                              checked={APP_ACTIONS.every((a) => permissions[module]?.[a])}
                              onChange={(e) => handleToggleModule(module, e.target.checked)}
                              disabled={editingRole?.isSystem}
                              className="h-4 w-4 accent-violet-600 disabled:opacity-50" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button onClick={() => setIsDialogOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">
                Annuler
              </button>
              <button onClick={handleSave} disabled={saving || editingRole?.isSystem}
                className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-md hover:bg-violet-700 disabled:opacity-50">
                {saving ? 'Enregistrement...' : editingRole ? 'Sauvegarder' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-auto p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Confirmer la suppression</h2>
            <p className="text-gray-700 mb-6">
              Supprimer le rôle "<span className="font-semibold">{roles.find((r) => r.id === roleToDeleteId)?.name}</span>" ? Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">
                Annuler
              </button>
              <button onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
