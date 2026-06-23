import type { Amortization } from '@/types'

// ─── Helper : génère les entrées mensuelles ───────────────────────
export function buildAmortizationEntries(
  startDate:      string,
  amount:         number,
  durationMonths: number,
): import('@/types').AmortizationEntry[] {
  const dotation = Math.round((amount / durationMonths) * 100) / 100
  const entries  = []
  let   cumul    = 0

  for (let i = 0; i < durationMonths; i++) {
    const d = new Date(startDate)
    d.setMonth(d.getMonth() + i)
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

    // Dernière mensualité : ajustement pour éviter les erreurs d'arrondi
    const isLast      = i === durationMonths - 1
    const thisDotation = isLast ? Math.round((amount - cumul) * 100) / 100 : dotation

    cumul += thisDotation
    entries.push({
      month,
      dotation:  thisDotation,
      cumul:     Math.round(cumul * 100) / 100,
      remaining: Math.round((amount - cumul) * 100) / 100,
    })
  }

  return entries
}

// ─── Mocks ────────────────────────────────────────────────────────
export const MOCK_AMORTIZATIONS: Amortization[] = [
  {
    id:             'amort-001',
    vehicleId:      'vehicle-001',
    source:         'CREDIT_BAIL',
    sourceId:       'contract-001',
    reference:      'AMORT-CB-2024-001',
    label:          'Valeur résiduelle — Crédit-bail Mercedes Sprinter',
    amount:         8500,
    startDate:      '2024-04-01',
    durationMonths: 12,
    status:         'ACTIVE',
    closedAt:       null,
    entries:        buildAmortizationEntries('2024-04-01', 8500, 12),
    createdAt:      '2024-04-01T00:00:00.000Z',
    updatedAt:      '2024-04-01T00:00:00.000Z',
  },
  {
    id:             'amort-002',
    vehicleId:      'vehicle-002',
    source:         'MAINTENANCE',
    sourceId:       'maintenance-001',
    reference:      'AMORT-MAINT-2024-001',
    label:          'Remplacement boîte de vitesses — Renault Master',
    amount:         3200,
    startDate:      '2024-06-01',
    durationMonths: 24,
    status:         'ACTIVE',
    closedAt:       null,
    entries:        buildAmortizationEntries('2024-06-01', 3200, 24),
    createdAt:      '2024-06-01T00:00:00.000Z',
    updatedAt:      '2024-06-01T00:00:00.000Z',
  },
]
