import { Router, type Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middlewares/auth'
import { ok, created, noContent, badRequest, notFound, serverError } from '../lib/response'
import type { AuthRequest } from '../types'
import { z } from 'zod'

const router = Router()
router.use(requireAuth)

const fuelSchema = z.object({
  vehicleId:        z.string().cuid(),
  agencyId:         z.string().cuid(),
  date:             z.coerce.date().transform((d) => d.toISOString()),
  fuelType:         z.enum(['DIESEL','HYBRID','ELECTRIC']),
  liters:           z.number().min(0),
  pricePerLiter:    z.number().min(0),
  totalCost:        z.number().min(0),
  mileageAtFill:    z.number().int().min(0),
  distanceSinceLast: z.number().int().min(0).optional(),
  consumption:      z.number().nullable().optional(),
  station:          z.string().optional(),
  driverName:       z.string().optional(),
  cardNumber:       z.string().optional(),
})

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { agencyId, vehicleId, fuelType } = req.query
    const where: Record<string, unknown> = {}
    if (agencyId)  where.agencyId  = agencyId
    if (vehicleId) where.vehicleId = vehicleId
    if (fuelType)  where.fuelType  = fuelType
    const entries = await prisma.fuelEntry.findMany({ where, include: { vehicle: true }, orderBy: { date: 'desc' } })
    return ok(res, entries)
  } catch { return serverError(res) }
})

router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = fuelSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  try {
    const entry = await prisma.fuelEntry.create({ data: parsed.data as never })
    return created(res, entry)
  } catch { return serverError(res) }
})

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const parsed = fuelSchema.partial().safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  try {
    const entry = await prisma.fuelEntry.update({ where: { id: req.params.id }, data: parsed.data as never })
    return ok(res, entry)
  } catch { return notFound(res) }
})

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.fuelEntry.delete({ where: { id: req.params.id } })
    return noContent(res)
  } catch { return notFound(res) }
})

export default router
