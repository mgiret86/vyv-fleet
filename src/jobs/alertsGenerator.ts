import { prisma } from '../lib/prisma'

const THRESHOLDS = [
  { days: 30, severity: 'WARNING' },
  { days: 15, severity: 'CRITICAL' },
]

const DATE_FIELDS: { field: string; category: string; label: string }[] = [
  { field: 'technicalInspectionExpiry', category: 'CT',        label: 'Controle technique' },
  { field: 'insuranceExpiry',           category: 'ASSURANCE', label: 'Assurance'          },
  { field: 'arsApprovalExpiry',         category: 'ARS',       label: 'Agrement ARS'       },
]

export async function generateExpiryAlerts() {
  console.log('[AlertsGenerator] Demarrage de la generation des alertes...')
  const now = new Date()
  let created = 0
  let skipped = 0

  const vehicles = await (prisma as any).vehicle.findMany({
    where: { status: { not: 'SOLD' } },
    include: { alerts: { where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } } },
  })

  for (const vehicle of vehicles) {
    for (const { field, category, label } of DATE_FIELDS) {
      const expiryDate: Date | null = vehicle[field]
      if (!expiryDate) continue

      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      let severity: string | null = null
      for (const threshold of THRESHOLDS) {
        if (daysUntilExpiry <= threshold.days) {
          severity = threshold.severity
        }
      }
      if (!severity) continue

      const alreadyExists = vehicle.alerts.some(
        (a: any) => a.category === category && a.vehicleId === vehicle.id
      )
      if (alreadyExists) {
        skipped++
        continue
      }

      const message = daysUntilExpiry <= 0
        ? `${label} expiree depuis ${Math.abs(daysUntilExpiry)} jour(s) (${vehicle.registration})`
        : `${label} expire dans ${daysUntilExpiry} jour(s) (${vehicle.registration})`

      const description = daysUntilExpiry <= 0
        ? `Le document "${label}" du vehicule ${vehicle.registration} a expire le ${expiryDate.toLocaleDateString('fr-FR')}. Veuillez regulariser la situation.`
        : `Le document "${label}" du vehicule ${vehicle.registration} expire le ${expiryDate.toLocaleDateString('fr-FR')}. Renouvelement a prevoir.`

      await (prisma as any).alert.create({
        data: {
          vehicleId:   vehicle.id,
          agencyId:    vehicle.agencyId,
          type:        label,
          category,
          severity,
          status:      'OPEN',
          message,
          description,
          dueDate:     expiryDate,
        },
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
