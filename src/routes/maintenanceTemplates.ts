import { Router, type Response } from 'express'
import { prisma } from '../lib/prisma'
import { requireAuth } from '../middlewares/auth'
import { ok, created, noContent, badRequest, notFound, serverError } from '../lib/response'
import type { AuthRequest } from '../types'
import { z } from 'zod'

const router = Router()
router.use(requireAuth)

// ── Schémas Zod ────────────────────────────────────────────────────

const checklistItemSchema = z.object({
  label: z.string().min(1),
  order: z.number().int().min(0),
})

const templateSchema = z.object({
  name:                 z.string().min(1),
  description:          z.string().nullable().optional(),
  type:                 z.enum(['PREVENTIVE', 'CORRECTIVE', 'REGULATORY', 'SANITAIRE']),
  triggerType:          z.enum(['TIME_ONLY', 'KM_ONLY', 'HYBRID']),
  triggerKm:            z.number().int().nullable().optional(),
  triggerDays:          z.number().int().nullable().optional(),
  estimatedCost:        z.number().nullable().optional(),
  applicableCategories: z.array(z.string()).default([]),
  isMandatory:          z.boolean().default(false),
  checklist:            z.array(checklistItemSchema).default([]),
})

const assignmentSchema = z.object({
  vehicleId:       z.string().min(1),
  templateId:      z.string().min(1),
  lastDoneDate:    z.preprocess(
    (v) => (v && typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T00:00:00.000Z` : v),
    z.string().datetime().nullable().optional()
  ),
  lastDoneMileage: z.number().int().nullable().optional(),
})

const interventionSchema = z.object({
  doneDate:    z.preprocess(
    (v) => (v && typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T00:00:00.000Z` : v),
    z.string().datetime()
  ),
  doneMileage: z.number().int().nullable().optional(),
})

// ── Helpers ────────────────────────────────────────────────────────

function computeNextDue(
  triggerDays:     number | null | undefined,
  triggerKm:       number | null | undefined,
  lastDoneDate:    string | Date | null | undefined,
  lastDoneMileage: number | null | undefined,
): { nextDueDate: Date | null; nextDueMileage: number | null } {
  let nextDueDate:    Date   | null = null
  let nextDueMileage: number | null = null

  if (triggerDays && lastDoneDate) {
    const base = new Date(lastDoneDate)
    base.setDate(base.getDate() + triggerDays)
    nextDueDate = base
  }
  if (triggerKm && lastDoneMileage != null) {
    nextDueMileage = lastDoneMileage + triggerKm
  }
  return { nextDueDate, nextDueMileage }
}

// ── GET /api/maintenance/templates ─────────────────────────────────
router.get('/templates', async (_req: AuthRequest, res: Response) => {
  try {
    const templates = await prisma.maintenanceTemplate.findMany({
      include: { checklist: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    })
    return ok(res, templates)
  } catch (e) { console.error(e); return serverError(res) }
})

// ── GET /api/maintenance/templates/:id ─────────────────────────────
router.get('/templates/:id', async (req: AuthRequest, res: Response) => {
  try {
    const template = await prisma.maintenanceTemplate.findUnique({
      where:   { id: req.params.id },
      include: { checklist: { orderBy: { order: 'asc' } } },
    })
    if (!template) return notFound(res)
    return ok(res, template)
  } catch (e) { console.error(e); return serverError(res) }
})

// ── POST /api/maintenance/templates ────────────────────────────────
router.post('/templates', async (req: AuthRequest, res: Response) => {
  const parsed = templateSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  const { checklist, ...data } = parsed.data
  try {
    const template = await prisma.maintenanceTemplate.create({
      data: {
        ...data,
        checklist: {
          create: checklist.map((item, idx) => ({ ...item, order: idx + 1 })),
        },
      },
      include: { checklist: { orderBy: { order: 'asc' } } },
    })
    return created(res, template)
  } catch (e) { console.error(e); return serverError(res) }
})

// ── PUT /api/maintenance/templates/:id ─────────────────────────────
router.put('/templates/:id', async (req: AuthRequest, res: Response) => {
  const parsed = templateSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  const { checklist, ...data } = parsed.data
  try {
    // Supprimer anciens items puis recréer
    await prisma.maintenanceChecklistItem.deleteMany({ where: { templateId: req.params.id } })
    const template = await prisma.maintenanceTemplate.update({
      where: { id: req.params.id },
      data:  {
        ...data,
        checklist: {
          create: checklist.map((item, idx) => ({ ...item, order: idx + 1 })),
        },
      },
      include: { checklist: { orderBy: { order: 'asc' } } },
    })
    return ok(res, template)
  } catch (e) { console.error(e); return serverError(res) }
})

// ── DELETE /api/maintenance/templates/:id ──────────────────────────
router.delete('/templates/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.maintenanceTemplate.delete({ where: { id: req.params.id } })
    return noContent(res)
  } catch (e) { console.error(e); return notFound(res) }
})

// ── GET /api/maintenance/assignments ───────────────────────────────
router.get('/assignments', async (req: AuthRequest, res: Response) => {
  try {
    const { vehicleId } = req.query
    const where = vehicleId ? { vehicleId: String(vehicleId) } : {}
    const assignments = await prisma.maintenanceAssignment.findMany({
      where,
      include: {
        template: { include: { checklist: { orderBy: { order: 'asc' } } } },
      },
      orderBy: { assignedAt: 'desc' },
    })
    return ok(res, assignments)
  } catch (e) { console.error(e); return serverError(res) }
})

// ── POST /api/maintenance/assignments ──────────────────────────────
router.post('/assignments', async (req: AuthRequest, res: Response) => {
  const parsed = assignmentSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  const { vehicleId, templateId, lastDoneDate, lastDoneMileage } = parsed.data
  try {
    const template = await prisma.maintenanceTemplate.findUnique({ where: { id: templateId } })
    if (!template) return badRequest(res, 'Template introuvable')

    const { nextDueDate, nextDueMileage } = computeNextDue(
      template.triggerDays, template.triggerKm, lastDoneDate, lastDoneMileage
    )
    const assignment = await prisma.maintenanceAssignment.create({
      data: { vehicleId, templateId, lastDoneDate: lastDoneDate ? new Date(lastDoneDate) : null, lastDoneMileage: lastDoneMileage ?? null, nextDueDate, nextDueMileage },
      include: { template: { include: { checklist: { orderBy: { order: 'asc' } } } } },
    })
    return created(res, assignment)
  } catch (e: any) {
    if (e.code === 'P2002') return badRequest(res, 'Ce cycle est déjà affecté à ce véhicule')
    console.error(e); return serverError(res)
  }
})

// ── DELETE /api/maintenance/assignments/:id ────────────────────────
router.delete('/assignments/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.maintenanceAssignment.delete({ where: { id: req.params.id } })
    return noContent(res)
  } catch (e) { console.error(e); return notFound(res) }
})

// ── PATCH /api/maintenance/assignments/:id/toggle ──────────────────
router.patch('/assignments/:id/toggle', async (req: AuthRequest, res: Response) => {
  try {
    const current = await prisma.maintenanceAssignment.findUnique({ where: { id: req.params.id } })
    if (!current) return notFound(res)
    const updated = await prisma.maintenanceAssignment.update({
      where: { id: req.params.id },
      data:  { isActive: !current.isActive },
      include: { template: { include: { checklist: { orderBy: { order: 'asc' } } } } },
    })
    return ok(res, updated)
  } catch (e) { console.error(e); return serverError(res) }
})

// ── POST /api/maintenance/assignments/:id/intervention ─────────────
router.post('/assignments/:id/intervention', async (req: AuthRequest, res: Response) => {
  const parsed = interventionSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  const { doneDate, doneMileage } = parsed.data
  try {
    const current = await prisma.maintenanceAssignment.findUnique({
      where:   { id: req.params.id },
      include: { template: true },
    })
    if (!current) return notFound(res)

    const { nextDueDate, nextDueMileage } = computeNextDue(
      current.template.triggerDays, current.template.triggerKm, doneDate, doneMileage
    )
    const updated = await prisma.maintenanceAssignment.update({
      where: { id: req.params.id },
      data:  {
        lastDoneDate:    new Date(doneDate),
        lastDoneMileage: doneMileage ?? null,
        nextDueDate,
        nextDueMileage,
      },
      include: { template: { include: { checklist: { orderBy: { order: 'asc' } } } } },
    })
    return ok(res, updated)
  } catch (e) { console.error(e); return serverError(res) }
})

export default router
