import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt'
import { ok, badRequest, unauthorized, serverError } from '../lib/response'
import { requireAuth } from '../middlewares/auth'
import type { AuthRequest } from '../types'
import { z } from 'zod'

const router = Router()

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, 'Email ou mot de passe invalide')

  const { email, password } = parsed.data
  try {
    const user = await prisma.user.findFirst({
      where:   { email, deletedAt: null, isActive: true },
      include: {
        role:     { include: { permissions: true } },
        agencies: { include: { agency: true } },
      },
    })
    if (!user) return unauthorized(res, 'Identifiants incorrects')

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return unauthorized(res, 'Identifiants incorrects')

    const agencyIds = user.agencies.map((ua) => ua.agencyId)

    const accessToken  = signAccessToken({
      userId:    user.id,
      roleId:    user.roleId,
      roleName:  user.role.name,
      agencyIds,
    })
    const refreshToken = signRefreshToken(user.id)

    // Sauvegarder le refresh token
    await prisma.refreshToken.create({
      data: {
        token:     refreshToken,
        userId:    user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    // Mettre à jour lastLogin
    await prisma.user.update({
      where: { id: user.id },
      data:  { lastLogin: new Date() },
    })

    return ok(res, {
      accessToken,
      refreshToken,
      user: {
        id:          user.id,
        firstName:   user.firstName,
        lastName:    user.lastName,
        email:       user.email,
        role:        user.role.name,
        agencyIds,
        permissions: user.role.permissions.map((p) => ({
          module: p.module,
          action: p.action,
        })),
      },
    })
  } catch (e) {
    console.error(e)
    return serverError(res)
  }
})

// POST /api/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body
  if (!refreshToken) return unauthorized(res)
  try {
    const { userId } = verifyRefreshToken(refreshToken)
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } })
    if (!stored || stored.expiresAt < new Date()) return unauthorized(res, 'Token expiré')

    const user = await prisma.user.findUnique({
      where:   { id: userId },
      include: {
        role:     true,
        agencies: true,
      },
    })
    if (!user || !user.isActive) return unauthorized(res)

    const agencyIds   = user.agencies.map((ua) => ua.agencyId)
    const accessToken = signAccessToken({
      userId:   user.id,
      roleId:   user.roleId,
      roleName: user.role.name,
      agencyIds,
    })
    return ok(res, { accessToken })
  } catch {
    return unauthorized(res, 'Token invalide')
  }
})

// POST /api/auth/logout
router.post('/logout', requireAuth, async (req: AuthRequest, res: Response) => {
  const { refreshToken } = req.body
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
  }
  return ok(res, null, 'Déconnecté')
})

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where:   { id: req.user!.userId },
      include: {
        role:     { include: { permissions: true } },
        agencies: { include: { agency: true } },
      },
    })
    if (!user) return unauthorized(res)
    return ok(res, user)
  } catch {
    return serverError(res)
  }
})

export default router
