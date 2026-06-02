import type { ReactNode } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import type { AppModule, PermissionAction } from '@/types/settings'

interface Props {
  module: AppModule
  action: PermissionAction
  children: ReactNode
}

export default function PermissionGate({ module, action, children }: Props) {
  const hasPermission = useAuthStore((s) => s.hasPermission)
  if (!hasPermission(module, action)) return null
  return <>{children}</>
}
