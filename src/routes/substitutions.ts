import { Router, type Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middlewares/auth'
import { ok, created, noContent, badRequest, notFound, serverError } from '../lib/response'
import type { AuthRequest } from '../types'
import { z } from 'zod'

const router = Router()
router.use(requireAuth)

const substitutionSchema = z.object({
  effectiveDate:            z.string().datetime(),

  // Entrant
  incomingVehicleId:        z.string().cuid(),
  incomingAgencyId:         z.string().cuid(),
  incomingAlias:            z.string().optional(),
  incomingVehicleType:      z.enum(['AMBULANCE','VSL','TAXI','TPMR','TRANSPORT_PERSONNES']),
  incomingTaxiConventionAM: z.boolean().optional().default(false),

  axaNotified:              z.boolean().optional().default(false),
  arsDeclaration:           z.boolean().optional().default(false),
  amsReceived:              z.boolean().optional().default(false),
  adsDeclaration:           z.boolean().optional().default(false),
  adsNumber:                z.string().optional(),
  adsMunicipality:          z.string().optional(),

  // Sortant
  outgoingVehicleId:        z.string().cuid(),
  outgoingAlias:            z.string().optional(),
  outgoingVehicleType:      z.enum(['AMBULANCE','VSL','TAXI','TPMR','TRANSPORT_PERSONNES']),
  outgoingMileage:          z.number().int().min(0),

  // Equipements sortant (source de verite)
  hasFuelCard:              z.boolean().optional().default(false),
  dkvReplacement:           z.boolean().optional().default(false),
  tollDevice:               z.boolean().optional().default(false),
  tollDeviceNumber:         z.string().optional(),
  geolocDevice:             z.boolean().optional().default(false),
  geolocImei:               z.string().optional(),
  pdaDevice:                z.boolean().optional().default(false),
  pdaImei:                  z.string().optional(),

  // Transferts vers entrant (optionnels)
  incomingFuelCard:         z.boolean().optional().default(false),
  incomingDkv:              z.boolean().optional().default(false),
  incomingTollDevice:       z.boolean().optional().default(false),
  incomingGeolocDevice:     z.boolean().optional().default(false),
  incomingGeolocImei:       z.string().optional(),
  incomingPdaDevice:        z.boolean().optional().default(false),
  incomingPdaImei:          z.string().optional(),

  returnReportByEmail:      z.boolean().optional().default(false),
  returnReportDate:         z.string().datetime().optional(),
  bodyCondition:            z.string().optional(),
  sanitaryCellCondition:    z.string().optional(),
  interiorCondition:        z.string().optional(),
  mechanicalCondition:      z.string().optional(),
  additionalCosts:          z.string().optional(),
  isDriveable:              z.boolean().optional().default(true),
  vehicleLocation:          z.string().optional(),

  status:                   z.enum(['DRAFT','COMPLETED','CANCELLED']).optional(),
  notes:                    z.string().optional(),
})

const INCLUDE = {
  incomingVehicle: { include: { agency: true } },
  outgoingVehicle: { include: { agency: true } },
  incomingAgency:  true,
  createdBy:       { select: { id: true, firstName: true, lastName: true } },
}

async function validateBothVehicles(
  incomingId: string,
  outgoingId: string,
  res: Response
): Promise<boolean> {
  if (incomingId === outgoingId) {
    badRequest(res, 'Le véhicule entrant et le véhicule sortant ne peuvent pas être identiques.')
    return false
  }
  const [incoming, outgoing] = await Promise.all([
    prisma.vehicle.findFirst({ where: { id: incomingId, deletedAt: null } }),
    prisma.vehicle.findFirst({ where: { id: outgoingId, deletedAt: null } }),
  ])
  if (!incoming) {
    badRequest(res, `Véhicule entrant introuvable en base de données (id: ${incomingId}).`)
    return false
  }
  if (!outgoing) {
    badRequest(res, `Véhicule sortant introuvable en base de données (id: ${outgoingId}).`)
    return false
  }
  return true
}

// GET /substitutions
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { agencyId, status, vehicleId } = req.query
    const where: Record<string, unknown> = {}
    if (agencyId)  where.incomingAgencyId = agencyId
    if (status)    where.status           = status
    if (vehicleId) where.OR = [
      { incomingVehicleId: vehicleId },
      { outgoingVehicleId: vehicleId },
    ]
    const substitutions = await prisma.vehicleSubstitution.findMany({
      where,
      include: INCLUDE,
      orderBy: { effectiveDate: 'desc' },
    })
    return ok(res, substitutions)
  } catch { return serverError(res) }
})

// GET /substitutions/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const substitution = await prisma.vehicleSubstitution.findUnique({
      where: { id: req.params.id },
      include: INCLUDE,
    })
    if (!substitution) return notFound(res)
    return ok(res, substitution)
  } catch { return serverError(res) }
})

// POST /substitutions
router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = substitutionSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)

  const { incomingVehicleId, outgoingVehicleId } = parsed.data
  const valid = await validateBothVehicles(incomingVehicleId, outgoingVehicleId, res)
  if (!valid) return

  try {
    const substitution = await prisma.vehicleSubstitution.create({
      data: {
        ...(parsed.data as object),
        createdById: req.user!.userId,
      } as never,
      include: INCLUDE,
    })
    return created(res, substitution)
  } catch { return serverError(res) }
})

// PUT /substitutions/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const parsed = substitutionSchema.partial().safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)

  if (parsed.data.incomingVehicleId && parsed.data.outgoingVehicleId) {
    const valid = await validateBothVehicles(
      parsed.data.incomingVehicleId,
      parsed.data.outgoingVehicleId,
      res
    )
    if (!valid) return
  }

  try {
    const substitution = await prisma.vehicleSubstitution.update({
      where: { id: req.params.id },
      data:  parsed.data as never,
      include: INCLUDE,
    })
    return ok(res, substitution)
  } catch { return notFound(res) }
})

// DELETE /substitutions/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.vehicleSubstitution.delete({ where: { id: req.params.id } })
    return noContent(res)
  } catch { return notFound(res) }
})

export default router
