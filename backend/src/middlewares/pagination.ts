import type { Response, NextFunction } from 'express'
import type { AuthRequest, PaginationParams } from '../types'

// Injecte page/limit/skip dans req pour tous les GET list
export function paginate(req: AuthRequest & { pagination?: PaginationParams }, _res: Response, next: NextFunction) {
  const page  = Math.max(1, parseInt(req.query.page  as string) || 1)
  const limit = Math.min(100, parseInt(req.query.limit as string) || 20)
  req.pagination = { page, limit, skip: (page - 1) * limit }
  next()
}
