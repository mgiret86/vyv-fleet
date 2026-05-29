import { Router, type Response } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import { requireAuth, requireRole } from '../middlewares/auth'
import { ok, created, noContent, badRequest, notFound, serverError } from '../lib/response'
import type { AuthRequest } from '../types'
import { z } from 'zod'

const router = Router()
router.use(requireAuth)

const userSchema = z.object({
  firstName: z.string().min(2),
  lastName:  z.string().min(2),
  email:     z.string().email(),
  password:  z.string().min(8),
  roleId:    z.string().cuid(),
  agencyIds: z.array(z.string().cuid()).optional(),
  isActive:  z.boolean().optional(),
})

router.get('/', requireRole('SUPER_ADMIN', 'ADMIN'), async (_req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where:   { deletedAt: null },
      include: { role: true, agencies: { include: { agency: true } } },
      orderBy: { lastName: 'asc' },
    })
    return ok(res, users)
  } catch { return serverError(res) }
})

router.post('/', requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  const parsed = userSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  try {
    const { password, agencyIds, ...data } = parsed.data
    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        ...data,
        passwordHash,
        agencies: agencyIds ? {
          create: agencyIds.map((id) => ({ agencyId: id })),
        } : undefined,
      },
    })
    return created(res, user)
  } catch { return serverError(res) }
})

router.put('/:id', requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  const parsed = userSchema.partial().safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  try {
    const { password, agencyIds, ...data } = parsed.data
    const updateData: Record<string, unknown> = { ...data }
    if (password) updateData.passwordHash = await bcrypt.hash(password, 12)

    const [user] = await prisma.$transaction([
      prisma.user.update({ where: { id: req.params.id }, data: updateData }),
      prisma.userAgency.deleteMany({ where: { userId: req.params.id } }),
      ...(agencyIds && agencyIds.length > 0
        ? [prisma.userAgency.createMany({
            data: agencyIds.map((agencyId) => ({ userId: req.params.id, agencyId })),
            skipDuplicates: true,
          })]
        : []
      ),
    ])

    const userWithAgencies = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { role: true, agencies: { include: { agency: true } } },
    })
    return ok(res, userWithAgencies)
  } catch (e) { console.error(e); return notFound(res) }
})

router.delete('/:id', requireRole('SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } })
    return noContent(res)
  } catch { return notFound(res) }
})

export default router
