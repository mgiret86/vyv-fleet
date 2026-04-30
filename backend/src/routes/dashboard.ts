import { Router, type Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middlewares/auth'
import { ok, serverError } from '../lib/response'
import type { AuthRequest } from '../types'

const router = Router()
router.use(requireAuth)

router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const { agencyId } = req.query
    const where: Record<string, unknown> = { deletedAt: null }
    const alertWhere: Record<string, unknown> = { status: { in: ['OPEN', 'IN_PROGRESS'] } }
    const maintWhere: Record<string, unknown> = { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } }
    if (agencyId) {
      where.agencyId    = agencyId
      alertWhere.agencyId = agencyId
      maintWhere.agencyId = agencyId
    }
    const now   = new Date()
    const start = new Date(now); start.setDate(now.getDate() - now.getDay())
    const end   = new Date(start); end.setDate(start.getDate() + 7)
    const [totalVehicles, activeVehicles, criticalAlerts, warningAlerts, maintenancesThisWeek] =
      await Promise.all([
        prisma.vehicle.count({ where }),
        prisma.vehicle.count({ where: { ...where, status: 'ACTIVE' } }),
        prisma.alert.count({ where: { ...alertWhere, severity: 'CRITICAL' } }),
        prisma.alert.count({ where: { ...alertWhere, severity: 'WARNING' } }),
        prisma.maintenance.count({ where: { ...maintWhere, scheduledDate: { gte: start, lt: end } } }),
      ])
    const availabilityRate = totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 100
    return ok(res, { totalVehicles, activeVehicles, availabilityRate, criticalAlerts, warningAlerts, maintenancesThisWeek })
  } catch (e) { console.error(e); return serverError(res) }
})

router.get('/alerts', async (req: AuthRequest, res: Response) => {
  try {
    const { agencyId } = req.query
    const where: Record<string, unknown> = { status: { in: ['OPEN', 'IN_PROGRESS'] } }
    if (agencyId) where.agencyId = agencyId
    const alerts = await prisma.alert.findMany({
      where, include: { vehicle: true, agency: true },
      orderBy: [{ severity: 'asc' }, { dueDate: 'asc' }], take: 10,
    })
    return ok(res, alerts)
  } catch (e) { console.error(e); return serverError(res) }
})

router.get('/maintenances', async (req: AuthRequest, res: Response) => {
  try {
    const { agencyId } = req.query
    const now      = new Date()
    const in30days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const where: Record<string, unknown> = {
      status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      scheduledDate: { gte: now, lte: in30days },
    }
    if (agencyId) where.agencyId = agencyId
    const maintenances = await prisma.maintenance.findMany({
      where, include: { vehicle: true, agency: true },
      orderBy: { scheduledDate: 'asc' }, take: 10,
    })
    return ok(res, maintenances)
  } catch (e) { console.error(e); return serverError(res) }
})

export default router
