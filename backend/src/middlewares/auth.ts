import type { Response, NextFunction } from 'express'
import { verifyAccessToken } from '../lib/jwt'
import { unauthorized } from '../lib/response'
import type { AuthRequest } from '../types'

// Middleware : vérifie le JWT et injecte user dans req
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return unauthorized(res)
  }
  const token = authHeader.slice(7)
  try {
    req.user = verifyAccessToken(token)
    return next()
  } catch {
    return unauthorized(res, 'Token invalide ou expiré')
  }
}

// Middleware : restreint à certains rôles
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.roleName)) {
      return unauthorized(res, 'Droits insuffisants')
    }
    return next()
  }
}
