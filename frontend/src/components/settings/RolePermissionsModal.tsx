import { useState } from 'react'
import { X } from 'lucide-react'
import { useToastStore } from '@/store/toastStore'
import PermissionsMatrix from '@/components/settings/PermissionsMatrix'
import type { Role, Permissions } from '@/types/settings'

interface Props {
  role: Role
  onClose: () => void
}

export default function RolePermissionsModal({ role, onClose }: Props) {
  const { addToast } = useToastStore()
  const [perms, setPerms] = useState<Permissions>({ ...role.permissions })

  const handleSave = () => {
    addToast({ type: 'success', message: 'Permissions mises a jour.' })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Droits — {role.name}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{role.description}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4">
          <PermissionsMatrix permissions={perms} onChange={setPerms} />
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}
