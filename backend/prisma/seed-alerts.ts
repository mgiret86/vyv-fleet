import { AlertCategory, AlertSeverity, AlertStatus } from '@prisma/client'
import { prisma } from '../src/lib/prisma'

function getSeverity(daysUntilExpiry: number): AlertSeverity | null {
  if (daysUntilExpiry < 0)   return 'CRITICAL'
  if (daysUntilExpiry <= 30) return 'WARNING'
  if (daysUntilExpiry <= 90) return 'INFO'
  return null
}

function daysUntil(date: Date): number {
  return Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

async function main() {
  await prisma.alert.deleteMany({
    where: { type: { in: ['ARS_EXPIRY', 'TECHNICAL_INSPECTION', 'INSURANCE', 'EQUIPMENT'] } }
  })
  console.log('Alertes existantes supprimées')

  const vehicles = await prisma.vehicle.findMany({ include: { agency: true } })
  console.log(`${vehicles.length} véhicule(s) trouvé(s)`)

  let created = 0

  for (const v of vehicles) {
    const checks = [
      { date: v.arsApprovalExpiry,         category: 'ARS'       as AlertCategory, type: 'ARS_EXPIRY',           label: 'Agrément ARS'      },
      { date: v.technicalInspectionExpiry, category: 'CT'        as AlertCategory, type: 'TECHNICAL_INSPECTION', label: 'Contrôle technique' },
      { date: v.insuranceExpiry,           category: 'ASSURANCE' as AlertCategory, type: 'INSURANCE',            label: 'Assurance'          },
    ]

    for (const check of checks) {
      if (!check.date) continue
      const days     = daysUntil(check.date)
      const severity = getSeverity(days)
      if (!severity) continue

      const expired = days < 0
      const message = expired
        ? `${check.label} expirée depuis ${Math.abs(days)} jour(s)`
        : `${check.label} expire dans ${days} jour(s)`

      await prisma.alert.create({
        data: {
          vehicleId:   v.id,
          agencyId:    v.agencyId,
          type:        check.type,
          category:    check.category,
          severity,
          status:      'OPEN' as AlertStatus,
          message,
          description: `${check.label} du véhicule ${v.registration} — échéance : ${check.date.toLocaleDateString('fr-FR')}`,
          dueDate:     check.date,
        },
      })
      created++
    }

    const equipments = await prisma.equipment.findMany({ where: { vehicleId: v.id } })
    for (const eq of equipments) {
      const dates = [
        { date: eq.nextCheckDate, label: `Contrôle ${eq.label}`    },
        { date: eq.expiryDate,    label: `Expiration ${eq.label}`  },
      ]
      for (const { date, label } of dates) {
        if (!date) continue
        const days     = daysUntil(date)
        const severity = getSeverity(days)
        if (!severity) continue

        const expired = days < 0
        const message = expired
          ? `${label} — expiré depuis ${Math.abs(days)} jour(s)`
          : `${label} — dans ${days} jour(s)`

        await prisma.alert.create({
          data: {
            vehicleId:   v.id,
            agencyId:    v.agencyId,
            type:        'EQUIPMENT',
            category:    'EQUIPEMENT' as AlertCategory,
            severity,
            status:      'OPEN' as AlertStatus,
            message,
            description: `Équipement : ${eq.label} (${eq.category}) — véhicule ${v.registration}`,
            dueDate:     date,
          },
        })
        created++
      }
    }
  }

  console.log(`${created} alerte(s) créée(s)`)
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
