import { Router, type Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middlewares/auth'
import { ok, created, noContent, badRequest, notFound, serverError } from '../lib/response'
import type { AuthRequest } from '../types'

const router = Router()
router.use(requireAuth)

const createSchema = z.object({
  name:    z.string().min(1).max(50).toUpperCase(),
  label:   z.string().min(1).max(100),
  color:   z.string().default('gray'),
  vatRate: z.number().min(0).max(100).default(20),
  order:   z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  isSystem: z.boolean().default(false),
})

const updateSchema = z.object({
  name:    z.string().min(1).max(50).toUpperCase().optional(),
  label:   z.string().min(1).max(100).optional(),
  color:   z.string().optional(),
  vatRate: z.number().min(0).max(100).optional(),
  order:   z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
})

// GET /api/vehicle-categories
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.vehicleCategory.findMany({
      orderBy: [{ order: 'asc' }, { label: 'asc' }],
      include: { _count: { select: { vehicles: true } } },
    })
    return ok(res, categories)
  } catch { return serverError(res) }
})

// POST /api/vehicle-categories
router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  try {
    const category = await prisma.vehicleCategory.create({ data: parsed.data })
    return created(res, category)
  } catch (e: any) {
    if (e?.code === 'P2002') return badRequest(res, 'Une categorie avec ce nom existe deja')
    return serverError(res)
  }
})

// PUT /api/vehicle-categories/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  try {
    const existing = await prisma.vehicleCategory.findUnique({ where: { id: req.params.id } })
    if (!existing) return notFound(res)
    if (existing.isSystem && parsed.data.isActive === false) {
      return badRequest(res, 'Impossible de desactiver une categorie systeme')
    }
    const category = await prisma.vehicleCategory.update({
      where: { id: req.params.id },
      data:  parsed.data,
    })
    return ok(res, category)
  } catch (e: any) {
    if (e?.code === 'P2025') return notFound(res)
    if (e?.code === 'P2002') return badRequest(res, 'Une categorie avec ce nom existe deja')
    return serverError(res)
  }
})

// DELETE /api/vehicle-categories/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.vehicleCategory.findUnique({ where: { id: req.params.id } })
    if (!existing) return notFound(res)
    if (existing.isSystem) return badRequest(res, 'Impossible de supprimer une categorie systeme')
    const count = await prisma.vehicle.count({
      where: { categoryId: req.params.id, deletedAt: null },
    })
    if (count > 0) {
      return badRequest(res, 'Impossible de supprimer : ' + count + ' vehicule(s) utilisent cette categorie')
    }
    await prisma.vehicleCategory.delete({ where: { id: req.params.id } })
    return noContent(res)
  } catch (e: any) {
    if (e?.code === 'P2025') return notFound(res)
    return serverError(res)
  }
})

export default router
