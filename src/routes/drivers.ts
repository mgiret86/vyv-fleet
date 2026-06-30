import { Router, type Response } from 'express'
import { Prisma } from '@prisma/client'
import { prisma }      from '../lib/prisma'
import { requireAuth } from '../middlewares/auth'
import { ok, created, noContent, badRequest, notFound, serverError } from '../lib/response'
import type { AuthRequest } from '../types'
import { z } from 'zod'

const router = Router()
router.use(requireAuth)

// ─── Helper date ──────────────────────────────────────────────────
function toDate(s: string | null | undefined): Date | null {
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

// ─── Schema Zod ───────────────────────────────────────────────────
const habilitationSchema = z.object({
  id:         z.string().optional(),
  type:       z.string(),
  issuedDate: z.string().nullable().optional(),
  expiryDate: z.string().nullable().optional(),
  status:     z.enum(['VALID','EXPIRED','PENDING']).default('VALID'),
})

const driverSchema = z.object({
  firstName:               z.string().min(2),
  lastName:                z.string().min(2),
  email:                   z.string().email().optional().nullable(),
  phone:                   z.string().optional().nullable(),
  address:                 z.string().optional().nullable(),
  role:                    z.string(),
  agencyId:                z.string(),
  status:                  z.enum(['ACTIVE','SUSPENDED','LEAVE','INACTIVE']).default('ACTIVE'),
  contractType:            z.string().optional().nullable(),
  licenseNumber:           z.string().optional().nullable(),
  licenseExpiry:           z.string().optional().nullable(),
  deaExpiry:               z.string().optional().nullable(),
  fspExpiry:               z.string().optional().nullable(),
  medicalCertificateExpiry: z.string().optional().nullable(),
  medicalExamDate:         z.string().optional().nullable(),
  medicalExamExpiry:       z.string().optional().nullable(),
  nextTrainingDate:        z.string().optional().nullable(),
  totalMileage:            z.number().int().default(0),
  habilitations:           z.array(habilitationSchema).optional(),
})

// ─── Include commun ───────────────────────────────────────────────
const INCLUDE = {
  agency:        true,
  habilitations: true,
  incidents:     {
    include: { incident: true },
  },
} as const

// ─── GET /api/drivers ─────────────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { agencyId, status } = req.query
    const where: Record<string, unknown> = { deletedAt: null }
    if (agencyId) where.agencyId = agencyId
    if (status)   where.status   = status
    const drivers = await prisma.driver.findMany({
      where,
      include:  INCLUDE,
      orderBy:  { lastName: 'asc' },
    })
    return ok(res, drivers.map(formatDriver))
  } catch (e) { console.error('[GET /drivers]', e); return serverError(res) }
})

// ─── GET /api/drivers/:id ─────────────────────────────────────────
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const driver = await prisma.driver.findFirst({
      where:   { id: req.params.id, deletedAt: null },
      include: INCLUDE,
    })
    if (!driver) return notFound(res)
    return ok(res, formatDriver(driver))
  } catch (e) { console.error('[GET /drivers/:id]', e); return serverError(res) }
})

// ─── POST /api/drivers ────────────────────────────────────────────
router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = driverSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  try {
    const { habilitations, ...fields } = parsed.data
    const createData: any = {
      ...buildDriverData(fields),
      ...(habilitations?.length ? {
        habilitations: {
          create: habilitations.map((h) => ({
            type:       h.type,
            issuedDate: toDate(h.issuedDate),
            expiryDate: toDate(h.expiryDate),
            status:     h.status,
          })),
        },
      } : {}),
    }
    const driver = await prisma.driver.create({
      data:    createData,
      include: INCLUDE,
    })
    return created(res, formatDriver(driver))
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')
      return badRequest(res, 'Un conducteur avec cet email existe déjà.')
    console.error('[POST /drivers]', e); return serverError(res)
  }
})

// ─── PUT /api/drivers/:id ─────────────────────────────────────────
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const parsed = driverSchema.partial().safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  try {
    const { habilitations, ...fields } = parsed.data

    // Remplacer les habilitations si fournies
    if (habilitations !== undefined) {
      await prisma.driverHabilitation.deleteMany({ where: { driverId: req.params.id } })
    }

    const { agencyId: _agencyId, ...restFields } = fields as any
    const updateData: any = {
      ...buildDriverData(restFields),
      ...(fields.agencyId ? { agency: { connect: { id: fields.agencyId } } } : {}),
      ...(habilitations !== undefined ? {
        habilitations: {
          create: habilitations.map((h) => ({
            type:       h.type,
            issuedDate: toDate(h.issuedDate),
            expiryDate: toDate(h.expiryDate),
            status:     h.status,
          })),
        },
      } : {}),
    }
    const driver = await prisma.driver.update({
      where:   { id: req.params.id },
      data:    updateData,
      include: INCLUDE,
    })
    return ok(res, formatDriver(driver))
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')
      return badRequest(res, 'Un conducteur avec cet email existe déjà.')
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025')
      return notFound(res)
    console.error('[PUT /drivers/:id]', e); return serverError(res)
  }
})

// ─── DELETE /api/drivers/:id (soft delete) ────────────────────────
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.driver.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } })
    return noContent(res)
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025')
      return notFound(res)
    console.error('[DELETE /drivers/:id]', e); return serverError(res)
  }
})

// ─── Helpers ──────────────────────────────────────────────────────
function buildDriverData(fields: Partial<z.infer<typeof driverSchema>>) {
  return {
    ...fields,
    licenseExpiry:            toDate(fields.licenseExpiry),
    deaExpiry:                toDate(fields.deaExpiry),
    fspExpiry:                toDate(fields.fspExpiry),
    medicalCertificateExpiry: toDate(fields.medicalCertificateExpiry),
    medicalExamDate:          toDate(fields.medicalExamDate),
    medicalExamExpiry:        toDate(fields.medicalExamExpiry),
    nextTrainingDate:         toDate(fields.nextTrainingDate),
  }
}

// Normalise la réponse Prisma pour coller au type Driver du frontend
function formatDriver(d: any) {
  const incidents = (d.incidents ?? []).map((di: any) => ({
    id:          di.incident?.id   ?? di.id,
    date:        di.incident?.date ?? di.date,
    type:        di.incident?.type ?? di.type,
    description: di.incident?.description ?? di.description,
    severity:    di.incident?.severity    ?? di.severity,
  }))

  return {
    id:                      d.id,
    firstName:               d.firstName,
    lastName:                d.lastName,
    email:                   d.email        ?? '',
    phone:                   d.phone        ?? '',
    address:                 d.address      ?? '',
    agencyId:                d.agencyId,
    agencyName:              d.agency?.name ?? '',
    role:                    d.role,
    status:                  d.status,
    contractType:            d.contractType ?? 'CDI',
    licenseNumber:           d.licenseNumber           ?? '',
    licenseExpiry:           d.licenseExpiry?.toISOString()            ?? '',
    deaExpiry:               d.deaExpiry?.toISOString()                ?? null,
    fspExpiry:               d.fspExpiry?.toISOString()                ?? null,
    medicalCertificateExpiry: d.medicalCertificateExpiry?.toISOString() ?? null,
    medicalExamDate:         d.medicalExamDate?.toISOString()          ?? '',
    medicalExamExpiry:       d.medicalExamExpiry?.toISOString()        ?? '',
    nextTrainingDate:        d.nextTrainingDate?.toISOString()         ?? null,
    totalMileage:            d.totalMileage ?? 0,
    incidentsCount:          incidents.length,
    incidents,
    habilitations: (d.habilitations ?? []).map((h: any) => ({
      id:         h.id,
      type:       h.type,
      issuedDate: h.issuedDate?.toISOString() ?? '',
      expiryDate: h.expiryDate?.toISOString() ?? '',
      status:     h.status,
    })),
  }
}

export default router
