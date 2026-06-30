import { Router, type Response } from 'express'
import { prisma }      from '../lib/prisma'
import { requireAuth } from '../middlewares/auth'
import { ok, created, noContent, badRequest, notFound, serverError } from '../lib/response'
import type { AuthRequest } from '../types'
import { z } from 'zod'

const router = Router()
router.use(requireAuth)

// ─── Schema Zod ───────────────────────────────────────────────────
const includedServicesSchema = z.object({
  maintenance: z.boolean().default(false),
  tires:       z.boolean().default(false),
  insurance:   z.boolean().default(false),
  assistance:  z.boolean().default(false),
})

const contractSchema = z.object({
  vehicleId:            z.string(),
  type:                 z.enum(['CREDIT_BAIL','LOA','LLD','CREDIT_BANCAIRE','EN_PROPRIETE']),
  status:               z.enum(['DRAFT','ACTIVE','EXPIRED','TERMINATED']).default('ACTIVE'),
  isActive:             z.boolean().default(true),
  lessorName:           z.string().default(''),
  contractRef:          z.string().default(''),
  startDate:            z.string(),
  endDate:              z.string().nullable().optional(),
  durationMonths:       z.number().int().default(0),
  monthlyRentHT:        z.number().default(0),
  deposit:              z.number().default(0),
  residualValue:        z.number().nullable().optional(),
  startMileage:         z.number().int().nullable().optional(),
  contractedKmPerYear:  z.number().int().nullable().optional(),
  contractedKmTotal:    z.number().int().nullable().optional(),
  excessKmCostPerKm:    z.number().nullable().optional(),
  monthlyInsuranceCost: z.number().nullable().optional(),
  includedServices:     includedServicesSchema.default({}),
  notes:                z.string().nullable().optional(),
})

// ─── Helper : convertit une chaîne date en DateTime Prisma-compatible ──
function toDate(s: string | null | undefined): Date | null {
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

// ─── GET /api/vehicle-contracts ───────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { vehicleId, agencyId, status, isActive } = req.query
    const where: Record<string, unknown> = {}
    if (vehicleId)          where.vehicleId = vehicleId
    if (status)             where.status    = status
    if (isActive !== undefined) where.isActive = isActive === 'true'
    if (agencyId)           where.vehicle   = { agencyId }

    const contracts = await prisma.vehicleContract.findMany({
      where,
      include: { vehicle: { include: { agency: true } } },
      orderBy: { startDate: 'desc' },
    })
    return ok(res, contracts)
  } catch (e) { console.error(e); return serverError(res) }
})

// ─── GET /api/vehicle-contracts/:id ──────────────────────────────
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const contract = await prisma.vehicleContract.findUnique({
      where:   { id: req.params.id },
      include: { vehicle: { include: { agency: true } } },
    })
    if (!contract) return notFound(res)
    const amortizations = await prisma.amortization.findMany({
      where:   { vehicleId: contract.vehicleId },
      orderBy: { startDate: 'desc' },
    })
    return ok(res, { ...contract, amortizations })
  } catch (e) { console.error(e); return serverError(res) }
})

// ─── POST /api/vehicle-contracts ─────────────────────────────────
router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = contractSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  try {
    const data = parsed.data

    // Calcul automatique du km total si non fourni
    if (!data.contractedKmTotal && data.contractedKmPerYear && data.durationMonths) {
      data.contractedKmTotal = Math.round(data.contractedKmPerYear * data.durationMonths / 12)
    }

    // Si nouveau contrat ACTIVE, désactiver l'ancien contrat actif du véhicule
    if (data.status === 'ACTIVE' && data.isActive) {
      await prisma.vehicleContract.updateMany({
        where: { vehicleId: data.vehicleId, isActive: true },
        data:  { isActive: false },
      })
    }

    const contract = await prisma.vehicleContract.create({
      data: {
        ...data,
        startDate: toDate(data.startDate)!,
        endDate:   toDate(data.endDate),
      } as never,
      include: { vehicle: { include: { agency: true } } },
    })
    return created(res, contract)
  } catch (e) { console.error(e); return serverError(res) }
})

// ─── PUT /api/vehicle-contracts/:id ──────────────────────────────
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const parsed = contractSchema.partial().safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  try {
    const data = parsed.data

    // Recalcul km total si km/an ou durée changés
    if (data.contractedKmPerYear !== undefined || data.durationMonths !== undefined) {
      const existing = await prisma.vehicleContract.findUnique({ where: { id: req.params.id } })
      if (existing) {
        const kmPerYear = data.contractedKmPerYear ?? existing.contractedKmPerYear
        const duration  = data.durationMonths      ?? existing.durationMonths
        if (kmPerYear && duration) {
          data.contractedKmTotal = Math.round(kmPerYear * duration / 12)
        }
      }
    }

    const contract = await prisma.vehicleContract.update({
      where: { id: req.params.id },
      data:  {
        ...data,
        ...(data.startDate ? { startDate: toDate(data.startDate)! } : {}),
        ...(data.endDate   !== undefined ? { endDate: toDate(data.endDate) } : {}),
      } as never,
      include: { vehicle: { include: { agency: true } } },
    })
    return ok(res, contract)
  } catch (e) { console.error(e); return serverError(res) }
})

// ─── PUT /api/vehicle-contracts/:id/terminate ────────────────────
router.put('/:id/terminate', async (req: AuthRequest, res: Response) => {
  try {
    const contract = await prisma.vehicleContract.update({
      where: { id: req.params.id },
      data:  { status: 'TERMINATED', isActive: false },
    })
    return ok(res, contract)
  } catch (e) { console.error(e); return serverError(res) }
})

// ─── DELETE /api/vehicle-contracts/:id ───────────────────────────
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.vehicleContract.delete({ where: { id: req.params.id } })
    return noContent(res)
  } catch (e) { console.error(e); return serverError(res) }
})

export default router
