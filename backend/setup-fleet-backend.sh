#!/bin/bash
# =============================================================
# VYV Fleet Manager — Setup Backend Express
# À exécuter depuis ~/fleet-backend
# =============================================================

set -e
echo "🚀 Création de la structure du backend VYV Fleet..."

# ── Dossiers ──────────────────────────────────────────────────
mkdir -p src/lib
mkdir -p src/middlewares
mkdir -p src/routes
mkdir -p src/controllers
mkdir -p src/types

echo "📁 Dossiers créés"

# ── package.json ──────────────────────────────────────────────
cat > package.json << 'EOF'
{
  "name": "fleet-backend",
  "version": "1.0.0",
  "description": "VYV Fleet Manager — API Backend",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "migrate": "dotenv -e .env -- npx prisma migrate dev",
    "generate": "prisma generate",
    "seed": "tsx prisma/seed.ts",
    "studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/adapter-pg": "^7.0.0",
    "@prisma/client": "^7.0.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.18.2",
    "express-rate-limit": "^7.2.0",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.11.5",
    "prisma": "^7.0.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/node": "^20.12.7",
    "dotenv-cli": "^7.4.1",
    "tsx": "^4.7.3",
    "typescript": "^5.4.5"
  }
}
EOF
echo "✅ package.json"

# ── tsconfig.json ─────────────────────────────────────────────
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF
echo "✅ tsconfig.json"

# ── .env.example ──────────────────────────────────────────────
cat > .env.example << 'EOF'
# Base de données
DATABASE_URL='postgresql://fleet_user:MOT_DE_PASSE@localhost:5432/fleet_db'

# JWT
JWT_SECRET='changez_cette_valeur_en_production_minimum_32_caracteres'
JWT_EXPIRES_IN='15m'
JWT_REFRESH_SECRET='changez_aussi_cette_valeur_minimum_32_caracteres'
JWT_REFRESH_EXPIRES_IN='7d'

# Serveur
PORT=3001
NODE_ENV=production
CORS_ORIGIN='https://fleet.harmonie-ambulance.fr'
EOF
echo "✅ .env.example"

# ── src/types/index.ts ────────────────────────────────────────
cat > src/types/index.ts << 'EOF'
import type { Request } from 'express'

// Payload JWT
export interface JWTPayload {
  userId:    string
  roleId:    string
  roleName:  string
  agencyIds: string[]
  iat?:      number
  exp?:      number
}

// Request authentifiée (user injecté par le middleware)
export interface AuthRequest extends Request {
  user?: JWTPayload
}

// Réponse API standard
export interface ApiResponse<T = unknown> {
  success: boolean
  data?:   T
  error?:  string
  message?: string
}

// Paramètres de pagination
export interface PaginationParams {
  page:  number
  limit: number
  skip:  number
}
EOF
echo "✅ src/types/index.ts"

# ── src/lib/prisma.ts ─────────────────────────────────────────
cat > src/lib/prisma.ts << 'EOF'
import { PrismaClient } from '@prisma/client'

// Singleton Prisma Client — une seule instance partagée
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
EOF
echo "✅ src/lib/prisma.ts"

# ── src/lib/jwt.ts ────────────────────────────────────────────
cat > src/lib/jwt.ts << 'EOF'
import jwt from 'jsonwebtoken'
import type { JWTPayload } from '../types'

const JWT_SECRET         = process.env.JWT_SECRET!
const JWT_EXPIRES_IN     = process.env.JWT_EXPIRES_IN     ?? '15m'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d'

export function signAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions)
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions)
}

export function verifyAccessToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string }
}
EOF
echo "✅ src/lib/jwt.ts"

# ── src/lib/response.ts ───────────────────────────────────────
cat > src/lib/response.ts << 'EOF'
import type { Response } from 'express'
import type { ApiResponse } from '../types'

export function ok<T>(res: Response, data: T, message?: string) {
  const body: ApiResponse<T> = { success: true, data }
  if (message) body.message = message
  return res.status(200).json(body)
}

export function created<T>(res: Response, data: T) {
  return res.status(201).json({ success: true, data })
}

export function noContent(res: Response) {
  return res.status(204).send()
}

export function badRequest(res: Response, error: string) {
  return res.status(400).json({ success: false, error })
}

export function unauthorized(res: Response, error = 'Non authentifié') {
  return res.status(401).json({ success: false, error })
}

export function forbidden(res: Response, error = 'Accès refusé') {
  return res.status(403).json({ success: false, error })
}

export function notFound(res: Response, error = 'Ressource introuvable') {
  return res.status(404).json({ success: false, error })
}

export function serverError(res: Response, error = 'Erreur interne') {
  return res.status(500).json({ success: false, error })
}
EOF
echo "✅ src/lib/response.ts"

# ── src/middlewares/auth.ts ───────────────────────────────────
cat > src/middlewares/auth.ts << 'EOF'
import type { Response, NextFunction } from 'express'
import { verifyAccessToken } from '../lib/jwt'
import { unauthorized } from '../lib/response'
import type { AuthRequest } from '../types'

// Middleware : vérifie le JWT et injecte user dans req
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return unauthorized(res)
  }
  const token = authHeader.slice(7)
  try {
    req.user = verifyAccessToken(token)
    return next()
  } catch {
    return unauthorized(res, 'Token invalide ou expiré')
  }
}

// Middleware : restreint à certains rôles
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.roleName)) {
      return unauthorized(res, 'Droits insuffisants')
    }
    return next()
  }
}
EOF
echo "✅ src/middlewares/auth.ts"

# ── src/middlewares/pagination.ts ────────────────────────────
cat > src/middlewares/pagination.ts << 'EOF'
import type { Response, NextFunction } from 'express'
import type { AuthRequest, PaginationParams } from '../types'

// Injecte page/limit/skip dans req pour tous les GET list
export function paginate(req: AuthRequest & { pagination?: PaginationParams }, _res: Response, next: NextFunction) {
  const page  = Math.max(1, parseInt(req.query.page  as string) || 1)
  const limit = Math.min(100, parseInt(req.query.limit as string) || 20)
  req.pagination = { page, limit, skip: (page - 1) * limit }
  next()
}
EOF
echo "✅ src/middlewares/pagination.ts"

# ── src/routes/auth.ts ────────────────────────────────────────
cat > src/routes/auth.ts << 'EOF'
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
        id:        user.id,
        firstName: user.firstName,
        lastName:  user.lastName,
        email:     user.email,
        role:      user.role.name,
        agencyIds,
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
EOF
echo "✅ src/routes/auth.ts"

# ── src/routes/vehicles.ts ────────────────────────────────────
cat > src/routes/vehicles.ts << 'EOF'
import { Router, type Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middlewares/auth'
import { ok, created, noContent, badRequest, notFound, serverError } from '../lib/response'
import type { AuthRequest } from '../types'
import { z } from 'zod'

const router = Router()
router.use(requireAuth)

const vehicleSchema = z.object({
  registration:              z.string().regex(/^[A-Z]{2}-[0-9]{3}-[A-Z]{2}$/),
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
EOF
echo "✅ src/routes/vehicles.ts"

# ── src/routes/drivers.ts ─────────────────────────────────────
cat > src/routes/drivers.ts << 'EOF'
import { Router, type Response } from 'express'
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
  } catch { return serverError(res) }
})

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const driver = await prisma.driver.findFirst({ where: { id: req.params.id, deletedAt: null }, include: { agency: true } })
    if (!driver) return notFound(res)
    return ok(res, driver)
  } catch { return serverError(res) }
})

router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = driverSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  try {
    const driver = await prisma.driver.create({ data: parsed.data as never })
    return created(res, driver)
  } catch { return serverError(res) }
})

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const parsed = driverSchema.partial().safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  try {
    const driver = await prisma.driver.update({ where: { id: req.params.id }, data: parsed.data as never })
    return ok(res, driver)
  } catch { return notFound(res) }
})

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.driver.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } })
    return noContent(res)
  } catch { return notFound(res) }
})

export default router
EOF
echo "✅ src/routes/drivers.ts"

# ── src/routes/maintenance.ts ─────────────────────────────────
cat > src/routes/maintenance.ts << 'EOF'
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
    const m = await prisma.maintenance.create({ data: parsed.data as never })
    return created(res, m)
  } catch { return serverError(res) }
})

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const parsed = maintenanceSchema.partial().safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  try {
    const m = await prisma.maintenance.update({ where: { id: req.params.id }, data: parsed.data as never })
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
EOF
echo "✅ src/routes/maintenance.ts"

# ── src/routes/incidents.ts ───────────────────────────────────
cat > src/routes/incidents.ts << 'EOF'
import { Router, type Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middlewares/auth'
import { ok, created, noContent, badRequest, notFound, serverError } from '../lib/response'
import type { AuthRequest } from '../types'
import { z } from 'zod'

const router = Router()
router.use(requireAuth)

const incidentSchema = z.object({
  vehicleId:          z.string().cuid(),
  agencyId:           z.string().cuid(),
  date:               z.string().datetime(),
  declarationDate:    z.string().datetime(),
  type:               z.enum(['ACCIDENT','THEFT','VANDALISM','BREAKDOWN']),
  severity:           z.enum(['CRITICAL','MAJOR','MINOR']),
  status:             z.enum(['OPEN','IN_PROGRESS','CLOSED']).optional(),
  description:        z.string().min(5),
  location:           z.string().min(2),
  driverResponsible:  z.boolean().optional(),
  injuredPersons:     z.number().int().min(0).optional(),
  patientInVehicle:   z.boolean().optional(),
  thirdPartyInvolved: z.boolean().optional(),
  thirdPartyInsurance: z.string().optional(),
  insuranceReference: z.string().optional(),
  estimatedRepairCost: z.number().nullable().optional(),
  realRepairCost:     z.number().nullable().optional(),
  immobilizationDays: z.number().int().optional(),
  repairProvider:     z.string().optional(),
  notes:              z.string().optional(),
})

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { agencyId, vehicleId, status, severity } = req.query
    const where: Record<string, unknown> = {}
    if (agencyId)  where.agencyId  = agencyId
    if (vehicleId) where.vehicleId = vehicleId
    if (status)    where.status    = status
    if (severity)  where.severity  = severity
    const incidents = await prisma.incident.findMany({
      where, include: { vehicle: true, agency: true, drivers: { include: { driver: true } } },
      orderBy: { date: 'desc' },
    })
    return ok(res, incidents)
  } catch { return serverError(res) }
})

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const incident = await prisma.incident.findUnique({
      where: { id: req.params.id },
      include: { vehicle: true, agency: true, drivers: { include: { driver: true } } },
    })
    if (!incident) return notFound(res)
    return ok(res, incident)
  } catch { return serverError(res) }
})

router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = incidentSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  try {
    const incident = await prisma.incident.create({ data: parsed.data as never })
    return created(res, incident)
  } catch { return serverError(res) }
})

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const parsed = incidentSchema.partial().safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  try {
    const incident = await prisma.incident.update({ where: { id: req.params.id }, data: parsed.data as never })
    return ok(res, incident)
  } catch { return notFound(res) }
})

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.incident.delete({ where: { id: req.params.id } })
    return noContent(res)
  } catch { return notFound(res) }
})

export default router
EOF
echo "✅ src/routes/incidents.ts"

# ── src/routes/equipment.ts ───────────────────────────────────
cat > src/routes/equipment.ts << 'EOF'
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
  serialNumber:        z.string().optional(),
  status:              z.enum(['OK','WARNING','CRITICAL','OUT_OF_SERVICE']).optional(),
  installDate:         z.string().datetime().nullable().optional(),
  lastCheckDate:       z.string().datetime().nullable().optional(),
  nextCheckDate:       z.string().datetime().nullable().optional(),
  expiryDate:          z.string().datetime().nullable().optional(),
  maintenanceProvider: z.string().optional(),
  notes:               z.string().optional(),
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
EOF
echo "✅ src/routes/equipment.ts"

# ── src/routes/fuel.ts ────────────────────────────────────────
cat > src/routes/fuel.ts << 'EOF'
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
  date:             z.string().datetime(),
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
EOF
echo "✅ src/routes/fuel.ts"

# ── src/routes/alerts.ts ──────────────────────────────────────
cat > src/routes/alerts.ts << 'EOF'
import { Router, type Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middlewares/auth'
import { ok, created, badRequest, notFound, serverError } from '../lib/response'
import type { AuthRequest } from '../types'
import { z } from 'zod'

const router = Router()
router.use(requireAuth)

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { agencyId, vehicleId, status, severity, category } = req.query
    const where: Record<string, unknown> = {}
    if (agencyId)  where.agencyId  = agencyId
    if (vehicleId) where.vehicleId = vehicleId
    if (status)    where.status    = status
    if (severity)  where.severity  = severity
    if (category)  where.category  = category
    const alerts = await prisma.alert.findMany({
      where, include: { vehicle: true, agency: true }, orderBy: { createdAt: 'desc' },
    })
    return ok(res, alerts)
  } catch { return serverError(res) }
})

router.put('/:id/resolve', async (req: AuthRequest, res: Response) => {
  try {
    const alert = await prisma.alert.update({
      where: { id: req.params.id },
      data:  { status: 'RESOLVED', resolvedAt: new Date(), resolvedBy: req.user!.userId },
    })
    return ok(res, alert)
  } catch { return notFound(res) }
})

export default router
EOF
echo "✅ src/routes/alerts.ts"

# ── src/routes/agencies.ts ────────────────────────────────────
cat > src/routes/agencies.ts << 'EOF'
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
  zipCode:  z.string().length(5),
  phone:    z.string().optional(),
  email:    z.string().email().optional(),
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

export default router
EOF
echo "✅ src/routes/agencies.ts"

# ── src/routes/users.ts ───────────────────────────────────────
cat > src/routes/users.ts << 'EOF'
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
    const user = await prisma.user.update({ where: { id: req.params.id }, data: updateData })
    return ok(res, user)
  } catch { return notFound(res) }
})

router.delete('/:id', requireRole('SUPER_ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } })
    return noContent(res)
  } catch { return notFound(res) }
})

export default router
EOF
echo "✅ src/routes/users.ts"

# ── src/index.ts ──────────────────────────────────────────────
cat > src/index.ts << 'EOF'
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

// Routes
import authRouter       from './routes/auth'
import vehiclesRouter   from './routes/vehicles'
import driversRouter    from './routes/drivers'
import maintenanceRouter from './routes/maintenance'
import incidentsRouter  from './routes/incidents'
import equipmentRouter  from './routes/equipment'
import fuelRouter       from './routes/fuel'
import alertsRouter     from './routes/alerts'
import agenciesRouter   from './routes/agencies'
import usersRouter      from './routes/users'

const app  = express()
const PORT = process.env.PORT ?? 3001

// ── Sécurité ──────────────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin:      process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  credentials: true,
}))
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max:      200,
  message:  { success: false, error: 'Trop de requêtes, réessayez plus tard.' },
}))
app.use(express.json())

// ── Health check ──────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date() }))

// ── Routes API ────────────────────────────────────────────────
app.use('/api/auth',        authRouter)
app.use('/api/vehicles',    vehiclesRouter)
app.use('/api/drivers',     driversRouter)
app.use('/api/maintenance', maintenanceRouter)
app.use('/api/incidents',   incidentsRouter)
app.use('/api/equipment',   equipmentRouter)
app.use('/api/fuel',        fuelRouter)
app.use('/api/alerts',      alertsRouter)
app.use('/api/agencies',    agenciesRouter)
app.use('/api/users',       usersRouter)

// ── 404 ───────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, error: 'Route introuvable' }))

// ── Démarrage ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Fleet API démarrée sur le port ${PORT}`)
  console.log(`   Environnement : ${process.env.NODE_ENV ?? 'development'}`)
})

export default app
EOF
echo "✅ src/index.ts"

# ── prisma/seed.ts ────────────────────────────────────────────
cat > prisma/seed.ts << 'EOF'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding base de données...')

  // Agence par défaut
  const agency = await prisma.agency.upsert({
    where:  { code: 'VIENNE-86' },
    update: {},
    create: {
      name:    'Harmonie Ambulance Vienne',
      code:    'VIENNE-86',
      address: '1 Rue de la Santé',
      city:    'Poitiers',
      zipCode: '86000',
      phone:   '05 49 00 00 00',
      email:   'vienne@harmonie-ambulance.fr',
    },
  })
  console.log(`✅ Agence : ${agency.name}`)

  // Rôle Super Admin
  const adminRole = await prisma.role.upsert({
    where:  { name: 'SUPER_ADMIN' },
    update: {},
    create: {
      name:        'SUPER_ADMIN',
      description: 'Accès complet à toutes les fonctionnalités',
      isSystem:    true,
      color:       'red',
    },
  })
  console.log(`✅ Rôle : ${adminRole.name}`)

  // Utilisateur admin par défaut
  const passwordHash = await bcrypt.hash('Admin2024!', 12)
  const admin = await prisma.user.upsert({
    where:  { email: 'admin@harmonie-ambulance.fr' },
    update: {},
    create: {
      firstName:    'Mickael',
      lastName:     'Giret',
      email:        'admin@harmonie-ambulance.fr',
      passwordHash,
      roleId:       adminRole.id,
      agencies: {
        create: [{ agencyId: agency.id }],
      },
    },
  })
  console.log(`✅ Utilisateur admin : ${admin.email}`)
  console.log(`   Mot de passe par défaut : Admin2024! (à changer immédiatement)`)

  console.log('\n🎉 Seed terminé avec succès !')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
EOF
echo "✅ prisma/seed.ts"

echo ""
echo "════════════════════════════════════════════════════════"
echo "✅ Structure backend créée avec succès !"
echo ""
echo "Prochaines étapes :"
echo "  1. npm install"
echo "  2. npm run generate"
echo "  3. npm run seed"
echo "  4. npm run dev"
echo "════════════════════════════════════════════════════════"
