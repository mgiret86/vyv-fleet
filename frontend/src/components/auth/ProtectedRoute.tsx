import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import type { AppModule } from '@/types/settings'
import AccessDenied from './AccessDenied'

interface Props {
  module?: AppModule
  children: ReactNode
}

export default function ProtectedRoute({ module, children }: Props) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const checkSession    = useAuthStore((s) => s.checkSession)
  const canAccess       = useAuthStore((s) => s.canAccess)

  useEffect(() => { checkSession() }, [checkSession])

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (module && !canAccess(module)) return <AccessDenied />
  return <>{children}</>
}
