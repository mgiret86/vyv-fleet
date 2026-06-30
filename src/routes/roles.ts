import { Router, type Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth, requireRole } from '../middlewares/auth'
import { ok, created, noContent, badRequest, notFound, serverError } from '../lib/response'
import type { AuthRequest } from '../types'
import { z } from 'zod'

const router = Router()
router.use(requireAuth)

const MODULES = ['dashboard','vehicles','maintenance','compliance','incidents','drivers','fuel','equipment','settings','finance','substitutions','relais'] as const
const ACTIONS = ['view','create','edit','delete'] as const

const roleSchema = z.object({
  name:        z.string().min(2),
  description: z.string().optional(),
  color:       z.string().optional(),
  permissions: z.array(z.object({
    module: z.enum(MODULES),
    action: z.enum(ACTIONS),
  })).optional(),
})

function formatRole(r: { permissions: { module: string; action: string }[] } & Record<string, unknown>) {
  const perms: Record<string, Record<string, boolean>> = {}
  for (const p of r.permissions) {
    if (!perms[p.module]) perms[p.module] = {}
    perms[p.module][p.action] = true
  }
  return { ...r, permissions: perms }
}

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const roles = await prisma.role.findMany({ include: { permissions: true }, orderBy: { name: 'asc' } })
    return ok(res, roles.map(formatRole))
  } catch (e) { console.error(e); return serverError(res) }
})

router.post('/', requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  const parsed = roleSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  try {
    const { permissions, ...data } = parsed.data
    const role = await prisma.role.create({
      data: { ...data, permissions: permissions ? { create: permissions } : undefined },
      include: { permissions: true },
    })
    return created(res, formatRole(role as never))
  } catch (e) { console.error(e); return serverError(res) }
})

router.put('/:id', requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  const parsed = roleSchema.partial().safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  try {
    const existing = await prisma.role.findUnique({ where: { id: req.params.id } })
    if (!existing) return notFound(res)
    if (existing.isSystem) return badRequest(res, 'Les roles systeme ne peuvent pas etre modifies')
    const { permissions, ...data } = parsed.data
    if (permissions !== undefined) {
      await prisma.permission.deleteMany({ where: { roleId: req.params.id } })
      if (permissions.length > 0)
        await prisma.permission.createMany({ data: permissions.map((p) => ({ roleId: req.params.id, module: p.module, action: p.action })) })
    }
    const role = await prisma.role.update({ where: { id: req.params.id }, data, include: { permissions: true } })
    return ok(res, formatRole(role as never))
  } catch (e) { console.error(e); return serverError(res) }
})

router.delete('/:id', requireRole('SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const role = await prisma.role.findUnique({ where: { id: req.params.id } })
    if (!role) return notFound(res)
    if (role.isSystem) return badRequest(res, 'Les roles systeme ne peuvent pas etre supprimes')
    await prisma.role.delete({ where: { id: req.params.id } })
    return noContent(res)
  } catch (e) { console.error(e); return notFound(res) }
})

export default router
