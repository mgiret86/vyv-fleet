import { Router, type Response } from 'express'
import { prisma }      from '../lib/prisma'
import { requireAuth } from '../middlewares/auth'
import { ok, created, noContent, badRequest, notFound, serverError } from '../lib/response'
import type { AuthRequest } from '../types'
import { z } from 'zod'

// ─── Helper date ──────────────────────────────────────────────────
function toDate(s: string | null | undefined): Date | null {
  if (!s) return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}


const router = Router()
router.use(requireAuth)

// ─── Helper : génération des entrées mensuelles ───────────────────
function buildEntries(startDate: string, amount: number, durationMonths: number) {
  const dotation  = Math.round((amount / durationMonths) * 100) / 100
  const entries: { month: string; dotation: number; remaining: number }[] = []
  const start = new Date(startDate)

  for (let i = 0; i < durationMonths; i++) {
    const d = new Date(start)
    d.setMonth(d.getMonth() + i)
    const month     = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const remaining = Math.round((amount - dotation * (i + 1)) * 100) / 100
    entries.push({ month, dotation, remaining: Math.max(0, remaining) })
  }
  return entries
}

// ─── Schema Zod ───────────────────────────────────────────────────
const amortizationSchema = z.object({
  vehicleId:      z.string(),
  source:         z.enum(['CREDIT_BAIL', 'MAINTENANCE']),
  sourceId:       z.string(),
  reference:      z.string().min(1),
  label:          z.string().min(1),
  amount:         z.number().positive(),
  startDate:      z.string(),
  durationMonths: z.number().int().min(1).max(120),
})

// ─── GET /api/amortizations ───────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { vehicleId, status, source } = req.query
    const where: Record<string, unknown> = {}
    if (vehicleId) where.vehicleId = vehicleId
    if (status)    where.status    = status
    if (source)    where.source    = source

    const amortizations = await prisma.amortization.findMany({
      where,
      include: { vehicle: { select: { id: true, registration: true, brand: true, model: true } } },
      orderBy: { startDate: 'asc' },
    })
    return ok(res, amortizations)
  } catch (e) { console.error(e); return serverError(res) }
})

// ─── GET /api/amortizations/:id ──────────────────────────────────
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const amort = await prisma.amortization.findUnique({
      where:   { id: req.params.id },
      include: { vehicle: true },
    })
    if (!amort) return notFound(res)
    return ok(res, amort)
  } catch (e) { console.error(e); return serverError(res) }
})

// ─── POST /api/amortizations ─────────────────────────────────────
router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = amortizationSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  try {
    const { vehicleId, source, sourceId, reference, label, amount, startDate, durationMonths } = parsed.data

    // Vérification doublon CREDIT_BAIL
    if (source === 'CREDIT_BAIL') {
      const existing = await prisma.amortization.findFirst({
        where: { source: 'CREDIT_BAIL', sourceId },
      })
      if (existing) return badRequest(res, 'Un amortissement crédit-bail existe déjà pour ce contrat')
    }

    const entries = buildEntries(startDate, amount, durationMonths)

    const amort = await prisma.amortization.create({
      data: {
        vehicleId, source, sourceId, reference, label,
        amount, startDate: new Date(startDate), durationMonths,
        status:  'ACTIVE',
        entries: entries as never,
      },
      include: { vehicle: { select: { id: true, registration: true, brand: true, model: true } } },
    })
    return created(res, amort)
  } catch (e) { console.error(e); return serverError(res) }
})

// ─── PUT /api/amortizations/:id ──────────────────────────────────
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const parsed = amortizationSchema.partial().safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error.message)
  try {
    const existing = await prisma.amortization.findUnique({ where: { id: req.params.id } })
    if (!existing) return notFound(res)

    const amount         = parsed.data.amount         ?? existing.amount
    const durationMonths = parsed.data.durationMonths ?? existing.durationMonths
    const startDate      = parsed.data.startDate      ?? existing.startDate.toISOString().split('T')[0]

    // Recalcul des entrées si montant ou durée changés
    const needsRebuild = parsed.data.amount !== undefined || parsed.data.durationMonths !== undefined
    const entries      = needsRebuild ? buildEntries(startDate, amount, durationMonths) : undefined

    const updateData: Record<string, unknown> = { ...parsed.data }
    if (parsed.data.startDate) updateData.startDate = toDate(parsed.data.startDate)
    if (entries)               updateData.entries   = entries

    const amort = await prisma.amortization.update({
      where:   { id: req.params.id },
      data:    updateData as never,
      include: { vehicle: { select: { id: true, registration: true, brand: true, model: true } } },
    })
    return ok(res, amort)
  } catch (e) { console.error(e); return serverError(res) }
})

// ─── PUT /api/amortizations/:id/close ────────────────────────────
router.put('/:id/close', async (req: AuthRequest, res: Response) => {
  try {
    const amort = await prisma.amortization.update({
      where: { id: req.params.id },
      data:  { status: 'CLOSED', closedAt: new Date() },
    })
    return ok(res, amort)
  } catch (e) { console.error(e); return serverError(res) }
})

// ─── DELETE /api/amortizations/:id ───────────────────────────────
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.amortization.delete({ where: { id: req.params.id } })
    return noContent(res)
  } catch (e) { console.error(e); return serverError(res) }
})

export default router
