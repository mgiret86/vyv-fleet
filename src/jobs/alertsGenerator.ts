import { prisma } from '../lib/prisma'

const THRESHOLDS = [
  { days: 30, severity: 'WARNING'  },
  { days: 15, severity: 'CRITICAL' },
]

const VEHICLE_DATE_FIELDS: { field: string; category: string; label: string }[] = [
  { field: 'technicalInspectionExpiry', category: 'CT',        label: 'Controle technique' },
  { field: 'insuranceExpiry',           category: 'ASSURANCE', label: 'Assurance'          },
  { field: 'arsApprovalExpiry',         category: 'ARS',       label: 'Agrement ARS'       },
]

const DRIVER_DATE_FIELDS: { field: string; category: string; label: string }[] = [
  { field: 'licenseExpiry',            category: 'ARS', label: 'Permis de conduire'     },
  { field: 'deaExpiry',               category: 'ARS', label: 'Habilitation DEA'        },
  { field: 'fspExpiry',               category: 'ARS', label: 'Formation FSP'           },
  { field: 'medicalCertificateExpiry', category: 'ARS', label: 'Certificat medical'     },
  { field: 'medicalExamExpiry',        category: 'ARS', label: 'Visite medicale'         },
  { field: 'nextTrainingDate',         category: 'ARS', label: 'Formation continue'      },
]

function daysUntil(date: Date): number {
  const now = new Date()
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function getSeverity(days: number): string | null {
  let severity: string | null = null
  for (const t of THRESHOLDS) {
    if (days <= t.days) severity = t.severity
  }
  return severity
}

export async function generateExpiryAlerts() {
  console.log('[AlertsGenerator] Demarrage de la generation des alertes...')
  let created = 0
  let skipped = 0

  // ── Alertes véhicules ─────────────────────────────────────────
  const vehicles = await (prisma as any).vehicle.findMany({
    where:   { status: { not: 'SOLD' } },
    include: { alerts: { where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } } },
  })

  for (const vehicle of vehicles) {
    for (const { field, category, label } of VEHICLE_DATE_FIELDS) {
      const expiryDate: Date | null = vehicle[field]
      if (!expiryDate) continue

      const days     = daysUntil(expiryDate)
      const severity = getSeverity(days)
      if (!severity) continue

      const alreadyExists = vehicle.alerts.some(
        (a: any) => a.category === category && a.vehicleId === vehicle.id && !a.driverId
      )
      if (alreadyExists) { skipped++; continue }

      const message = days <= 0
        ? `${label} expiree depuis ${Math.abs(days)} jour(s) (${vehicle.registration})`
        : `${label} expire dans ${days} jour(s) (${vehicle.registration})`
      const description = days <= 0
        ? `Le document "${label}" du vehicule ${vehicle.registration} a expire le ${expiryDate.toLocaleDateString('fr-FR')}. Veuillez regulariser la situation.`
        : `Le document "${label}" du vehicule ${vehicle.registration} expire le ${expiryDate.toLocaleDateString('fr-FR')}. Renouvelement a prevoir.`

      await (prisma as any).alert.create({
        data: { vehicleId: vehicle.id, agencyId: vehicle.agencyId, type: label, category, severity, status: 'OPEN', message, description, dueDate: expiryDate },
      })
      created++
    }
  }

  // ── Alertes conducteurs ───────────────────────────────────────
  const drivers = await (prisma as any).driver.findMany({
    where:   { deletedAt: null, status: { not: 'INACTIVE' } },
    include: { alerts: { where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } } },
  })

  for (const driver of drivers) {
    const fullName = `${driver.firstName} ${driver.lastName}`

    for (const { field, category, label } of DRIVER_DATE_FIELDS) {
      const expiryDate: Date | null = driver[field]
      if (!expiryDate) continue

      const days     = daysUntil(expiryDate)
      const severity = getSeverity(days)
      if (!severity) continue

      const alreadyExists = driver.alerts.some(
        (a: any) => a.type === label && a.driverId === driver.id
      )
      if (alreadyExists) { skipped++; continue }

      const message = days <= 0
        ? `${label} expire depuis ${Math.abs(days)} jour(s) (${fullName})`
        : `${label} expire dans ${days} jour(s) (${fullName})`
      const description = days <= 0
        ? `Le document "${label}" du conducteur ${fullName} a expire le ${expiryDate.toLocaleDateString('fr-FR')}. Veuillez regulariser la situation.`
        : `Le document "${label}" du conducteur ${fullName} expire le ${expiryDate.toLocaleDateString('fr-FR')}. Renouvelement a prevoir.`

      await (prisma as any).alert.create({
        data: { driverId: driver.id, agencyId: driver.agencyId, type: label, category, severity, status: 'OPEN', message, description, dueDate: expiryDate },
      })
      created++
    }
  }

  console.log(`[AlertsGenerator] Termine : ${created} alertes creees, ${skipped} ignorees.`)
  return { created, skipped }
}

export function scheduleAlertGeneration() {
  generateExpiryAlerts().catch(console.error)

  setInterval(() => {
    const now = new Date()
    if (now.getHours() === 0 && now.getMinutes() < 5) {
      generateExpiryAlerts().catch(console.error)
    }
  }, 5 * 60 * 1000)
}
