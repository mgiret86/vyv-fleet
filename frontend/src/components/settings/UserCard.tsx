import { Pencil, Trash2 } from 'lucide-react'
import PermissionGate from '@/components/auth/PermissionGate'
import type { SettingsUser, Role, SettingsAgency } from '@/types/settings'

const ROLE_BADGE = {
  violet: 'bg-violet-100 text-violet-700',
  blue:   'bg-blue-100 text-blue-700',
  green:  'bg-green-100 text-green-700',
  gray:   'bg-gray-100 text-gray-700',
} as const

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700',
  'bg-blue-100 text-blue-700',
  'bg-green-100 text-green-700',
  'bg-amber-100 text-amber-700',
  'bg-pink-100 text-pink-700',
] as const

interface Props {
  user: SettingsUser
  agencies: SettingsAgency[]
  roles: Role[]
  onEdit: () => void
}

function avatarColor(id: string): string {
  return AVATAR_COLORS[id.charCodeAt(id.length - 1) % AVATAR_COLORS.length]
}

export default function UserCard({ user, agencies, roles, onEdit }: Props) {
  const role      = roles.find((r) => r.id === user.roleId)
  const initials  = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
  const isGlobal  = user.roleId === 'super-admin' || user.roleId === 'admin'
  const userAgs   = agencies.filter((a) => user.agencyIds.includes(a.id))
  const shown     = userAgs.slice(0, 2)
  const extra     = userAgs.length - 2

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${avatarColor(user.id)}`}>
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-gray-500 truncate max-w-[160px]">{user.email}</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {user.isActive ? 'Actif' : 'Inactif'}
        </span>
      </div>

      {/* Role badge */}
      {role && (
        <span className={`self-start text-xs px-2 py-0.5 rounded font-medium ${ROLE_BADGE[role.color]}`}>
          {role.name}
        </span>
      )}

      {/* Agencies */}
      <div className="flex flex-wrap gap-1">
        {isGlobal ? (
          <span className="text-xs px-2 py-0.5 rounded bg-violet-50 text-violet-600 font-medium">
            Toutes les agences
          </span>
        ) : (
          <>
            {shown.map((a) => (
              <span key={a.id} className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                {a.city}
              </span>
            ))}
            {extra > 0 && (
              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                +{extra} autres
              </span>
            )}
            {userAgs.length === 0 && (
              <span className="text-xs text-gray-400">Aucune agence</span>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
        <PermissionGate module="settings" action="edit">
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Modifier
          </button>
        </PermissionGate>
        <PermissionGate module="settings" action="delete">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
            Supprimer
          </button>
        </PermissionGate>
      </div>
    </div>
  )
}
