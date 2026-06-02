import { Router, type Response } from 'express'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middlewares/auth'
import { ok, created, noContent, badRequest, notFound, serverError } from '../lib/response'
import type { AuthRequest } from '../types'
import { z } from 'zod'

const router = Router()
router.use(requireAuth)

const driverSchema = z.object({
  firstName:         z.string().min(2),
  lastName:          z.string().min(2),
  email:             z.string().email().optional(),
  phone:             z.string().optional(),
  role:              z.string(),
  agencyId:          z.string().cuid(),
  status:            z.enum(['ACTIVE','SUSPENDED','LEAVE','INACTIVE']).optional(),
  licenseNumber:     z.string().optional(),
  licenseExpiry:     z.string().datetime().nullable().optional(),
  medicalExamDate:   z.string().datetime().nullable().optional(),
  medicalExamExpiry: z.string().datetime().nullable().optional(),
})

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { agencyId, status } = req.query
    const where: Record<string, unknown> = { deletedAt: null }
    if (agencyId) where.agencyId = agencyId
    if (status)   where.status   = status
    const drivers = await prisma.driver.findMany({ where, include: { agency: true }, orderBy: { lastName: 'asc' } })
    return ok(res, drivers)
  } catch (e) {
    console.error('[GET /drivers]', e)
    return serverError(res)
  }
})

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const driver = await prisma.driver.findFirst({ where: { id: req.params.id, deletedAt: null }, include: { agency: true } })
    if (!driver) return notFound(res)
    return ok(res, driver)
  } catch (e) {
    console.error('[GET /drivers/:id]', e)
    return serverError(res)
  }
})

router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = driverSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  try {
    const driver = await prisma.driver.create({ data: parsed.data as never })
    return created(res, driver)
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return badRequest(res, 'Un conducteur avec cet email existe deja. Utilisez un email different.')
    }
    console.error('[POST /drivers]', e)
    return serverError(res)
  }
})

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const parsed = driverSchema.partial().safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  try {
    const driver = await prisma.driver.update({ where: { id: req.params.id }, data: parsed.data as never })
    return ok(res, driver)
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return badRequest(res, 'Un conducteur avec cet email existe deja. Utilisez un email different.')
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return notFound(res)
    }
    console.error('[PUT /drivers/:id]', e)
    return serverError(res)
  }
})

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.driver.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } })
    return noContent(res)
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return notFound(res)
    }
    console.error('[DELETE /drivers/:id]', e)
    return serverError(res)
  }
})

export default router
