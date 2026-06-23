import { Info } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import type { AppModule } from '@/types/settings'

interface Props {
  module: AppModule
}

export default function ReadOnlyBanner({ module }: Props) {
  const hasPermission = useAuthStore((s) => s.hasPermission)

  const canView   = hasPermission(module, 'view')
  const canCreate = hasPermission(module, 'create')
  const canEdit   = hasPermission(module, 'edit')
  const canDelete = hasPermission(module, 'delete')

  if (!canView || canCreate || canEdit || canDelete) return null

  return (
    <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-lg bg-amber-50 border border-amber-200">
      <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
      <p className="text-sm text-amber-800">
        Vous etes en mode lecture seule sur ce module.
      </p>
    </div>
  )
}
