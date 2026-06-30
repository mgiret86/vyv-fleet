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


router.get('/agency-stats', async (req: AuthRequest, res: Response) => {
  try {
    const { agencyId } = req.query

    // Récupérer toutes les agences concernées
    const agencyWhere: Record<string, unknown> = {}
    if (agencyId) agencyWhere.id = agencyId

    const agencies = await prisma.agency.findMany({
      where: agencyWhere,
      select: { id: true, name: true },
    })

    const stats = await Promise.all(
      agencies.map(async (agency) => {
        const vehicleWhere = { agencyId: agency.id, deletedAt: null }
        const [total, active, scores] = await Promise.all([
          prisma.vehicle.count({ where: vehicleWhere }),
          prisma.vehicle.count({ where: { ...vehicleWhere, status: 'ACTIVE' } }),
          prisma.vehicle.aggregate({
            where: vehicleWhere,
            _avg: { complianceScore: true },
          }),
        ])
        const availabilityRate = total > 0 ? Math.round((active / total) * 100) : 0
        const complianceScore  = Math.round(scores._avg.complianceScore ?? 0)
        return {
          agencyId:         agency.id,
          agencyName:       agency.name,
          total,
          active,
          availabilityRate,
          complianceScore,
        }
      })
    )

    return ok(res, stats)
  } catch (e) { console.error(e); return serverError(res) }
})

router.get('/cost-trend', async (req: AuthRequest, res: Response) => {
  try {
    const { agencyId } = req.query
    const agencyFilter = agencyId ? { agencyId: agencyId as string } : {}

    // 6 derniers mois
    const months: { label: string; gte: Date; lt: Date }[] = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d   = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1)
      months.push({
        label: d.toLocaleDateString('fr-FR', { month: 'short' }),
        gte:   d,
        lt:    end,
      })
    }

    const trend = await Promise.all(
      months.map(async ({ label, gte, lt }) => {
        const dateFilter = { gte, lt }

        const [fuelAgg, maintAgg] = await Promise.all([
          prisma.fuelEntry.aggregate({
            where: { ...agencyFilter, date: dateFilter },
            _sum: { totalCost: true },
          }),
          prisma.maintenance.aggregate({
            where: {
              ...agencyFilter,
              OR: [
                { completedDate: dateFilter },
                { scheduledDate: dateFilter },
              ],
            },
            _sum: { realCost: true, estimatedCost: true },
          }),
        ])

        const fuel        = Math.round(fuelAgg._sum.totalCost ?? 0)
        const maintenance = Math.round(
          (maintAgg._sum.realCost ?? maintAgg._sum.estimatedCost ?? 0)
        )
        return { month: label, fuel, maintenance, total: fuel + maintenance }
      })
    )

    return ok(res, trend)
  } catch (e) { console.error(e); return serverError(res) }
})

export default router
