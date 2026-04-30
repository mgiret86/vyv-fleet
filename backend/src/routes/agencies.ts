import { Router, type Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middlewares/auth'
import { ok, created, badRequest, notFound, serverError } from '../lib/response'
import type { AuthRequest } from '../types'
import { z } from 'zod'

const router = Router()
router.use(requireAuth)

const agencySchema = z.object({
  name:     z.string().min(2),
  code:     z.string().min(2),
  address:  z.string(),
  city:     z.string(),
  zipCode:  z.string().min(5),
  phone:    z.string().optional(),
  email:    z.string().email().optional().or(z.literal("")).optional(),
  isActive: z.boolean().optional(),
})

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const agencies = await prisma.agency.findMany({ orderBy: { name: 'asc' } })
    return ok(res, agencies)
  } catch { return serverError(res) }
})

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const agency = await prisma.agency.findUnique({
      where: { id: req.params.id },
      include: {
        vehicles:         { where: { deletedAt: null } },
        drivers:          { where: { deletedAt: null } },
        complianceScores: { orderBy: { calculatedAt: 'desc' }, take: 1 },
      },
    })
    if (!agency) return notFound(res)
    return ok(res, agency)
  } catch { return serverError(res) }
})

router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = agencySchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  try {
    const agency = await prisma.agency.create({ data: parsed.data })
    return created(res, agency)
  } catch { return serverError(res) }
})

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const parsed = agencySchema.partial().safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  try {
    const agency = await prisma.agency.update({ where: { id: req.params.id }, data: parsed.data })
    return ok(res, agency)
  } catch { return notFound(res) }
})

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const [vehicles, drivers] = await Promise.all([
      prisma.vehicle.count({ where: { agencyId: req.params.id, deletedAt: null } }),
      prisma.driver.count({  where: { agencyId: req.params.id, deletedAt: null } }),
    ])
    if (vehicles > 0)
      return badRequest(res, `Impossible de supprimer : ${vehicles} véhicule(s) rattaché(s) à cette agence.`)
    if (drivers > 0)
      return badRequest(res, `Impossible de supprimer : ${drivers} conducteur(s) rattaché(s) à cette agence.`)
    await prisma.agency.delete({ where: { id: req.params.id } })
    return ok(res, { deleted: true })
  } catch { return notFound(res) }
})

export default router
