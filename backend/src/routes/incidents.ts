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
    const incident = await prisma.incident.create({ data: parsed.data as never, include: { vehicle: true, agency: true } })
    return created(res, incident)
  } catch { return serverError(res) }
})

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const parsed = incidentSchema.partial().safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  try {
    const incident = await prisma.incident.update({ where: { id: req.params.id }, data: parsed.data as never, include: { vehicle: true, agency: true } })
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
