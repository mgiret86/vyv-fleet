import { Router, type Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middlewares/auth'
import { ok, created, noContent, badRequest, notFound, serverError } from '../lib/response'
import type { AuthRequest } from '../types'
import { z } from 'zod'

const router = Router()
router.use(requireAuth)

const maintenanceSchema = z.object({
  vehicleId:            z.string().cuid(),
  agencyId:             z.string().cuid(),
  type:                 z.enum(['PREVENTIVE','CORRECTIVE','REGULATORY','SANITAIRE']),
  label:                z.string().min(2),
  description:          z.string().optional(),
  scheduledDate:        z.string().datetime(),
  completedDate:        z.string().datetime().nullable().optional(),
  status:               z.enum(['SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED']).optional(),
  provider:             z.string().optional(),
  estimatedCost:        z.number().nullable().optional(),
  realCost:             z.number().nullable().optional(),
  mileageAtMaintenance: z.number().int().optional(),
  notes:                z.string().optional(),
})

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { agencyId, vehicleId, status, type } = req.query
    const where: Record<string, unknown> = {}
    if (agencyId)  where.agencyId  = agencyId
    if (vehicleId) where.vehicleId = vehicleId
    if (status)    where.status    = status
    if (type)      where.type      = type
    const maintenances = await prisma.maintenance.findMany({
      where, include: { vehicle: true, agency: true }, orderBy: { scheduledDate: 'desc' },
    })
    return ok(res, maintenances)
  } catch { return serverError(res) }
})

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const m = await prisma.maintenance.findUnique({ where: { id: req.params.id }, include: { vehicle: true } })
    if (!m) return notFound(res)
    return ok(res, m)
  } catch { return serverError(res) }
})

router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = maintenanceSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  try {
    const m = await prisma.maintenance.create({ data: parsed.data as never, include: { vehicle: true, agency: true } })
    return created(res, m)
  } catch { return serverError(res) }
})

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const parsed = maintenanceSchema.partial().safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  try {
    const m = await prisma.maintenance.update({ where: { id: req.params.id }, data: parsed.data as never, include: { vehicle: true, agency: true } })
    return ok(res, m)
  } catch { return notFound(res) }
})

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.maintenance.delete({ where: { id: req.params.id } })
    return noContent(res)
  } catch { return notFound(res) }
})

export default router
