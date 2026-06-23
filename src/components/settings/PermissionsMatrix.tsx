import type { Permissions, AppModule, PermissionAction } from '@/types/settings'

const MODULES: { key: AppModule; label: string }[] = [
  { key: 'dashboard',   label: 'Tableau de bord' },
  { key: 'vehicles',    label: 'Vehicules'        },
  { key: 'maintenance', label: 'Maintenance'      },
  { key: 'compliance',  label: 'Conformite'       },
  { key: 'incidents',   label: 'Incidents'        },
  { key: 'drivers',     label: 'Conducteurs'      },
  { key: 'fuel',        label: 'Carburant'        },
  { key: 'equipment',   label: 'Equipements'      },
  { key: 'settings',    label: 'Parametres'       },
]

const ACTIONS: { key: PermissionAction; label: string }[] = [
  { key: 'view',   label: 'Voir'      },
  { key: 'create', label: 'Creer'     },
  { key: 'edit',   label: 'Modifier' },
  { key: 'delete', label: 'Supprimer' },
]

interface PermissionsMatrixProps {
  permissions: Permissions
  onChange: (updated: Permissions) => void
  disabled?: boolean
}

export default function PermissionsMatrix({
  permissions,
  onChange,
  disabled = false,
}: PermissionsMatrixProps) {
  const toggle = (modKey: AppModule, actionKey: PermissionAction) => {
    if (disabled) return

    const current = permissions[modKey]
    let next = { ...current }

    if (actionKey === 'view') {
      const viewToggled = !current.view
      next = {
        view:   viewToggled,
        create: viewToggled ? current.create : false,
        edit:   viewToggled ? current.edit   : false,
        delete: viewToggled ? current.delete  : false,
      }
    } else {
      const actionToggled = !current[actionKey]
      next = {
        ...current,
        [actionKey]: actionToggled,
        view: actionToggled ? true : current.view,
      }
    }

    onChange({ ...permissions, [modKey]: next })
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide w-44">
              Module
            </th>
            {ACTIONS.map((action) => (
              <th
                key={action.key}
                className="text-center py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide"
              >
                {action.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MODULES.map((mod, idx) => (
            <tr
              key={mod.key}
              className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-violet-50/40 transition-colors`}
            >
              <td className="py-3 pr-4 text-sm font-semibold text-gray-800">
                {mod.label}
              </td>
              {ACTIONS.map((action) => {
                const checked = permissions[mod.key][action.key]
                const cellDisabled =
                  disabled || (action.key !== 'view' && !permissions[mod.key].view)

                return (
                  <td key={action.key} className="text-center py-3 px-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={cellDisabled}
                      onChange={() => toggle(mod.key, action.key)}
                      className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed accent-violet-600"
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
