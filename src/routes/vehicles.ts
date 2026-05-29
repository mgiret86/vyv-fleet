import { Router, type Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middlewares/auth'
import { ok, created, noContent, badRequest, notFound, serverError } from '../lib/response'
import type { AuthRequest } from '../types'
import { z } from 'zod'

const router = Router()
router.use(requireAuth)

const vehicleSchema = z.object({
  registration:              z.string().regex(/^[A-Z]{2}-?[0-9]{3}-?[A-Z]{2}$|^[0-9]{1,4}[A-Z]{1,3}[0-9]{2,3}$/),
  brand:                     z.string().min(2),
  model:                     z.string().min(2),
  category:                  z.enum(['AMBULANCE_A','AMBULANCE_B','VSL','TPMR','TAXI','SERVICE']),
  energy:                    z.enum(['DIESEL','HYBRID','ELECTRIC','GASOLINE']),
  agencyId:                  z.string().cuid(),
  mileage:                   z.number().int().min(0),
  monthlyLeaseCost:          z.number().nullable().optional(),
  arsApprovalExpiry:         z.string().datetime().nullable().optional(),
  insuranceExpiry:           z.string().datetime(),
  technicalInspectionExpiry: z.string().datetime(),
  nextMaintenanceDate:       z.string().datetime().nullable().optional(),
  firstRegistrationDate:     z.string().datetime().nullable().optional(),
  entryDate:                 z.string().datetime().nullable().optional(),
  exitDate:                  z.string().datetime().nullable().optional(),
})

// GET /api/vehicles
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { agencyId, status, category } = req.query
    const where: Record<string, unknown> = { deletedAt: null }
    if (agencyId) where.agencyId = agencyId
    if (status)   where.status   = status
    if (category) where.category = category

    const vehicles = await prisma.vehicle.findMany({
      where,
      include: { agency: true, alerts: { where: { status: 'OPEN' } } },
      orderBy: { createdAt: 'desc' },
    })
    return ok(res, vehicles)
  } catch { return serverError(res) }
})

// GET /api/vehicles/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const vehicle = await prisma.vehicle.findFirst({
      where:   { id: req.params.id, deletedAt: null },
      include: {
        agency:       true,
        maintenances: { orderBy: { scheduledDate: 'desc' }, take: 5 },
        incidents:    { orderBy: { date: 'desc' }, take: 5 },
        equipment:    true,
        fuelEntries:  { orderBy: { date: 'desc' }, take: 10 },
        alerts:       { where: { status: 'OPEN' } },
        tco:          true,
      },
    })
    if (!vehicle) return notFound(res)
    return ok(res, vehicle)
  } catch { return serverError(res) }
})

// POST /api/vehicles
router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = vehicleSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  try {
    const vehicle = await prisma.vehicle.create({ data: parsed.data as never })
    return created(res, vehicle)
  } catch { return serverError(res) }
})

// PUT /api/vehicles/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const parsed = vehicleSchema.partial().safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  try {
    const vehicle = await prisma.vehicle.update({
      where: { id: req.params.id },
      data:  parsed.data as never,
    })
    return ok(res, vehicle)
  } catch { return notFound(res) }
})

// DELETE /api/vehicles/:id (soft delete)
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.vehicle.update({
      where: { id: req.params.id },
      data:  { deletedAt: new Date() },
    })
    return noContent(res)
  } catch { return notFound(res) }
})

export default router
