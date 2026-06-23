import { useAuthStore } from '@/store/useAuthStore'
import type { AppModule, PermissionAction } from '@/types/settings'

export function usePermissions() {
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const canAccess     = useAuthStore((s) => s.canAccess)

  return {
    can:       (module: AppModule, action: PermissionAction) => hasPermission(module, action),
    canAccess: (module: AppModule) => canAccess(module),
  }
}
