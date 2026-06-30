import { Router, type Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middlewares/auth'
import { ok, created, noContent, badRequest, notFound, serverError } from '../lib/response'
import type { AuthRequest } from '../types'
import { z } from 'zod'

const router = Router()
router.use(requireAuth)

// Normalise une date partielle "YYYY-MM-DD" en ISO complet "YYYY-MM-DDT00:00:00.000Z"
const flexDate = (required = true) => {
  const base = z.preprocess(
    (v) => {
      if (!v) return v
      if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return `${v}T00:00:00.000Z`
      return v
    },
    z.string().datetime()
  )
  return required ? base : base.nullable().optional()
}

const vehicleSchema = z.object({
  registration:              z.string().transform((v) => v.toUpperCase().replace(/\s/g, '')),
  brand:                     z.string().min(2),
  model:                     z.string().min(2),
  categoryId:                z.string().min(1),
  energy:                    z.enum(["DIESEL","HYBRID","ELECTRIC","GASOLINE"]),
  agencyId:                  z.string().cuid(),
  mileage:                   z.number().int().min(0),
  monthlyLeaseCost:          z.number().nullable().optional(),
  arsApprovalExpiry:         flexDate(false),
  insuranceExpiry:           flexDate(),
  technicalInspectionExpiry: flexDate(),
  nextMaintenanceDate:       flexDate(false),
  firstRegistrationDate:     flexDate(false),
  entryDate:                 flexDate(false),
  exitDate:                  flexDate(false),
  taxiMeterControlExpiry:    flexDate(false),
  color:                     z.string().nullable().optional(),
  vin:                       z.string().nullable().optional(),
  nationalGenre:             z.string().nullable().optional(),
  co2Emission:               z.number().nullable().optional(),
  seatingCapacity:           z.number().int().nullable().optional(),
  imeiPda:                   z.string().nullable().optional(),
  imeiTelematics:            z.string().nullable().optional(),
})

// GET /api/vehicles
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { agencyId, status, categoryId, registration } = req.query
    const where: Record<string, unknown> = { deletedAt: null }
    if (agencyId)    where.agencyId    = agencyId
    if (status)      where.status      = status
    if (categoryId)  where.categoryId  = categoryId
    if (registration) where.registration = (registration as string).toUpperCase().replace(/\s/g, '')

    const vehicles = await prisma.vehicle.findMany({
      where,
      include: {
        agency:   true,
        category: true,
        alerts:   { where: { status: "OPEN" } },
      },
      orderBy: { createdAt: "desc" },
    })
    return ok(res, vehicles)
  } catch (e) { console.error(e); return serverError(res) }
})

// GET /api/vehicles/:id
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const vehicle = await prisma.vehicle.findFirst({
      where:   { id: req.params.id, deletedAt: null },
      include: {
        agency:       true,
        category:     true,
        maintenances: { orderBy: { scheduledDate: "desc" }, take: 5 },
        incidents:    { orderBy: { date: "desc" }, take: 5 },
        equipment:    true,
        fuelEntries:  { orderBy: { date: "desc" }, take: 10 },
        alerts:       { where: { status: "OPEN" } },
        tco:          true,
      },
    })
    if (!vehicle) return notFound(res)
    return ok(res, vehicle)
  } catch (e) { console.error(e); return serverError(res) }
})

// POST /api/vehicles
router.post("/", async (req: AuthRequest, res: Response) => {
  const parsed = vehicleSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  try {
    const { categoryId, agencyId, ...rest } = parsed.data as any
    const vehicle = await prisma.vehicle.create({
      data: {
        ...rest,
        category: { connect: { id: categoryId } },
        agency:   { connect: { id: agencyId } },
      },
    })
    return created(res, vehicle)
  } catch (e) { console.error(e); return serverError(res) }
})

// PUT /api/vehicles/:id
router.put("/:id", async (req: AuthRequest, res: Response) => {
  const parsed = vehicleSchema.partial().safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  try {
    const { categoryId, agencyId, ...rest } = parsed.data as any
    const data: any = { ...rest }
    if (categoryId) data.category = { connect: { id: categoryId } }
    if (agencyId)   data.agency   = { connect: { id: agencyId } }
    const vehicle = await prisma.vehicle.update({
      where: { id: req.params.id },
      data,
    })
    return ok(res, vehicle)
  } catch (e) { console.error(e); return notFound(res) }
})

// DELETE /api/vehicles/:id (soft delete)
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    await prisma.vehicle.update({
      where: { id: req.params.id },
      data:  { deletedAt: new Date() },
    })
    return noContent(res)
  } catch (e) { console.error(e); return notFound(res) }
})

export default router
