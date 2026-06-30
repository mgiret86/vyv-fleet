import { Router, type Response } from 'express'
import { prisma }      from '../lib/prisma'
import { requireAuth } from '../middlewares/auth'
import { ok, serverError } from '../lib/response'
import type { AuthRequest } from '../types'

const router = Router()
router.use(requireAuth)

// ─── Helper : recalcul TCO d'un véhicule ─────────────────────────
export async function recomputeTCO(vehicleId: string) {
  const twelveMonthsAgo = new Date(Date.now() - 365 * 86400000)

  const vehicle = await prisma.vehicle.findUnique({
    where:   { id: vehicleId },
    include: {
      contracts:   { where: { isActive: true, status: 'ACTIVE' }, take: 1 },
      fuelEntries: {
        where:   { date: { gte: twelveMonthsAgo } },
        orderBy: { date: 'desc' },
        select:  { totalCost: true, date: true },
      },
      maintenances: {
        where:  { status: 'COMPLETED', completedDate: { gte: twelveMonthsAgo } },
        select: { realCost: true, estimatedCost: true },
      },
      amortizations: {
        where:  { status: 'ACTIVE' },
        select: { amount: true, durationMonths: true },
      },
    },
  })
  if (!vehicle) return null

  const activeContract = vehicle.contracts[0]

  // Loyer mensuel HT (contrat actif, hors assurance pour éviter le double compte)
  const monthlyLease = activeContract ? activeContract.monthlyRentHT : 0

  // Assurance mensuelle (contrat actif)
  const monthlyInsurance = activeContract?.monthlyInsuranceCost ?? 0

  // Carburant : total 12 derniers mois / 12 (moyenne mensuelle réelle)
  const totalFuel12m = vehicle.fuelEntries.reduce((s, f: any) => s + (f.totalCost ?? 0), 0)
  const monthlyFuel  = Math.round((totalFuel12m / 12) * 100) / 100

  // Maintenance : total 12 derniers mois / 12 (moyenne mensuelle réelle)
  const totalMaint12m = vehicle.maintenances.reduce((s: number, m: any) => {
    return s + (m.realCost ?? m.estimatedCost ?? 0)
  }, 0)
  const monthlyMaintenance = Math.round((totalMaint12m / 12) * 100) / 100

  // Amortissements actifs : somme des mensualités (amount / durationMonths)
  const monthlyOther = Math.round(
    vehicle.amortizations.reduce((s: number, a: any) => {
      return s + (a.durationMonths > 0 ? a.amount / a.durationMonths : 0)
    }, 0) * 100
  ) / 100

  const totalMonthlyCost = monthlyLease + monthlyFuel + monthlyMaintenance + monthlyOther
  const annualCost       = totalMonthlyCost * 12
  const costPerKm        = vehicle.mileage > 0 ? totalMonthlyCost / Math.max(1, vehicle.mileage / 12) : 0

  return {
    vehicleId,
    agencyId:           vehicle.agencyId,
    monthlyLease,
    monthlyFuel:        Math.round(monthlyFuel * 100) / 100,
    monthlyMaintenance: Math.round(monthlyMaintenance * 100) / 100,
    monthlyInsurance,
    monthlyOther,
    totalMonthlyCost:   Math.round(totalMonthlyCost * 100) / 100,
    annualCost:         Math.round(annualCost * 100) / 100,
    costPerKm:          Math.round(costPerKm * 100) / 100,
    mileage:            vehicle.mileage,
  }
}

// ─── GET /api/tco ─────────────────────────────────────────────────
// Retourne les TCO stockés (mis à jour par les jobs ou à la demande)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { agencyId, categoryId } = req.query

    // ── Véhicules actifs ce mois-ci ────────────────────────────────
    // Un véhicule est "actif" s'il a : un plein, une maintenance COMPLETED,
    // ou un contrat actif au cours du mois en cours.
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const activeVehicleIds = await prisma.vehicle.findMany({
      where: {
        deletedAt: null,
        ...(agencyId  ? { agencyId:  agencyId  as string } : {}),
        ...(categoryId ? { categoryId: categoryId as string } : {}),
        OR: [
          { fuelEntries:  { some: { date:          { gte: startOfMonth } } } },
          { maintenances: { some: { status: 'COMPLETED', completedDate: { gte: startOfMonth } } } },
          { contracts:    { some: { isActive: true, status: 'ACTIVE' } } },
        ],
      },
      select: { id: true },
    })

    const ids = activeVehicleIds.map((v) => v.id)

    const entries = await prisma.tCOEntry.findMany({
      where:   { vehicleId: { in: ids } },
      include: {
        vehicle: {
          select: { id: true, registration: true, brand: true, model: true, mileage: true,
                    agency:   { select: { id: true, name: true } },
                    category: { select: { id: true, name: true } } }
        },
      },
      orderBy: { totalMonthlyCost: 'desc' },
    })
    return ok(res, entries)
  } catch (e) { console.error(e); return serverError(res) }
})

// ─── GET /api/tco/:vehicleId ──────────────────────────────────────
router.get('/:vehicleId', async (req: AuthRequest, res: Response) => {
  try {
    const entry = await prisma.tCOEntry.findUnique({
      where:   { vehicleId: req.params.vehicleId },
      include: { vehicle: { select: { id: true, registration: true, brand: true, model: true } } },
    })
    return ok(res, entry)
  } catch (e) { console.error(e); return serverError(res) }
})

// ─── POST /api/tco/compute/:vehicleId ────────────────────────────
// Recalcule et upsert le TCO d'un véhicule
router.post('/compute/:vehicleId', async (req: AuthRequest, res: Response) => {
  try {
    const data = await recomputeTCO(req.params.vehicleId)
    if (!data) return ok(res, null)

    const entry = await prisma.tCOEntry.upsert({
      where:  { vehicleId: req.params.vehicleId },
      create: data,
      update: data,
      include: {
        vehicle: { select: { id: true, registration: true, brand: true, model: true } }
      },
    })
    return ok(res, entry)
  } catch (e) { console.error(e); return serverError(res) }
})

// ─── POST /api/tco/compute-all ────────────────────────────────────
// Recalcule le TCO de toute la flotte (à déclencher manuellement ou via job)
router.post('/compute-all', async (req: AuthRequest, res: Response) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where:  { deletedAt: null },
      select: { id: true },
    })

    let updated = 0
    for (const v of vehicles) {
      const data = await recomputeTCO(v.id)
      if (!data) continue
      await prisma.tCOEntry.upsert({
        where:  { vehicleId: v.id },
        create: data,
        update: data,
      })
      updated++
    }
    return ok(res, { updated, total: vehicles.length })
  } catch (e) { console.error(e); return serverError(res) }
})

export default router
