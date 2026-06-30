import { Router, type Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middlewares/auth'
import { ok, created, noContent, badRequest, notFound, serverError } from '../lib/response'
import type { AuthRequest } from '../types'
import { z } from 'zod'
import { RelaisMissionStatus } from '@prisma/client'

const router = Router()
router.use(requireAuth)

// ── Helpers ────────────────────────────────────────────────────────
function isSuperAdmin(req: AuthRequest): boolean {
  return req.user?.roleName === 'SUPER_ADMIN'
}

const DEPOT_INCLUDE = {
  agency:   true,
  vehicles: { include: { agency: true } },
  missions: { where: { status: { in: [RelaisMissionStatus.PLANNED, RelaisMissionStatus.ACTIVE] } } },
}

const MISSION_INCLUDE = {
  relaisVehicle:   { include: { agency: true, relaisDepot: true } },
  replacedVehicle: { include: { agency: true } },
  depot:           true,
  createdBy:       { select: { id: true, firstName: true, lastName: true } },
}

// ── Schemas Zod ───────────────────────────────────────────────────
const depotSchema = z.object({
  name:       z.string().min(1),
  address:    z.string().optional(),
  city:       z.string().optional(),
  zipCode:    z.string().optional(),
  phone:      z.string().optional(),
  capacity:   z.number().int().min(1).optional().default(1),
  agencyId:   z.string().cuid().optional(),
  notes:      z.string().optional(),
})

const missionSchema = z.object({
  relaisVehicleId:   z.string().cuid(),
  replacedVehicleId: z.string().cuid(),
  depotId:           z.string().cuid().optional().nullable(),
  startDate:         z.string().datetime(),
  estimatedEndDate:  z.string().datetime().optional().nullable(),
  endDate:           z.string().datetime().optional().nullable(),
  status:            z.enum(['PLANNED','ACTIVE','COMPLETED','CANCELLED']).optional(),
  reason:            z.string().optional(),
  notes:             z.string().optional(),
})

// ════════════════════════════════════════════════════════════════
// VÉHICULES RELAIS
// ════════════════════════════════════════════════════════════════

// GET /relais/vehicles — liste tous les VH isRelais=true
router.get('/vehicles', async (req: AuthRequest, res: Response) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { isRelais: true, deletedAt: null },
      include: {
        agency: true,
        relaisDepot: true,
        relaisMissions: {
          where: { status: { in: [RelaisMissionStatus.PLANNED, RelaisMissionStatus.ACTIVE] } },
          include: { replacedVehicle: true },
          orderBy: { startDate: 'asc' },
        },
      },
      orderBy: { registration: 'asc' },
    })
    return ok(res, vehicles)
  } catch { return serverError(res) }
})

// PUT /relais/vehicles/:id/toggle — active/désactive le statut relais (SUPER_ADMIN)
router.put('/vehicles/:id/toggle', async (req: AuthRequest, res: Response) => {
  if (!isSuperAdmin(req)) return badRequest(res, 'Réservé au super-administrateur.')
  try {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: req.params.id, deletedAt: null },
    })
    if (!vehicle) return notFound(res)
    const updated = await prisma.vehicle.update({
      where: { id: req.params.id },
      data:  { isRelais: !vehicle.isRelais },
      include: { agency: true },
    })
    return ok(res, updated)
  } catch { return serverError(res) }
})

// ════════════════════════════════════════════════════════════════
// DÉPÔTS
// ════════════════════════════════════════════════════════════════

// GET /relais/depots
router.get('/depots', async (_req: AuthRequest, res: Response) => {
  try {
    const depots = await prisma.relaisDepot.findMany({
      include: DEPOT_INCLUDE,
      orderBy: { name: 'asc' },
    })
    return ok(res, depots)
  } catch { return serverError(res) }
})

// POST /relais/depots
router.post('/depots', async (req: AuthRequest, res: Response) => {
  const parsed = depotSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  try {
    const depot = await prisma.relaisDepot.create({
      data:    parsed.data as never,
      include: DEPOT_INCLUDE,
    })
    return created(res, depot)
  } catch { return serverError(res) }
})

// PUT /relais/depots/:id
router.put('/depots/:id', async (req: AuthRequest, res: Response) => {
  const parsed = depotSchema.partial().safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  try {
    const depot = await prisma.relaisDepot.update({
      where:   { id: req.params.id },
      data:    parsed.data as never,
      include: DEPOT_INCLUDE,
    })
    return ok(res, depot)
  } catch { return notFound(res) }
})

// DELETE /relais/depots/:id
router.delete('/depots/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.relaisDepot.delete({ where: { id: req.params.id } })
    return noContent(res)
  } catch { return notFound(res) }
})

// PUT /relais/depots/:id/vehicles/:vehicleId — affecter un VH à un dépôt
router.put("/depots/:id/vehicles/:vehicleId", async (req: AuthRequest, res: Response) => {
  try {
    const { id, vehicleId } = req.params
    // Vérifier que le dépôt existe
    const depot = await prisma.relaisDepot.findUnique({ where: { id } })
    if (!depot) return notFound(res)
    // Affecter le véhicule au dépôt
    const vehicle = await prisma.vehicle.update({
      where:   { id: vehicleId },
      data:    { relaisDepotId: id },
      include: { agency: true, relaisDepot: true },
    })
    return ok(res, vehicle)
  } catch { return notFound(res) }
})

// DELETE /relais/depots/:id/vehicles/:vehicleId — désaffecter un VH d'un dépôt
router.delete("/depots/:id/vehicles/:vehicleId", async (req: AuthRequest, res: Response) => {
  try {
    const { vehicleId } = req.params
    const vehicle = await prisma.vehicle.update({
      where:   { id: vehicleId },
      data:    { relaisDepotId: null },
      include: { agency: true, relaisDepot: true },
    })
    return ok(res, vehicle)
  } catch { return notFound(res) }
})

// ════════════════════════════════════════════════════════════════
// MISSIONS
// ════════════════════════════════════════════════════════════════

// GET /relais/missions
router.get('/missions', async (req: AuthRequest, res: Response) => {
  try {
    const { status, relaisVehicleId, replacedVehicleId } = req.query
    const where: Record<string, unknown> = {}
    if (status)            where.status            = status as RelaisMissionStatus
    if (relaisVehicleId)   where.relaisVehicleId   = relaisVehicleId
    if (replacedVehicleId) where.replacedVehicleId = replacedVehicleId
    const missions = await prisma.relaisMission.findMany({
      where,
      include:  MISSION_INCLUDE,
      orderBy:  { startDate: 'desc' },
    })
    return ok(res, missions)
  } catch { return serverError(res) }
})

// GET /relais/missions/:id
router.get('/missions/:id', async (req: AuthRequest, res: Response) => {
  try {
    const mission = await prisma.relaisMission.findUnique({
      where:   { id: req.params.id },
      include: MISSION_INCLUDE,
    })
    if (!mission) return notFound(res)
    return ok(res, mission)
  } catch { return serverError(res) }
})

// POST /relais/missions
router.post('/missions', async (req: AuthRequest, res: Response) => {
  const parsed = missionSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  const { relaisVehicleId, replacedVehicleId } = parsed.data
  if (relaisVehicleId === replacedVehicleId)
    return badRequest(res, 'Le véhicule relais et le véhicule remplacé ne peuvent pas être identiques.')
  try {
    // Vérifier que le VH est bien marqué isRelais
    const relaisVh = await prisma.vehicle.findFirst({
      where: { id: relaisVehicleId, isRelais: true, deletedAt: null },
    })
    if (!relaisVh) return badRequest(res, 'Ce véhicule n\'est pas marqué comme véhicule relais.')
    const mission = await prisma.relaisMission.create({
      data: {
        ...(parsed.data as object),
        createdById: req.user!.userId,
      } as never,
      include: MISSION_INCLUDE,
    })
    return created(res, mission)
  } catch { return serverError(res) }
})

// PUT /relais/missions/:id
router.put('/missions/:id', async (req: AuthRequest, res: Response) => {
  const parsed = missionSchema.partial().safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  try {
    const mission = await prisma.relaisMission.update({
      where:   { id: req.params.id },
      data:    parsed.data as never,
      include: MISSION_INCLUDE,
    })
    return ok(res, mission)
  } catch { return notFound(res) }
})

// DELETE /relais/missions/:id
router.delete('/missions/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.relaisMission.delete({ where: { id: req.params.id } })
    return noContent(res)
  } catch { return notFound(res) }
})

// ════════════════════════════════════════════════════════════════
// KPIs
// ════════════════════════════════════════════════════════════════
router.get('/kpis', async (_req: AuthRequest, res: Response) => {
  try {
    const now = new Date()
    const [totalRelais, activeMissions, allMissions, lateMissions] = await Promise.all([
      prisma.vehicle.count({ where: { isRelais: true, deletedAt: null } }),
      prisma.relaisMission.count({ where: { status: 'ACTIVE' } }),
      prisma.relaisMission.findMany({
        where:   { status: { in: ['COMPLETED'] } },
        select:  { startDate: true, endDate: true },
      }),
      prisma.relaisMission.count({
        where: {
          status:          { in: ['PLANNED','ACTIVE'] },
          estimatedEndDate: { lt: now },
        },
      }),
    ])

    // Durée moyenne des missions terminées (en jours)
    const completedWithDates = allMissions.filter(m => m.endDate)
    const avgDurationDays = completedWithDates.length > 0
      ? completedWithDates.reduce((acc: number, m: { startDate: Date; endDate: Date | null }) => {
          const diff = (new Date(m.endDate!).getTime() - new Date(m.startDate).getTime())
          return acc + diff / (1000 * 60 * 60 * 24)
        }, 0) / completedWithDates.length
      : 0

    // VH relais les plus sollicités
    const topVehicles = await prisma.relaisMission.groupBy({
      by:      ['relaisVehicleId'],
      _count:  { relaisVehicleId: true },
      orderBy: { _count: { relaisVehicleId: 'desc' } },
      take:    5,
    })

    return ok(res, {
      totalRelais,
      activeMissions,
      occupancyRate: totalRelais > 0 ? Math.round((activeMissions / totalRelais) * 100) : 0,
      avgDurationDays: Math.round(avgDurationDays * 10) / 10,
      lateMissions,
      topVehicles,
    })
  } catch { return serverError(res) }
})

export default router
