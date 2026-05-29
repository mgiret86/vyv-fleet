import { Router, type Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middlewares/auth'
import { ok, created, noContent, badRequest, notFound, serverError } from '../lib/response'
import type { AuthRequest } from '../types'
import { z } from 'zod'

const router = Router()
router.use(requireAuth)

const equipmentSchema = z.object({
  vehicleId:           z.string().cuid(),
  agencyId:            z.string().cuid(),
  label:               z.string().min(2),
  category:            z.enum(['STRETCHER','DEFIBRILLATOR','OXYGEN','RADIO','GPS','FIRST_AID','OTHER']),
  serialNumber:        z.string().nullable().optional(),
  status:              z.enum(['OK','WARNING','CRITICAL','OUT_OF_SERVICE']).optional(),
  installDate:         z.string().datetime().nullable().optional(),
  lastCheckDate:       z.string().datetime().nullable().optional(),
  nextCheckDate:       z.string().datetime().nullable().optional(),
  expiryDate:          z.string().datetime().nullable().optional(),
  maintenanceProvider: z.string().nullable().optional(),
  notes:               z.string().nullable().optional(),
})

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { agencyId, vehicleId, status, category } = req.query
    const where: Record<string, unknown> = {}
    if (agencyId)  where.agencyId  = agencyId
    if (vehicleId) where.vehicleId = vehicleId
    if (status)    where.status    = status
    if (category)  where.category  = category
    const equipment = await prisma.equipment.findMany({ where, include: { vehicle: true }, orderBy: { label: 'asc' } })
    return ok(res, equipment)
  } catch { return serverError(res) }
})

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const item = await prisma.equipment.findUnique({ where: { id: req.params.id }, include: { vehicle: true } })
    if (!item) return notFound(res)
    return ok(res, item)
  } catch { return serverError(res) }
})

router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = equipmentSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  try {
    const item = await prisma.equipment.create({ data: parsed.data as never })
    return created(res, item)
  } catch { return serverError(res) }
})

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const parsed = equipmentSchema.partial().safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  try {
    const item = await prisma.equipment.update({ where: { id: req.params.id }, data: parsed.data as never })
    return ok(res, item)
  } catch { return notFound(res) }
})

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.equipment.delete({ where: { id: req.params.id } })
    return noContent(res)
  } catch { return notFound(res) }
})

export default router
