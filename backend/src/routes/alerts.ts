import { Router, type Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middlewares/auth'
import { ok, created, badRequest, notFound, serverError } from '../lib/response'
import type { AuthRequest } from '../types'
import { z } from 'zod'

const router = Router()
router.use(requireAuth)

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { agencyId, vehicleId, status, severity, category } = req.query
    const where: Record<string, unknown> = {}
    if (agencyId)  where.agencyId  = agencyId
    if (vehicleId) where.vehicleId = vehicleId
    if (status)    where.status    = status
    if (severity)  where.severity  = severity
    if (category)  where.category  = category
    const alerts = await prisma.alert.findMany({
      where, include: { vehicle: true, agency: true }, orderBy: { createdAt: 'desc' },
    })
    return ok(res, alerts)
  } catch { return serverError(res) }
})

router.put('/:id/resolve', async (req: AuthRequest, res: Response) => {
  try {
    const alert = await prisma.alert.update({
      where: { id: req.params.id },
      data:  { status: 'RESOLVED', resolvedAt: new Date(), resolvedBy: req.user!.userId },
    })
    return ok(res, alert)
  } catch { return notFound(res) }
})

export default router
